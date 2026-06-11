'use client';

import React from 'react';
import { ScreenRouterProps, getTheme } from '../screenProps';

export function FilterSheetScreen({
  navigateTo,
  activeFilters,
  setActiveFilters,
  safeAtNightMode,
}: Pick<ScreenRouterProps, 'navigateTo' | 'activeFilters' | 'setActiveFilters' | 'safeAtNightMode'>) {
  const { cardTheme, secondaryText, borderTheme } = getTheme(safeAtNightMode);

  return (
    <div className={`flex-1 flex flex-col justify-end bg-black/60 h-full w-full z-50`}>
      {/* Draggable bottom-sheet half modal */}
      <div className={`w-full rounded-t-3xl p-5 ${cardTheme} border-t ${borderTheme} flex flex-col gap-6 shadow-2xl pb-12`}>
        {/* Grab handle */}
        <div className="w-12 h-1 bg-slate-500/40 rounded-full mx-auto" />

        <div className="flex justify-between items-center border-b pb-3 border-slate-800">
          <h2 className="text-xl font-display font-semibold">Filters</h2>
          <button
            onClick={() => navigateTo('03_MapHome', 'push-right')}
            className="text-slate-400 hover:text-slate-200 text-xl font-bold"
          >
            ✗
          </button>
        </div>

        {/* Filter Toggle List */}
        <div className="flex flex-col gap-4">
          {[
            { id: 'Safe at night', label: 'Safe at Night', desc: 'Hides stops rated gross' },
            { id: 'Restroom indoor', label: 'Indoor Entrance Only', desc: 'Inside building lobby, not around the back' },
          ].map((opt) => {
            const active = activeFilters.includes(opt.id);
            return (
              <div key={opt.id} className="flex justify-between items-center bg-[#070a13]/30 p-3 rounded-2xl">
                <div>
                  <h4 className="text-sm font-semibold">{opt.label}</h4>
                  <p className={`text-[11px] ${secondaryText}`}>{opt.desc}</p>
                </div>
                <button
                  onClick={() => {
                    setActiveFilters((prev) =>
                      prev.includes(opt.id) ? prev.filter((f) => f !== opt.id) : [...prev, opt.id]
                    );
                  }}
                  className={`w-11 h-6 rounded-full transition-all relative ${
                    active ? 'bg-brand-teal' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-4.5 h-4.5 bg-white rounded-full absolute top-[3px] transition-all shadow ${
                    active ? 'right-[4px]' : 'left-[4px]'
                  }`} />
                </button>
              </div>
            );
          })}

          {/* Segmented control for Cleanliness */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-400">Minimum cleanliness tier</span>
            <div className="grid grid-cols-3 gap-2 bg-[#070a13]/55 p-1 rounded-xl">
              {['Any', '3.0★+', '4.0★+'].map((tier) => {
                const isSelected =
                  (tier === 'Any' && !activeFilters.includes('Clean 3★+') && !activeFilters.includes('Clean 4★+')) ||
                  (tier === '3.0★+' && activeFilters.includes('Clean 3★+') && !activeFilters.includes('Clean 4★+')) ||
                  (tier === '4.0★+' && activeFilters.includes('Clean 4★+'));
                return (
                  <button
                    key={tier}
                    onClick={() => {
                      if (tier === '3.0★+') {
                        setActiveFilters((prev) => [
                          ...prev.filter((f) => f !== 'Clean 3★+' && f !== 'Clean 4★+'),
                          'Clean 3★+',
                        ]);
                      } else if (tier === '4.0★+') {
                        setActiveFilters((prev) => [
                          ...prev.filter((f) => f !== 'Clean 3★+' && f !== 'Clean 4★+'),
                          'Clean 4★+',
                        ]);
                      } else {
                        setActiveFilters((prev) => prev.filter((f) => f !== 'Clean 3★+' && f !== 'Clean 4★+'));
                      }
                    }}
                    className={`py-1.5 text-xs rounded-lg font-medium transition-all ${
                      isSelected ? 'bg-brand-teal text-white shadow-sm' : 'text-slate-400'
                    }`}
                  >
                    {tier}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Disabled future filter Phase 2 */}
          <div className="flex justify-between items-center opacity-40 bg-[#070a13]/30 p-3 rounded-2xl">
            <div>
              <h4 className="text-sm font-semibold">Baby Changing Table <span className="text-[10px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded">Phase 2</span></h4>
              <p className={`text-[11px] ${secondaryText}`}>Includes toddler safety seat loops</p>
            </div>
            <div className="w-11 h-6 rounded-full bg-slate-800 relative cursor-not-allowed">
              <div className="w-4.5 h-4.5 bg-slate-600 rounded-full absolute top-[3px] left-[4px]" />
            </div>
          </div>
        </div>

        <button
          onClick={() => navigateTo('03_MapHome', 'push-right')}
          className="w-full bg-[#378ADD] hover:bg-blue-700 text-white font-semibold py-3 rounded-2xl shadow-xl font-display cursor-pointer mt-4"
        >
          Show results
        </button>
      </div>
    </div>
  );
}
