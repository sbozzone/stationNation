'use client';

import React, { useState } from 'react';
import { ScreenRouterProps, getTheme } from '../screenProps';
import { updateMyUsername } from '../../../lib/data';

export function SettingsScreen({
  navigateTo,
  safeAtNightMode,
  settingsDisplayName,
  setSettingsDisplayName,
  settingsResetArmed,
  setSettingsResetArmed,
  setUsername,
  setShowToast,
  setToastMessage,
  session,
  handleSignOut,
}: Pick<
  ScreenRouterProps,
  | 'navigateTo'
  | 'safeAtNightMode'
  | 'settingsDisplayName'
  | 'setSettingsDisplayName'
  | 'settingsResetArmed'
  | 'setSettingsResetArmed'
  | 'setUsername'
  | 'setShowToast'
  | 'setToastMessage'
  | 'session'
  | 'handleSignOut'
>) {
  const { uiTheme, cardTheme, borderTheme } = getTheme(safeAtNightMode);
  const nameValid = settingsDisplayName.trim().length > 0;
  // Inline error/saving state for the display-name save (server-side username).
  const [nameError, setNameError] = useState<string>('');
  const [nameSaving, setNameSaving] = useState<boolean>(false);

  // Save the display name locally and, when signed in, to profiles.username.
  const saveDisplayName = async () => {
    const trimmed = settingsDisplayName.trim();
    if (!trimmed || nameSaving) return;
    setNameError('');

    // Signed in: update the server username first so a collision blocks the save.
    if (session) {
      setNameSaving(true);
      const result = await updateMyUsername(session.user.id, trimmed);
      setNameSaving(false);
      if (result === 'name_taken') {
        setNameError('That name is taken');
        return;
      }
      if (result === false) {
        setNameError('Could not save. Try again.');
        return;
      }
    }

    setUsername(trimmed);
    setToastMessage('Display name saved!');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className={`flex-1 flex flex-col pt-[max(env(safe-area-inset-top),16px)] pb-12 ${uiTheme}`}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between border-b ${borderTheme}`}>
        <button
          onClick={() => navigateTo('09_Profile', 'push-right')}
          className="text-slate-400 hover:text-slate-200 p-1 bg-slate-800/20 rounded-lg text-lg font-bold"
        >
          ‹ Back
        </button>
        <span className="text-xs font-bold uppercase tracking-widest text-[#378ADD]">Settings</span>
        <div className="w-6" />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">

        {/* Display name */}
        <div className={`p-4 rounded-2xl flex flex-col gap-3 ${cardTheme}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Display Name</h3>
          <input
            type="text"
            value={settingsDisplayName}
            onChange={(e) => setSettingsDisplayName(e.target.value)}
            maxLength={20}
            placeholder="Your nickname"
            className="w-full bg-slate-800/60 text-white font-sans text-base px-4 py-3 rounded-xl border border-slate-700/60 outline-none focus:border-[#5B9BD5] transition-all"
          />
          <button
            disabled={!nameValid || nameSaving}
            onClick={saveDisplayName}
            className={`w-full font-semibold py-3 rounded-xl font-display transition-all text-sm ${
              nameValid && !nameSaving
                ? 'bg-[#1A52B5] hover:bg-[#1645A0] text-white cursor-pointer'
                : 'bg-[#1A52B5]/40 text-white/50 cursor-not-allowed'
            }`}
          >
            {nameSaving ? 'Saving…' : 'Save'}
          </button>
          {nameError && (
            <span className="text-xs text-red-400 font-semibold">{nameError}</span>
          )}
        </div>

        {/* Account (Supabase magic-link sign-in) */}
        <div className={`p-4 rounded-2xl flex flex-col gap-3 ${cardTheme}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Account</h3>
          {session ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400">Signed in as</span>
                <span className="text-xs font-semibold text-slate-200 truncate max-w-[200px]">
                  {session.user.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full font-semibold py-3 rounded-xl font-display transition-all text-sm bg-transparent hover:bg-slate-800/40 text-slate-300 border border-slate-700/60 cursor-pointer"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => navigateTo('12_SignIn', 'push-left')}
              className="w-full font-semibold py-3 rounded-xl font-display transition-all text-sm bg-[#1A52B5] hover:bg-[#1645A0] text-white cursor-pointer"
            >
              Sign in
            </button>
          )}
        </div>

        {/* Data privacy caption */}
        <p className="text-[11px] text-slate-500 leading-relaxed text-center px-2">
          Your data: nickname and stats are stored on this device only. Reviews you post are public.
        </p>

        {/* Reset local profile */}
        <div className={`p-4 rounded-2xl flex flex-col gap-3 ${cardTheme}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Danger Zone</h3>
          <button
            onClick={() => {
              if (!settingsResetArmed) {
                setSettingsResetArmed(true);
                return;
              }
              // Confirmed — clear localStorage and reload
              try {
                window.localStorage.removeItem('stationnation.profile');
                window.localStorage.removeItem('stationnation.votes');
              } catch {}
              window.location.reload();
            }}
            className={`w-full font-semibold py-3 rounded-xl font-display transition-all text-sm border ${
              settingsResetArmed
                ? 'bg-red-700/80 hover:bg-red-700 text-white border-red-600 cursor-pointer'
                : 'bg-transparent hover:bg-red-900/20 text-red-400 border-red-900/40 cursor-pointer'
            }`}
          >
            {settingsResetArmed ? 'Tap again to confirm' : 'Reset local profile'}
          </button>
          {settingsResetArmed && (
            <p className="text-[10px] text-red-400/80 text-center">
              This will erase your nickname, stats, and vote history from this device and restart onboarding.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
