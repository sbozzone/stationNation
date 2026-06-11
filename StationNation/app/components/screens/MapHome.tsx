'use client';

import React from 'react';
import { ScreenRouterProps, getTheme } from '../screenProps';
import { BottomTabBar } from '../BottomTabBar';
import { GameMapSVG } from '../GameMapSVG';

export function MapHomeScreen({
  stations,
  selectedStationId,
  setSelectedStationId,
  navigateTo,
  searchQuery,
  setSearchQuery,
  activeFilters,
  setActiveFilters,
  safeAtNightMode,
  mapRecenterTrigger,
  setMapRecenterTrigger,
  logAction,
  userCoords,
  geoStatus,
}: Pick<
  ScreenRouterProps,
  | 'stations'
  | 'selectedStationId'
  | 'setSelectedStationId'
  | 'navigateTo'
  | 'searchQuery'
  | 'setSearchQuery'
  | 'activeFilters'
  | 'setActiveFilters'
  | 'safeAtNightMode'
  | 'mapRecenterTrigger'
  | 'setMapRecenterTrigger'
  | 'logAction'
  | 'userCoords'
  | 'geoStatus'
>) {
  const { uiTheme, cardTheme, secondaryText, borderTheme } = getTheme(safeAtNightMode);

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden ${uiTheme}`}>
      {/* Top Search Bar (y≈59) */}
      <div className={`p-4 pt-[max(env(safe-area-inset-top),16px)] flex flex-col gap-2.5 z-10 ${borderTheme} border-b ${safeAtNightMode ? 'bg-[#1B2A4A]/90' : 'bg-white/95'} backdrop-blur`}>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full text-sm pl-9 pr-4 py-2 rounded-xl border outline-none font-sans transition-all ${
              safeAtNightMode
                ? 'bg-[#23355c] border-slate-700 text-white focus:border-slate-500'
                : 'bg-white border-neutral-300 text-neutral-900 focus:border-neutral-500'
            }`}
          />
        </div>

        {/* Filter chips horizontal scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
          {['Safe at night', 'Clean 4★+', 'Restroom indoor'].map((filter) => {
            const isActive = activeFilters.includes(filter);
            return (
              <button
                key={filter}
                onClick={() => {
                  if (filter === 'Safe at night') {
                    // Safe at night switches modal as trigger or toggles
                    // Spec: "03 filter chip -> 04_FilterSheet"
                    navigateTo('04_FilterSheet', 'push-up');
                  } else {
                    setActiveFilters((prev) =>
                      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
                    );
                  }
                }}
                className={`whitespace-nowrap px-3 py-1 rounded-full text-xs border font-medium transition-all ${
                  isActive
                    ? 'bg-[#378ADD] border-[#378ADD] text-white shadow-sm'
                    : safeAtNightMode
                      ? 'bg-[#1B2A4A] border-slate-700 text-slate-300 hover:bg-[#23355c]'
                      : 'bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Region (y≈143 -> ~620) */}
      <div className="flex-1 relative bg-[#e2dec9] overflow-hidden">
        {/* Friendly Game Board stylized map design */}
        <GameMapSVG stations={stations} selectedStationId={selectedStationId} onPinSelect={setSelectedStationId} mapRecenterTrigger={mapRecenterTrigger} userCoords={userCoords} />

        {/* Floating Recenter Button bottom-right */}
        <button
          onClick={() => {
            setMapRecenterTrigger(prev => prev + 1);
            logAction('Recentered map home viewport');
          }}
          className={`absolute bottom-32 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg border transition-all ${
            safeAtNightMode ? 'bg-[#23355c] border-slate-700 text-white' : 'bg-white border-neutral-300 text-neutral-800'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
        </button>
      </div>

      {/* Bottom Sheet Peek Container (White or night ink) */}
      <div className={`w-full rounded-t-3xl border-t border-r border-l ${borderTheme} ${cardTheme} shadow-2xl p-4 pb-20 relative z-20`}>
        {/* Drag Grab handle */}
        <div className="w-12 h-1 bg-slate-500/40 rounded-full mx-auto mb-3" />
        <h3 className="text-sm font-display font-semibold tracking-tight text-slate-400 mb-2 uppercase tracking-widest text-center">
          Nearest clean stops
        </h3>
        {(geoStatus === 'denied' || geoStatus === 'unavailable') && (
          <p className="text-[10px] text-slate-500 text-center mb-2 italic">
            Enable location for real distances
          </p>
        )}

        {/* List cards (visible at peek) */}
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
          {stations.slice(0, 2).map((st) => (
            <div
              key={st.id}
              onClick={() => {
                setSelectedStationId(st.id);
                navigateTo(st.cleanlinessTier === 'unrated' ? '10_EmptyState' : '05_StationDetail', 'push-up');
              }}
              className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                selectedStationId === st.id
                  ? safeAtNightMode ? 'bg-[#2a3e6b] border-[#378ADD]' : 'bg-[#1D9E75]/10 border-[#1D9E75]'
                  : safeAtNightMode ? 'bg-[#1c2a49]/40 border-slate-800 hover:bg-[#203055]/50' : 'bg-neutral-100/80 border-transparent hover:bg-neutral-100'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-display font-semibold text-sm truncate max-w-[200px]">
                    {st.name}
                  </h4>
                  <p className={`text-[11px] mt-0.5 flex items-center gap-1.5 ${secondaryText}`}>
                    <span>📍 {st.distance}</span>
                    <span>•</span>
                    <span className="truncate max-w-[130px] font-medium text-[#378ADD]">
                      {st.safetyBadges[0]}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm ${
                    st.cleanlinessTier === 'clean' ? 'bg-[#1D9E75]' :
                    st.cleanlinessTier === 'mixed' ? 'bg-[#BA7517]' :
                    st.cleanlinessTier === 'gross' ? 'bg-[#E24B4A]' :
                    'bg-slate-600 border border-dashed border-slate-400'
                  }`}>
                    {st.score > 0 ? `${st.score}★` : 'UNRATED'}
                  </span>
                  <span className={`text-[10px] mt-1 italic ${
                    st.freshnessHours > 12 ? 'text-amber-500 font-medium' : secondaryText
                  }`}>
                    {st.freshnessHours > 0 ? `Confirmed ${st.freshnessHours}h ago` : 'Confirmed clean now'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Tab Bar (Fixed height 56px sits above bottom indicator) */}
      <BottomTabBar activeTab="map" navigateTo={navigateTo} />
    </div>
  );
}
