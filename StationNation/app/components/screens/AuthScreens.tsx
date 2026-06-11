'use client';

import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { ScreenRouterProps } from '../screenProps';

// SIGN IN 12 — magic-link (email OTP) entry + "check your email" confirmation.
// Styled to match the onboarding/Settings dark visual language (#060F24 / blue accents).
export function SignInScreen({
  navigateTo,
  prevScreen,
}: Pick<ScreenRouterProps, 'navigateTo' | 'prevScreen'>) {
  const [email, setEmail] = useState<string>('');
  const [sent, setSent] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Where the back chevron returns to (fall back to the map if we don't know).
  const backTarget = prevScreen ?? '03_MapHome';

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // Send (or resend) the magic link. Surfaces send errors inline (e.g. rate-limited).
  const sendLink = async () => {
    const addr = email.trim();
    if (!emailValid || sending) return;
    setSending(true);
    setError('');
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: addr,
        options: { emailRedirectTo: window.location.origin },
      });
      if (otpError) {
        setError(otpError.message || 'Could not send the sign-in link. Try again.');
        setSending(false);
        return;
      }
      setSent(true);
    } catch {
      setError('Could not send the sign-in link. Try again.');
    }
    setSending(false);
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-[#060F24] p-6 text-white pt-[max(env(safe-area-inset-top),24px)] pb-12 h-full">
      {/* Header with back chevron returning to wherever the user came from */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => navigateTo(backTarget, 'push-right')}
          className="text-slate-400 hover:text-slate-200 p-1 bg-slate-800/20 rounded-lg text-lg font-bold"
        >
          ‹ Back
        </button>
        <span className="text-xs font-bold uppercase tracking-widest text-[#378ADD]">Sign in</span>
        <div className="w-6" />
      </div>

      {!sent ? (
        // ── Email entry state ──────────────────────────────────────────────
        <div className="flex flex-col items-center text-center mt-6 flex-1">
          <div className="w-16 h-16 bg-[#1A52B5]/30 rounded-full flex items-center justify-center text-[#5B9BD5] mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-2xl font-display font-semibold tracking-tight text-slate-100">
            Sign in to post
          </h2>
          <p className="text-sm text-slate-400 max-w-xs mt-3 leading-relaxed">
            Ratings and helpful votes need an account. We&apos;ll email you a one-tap sign-in link — no password.
          </p>

          <div className="w-full flex flex-col gap-2 mt-8">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              autoCapitalize="none"
              autoCorrect="off"
              inputMode="email"
              placeholder="you@example.com"
              className="w-full bg-[#0a1a42] text-white font-sans text-base px-4 py-3 rounded-2xl border border-[#1A52B5]/60 outline-none focus:border-[#5B9BD5] transition-all shadow-inner"
            />
            {error && (
              <span className="text-xs text-brand-coral font-semibold mt-0.5 text-left">{error}</span>
            )}
          </div>
        </div>
      ) : (
        // ── "Check your email" confirmation state ──────────────────────────
        <div className="flex flex-col items-center text-center mt-6 flex-1">
          <div className="w-16 h-16 bg-brand-teal/10 border border-brand-teal/30 rounded-full flex items-center justify-center text-brand-teal mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-display font-semibold tracking-tight text-slate-100">
            Check your email
          </h2>
          <p className="text-sm text-slate-400 max-w-xs mt-3 leading-relaxed">
            We sent a sign-in link to <strong className="text-slate-200 font-semibold">{email.trim()}</strong>.
            Open it on this device to finish signing in.
          </p>
          {error && (
            <span className="text-xs text-brand-coral font-semibold mt-4">{error}</span>
          )}
          <button
            onClick={sendLink}
            disabled={sending}
            className="text-xs text-[#378ADD] hover:underline font-semibold mt-6 disabled:opacity-50"
          >
            {sending ? 'Resending…' : 'Resend link'}
          </button>
        </div>
      )}

      {!sent && (
        <button
          disabled={!emailValid || sending}
          onClick={sendLink}
          className={`w-full text-white font-semibold py-3 rounded-2xl shadow-xl font-display border border-[#5B9BD5]/30 transition-all ${
            emailValid && !sending
              ? 'bg-[#1A52B5] hover:bg-[#1645A0] cursor-pointer'
              : 'bg-[#1A52B5]/40 cursor-not-allowed opacity-50'
          }`}
        >
          {sending ? 'Sending…' : 'Email me a sign-in link'}
        </button>
      )}
    </div>
  );
}

// CLAIM NAME 13 — shown only when the locally-stored nickname collides with an
// existing profiles.username at first sign-in. Asks for a different name.
export function ClaimNameScreen({
  safeAtNightMode,
  claimNameValue,
  setClaimNameValue,
  claimNameError,
  claimNameSaving,
  handleClaimName,
}: Pick<
  ScreenRouterProps,
  | 'safeAtNightMode'
  | 'claimNameValue'
  | 'setClaimNameValue'
  | 'claimNameError'
  | 'claimNameSaving'
  | 'handleClaimName'
>) {
  void safeAtNightMode;
  const nameValid = claimNameValue.trim().length >= 2 && claimNameValue.trim().length <= 20;

  return (
    <div className="flex-1 flex flex-col justify-between bg-[#060F24] p-6 text-white pt-[max(env(safe-area-inset-top),24px)] pb-12 h-full">
      <div className="flex flex-col items-center text-center mt-12 flex-1">
        <div className="w-16 h-16 bg-[#D85A30]/10 border-2 border-brand-coral text-brand-coral rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <h2 className="text-2xl font-display font-semibold tracking-tight text-slate-100">
          Pick a display name
        </h2>
        <p className="text-sm text-slate-400 max-w-xs mt-3 leading-relaxed">
          That nickname is already taken. Choose a different one — it appears on the reviews you post.
        </p>

        <div className="w-full flex flex-col gap-2 mt-8">
          <input
            type="text"
            value={claimNameValue}
            onChange={(e) => setClaimNameValue(e.target.value)}
            maxLength={20}
            placeholder="e.g. Road Runner 2"
            className="w-full bg-[#0a1a42] text-white font-sans text-base px-4 py-3 rounded-2xl border border-[#1A52B5]/60 outline-none focus:border-[#5B9BD5] transition-all shadow-inner"
          />
          {claimNameError && (
            <span className="text-xs text-brand-coral font-semibold mt-0.5 text-left">{claimNameError}</span>
          )}
        </div>
      </div>

      <button
        disabled={!nameValid || claimNameSaving}
        onClick={handleClaimName}
        className={`w-full text-white font-semibold py-3 rounded-2xl shadow-xl font-display border border-[#5B9BD5]/30 transition-all ${
          nameValid && !claimNameSaving
            ? 'bg-[#1A52B5] hover:bg-[#1645A0] cursor-pointer'
            : 'bg-[#1A52B5]/40 cursor-not-allowed opacity-50'
        }`}
      >
        {claimNameSaving ? 'Saving…' : 'Save name'}
      </button>
    </div>
  );
}
