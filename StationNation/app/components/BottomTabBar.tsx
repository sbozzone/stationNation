'use client';

import React from 'react';
import { ScreenId, TransitionType } from '../types';

// Bottom tab bar reusable component inside phone (56px size)
export function BottomTabBar({ activeTab, navigateTo }: { activeTab: 'map' | 'profile'; navigateTo: (screen: ScreenId, transition: TransitionType) => void }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-10 z-[990]" style={{ paddingBottom: 'env(safe-area-inset-bottom)', minHeight: '56px' }}>
      {/* Map Tab */}
      <button
        onClick={() => navigateTo('03_MapHome', 'instant')}
        className={`flex flex-col items-center gap-0.5 transition-all text-xs font-bold ${
          activeTab === 'map' ? 'text-[#378ADD]' : 'text-slate-500 hover:text-slate-400'
        }`}
      >
        <span>🗺️</span>
        <span className="text-[10px]">Map</span>
      </button>

      {/* Raised Central Rate Tab (raised circle) */}
      <div className="relative -top-4">
        <button
          onClick={() => navigateTo('06_Rate_Step1', 'push-up')}
          className="w-14 h-14 bg-brand-coral text-white rounded-full flex items-center justify-center font-bold text-lg shadow-xl shadow-red-950/40 hover:scale-105 active:scale-95 transition-all border border-red-500/20"
        >
          ⭐
        </button>
        <span className="absolute -bottom-4.5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-400 tracking-wider">
          RATE
        </span>
      </div>

      {/* Profile Tab */}
      <button
        onClick={() => navigateTo('09_Profile', 'instant')}
        className={`flex flex-col items-center gap-0.5 transition-all text-xs font-bold ${
          activeTab === 'profile' ? 'text-[#378ADD]' : 'text-slate-500 hover:text-slate-400'
        }`}
      >
        <span>👤</span>
        <span className="text-[10px]">Profile</span>
      </button>
    </div>
  );
}
