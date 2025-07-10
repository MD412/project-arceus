import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync, readdirSync } from 'fs';

export async function POST(request: NextRequest) {
  const supabase = await supabaseServer();
  
  // Check authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { scan_id, detection_id, type = 'general' } = await request.json();
  
  if (!scan_id && !detection_id) {
    return NextResponse.json({ error: 'scan_id or detection_id is required' }, { status: 400 });
  }

  const validTypes = ['general', 'not_a_card', 'card_not_in_db', 'wrong'];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  try {
    // If detection_id is provided, flag individual card
    if (detection_id) {
      // 1. Fetch card detection details (simplified to avoid RLS join issues)
      const { data: detection, error: detectionError } = await supabase
        .from('card_detections')
        .select('*')
        .eq('id', detection_id)
        .single();

      if (detectionError || !detection) {
        console.error('Detection error:', detectionError);
        throw new Error('Card detection not found');
      }

      // 2. Verify user owns the scan (separate query)
      const { data: scan, error: scanError } = await supabase
        .from('scans')
        .select('id, user_id')
        .eq('id', detection.scan_id)
        .single();

      if (scanError || !scan || scan.user_id !== user.id) {
        throw new Error('Access denied');
      }

      // 3. Download the cropped card image from storage
      const { data: imageData, error: downloadError } = await supabase.storage
        .from('scans')
        .download(detection.crop_url);

      if (downloadError || !imageData) {
        throw new Error('Failed to download card image');
      }

      // 4. Ensure training directory exists (organized by type)
      const trainingDir = join(process.cwd(), 'training_data', 'card_crops', type);
      if (!existsSync(trainingDir)) {
        mkdirSync(trainingDir, { recursive: true });
      }

      // 5. Save image to training directory with type prefix
      const fileName = `${type}_${detection_id}_${Date.now()}.jpg`;
      const filePath = join(trainingDir, fileName);
      const buffer = Buffer.from(await imageData.arrayBuffer());
      await writeFile(filePath, buffer);

      // 6. Log the training flag with type
      console.log(`Card detection ${detection_id} flagged for training (${type}) and saved to ${filePath}`);

      // 7. Count total training images across all types
      const baseTrainingDir = join(process.cwd(), 'training_data', 'card_crops');
      let trainingCount = 0;
      if (existsSync(baseTrainingDir)) {
        const typeDirs = readdirSync(baseTrainingDir, { withFileTypes: true });
        trainingCount = typeDirs.reduce((count, dir) => {
          if (dir.isDirectory()) {
            const typeDir = join(baseTrainingDir, dir.name);
            count += readdirSync(typeDir).length;
          }
          return count;
        }, 0);
      }

              return NextResponse.json({
          success: true,
          message: `Card flagged as '${type}' and added to training set`,
          training_count: trainingCount,
          file_name: fileName,
          local_path: filePath,
          feedback_type: type,
          type: 'card'
        });

    } else {
      // Original behavior: flag entire scan
      // 1. Fetch scan details (with user ownership check via RLS)
      const { data: scan, error: scanError } = await supabase
        .from('scan_uploads')
        .select('*')
        .eq('id', scan_id)
        .eq('user_id', user.id)
        .single();

      if (scanError || !scan) {
        throw new Error('Scan not found or access denied');
      }

      if (scan.processing_status !== 'completed') {
        throw new Error('Only completed scans can be flagged for training');
      }

      // 2. Download the original image from storage
      const { data: imageData, error: downloadError } = await supabase.storage
        .from('scans')
        .download(scan.storage_path);

      if (downloadError || !imageData) {
        throw new Error('Failed to download original image');
      }

      // 3. Ensure training directory exists
      const trainingDir = join(process.cwd(), 'training_data', 'raw_images');
      if (!existsSync(trainingDir)) {
        mkdirSync(trainingDir, { recursive: true });
      }

      // 4. Save image to training directory
      const fileName = `${scan_id}_${Date.now()}.jpg`;
      const filePath = join(trainingDir, fileName);
      const buffer = Buffer.from(await imageData.arrayBuffer());
      await writeFile(filePath, buffer);

      // 5. Update scan record to mark as training candidate
      const { error: updateError } = await supabase
        .from('scan_uploads')
        .update({ 
          is_training_candidate: true,
          training_flagged_at: new Date().toISOString()
        })
        .eq('id', scan_id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Failed to update scan record:', updateError);
      }

      // 6. Count total training images
      const trainingCount = existsSync(trainingDir) 
        ? readdirSync(trainingDir).length 
        : 0;

      return NextResponse.json({
        success: true,
        message: 'Scan added to training set',
        training_count: trainingCount,
        file_name: fileName,
        local_path: filePath,
        type: 'scan'
      });
    }

  } catch (error: any) {
    console.error('Error in /api/training/add-failure:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 