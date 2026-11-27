import React from 'react';
import { sounds } from '../audio/soundManager';
import { Play, RotateCcw, Volume2, VolumeX, Home } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onQuitToTitle: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isPracticeMode?: boolean;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onQuitToTitle,
  isMuted,
  onToggleMute,
  isPracticeMode
}) => {
  return (
    <div className="absolute inset-0 z-50 bg-slate-950/90 flex flex-col items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center">
        <h2 className="font-title text-3xl font-black text-amber-400 mb-2">
          {isPracticeMode ? 'PRACTICE PAUSED' : 'GAME PAUSED'}
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mb-6">
          {isPracticeMode ? 'Arena latihan dijeda sementara.' : 'Pertarungan dihentikan sementara.'}
        </p>

        {/* Controls Reminder */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-left mb-6 text-xs text-slate-300 space-y-1.5">
          <div className="text-[10px] font-title font-bold text-cyan-400 uppercase">Kontrol Navigasi:</div>
          <div>• <span className="font-mono text-white">WASD / Panah / Drag Sentuh</span> : Bergerak manual</div>
          <div>• <span className="font-mono text-white">1, 2, 3, 4</span> : Picu Skill Manual</div>
          <div>• <span className="font-mono text-white">Spasi</span> : Serangan / Skill Cepat</div>
          <div>• <span className="font-mono text-white">Esc</span> : Jeda Permainan</div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => { sounds.playSelect(); onResume(); }}
            className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-title font-black text-base flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>LANJUTKAN (RESUME)</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-title text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO'}</span>
          </button>

          <button
            onClick={() => { sounds.playSelect(); onRestart(); }}
            className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-amber-400 font-title text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer border border-amber-500/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isPracticeMode ? 'RESET ARENA PRACTICE' : 'ULANGI GELOMBANG (RESTART)'}</span>
          </button>

          <button
            onClick={() => { sounds.playSelect(); onQuitToTitle(); }}
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
