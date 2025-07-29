import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync, readdirSync } from 'fs';

// Map frontend feedback types to directory structure
const FEEDBACK_TYPE_MAP = {
  'not_a_card': 'not_a_card',
  'card_not_in_db': 'missing_from_db', 
  'wrong': 'wrong_id',
  'wrong_id': 'wrong_id',
  'missing_from_db': 'missing_from_db',
  'correct': 'correct',
  'general': 'not_a_card' // Default fallback
};

export async function POST(request: NextRequest) {
  const supabase = supabaseAdmin();

  try {
    const { scan_id, detection_id, type = 'general' } = await request.json();
    
    if (!scan_id && !detection_id) {
      return NextResponse.json({ error: 'scan_id or detection_id is required' }, { status: 400 });
    }

    const validTypes = Object.keys(FEEDBACK_TYPE_MAP);
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: `Invalid type. Valid types: ${validTypes.join(', ')}` }, { status: 400 });
    }

    // Map feedback type to directory name
    const directoryType = FEEDBACK_TYPE_MAP[type as keyof typeof FEEDBACK_TYPE_MAP];

    // If detection_id is provided, flag individual card
    if (detection_id) {
      console.log(`🎯 Processing feedback: ${type} -> ${directoryType} for detection ${detection_id}`);

      // 1. Fetch card detection details
      const { data: detection, error: detectionError } = await supabase
        .from('card_detections')
        .select('*')
        .eq('id', detection_id)
        .single();

      if (detectionError || !detection) {
        console.error('Detection error:', detectionError);
        return NextResponse.json({ error: 'Card detection not found' }, { status: 404 });
      }

      // 2. Download the cropped card image from storage
      const { data: imageData, error: downloadError } = await supabase.storage
        .from('scans')
        .download(detection.crop_url);

      if (downloadError || !imageData) {
        console.error('Download error:', downloadError);
        return NextResponse.json({ error: 'Failed to download card image' }, { status: 500 });
      }

      // 3. Ensure training directory exists (organized by type)
      const trainingDir = join(process.cwd(), 'training_data', 'card_crops', directoryType);
      if (!existsSync(trainingDir)) {
        mkdirSync(trainingDir, { recursive: true });
      }

      // 4. Save image to training directory with descriptive filename
      const confidence = detection.confidence ? Math.round(detection.confidence * 100) : 0;
      const fileName = `${directoryType}_${detection_id}_conf${confidence}_${Date.now()}.jpg`;
      const filePath = join(trainingDir, fileName);
      const buffer = Buffer.from(await imageData.arrayBuffer());
      await writeFile(filePath, buffer);

      // 5. Log the training flag with metadata
      const metadata = {
        detection_id,
        feedback_type: type,
        directory_type: directoryType,
        confidence: detection.confidence,
        guess_card_id: detection.guess_card_id,
        bbox: detection.bbox,
        timestamp: new Date().toISOString()
      };

      // Save metadata alongside image
      const metadataPath = join(trainingDir, `${fileName}.json`);
      await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      console.log(`✅ Card detection ${detection_id} flagged as '${type}' and saved to ${filePath}`);

             // 6. Count total training images across all categories
       const baseTrainingDir = join(process.cwd(), 'training_data', 'card_crops');
       let trainingCount = 0;
       let categoryBreakdown: Record<string, number> = {};
      
      if (existsSync(baseTrainingDir)) {
        const typeDirs = readdirSync(baseTrainingDir, { withFileTypes: true });
        for (const dir of typeDirs) {
          if (dir.isDirectory()) {
            const typeDir = join(baseTrainingDir, dir.name);
            const imageFiles = readdirSync(typeDir).filter(f => f.endsWith('.jpg'));
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
        type: 'card'
      });

    } else {
      // Original behavior: flag entire scan (legacy support)
      const { data: scan, error: scanError } = await supabase
        .from('scan_uploads')
        .select('*')
        .eq('id', scan_id)
        .single();

      if (scanError || !scan) {
        return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
      }

      if (scan.processing_status !== 'completed') {
        return NextResponse.json({ error: 'Only completed scans can be flagged for training' }, { status: 400 });
      }

      // Download the original image from storage
      const { data: imageData, error: downloadError } = await supabase.storage
        .from('scans')
        .download(scan.storage_path);

      if (downloadError || !imageData) {
        return NextResponse.json({ error: 'Failed to download original image' }, { status: 500 });
      }

      // Ensure training directory exists
      const trainingDir = join(process.cwd(), 'training_data', 'raw_images');
      if (!existsSync(trainingDir)) {
        mkdirSync(trainingDir, { recursive: true });
      }

      // Save image to training directory
      const fileName = `scan_${scan_id}_${Date.now()}.jpg`;
      const filePath = join(trainingDir, fileName);
      const buffer = Buffer.from(await imageData.arrayBuffer());
      await writeFile(filePath, buffer);

      // Update scan record to mark as training candidate
      const { error: updateError } = await supabase
        .from('scan_uploads')
        .update({ 
          is_training_candidate: true,
          training_flagged_at: new Date().toISOString()
        })
        .eq('id', scan_id);

      if (updateError) {
        console.error('Failed to update scan record:', updateError);
      }

      // Count total training images
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
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 