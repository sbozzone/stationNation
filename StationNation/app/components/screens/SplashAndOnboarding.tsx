'use client';

import React from 'react';
import { deriveInitials } from '../../profile';
import { ScreenRouterProps } from '../screenProps';

// SPLASH SCREEN 00
export function SplashScreen({ navigateTo }: Pick<ScreenRouterProps, 'navigateTo'>) {
  return (
    <div
      onClick={() => navigateTo('01a_Intro', 'dissolve')}
      className="flex-1 flex flex-col select-none h-full cursor-pointer overflow-hidden relative"
    >
      {/* Full-bleed background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/pitstop-splash.png"
        alt="PITSTOP splash"
        className="absolute inset-0 w-full h-full object-cover object-top"
      />

      {/* Dark navy bottom bar overlay matching the graphic */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#0D2255] z-10" style={{ height: '22%' }}>
        <div className="flex items-center justify-around h-full px-4">
          {/* Find */}
          <div className="flex flex-col items-center gap-1.5">
            <svg className="w-7 h-7 text-[#5B9BD5]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs font-bold text-[#5B9BD5] uppercase tracking-wider">Find</span>
          </div>

          {/* Vertical divider */}
          <div className="w-px h-10 bg-white/10" />

          {/* Rate */}
          <div className="flex flex-col items-center gap-1.5">
            <svg className="w-7 h-7 text-[#5B9BD5]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs font-bold text-[#5B9BD5] uppercase tracking-wider">Rate</span>
          </div>

          {/* Vertical divider */}
          <div className="w-px h-10 bg-white/10" />

          {/* Help Others */}
          <div className="flex flex-col items-center gap-1.5">
            <svg className="w-7 h-7 text-[#5B9BD5]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-xs font-bold text-[#5B9BD5] uppercase tracking-wider">Help Others</span>
          </div>
        </div>
      </div>

      {/* Subtle tap hint */}
      <div className="absolute bottom-2 left-0 right-0 text-center z-20">
        <p className="text-[10px] text-white/30 font-medium">Tap to continue</p>
      </div>
    </div>
  );
}

// ONBOARDING 01a INTRO
export function IntroScreen({ navigateTo }: Pick<ScreenRouterProps, 'navigateTo'>) {
  return (
    <div className="flex-1 flex flex-col justify-between bg-gradient-to-b from-[#1A52B5] to-[#0D2255] p-6 text-white pt-[max(env(safe-area-inset-top),24px)] pb-12 select-none h-full">
      <div className="flex flex-col items-center text-center mt-12">
        {/* Logo */}
        <div className="w-20 h-20 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center shadow-2xl mb-8">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-display font-bold tracking-tight leading-tight">
          PITSTOP
        </h1>
        <p className="text-sm font-semibold text-[#5B9BD5] tracking-wide mt-1">
          FIND. RATE. RELIEVE.
        </p>
        <p className="text-sm font-light text-slate-300 max-w-xs mt-3">
          Find the cleanest, safest stop. Confirmed by drivers in real-time.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1 items-center bg-white/5 backdrop-blur border border-white/10 p-4 rounded-2xl">
          <span className="text-xs text-[#5B9BD5] font-bold uppercase tracking-wider">Powered by Station Nation</span>
          <p className="text-[11px] text-slate-300 text-center font-light leading-4">
            Designed to guide solo drivers, parents, and travelers to high-quality rest stops, quickly.
          </p>
        </div>
        <button
          onClick={() => navigateTo('01b_Location', 'push-left')}
          className="w-full bg-[#1A52B5] hover:bg-[#1645A0] text-white font-semibold py-3 rounded-2xl shadow-xl transition-all font-display text-center cursor-pointer min-h-[48px] border border-[#5B9BD5]/30"
        >
          Get started
        </button>
      </div>
    </div>
  );
}

// ONBOARDING 01b LOCATION
export function LocationScreen({ navigateTo, requestLocation }: Pick<ScreenRouterProps, 'navigateTo' | 'requestLocation'>) {
  return (
    <div className="flex-1 flex flex-col justify-between bg-[#0D2255] p-6 text-white pt-[max(env(safe-area-inset-top),24px)] pb-12 h-full">
      <div className="flex flex-col items-center text-center mt-12">
        <div className="w-16 h-16 bg-[#1A52B5]/30 rounded-full flex items-center justify-center text-[#5B9BD5] mb-6">
          <svg className="w-8 h-8 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-display font-semibold tracking-tight leading-tight text-slate-100">
          Allow location access
        </h2>
        <p className="text-sm text-slate-400 max-w-xs mt-3 leading-relaxed">
          We use your location to find the nearest restroom stops and safety signals.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => {
            requestLocation();
            navigateTo('01c_Avatar', 'push-left');
          }}
          className="w-full bg-[#378ADD] hover:bg-blue-700 text-white font-semibold py-3 rounded-2xl shadow-lg font-display cursor-pointer"
        >
          Allow location
        </button>
        <button
          onClick={() => navigateTo('01c_Avatar', 'push-left')}
          className="w-full bg-transparent hover:bg-slate-800/40 text-slate-400 font-semibold py-3 rounded-2xl font-display text-sm cursor-pointer"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

// ONBOARDING 01c AVATAR
export function AvatarScreen({
  navigateTo,
  onboardingNickname,
  setOnboardingNickname,
  setUsername,
}: Pick<ScreenRouterProps, 'navigateTo' | 'onboardingNickname' | 'setOnboardingNickname' | 'setUsername'>) {
  const previewInitials = deriveInitials(onboardingNickname);
  const nicknameValid = onboardingNickname.trim().length > 0;
  return (
    <div className="flex-1 flex flex-col justify-between bg-[#0D2255] p-6 text-white pt-[max(env(safe-area-inset-top),24px)] pb-12 h-full">
      <div className="flex flex-col items-center mt-6">
        <span className="text-xs font-semibold text-[#5B9BD5] uppercase tracking-widest mb-2">Step 3 of 3</span>
        <h2 className="text-2xl font-display font-semibold text-slate-100 text-center mb-6">
          Create your profile
        </h2>

        {/* Avatar preview — shows derived initials live as the user types */}
        <div className="relative group mb-6">
          <div className="w-24 h-24 bg-[#D85A30]/10 border-2 border-brand-coral text-brand-coral rounded-full flex items-center justify-center font-display text-3xl font-bold uppercase shadow-lg shadow-coral-950/20">
            {nicknameValid ? previewInitials : '??'}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-slate-800 text-slate-300 p-1.5 rounded-full border border-slate-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
          </div>
        </div>

        <div className="w-full flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-400">Choose your nickname</label>
          <input
            type="text"
            value={onboardingNickname}
            onChange={(e) => setOnboardingNickname(e.target.value)}
            maxLength={20}
            placeholder="e.g. Road Runner"
            className="w-full bg-[#0a1a42] text-white font-sans text-base px-4 py-3 rounded-2xl border border-[#1A52B5]/60 outline-none focus:border-[#5B9BD5] transition-all shadow-inner"
          />
          {!nicknameValid && (
            <span className="text-xs text-brand-coral font-semibold mt-0.5">
              Pick a nickname to continue.
            </span>
          )}
          <span className="text-xs text-slate-500 font-light italic mt-1">
            🔒 Your real name stays private to protect safety.
          </span>
        </div>
      </div>

      <button
        disabled={!nicknameValid}
        onClick={() => {
          const trimmed = onboardingNickname.trim();
          setUsername(trimmed);
          navigateTo('03_MapHome', 'dissolve');
        }}
        className={`w-full text-white font-semibold py-3 rounded-2xl shadow-xl font-display border border-[#5B9BD5]/30 transition-all ${
          nicknameValid
            ? 'bg-[#1A52B5] hover:bg-[#1645A0] cursor-pointer'
            : 'bg-[#1A52B5]/40 cursor-not-allowed opacity-50'
        }`}
      >
        Start exploring
      </button>
    </div>
  );
}
