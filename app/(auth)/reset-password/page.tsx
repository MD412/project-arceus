'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/browser';

interface FormErrors {
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function ResetPasswordPage() {
  const supabase = getSupabaseClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // When arriving from the recovery link, Supabase sets a session via the URL hash
    // Wait one tick to allow the client to parse the hash and set the session
    const timer = setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setReady(!!user);
      } catch (_) {
        setReady(false);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!password || password.length < 6) {
      setErrors({ password: 'Password must be at least 6 characters' });
      return;
    }
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setErrors({ general: error.message });
        return;
      }
      setDone(true);
    } catch (err: any) {
      setErrors({ general: 'Unable to reset password. Try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Reset your password</h1>
        {!ready && !done && (
          <p className="body-medium">Preparing secure session… If this takes more than a second, re-open the link from your email.</p>
        )}
        {done ? (
          <>
            <p>Your password has been updated.</p>
            <Link href="/login" className="auth-link">Return to login</Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form" aria-busy={isLoading}>
            {errors.general && <div className="error-message">{errors.general}</div>}
            <label htmlFor="password" className="auth-label">New password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              disabled={isLoading || !ready}
              required
            />
            {errors.password && <div className="field-error">{errors.password}</div>}

            <label htmlFor="confirmPassword" className="auth-label">Confirm password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="auth-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              disabled={isLoading || !ready}
              required
            />
            {errors.confirmPassword && <div className="field-error">{errors.confirmPassword}</div>}

            <button type="submit" className="auth-button" disabled={isLoading || !ready}>
              {isLoading ? 'Updating…' : 'Update password'}
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






























































