import React, { useState } from 'react';
import { GameMode, HeroKey } from '../types/game';
import { HERO_DATABASE } from '../game/constants';
import { sounds } from '../audio/soundManager';
import { ArrowRight, Sparkles, Swords, FlaskConical } from 'lucide-react';

interface CharacterSelectModalProps {
  gameMode: GameMode;
  onChangeGameMode: (mode: GameMode) => void;
  onConfirmCharacter: (key: HeroKey) => void;
  onBack: () => void;
}

export const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  gameMode,
  onChangeGameMode,
  onConfirmCharacter,
  onBack
}) => {
  const [selectedKey, setSelectedKey] = useState<HeroKey>('monkey');
  const heroList = Object.values(HERO_DATABASE);
  const currentHero = HERO_DATABASE[selectedKey];

  return (
    <div className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col justify-between p-4 md:p-8 overflow-y-auto">
      {/* Header */}
      <div className="text-center pt-2 pb-4">
        <h2 className="font-title text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-amber-400">
          PILIH PAHLAWAN ARENA
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-md mx-auto">
          Setiap pahlawan memiliki spesialisasi gaya bertarung, kemampuan pasif unik, dan sinergi skill.
        </p>

        {/* Game Mode Toggle */}
        <div className="inline-flex items-center gap-1.5 p-1 mt-3 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => { sounds.playSelect(); onChangeGameMode('arena'); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-title font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              gameMode === 'arena'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>ARENA SURVIVAL</span>
          </button>
          <button
            onClick={() => { sounds.playSelect(); onChangeGameMode('practice'); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-title font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              gameMode === 'practice'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>MODE PRACTICE (UJI RELIC)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Hero Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-w-7xl w-full mx-auto my-auto">
        {heroList.map((h) => {
          const isSelected = selectedKey === h.key;
          return (
            <div
              key={h.key}
              onClick={() => {
                sounds.playSelect();
                setSelectedKey(h.key);
              }}
              className={`p-5 rounded-2xl cursor-pointer transition-all flex flex-col justify-between border-2 relative overflow-hidden group ${
                isSelected
                  ? 'bg-slate-900 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)] transform -translate-y-1'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              {/* Top Accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1 transition-opacity"
                style={{ backgroundColor: h.color, opacity: isSelected ? 1 : 0.4 }}
              />

              <div>
                {/* Hero Avatar / Symbol */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black mb-3 border"
                  style={{
                    backgroundColor: `${h.color}15`,
                    borderColor: `${h.color}40`,
                    color: h.color
                  }}
                >
                  <span className="font-title">{h.name[0]}</span>
                </div>

                <h3 className="font-title text-lg font-bold text-white mb-0.5">{h.name}</h3>
                <span className="text-xs font-semibold block mb-3" style={{ color: h.color }}>
                  {h.subtitle}
                </span>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">{h.lore}</p>
              </div>

              {/* Passive Feature Callout */}
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 mb-3">
                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Pasif: {h.passiveName}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">{h.passiveDesc}</p>
              </div>

              {/* Stats overview */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono border-t border-slate-800/60 pt-2">
                <div>HP: <span className="text-white font-bold">{h.hp}</span></div>
                <div>ATK: <span className="text-white font-bold">{h.atk}</span></div>
                <div>RANGE: <span className="text-white font-bold">{h.range}</span></div>
                <div>SPEED: <span className="text-white font-bold">{h.speed}</span></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-center gap-4 py-4 max-w-md mx-auto w-full">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-title text-sm transition-colors cursor-pointer"
        >
          KEMBALI
        </button>
        <button
          onClick={() => {
            sounds.playSelect();
            onConfirmCharacter(selectedKey);
          }}
          className="flex-1 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-title font-bold text-base flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
        >
          <span>PILIH {currentHero.name}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
