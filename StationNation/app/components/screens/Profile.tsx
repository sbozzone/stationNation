'use client';

import React from 'react';
import { ScreenRouterProps, getTheme } from '../screenProps';
import { BottomTabBar } from '../BottomTabBar';
import { deriveInitials } from '../../profile';

export function ProfileScreen({
  navigateTo,
  safeAtNightMode,
  user,
  reviewerRank,
  setSettingsDisplayName,
  setSettingsResetArmed,
}: Pick<
  ScreenRouterProps,
  | 'navigateTo'
  | 'safeAtNightMode'
  | 'user'
  | 'reviewerRank'
  | 'setSettingsDisplayName'
  | 'setSettingsResetArmed'
>) {
  const { uiTheme, cardTheme, secondaryText } = getTheme(safeAtNightMode);

  // Derive "Member since" from createdAt
  const memberSince = (() => {
    if (!user.createdAt) return 'Member since recently';
    const d = new Date(user.createdAt);
    if (isNaN(d.getTime())) return 'Member since recently';
    return `Member since ${d.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
  })();

  // Achievement badges derived from real stats
  const badges = [
    {
      name: 'First Flush',
      unlocked: user.stationsRated >= 1,
      icon: '🚽',
      desc: 'Rate your first stop',
    },
    {
      name: 'Loo Legend',
      unlocked: user.stationsRated >= 10,
      icon: '👑',
      desc: 'Rate 10 stations',
    },
    {
      name: 'Streak Star',
      unlocked: user.streak >= 3,
      icon: '⭐',
      desc: '3-day rating streak',
    },
  ];

  // Format relative time from ISO string
  const formatRelativeTime = (isoStr: string): string => {
    const diffMs = Date.now() - new Date(isoStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays >= 1) return `${diffDays}d ago`;
    if (diffHours >= 1) return `${diffHours}h ago`;
    if (diffMins >= 1) return `${diffMins}m ago`;
    return 'Just now';
  };

  return (
    <div className={`flex-1 flex flex-col justify-between pt-[max(env(safe-area-inset-top),16px)] pb-12 overflow-y-auto ${uiTheme}`}>
      <div className="p-4 flex flex-col gap-6">

        {/* User Profile Header */}
        <div className="flex items-center gap-4 border-b border-slate-800/40 pb-4">
          <div className="w-16 h-16 bg-brand-coral/10 border border-brand-coral text-brand-coral rounded-full flex items-center justify-center font-display text-2xl font-bold uppercase shadow">
            {deriveInitials(user.username)}
          </div>
          <div>
            <h2 className="text-lg font-display font-semibold">{user.username || 'Driver'}</h2>
            <p className="text-xs text-slate-500 font-light">{memberSince}</p>
          </div>
        </div>

        {/* Stat Grid 2x2 Metric Cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Points', val: `${user.points} pts`, icon: '💎' },
            {
              label: 'Reviewer Rank',
              val: reviewerRank
                ? `#${reviewerRank.rank} of ${reviewerRank.total}`
                : '—',
              hint: reviewerRank ? undefined : 'Rate stops to get ranked',
              icon: '🏆',
            },
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
              {'hint' in stat && stat.hint && (
                <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">{stat.hint}</p>
              )}
            </div>
          ))}
        </div>

        {/* Achievement Badges Row */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-slate-400">Achievement Badges</h3>
          <div className="flex gap-2 overflow-x-auto pb-1 select-none">
            {badges.map((badge) => (
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
            {user.recentActivity.length === 0 ? (
              <p className={`text-xs italic text-center py-3 ${secondaryText}`}>
                No ratings yet — rate your first stop!
              </p>
            ) : (
              user.recentActivity.map((entry, idx) => (
                <div key={idx} className={`p-3 rounded-xl text-xs font-light ${cardTheme}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold truncate max-w-[200px]">{entry.stationName}</span>
                    <span className={`font-bold font-mono ${entry.score >= 4 ? 'text-teal-400' : 'text-brand-coral'}`}>
                      {entry.score}★
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{entry.text}</p>
                  <span className="text-[9px] text-slate-500 mt-1 block">Rated {formatRelativeTime(entry.ratedAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Settings link */}
        <button
          onClick={() => {
            setSettingsDisplayName(user.username);
            setSettingsResetArmed(false);
            navigateTo('11_Settings', 'push-left');
          }}
          className="text-xs text-slate-400 hover:text-slate-200 text-center underline font-medium mt-2"
        >
          Configure Settings &amp; Profile Privacy
        </button>
      </div>

      {/* Bottom navigation fixed tab */}
      <BottomTabBar activeTab="profile" navigateTo={navigateTo} />
    </div>
  );
}
