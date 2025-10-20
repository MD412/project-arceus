'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/browser';

interface FormErrors {
  email?: string;
  general?: string;
}

export default function ForgotPasswordPage() {
  const supabase = getSupabaseClient();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Enter a valid email' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setErrors({ general: error.message });
        return;
      }
      setSent(true);
    } catch (err: any) {
      setErrors({ general: 'Something went wrong. Try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Forgot your password?</h1>
        {sent ? (
          <>
            <p>We sent a reset link to {email}. Check your inbox.</p>
            <Link href="/login" className="auth-link">Back to login</Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {errors.general && <div className="error-message">{errors.general}</div>}
            <label htmlFor="email" className="auth-label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isLoading}
              required
            />
            {errors.email && <div className="field-error">{errors.email}</div>}
            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? 'Sending…' : 'Send reset link'}
            </button>
            <div className="auth-footer">
              <Link href="/login" className="auth-link">Back to login</Link>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        .auth-container { display: flex; align-items: center; justify-content: center; min-height: 80vh; }
        .auth-card { width: 100%; max-width: 420px; padding: var(--sds-size-space-600); border: 1px solid var(--border-default); border-radius: var(--sds-size-radius-200); background: var(--surface-background); }
        .auth-form { display: flex; flex-direction: column; gap: var(--sds-size-space-300); }
        .auth-label { font-weight: 600; }
        .auth-input { padding: var(--sds-size-space-200); border: 1px solid var(--border-default); border-radius: var(--sds-size-radius-100); background: var(--surface-elevated); }
        .auth-button { padding: var(--sds-size-space-200) var(--sds-size-space-400); border-radius: var(--sds-size-radius-100); border: 1px solid var(--interactive-primary); background: var(--interactive-primary); color: var(--text-on-primary); cursor: pointer; }
        .auth-link { color: var(--interactive-primary); text-decoration: underline; }
        .error-message, .field-error { color: var(--status-danger-text); font-size: var(--font-size-75); }
      `}</style>
    </div>
  );
}





























































