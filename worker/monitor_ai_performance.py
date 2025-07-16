#!/usr/bin/env python3
"""
Premium AI Vision Performance Monitor
Tracks accuracy, costs, and business metrics for HybridCardIdentifierV2
"""
import time
import json
from datetime import datetime, date, timedelta
from typing import Dict, List
from config import get_supabase_client
import glob
import os

class AIPerformanceMonitor:
    def __init__(self):
        self.supabase_client = get_supabase_client()
        
    def get_daily_cost_summary(self) -> Dict:
        """Get GPT-4o Mini cost summary for today"""
        today = date.today().isoformat()
        cost_file = f"gpt4_costs_{today}.json"
        
        if os.path.exists(cost_file):
            try:
                with open(cost_file, 'r') as f:
                    data = json.load(f)
                    return {
                        'date': today,
                        'total_cost': data.get('total_cost', 0.0),
                        'request_count': len(data.get('requests', [])),
                        'avg_cost_per_request': data.get('total_cost', 0.0) / max(len(data.get('requests', [])), 1),
                        'budget_remaining': 0.10 - data.get('total_cost', 0.0),
                        'budget_used_pct': (data.get('total_cost', 0.0) / 0.10) * 100
                    }
            except:
                pass
        
        return {
            'date': today,
            'total_cost': 0.0,
            'request_count': 0,
            'avg_cost_per_request': 0.0,
            'budget_remaining': 0.10,
            'budget_used_pct': 0.0
        }
    
    def get_detection_stats(self, hours: int = 24) -> Dict:
        """Get card detection performance stats from database"""
        try:
            # Get recent detections with AI vision data
            since_time = (datetime.now() - timedelta(hours=hours)).isoformat()
            
            response = self.supabase_client.from_('card_detections').select(
                'identification_method, identification_cost, identification_confidence, is_blank, guess_card_id'
            ).gte('created_at', since_time).execute()
            
            detections = response.data
            total_detections = len(detections)
            
            if total_detections == 0:
                return {'total_detections': 0, 'error': 'No recent detections found'}
            
            # Calculate method breakdown
            method_counts = {}
            total_cost = 0.0
            successful_ids = 0
            confidence_sum = 0.0
            confidence_count = 0
            
            for det in detections:
                method = det.get('identification_method', 'unknown')
                method_counts[method] = method_counts.get(method, 0) + 1
                
                cost = det.get('identification_cost', 0.0)
                if cost:
                    total_cost += float(cost)
                
                if det.get('guess_card_id'):
                    successful_ids += 1
                
                confidence = det.get('identification_confidence')
                if confidence and confidence > 0:
                    confidence_sum += float(confidence)
                    confidence_count += 1
            
            success_rate = (successful_ids / total_detections) * 100
            avg_confidence = confidence_sum / confidence_count if confidence_count > 0 else 0
            
            return {
                'total_detections': total_detections,
                'success_rate': success_rate,
                'avg_confidence': avg_confidence,
                'total_cost': total_cost,
                'avg_cost_per_detection': total_cost / total_detections,
                'method_breakdown': method_counts,
                'successful_identifications': successful_ids,
                'hours_analyzed': hours
            }
            
        except Exception as e:
            return {'error': f'Database query failed: {e}'}
    
    def get_business_metrics(self) -> Dict:
        """Calculate business performance metrics"""
        detection_stats = self.get_detection_stats(24)
        cost_stats = self.get_daily_cost_summary()
        
        if detection_stats.get('error'):
            return detection_stats
        
        # Calculate revenue potential
        detections_today = detection_stats['total_detections']
        premium_pricing = 0.15  # $0.15 per card processed
        
        potential_revenue = detections_today * premium_pricing
        actual_cost = detection_stats.get('total_cost', 0.0)
        gross_margin = ((potential_revenue - actual_cost) / potential_revenue * 100) if potential_revenue > 0 else 0
        
        return {
            'cards_processed_today': detections_today,
            'potential_revenue': potential_revenue,
            'actual_cost': actual_cost,
            'gross_margin_pct': gross_margin,
            'cost_per_card': actual_cost / max(detections_today, 1),
            'premium_pricing': premium_pricing,
            'roi_multiple': potential_revenue / max(actual_cost, 0.001)
        }
    
    def print_performance_dashboard(self):
        """Print a real-time performance dashboard"""
        print("🎯 PREMIUM AI VISION PERFORMANCE DASHBOARD")
        print("=" * 60)
        print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Cost Summary
        cost_stats = self.get_daily_cost_summary()
        print("💰 DAILY COST SUMMARY")
        print("-" * 30)
        print(f"   💸 Total Spent: ${cost_stats['total_cost']:.4f}")
        print(f"   📊 Requests: {cost_stats['request_count']}")
        print(f"   💳 Avg Cost/Request: ${cost_stats['avg_cost_per_request']:.4f}")
        print(f"   🎯 Budget Used: {cost_stats['budget_used_pct']:.1f}%")
        print(f"   💰 Budget Remaining: ${cost_stats['budget_remaining']:.4f}")
        print()
        
        # Detection Performance
        detection_stats = self.get_detection_stats(24)
        if not detection_stats.get('error'):
            print("🧠 AI VISION PERFORMANCE (24h)")
            print("-" * 30)
            print(f"   📸 Total Detections: {detection_stats['total_detections']}")
            print(f"   ✅ Success Rate: {detection_stats['success_rate']:.1f}%")
            print(f"   🎯 Avg Confidence: {detection_stats['avg_confidence']:.2f}")
            print(f"   💸 Total Cost: ${detection_stats['total_cost']:.4f}")
            print(f"   📊 Cost per Detection: ${detection_stats['avg_cost_per_detection']:.4f}")
            print()
            
            print("🔧 METHOD BREAKDOWN")
            print("-" * 30)
            for method, count in detection_stats['method_breakdown'].items():
                pct = (count / detection_stats['total_detections']) * 100
                print(f"   {method}: {count} ({pct:.1f}%)")
        else:
            print(f"⚠️ Detection Stats Error: {detection_stats['error']}")
        print()
        
        # Business Metrics
        business_stats = self.get_business_metrics()
        if not business_stats.get('error'):
            print("💼 BUSINESS METRICS")
            print("-" * 30)
            print(f"   💎 Premium Pricing: ${business_stats['premium_pricing']:.2f}/card")
            print(f"   💰 Potential Revenue: ${business_stats['potential_revenue']:.2f}")
            print(f"   📈 Gross Margin: {business_stats['gross_margin_pct']:.1f}%")
            print(f"   🚀 ROI Multiple: {business_stats['roi_multiple']:.1f}x")
            print(f"   💸 Cost per Card: ${business_stats['cost_per_card']:.4f}")
        print()
        
        # Status Assessment
        if cost_stats['budget_used_pct'] > 80:
            print("🚨 WARNING: High budget usage!")
        elif detection_stats.get('success_rate', 0) > 90:
            print("🎉 EXCELLENT: Premium performance achieved!")
        elif detection_stats.get('success_rate', 0) > 70:
            print("✅ GOOD: System performing well")
        else:
            print("⚠️ NEEDS ATTENTION: Lower than expected performance")

def monitor_loop():
    """Run continuous monitoring loop"""
    monitor = AIPerformanceMonitor()
    
    print("🚀 Starting Premium AI Vision Monitor...")
    print("Press Ctrl+C to stop monitoring")
    print()
    
    try:
        while True:
            monitor.print_performance_dashboard()
            print("🔄 Refreshing in 30 seconds...")
            print("=" * 60)
            time.sleep(30)
    except KeyboardInterrupt:
        print("\n👋 Monitoring stopped by user")

if __name__ == "__main__":
    # Single dashboard view
    monitor = AIPerformanceMonitor()
    monitor.print_performance_dashboard() 