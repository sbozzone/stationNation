'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ScreenId, Station, CleanlinessTier, SafetyBadge, Review, TransitionType } from './types';
import { mockStations } from './mockData';

// Confetti particle generator helper
interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  angle: number;
  speed: number;
  size: number;
  rotation: number;
}

export default function Home() {
  // Live State
  const [stations, setStations] = useState<Station[]>(mockStations);
  const [activeScreen, setActiveScreen] = useState<ScreenId>('00_Splash');
  const [prevScreen, setPrevScreen] = useState<ScreenId | null>(null);
  const [transitionType, setTransitionType] = useState<TransitionType>('instant');
  const [selectedStationId, setSelectedStationId] = useState<string>('chevron-valley');
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<string[]>(['Safe at night']);
  const [showFiltersModal, setShowFiltersModal] = useState<boolean>(false);
  
  // Rating Flow State
  const [tempRatingScore, setTempRatingScore] = useState<number | null>(null); // 5 for clean, 1.5 for gross
  const [tempRatingTags, setTempRatingTags] = useState<string[]>([]);
  const [tempRatingNotes, setTempRatingNotes] = useState<string>('');
  const [tempRatingPhoto, setTempRatingPhoto] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  
  // User Profile State
  const [username, setUsername] = useState<string>('DriverAlpha');
  const [points, setPoints] = useState<number>(1240);
  const [streak, setStreak] = useState<number>(3);
  const [stationsRated, setStationsRated] = useState<number>(47);
  const [peopleHelped, setPeopleHelped] = useState<number>(132);
  const [cityRank, setCityRank] = useState<number>(3);
  
  // Simulator Controls State
  const [safeAtNightMode, setSafeAtNightMode] = useState<boolean>(true); // Night ink background inside device
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(false);
  const [showSpecPanel, setShowSpecPanel] = useState<boolean>(true);
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const [simLog, setSimLog] = useState<string[]>([
    'System: Station Nation Simulator initialized.',
    'System: Current user: DriverAlpha · Streak: 3 days · Points: 1240.'
  ]);
  const [mapRecenterTrigger, setMapRecenterTrigger] = useState<number>(0);

  // Quick helper to log actions
  const logAction = (msg: string) => {
    setSimLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)]);
  };

  // Find active station details
  const activeStation = stations.find((s) => s.id === selectedStationId) || stations[0];

  // Transition handler to match Figma transitions
  const navigateTo = (screen: ScreenId, transition: TransitionType) => {
    setPrevScreen(activeScreen);
    setTransitionType(transition);
    setActiveScreen(screen);
    logAction(`Navigated to ${screen} (Transition: ${transition})`);
  };

  // Trigger Confetti Burst
  const triggerConfetti = () => {
    const colors = ['#1D9E75', '#D85A30', '#378ADD', '#BA7517', '#E24B4A', '#F7F5F0', '#FCD34D'];
    const newConfetti: ConfettiParticle[] = [];
    for (let i = 0; i < 40; i++) {
      newConfetti.push({
        id: Math.random() + i,
        x: 196, // center of screen width
        y: 400, // center height
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: Math.random() * 360,
        speed: 3 + Math.random() * 8,
        size: 5 + Math.random() * 8,
        rotation: Math.random() * 360,
      });
    }
    setConfetti(newConfetti);
  };

  // Animate Confetti
  useEffect(() => {
    if (confetti.length === 0) return;
    const interval = setInterval(() => {
      setConfetti((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + Math.cos((p.angle * Math.PI) / 180) * p.speed,
            y: p.y + Math.sin((p.angle * Math.PI) / 180) * p.speed + 1.5, // Gravity
            speed: p.speed * 0.96, // Drag
            rotation: p.rotation + 4,
          }))
          .filter((p) => p.y < 852 && p.x > 0 && p.x < 393)
      );
    }, 16);
    return () => clearInterval(interval);
  }, [confetti]);

  // Handle Clean/Gross voting action (2-Tap core)
  const handleRatingVote = (isClean: boolean) => {
    setTempRatingScore(isClean ? 5 : 1.5);
    logAction(`Voted restroom: ${isClean ? 'Clean (5.0★)' : 'Gross (1.5★)'}`);
    
    // Jump straight to confirm (dissolve) or to note step
    // Spec: "Tapping either button is enough to complete a rating — this is the whole MVP contribution."
    // Let's go to confirm screen directly!
    // But user can also go to note. We support both.
    // If they just click, they rated. Let's do confirmation.
    
    // Calculate new score for the station
    setStations((prevStations) =>
      prevStations.map((s) => {
        if (s.id === selectedStationId) {
          const newCount = s.ratingCount + 1;
          const currentTotalScore = s.score * s.ratingCount;
          const newAddedScore = isClean ? 5 : 1.5;
          const newAvgScore = Number(((currentTotalScore + newAddedScore) / newCount).toFixed(1));
          
          let newTier: CleanlinessTier = 'mixed';
          if (newAvgScore >= 4.0) newTier = 'clean';
          else if (newAvgScore < 2.5) newTier = 'gross';

          // Add a review
          const newReview: Review = {
            id: `rev-user-${Date.now()}`,
            username: username,
            avatarInitials: username.slice(0, 2).toUpperCase(),
            timestamp: 'Just now',
            text: isClean ? 'Confirmed clean! Fast and clean stop.' : 'Disgusting conditions, avoid if possible!',
            score: isClean ? 5 : 1.5,
            helpfulCount: 0,
          };

          return {
            ...s,
            ratingCount: newCount,
            score: newAvgScore,
            cleanlinessTier: newTier,
            freshnessHours: 0, // Reset freshness to 0 (just rated!)
            reviews: [newReview, ...s.reviews],
          };
        }
        return s;
      })
    );

    // Apply points & stats
    setPoints((p) => p + 10);
    setStreak((s) => s + 1);
    setStationsRated((sr) => sr + 1);
    setPeopleHelped((ph) => ph + 12);
    logAction('Points earned: +10 pts! Streak increased! Station score updated.');
    
    triggerConfetti();
    navigateTo('08_Rate_Confirm', 'dissolve');
  };

  // Submit Detailed Rating Flow
  const handleSubmitDetailedRating = () => {
    // Add rating details
    const isClean = tempRatingScore ? tempRatingScore >= 4 : true;
    
    setStations((prevStations) =>
      prevStations.map((s) => {
        if (s.id === selectedStationId) {
          const newCount = s.ratingCount + 1;
          const currentTotalScore = s.score * s.ratingCount;
          const newAvgScore = Number(((currentTotalScore + (tempRatingScore || 4.0)) / newCount).toFixed(1));
          
          let newTier: CleanlinessTier = 'mixed';
          if (newAvgScore >= 4.0) newTier = 'clean';
          else if (newAvgScore < 2.5) newTier = 'gross';

          const newReview: Review = {
            id: `rev-user-${Date.now()}`,
            username: username,
            avatarInitials: username.slice(0, 2).toUpperCase(),
            timestamp: 'Just now',
            text: tempRatingNotes || (isClean ? 'Clean and tidy.' : 'Needs servicing soon.'),
            score: tempRatingScore || 4,
            helpfulCount: 0,
          };

          return {
            ...s,
            ratingCount: newCount,
            score: newAvgScore,
            cleanlinessTier: newTier,
            freshnessHours: 0,
            reviews: [newReview, ...s.reviews],
          };
        }
        return s;
      })
    );

    setPoints((p) => p + 10);
    setStreak((s) => s + 1);
    setStationsRated((sr) => sr + 1);
    setPeopleHelped((ph) => ph + 12);
    logAction('Detailed review submitted! +10 pts earned.');
    
    triggerConfetti();
    navigateTo('08_Rate_Confirm', 'dissolve');
  };

  // Reset Rating states
  const resetRatingFlow = () => {
    setTempRatingScore(null);
    setTempRatingTags([]);
    setTempRatingNotes('');
    setTempRatingPhoto(false);
  };

  // Vote Review Helpfulness
  const toggleHelpfulVote = (reviewId: string, direction: 'up' | 'down') => {
    setStations((prev) =>
      prev.map((s) => {
        if (s.id === selectedStationId) {
          return {
            ...s,
            reviews: s.reviews.map((r) => {
              if (r.id === reviewId) {
                let voteDiff = 0;
                let nextVoteState: 'up' | 'down' | null = direction;

                if (r.userVoted === direction) {
                  // Undo vote
                  voteDiff = direction === 'up' ? -1 : 1;
                  nextVoteState = null;
                } else {
                  // Apply vote
                  if (r.userVoted) {
                    // Switch vote
                    voteDiff = direction === 'up' ? 2 : -2;
                  } else {
                    voteDiff = direction === 'up' ? 1 : -1;
                  }
                }

                logAction(`Voted review helpful: ${direction === 'up' ? '▲' : '▼'} (${r.helpfulCount + voteDiff})`);

                return {
                  ...r,
                  helpfulCount: r.helpfulCount + voteDiff,
                  userVoted: nextVoteState,
                };
              }
              return r;
            }),
          };
        }
        return s;
      })
    );
  };

  // Freshness ✓ / ✗ inline verification
  const handleFreshnessVerification = (stillClean: boolean) => {
    logAction(`User verified restroom is still ${stillClean ? 'CLEAN' : 'NOT CLEAN'}`);
    
    // Update freshness timestamp and add rating count
    setStations((prev) =>
      prev.map((s) => {
        if (s.id === selectedStationId) {
          return {
            ...s,
            freshnessHours: 0, // Reset freshness to 0 hours ago
            score: stillClean ? Math.min(5, s.score + 0.1) : Math.max(1, s.score - 0.3),
          };
        }
        return s;
      })
    );
    
    // Show validation alert
    setShowToast(true);
    setPoints((p) => p + 5); // Mini points for confirmation check
    logAction('Confirmed freshness. Earned +5 pts.');
    
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Reset entire simulator back to onboarding
  const handleResetSimulator = () => {
    setStations(mockStations);
    setSelectedStationId('chevron-valley');
    resetRatingFlow();
    setUsername('DriverAlpha');
    setPoints(1240);
    setStreak(3);
    setStationsRated(47);
    setPeopleHelped(132);
    setCityRank(3);
    setActiveScreen('01a_Intro');
    setPrevScreen(null);
    setTransitionType('dissolve');
    logAction('Simulator fully reset to Onboarding intro.');
  };

  // Filters calculation
  const filteredStations = stations.filter((station) => {
    // If search text is present
    if (searchQuery && !station.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Filter chip logic:
    // "Safe at night": requires score >= 3.5 or specific safety badges
    if (activeFilters.includes('Safe at night') && station.cleanlinessTier === 'gross') {
      return false;
    }
    // "Clean 4★+": score >= 4
    if (activeFilters.includes('Clean 4★+') && station.score < 4.0) {
      return false;
    }
    // "Restroom indoor": badge includes "Indoor entrance"
    if (activeFilters.includes('Restroom indoor') && !station.safetyBadges.includes('Indoor entrance')) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#060F24] select-none font-sans">
      {/* Ambient glow behind phone */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#1A52B5]/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Phone shell */}
      <div className="relative w-[393px] h-[852px] rounded-[48px] border-[10px] border-[#1e293b] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] bg-slate-900 overflow-hidden flex flex-col">

        {/* Dynamic Island */}
        <div className="absolute top-[11px] left-1/2 -translate-x-1/2 w-[110px] h-[30px] bg-black rounded-full z-[999]" />

        {/* Status Bar */}
        <div className={`absolute top-0 left-0 right-0 h-[59px] px-8 pt-3 flex items-center justify-between z-[998] text-xs font-semibold ${
          safeAtNightMode && activeScreen !== '01a_Intro' && activeScreen !== '01b_Location' && activeScreen !== '01c_Avatar'
            ? 'text-slate-100 bg-[#1B2A4A]/50 backdrop-blur-sm'
            : 'text-slate-900 bg-white/50 backdrop-blur-sm'
        }`}>
          <span>15:47</span>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <rect x="2" y="18" width="3" height="4" rx="0.5" />
              <rect x="7" y="14" width="3" height="8" rx="0.5" />
              <rect x="12" y="10" width="3" height="12" rx="0.5" />
              <rect x="17" y="5" width="3" height="17" rx="0.5" />
            </svg>
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 21a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm-8.8-8.8A12 12 0 0 1 12 6c3.2 0 6.2 1.3 8.3 3.4l-1.4 1.4A10 10 0 0 0 12 8a10 10 0 0 0-6.9 2.8l-1.4-1.4zm2.8 2.8A8 8 0 0 1 12 10c2.2 0 4.2.9 5.7 2.4l-1.4 1.4A6 6 0 0 0 12 12a6 6 0 0 0-4.3 1.8l-1.4-1.4z" />
            </svg>
            <div className="w-5 h-2.5 border border-current rounded-sm p-0.5 flex items-center">
              <div className="h-full w-4 bg-current rounded-2xs" />
            </div>
          </div>
        </div>

        {/* Confetti */}
        {confetti.length > 0 && (
          <div className="absolute inset-0 pointer-events-none z-[9999] overflow-hidden">
            {confetti.map((p) => (
              <div
                key={p.id}
                style={{
                  position: 'absolute',
                  left: `${p.x}px`,
                  top: `${p.y}px`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  backgroundColor: p.color,
                  transform: `rotate(${p.rotation}deg)`,
                  borderRadius: p.id % 3 === 0 ? '50%' : '2px',
                  opacity: 0.85,
                }}
              />
            ))}
          </div>
        )}

        {/* Screen content */}
        <div className="flex-1 flex flex-col relative h-full">
          <DeviceScreenRouter
            activeScreen={activeScreen}
            prevScreen={prevScreen}
            transitionType={transitionType}
            stations={filteredStations}
            allStations={stations}
            selectedStationId={selectedStationId}
            setSelectedStationId={(id) => {
              setSelectedStationId(id);
              const st = stations.find(s => s.id === id);
              if (st && st.cleanlinessTier === 'unrated') {
                navigateTo('10_EmptyState', 'push-up');
              } else {
                navigateTo('05_StationDetail', 'push-up');
              }
            }}
            navigateTo={navigateTo}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeFilters={activeFilters}
            setActiveFilters={setActiveFilters}
            showFiltersModal={showFiltersModal}
            setShowFiltersModal={setShowFiltersModal}
            safeAtNightMode={safeAtNightMode}
            user={{ username, points, streak, stationsRated, peopleHelped, cityRank }}
            setUsername={setUsername}
            handleRatingVote={handleRatingVote}
            tempRatingTags={tempRatingTags}
            setTempRatingTags={setTempRatingTags}
            tempRatingNotes={tempRatingNotes}
            setTempRatingNotes={setTempRatingNotes}
            tempRatingPhoto={tempRatingPhoto}
            setTempRatingPhoto={setTempRatingPhoto}
            handleSubmitDetailedRating={handleSubmitDetailedRating}
            resetRatingFlow={resetRatingFlow}
            toggleHelpfulVote={toggleHelpfulVote}
            handleFreshnessVerification={handleFreshnessVerification}
            showToast={showToast}
            mapRecenterTrigger={mapRecenterTrigger}
            setMapRecenterTrigger={setMapRecenterTrigger}
            logAction={logAction}
          />
        </div>

        {/* Bottom Home Indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-[34px] z-[998] flex items-center justify-center pointer-events-none">
          <div className={`w-[134px] h-[5px] rounded-full ${
            safeAtNightMode && activeScreen !== '01a_Intro' && activeScreen !== '01b_Location' && activeScreen !== '01c_Avatar'
              ? 'bg-white/40'
              : 'bg-neutral-800/40'
          }`} />
        </div>

      </div>
    </div>
  );
}

// Router for Device viewport to switch screens and compile layout spec details
interface ScreenRouterProps {
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
  showFiltersModal: boolean;
  setShowFiltersModal: (show: boolean) => void;
  safeAtNightMode: boolean;
  user: {
    username: string;
    points: number;
    streak: number;
    stationsRated: number;
    peopleHelped: number;
    cityRank: number;
  };
  setUsername: (name: string) => void;
  handleRatingVote: (isClean: boolean) => void;
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
  mapRecenterTrigger: number;
  setMapRecenterTrigger: React.Dispatch<React.SetStateAction<number>>;
  logAction: (msg: string) => void;
}

function DeviceScreenRouter({
  activeScreen,
  stations,
  allStations,
  selectedStationId,
  setSelectedStationId,
  navigateTo,
  searchQuery,
  setSearchQuery,
  activeFilters,
  setActiveFilters,
  showFiltersModal,
  setShowFiltersModal,
  safeAtNightMode,
  user,
  setUsername,
  handleRatingVote,
  tempRatingTags,
  setTempRatingTags,
  tempRatingNotes,
  setTempRatingNotes,
  tempRatingPhoto,
  setTempRatingPhoto,
  handleSubmitDetailedRating,
  resetRatingFlow,
  toggleHelpfulVote,
  handleFreshnessVerification,
  showToast,
  mapRecenterTrigger,
  setMapRecenterTrigger,
  logAction,
}: ScreenRouterProps) {
  
  // Quick Tag toggle helper
  const toggleQuickTag = (tag: string) => {
    setTempRatingTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const currentStation = allStations.find((s) => s.id === selectedStationId) || allStations[0];

  // Helper theme classes inside phone simulator
  const uiTheme = safeAtNightMode
    ? 'bg-[#1B2A4A] text-slate-100' // Night Ink palette
    : 'bg-[#F7F5F0] text-neutral-900'; // Off-white palette

  const cardTheme = safeAtNightMode
    ? 'bg-[#23355c] border border-slate-700/60 text-slate-200'
    : 'bg-white border border-neutral-300 text-neutral-900';

  const secondaryText = safeAtNightMode ? 'text-slate-400' : 'text-neutral-600';
  const borderTheme = safeAtNightMode ? 'border-slate-800' : 'border-neutral-200';

  switch (activeScreen) {
    // SPLASH SCREEN 00
    case '00_Splash':
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

    // ONBOARDING 01a INTRO
    case '01a_Intro':
      return (
        <div className="flex-1 flex flex-col justify-between bg-gradient-to-b from-[#1D9E75] to-[#1B2A4A] p-6 text-white pt-24 pb-12 select-none h-full">
          <div className="flex flex-col items-center text-center mt-12">
            {/* Logo placeholder */}
            <div className="w-20 h-20 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center shadow-2xl mb-8">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-9-4.5h.008v.008H3V6.75zm.008 9h.008v.008H3v-.008zm0 2.25h.008v.008H3v-.008zM4.5 20.25h15A2.25 2.25 0 0021.75 18V6A2.25 2.25 0 0019.5 3.75h-15A2.25 2.25 0 002.25 6v12A2.25 2.25 0 004.5 20.25zm2.25-13.5h.008v.008H6.75V6.75zm.008 4.5h.008v.008H6.75v-.008zm0 4.5h.008v.008H6.75v-.008z" />
              </svg>
            </div>
            <h1 className="text-3xl font-display font-semibold tracking-tight leading-tight">
              Station Nation
            </h1>
            <p className="text-sm font-light text-slate-200 max-w-xs mt-3">
              Find the cleanest, safest stop. Confirmed by drivers in real-time.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1 items-center bg-[#17243c]/40 backdrop-blur border border-white/10 p-4 rounded-2xl">
              <span className="text-xs text-brand-coral font-bold uppercase tracking-wider">🌟 Clean Loop MVP</span>
              <p className="text-[11px] text-slate-300 text-center font-light leading-4">
                Designed to guide solo drivers, parents, and travelers to high-quality rest stops, quickly.
              </p>
            </div>
            <button
              onClick={() => navigateTo('01b_Location', 'push-left')}
              className="w-full bg-[#1D9E75] hover:bg-[#15825f] text-white font-semibold py-3 rounded-2xl shadow-xl transition-all font-display text-center cursor-pointer min-h-[48px]"
            >
              Get started
            </button>
          </div>
        </div>
      );

    // ONBOARDING 01b LOCATION
    case '01b_Location':
      return (
        <div className="flex-1 flex flex-col justify-between bg-slate-900 p-6 text-white pt-24 pb-12 h-full">
          <div className="flex flex-col items-center text-center mt-12">
            <div className="w-16 h-16 bg-[#378ADD]/20 rounded-full flex items-center justify-center text-[#378ADD] mb-6">
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
              onClick={() => navigateTo('01c_Avatar', 'push-left')}
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

    // ONBOARDING 01c AVATAR
    case '01c_Avatar':
      return (
        <div className="flex-1 flex flex-col justify-between bg-slate-900 p-6 text-white pt-24 pb-12 h-full">
          <div className="flex flex-col items-center mt-6">
            <span className="text-xs font-semibold text-brand-teal uppercase tracking-widest mb-2">Step 3 of 3</span>
            <h2 className="text-2xl font-display font-semibold text-slate-100 text-center mb-6">
              Create your profile
            </h2>
            
            {/* Pick Avatar Placeholder */}
            <div className="relative group mb-6">
              <div className="w-24 h-24 bg-[#D85A30]/10 border-2 border-brand-coral text-brand-coral rounded-full flex items-center justify-center font-display text-3xl font-bold uppercase shadow-lg shadow-coral-950/20">
                {user.username ? user.username.slice(0, 2).toUpperCase() : 'DA'}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-slate-800 text-slate-300 p-1.5 rounded-full border border-slate-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </div>
            </div>
            
            <div className="w-full flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Choose your username</label>
              <input
                type="text"
                value={user.username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full bg-slate-800 text-white font-sans text-base px-4 py-3 rounded-2xl border border-slate-700 outline-none focus:border-brand-teal transition-all shadow-inner"
              />
              <span className="text-xs text-slate-500 font-light italic mt-1">
                🔒 Your real name stays private to protect safety.
              </span>
            </div>
          </div>

          <button
            onClick={() => navigateTo('03_MapHome', 'dissolve')}
            className="w-full bg-[#1D9E75] hover:bg-[#15825f] text-white font-semibold py-3 rounded-2xl shadow-xl font-display cursor-pointer"
          >
            Start exploring
          </button>
        </div>
      );

    // MAP HOME 03
    case '03_MapHome':
      return (
        <div className={`flex-1 flex flex-col h-full overflow-hidden ${uiTheme}`}>
          {/* Top Search Bar (y≈59) */}
          <div className={`p-4 pt-16 flex flex-col gap-2.5 z-10 ${borderTheme} border-b ${safeAtNightMode ? 'bg-[#1B2A4A]/90' : 'bg-white/95'} backdrop-blur`}>
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
              {['Safe at night', 'Open now', 'Clean 4★+', 'Restroom indoor'].map((filter) => {
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
            <GameMapSVG stations={stations} selectedStationId={selectedStationId} onPinSelect={setSelectedStationId} mapRecenterTrigger={mapRecenterTrigger} />

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

    // FILTER SHEET 04
    case '04_FilterSheet':
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
                { id: 'Safe at night', label: 'Safe at Night', desc: 'Restroom rating ≥ 3.5 & well-lit lot' },
                { id: 'Open now', label: 'Open Now', desc: 'Active 24/7 service stations' },
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
                    const isSelected = (tier === 'Any' && !activeFilters.includes('Clean 4★+')) ||
                                      (tier === '4.0★+' && activeFilters.includes('Clean 4★+'));
                    return (
                      <button
                        key={tier}
                        onClick={() => {
                          if (tier === '4.0★+') {
                            if (!activeFilters.includes('Clean 4★+')) {
                              setActiveFilters([...activeFilters, 'Clean 4★+']);
                            }
                          } else {
                            setActiveFilters(activeFilters.filter((f) => f !== 'Clean 4★+'));
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

    // STATION DETAIL 05
    case '05_StationDetail':
      return (
        <div className={`flex-1 flex flex-col h-full overflow-y-auto pt-16 pb-12 ${uiTheme}`}>
          
          {/* Refreshness success Toast */}
          {showToast && (
            <div className="absolute top-20 left-4 right-4 bg-brand-teal border border-teal-500/20 text-white px-4 py-2.5 rounded-2xl flex items-center gap-2 animate-toast z-[9999] shadow-lg">
              <svg className="w-5 h-5 shrink-0 animate-ping" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs font-semibold">
                Verification logged! +5 pts added to rank.
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
                <span>•</span>
                <span className="text-green-500 font-semibold">Open Now</span>
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
                  window.open(`https://maps.google.com/?q=${encodeURIComponent(currentStation.name)}`, '_blank');
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

    // RATE STEP 1: Two-tap core loop (06)
    case '06_Rate_Step1':
      return (
        <div className={`flex-1 flex flex-col justify-between p-6 pt-24 pb-12 ${uiTheme}`}>
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
                  Good soap & paper
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

    // RATE STEP 2: Optional details (07)
    case '07_Rate_Step2':
      return (
        <div className={`flex-1 flex flex-col justify-between p-5 pt-16 pb-10 ${uiTheme}`}>
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
              className="w-full bg-[#1D9E75] hover:bg-[#15825f] text-white font-semibold py-3 rounded-2xl shadow-xl font-display cursor-pointer"
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

    // RATE CONFIRM 08 (Confetti overlay, Streak + points tick up)
    case '08_Rate_Confirm':
      return (
        <div className={`flex-1 flex flex-col justify-between p-6 pt-24 pb-12 ${uiTheme}`}>
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
                You are currently <strong className="text-brand-teal font-semibold">#{user.cityRank} in Avon</strong>!
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

    // PROFILE 09
    case '09_Profile':
      return (
        <div className={`flex-1 flex flex-col justify-between pt-16 pb-12 overflow-y-auto ${uiTheme}`}>
          <div className="p-4 flex flex-col gap-6">
            
            {/* User Profile Header */}
            <div className="flex items-center gap-4 border-b border-slate-800/40 pb-4">
              <div className="w-16 h-16 bg-brand-coral/10 border border-brand-coral text-brand-coral rounded-full flex items-center justify-center font-display text-2xl font-bold uppercase shadow">
                {user.username.slice(0, 2)}
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold">{user.username}</h2>
                <p className="text-xs text-slate-500 font-light">Member since June 2026</p>
              </div>
            </div>

            {/* Stat Grid 2x2 Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Points', val: `${user.points} pts`, icon: '💎' },
                { label: 'City Rank', val: `#${user.cityRank} Avon`, icon: '🏆' },
                { label: 'Stations Rated', val: `${user.stationsRated} stops`, icon: '⭐' },
                { label: 'People Helped', val: `${user.peopleHelped} drivers`, icon: '🤝' },
              ].map((stat) => (
                <div key={stat.label} className={`p-3 rounded-2xl ${cardTheme}`}>
                  <span className="text-sm">{stat.icon}</span>
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
                    {stat.label}
                  </h4>
                  <p className="text-base font-display font-extrabold text-slate-100 mt-0.5">
                    {stat.val}
                  </p>
                </div>
              ))}
            </div>

            {/* Achievement Badges Row */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-slate-400">Achievement Badges</h3>
              <div className="flex gap-2 overflow-x-auto pb-1 select-none">
                {[
                  { name: 'Night Owl', unlocked: true, icon: '🦉', desc: 'Rated 5 stations after dark' },
                  { name: 'Loo Legend', unlocked: true, icon: '👑', desc: 'Rated 25+ total stations' },
                  { name: 'Avon Hero', unlocked: false, icon: '🛡️', desc: 'Be the top rater in Avon' },
                ].map((badge) => (
                  <div
                    key={badge.name}
                    title={badge.desc}
                    className={`flex items-center gap-2 p-2 rounded-xl shrink-0 border ${
                      badge.unlocked
                        ? 'bg-brand-teal/10 border-brand-teal/30 text-teal-300'
                        : 'bg-slate-800/10 border-slate-700/50 text-slate-500 opacity-60'
                    }`}
                  >
                    <span className="text-sm">{badge.icon}</span>
                    <span className="text-[10px] font-bold">{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent activity log list */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-slate-400">Your Recent Logs</h3>
              <div className="flex flex-col gap-2">
                <div className={`p-3 rounded-xl text-xs font-light ${cardTheme}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold">Chevron — Valley Boulevard</span>
                    <span className="text-teal-400 font-bold font-mono">5.0★</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Verified clean restroom. Great well-lit parking lot.</p>
                  <span className="text-[9px] text-slate-500 mt-1 block">Rated 2h ago</span>
                </div>
              </div>
            </div>

            {/* Settings link */}
            <button
              onClick={() => logAction('Clicked Settings profile settings')}
              className="text-xs text-slate-400 hover:text-slate-200 text-center underline font-medium mt-2"
            >
              Configure Settings & Profile Privacy
            </button>
          </div>

          {/* Bottom navigation fixed tab */}
          <BottomTabBar activeTab="profile" navigateTo={navigateTo} />
        </div>
      );

    // EMPTY STATE: Unrated Station (10)
    case '10_EmptyState':
      return (
        <div className={`flex-1 flex flex-col justify-between pt-16 pb-12 ${uiTheme}`}>
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

    default:
      return null;
  }
}

// Bottom tab bar reusable component inside phone (56px size)
function BottomTabBar({ activeTab, navigateTo }: { activeTab: 'map' | 'profile'; navigateTo: any }) {
  return (
    <div className="absolute bottom-[34px] left-0 right-0 h-[56px] bg-slate-900 border-t border-slate-800 flex items-center justify-between px-10 z-[990]">
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

// Custom vector stylized game-board map simulator using SVG
function GameMapSVG({
  stations,
  selectedStationId,
  onPinSelect,
  mapRecenterTrigger,
}: {
  stations: Station[];
  selectedStationId: string;
  onPinSelect: (id: string) => void;
  mapRecenterTrigger: number;
}) {
  const [mapScale, setMapScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // Recenter map animation
  useEffect(() => {
    setMapScale(1);
    setPanX(0);
    setPanY(0);
  }, [mapRecenterTrigger]);

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing select-none overflow-hidden bg-[#E5E1D3]">
      <svg
        className="w-full h-full transform transition-all duration-500 ease-out"
        style={{
          transform: `scale(${mapScale}) translate(${panX}px, ${panY}px)`,
        }}
        viewBox="0 0 361 477"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* River background styling */}
        <path
          d="M-20 200 Q 100 220 180 310 T 380 320"
          fill="none"
          stroke="#93C5FD"
          strokeWidth="35"
          strokeLinecap="round"
          opacity="0.85"
        />
        
        {/* Winding pathways / roads */}
        {/* Road 1: Valley Blvd */}
        <line x1="-10" y1="120" x2="380" y2="120" stroke="#FAF8F5" strokeWidth="24" strokeLinecap="round" />
        <line x1="-10" y1="120" x2="380" y2="120" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="6,6" />
        <text x="20" y="112" fill="#9CA3AF" fontSize="8" fontWeight="bold" fontFamily="sans-serif">VALLEY BLVD</text>

        {/* Road 2: Route 9 */}
        <line x1="160" y1="-10" x2="160" y2="500" stroke="#FAF8F5" strokeWidth="20" strokeLinecap="round" />
        <line x1="160" y1="-10" x2="160" y2="500" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="6,6" />
        <text x="168" y="240" fill="#9CA3AF" fontSize="8" fontWeight="bold" transform="rotate(90 168 240)" fontFamily="sans-serif">ROUTE 9</text>

        {/* Road 3: Crossing Ave */}
        <line x1="-10" y1="360" x2="380" y2="360" stroke="#FAF8F5" strokeWidth="22" strokeLinecap="round" />
        <line x1="-10" y1="360" x2="380" y2="360" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="6,6" />
        <text x="240" y="352" fill="#9CA3AF" fontSize="8" fontWeight="bold" fontFamily="sans-serif">CROSSING AVE</text>

        {/* Green Parks / Grass board blocks */}
        <rect x="20" y="20" width="80" height="70" rx="16" fill="#A7F3D0" opacity="0.6" />
        <text x="32" y="58" fill="#047857" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Avon Green</text>

        <rect x="210" y="160" width="120" height="100" rx="20" fill="#A7F3D0" opacity="0.6" />
        <text x="235" y="210" fill="#047857" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Wildwood Park</text>

        <circle cx="60" cy="420" r="40" fill="#A7F3D0" opacity="0.6" />

        {/* Draw Pins and click bounds */}
        {stations.map((st, index) => {
          const isSelected = st.id === selectedStationId;
          // Cleanliness tier color
          const color = st.cleanlinessTier === 'clean' ? '#1D9E75' :
                        st.cleanlinessTier === 'mixed' ? '#BA7517' :
                        st.cleanlinessTier === 'gross' ? '#E24B4A' :
                        '#6B6B6B';
          
          const isUnrated = st.cleanlinessTier === 'unrated';

          return (
            <g
              key={st.id}
              onClick={() => onPinSelect(st.id)}
              className="cursor-pointer"
              style={{
                // Drop bounce stagger
                animation: `pin-drop-bounce 0.6s cubic-bezier(0.25, 1, 0.5, 1) ${index * 0.12}s forwards`,
                transform: 'translateY(-100px)',
                opacity: 0,
              }}
            >
              {/* Pin Base Shadow */}
              <ellipse cx={st.longitude} cy={st.latitude + 14} rx="6" ry="3" fill="#1e293b" opacity="0.25" />

              {/* Pin Pill Label */}
              <rect
                x={st.longitude - 22}
                y={st.latitude - 14}
                width="44"
                height="22"
                rx="11"
                fill={isSelected ? '#1B2A4A' : color}
                stroke={isUnrated ? '#9CA3AF' : isSelected ? '#FAF8F5' : 'transparent'}
                strokeWidth={isUnrated ? '1' : '1.5'}
                strokeDasharray={isUnrated ? '3,3' : '0'}
                filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.15))"
                className="transition-all duration-300"
              />

              {/* Emoji restroom icon inside pill */}
              <text x={st.longitude - 14} y={st.latitude + 1} fontSize="10" fill="#ffffff">
                {isUnrated ? '❔' : '🚽'}
              </text>

              {/* Pin score text */}
              <text
                x={st.longitude + 6}
                y={st.latitude + 1}
                fontSize="8"
                fontWeight="bold"
                fill="#ffffff"
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {isUnrated ? '?' : st.score}
              </text>

              {/* Pointer indicator */}
              <path
                d={`M ${st.longitude} ${st.latitude + 8} L ${st.longitude - 4} ${st.latitude + 4} L ${st.longitude + 4} ${st.latitude + 4} Z`}
                fill={isSelected ? '#1B2A4A' : color}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Side Spec Metadata dynamic loader depending on active screen
function FigmaSpecSidebar({ activeScreen }: { activeScreen: ScreenId }) {
  const specs: Record<
    ScreenId,
    {
      title: string;
      device: string;
      grid: string;
      typography: string[];
      colors: string[];
      components: string[];
      details: string;
    }
  > = {
    '00_Splash': {
      title: '00 PITSTOP Splash Screen',
      device: 'iPhone 16 (393 × 852 px)',
      grid: '4 columns, 16px margins, 16px gutter',
      typography: ['Outfit H1 (48px, weight 900) PITSTOP', 'Outfit H2 (20px, weight 700) Tagline', 'Inter Body (14px, weight 400)'],
      colors: ['Light Blue gradient (#A8D5FF → #7FB3E5)', 'Dark Blue (#003366)', 'Brand Blue (#0052CC)', 'White (#FFFFFF)'],
      components: ['Map Pin Logo', 'Toilet Icon', 'Action Buttons (Find, Rate, Help Others)', 'SN Badge'],
      details: 'Community-driven splash screen branded as "PITSTOP". Tappable to dismiss and proceed to onboarding. Emphasizes "Powered by Station Nation".',
    },
    '01a_Intro': {
      title: '01a Onboarding Intro',
      device: 'iPhone 16 (393 × 852 px)',
      grid: '4 columns, 16px margins, 16px gutter',
      typography: ['Outfit H1 (24px, weight 600)', 'Inter Body (16px, weight 400)'],
      colors: ['Clean Green (#1D9E75)', 'Night Ink (#1B2A4A)', 'White (#FFFFFF)'],
      components: ['Primary button (comp/Button/Primary)'],
      details: 'Splash intro to wow the driver. Highlights the Clean Loop value proposition and allows entry into permission screens.',
    },
    '01b_Location': {
      title: '01b Location Permission',
      device: 'iPhone 16 (393 × 852 px)',
      grid: '4 columns, 16px margins, 16px gutter',
      typography: ['Outfit H2 (18px, weight 500)', 'Inter Body (16px, weight 400)'],
      colors: ['Safety/Info Blue (#378ADD)', 'Neutral-900 (#1A1A1A)'],
      components: ['Primary button', 'Secondary outline button'],
      details: 'Asks permission showing context of nearby stops. Includes an explanation of why location access is requested.',
    },
    '01c_Avatar': {
      title: '01c Create Avatar',
      device: 'iPhone 16 (393 × 852 px)',
      grid: '4 columns, 16px margins, 16px gutter',
      typography: ['Outfit H2 (18px, weight 500)', 'Inter Caption (13px, weight 400)', 'Inter Body (16px, weight 400)'],
      colors: ['Warm Coral (#D85A30)', 'Neutral-300 (#CFCFCF)'],
      components: ['comp/Avatar (large)', 'Primary button'],
      details: 'Anonymizes the user with a rounded geometric avatar and unique user handles. Real names are not stored to preserve privacy.',
    },
    '03_MapHome': {
      title: '03 Map Home Screen',
      device: 'iPhone 16 (393 × 852 px)',
      grid: '4 columns, 16px margins, 16px gutter',
      typography: ['Outfit H3 (16px, weight 500)', 'Inter Caption (13px, weight 400)', 'Inter Micro (12px, weight 500)'],
      colors: ['Neutral-100 (#F2F2F2) Map background', 'Clean Green (#1D9E75)', 'Caution Amber (#BA7517)', 'Gross Red (#E24B4A)'],
      components: ['comp/Searchbar', 'comp/FilterChip', 'comp/StationPin', 'comp/StationListCard', 'comp/BottomTabBar'],
      details: 'Primary app board. Horizontal filter chips scroll at the top. The Bottom Sheet is draggable to reveal stops sorted by distance.',
    },
    '04_FilterSheet': {
      title: '04 Filter Sheet Modal',
      device: 'iPhone 16 (393 × 852 px)',
      grid: '4 columns, 16px margins, 16px gutter',
      typography: ['Outfit H2 (18px, weight 500)', 'Inter Body (16px, weight 400)'],
      colors: ['Clean Green (#1D9E75)', 'Safety/Info Blue (#378ADD)'],
      components: ['Primary button', 'Bottom Grab Handle', 'Toggle Switch control'],
      details: 'Half-height sheet modal overlaying MapHome. Triggers location & safety preferences. Segmented control limits ratings.',
    },
    '05_StationDetail': {
      title: '05 Station Details',
      device: 'iPhone 16 (393 × 852 px)',
      grid: '4 columns, 16px margins, 16px gutter',
      typography: ['Outfit H1 (24px, weight 600) Aggregate score', 'Outfit H3 (16px, weight 500) Title', 'Inter Caption (13px, weight 400)'],
      colors: ['Clean Green (#1D9E75)', 'Safety/Info Blue (#378ADD)', 'Warm Coral (#D85A30)'],
      components: ['comp/AggregateScoreBlock', 'comp/SubRatingRow', 'comp/SafetyBadge', 'comp/FreshnessModule', 'comp/VoteControl'],
      details: 'Detailed restrooms logs for a single station. Shows granular clean/friendly scores and user validation questions.',
    },
    '06_Rate_Step1': {
      title: '06 Two-Tap Rating (Step 1)',
      device: 'iPhone 16 (393 × 852 px)',
      grid: '4 columns, 16px margins, 16px gutter',
      typography: ['Outfit H2 (18px, weight 500)', 'Inter Body (16px, weight 400)'],
      colors: ['Clean Green (#1D9E75)', 'Gross Red (#E24B4A)'],
      components: ['comp/TwoTapRateButtons', 'Link text'],
      details: 'Core MVP workflow. Users can rate a restroom in exactly two taps. Tapping Clean or Gross instantly logs the review.',
    },
    '07_Rate_Step2': {
      title: '07 Optional Note (Step 2)',
      device: 'iPhone 16 (393 × 852 px)',
      grid: '4 columns, 16px margins, 16px gutter',
      typography: ['Outfit H2 (18px, weight 500)', 'Inter Body (16px, weight 400)'],
      colors: ['Warm Coral (#D85A30) Selected tags', 'Neutral-300 (#CFCFCF) dashed border'],
      components: ['comp/QuickTagChip', 'Primary button'],
      details: 'Optional details flow showing helper tags (Stocked, Smelled Bad, Out of order) and a camera icon box for validation.',
    },
    '08_Rate_Confirm': {
      title: '08 Rate Confirmation',
      device: 'iPhone 16 (393 × 852 px)',
      grid: '4 columns, 16px margins, 16px gutter',
      typography: ['Outfit H2 (18px, weight 500) Thanks', 'Inter Micro (12px, weight 500) pts badge'],
      colors: ['Clean Green (#1D9E75) check', 'Warm Coral (#D85A30) toast'],
      components: ['comp/RewardToast', 'Primary button'],
      details: 'Celebratory confirmation screen. Triggers a drop confetti splash and ticks up the streak flame indicator.',
    },
    '09_Profile': {
      title: '09 Driver Profile Dashboard',
      device: 'iPhone 16 (393 × 852 px)',
      grid: '4 columns, 16px margins, 16px gutter',
      typography: ['Outfit H2 (18px, weight 500) Username', 'Outfit H3 (16px, weight 500) Stats', 'Inter Caption (13px, weight 400)'],
      colors: ['Safety/Info Blue (#378ADD)', 'Warm Coral (#D85A30)'],
      components: ['comp/Avatar (large)', '2x2 Metric Grid cards', 'Achievement chips', 'comp/BottomTabBar'],
      details: 'Drives gamified engagement. Summarizes total points earned, local rank, and recent logs logged by the user.',
    },
    '10_EmptyState': {
      title: '10 Empty State (Unrated)',
      device: 'iPhone 16 (393 × 852 px)',
      grid: '4 columns, 16px margins, 16px gutter',
      typography: ['Outfit H3 (16px, weight 500)', 'Inter Body (16px, weight 400)'],
      colors: ['Neutral-600 (#6B6B6B) Text', 'Warm Coral (#D85A30) Button'],
      components: ['Illustration placeholder', 'Primary button'],
      details: 'Variants of Station Details for locations with no prior logs. Features early bird double points incentive (+20 pts).',
    },
  };

  const spec = specs[activeScreen];

  return (
    <div className="flex flex-col gap-4 text-xs">
      <div>
        <span className="text-[10px] bg-brand-teal/20 text-teal-300 px-2 py-0.5 rounded font-mono font-semibold">
          ACTIVE SPEC
        </span>
        <h3 className="font-display text-lg font-bold text-white mt-1.5">{spec.title}</h3>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-slate-800 pt-3">
        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Figma Device Spec</span>
        <p className="text-slate-200 font-medium">Device: {spec.device}</p>
        <p className="text-slate-200 font-medium">Grid: {spec.grid}</p>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-slate-800 pt-3">
        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Active Typographies</span>
        <ul className="list-disc list-inside text-slate-200 flex flex-col gap-1">
          {spec.typography.map((font) => (
            <li key={font} className="truncate">{font}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-slate-800 pt-3">
        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Aesthetic Palette Colors</span>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {spec.colors.map((color) => (
            <span
              key={color}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300"
            >
              {color}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-slate-800 pt-3">
        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Components Utilized</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {spec.components.map((comp) => (
            <span
              key={comp}
              className="px-2 py-0.5 rounded bg-[#172033] border border-blue-900 text-[10px] text-blue-300"
            >
              {comp}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-slate-800 pt-3">
        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Design Details</span>
        <p className="text-slate-300 font-light leading-relaxed">{spec.details}</p>
      </div>
    </div>
  );
}
