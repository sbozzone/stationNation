'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Station } from '../types';
import { GeoCoords } from '../useGeolocation';

// SVG viewport dimensions
const MAP_W = 361;
const MAP_H = 477;

/**
 * Compute a bounding box over all station lat/lng values plus optional user coords.
 * Returns { minLat, maxLat, minLng, maxLng } padded ~10%.
 * Handles 0-station and 1-station edge cases gracefully.
 */
function computeBBox(
  stations: Station[],
  userCoords: GeoCoords | null
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const pts: { lat: number; lng: number }[] = stations.map((s) => ({
    lat: s.latitude,
    lng: s.longitude,
  }));
  if (userCoords) {
    pts.push({ lat: userCoords.lat, lng: userCoords.lng });
  }

  if (pts.length === 0) {
    // Empty: return a sensible default centred on 0,0
    return { minLat: -1, maxLat: 1, minLng: -1, maxLng: 1 };
  }

  let minLat = pts[0].lat, maxLat = pts[0].lat;
  let minLng = pts[0].lng, maxLng = pts[0].lng;
  for (const p of pts) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }

  // For single-point (or very close points), spread a small area so the pin doesn't
  // land exactly on the edge.
  const latSpan = maxLat - minLat || 0.02;
  const lngSpan = maxLng - minLng || 0.02;

  const padLat = latSpan * 0.15;
  const padLng = lngSpan * 0.15;

  return {
    minLat: minLat - padLat,
    maxLat: maxLat + padLat,
    minLng: minLng - padLng,
    maxLng: maxLng + padLng,
  };
}

/**
 * Project a lat/lng into SVG pixel coordinates within the viewport.
 * Latitude increases upward (north), so we invert Y.
 */
function project(
  lat: number,
  lng: number,
  bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number }
): { x: number; y: number } {
  const latRange = bbox.maxLat - bbox.minLat || 1;
  const lngRange = bbox.maxLng - bbox.minLng || 1;

  const x = ((lng - bbox.minLng) / lngRange) * MAP_W;
  // Invert Y: higher lat = lower pixel Y (north = up)
  const y = ((bbox.maxLat - lat) / latRange) * MAP_H;

  return { x, y };
}

// Custom vector stylized game-board map simulator using SVG
export function GameMapSVG({
  stations,
  selectedStationId,
  onPinSelect,
  mapRecenterTrigger,
  userCoords,
}: {
  stations: Station[];
  selectedStationId: string;
  onPinSelect: (id: string) => void;
  mapRecenterTrigger: number;
  userCoords: GeoCoords | null;
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

  // Compute bounding box and projections
  const bbox = useMemo(() => computeBBox(stations, userCoords), [stations, userCoords]);

  const stationPins = useMemo(
    () =>
      stations.map((st) => ({
        ...st,
        ...project(st.latitude, st.longitude, bbox),
      })),
    [stations, bbox]
  );

  const userPin = useMemo(
    () => (userCoords ? project(userCoords.lat, userCoords.lng, bbox) : null),
    [userCoords, bbox]
  );

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing select-none overflow-hidden bg-[#E5E1D3]">
      <svg
        className="w-full h-full transform transition-all duration-500 ease-out"
        style={{
          transform: `scale(${mapScale}) translate(${panX}px, ${panY}px)`,
        }}
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Map background: subtle terrain colours */}
        <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="#E5E1D3" />

        {/* Decorative river — scaled to viewBox */}
        <path
          d={`M-20 ${MAP_H * 0.42} Q ${MAP_W * 0.28} ${MAP_H * 0.46} ${MAP_W * 0.5} ${MAP_H * 0.65} T ${MAP_W + 20} ${MAP_H * 0.67}`}
          fill="none"
          stroke="#93C5FD"
          strokeWidth="35"
          strokeLinecap="round"
          opacity="0.7"
        />

        {/* Decorative roads */}
        <line x1="-10" y1={MAP_H * 0.25} x2={MAP_W + 10} y2={MAP_H * 0.25} stroke="#FAF8F5" strokeWidth="22" strokeLinecap="round" />
        <line x1="-10" y1={MAP_H * 0.25} x2={MAP_W + 10} y2={MAP_H * 0.25} stroke="#D1D5DB" strokeWidth="1" strokeDasharray="6,6" />

        <line x1={MAP_W * 0.44} y1="-10" x2={MAP_W * 0.44} y2={MAP_H + 10} stroke="#FAF8F5" strokeWidth="18" strokeLinecap="round" />
        <line x1={MAP_W * 0.44} y1="-10" x2={MAP_W * 0.44} y2={MAP_H + 10} stroke="#D1D5DB" strokeWidth="1" strokeDasharray="6,6" />

        <line x1="-10" y1={MAP_H * 0.75} x2={MAP_W + 10} y2={MAP_H * 0.75} stroke="#FAF8F5" strokeWidth="20" strokeLinecap="round" />
        <line x1="-10" y1={MAP_H * 0.75} x2={MAP_W + 10} y2={MAP_H * 0.75} stroke="#D1D5DB" strokeWidth="1" strokeDasharray="6,6" />

        {/* Green park patches */}
        <rect x="20" y="20" width="80" height="60" rx="14" fill="#A7F3D0" opacity="0.55" />
        <rect x={MAP_W * 0.58} y={MAP_H * 0.33} width="110" height="90" rx="18" fill="#A7F3D0" opacity="0.55" />
        <circle cx="55" cy={MAP_H * 0.88} r="38" fill="#A7F3D0" opacity="0.55" />

        {/* Empty state label */}
        {stations.length === 0 && (
          <text
            x={MAP_W / 2}
            y={MAP_H / 2}
            textAnchor="middle"
            fill="#9CA3AF"
            fontSize="13"
            fontFamily="sans-serif"
          >
            No stations loaded
          </text>
        )}

        {/* Station pins projected from real coords */}
        {stationPins.map((st, index) => {
          const isSelected = st.id === selectedStationId;
          const color =
            st.cleanlinessTier === 'clean' ? '#1D9E75' :
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
                animation: `pin-drop-bounce 0.6s cubic-bezier(0.25, 1, 0.5, 1) ${index * 0.12}s forwards`,
                transform: 'translateY(-100px)',
                opacity: 0,
              }}
            >
              {/* Pin base shadow */}
              <ellipse cx={st.x} cy={st.y + 14} rx="6" ry="3" fill="#1e293b" opacity="0.25" />

              {/* Pin pill */}
              <rect
                x={st.x - 22}
                y={st.y - 14}
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

              {/* Icon */}
              <text x={st.x - 14} y={st.y + 1} fontSize="10" fill="#ffffff">
                {isUnrated ? '❔' : '🚽'}
              </text>

              {/* Score */}
              <text
                x={st.x + 6}
                y={st.y + 1}
                fontSize="8"
                fontWeight="bold"
                fill="#ffffff"
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {isUnrated ? '?' : st.score}
              </text>

              {/* Pointer triangle */}
              <path
                d={`M ${st.x} ${st.y + 8} L ${st.x - 4} ${st.y + 4} L ${st.x + 4} ${st.y + 4} Z`}
                fill={isSelected ? '#1B2A4A' : color}
              />
            </g>
          );
        })}

        {/* User position dot */}
        {userPin && (
          <g>
            <circle cx={userPin.x} cy={userPin.y} r="10" fill="#378ADD" opacity="0.2" />
            <circle cx={userPin.x} cy={userPin.y} r="6" fill="#378ADD" stroke="#ffffff" strokeWidth="2" />
            <circle cx={userPin.x} cy={userPin.y} r="3" fill="#ffffff" />
          </g>
        )}
      </svg>
    </div>
  );
}
