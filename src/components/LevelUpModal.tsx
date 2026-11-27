import React, { useState, useCallback, useMemo } from 'react';
import { AttributeDefinition, HeroKey } from '../types/game';
import { ATTRIBUTE_POOL, SKILL_UPGRADE_TRAITS } from '../game/constants';
import { computeRelicSynergies, computeEnemyThreat, RELIC_SYNERGY_SETS, SYNERGY_BY_CATEGORY } from '../game/synergies';
import { sounds } from '../audio/soundManager';
import { Check, ArrowRight, Sparkles, Zap, RefreshCw, EyeOff, Wand2, AlertTriangle } from 'lucide-react';

interface LevelUpModalProps {
  level: number;
  wave?: number;
  heroKey: string;
  activeSkillIds: string[];
  unlockedTraits: Set<string>;
  acquiredAttributes?: Set<string>;
  pendingCount?: number;
  onConfirmUpgrade: (selectedTraitId: string | null, selectedAttrId: string) => void;
  onDeferUpgrade?: () => void;
  onEnableAutoUpgrade?: (selectedTraitId: string | null, selectedAttrId: string) => void;
}

const RARITY_STYLES: Record<AttributeDefinition['rarity'], string> = {
  common: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  rare: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  epic: 'bg-purple-500/15 text-purple-300 border-purple-500/35',
  legendary: 'bg-amber-500/20 text-amber-300 border-amber-400/50'
};

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  level,
  wave = 1,
  heroKey,
  activeSkillIds,
  unlockedTraits,
  acquiredAttributes,
  pendingCount = 1,
  onConfirmUpgrade,
  onDeferUpgrade,
  onEnableAutoUpgrade
}) => {
  // Collect available skill traits
  const availableTraits: { id: string; title: string; desc: string; icon: string }[] = [];
  for (const skId of activeSkillIds) {
    const traits = SKILL_UPGRADE_TRAITS[skId] || [];
    for (const t of traits) {
      if (!unlockedTraits.has(t.id)) {
        availableTraits.push(t);
      }
    }
  }

  // If no skill traits left, provide a default power boost
  const displayedTraits = availableTraits.slice(0, 3);
  if (displayedTraits.length === 0) {
    displayedTraits.push({
      id: 'default_mastery',
      title: 'Combat Overload',
      desc: '+15% Base Attack Damage & +10% Attack Speed.',
      icon: 'Sword'
    });
  }

  const rollRelicChoices = useCallback((excludeIds: Set<string> = new Set()): AttributeDefinition[] => {
    const owned = acquiredAttributes || new Set<string>();
    const eligible = ATTRIBUTE_POOL.filter(attr => attr.stackable || !owned.has(attr.id));
    const pool = eligible.length >= 4 ? eligible : ATTRIBUTE_POOL.filter(attr => attr.stackable);

    const rarityWeights: Record<AttributeDefinition['rarity'], number> = {
      common: level >= 5 ? 0.5 : 1.0,
      rare: 2.2,
      epic: level >= 3 ? 2.6 : 1.8,
      legendary: level >= 5 ? 2.2 : 1.2
    };

    const getItemWeight = (item: AttributeDefinition): number => {
      let w = rarityWeights[item.rarity];
      if (item.recommendedHeroes && item.recommendedHeroes.length > 0) {
        w *= item.recommendedHeroes.includes(heroKey as HeroKey) ? 2.6 : 0.6;
      }
      return w;
    };

    const weightedPick = (candidates: AttributeDefinition[]): AttributeDefinition | null => {
      if (candidates.length === 0) return null;
      const total = candidates.reduce((sum, item) => sum + getItemWeight(item), 0);
      let r = Math.random() * total;
      for (const item of candidates) {
        r -= getItemWeight(item);
        if (r <= 0) return item;
      }
      return candidates[candidates.length - 1];
    };

    const freshPool = pool.filter(a => !excludeIds.has(a.id));
    const activePool = freshPool.length >= 4 ? freshPool : pool;

    const chosen: AttributeDefinition[] = [];
    const chosenIds = new Set<string>();

    // Guarantee at least 1 Epic/Legendary relic from Lv.2+ (or Rare+ at Lv.1)
    const highTierPool = activePool.filter(a =>
      level >= 2 ? (a.rarity === 'epic' || a.rarity === 'legendary') : a.rarity !== 'common'
    );
    const guaranteed = weightedPick(highTierPool);
    if (guaranteed) {
      chosen.push(guaranteed);
      chosenIds.add(guaranteed.id);
    }

    while (chosen.length < 4) {
      const remaining = activePool.filter(a => !chosenIds.has(a.id));
      const pick = weightedPick(remaining);
      if (!pick) break;
      chosen.push(pick);
      chosenIds.add(pick.id);
    }

    return chosen.sort(() => Math.random() - 0.5);
  }, [acquiredAttributes, heroKey, level]);

  const [rerollsLeft, setRerollsLeft] = useState<number>(2);
  const [displayedAttributes, setDisplayedAttributes] = useState<AttributeDefinition[]>(() => rollRelicChoices());

  const [selectedTraitId, setSelectedTraitId] = useState<string | null>(displayedTraits[0]?.id || null);
  const [selectedAttrId, setSelectedAttrId] = useState<string | null>(displayedAttributes[0]?.id || null);

  const ownedAttrs = useMemo(() => acquiredAttributes || new Set<string>(), [acquiredAttributes]);
  const synergyStates = useMemo(() => computeRelicSynergies(ownedAttrs), [ownedAttrs]);
  const synergyBySetId = useMemo(() => new Map(synergyStates.map((s) => [s.id, s])), [synergyStates]);
  const threatInfo = useMemo(
    () => computeEnemyThreat(wave, synergyStates, ownedAttrs.size),
    [wave, synergyStates, ownedAttrs.size]
  );

  const handleRerollRelics = () => {
    if (rerollsLeft <= 0) return;
    sounds.playSelect();
    const prevIds = new Set(displayedAttributes.map(a => a.id));
    const nextChoices = rollRelicChoices(prevIds);
    setDisplayedAttributes(nextChoices);
    setSelectedAttrId(nextChoices[0]?.id || null);
    setRerollsLeft(r => r - 1);
  };

  const handleConfirm = () => {
    if (!selectedAttrId) return;
    sounds.playSelect();
    onConfirmUpgrade(selectedTraitId, selectedAttrId);
  };

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/90 flex flex-col items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-amber-500/60 rounded-2xl p-6 sm:p-8 max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-[0_0_40px_rgba(245,158,11,0.25)] relative animate-in fade-in zoom-in-95 duration-200">
        {/* Level Up Banner */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="font-title bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Level Up! · Lv. {level}
            </span>
            {pendingCount > 1 && (
              <span className="font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 px-2.5 py-1 rounded-full text-[11px] font-bold">
                +{pendingCount - 1} Antrean Upgrade
              </span>
            )}
            {threatInfo.tier >= 1 && (
              <span
                className="font-mono px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1"
                style={{
                  borderColor: `${threatInfo.color}66`,
                  backgroundColor: `${threatInfo.color}1a`,
                  color: threatInfo.color
                }}
                title="Semakin kuat Sinergi Relic Anda, musuh & boss ikut berevolusi dengan stat dan Affix lebih tinggi"
              >
                <AlertTriangle className="w-3 h-3" />
                Ancaman Musuh: {threatInfo.label} ({threatInfo.hpMult.toFixed(2)}x HP)
              </span>
            )}
          </div>
          <h2 className="font-title text-2xl sm:text-3xl font-black text-white mt-2">
            TINGKATKAN KEKUATAN PAHLAWAN
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Kumpulkan relic berbeda tiap kategori untuk mengaktifkan <strong className="text-amber-300">Sinergi Set (2/4)</strong> — musuh juga beradaptasi sesuai ancaman!
          </p>
        </div>

        {/* 4-Set Relic Synergy Progress Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-5">
          {RELIC_SYNERGY_SETS.map((setDef) => {
            const state = synergyBySetId.get(setDef.id);
            const count = state?.count ?? 0;
            const tier = state?.tier ?? 0;
            const target = tier === 0 ? 2 : 4;
            return (
              <div
                key={setDef.id}
                className="px-2.5 py-2 rounded-xl border bg-slate-950/75"
                style={{
                  borderColor: tier > 0 ? `${setDef.accentColor}88` : '#1e293b',
                  boxShadow: tier === 2 ? `0 0 14px ${setDef.accentColor}2e` : undefined
                }}
                title={`${setDef.tagline}\n• 2 Set: ${setDef.tiers[0].shortBonus}\n• 4 Set Overdrive: ${setDef.tiers[1].shortBonus}`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-title text-[11px] font-bold truncate" style={{ color: setDef.accentColor }}>
                    {setDef.name}
                  </span>
                  <span
                    className={`font-mono text-[10px] font-black px-1.5 py-0.5 rounded border shrink-0 ${
                      tier === 2
                        ? 'bg-amber-500/20 border-amber-400/60 text-amber-300'
                        : tier === 1
                        ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    {tier === 2 ? 'T2 MAX' : tier === 1 ? `T1 · ${count}/${target}` : `${count}/${target}`}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {tier === 2 ? setDef.tiers[1].shortBonus : tier === 1 ? setDef.tiers[0].shortBonus : `2: ${setDef.tiers[0].shortBonus}`}
                </div>
              </div>
            );
          })}
        </div>

        {/* Dual Upgrade Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Column 1: Skill / Trait Upgrade */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-cyan-400" />
              <h3 className="font-title text-cyan-400 text-sm font-bold uppercase tracking-wide">
                1. Upgrade Skill / Sifat
              </h3>
            </div>
            <div className="flex flex-col gap-2.5">
              {displayedTraits.map((t) => {
                const isSelected = selectedTraitId === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      sounds.playSelect();
                      setSelectedTraitId(t.id);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <h4 className="font-title text-sm font-bold text-white mb-1">{t.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{t.desc}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ml-2 ${
                        isSelected ? 'bg-cyan-400 text-slate-950' : 'border border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Attribute Relic */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="font-title text-amber-400 text-sm font-bold uppercase tracking-wide">
                  2. Peningkatan Relic Atribut
                </h3>
              </div>
              <button
                type="button"
                onClick={handleRerollRelics}
                disabled={rerollsLeft <= 0}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-title font-bold border transition-all cursor-pointer ${
                  rerollsLeft > 0
                    ? 'bg-amber-500/15 border-amber-400/50 text-amber-300 hover:bg-amber-500/25'
                    : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                }`}
                title="Acak ulang 4 pilihan relic (maks 2x per level up)"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Acak Relic ({rerollsLeft})</span>
              </button>
            </div>
            <div className="flex flex-col gap-2.5">
              {displayedAttributes.map((attr) => {
                const isSelected = selectedAttrId === attr.id;
                const isAlreadyOwned = ownedAttrs.has(attr.id);
                const setDef = SYNERGY_BY_CATEGORY[attr.category];
                const curSetCount = synergyBySetId.get(setDef.id)?.count ?? 0;
                const nextSetCount = isAlreadyOwned ? curSetCount : curSetCount + 1;
                const unlocksTier1 = !isAlreadyOwned && curSetCount === 1;
                const unlocksTier2 = !isAlreadyOwned && curSetCount === 3;
                return (
                  <div
                    key={attr.id}
                    onClick={() => {
                      sounds.playSelect();
                      setSelectedAttrId(attr.id);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                      isSelected
                        ? 'bg-slate-900 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center flex-wrap gap-1.5 mb-1">
                        <h4 className="font-title text-sm font-bold text-white">{attr.title}</h4>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase font-bold border ${RARITY_STYLES[attr.rarity]}`}>
                          {attr.rarity}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded uppercase bg-slate-800 text-slate-400">
                          {attr.category}
                        </span>
                        {attr.recommendedHeroes?.includes(heroKey as HeroKey) && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/40">
                            SINERGI
                          </span>
                        )}
                        {!isAlreadyOwned && curSetCount < 4 && (
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold border"
                            style={{
                              borderColor: `${setDef.accentColor}77`,
                              backgroundColor: `${setDef.accentColor}1c`,
                              color: setDef.accentColor
                            }}
                          >
                            {unlocksTier2
                              ? `${setDef.name} ${nextSetCount}/4 → TIER II!`
                              : unlocksTier1
                              ? `${setDef.name} ${nextSetCount}/2 → TIER I!`
                              : `${setDef.name} +1 (${nextSetCount}/${curSetCount < 2 ? 2 : 4})`}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{attr.desc}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ml-2 ${
                        isSelected ? 'bg-amber-400 text-slate-950' : 'border border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-2">
          {onDeferUpgrade && (
            <button
              type="button"
              onClick={() => {
                sounds.playSelect();
                onDeferUpgrade();
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400/50 text-slate-200 font-title font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              title="Sembunyikan menu upgrade sementara dan lanjutkan menonton/bertarung tanpa gangguan"
            >
              <EyeOff className="w-4 h-4 text-cyan-400" />
              <span>Sembunyikan &amp; Lanjut Battle</span>
            </button>
          )}

          <button
            onClick={handleConfirm}
            disabled={!selectedAttrId}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-title font-black text-base sm:text-lg flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
          >
            <span>KONFIRMASI &amp; LANJUTKAN</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>

          {onEnableAutoUpgrade && (
            <button
              type="button"
              onClick={() => {
                sounds.playSelect();
                onEnableAutoUpgrade(selectedTraitId, selectedAttrId || displayedAttributes[0]?.id || 's_atk');
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/50 text-emerald-300 font-title font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              title="Aktifkan Auto-Pick agar naik level berikutnya langsung terpilih otomatis tanpa pause"
            >
              <Wand2 className="w-4 h-4 text-emerald-300" />
              <span>Aktifkan Auto-Pick</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
