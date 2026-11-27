import React from 'react';
import { CombatStats } from '../types/game';
import { sounds } from '../audio/soundManager';
import { Trophy, Sparkles, RotateCcw, Play, Home } from 'lucide-react';

interface VictoryModalProps {
  stats: CombatStats;
  heroName: string;
  onContinueEndless: () => void;
  onRestart: () => void;
  onSelectHero: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  stats,
  heroName,
  onContinueEndless,
  onRestart,
  onSelectHero
}) => {
  return (
    <div className="absolute inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-amber-400/80 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-[0_0_50px_rgba(245,158,11,0.35)] text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8" />
        </div>

        <h1 className="font-title text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-cyan-300 to-emerald-400 mb-1">
          ARENA VICTORY!
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm mb-6">
          Selamat! <span className="text-amber-400 font-bold">{heroName}</span> berhasil menaklukkan <span className="text-red-400 font-bold">Corrupted Hero [LV. 10]</span> dan menuntaskan pertempuran arena!
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-left">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Musuh Ditaklukkan</div>
            <div className="font-title text-2xl font-black text-amber-400 mt-0.5 tabular-nums">
              {stats.kills}
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-left">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Level Akhir</div>
            <div className="font-title text-2xl font-black text-cyan-400 mt-0.5 tabular-nums">
              LV. {stats.level}
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-left">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Kerusakan</div>
            <div className="font-title text-lg font-bold text-white mt-1 tabular-nums">
              {stats.damageDealt.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-left">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Crit Tertinggi</div>
            <div className="font-title text-lg font-bold text-emerald-400 mt-1 tabular-nums">
              {stats.highestCrit.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => { sounds.playSelect(); onContinueEndless(); }}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 hover:brightness-110 text-slate-950 font-title font-black text-lg flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>LANJUTKAN MODE ENDLESS</span>
          </button>

          <button
            onClick={() => { sounds.playSelect(); onRestart(); }}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-title text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
            <span>MAIN LAGI DARI AWAL</span>
          </button>

          <button
            onClick={() => { sounds.playSelect(); onSelectHero(); }}
            className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white font-title text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>KEMBALI KE MENU UTAMA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
