import React, { useEffect, useRef, useState } from 'react';
import { HeroKey } from '../types/game';
import { HERO_DATABASE } from '../game/constants';
import { sounds } from '../audio/soundManager';
import { Play, Volume2, VolumeX, FlaskConical, BookOpen } from 'lucide-react';

interface TitleScreenProps {
  onStart: () => void;
  onStartPractice: () => void;
  onOpenCodex: () => void;
  onSelectHeroDirect: (hero: HeroKey) => void;
  onTriggerEasterEgg?: () => void;
  disableHotkeys?: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onStartPractice,
  onOpenCodex,
  onSelectHeroDirect,
  onTriggerEasterEgg,
  disableHotkeys = false,
  isMuted,
  onToggleMute
}) => {
  const [sealTaps, setSealTaps] = useState<number>(0);
  const sealResetRef = useRef<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disableHotkeys) return;
      if (e.target instanceof HTMLElement && e.target.closest('button')) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        sounds.playSelect();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disableHotkeys, onStart]);

  useEffect(() => {
    return () => {
      if (sealResetRef.current !== null) {
        window.clearTimeout(sealResetRef.current);
      }
    };
  }, []);

  const handleEmblemTap = () => {
    if (!onTriggerEasterEgg) return;
    if (sealResetRef.current !== null) {
      window.clearTimeout(sealResetRef.current);
    }
    const next = sealTaps + 1;
    sounds.playEasterEggTap(next);
    if (next >= 7) {
      setSealTaps(0);
      onTriggerEasterEgg();
      return;
    }
    setSealTaps(next);
    sealResetRef.current = window.setTimeout(() => {
      setSealTaps(0);
    }, 3200);
  };

  return (
    <div className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col justify-between p-6 md:p-12 overflow-y-auto">
      {/* Top Bar with sound toggle */}
      <div className="flex justify-between items-center w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
          <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">Version 2.0 · Arena Survival</span>
        </div>
        <button
          onClick={onToggleMute}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors text-xs font-game"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          <span>{isMuted ? 'Muted' : 'Sound On'}</span>
        </button>
      </div>

      {/* Hero Title Lockup & 35% Negative Space */}
      <div className="flex flex-col items-center justify-center my-auto text-center max-w-4xl mx-auto py-8">
        {/* Bespoke Inline SVG Logo Lockup (Hidden 7-Tap Omega Seal) */}
        <button
          type="button"
          onClick={handleEmblemTap}
          aria-label="Fantasy Arena Emblem"
          className="relative mb-6 group cursor-pointer focus:outline-none rounded-full p-1 transition-transform active:scale-95"
        >
          <svg
            className={`w-20 h-20 md:w-28 md:h-28 mx-auto transition-all duration-200 ${
              sealTaps >= 4
                ? 'drop-shadow-[0_0_34px_rgba(250,204,21,0.75)] scale-105'
                : 'drop-shadow-[0_0_25px_rgba(6,182,212,0.4)]'
            }`}
            viewBox="0 0 100 100"
            fill="none"
          >
            <polygon points="50,5 92,28 92,72 50,95 8,72 8,28" stroke="url(#cyanGrad)" strokeWidth="3" fill="rgba(15, 23, 42, 0.6)" />
            <polygon points="50,16 80,33 80,67 50,84 20,67 20,33" stroke="url(#goldGrad)" strokeWidth="2" fill="none" opacity="0.6" />
            <path d="M50 25 L50 75 M30 40 L70 40 M35 60 L65 60" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
            <defs>
              <linearGradient id="cyanGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#06b6d4" />
                <stop offset="1" stopColor="#a855f7" />
              </linearGradient>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f59e0b" />
                <stop offset="1" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
          {sealTaps >= 3 && (
            <div className="flex items-center justify-center gap-1 mt-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((step) => (
                <span
                  key={step}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    step <= sealTaps ? 'bg-amber-300 shadow-[0_0_6px_#fde047]' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          )}
        </button>

        <h1 className="font-title text-4xl sm:text-6xl md:text-7xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-cyan-400 to-purple-400 drop-shadow-md">
          FANTASY ARENA
        </h1>
        <p className="font-title text-sm sm:text-lg tracking-widest text-cyan-300/80 uppercase mt-2 mb-4">
          AUTO BATTLE SURVIVOR
        </p>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-8">
          Kendalikan pahlawan legendaris dalam pertarungan arena tanpa henti. Kloning master kera, sinar laser kehampaan, pergeseran dimensi waktu, dan build atribut tanpa batas.
        </p>

        {/* Primary, Practice Mode & Codex CTA Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => { sounds.playSelect(); onStart(); }}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-title font-black text-base sm:text-lg tracking-wider shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer whitespace-nowrap shrink-0 w-full sm:w-auto focus-visible:outline-2 focus-visible:outline-white"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>MULAI PERTARUNGAN</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-950/30 text-slate-900 font-mono">ENTER</span>
          </button>

          <button
            type="button"
            onClick={() => { sounds.playSelect(); onStartPractice(); }}
            className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border-2 border-emerald-400/70 text-emerald-300 hover:text-emerald-200 font-title font-black text-base tracking-wider shadow-[0_0_24px_rgba(16,185,129,0.25)] transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer whitespace-nowrap shrink-0 w-full sm:w-auto focus-visible:outline-2 focus-visible:outline-emerald-300"
          >
            <FlaskConical className="w-5 h-5" />
            <span>MODE PRACTICE</span>
          </button>

          <button
            type="button"
            onClick={() => { sounds.playSelect(); onOpenCodex(); }}
            className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-amber-500/12 hover:bg-amber-500/22 border-2 border-amber-400/65 text-amber-200 hover:text-white font-title font-black text-base tracking-wider shadow-[0_0_22px_rgba(245,158,11,0.18)] transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer whitespace-nowrap shrink-0 w-full sm:w-auto focus-visible:outline-2 focus-visible:outline-amber-300"
          >
            <BookOpen className="w-5 h-5 text-amber-300" />
            <span>BUKA CODEX</span>
          </button>
        </div>

        {/* Character Roster Quick Selector */}
        <div className="flex flex-wrap justify-center gap-3 mt-10 w-full max-w-5xl">
          {Object.values(HERO_DATABASE).map((h) => (
            <button
              key={h.key}
              onClick={() => { sounds.playSelect(); onSelectHeroDirect(h.key); }}
              className="w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.5rem)] lg:w-[calc(25%-0.5625rem)] p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-600 text-left transition-all hover:bg-slate-800/80 group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: h.color }}></span>
                <span className="font-title text-xs font-bold text-slate-200 group-hover:text-white truncate">{h.name}</span>
              </div>
              <span className="text-[11px] text-slate-400 block truncate">{h.subtitle}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Flat Single Control-Hint Line */}
      <div className="w-full text-center py-4 border-t border-slate-900">
        <p className="text-xs text-slate-500 font-game tracking-wider">
          WASD / Drag Move · Space Action · 1–5 Manual Skills · Esc Pause · M Mute
        </p>
      </div>
    </div>
  );
};
