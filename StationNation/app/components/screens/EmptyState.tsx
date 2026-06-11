'use client';

import React from 'react';
import { ScreenRouterProps, getTheme } from '../screenProps';

export function EmptyStateScreen({
  allStations,
  selectedStationId,
  navigateTo,
  safeAtNightMode,
}: Pick<ScreenRouterProps, 'allStations' | 'selectedStationId' | 'navigateTo' | 'safeAtNightMode'>) {
  const { uiTheme, secondaryText, borderTheme } = getTheme(safeAtNightMode);
  const currentStation = allStations.find((s) => s.id === selectedStationId) || allStations[0];

  return (
    <div className={`flex-1 flex flex-col justify-between pt-[max(env(safe-area-inset-top),16px)] pb-12 ${uiTheme}`}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between border-b ${borderTheme}`}>
        <button
          onClick={() => navigateTo('03_MapHome', 'push-right')}
          className="text-slate-400 hover:text-slate-200 p-1 bg-slate-800/20 rounded-lg text-lg font-bold"
        >
          ‹ Back
        </button>
        <span className="text-xs font-bold uppercase tracking-widest text-[#378ADD]">Unrated Station</span>
        <div className="w-6" />
      </div>

      {/* Body content with vector placeholder illustration */}
      <div className="p-6 flex flex-col items-center text-center gap-6 my-auto">
        {/* Illustrative circle mapping to "no restroom photography" */}
        <div className="w-32 h-32 rounded-full bg-slate-800/40 border border-slate-700/60 flex items-center justify-center text-slate-500 shadow-inner relative overflow-hidden">
          <svg className="w-16 h-16 opacity-30 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
        </div>

        <div>
          <h1 className="text-xl font-display font-semibold">{currentStation.name}</h1>
          <p className={`text-xs mt-1.5 ${secondaryText}`}>
            📍 {currentStation.distance} • No logs recorded yet
          </p>
        </div>

        <div className="bg-[#BA7517]/5 border border-[#BA7517]/20 p-4 rounded-2xl w-full text-left">
          <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wide mb-1">
            🌟 Early Bird Bonus!
          </h4>
          <p className="text-[11px] text-slate-300 leading-relaxed font-light">
            Earn double points (<strong className="text-white font-semibold">+20 pts</strong>) for submitting the first restroom score in this area!
          </p>
        </div>

        <button
          onClick={() => navigateTo('06_Rate_Step1', 'push-up')}
          className="w-full bg-brand-coral hover:bg-coral-600 text-white font-semibold py-3 rounded-2xl shadow-xl font-display cursor-pointer"
        >
          Be the first to rate this stop
        </button>
      </div>
    </div>
  );
}
