'use client';

import React from 'react';
import { ScreenRouterProps, getTheme } from '../screenProps';

export function StationDetailScreen({
  allStations,
  selectedStationId,
  navigateTo,
  safeAtNightMode,
  handleFreshnessVerification,
  toggleHelpfulVote,
  showToast,
  toastMessage,
  logAction,
}: Pick<
  ScreenRouterProps,
  | 'allStations'
  | 'selectedStationId'
  | 'navigateTo'
  | 'safeAtNightMode'
  | 'handleFreshnessVerification'
  | 'toggleHelpfulVote'
  | 'showToast'
  | 'toastMessage'
  | 'logAction'
>) {
  const { uiTheme, cardTheme, secondaryText, borderTheme } = getTheme(safeAtNightMode);
  const currentStation = allStations.find((s) => s.id === selectedStationId) || allStations[0];

  return (
    <div className={`flex-1 flex flex-col h-full overflow-y-auto pt-[max(env(safe-area-inset-top),16px)] pb-12 ${uiTheme}`}>

      {/* Refreshness success Toast */}
      {showToast && (
        <div className="absolute top-20 left-4 right-4 bg-brand-teal border border-teal-500/20 text-white px-4 py-2.5 rounded-2xl flex items-center gap-2 animate-toast z-[9999] shadow-lg">
          <svg className="w-5 h-5 shrink-0 animate-ping" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-xs font-semibold">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between border-b ${borderTheme}`}>
        <button
          onClick={() => navigateTo('03_MapHome', 'push-right')}
          className="text-slate-400 hover:text-slate-200 p-1 bg-slate-800/20 rounded-lg text-lg font-bold"
        >
          ‹ Back
        </button>
        <span className="text-xs font-bold uppercase tracking-widest text-[#378ADD]">Station Details</span>
        <div className="w-6" /> {/* Balance */}
      </div>

      <div className="p-4 flex flex-col gap-5">
        {/* Title Block */}
        <div>
          <h1 className="text-2xl font-display font-bold leading-tight">{currentStation.name}</h1>
          <div className={`flex items-center gap-2 mt-1.5 text-xs ${secondaryText}`}>
            <span>📍 {currentStation.distance}</span>
          </div>
        </div>

        {/* Aggregate Rating Block */}
        <div className={`p-4 rounded-3xl ${cardTheme} flex items-center justify-between shadow-sm`}>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-display font-extrabold text-[#1D9E75]">
                {currentStation.score > 0 ? currentStation.score : 'N/A'}
              </span>
              <span className={`text-sm ${secondaryText}`}>/5</span>
            </div>
            <p className={`text-xs mt-1 ${secondaryText}`}>
              based on {currentStation.ratingCount} reviews
            </p>
          </div>

          {/* Score bar details */}
          <div className="flex flex-col gap-1 w-1/2">
            {Object.entries(currentStation.subRatings).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2 text-[10px]">
                <span className="w-16 capitalize font-semibold truncate">{key}</span>
                <div className="flex-1 h-1.5 bg-slate-700/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-teal"
                    style={{ width: `${(val / 5) * 100}%` }}
                  />
                </div>
                <span className="font-mono text-slate-400 shrink-0">{val}★</span>
              </div>
            ))}
          </div>
        </div>

        {/* Safety badges wrap */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-400">Safety signals on-site</span>
          <div className="flex flex-wrap gap-1.5">
            {currentStation.safetyBadges.map((badge) => (
              <span
                key={badge}
                className="px-2.5 py-1 text-xs font-semibold rounded-full bg-[#378ADD]/10 border border-[#378ADD]/20 text-[#378ADD]"
              >
                🛡️ {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Freshness Module */}
        <div className={`p-4 rounded-3xl ${cardTheme} flex flex-col gap-3 shadow-inner`}>
          <div className="flex justify-between items-center">
            <span className={`text-xs font-semibold flex items-center gap-1.5 ${
              currentStation.freshnessHours > 12 ? 'text-amber-500' : 'text-green-500'
            }`}>
              <span className="w-2 h-2 rounded-full bg-current shrink-0" />
              Cleanliness status: Verified {currentStation.freshnessHours}h ago
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-800/40 pt-2.5">
            <span className="text-xs font-medium">Still clean?</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleFreshnessVerification(true)}
                className="px-3.5 py-1.5 rounded-xl bg-brand-teal text-white font-semibold text-xs transition-all hover:bg-brand-teal/80 cursor-pointer"
              >
                ✓ Yes
              </button>
              <button
                onClick={() => handleFreshnessVerification(false)}
                className="px-3.5 py-1.5 rounded-xl bg-brand-coral text-white font-semibold text-xs transition-all hover:bg-brand-coral/80 cursor-pointer"
              >
                ✗ No
              </button>
            </div>
          </div>
        </div>

        {/* Primary & Secondary Action CTAs */}
        <div className="flex flex-col gap-2 mt-2">
          <button
            onClick={() => {
              logAction(`Opening Google Maps direction to ${currentStation.name}`);
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${currentStation.latitude},${currentStation.longitude}`, '_blank');
            }}
            className="w-full bg-[#378ADD] hover:bg-blue-700 text-white font-semibold py-3 rounded-2xl shadow-xl font-display cursor-pointer"
          >
            🗺️ Get directions
          </button>
          <button
            onClick={() => navigateTo('06_Rate_Step1', 'push-up')}
            className="w-full bg-brand-coral hover:bg-coral-600 text-white font-semibold py-3 rounded-2xl shadow-xl font-display cursor-pointer"
          >
            ⭐ Rate this station
          </button>
        </div>

        {/* Reviews List */}
        <div className="flex flex-col gap-3 mt-4 border-t border-slate-800/40 pt-4">
          <h3 className="font-display font-semibold text-sm">Recent Driver Logs</h3>
          <div className="flex flex-col gap-3">
            {currentStation.reviews.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-4">No log reviews yet. Be the first!</p>
            ) : (
              currentStation.reviews.map((rev) => (
                <div key={rev.id} className={`p-3 rounded-2xl ${cardTheme}`}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-brand-teal/10 rounded-full flex items-center justify-center text-[10px] font-bold text-brand-teal border border-brand-teal/20">
                        {rev.avatarInitials}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold">{rev.username}</h4>
                        <p className="text-[9px] text-slate-500">{rev.timestamp}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-brand-teal font-mono">
                      {rev.score}★
                    </span>
                  </div>
                  <p className="text-xs font-light leading-relaxed mt-1 text-slate-300">
                    {rev.text}
                  </p>

                  {/* Helpfulness Vote control */}
                  <div className="flex items-center justify-end gap-1.5 mt-2 border-t border-slate-800/20 pt-1.5">
                    <span className="text-[9px] text-slate-500 mr-2">Helpful?</span>
                    <button
                      onClick={() => toggleHelpfulVote(rev.id, 'up')}
                      className={`p-1 rounded text-xs leading-none transition-all ${
                        rev.userVoted === 'up' ? 'text-teal-400 bg-teal-500/10' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      ▲
                    </button>
                    <span className="text-[10px] font-semibold text-slate-400 font-mono">
                      {rev.helpfulCount}
                    </span>
                    <button
                      onClick={() => toggleHelpfulVote(rev.id, 'down')}
                      className={`p-1 rounded text-xs leading-none transition-all ${
                        rev.userVoted === 'down' ? 'text-brand-coral bg-brand-coral/10' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      ▼
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
