'use client';

import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadCardImage } from '@/lib/uploadCardImage';
import { Button } from '@/components/ui';

interface Props {
  /** close() will be called after successful submit or when user clicks cancel  */
  close: () => void;
  /** optional callback so parent can refresh the grid  */
  onAdded?: () => void;
}

export default function UploadCardForm({ close, onAdded }: Props) {
  const fileRef       = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    // -------- grab values ----------
    const file       = fileRef.current?.files?.[0];
    const name       = formData.get('name')       as string;
    const number     = formData.get('number')     as string;
    const set_code   = formData.get('set_code')   as string;
    const quantity   = Number(formData.get('qty'));
    const condition  = formData.get('condition')  as string;

    if (!file) { setErr('Please select an image'); setSubmitting(false); return; }

    try {
      console.log('🔵 Starting card upload process...');
      
      // 1) upload image
      console.log('📤 Uploading image to storage...');
      const imageUrl = await uploadCardImage(file);
      console.log('✅ Image uploaded successfully:', imageUrl);

      // 2) ensure card exists in reference table (cards)
      console.log('🔍 Checking if card exists in reference table...');
      const { data: existing } = await supabase
        .from('cards')
        .select('id')
        .eq('name', name)
        .eq('number', number)
        .eq('set_code', set_code)
        .limit(1)
        .single();

      console.log('🔍 Existing card found:', existing);
      
      let cardId: string;

      if (existing) {
        cardId = existing.id;
        console.log('✅ Using existing card ID:', cardId);
      } else {
        console.log('➕ Creating new card in reference table...');
        const { data: insertedCard, error } = await supabase
          .from('cards')
          .insert({ name, number, set_code, image_url: imageUrl })
          .select('id')
          .single();
        if (error) throw error;
        cardId = insertedCard!.id;
        console.log('✅ Created new card with ID:', cardId);
      }

      // 3) insert into user_cards
      console.log('👤 Getting current user...');
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || '00000000-0000-0000-0000-000000000001';
      console.log('👤 User ID:', userId);
      
      console.log('📝 Inserting into user_cards table...');
      const { error: userErr } = await supabase.from('user_cards').insert({
        user_id: userId,
        card_id: cardId,
        quantity,
        condition,
        image_url: imageUrl,
      });
      if (userErr) throw userErr;
      console.log('✅ Successfully added card to user collection!');

      // 4) done!
      onAdded?.();
      close();
    } catch (e: unknown) {
      console.error('💥 Upload error:', e);
      const message = e instanceof Error ? e.message : 'Upload failed';
      setErr(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="circuit-modal-overlay">
      <form onSubmit={handleSubmit} className="circuit-modal">
        <h2 className="circuit-modal-title">Add Card</h2>

        <div className="circuit-form">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          required
            className="circuit-input"
        />

          <input 
            name="name" 
            placeholder="Name" 
            required 
            className="circuit-input" 
          />
          
          <input 
            name="number" 
            placeholder="Number" 
            required 
            className="circuit-input" 
          />
          
          <input 
            name="set_code" 
            placeholder="Set Code" 
            required 
            className="circuit-input" 
          />

          <div className="circuit-form-row">
          <input
            name="qty"
            type="number"
            defaultValue={1}
            min={1}
              className="circuit-input"
            placeholder="Qty"
          />
          <input
            name="condition"
            placeholder="Condition (e.g. NM)"
              className="circuit-input"
          />
        </div>

          {err && <p className="circuit-error-text">{err}</p>}

          <div className="circuit-form-actions">
            <Button
            type="button"
            onClick={close}
              variant="secondary"
              size="sm"
          >
            Cancel
            </Button>
            <Button
            type="submit"
            disabled={submitting}
              variant="primary"
              size="sm"
          >
            {submitting ? 'Uploading…' : 'Add'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
