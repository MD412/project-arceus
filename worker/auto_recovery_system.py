#!/usr/bin/env python3
"""
Automatic Job Recovery System
Monitors and automatically fixes stuck jobs without manual intervention
"""

import time
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from dataclasses import dataclass
from pathlib import Path

from config import get_supabase_client

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class StuckJobMetrics:
    job_id: str
    status: str
    minutes_stuck: float
    minutes_past_timeout: float
    retry_count: int
    scan_upload_id: str
    created_at: str

class AutoRecoverySystem:
    def __init__(self):
        self.supabase_client = get_supabase_client()
        self.recovery_history = []
        self.last_check = datetime.now(timezone.utc)
        
        # Configuration
        self.STUCK_JOB_TIMEOUT_MINUTES = 10
        self.VISIBILITY_TIMEOUT_GRACE_MINUTES = 2
        self.MAX_AUTO_RETRIES = 3
        self.CHECK_INTERVAL_SECONDS = 30
        
    def analyze_stuck_jobs(self) -> List[StuckJobMetrics]:
        """Identify jobs that are stuck and need recovery"""
        try:
            # Query for potentially stuck jobs
            response = self.supabase_client.rpc('get_stuck_jobs', {
                'stuck_minutes': self.STUCK_JOB_TIMEOUT_MINUTES,
                'timeout_grace_minutes': self.VISIBILITY_TIMEOUT_GRACE_MINUTES
            }).execute()
            
            stuck_jobs = []
            if response.data:
                for job in response.data:
                    stuck_jobs.append(StuckJobMetrics(
                        job_id=job['id'],
                        status=job['status'],
                        minutes_stuck=job['minutes_stuck'],
                        minutes_past_timeout=job['minutes_past_timeout'],
                        retry_count=job.get('retry_count', 0),
                        scan_upload_id=job['scan_upload_id'],
                        created_at=job['created_at']
                    ))
            
            return stuck_jobs
            
        except Exception as e:
            logger.error(f"Failed to analyze stuck jobs: {e}")
            return []
    
    def recover_stuck_job(self, job_metrics: StuckJobMetrics) -> bool:
        """Automatically recover a single stuck job"""
        try:
            # Check if job has exceeded retry limit
            if job_metrics.retry_count >= self.MAX_AUTO_RETRIES:
                logger.warning(f"Job {job_metrics.job_id} exceeded retry limit ({self.MAX_AUTO_RETRIES}), marking as failed")
                return self._mark_job_failed(job_metrics, "Exceeded auto-retry limit")
            
            # Reset job to pending with incremented retry count
            logger.info(f"🔄 Auto-recovering stuck job {job_metrics.job_id} (retry {job_metrics.retry_count + 1})")
            
            update_data = {
                "status": "pending",
                "started_at": None,
                "visibility_timeout_at": None,
                "retry_count": job_metrics.retry_count + 1,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            response = self.supabase_client.from_("job_queue").update(update_data).eq("id", job_metrics.job_id).execute()
            
            if response.data:
                # Also reset scan upload status
                self.supabase_client.from_("scan_uploads").update({
                    "processing_status": "queued",
                    "error_message": None,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }).eq("id", job_metrics.scan_upload_id).execute()
                
                # Log recovery action
                self._log_recovery_action(job_metrics, "auto_recovered")
                return True
            
        except Exception as e:
            logger.error(f"Failed to recover job {job_metrics.job_id}: {e}")
            
        return False
    
    def _mark_job_failed(self, job_metrics: StuckJobMetrics, reason: str) -> bool:
        """Mark a job as permanently failed"""
        try:
            # Update job status
            self.supabase_client.from_("job_queue").update({
                "status": "failed",
                "finished_at": datetime.now(timezone.utc).isoformat(),
                "error_message": reason
            }).eq("id", job_metrics.job_id).execute()
            
            # Update scan upload status
            self.supabase_client.from_("scan_uploads").update({
                "processing_status": "failed",
                "error_message": reason,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }).eq("id", job_metrics.scan_upload_id).execute()
            
            self._log_recovery_action(job_metrics, "marked_failed", reason)
            return True
            
        except Exception as e:
            logger.error(f"Failed to mark job {job_metrics.job_id} as failed: {e}")
            return False
    
    def _log_recovery_action(self, job_metrics: StuckJobMetrics, action: str, details: str = ""):
        """Log recovery actions for analysis"""
        recovery_record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "job_id": job_metrics.job_id,
            "action": action,
            "minutes_stuck": job_metrics.minutes_stuck,
            "retry_count": job_metrics.retry_count,
            "details": details
        }
        
        self.recovery_history.append(recovery_record)
        
        # Also log to database for analysis
        try:
            self.supabase_client.from_("worker_logs").insert({
                "message": f"Auto-recovery: {action} for job {job_metrics.job_id}",
                "payload": recovery_record
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to log recovery action to database: {e}")
    
    def check_worker_health(self) -> Dict:
        """Check overall worker health and job queue status"""
        try:
            # Get worker health status
            health_response = self.supabase_client.from_("worker_health").select("*").execute()
            
            # Get job queue statistics
            stats_response = self.supabase_client.from_("job_queue").select("status").execute()
            
            job_stats = {}
            if stats_response.data:
                for job in stats_response.data:
                    status = job['status']
                    job_stats[status] = job_stats.get(status, 0) + 1
            
            health_data = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "worker_last_ping": health_response.data[0]['last_heartbeat'] if health_response.data else None,
                "job_stats": job_stats,
                "recovery_actions_today": len([r for r in self.recovery_history 
                                             if datetime.fromisoformat(r['timestamp']).date() == datetime.now().date()])
            }
            
            return health_data
            
        except Exception as e:
            logger.error(f"Failed to check worker health: {e}")
            return {"error": str(e)}
    
    def run_recovery_cycle(self) -> Dict:
        """Run a single recovery cycle"""
        cycle_start = time.time()
        results = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "stuck_jobs_found": 0,
            "jobs_recovered": 0,
            "jobs_failed": 0,
            "errors": []
        }
        
        try:
            # Find stuck jobs
            stuck_jobs = self.analyze_stuck_jobs()
            results["stuck_jobs_found"] = len(stuck_jobs)
            
            if stuck_jobs:
                logger.info(f"🚨 Found {len(stuck_jobs)} stuck jobs, initiating auto-recovery...")
                
                for job_metrics in stuck_jobs:
                    if self.recover_stuck_job(job_metrics):
                        results["jobs_recovered"] += 1
                    else:
                        results["jobs_failed"] += 1
            
            # Check overall health
            health_data = self.check_worker_health()
            results["health"] = health_data
            
        except Exception as e:
            error_msg = f"Recovery cycle failed: {e}"
            logger.error(error_msg)
            results["errors"].append(error_msg)
        
        results["cycle_duration_ms"] = int((time.time() - cycle_start) * 1000)
        return results
    
    def start_monitoring(self):
        """Start continuous monitoring and auto-recovery"""
        logger.info("🤖 Starting Auto-Recovery System...")
        logger.info(f"⏱️ Check interval: {self.CHECK_INTERVAL_SECONDS}s")
        logger.info(f"🔄 Stuck job timeout: {self.STUCK_JOB_TIMEOUT_MINUTES} minutes")
        logger.info(f"🔁 Max auto-retries: {self.MAX_AUTO_RETRIES}")
        
        while True:
            try:
                results = self.run_recovery_cycle()
                
                if results["stuck_jobs_found"] > 0:
                    logger.info(f"✅ Recovery cycle: {results['jobs_recovered']} recovered, {results['jobs_failed']} failed")
                
                time.sleep(self.CHECK_INTERVAL_SECONDS)
                
            except KeyboardInterrupt:
                logger.info("🛑 Auto-recovery system stopped")
                break
            except Exception as e:
                logger.error(f"💥 Unexpected error in monitoring loop: {e}")
                time.sleep(self.CHECK_INTERVAL_SECONDS)

def create_stuck_jobs_rpc_function():
    """Create the RPC function for finding stuck jobs"""
    rpc_sql = """
    CREATE OR REPLACE FUNCTION get_stuck_jobs(
        stuck_minutes INTEGER DEFAULT 10,
        timeout_grace_minutes INTEGER DEFAULT 2
    )
    RETURNS TABLE (
        id UUID,
        status TEXT,
        scan_upload_id UUID,
        created_at TIMESTAMPTZ,
        started_at TIMESTAMPTZ,
        visibility_timeout_at TIMESTAMPTZ,
        retry_count INTEGER,
        minutes_stuck NUMERIC,
        minutes_past_timeout NUMERIC
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
        RETURN QUERY
        SELECT 
            jq.id,
            jq.status,
            jq.scan_upload_id,
            jq.created_at,
            jq.started_at,
            jq.visibility_timeout_at,
            COALESCE(jq.retry_count, 0) as retry_count,
            EXTRACT(EPOCH FROM (NOW() - jq.started_at))/60 as minutes_stuck,
            CASE 
                WHEN jq.visibility_timeout_at IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (NOW() - jq.visibility_timeout_at))/60
                ELSE 0
            END as minutes_past_timeout
        FROM job_queue jq
        WHERE jq.status = 'processing'
          AND (
            jq.visibility_timeout_at < NOW() - INTERVAL '1 minute' * timeout_grace_minutes
            OR jq.started_at < NOW() - INTERVAL '1 minute' * stuck_minutes
          )
        ORDER BY jq.started_at;
    END;
    $$;
    """
    
    print("📝 RPC Function for stuck job detection:")
    print(rpc_sql)
    return rpc_sql

if __name__ == "__main__":
    # Create and start the auto-recovery system
    recovery_system = AutoRecoverySystem()
    
    print("🔧 Auto-Recovery System Ready!")
    print("💡 To create the required RPC function, run:")
    print(create_stuck_jobs_rpc_function())
    print("\n🚀 Starting monitoring...")
    
    recovery_system.start_monitoring() 