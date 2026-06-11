'use client';

import React from 'react';
import { ScreenRouterProps, getTheme } from '../screenProps';

// RATE STEP 1: Two-tap core loop (06)
export function RateStep1Screen({
  allStations,
  selectedStationId,
  navigateTo,
  safeAtNightMode,
  handleRatingVote,
  resetRatingFlow,
  logAction,
}: Pick<
  ScreenRouterProps,
  | 'allStations'
  | 'selectedStationId'
  | 'navigateTo'
  | 'safeAtNightMode'
  | 'handleRatingVote'
  | 'resetRatingFlow'
  | 'logAction'
>) {
  const { uiTheme, secondaryText } = getTheme(safeAtNightMode);
  const currentStation = allStations.find((s) => s.id === selectedStationId) || allStations[0];

  return (
    <div className={`flex-1 flex flex-col justify-between p-6 pt-[max(env(safe-area-inset-top),24px)] pb-12 ${uiTheme}`}>
      <div className="flex flex-col gap-6">
        {/* Header / Title */}
        <div className="text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
            Two-Tap Feedback
          </span>
          <h2 className="text-2xl font-display font-semibold tracking-tight">
            How was the restroom?
          </h2>
          <p className={`text-xs mt-1.5 ${secondaryText}`}>
            {currentStation.name}
          </p>
        </div>

        {/* Two-tap button tiles side-by-side */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => handleRatingVote(true)}
            className="aspect-square flex flex-col items-center justify-center p-4 bg-[#1D9E75]/10 border border-[#1D9E75]/35 hover:bg-[#1D9E75]/20 text-white rounded-3xl cursor-pointer group transition-all"
          >
            <div className="w-12 h-12 bg-[#1D9E75] rounded-full flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-all shadow-md">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <span className="font-display font-bold text-sm text-[#1D9E75]">CLEAN</span>
            <span className="text-[9px] text-slate-400 font-light mt-1 font-sans">
              Good soap &amp; paper
            </span>
          </button>

          <button
            onClick={() => handleRatingVote(false)}
            className="aspect-square flex flex-col items-center justify-center p-4 bg-[#E24B4A]/10 border border-[#E24B4A]/35 hover:bg-[#E24B4A]/20 text-white rounded-3xl cursor-pointer group transition-all"
          >
            <div className="w-12 h-12 bg-[#E24B4A] rounded-full flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-all shadow-md">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="font-display font-bold text-sm text-[#E24B4A]">GROSS</span>
            <span className="text-[9px] text-slate-400 font-light mt-1 font-sans">
              Dirty or empty
            </span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 text-center">
        {/* Add note link */}
        <button
          onClick={() => {
            logAction('Opened optional rating notes & details');
            navigateTo('07_Rate_Step2', 'push-left');
          }}
          className="text-xs text-[#378ADD] hover:underline font-semibold"
        >
          + Add a quick note or tags (optional)
        </button>

        <button
          onClick={() => {
            resetRatingFlow();
            navigateTo('05_StationDetail', 'push-right');
          }}
          className="text-xs text-slate-500 hover:text-slate-300 font-medium"
        >
          Cancel rating
        </button>
      </div>
    </div>
  );
}

// RATE STEP 2: Optional details (07)
export function RateStep2Screen({
  navigateTo,
  safeAtNightMode,
  tempRatingScore,
  setTempRatingScore,
  tempRatingTags,
  setTempRatingTags,
  tempRatingNotes,
  setTempRatingNotes,
  tempRatingPhoto,
  setTempRatingPhoto,
  handleSubmitDetailedRating,
  resetRatingFlow,
  logAction,
}: Pick<
  ScreenRouterProps,
  | 'navigateTo'
  | 'safeAtNightMode'
  | 'tempRatingScore'
  | 'setTempRatingScore'
  | 'tempRatingTags'
  | 'setTempRatingTags'
  | 'tempRatingNotes'
  | 'setTempRatingNotes'
  | 'tempRatingPhoto'
  | 'setTempRatingPhoto'
  | 'handleSubmitDetailedRating'
  | 'resetRatingFlow'
  | 'logAction'
>) {
  const { uiTheme } = getTheme(safeAtNightMode);

  // Quick Tag toggle helper
  const toggleQuickTag = (tag: string) => {
    setTempRatingTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className={`flex-1 flex flex-col justify-between p-5 pt-[max(env(safe-area-inset-top),16px)] pb-10 ${uiTheme}`}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800/40 pb-2">
          <button
            onClick={() => navigateTo('06_Rate_Step1', 'push-right')}
            className="text-xs text-slate-400 hover:underline font-semibold"
          >
            ‹ Back
          </button>
          <h2 className="text-sm font-display font-bold text-slate-300">Add details</h2>
          <div className="w-6" />
        </div>

        {/* Required verdict selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-400">Your verdict <span className="text-brand-coral">*</span></span>
          <div className="flex gap-2">
            <button
              onClick={() => setTempRatingScore(5)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                tempRatingScore === 5
                  ? 'bg-[#1D9E75] border-[#1D9E75] text-white shadow-sm'
                  : 'bg-[#1D9E75]/10 border-[#1D9E75]/35 text-[#1D9E75]'
              }`}
            >
              CLEAN
            </button>
            <button
              onClick={() => setTempRatingScore(1.5)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                tempRatingScore === 1.5
                  ? 'bg-[#E24B4A] border-[#E24B4A] text-white shadow-sm'
                  : 'bg-[#E24B4A]/10 border-[#E24B4A]/35 text-[#E24B4A]'
              }`}
            >
              GROSS
            </button>
          </div>
        </div>

        {/* Quick-tag chips selection */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-400">Quick Tags</span>
          <div className="flex flex-wrap gap-1.5">
            {['Stocked', 'Smelled bad', 'Out of order', 'Well lit', 'Friendly staff'].map((tag) => {
              const active = tempRatingTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleQuickTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                    active
                      ? 'bg-brand-coral border-brand-coral text-white shadow-sm'
                      : safeAtNightMode
                        ? 'bg-[#23355c] border-slate-700 text-slate-300'
                        : 'bg-white border-neutral-300 text-neutral-600'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Note text area */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-400">Write a note (Optional)</span>
          <textarea
            value={tempRatingNotes}
            onChange={(e) => setTempRatingNotes(e.target.value)}
            placeholder="Write what was clean or broken..."
            rows={3}
            className={`w-full text-xs p-3 rounded-2xl border outline-none font-sans ${
              safeAtNightMode
                ? 'bg-[#23355c] border-slate-700 text-white focus:border-slate-500'
                : 'bg-white border-neutral-300 text-neutral-900 focus:border-neutral-500'
            }`}
          />
        </div>

        {/* Add photo tile */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-400">Add photo (No faces/trash)</span>
          <button
            onClick={() => {
              setTempRatingPhoto(!tempRatingPhoto);
              logAction(`${tempRatingPhoto ? 'Removed' : 'Attached'} mock photo to review`);
            }}
            className={`w-full py-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${
              tempRatingPhoto
                ? 'border-brand-teal bg-brand-teal/5 text-brand-teal'
                : 'border-slate-700/60 hover:border-slate-500 text-slate-500'
            }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            </svg>
            <span className="text-[10px] font-bold">
              {tempRatingPhoto ? '✓ Image Attached' : 'Attach Photo'}
            </span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={handleSubmitDetailedRating}
          disabled={!tempRatingScore}
          className={`w-full bg-[#1D9E75] text-white font-semibold py-3 rounded-2xl shadow-xl font-display transition-all ${
            tempRatingScore ? 'hover:bg-[#15825f] cursor-pointer' : 'opacity-50 cursor-not-allowed'
          }`}
        >
          Submit Detailed Review
        </button>
        <button
          onClick={() => {
            resetRatingFlow();
            navigateTo('03_MapHome', 'dissolve');
          }}
          className="w-full bg-transparent text-slate-500 hover:text-slate-400 font-semibold py-2 font-display text-xs"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// RATE CONFIRM 08 (Confetti overlay, Streak + points tick up)
export function RateConfirmScreen({
  navigateTo,
  safeAtNightMode,
  user,
  resetRatingFlow,
}: Pick<ScreenRouterProps, 'navigateTo' | 'safeAtNightMode' | 'user' | 'resetRatingFlow'>) {
  const { uiTheme, secondaryText } = getTheme(safeAtNightMode);

  return (
    <div className={`flex-1 flex flex-col justify-between p-6 pt-[max(env(safe-area-inset-top),24px)] pb-12 ${uiTheme}`}>
      <div className="flex flex-col items-center text-center mt-12">

        {/* Green Check Icon */}
        <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg relative">
          <svg className="w-10 h-10 shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {/* Confetti mini bubbles */}
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-400 rounded-full animate-ping" />
        </div>

        <h2 className="text-2xl font-display font-semibold tracking-tight">
          Thanks — that helps.
        </h2>
        <p className={`text-xs mt-1.5 max-w-xs leading-relaxed ${secondaryText}`}>
          Your rating keeps our community data fresh. Safe travels tonight!
        </p>

        {/* Streak flame growth animation */}
        <div className="flex items-center gap-3 bg-[#E24B4A]/5 border border-[#E24B4A]/10 px-4 py-2 rounded-2xl mt-8">
          <span className="text-2xl animate-flame">🔥</span>
          <div className="text-left">
            <div className="text-xs font-extrabold text-brand-coral font-display">
              {user.streak} DAY STREAK
            </div>
            <div className="text-[9px] text-slate-400 font-medium font-sans uppercase">
              Streak Flame Growing
            </div>
          </div>
        </div>

        {/* Reward Toast details */}
        <div className="w-full bg-[#D85A30]/10 border border-[#D85A30]/30 rounded-2xl p-4 mt-6 text-center animate-toast">
          <span className="text-xs text-brand-coral font-bold uppercase tracking-widest block mb-1">
            +10 Points Added
          </span>
          <p className="text-xs text-slate-300 font-light leading-relaxed">
            You helped <strong className="text-white font-semibold">{user.peopleHelped} people</strong> this week.
            Keep it up — you&apos;re making the road safer for everyone!
          </p>
        </div>

      </div>

      <button
        onClick={() => {
          resetRatingFlow();
          navigateTo('03_MapHome', 'dissolve');
        }}
        className="w-full bg-[#1D9E75] hover:bg-[#15825f] text-white font-semibold py-3 rounded-2xl shadow-xl font-display cursor-pointer"
      >
        Back to map
      </button>
    </div>
  );
}
