#!/usr/bin/env python3
"""
Production worker for Project Arceus - Simplified for cloud deployment
Polls job_queue and marks jobs as completed without ML processing
"""

import os
import time
import logging
from typing import Optional, Dict, Any
from config import supabase_client

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

POLL_INTERVAL = 5  # seconds between empty-queue checks

def get_next_job() -> Optional[Dict[str, Any]]:
    """
    Get the next pending job from the queue.
    Returns job data or None if no jobs available.
    """
    try:
        # Get pending jobs ordered by creation time
        response = supabase_client.table('job_queue').select('*').eq('status', 'pending').order('created_at').limit(1).execute()
        
        if not response.data:
            return None
            
        job = response.data[0]
        
        # Mark as processing
        supabase_client.table('job_queue').update({
            'status': 'processing',
            'started_at': 'now()'
        }).eq('id', job['id']).execute()
        
        return job
        
    except Exception as e:
        logger.error(f"Error getting next job: {e}")
        return None

def mark_job_completed(job_id: str, status: str = 'completed') -> bool:
    """
    Mark a job as completed or failed.
    """
    try:
        supabase_client.table('job_queue').update({
            'status': status,
            'finished_at': 'now()'
        }).eq('id', job_id).execute()
        
        return True
        
    except Exception as e:
        logger.error(f"Error marking job {job_id} as {status}: {e}")
        return False

def process_job(job: Dict[str, Any]) -> bool:
    """
    Process a single job - simplified version without ML.
    Just simulates work and marks as completed.
    """
    job_id = job['id']
    upload_id = job['binder_page_upload_id']
    
    logger.info(f"⚙️  Processing job {job_id} → upload {upload_id}")
    
    try:
        # Simulate work (replace with actual processing later)
        time.sleep(2)
        
        # Mark upload as completed
        supabase_client.table('binder_page_uploads').update({
            'processing_status': 'completed',
            'updated_at': 'now()'
        }).eq('id', upload_id).execute()
        
        logger.info(f"✅ Job {job_id} completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"🔥 Job {job_id} failed: {e}")
        
        # Mark upload as failed
        try:
            supabase_client.table('binder_page_uploads').update({
                'processing_status': 'failed',
                'updated_at': 'now()'
            }).eq('id', upload_id).execute()
        except Exception as update_error:
            logger.error(f"Failed to update upload status: {update_error}")
        
        return False

def main():
    """
    Main worker loop - polls for jobs and processes them.
    """
    logger.info("🐍 Production worker online. Polling for jobs…")
    
    while True:
        try:
            job = get_next_job()
            
            if not job:
                time.sleep(POLL_INTERVAL)
                continue
                
            success = process_job(job)
            status = 'completed' if success else 'failed'
            mark_job_completed(job['id'], status)
            
        except KeyboardInterrupt:
            logger.info("👋 Worker shutting down...")
            break
        except Exception as e:
            logger.error(f"Unexpected error in main loop: {e}")
            time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main() 