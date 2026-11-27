import React from 'react';
import { CombatStats } from '../types/game';
import { sounds } from '../audio/soundManager';
import { RotateCcw, Home, Skull, Flame, Trophy, Clock, Target } from 'lucide-react';

interface GameOverModalProps {
  stats: CombatStats;
  heroName: string;
  onRestart: () => void;
  onSelectHero: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  heroName,
  onRestart,
  onSelectHero
}) => {
  return (
    <div className="absolute inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-red-500/60 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-[0_0_40px_rgba(239,68,68,0.3)] text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-500 border border-red-500/40 flex items-center justify-center mx-auto mb-4">
          <Skull className="w-8 h-8" />
        </div>

        <h1 className="font-title text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-amber-500 mb-1">
          GAME OVER
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mb-6">
          Pahlawan <span className="text-white font-bold">{heroName}</span> gugur dalam pertempuran arena.
        </p>

        {/* Combat Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-left">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Gelombang Bertahan</span>
            </div>
            <div className="font-title text-2xl font-black text-amber-400 mt-0.5 tabular-nums">
              WAVE {stats.wave}
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-left">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Skull className="w-3.5 h-3.5 text-red-400" />
              <span>Musuh Dikalahkan</span>
            </div>
            <div className="font-title text-2xl font-black text-white mt-0.5 tabular-nums">
              {stats.kills}
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-left">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Total Damage Dealt</span>
            </div>
            <div className="font-title text-lg font-bold text-orange-400 mt-1 tabular-nums">
              {stats.damageDealt.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-left">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>Crit Tertinggi</span>
            </div>
            <div className="font-title text-lg font-bold text-cyan-400 mt-1 tabular-nums">
              {stats.highestCrit.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => { sounds.playSelect(); onRestart(); }}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-400 hover:to-amber-400 text-slate-950 font-title font-black text-lg flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(239,68,68,0.4)] transition-all cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            <span>MAIN LAGI (RESTART)</span>
          </button>

          <button
            onClick={() => { sounds.playSelect(); onSelectHero(); }}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-title text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>GANTI PAHLAWAN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
