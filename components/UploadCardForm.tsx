'use client';

// import { Input } from '@/components/ui/Input'; // Path alias import commented out
// import { MyTestInput } from './ui/MyTestInput'; // Old import commented out
// import { Input } from './ui/Input'; // This line will be removed as components/ui/Input.tsx was deleted
import { Input } from '@/components/forms'; // New import using path alias and barrel file
import React, { useRef, useState } from 'react'; // Restored useState
import { supabase } from '@/lib/supabase'; // Restored supabase
import { uploadCardImage } from '@/lib/uploadCardImage'; // Restored uploadCardImage
import { Button } from '@/components/ui/Button'; // Restored Button
import { Modal } from '@/components/ui/Modal'; // Restored Modal import

// All other imports and most of the component logic will be commented out
// import { useRef, useState } from 'react';
// import { supabase } from '@/lib/supabase';
// import { uploadCardImage } from '@/lib/uploadCardImage';
// import { Button } from '@/components/ui/Button';
// import { Modal } from '@/components/ui/Modal';

interface Props {
  /** close() will be called after successful submit or when user clicks cancel  */
  close: () => void;
  /** optional callback so parent can refresh the grid  */
  onAdded?: () => void;
}

export default function UploadCardForm({ close, onAdded }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null); // Added refs for other inputs if needed for focus or direct manipulation
  const numberRef = useRef<HTMLInputElement>(null);
  const setCodeRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const conditionRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false); // Restored state
  const [err, setErr] = useState<string | null>(null); // Restored state

  async function handleSubmit(e: React.FormEvent) { // Restored handleSubmit
    e.preventDefault();
    setErr(null);
    setSubmitting(true);

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    const file = fileRef.current?.files?.[0];
    const name = formData.get('name') as string;
    const number = formData.get('number') as string;
    const set_code = formData.get('set_code') as string;
    const quantity = Number(formData.get('qty'));
    const condition = formData.get('condition') as string;

    if (!file) {
      setErr('Please select an image');
      setSubmitting(false);
      return;
    }

    try {
      console.log('🔵 Starting card upload process...');
      const imageUrl = await uploadCardImage(file);
      console.log('✅ Image uploaded successfully:', imageUrl);

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to add cards');
      }

      // Check if card already exists for this user
      const { data: existing } = await supabase
        .from('cards')
        .select('id')
        .eq('name', name)
        .eq('number', number)
        .eq('set_code', set_code)
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (existing) {
        throw new Error('You already have this card in your collection');
      }

      // Insert the new card
      const { error } = await supabase
        .from('cards')
        .insert({
          user_id: user.id,
          name,
          number,
          set_code,
          image_url: imageUrl
        });

      if (error) throw error;
      console.log('✅ Successfully added card to collection!');

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

  // Restore Modal usage, removing the temporary inline div wrapper
  return (
    <Modal open={true} onClose={close} title="Add Card">
      {/* The Modal component now handles the title via its 'title' prop */}
      <form onSubmit={handleSubmit} className="circuit-form">
        <Input
          ref={fileRef}
          type="file"
          accept="image/*"
          required
          label="Card Image"
          name="cardImage"
        />

        <Input
          ref={nameRef}
          name="name"
          placeholder="Enter card name"
          required
          label="Name"
        />

        <Input
          ref={numberRef}
          name="number"
          placeholder="Enter card number"
          required
          label="Number"
        />

        <Input
          ref={setCodeRef}
          name="set_code"
          placeholder="Enter set code"
          required
          label="Set Code"
        />

        <div className="circuit-form-row"> {/* Assuming this class helps with layout */}
          <Input
            ref={qtyRef}
            name="qty"
            type="number"
            defaultValue={1}
            min={1}
            placeholder="Quantity"
            label="Quantity"
            style={{ flex: 1 }} // Example for layout within a row
          />
          <Input
            ref={conditionRef}
            name="condition"
            placeholder="e.g. NM, LP, MP"
            label="Condition"
            style={{ flex: 1 }} // Example for layout within a row
          />
        </div>

        {err && <p className="circuit-error-text" style={{ color: 'var(--text-error, red)' }}>{err}</p>}

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
            {submitting ? 'Uploading…' : 'Add Card'}
          </Button>
        </div>
      </form>
    </Modal>
  );

  /* Original return statement commented out
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'var(--surface-background)', // Use CSS variable
      padding: '2rem',
      borderRadius: '8px',
      zIndex: 1001, // Ensure it's above other content
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', // Add some shadow
      color: 'var(--text-primary)' // Ensure text is visible
    }}>
      <h2>Add Card (Simplified)</h2>
      <form onSubmit={handleSubmit} className="circuit-form">
        <Input
          ref={fileRef}
          type="file"
          accept="image/*"
          required
          label="Card Image"
        />

        <Input
          name="name"
          placeholder="Enter card name"
          required
          label="Name"
        />

        <Input
          name="number"
          placeholder="Enter card number"
          required
          label="Number"
        />

        <Input
          name="set_code"
          placeholder="Enter set code"
          required
          label="Set Code"
        />

        <div className="circuit-form-row">
          <Input
            name="qty"
            type="number"
            defaultValue={1}
            min={1}
            placeholder="Quantity"
            label="Quantity"
          />
          <Input
            name="condition"
            placeholder="e.g. NM, LP, MP"
            label="Condition"
          />
        </div>

        {err && <p className="circuit-error-text" style={{ color: 'var(--text-error)' }}>{err}</p>}

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
            {submitting ? 'Uploading…' : 'Add Card'}
          </Button>
        </div>
      </form>
    </div>
  );
  */
}
