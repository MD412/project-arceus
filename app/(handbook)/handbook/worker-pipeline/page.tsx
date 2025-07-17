'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';

export default function WorkerPipelinePage() {
  return (
    <PageLayout
      title="🔧 Worker Pipeline Architecture"
      description="Production-ready Pokemon card processing pipeline with premium AI vision and autonomous recovery."
    >
      <ContentSection title="🚀 System Overview" headingLevel={2}>
        <p className="body-medium mb-4">
          The Project Arceus worker pipeline combines YOLO detection, CLIP similarity, and GPT-4o Mini for 95%+ accuracy card identification with autonomous operation.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">🎯 Performance Metrics</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• <strong>Accuracy:</strong> 95%+ (vs 0% OCR baseline)</li>
              <li>• <strong>Speed:</strong> 1.6s average identification</li>
              <li>• <strong>Cost:</strong> $0.0004/card (375x ROI)</li>
              <li>• <strong>Uptime:</strong> 99.9%+ with auto-recovery</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">🤖 Autonomous Features</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Auto-Recovery:</strong> 30s detection, 10s resolution</li>
              <li>• <strong>Smart Retries:</strong> Max 3 attempts with backoff</li>
              <li>• <strong>Process Monitoring:</strong> Auto-restart on crash</li>
              <li>• <strong>Health Checks:</strong> Continuous system monitoring</li>
            </ul>
          </div>
        </div>
      </ContentSection>

      <ContentSection title="🔄 Processing Pipeline" headingLevel={2}>
        <div className="space-y-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold mb-3">📊 Step-by-Step Process</h4>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start space-x-3">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <strong>Image Upload:</strong> User uploads Pokemon card images (JPEG, PNG, HEIC)
                  <div className="text-gray-600 mt-1">Frontend stores images in Supabase Storage and creates job queue entry</div>
                </div>
              </li>
              
              <li className="flex items-start space-x-3">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <strong>Job Dequeue:</strong> Python worker polls for new jobs every 5 seconds
                  <div className="text-gray-600 mt-1">Worker uses <code>dequeue_job()</code> with visibility timeout for atomic processing</div>
                </div>
              </li>
              
              <li className="flex items-start space-x-3">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <strong>YOLO Detection:</strong> Custom YOLOv8 model detects individual cards
                  <div className="text-gray-600 mt-1">Trained specifically for Pokemon cards with 99%+ detection accuracy</div>
                </div>
              </li>
              
              <li className="flex items-start space-x-3">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
                <div>
                  <strong>CLIP Similarity:</strong> Fast embedding-based card matching
                  <div className="text-gray-600 mt-1">OpenAI CLIP ViT-B-32-quickgelu model with Pokemon card embeddings</div>
                </div>
              </li>
              
              <li className="flex items-start space-x-3">
                <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">5</span>
                <div>
                  <strong>Premium AI Fallback:</strong> GPT-4o Mini for difficult identifications
                  <div className="text-gray-600 mt-1">Triggered when CLIP confidence &lt; 80% for premium accuracy</div>
                </div>
              </li>
              
              <li className="flex items-start space-x-3">
                <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">6</span>
                <div>
                  <strong>Database Integration:</strong> Card creation and inventory updates
                  <div className="text-gray-600 mt-1">Automatic card database updates with confidence tracking</div>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </ContentSection>

      <ContentSection title="🧠 HybridCardIdentifierV2" headingLevel={2}>
        <p className="body-medium mb-4">
          Our premium AI vision system combines multiple identification methods for optimal accuracy and cost efficiency.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-800 mb-2">🔍 CLIP Similarity (Primary)</h4>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• <strong>Model:</strong> ViT-B-32-quickgelu (optimized)</li>
              <li>• <strong>Speed:</strong> ~0.2s per card</li>
              <li>• <strong>Cost:</strong> $0.0001/card</li>
              <li>• <strong>Threshold:</strong> 80%+ confidence → done</li>
              <li>• <strong>Coverage:</strong> ~85% of cards identified</li>
            </ul>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-800 mb-2">🚀 GPT-4o Mini (Fallback)</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• <strong>Model:</strong> GPT-4o Mini vision</li>
              <li>• <strong>Speed:</strong> ~1.4s per card</li>
              <li>• <strong>Cost:</strong> $0.0015/card</li>
              <li>• <strong>Trigger:</strong> &lt; 80% CLIP confidence</li>
              <li>• <strong>Accuracy:</strong> 95%+ for difficult cases</li>
            </ul>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">💡 Cost Optimization Strategy</h4>
          <div className="text-sm text-blue-700 space-y-2">
            <p>• <strong>Blended Cost:</strong> $0.0004/card average (85% CLIP + 15% GPT-4o Mini)</p>
            <p>• <strong>Daily Budget:</strong> $0.10 limit with automatic throttling</p>
            <p>• <strong>ROI Analysis:</strong> 375x return vs $0.15 premium pricing</p>
            <p>• <strong>Fallback Chain:</strong> CLIP → GPT-4o Mini → Manual review</p>
          </div>
        </div>
      </ContentSection>

      <ContentSection title="💸 CLIP-Only Mode (No GPT Fallback)" headingLevel={2}>
        <p className="body-medium mb-4">
          To reduce costs or focus on improving non-LLM accuracy, you can disable the GPT-4o fallback entirely. Set the environment variable <code>ENABLE_GPT_FALLBACK=false</code> in your worker environment. In this mode, the pipeline will:
        </p>
        <ul className="list-disc pl-6 body-medium mb-4">
          <li>Use CLIP similarity search for all card crops</li>
          <li>Skip all GPT-4o Mini calls (no OpenAI API cost)</li>
          <li>Mark low-confidence results as <code>needs_manual_review</code> for later correction or training</li>
          <li>Log all ambiguous cases for future analysis</li>
        </ul>
        <p className="body-small">
          This is ideal for development, cost control, or when iterating on your own models. Re-enable GPT fallback by setting <code>ENABLE_GPT_FALLBACK=true</code> (default).
        </p>
      </ContentSection>

      <ContentSection title="🔧 Auto-Recovery System" headingLevel={2}>
        <p className="body-medium mb-4">
          Autonomous monitoring and recovery system eliminates manual intervention for stuck jobs.
        </p>
        
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2">🚨 Stuck Job Detection</h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• <strong>Monitor Interval:</strong> Every 30 seconds</li>
              <li>• <strong>Timeout Threshold:</strong> 10 minutes in processing</li>
              <li>• <strong>Detection Query:</strong> <code>get_stuck_jobs()</code> function</li>
              <li>• <strong>Recovery Trigger:</strong> Automatic retry or permanent failure</li>
            </ul>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">🔄 Smart Retry Logic</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• <strong>Max Retries:</strong> 3 attempts per job</li>
              <li>• <strong>Retry Tracking:</strong> Database column with attempt counter</li>
              <li>• <strong>Exponential Backoff:</strong> Increasing delays between retries</li>
              <li>• <strong>Permanent Failure:</strong> After 3 failed attempts</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">🏥 Process Health Monitoring</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Worker Heartbeat:</strong> Regular job processing confirmation</li>
              <li>• <strong>Process Restart:</strong> Auto-restart crashed workers</li>
              <li>• <strong>Health Metrics:</strong> Job queue statistics and trends</li>
              <li>• <strong>Alert System:</strong> Real-time problem notifications</li>
            </ul>
          </div>
        </div>
      </ContentSection>

      <ContentSection title="💾 Database Schema" headingLevel={2}>
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold mb-2">📊 Key Tables</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong className="text-purple-700">job_queue</strong>
                <ul className="mt-1 space-y-1 text-gray-600">
                  <li>• id, scan_id, status</li>
                  <li>• created_at, updated_at</li>
                  <li>• visibility_timeout</li>
                  <li>• retry_count, error_message</li>
                </ul>
              </div>
              
              <div>
                <strong className="text-blue-700">scan_uploads</strong>
                <ul className="mt-1 space-y-1 text-gray-600">
                  <li>• id, user_id, storage_path</li>
                  <li>• status, created_at</li>
                  <li>• processing metadata</li>
                </ul>
              </div>
              
              <div>
                <strong className="text-green-700">detected_cards</strong>
                <ul className="mt-1 space-y-1 text-gray-600">
                  <li>• id, scan_id, card_id</li>
                  <li>• confidence, bbox coordinates</li>
                  <li>• identification_method, cost</li>
                </ul>
              </div>
              
              <div>
                <strong className="text-orange-700">worker_logs</strong>
                <ul className="mt-1 space-y-1 text-gray-600">
                  <li>• id, level, message</li>
                  <li>• scan_id, created_at</li>
                  <li>• processing context</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">🔍 Health Monitoring Functions</h4>
            <div className="text-sm text-yellow-700 space-y-2">
              <pre className="bg-yellow-100 p-2 rounded">SELECT * FROM job_queue_health;</pre>
              <p>Returns job statistics: total, processing, failed, average wait time</p>
              
              <pre className="bg-yellow-100 p-2 rounded">SELECT * FROM get_stuck_jobs();</pre>
              <p>Identifies jobs stuck longer than timeout threshold</p>
              
              <pre className="bg-yellow-100 p-2 rounded">SELECT * FROM auto_recover_stuck_jobs();</pre>
              <p>Automatically retries or marks failed stuck jobs</p>
            </div>
          </div>
        </div>
      </ContentSection>

      <ContentSection title="🚀 Production Deployment" headingLevel={2}>
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">🎛️ Complete System Startup</h4>
            <pre className="code-block bg-gray-800 text-green-400 p-3 rounded mb-2">python start_production_system.py</pre>
            <p className="text-sm text-green-700">
              Starts worker + auto-recovery + process monitoring + health checks
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">⚡ Individual Components</h4>
            <div className="space-y-3 text-sm text-blue-700">
              <div>
                <pre className="bg-blue-100 p-2 rounded">cd worker && python worker.py</pre>
                <p>Main processing worker (YOLO + AI vision)</p>
              </div>
              
              <div>
                <pre className="bg-blue-100 p-2 rounded">cd worker && python auto_recovery_system.py</pre>
                <p>Autonomous stuck job recovery monitor</p>
              </div>
              
              <div>
                <pre className="bg-blue-100 p-2 rounded">npm run dev</pre>
                <p>Next.js frontend development server</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-800 mb-2">📋 Environment Configuration</h4>
            <div className="text-sm text-orange-700 space-y-2">
              <p><strong>Required:</strong> SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY</p>
              <p><strong>Optional:</strong> HUGGING_FACE_TOKEN (for model downloads)</p>
              <p><strong>Settings:</strong> Daily budget limits, confidence thresholds, retry counts</p>
            </div>
          </div>
        </div>
      </ContentSection>

      <ContentSection title="📊 Performance & Monitoring" headingLevel={2}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-800 mb-2">💰 Cost Tracking</h4>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• <strong>Daily Logs:</strong> <code>worker/gpt4_costs_*.json</code></li>
              <li>• <strong>Per-Card Cost:</strong> Logged in detected_cards table</li>
              <li>• <strong>Budget Alerts:</strong> Automatic throttling at limits</li>
              <li>• <strong>ROI Analysis:</strong> Real-time margin calculation</li>
            </ul>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">📈 Accuracy Metrics</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• <strong>Training Data:</strong> 4-category feedback system</li>
              <li>• <strong>Confidence Tracking:</strong> CLIP vs GPT-4o Mini scores</li>
              <li>• <strong>Error Analysis:</strong> Misidentification patterns</li>
              <li>• <strong>Model Performance:</strong> A/B testing and improvement</li>
            </ul>
          </div>
        </div>
      </ContentSection>
    </PageLayout>
  );
} 