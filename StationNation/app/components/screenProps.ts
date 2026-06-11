import React from 'react';
import { ScreenId, Station, TransitionType } from '../types';
import { RecentActivityEntry } from '../profile';
import { GeoCoords } from '../useGeolocation';

// Shared props interface used by DeviceScreenRouter and all screen components
export interface ScreenRouterProps {
  activeScreen: ScreenId;
  prevScreen: ScreenId | null;
  transitionType: string;
  stations: Station[];
  allStations: Station[];
  selectedStationId: string;
  setSelectedStationId: (id: string) => void;
  navigateTo: (screen: ScreenId, transition: TransitionType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilters: string[];
  setActiveFilters: React.Dispatch<React.SetStateAction<string[]>>;
  safeAtNightMode: boolean;
  user: {
    username: string;
    points: number;
    streak: number;
    stationsRated: number;
    peopleHelped: number;
    createdAt?: string;
    recentActivity: RecentActivityEntry[];
  };
  setUsername: (name: string) => void;
  reviewerRank: { rank: number; total: number } | null;
  settingsDisplayName: string;
  setSettingsDisplayName: (name: string) => void;
  settingsResetArmed: boolean;
  setSettingsResetArmed: (armed: boolean) => void;
  setShowToast: (show: boolean) => void;
  setToastMessage: (msg: string) => void;
  onboardingNickname: string;
  setOnboardingNickname: (name: string) => void;
  handleRatingVote: (isClean: boolean) => void;
  tempRatingScore: number | null;
  setTempRatingScore: (score: number | null) => void;
  tempRatingTags: string[];
  setTempRatingTags: React.Dispatch<React.SetStateAction<string[]>>;
  tempRatingNotes: string;
  setTempRatingNotes: (notes: string) => void;
  tempRatingPhoto: boolean;
  setTempRatingPhoto: (photo: boolean) => void;
  handleSubmitDetailedRating: () => void;
  resetRatingFlow: () => void;
  toggleHelpfulVote: (reviewId: string, direction: 'up' | 'down') => void;
  handleFreshnessVerification: (stillClean: boolean) => void;
  showToast: boolean;
  toastMessage: string;
  mapRecenterTrigger: number;
  setMapRecenterTrigger: React.Dispatch<React.SetStateAction<number>>;
  logAction: (msg: string) => void;
  userCoords: GeoCoords | null;
  geoStatus: string;
  requestLocation: () => void;
}

// Theme helpers derived from safeAtNightMode — shared across screens
export function getTheme(safeAtNightMode: boolean) {
  const uiTheme = safeAtNightMode
    ? 'bg-[#1B2A4A] text-slate-100'
    : 'bg-[#F7F5F0] text-neutral-900';

  const cardTheme = safeAtNightMode
    ? 'bg-[#23355c] border border-slate-700/60 text-slate-200'
    : 'bg-white border border-neutral-300 text-neutral-900';

  const secondaryText = safeAtNightMode ? 'text-slate-400' : 'text-neutral-600';
  const borderTheme = safeAtNightMode ? 'border-slate-800' : 'border-neutral-200';

  return { uiTheme, cardTheme, secondaryText, borderTheme };
}
