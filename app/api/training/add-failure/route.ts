import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabaseServer } from '@/lib/supabase/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync, readdirSync } from 'fs';

// Map frontend feedback types to directory structure
const FEEDBACK_TYPE_MAP = {
  not_a_card: 'not_a_card',
  card_not_in_db: 'missing_from_db',
  wrong: 'wrong_id',
  wrong_id: 'wrong_id',
  missing_from_db: 'missing_from_db',
  correct: 'correct',
  general: 'not_a_card', // Default fallback
} as const;

export async function POST(request: NextRequest) {
  const adminClient = supabaseAdmin();
  const supabaseUserCtx = await supabaseServer();
  const {
    data: { user },
    error: userError,
  } = await supabaseUserCtx.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { scan_id, detection_id, type = 'general' } = await request.json();

    if (!scan_id && !detection_id) {
      return NextResponse.json({ error: 'scan_id or detection_id is required' }, { status: 400 });
    }

    const validTypes = Object.keys(FEEDBACK_TYPE_MAP);
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Valid types: ${validTypes.join(', ')}` },
        { status: 400 },
      );
    }

    const directoryType = FEEDBACK_TYPE_MAP[type as keyof typeof FEEDBACK_TYPE_MAP];

    if (detection_id) {
      console.log(`?? Processing feedback: ${type} -> ${directoryType} for detection ${detection_id}`);

      const { data: detection, error: detectionError } = await adminClient
        .from('card_detections')
        .select('id, scan_id, crop_url, confidence, guess_card_id, bbox')
        .eq('id', detection_id)
        .single();

      if (detectionError || !detection) {
        console.error('Detection error:', detectionError);
        return NextResponse.json({ error: 'Card detection not found' }, { status: 404 });
      }

      const { data: detectionScan, error: scanLookupError } = await adminClient
        .from('scan_uploads')
        .select('id, user_id')
        .eq('id', detection.scan_id)
        .single();

      if (scanLookupError || !detectionScan) {
        console.error('Failed to load scan for detection:', scanLookupError);
        return NextResponse.json({ error: 'Parent scan not found' }, { status: 404 });
      }

      if (detectionScan.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (!detection.crop_url) {
        return NextResponse.json({ error: 'Detection is missing crop_url' }, { status: 400 });
      }

      const { data: imageData, error: downloadError } = await adminClient.storage
        .from('scans')
        .download(detection.crop_url);

      if (downloadError || !imageData) {
        console.error('Download error:', downloadError);
        return NextResponse.json({ error: 'Failed to download card image' }, { status: 500 });
      }

      const trainingDir = join(process.cwd(), 'training_data', 'card_crops', directoryType);
      if (!existsSync(trainingDir)) {
        mkdirSync(trainingDir, { recursive: true });
      }

      const confidence = detection.confidence ? Math.round(detection.confidence * 100) : 0;
      const fileName = `${directoryType}_${detection_id}_conf${confidence}_${Date.now()}.jpg`;
      const filePath = join(trainingDir, fileName);
      const buffer = Buffer.from(await imageData.arrayBuffer());
      await writeFile(filePath, buffer);

      const metadata = {
        detection_id,
        feedback_type: type,
        directory_type: directoryType,
        confidence: detection.confidence,
        guess_card_id: detection.guess_card_id,
        bbox: detection.bbox,
        user_id: user.id,
        timestamp: new Date().toISOString(),
      };

      const metadataPath = join(trainingDir, `${fileName}.json`);
      await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      console.log(`? Card detection ${detection_id} flagged as '${type}' and saved to ${filePath}`);

      const baseTrainingDir = join(process.cwd(), 'training_data', 'card_crops');
      let trainingCount = 0;
      const categoryBreakdown: Record<string, number> = {};

      if (existsSync(baseTrainingDir)) {
        const typeDirs = readdirSync(baseTrainingDir, { withFileTypes: true });
        for (const dir of typeDirs) {
          if (dir.isDirectory()) {
            const typeDir = join(baseTrainingDir, dir.name);
            const imageFiles = readdirSync(typeDir).filter((f) => f.endsWith('.jpg'));
            const count = imageFiles.length;
            trainingCount += count;
            categoryBreakdown[dir.name] = count;
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Card flagged as '${type}' and added to training set`,
        training_count: trainingCount,
        category_breakdown: categoryBreakdown,
        file_name: fileName,
        local_path: filePath,
        feedback_type: type,
        directory_type: directoryType,
        type: 'card',
      });
    }

    const { data: scan, error: scanError } = await adminClient
      .from('scan_uploads')
      .select('id, user_id, processing_status, storage_path')
      .eq('id', scan_id)
      .single();

    if (scanError || !scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    if (scan.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (scan.processing_status !== 'completed') {
      return NextResponse.json(
        { error: 'Only completed scans can be flagged for training' },
        { status: 400 },
      );
    }

    if (!scan.storage_path) {
      return NextResponse.json({ error: 'Scan is missing storage path' }, { status: 400 });
    }

    const { data: imageData, error: downloadError } = await adminClient.storage
      .from('scans')
      .download(scan.storage_path);

    if (downloadError || !imageData) {
      return NextResponse.json({ error: 'Failed to download original image' }, { status: 500 });
    }

    const trainingDir = join(process.cwd(), 'training_data', 'raw_images');
    if (!existsSync(trainingDir)) {
      mkdirSync(trainingDir, { recursive: true });
    }

    const fileName = `scan_${scan_id}_${Date.now()}.jpg`;
    const filePath = join(trainingDir, fileName);
    const buffer = Buffer.from(await imageData.arrayBuffer());
    await writeFile(filePath, buffer);

    const { error: updateError } = await adminClient
      .from('scan_uploads')
      .update({
        is_training_candidate: true,
        training_flagged_at: new Date().toISOString(),
      })
      .eq('id', scan_id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to update scan record:', updateError);
    }

    const trainingCount = existsSync(trainingDir) ? readdirSync(trainingDir).length : 0;

    return NextResponse.json({
      success: true,
      message: 'Scan added to training set',
      training_count: trainingCount,
      file_name: fileName,
      local_path: filePath,
      type: 'scan',
    });
  } catch (error: any) {
    console.error('Error in /api/training/add-failure:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
