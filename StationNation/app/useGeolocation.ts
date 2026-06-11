'use client';

import { useState, useEffect, useCallback } from 'react';

export type GeoStatus = 'idle' | 'prompting' | 'granted' | 'denied' | 'unavailable';

export interface GeoCoords {
  lat: number;
  lng: number;
}

export interface GeolocationState {
  coords: GeoCoords | null;
  status: GeoStatus;
  requestLocation: () => void;
}

/**
 * Haversine distance in miles between two lat/lng points.
 */
export function haversineDistanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Format a distance in miles to a display string.
 * < 10 mi  → "0.4 mi" (one decimal)
 * >= 10 mi → "23 mi"  (whole number)
 */
export function formatDistanceMiles(miles: number): string {
  if (miles < 10) {
    return `${miles.toFixed(1)} mi`;
  }
  return `${Math.round(miles)} mi`;
}

export function useGeolocation(): GeolocationState {
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const [status, setStatus] = useState<GeoStatus>('idle');

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable');
      return;
    }

    setStatus('prompting');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setStatus('granted');
      },
      (error) => {
        if (
          error.code === error.PERMISSION_DENIED
        ) {
          setStatus('denied');
        } else {
          setStatus('unavailable');
        }
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false }
    );
  }, []);

  // On mount: if permission was already granted, silently get position without prompting.
  // This re-uses a cached position quickly (maximumAge) and avoids showing a second prompt.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    // Check the Permissions API first (non-blocking).
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          if (result.state === 'granted') {
            // Already granted — quietly get fresh coords.
            requestLocation();
          } else if (result.state === 'denied') {
            setStatus('denied');
          }
          // 'prompt' → wait for explicit user action
        })
        .catch(() => {
          // Permissions API not supported — do nothing on mount.
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { coords, status, requestLocation };
}
