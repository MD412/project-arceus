#!/usr/bin/env python3
"""
Production System Startup Script
Starts both the main worker and auto-recovery system
"""

import subprocess
import sys
import time
import signal
import threading
from pathlib import Path

class ProductionSystem:
    def __init__(self):
        self.worker_process = None
        self.recovery_process = None
        self.running = True
        
    def start_worker(self):
        """Start the main worker process"""
        print("🚀 Starting main worker...")
        worker_path = Path(__file__).parent / "worker" / "worker.py"
        self.worker_process = subprocess.Popen([
            sys.executable, str(worker_path)
        ], cwd=str(Path(__file__).parent / "worker"))
        
    def start_auto_recovery(self):
        """Start the auto-recovery system"""
        print("🤖 Starting auto-recovery system...")
        recovery_path = Path(__file__).parent / "worker" / "auto_recovery_system.py"
        self.recovery_process = subprocess.Popen([
            sys.executable, str(recovery_path)
        ], cwd=str(Path(__file__).parent / "worker"))
        
    def monitor_processes(self):
        """Monitor and restart processes if they crash"""
        while self.running:
            try:
                # Check worker process
                if self.worker_process and self.worker_process.poll() is not None:
                    print("⚠️ Worker process crashed, restarting...")
                    self.start_worker()
                
                # Check recovery process
                if self.recovery_process and self.recovery_process.poll() is not None:
                    print("⚠️ Auto-recovery process crashed, restarting...")
                    self.start_auto_recovery()
                
                time.sleep(10)  # Check every 10 seconds
                
            except KeyboardInterrupt:
                break
    
    def stop_all(self):
        """Stop all processes gracefully"""
        print("\n🛑 Stopping production system...")
        self.running = False
        
        if self.worker_process:
            print("  - Stopping worker...")
            self.worker_process.terminate()
            self.worker_process.wait(timeout=10)
            
        if self.recovery_process:
            print("  - Stopping auto-recovery...")
            self.recovery_process.terminate()
            self.recovery_process.wait(timeout=10)
            
        print("✅ All processes stopped")
    
    def run(self):
        """Run the complete production system"""
        print("🏭 Starting Project Arceus Production System")
        print("=" * 50)
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, lambda s, f: self.stop_all())
        signal.signal(signal.SIGTERM, lambda s, f: self.stop_all())
        
        try:
            # Start processes
            self.start_worker()
            time.sleep(2)  # Give worker time to start
            self.start_auto_recovery()
            
            print("\n✅ Production system running!")
            print("📊 Components:")
            print("  - Main Worker: Processing uploads with AI vision")
            print("  - Auto-Recovery: Monitoring for stuck jobs")
            print("  - Process Monitor: Restarting crashed processes")
            print("\n💡 Press Ctrl+C to stop")
            
            # Start monitoring in background
            monitor_thread = threading.Thread(target=self.monitor_processes)
            monitor_thread.daemon = True
            monitor_thread.start()
            
            # Keep main thread alive
            while self.running:
                time.sleep(1)
                
        except KeyboardInterrupt:
            pass
        finally:
            self.stop_all()

if __name__ == "__main__":
    system = ProductionSystem()
    system.run() 