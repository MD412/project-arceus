import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  const supabase = await supabaseServer();
  
  // Check authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { detection_id, type } = await request.json();

    if (!detection_id || !type || !['correct', 'wrong'].includes(type)) {
      return NextResponse.json({ 
        error: 'detection_id and type (correct|wrong) are required' 
      }, { status: 400 });
    }

    // Get detection details
    const { data: detection, error: detectionError } = await supabase
      .from('card_detections')
      .select('*')
      .eq('id', detection_id)
      .single();

    if (detectionError || !detection) {
      return NextResponse.json({ error: 'Detection not found' }, { status: 404 });
    }

    // Create confidence feedback directory
    const confidenceDir = path.join(process.cwd(), 'training_data', 'confidence_feedback');
    await fs.mkdir(confidenceDir, { recursive: true });

    // Log the confidence feedback
    const feedbackData = {
      detection_id,
      type,
      user_id: user.id,
      crop_url: detection.crop_url,
      guess_card_id: detection.guess_card_id,
      confidence: detection.confidence,
      timestamp: new Date().toISOString(),
      bbox: detection.bbox
    };

    const feedbackFile = path.join(confidenceDir, `confidence_${detection_id}_${type}.json`);
    await fs.writeFile(feedbackFile, JSON.stringify(feedbackData, null, 2));

    // Count total confidence feedback
    const files = await fs.readdir(confidenceDir);
    const confidenceCount = files.filter(f => f.startsWith('confidence_')).length;

    console.log(`📊 Confidence feedback: ${type} for detection ${detection_id}`);

    return NextResponse.json({
      success: true,
      message: `Confidence feedback recorded: ${type}`,
      confidence_count: confidenceCount,
      detection_id
    });

  } catch (error: any) {
    console.error('Confidence feedback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 