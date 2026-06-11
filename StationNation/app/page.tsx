'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ScreenId, Station, CleanlinessTier, Review, TransitionType } from './types';
import { mockStations } from './mockData';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { fetchStations, submitReview, voteReviewHelpful, fetchReviewerRank, fetchMyProfile, createMyProfile, updateMyUsername } from '../lib/data';
import { loadProfile, saveProfile, deriveInitials, computeNewStreak, loadVotes, saveVotes, type VoteMap, type Profile, type RecentActivityEntry } from './profile';
import { useGeolocation, haversineDistanceMiles, formatDistanceMiles, type GeoCoords } from './useGeolocation';
import { ScreenRouterProps } from './components/screenProps';
import { SplashScreen, IntroScreen, LocationScreen, AvatarScreen } from './components/screens/SplashAndOnboarding';
import { MapHomeScreen } from './components/screens/MapHome';
import { FilterSheetScreen } from './components/screens/FilterSheet';
import { StationDetailScreen } from './components/screens/StationDetail';
import { RateStep1Screen, RateStep2Screen, RateConfirmScreen } from './components/screens/RatingScreens';
import { ProfileScreen } from './components/screens/Profile';
import { EmptyStateScreen } from './components/screens/EmptyState';
import { SettingsScreen } from './components/screens/Settings';
import { SignInScreen, ClaimNameScreen } from './components/screens/AuthScreens';

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
  // Only use mock data if explicitly enabled via environment variable; otherwise start empty
  const useDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const [stations, setStations] = useState<Station[]>(useDemoMode ? mockStations : []);
  const [activeScreen, setActiveScreen] = useState<ScreenId>('00_Splash');
  const [prevScreen, setPrevScreen] = useState<ScreenId | null>(null);
  const [transitionType, setTransitionType] = useState<TransitionType>('instant');
  const [selectedStationId, setSelectedStationId] = useState<string>('chevron-valley');

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<string[]>(['Safe at night']);

  // Rating Flow State
  const [tempRatingScore, setTempRatingScore] = useState<number | null>(null); // 5 for clean, 1.5 for gross
  const [tempRatingTags, setTempRatingTags] = useState<string[]>([]);
  const [tempRatingNotes, setTempRatingNotes] = useState<string>('');
  const [tempRatingPhoto, setTempRatingPhoto] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // User Profile State — initialised to zero/blank; loaded from localStorage in the mount effect below.
  const [username, setUsername] = useState<string>('');
  const [points, setPoints] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [stationsRated, setStationsRated] = useState<number>(0);
  const [peopleHelped, setPeopleHelped] = useState<number>(0);
  const [lastRatedDay, setLastRatedDay] = useState<string | undefined>(undefined);
  const [createdAt, setCreatedAt] = useState<string | undefined>(undefined);
  const [recentActivity, setRecentActivity] = useState<RecentActivityEntry[]>([]);
  // profileReady: true once the mount effect has run (avoids a flash of the splash screen before we know if onboarding was completed).
  const [profileReady, setProfileReady] = useState<boolean>(false);
  // Temp nickname captured during the 01c_Avatar onboarding step (separate from committed username).
  const [onboardingNickname, setOnboardingNickname] = useState<string>('');

  // Theme / UX State
  const [safeAtNightMode] = useState<boolean>(true); // Night ink background
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const [mapRecenterTrigger, setMapRecenterTrigger] = useState<number>(0);

  // Reviewer rank (Feature 3)
  const [reviewerRank, setReviewerRank] = useState<{ rank: number; total: number } | null>(null);

  // Settings screen state (Feature 2)
  const [settingsDisplayName, setSettingsDisplayName] = useState<string>('');
  const [settingsResetArmed, setSettingsResetArmed] = useState<boolean>(false);

  // Auth state (Supabase magic-link accounts)
  const [session, setSession] = useState<Session | null>(null);
  // Where to send the user once they finish signing in (set when a write is
  // intercepted on a signed-out user; null = nowhere special, stay put).
  const [pendingAfterAuth, setPendingAfterAuth] = useState<ScreenId | null>(null);
  // 13_ClaimName state — the screen shown when the local nickname is already taken.
  const [claimNameValue, setClaimNameValue] = useState<string>('');
  const [claimNameError, setClaimNameError] = useState<string>('');
  const [claimNameSaving, setClaimNameSaving] = useState<boolean>(false);

  // Keep the latest username/nickname/pending intent readable inside the auth
  // subscription callback without re-subscribing on every change.
  const usernameRef = useRef<string>('');
  const onboardingNicknameRef = useRef<string>('');
  const pendingAfterAuthRef = useRef<ScreenId | null>(null);

  // Geolocation
  const { coords: userCoords, status: geoStatus, requestLocation } = useGeolocation();

  // Container ref for confetti bounds
  const containerRef = useRef<HTMLDivElement>(null);

  // No-op action logger (call sites preserved, logs to console only)
  const logAction = useCallback((msg: string) => {
    console.log(`[StationNation] ${msg}`);
  }, []);

  // Mirror values the auth subscription needs into refs (the subscription is
  // registered once on mount and must read the latest, not the mount-time, value).
  useEffect(() => {
    usernameRef.current = username;
    onboardingNicknameRef.current = onboardingNickname;
    pendingAfterAuthRef.current = pendingAfterAuth;
  }, [username, onboardingNickname, pendingAfterAuth]);

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
    const rect = containerRef.current?.getBoundingClientRect();
    const cx = rect ? rect.width / 2 : 196;
    const cy = rect ? rect.height * 0.47 : 400;
    for (let i = 0; i < 40; i++) {
      newConfetti.push({
        id: Math.random() + i,
        x: cx,
        y: cy,
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
    const containerHeight = containerRef.current?.getBoundingClientRect().height ?? 852;
    const containerWidth = containerRef.current?.getBoundingClientRect().width ?? 393;
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
          .filter((p) => p.y < containerHeight && p.x > 0 && p.x < containerWidth)
      );
    }, 16);
    return () => clearInterval(interval);
  }, [confetti]);

  // Load profile from localStorage on mount (client-only, guard SSR).
  useEffect(() => {
    const profile = loadProfile();
    setUsername(profile.username);
    setPoints(profile.points);
    setStreak(profile.streak);
    setStationsRated(profile.stationsRated);
    setPeopleHelped(profile.peopleHelped);
    setLastRatedDay(profile.lastRatedDay);
    setCreatedAt(profile.createdAt);
    setRecentActivity(profile.recentActivity ?? []);
    if (profile.onboarded) {
      // Skip onboarding — go straight to the main map/list screen.
      setActiveScreen('03_MapHome');
      // Returning user: request location immediately (Permissions API may resolve silently
      // if already granted, otherwise the hook does nothing until the user acts).
      requestLocation();
    }
    setProfileReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist profile whenever any tracked stat changes (skip until profile is loaded).
  useEffect(() => {
    if (!profileReady) return;
    const profile: Profile = {
      username,
      points,
      streak,
      stationsRated,
      peopleHelped,
      lastRatedDay,
      onboarded: activeScreen !== '00_Splash' &&
                 activeScreen !== '01a_Intro' &&
                 activeScreen !== '01b_Location' &&
                 activeScreen !== '01c_Avatar',
      createdAt,
      recentActivity,
    };
    saveProfile(profile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, points, streak, stationsRated, peopleHelped, lastRatedDay, profileReady, activeScreen, createdAt, recentActivity]);

  // Load stations from Supabase on mount; apply persisted vote state to reviews
  useEffect(() => {
    fetchStations().then((data) => {
      let stations = data;
      if (stations && stations.length > 0) {
        // Restore userVoted from localStorage so votes survive reload
        const storedVotes = loadVotes();
        if (Object.keys(storedVotes).length > 0) {
          stations = stations.map((s) => ({
            ...s,
            reviews: s.reviews.map((r) =>
              storedVotes[r.id]
                ? { ...r, userVoted: storedVotes[r.id] }
                : r
            ),
          }));
        }
        setStations(stations);
        logAction('Stations loaded from Supabase.');
      } else if (useDemoMode) {
        setStations(mockStations);
        logAction('Using mock data (demo mode enabled).');
      } else {
        logAction('No stations available from Supabase.');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useDemoMode]);

  // Navigate to the screen the user was headed for before being asked to sign in.
  const goToPendingAfterAuth = useCallback(() => {
    const pending = pendingAfterAuthRef.current;
    setPendingAfterAuth(null);
    if (pending) {
      navigateTo(pending, 'dissolve');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconcile the local nickname with the server profiles row after sign-in.
  // - existing row: server wins (adopt its username locally).
  // - no row: claim the local nickname; on collision, prompt via 13_ClaimName.
  // Always honours a pending post-auth intent (e.g. returning to a rating screen).
  const reconcileProfileAfterAuth = useCallback(async (userId: string) => {
    const existing = await fetchMyProfile(userId);
    if (existing) {
      // Server wins — adopt the stored display name into local state/profile.
      setUsername(existing.username);
      logAction(`Signed in — adopted server username "${existing.username}".`);
      goToPendingAfterAuth();
      return;
    }

    // No profile yet — claim the locally stored nickname if we have one.
    const localName = (usernameRef.current || onboardingNicknameRef.current).trim();
    if (localName.length >= 2) {
      const result = await createMyProfile(userId, localName);
      if (result === true) {
        setUsername(localName);
        logAction(`Signed in — claimed username "${localName}".`);
        goToPendingAfterAuth();
        return;
      }
      if (result === 'name_taken') {
        // Surface the inline prompt to pick a different name.
        setClaimNameValue('');
        setClaimNameError('');
        navigateTo('13_ClaimName', 'dissolve');
        return;
      }
      // Other failure: leave local state as-is, just route onward.
      goToPendingAfterAuth();
      return;
    }

    // No usable local nickname — prompt for one.
    setClaimNameValue('');
    setClaimNameError('');
    navigateTo('13_ClaimName', 'dissolve');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auth bootstrap: read any existing session and subscribe to changes.
  // Client-only (effect) and fully guarded so placeholder env never crashes.
  useEffect(() => {
    let active = true;

    supabase.auth.getSession()
      .then(({ data }) => {
        if (active) setSession(data.session);
      })
      .catch((err) => console.error('[StationNation] getSession error:', err));

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'SIGNED_IN' && newSession?.user) {
        reconcileProfileAfterAuth(newSession.user.id);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch reviewer rank whenever the Profile screen becomes active (Feature 3)
  useEffect(() => {
    if (activeScreen !== '09_Profile' || !username) return;
    fetchReviewerRank(username).then(setReviewerRank);
  }, [activeScreen, username]);

  // Enrich stations with computed distances whenever raw stations or user coords change.
  // Produces nearest-first sorted list; falls back to DB order + raw distance text when
  // coords are unavailable.
  const enrichedStations = useMemo<Station[]>(() => {
    if (!userCoords) {
      // No location: return as-is, ensuring distance shows DB value or "—"
      return stations.map((s) => ({
        ...s,
        distance: s.distance || '—',
      }));
    }
    const withDist = stations.map((s) => {
      const miles = haversineDistanceMiles(userCoords.lat, userCoords.lng, s.latitude, s.longitude);
      return {
        ...s,
        distanceMiles: miles,
        distance: formatDistanceMiles(miles),
      };
    });
    // Sort nearest first
    withDist.sort((a, b) => (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0));
    return withDist;
  }, [stations, userCoords]);

  // Roll back the optimistic rating changes when the DB rejects the insert
  // (e.g. the 12h-per-station rate limit). Restores the station's prior
  // aggregate/review and reverses the points/stats deltas. The recent-activity
  // entry is removed by reference at the call site.
  const rollbackOptimisticRating = (snapshot: Station | undefined) => {
    setStations((prev) =>
      prev.map((s) => (snapshot && s.id === snapshot.id ? snapshot : s))
    );
    // Reverse the +10 / +1 / +12 deltas. Streak/lastRatedDay are day-based and
    // best-effort; we leave them (a second tap the same day is a no-op anyway).
    setPoints((p) => Math.max(0, p - 10));
    setStationsRated((sr) => Math.max(0, sr - 1));
    setPeopleHelped((ph) => Math.max(0, ph - 12));
  };

  // Handle Clean/Gross voting action (2-Tap core)
  const handleRatingVote = (isClean: boolean) => {
    // WRITES require sign-in — route signed-out users to the sign-in screen,
    // remembering to bring them back to Rate Step 1 afterwards.
    if (!session) {
      setPendingAfterAuth('06_Rate_Step1');
      navigateTo('12_SignIn', 'push-left');
      return;
    }

    setTempRatingScore(isClean ? 5 : 1.5);
    logAction(`Voted restroom: ${isClean ? 'Clean (5.0★)' : 'Gross (1.5★)'}`);

    const reviewId = `rev-user-${Date.now()}`;
    const snapshot = stations.find((s) => s.id === selectedStationId);
    const newReview: Review = {
      id: reviewId,
      username: username,
      avatarInitials: deriveInitials(username),
      timestamp: 'Just now',
      text: isClean ? 'Confirmed clean! Fast and clean stop.' : 'Disgusting conditions, avoid if possible!',
      score: isClean ? 5 : 1.5,
      helpfulCount: 0,
    };

    // Optimistic local aggregate/review update.
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

    // Apply points & stats; update streak using day-based logic
    setPoints((p) => p + 10);
    setStationsRated((sr) => sr + 1);
    setPeopleHelped((ph) => ph + 12);
    setStreak((currentStreak) => {
      const { newStreak, newLastRatedDay } = computeNewStreak(currentStreak, lastRatedDay);
      setLastRatedDay(newLastRatedDay);
      return newStreak;
    });

    // Record recent activity entry (keep last 10)
    const ratingScore = isClean ? 5 : 1.5;
    const stationName = snapshot?.name ?? selectedStationId;
    const activityEntry: RecentActivityEntry = {
      stationName,
      score: ratingScore,
      text: 'Quick rating',
      ratedAt: new Date().toISOString(),
    };
    setRecentActivity((prev) => [activityEntry, ...prev].slice(0, 10));

    logAction('Points earned: +10 pts! Streak increased! Station score updated.');

    triggerConfetti();
    navigateTo('08_Rate_Confirm', 'dissolve');

    // Persist to Supabase; roll back the optimistic changes if rate-limited.
    submitReview(selectedStationId, session.user.id, {
      id: newReview.id,
      username: newReview.username,
      avatarInitials: newReview.avatarInitials,
      text: newReview.text,
      score: newReview.score,
    }).then((result) => {
      if (result === 'rate_limited') {
        rollbackOptimisticRating(snapshot);
        setRecentActivity((prev) => prev.filter((e) => e !== activityEntry));
        setToastMessage('You already rated this station in the last 12 hours.');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3500);
      }
    });
  };

  // Submit Detailed Rating Flow
  const handleSubmitDetailedRating = () => {
    // tempRatingScore must be set (enforced by disabled submit button in Step 2)
    if (!tempRatingScore) return;

    // WRITES require sign-in — route signed-out users to the sign-in screen,
    // remembering to bring them back to Rate Step 2 afterwards.
    if (!session) {
      setPendingAfterAuth('07_Rate_Step2');
      navigateTo('12_SignIn', 'push-left');
      return;
    }

    const isClean = tempRatingScore >= 4;
    const reviewId = `rev-user-${Date.now()}`;
    const reviewText = tempRatingNotes || (isClean ? 'Clean and tidy.' : 'Needs servicing soon.');
    const snapshot = stations.find((s) => s.id === selectedStationId);
    const newReview: Review = {
      id: reviewId,
      username: username,
      avatarInitials: deriveInitials(username),
      timestamp: 'Just now',
      text: reviewText,
      score: tempRatingScore,
      helpfulCount: 0,
    };

    // Optimistic local aggregate/review update.
    setStations((prevStations) =>
      prevStations.map((s) => {
        if (s.id === selectedStationId) {
          const newCount = s.ratingCount + 1;
          const currentTotalScore = s.score * s.ratingCount;
          const newAvgScore = Number(((currentTotalScore + tempRatingScore) / newCount).toFixed(1));

          let newTier: CleanlinessTier = 'mixed';
          if (newAvgScore >= 4.0) newTier = 'clean';
          else if (newAvgScore < 2.5) newTier = 'gross';

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
    setStationsRated((sr) => sr + 1);
    setPeopleHelped((ph) => ph + 12);
    setStreak((currentStreak) => {
      const { newStreak, newLastRatedDay } = computeNewStreak(currentStreak, lastRatedDay);
      setLastRatedDay(newLastRatedDay);
      return newStreak;
    });

    // Record recent activity entry (keep last 10)
    const stationName = snapshot?.name ?? selectedStationId;
    const activityEntry: RecentActivityEntry = {
      stationName,
      score: tempRatingScore,
      text: reviewText,
      ratedAt: new Date().toISOString(),
    };
    setRecentActivity((prev) => [activityEntry, ...prev].slice(0, 10));

    logAction('Detailed review submitted! +10 pts earned.');

    triggerConfetti();
    navigateTo('08_Rate_Confirm', 'dissolve');

    // Persist to Supabase; roll back the optimistic changes if rate-limited.
    submitReview(selectedStationId, session.user.id, {
      id: newReview.id,
      username: newReview.username,
      avatarInitials: newReview.avatarInitials,
      text: newReview.text,
      score: newReview.score,
    }).then((result) => {
      if (result === 'rate_limited') {
        rollbackOptimisticRating(snapshot);
        setRecentActivity((prev) => prev.filter((e) => e !== activityEntry));
        setToastMessage('You already rated this station in the last 12 hours.');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3500);
      }
    });
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
    // WRITES require sign-in — the helpful-vote RPC is granted to authenticated
    // users only. Route signed-out users to sign-in and leave the vote unapplied.
    if (!session) {
      setPendingAfterAuth('05_StationDetail');
      navigateTo('12_SignIn', 'push-left');
      return;
    }

    // Compute delta before updating state (we need the current userVoted value)
    let delta = 0;
    let nextVoteState: 'up' | 'down' | null = direction;

    // Read current vote state from stations (immutable snapshot for delta calculation)
    const currentReview = stations
      .flatMap((s) => s.reviews)
      .find((r) => r.id === reviewId);

    if (currentReview) {
      if (currentReview.userVoted === direction) {
        // Undo vote
        delta = direction === 'up' ? -1 : 1;
        nextVoteState = null;
      } else if (currentReview.userVoted) {
        // Switch vote
        delta = direction === 'up' ? 2 : -2;
      } else {
        // Fresh vote
        delta = direction === 'up' ? 1 : -1;
      }
    }

    // Optimistic local state update
    setStations((prev) =>
      prev.map((s) => {
        if (s.id === selectedStationId) {
          return {
            ...s,
            reviews: s.reviews.map((r) => {
              if (r.id === reviewId) {
                logAction(`Voted review helpful: ${direction === 'up' ? '▲' : '▼'} (${r.helpfulCount + delta})`);
                return {
                  ...r,
                  helpfulCount: r.helpfulCount + delta,
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

    // Persist vote direction to localStorage so it survives reload
    const updatedVotes: VoteMap = { ...loadVotes() };
    if (nextVoteState === null) {
      delete updatedVotes[reviewId];
    } else {
      updatedVotes[reviewId] = nextVoteState;
    }
    saveVotes(updatedVotes);

    // Fire-and-forget RPC to persist helpful_count to Supabase
    if (delta !== 0) {
      voteReviewHelpful(reviewId, delta);
    }
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

    // Show validation toast with action-appropriate message
    const msg = stillClean
      ? 'Thanks — confirmed still clean. +5 pts'
      : 'Thanks — flagged for re-check. +5 pts';
    setToastMessage(msg);
    setShowToast(true);
    setPoints((p) => p + 5); // Mini points for confirmation check
    logAction('Confirmed freshness. Earned +5 pts.');

    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Sign out (Settings). Stays on Settings; shows a confirmation toast.
  const handleSignOut = () => {
    supabase.auth.signOut()
      .catch((err) => console.error('[StationNation] signOut error:', err))
      .finally(() => {
        setToastMessage('Signed out.');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        logAction('Signed out.');
      });
  };

  // 13_ClaimName: retry the profiles insert with a user-supplied name after a
  // unique-violation at first sign-in. On success, adopt it and route onward.
  const handleClaimName = () => {
    const name = claimNameValue.trim();
    const userId = session?.user.id;
    if (!userId || name.length < 2 || name.length > 20 || claimNameSaving) return;
    setClaimNameSaving(true);
    setClaimNameError('');
    createMyProfile(userId, name).then((result) => {
      setClaimNameSaving(false);
      if (result === true) {
        setUsername(name);
        logAction(`Claimed username "${name}".`);
        goToPendingAfterAuth();
      } else if (result === 'name_taken') {
        setClaimNameError('That name is taken. Try another.');
      } else {
        setClaimNameError('Could not save that name. Try again.');
      }
    });
  };

  // Filters calculation (applied on top of enriched, distance-sorted stations)
  const filteredStations = enrichedStations.filter((station) => {
    // If search text is present
    if (searchQuery && !station.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Filter chip logic:
    // "Safe at night": requires score >= 3.5 or specific safety badges
    if (activeFilters.includes('Safe at night') && station.cleanlinessTier === 'gross') {
      return false;
    }
    // "Clean 3★+": score >= 3 (unrated stations excluded)
    if (activeFilters.includes('Clean 3★+') && station.score < 3.0) {
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

  // Shared props bundle passed to DeviceScreenRouter
  const routerProps: ScreenRouterProps = {
    activeScreen,
    prevScreen,
    transitionType,
    stations: filteredStations,
    allStations: enrichedStations,
    selectedStationId,
    setSelectedStationId: (id) => {
      setSelectedStationId(id);
      const st = enrichedStations.find(s => s.id === id);
      if (st && st.cleanlinessTier === 'unrated') {
        navigateTo('10_EmptyState', 'push-up');
      } else {
        navigateTo('05_StationDetail', 'push-up');
      }
    },
    navigateTo,
    searchQuery,
    setSearchQuery,
    activeFilters,
    setActiveFilters,
    safeAtNightMode,
    user: { username, points, streak, stationsRated, peopleHelped, createdAt, recentActivity },
    setUsername,
    reviewerRank,
    settingsDisplayName,
    setSettingsDisplayName,
    settingsResetArmed,
    setSettingsResetArmed,
    setShowToast,
    setToastMessage,
    onboardingNickname,
    setOnboardingNickname,
    handleRatingVote,
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
    toggleHelpfulVote,
    handleFreshnessVerification,
    showToast,
    toastMessage,
    mapRecenterTrigger,
    setMapRecenterTrigger,
    logAction,
    userCoords,
    geoStatus,
    requestLocation,
    session,
    handleSignOut,
    claimNameValue,
    setClaimNameValue,
    claimNameError,
    claimNameSaving,
    handleClaimName,
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#060F24] select-none font-sans">
      {/* App container: full viewport on mobile, phone-width on desktop */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[430px] h-[100dvh] mx-auto bg-slate-900 overflow-hidden flex flex-col"
      >
        {/* Demo Mode badge */}
        {useDemoMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[997] pointer-events-none">
            <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-900 text-[10px] font-bold uppercase tracking-wider shadow-lg">
              Demo Mode
            </span>
          </div>
        )}

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
          <DeviceScreenRouter {...routerProps} />
        </div>
      </div>
    </div>
  );
}

// Router for Device viewport to switch screens and compile layout spec details
function DeviceScreenRouter(props: ScreenRouterProps) {
  const { activeScreen } = props;

  switch (activeScreen) {
    case '00_Splash':
      return <SplashScreen navigateTo={props.navigateTo} />;

    case '01a_Intro':
      return <IntroScreen navigateTo={props.navigateTo} />;

    case '01b_Location':
      return <LocationScreen navigateTo={props.navigateTo} requestLocation={props.requestLocation} />;

    case '01c_Avatar':
      return (
        <AvatarScreen
          navigateTo={props.navigateTo}
          onboardingNickname={props.onboardingNickname}
          setOnboardingNickname={props.setOnboardingNickname}
          setUsername={props.setUsername}
        />
      );

    case '03_MapHome':
      return (
        <MapHomeScreen
          stations={props.stations}
          selectedStationId={props.selectedStationId}
          setSelectedStationId={props.setSelectedStationId}
          navigateTo={props.navigateTo}
          searchQuery={props.searchQuery}
          setSearchQuery={props.setSearchQuery}
          activeFilters={props.activeFilters}
          setActiveFilters={props.setActiveFilters}
          safeAtNightMode={props.safeAtNightMode}
          mapRecenterTrigger={props.mapRecenterTrigger}
          setMapRecenterTrigger={props.setMapRecenterTrigger}
          logAction={props.logAction}
          userCoords={props.userCoords}
          geoStatus={props.geoStatus}
        />
      );

    case '04_FilterSheet':
      return (
        <FilterSheetScreen
          navigateTo={props.navigateTo}
          activeFilters={props.activeFilters}
          setActiveFilters={props.setActiveFilters}
          safeAtNightMode={props.safeAtNightMode}
        />
      );

    case '05_StationDetail':
      return (
        <StationDetailScreen
          allStations={props.allStations}
          selectedStationId={props.selectedStationId}
          navigateTo={props.navigateTo}
          safeAtNightMode={props.safeAtNightMode}
          handleFreshnessVerification={props.handleFreshnessVerification}
          toggleHelpfulVote={props.toggleHelpfulVote}
          showToast={props.showToast}
          toastMessage={props.toastMessage}
          logAction={props.logAction}
        />
      );

    case '06_Rate_Step1':
      return (
        <RateStep1Screen
          allStations={props.allStations}
          selectedStationId={props.selectedStationId}
          navigateTo={props.navigateTo}
          safeAtNightMode={props.safeAtNightMode}
          handleRatingVote={props.handleRatingVote}
          resetRatingFlow={props.resetRatingFlow}
          logAction={props.logAction}
        />
      );

    case '07_Rate_Step2':
      return (
        <RateStep2Screen
          navigateTo={props.navigateTo}
          safeAtNightMode={props.safeAtNightMode}
          tempRatingScore={props.tempRatingScore}
          setTempRatingScore={props.setTempRatingScore}
          tempRatingTags={props.tempRatingTags}
          setTempRatingTags={props.setTempRatingTags}
          tempRatingNotes={props.tempRatingNotes}
          setTempRatingNotes={props.setTempRatingNotes}
          tempRatingPhoto={props.tempRatingPhoto}
          setTempRatingPhoto={props.setTempRatingPhoto}
          handleSubmitDetailedRating={props.handleSubmitDetailedRating}
          resetRatingFlow={props.resetRatingFlow}
          logAction={props.logAction}
        />
      );

    case '08_Rate_Confirm':
      return (
        <RateConfirmScreen
          navigateTo={props.navigateTo}
          safeAtNightMode={props.safeAtNightMode}
          user={props.user}
          resetRatingFlow={props.resetRatingFlow}
        />
      );

    case '09_Profile':
      return (
        <ProfileScreen
          navigateTo={props.navigateTo}
          safeAtNightMode={props.safeAtNightMode}
          user={props.user}
          reviewerRank={props.reviewerRank}
          setSettingsDisplayName={props.setSettingsDisplayName}
          setSettingsResetArmed={props.setSettingsResetArmed}
          session={props.session}
        />
      );

    case '10_EmptyState':
      return (
        <EmptyStateScreen
          allStations={props.allStations}
          selectedStationId={props.selectedStationId}
          navigateTo={props.navigateTo}
          safeAtNightMode={props.safeAtNightMode}
        />
      );

    case '11_Settings':
      return (
        <SettingsScreen
          navigateTo={props.navigateTo}
          safeAtNightMode={props.safeAtNightMode}
          settingsDisplayName={props.settingsDisplayName}
          setSettingsDisplayName={props.setSettingsDisplayName}
          settingsResetArmed={props.settingsResetArmed}
          setSettingsResetArmed={props.setSettingsResetArmed}
          setUsername={props.setUsername}
          setShowToast={props.setShowToast}
          setToastMessage={props.setToastMessage}
          session={props.session}
          handleSignOut={props.handleSignOut}
        />
      );

    case '12_SignIn':
      return (
        <SignInScreen
          navigateTo={props.navigateTo}
          prevScreen={props.prevScreen}
        />
      );

    case '13_ClaimName':
      return (
        <ClaimNameScreen
          safeAtNightMode={props.safeAtNightMode}
          claimNameValue={props.claimNameValue}
          setClaimNameValue={props.setClaimNameValue}
          claimNameError={props.claimNameError}
          claimNameSaving={props.claimNameSaving}
          handleClaimName={props.handleClaimName}
        />
      );

    default:
      return null;
  }
}
