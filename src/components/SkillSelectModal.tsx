import React, { useState } from 'react';
import { GameMode, HeroKey, SkillDefinition } from '../types/game';
import { HERO_DATABASE } from '../game/constants';
import { sounds } from '../audio/soundManager';
import { Check, Play, Clock, Zap, Lock } from 'lucide-react';

interface SkillSelectModalProps {
  heroKey: HeroKey;
  gameMode: GameMode;
  onConfirmSkills: (skills: SkillDefinition[]) => void;
  onBack: () => void;
}

export const SkillSelectModal: React.FC<SkillSelectModalProps> = ({
  heroKey,
  gameMode,
  onConfirmSkills,
  onBack
}) => {
  const hero = HERO_DATABASE[heroKey];
  const allSkills = hero.skills;
  // By default, select all skills of the chosen hero (e.g. 3 or 4)
  const [selectedIndices, setSelectedIndices] = useState<number[]>(() => allSkills.map((_, i) => i));

  const toggleSkill = (idx: number) => {
    if (allSkills[idx]?.lockedUnique) return;
    sounds.playSelect();
    const activeCount = selectedIndices.filter(i => !allSkills[i]?.lockedUnique).length;
    if (selectedIndices.includes(idx)) {
      if (activeCount > 1) {
        setSelectedIndices(selectedIndices.filter(i => i !== idx));
      }
    } else {
      setSelectedIndices([...selectedIndices, idx]);
    }
  };

  const handleStart = () => {
    sounds.playSelect();
    const chosen = selectedIndices.map(i => allSkills[i]);
    onConfirmSkills(chosen);
  };

  return (
    <div className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col justify-between p-4 md:p-8 overflow-y-auto">
      {/* Header */}
      <div className="text-center pt-2 pb-4">
        <span className={`text-xs font-mono font-bold uppercase tracking-wider ${gameMode === 'practice' ? 'text-emerald-400' : 'text-cyan-400'}`}>
          {gameMode === 'practice' ? 'Mode Practice · Persiapan Latihan & Uji Relic' : 'Loadout Persiapan Pertarungan'}
        </span>
        <h2 className="font-title text-2xl sm:text-4xl font-black text-white mt-1">
          PILIH SKILL AKTIF {hero.name}
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-lg mx-auto">
          Pilih skill aktif ({selectedIndices.length}/{allSkills.length} terpilih) untuk {gameMode === 'practice' ? 'berlatih di Arena Practice' : 'bertarung di arena'}. Skill dapat dipicu otomatis atau manual dengan tombol {allSkills.map((_, i) => i + 1).join(', ')} / Spasi.
        </p>
      </div>

      {/* Skills Grid */}
      <div className={`grid grid-cols-1 ${allSkills.length >= 5 ? 'sm:grid-cols-2 lg:grid-cols-5 max-w-7xl' : allSkills.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4 max-w-6xl' : allSkills.length === 2 ? 'md:grid-cols-2 max-w-3xl' : 'md:grid-cols-3 max-w-4xl'} gap-4 sm:gap-5 w-full mx-auto my-auto`}>
        {allSkills.map((sk, idx) => {
          const isLockedUnique = Boolean(sk.lockedUnique);
          const isUniqueSkill = Boolean(sk.isUnique || sk.lockedUnique);
          const isSelected = isLockedUnique || selectedIndices.includes(idx);
          return (
            <div
              key={sk.id}
              onClick={() => toggleSkill(idx)}
              className={`p-6 rounded-2xl transition-all border-2 relative flex flex-col justify-between ${
                isLockedUnique
                  ? 'bg-gradient-to-b from-indigo-950/90 to-slate-950 border-amber-400/70 shadow-[0_0_24px_rgba(251,191,36,0.22)] cursor-default'
                  : isSelected
                  ? 'bg-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] transform -translate-y-1 cursor-pointer'
                  : 'bg-slate-900/60 border-slate-800 opacity-60 hover:opacity-90 cursor-pointer'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl border"
                    style={{
                      backgroundColor: isUniqueSkill ? 'rgba(251, 191, 36, 0.14)' : `${hero.color}20`,
                      borderColor: isUniqueSkill ? 'rgba(251, 191, 36, 0.45)' : `${hero.color}50`,
                      color: isUniqueSkill ? '#fbbf24' : hero.color
                    }}
                  >
                    {isLockedUnique ? <Lock className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isUniqueSkill && !isLockedUnique && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-[10px] font-mono font-bold text-amber-300">
                        SKILL UNIK
                      </span>
                    )}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border text-[11px] font-mono ${isLockedUnique ? 'border-amber-500/40 text-amber-300' : 'border-slate-800 text-cyan-400'}`}>
                      {isLockedUnique ? (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>AUTO · CUTSCENE</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>{sk.cd}s CD</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <h3 className={`font-title text-lg font-bold mb-2 ${isUniqueSkill ? 'text-amber-300' : 'text-white'}`}>{sk.name}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{sk.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  {isLockedUnique ? (
                    <span className="text-amber-300 font-bold">TERSEGEL (AUTO)</span>
                  ) : isUniqueSkill ? (
                    <span className="text-amber-300 font-bold">SKILL UNIK · <span className="text-white capitalize">{sk.type}</span></span>
                  ) : (
                    <>Tipe: <span className="text-white capitalize">{sk.type}</span></>
                  )}
                </span>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isLockedUnique
                      ? 'bg-amber-400/20 border border-amber-400/60 text-amber-300'
                      : isSelected
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isLockedUnique ? <Lock className="w-3.5 h-3.5" /> : isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-center gap-4 py-4 max-w-md mx-auto w-full">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-title text-sm transition-colors cursor-pointer"
        >
          KEMBALI
        </button>
        <button
          onClick={handleStart}
          disabled={selectedIndices.length === 0}
          className={`flex-1 px-8 py-3 rounded-xl font-title font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
            selectedIndices.length >= 1
              ? gameMode === 'practice'
                ? 'bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:brightness-110'
                : 'bg-gradient-to-r from-amber-500 to-cyan-500 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:brightness-110'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
          }`}
        >
          <Play className="w-5 h-5 fill-current" />
          <span>{gameMode === 'practice' ? `MASUK PRACTICE (${selectedIndices.length} SKILL)` : `MULAI PERTARUNGAN (${selectedIndices.length} SKILL)`}</span>
        </button>
      </div>
    </div>
  );
};
