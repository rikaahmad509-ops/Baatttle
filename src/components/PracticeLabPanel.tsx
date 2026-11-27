import React, { useEffect, useMemo, useState } from 'react';
import {
  AttributeDefinition,
  CombatStats,
  EnemyResistPreset,
  HeroKey,
  PlayerStats,
  SkillDefinition
} from '../types/game';
import { ATTRIBUTE_POOL, HERO_DATABASE, SKILL_UPGRADE_TRAITS } from '../game/constants';
import { computeEnemyThreat, computeRelicSynergies, RELIC_SYNERGY_SETS } from '../game/synergies';
import { sounds } from '../audio/soundManager';
import {
  FlaskConical,
  Target,
  Swords,
  Shield,
  Sparkles,
  RotateCcw,
  Heart,
  Trash2,
  Plus,
  Minus,
  Search,
  X,
  Pause,
  Play,
  Users,
  Skull,
  Crown,
  Activity,
  Zap
} from 'lucide-react';

interface PracticeLabPanelProps {
  heroKey: HeroKey;
  player: PlayerStats;
  combatStats: CombatStats;
  activeSkills: SkillDefinition[];
  attributeCounts: Map<string, number>;
  unlockedTraits: Set<string>;
  practiceWave: number;
  godMode: boolean;
  autoHealDummy: boolean;
  isSimPaused: boolean;
  onToggleSimPause: () => void;
  onToggleRelic: (attrId: string) => void;
  onSetRelicCount: (attrId: string, count: number) => void;
  onClearRelics: () => void;
  onToggleTrait: (traitId: string) => void;
  onSwitchHero: (heroKey: HeroKey) => void;
  onSetWave: (wave: number) => void;
  onSpawnDummy: (kind: 'static' | 'striker', resistPreset?: EnemyResistPreset) => void;
  onSpawnSwarm: () => void;
  onSpawnSkilledMobs: () => void;
  onSpawnBoss: (
    type: 'wari' | 'dank' | 'shadow_assassin' | 'void_dragon' | 'corrupted_hero',
    corruptedHeroKey?: HeroKey
  ) => void;
  onClearEnemies: () => void;
  onResetMetrics: () => void;
  onResetCooldowns: () => void;
  onFullHeal: () => void;
  onGrantLevel: (levels: number) => void;
  onToggleGodMode: () => void;
  onToggleAutoHealDummy: () => void;
}

type LabTab = 'relics' | 'hero' | 'enemies';
type CategoryFilter = 'all' | AttributeDefinition['category'];

const RARITY_STYLES: Record<AttributeDefinition['rarity'], { border: string; text: string; label: string }> = {
  common: { border: 'border-slate-700', text: 'text-slate-300', label: 'Common' },
  rare: { border: 'border-sky-500/50', text: 'text-sky-300', label: 'Rare' },
  epic: { border: 'border-purple-500/50', text: 'text-purple-300', label: 'Epic' },
  legendary: { border: 'border-amber-500/60', text: 'text-amber-300', label: 'Legendary' }
};

export const PracticeLabPanel: React.FC<PracticeLabPanelProps> = ({
  heroKey,
  player,
  combatStats,
  activeSkills,
  attributeCounts,
  unlockedTraits,
  practiceWave,
  godMode,
  autoHealDummy,
  isSimPaused,
  onToggleSimPause,
  onToggleRelic,
  onSetRelicCount,
  onClearRelics,
  onToggleTrait,
  onSwitchHero,
  onSetWave,
  onSpawnDummy,
  onSpawnSwarm,
  onSpawnSkilledMobs,
  onSpawnBoss,
  onClearEnemies,
  onResetMetrics,
  onResetCooldowns,
  onFullHeal,
  onGrantLevel,
  onToggleGodMode,
  onToggleAutoHealDummy
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<LabTab>('relics');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [corruptTarget, setCorruptTarget] = useState<HeroKey>('demonis');
  const [dummyResist, setDummyResist] = useState<EnemyResistPreset>('none');

  const totalRelicsEquipped = useMemo(() => {
    let total = 0;
    attributeCounts.forEach((c) => {
      total += c;
    });
    return total;
  }, [attributeCounts]);

  const practiceSynergies = useMemo(() => {
    const distinctIds = new Set<string>();
    attributeCounts.forEach((count, id) => {
      if (count > 0) distinctIds.add(id);
    });
    return computeRelicSynergies(distinctIds);
  }, [attributeCounts]);

  const practiceThreat = useMemo(
    () => computeEnemyThreat(practiceWave, practiceSynergies, practiceSynergies.reduce((s, a) => s + a.count, 0)),
    [practiceWave, practiceSynergies]
  );

  const filteredRelics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ATTRIBUTE_POOL.filter((attr) => {
      if (category !== 'all' && attr.category !== category) return false;
      if (q && !attr.title.toLowerCase().includes(q) && !attr.desc.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      const aActive = (attributeCounts.get(a.id) ?? 0) > 0 ? 1 : 0;
      const bActive = (attributeCounts.get(b.id) ?? 0) > 0 ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      const aRec = a.recommendedHeroes?.includes(heroKey) ? 1 : 0;
      const bRec = b.recommendedHeroes?.includes(heroKey) ? 1 : 0;
      return bRec - aRec;
    });
  }, [category, searchQuery, attributeCounts, heroKey]);

  const heroTraits = useMemo(() => {
    const list: { skillName: string; trait: { id: string; title: string; desc: string; icon: string } }[] = [];
    for (const sk of activeSkills) {
      const traits = SKILL_UPGRADE_TRAITS[sk.id] || [];
      for (const tr of traits) {
        list.push({ skillName: sk.name, trait: tr });
      }
    }
    return list;
  }, [activeSkills]);

  const otherHeroes = useMemo(
    () => Object.values(HERO_DATABASE).filter((h) => h.key !== heroKey),
    [heroKey]
  );

  useEffect(() => {
    if (!otherHeroes.some((h) => h.key === corruptTarget) && otherHeroes.length > 0) {
      setCorruptTarget(otherHeroes[0].key);
    }
  }, [otherHeroes, corruptTarget]);

  return (
    <>
      {/* Compact Floating Practice Bar (always accessible without obstructing center arena) */}
      <div className="absolute top-[134px] md:top-[96px] left-1/2 -translate-x-1/2 z-[25] pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/90 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)] max-w-[96vw]">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-title font-black uppercase tracking-wider">
          <FlaskConical className="w-3.5 h-3.5" />
          <span>PRACTICE LAB</span>
        </div>

        {/* Live DPS & Crit Telemetry */}
        <div className="flex items-center gap-2.5 px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono">
          <span className="text-slate-400">
            DPS: <strong className="text-amber-400 tabular-nums">{(combatStats.dps ?? 0).toLocaleString()}</strong>
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">
            Max Crit: <strong className="text-rose-400 tabular-nums">{combatStats.highestCrit.toLocaleString()}</strong>
          </span>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="text-slate-400 hidden md:inline">
            Total: <strong className="text-cyan-300 tabular-nums">{combatStats.damageDealt.toLocaleString()}</strong>
          </span>
        </div>

        <button
          onClick={() => { sounds.playSelect(); onSpawnDummy('static'); }}
          className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[11px] font-title font-bold flex items-center gap-1 transition-colors cursor-pointer"
          title="Spawn Training Dummy diam"
        >
          <Target className="w-3.5 h-3.5" />
          <span>+ Dummy</span>
        </button>

        <button
          onClick={() => { sounds.playSelect(); onResetCooldowns(); }}
          className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-[11px] font-title font-bold flex items-center gap-1 transition-colors cursor-pointer"
          title="Reset semua cooldown skill & pasif"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset CD</span>
        </button>

        <button
          onClick={() => { sounds.playSelect(); onFullHeal(); }}
          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[11px] font-title font-bold flex items-center gap-1 transition-colors cursor-pointer"
          title="Pulihkan HP 100%"
        >
          <Heart className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Heal</span>
        </button>

        <button
          onClick={() => { sounds.playSelect(); onClearEnemies(); }}
          className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-title font-bold flex items-center gap-1 transition-colors cursor-pointer"
          title="Bersihkan musuh dari arena"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden md:inline">Clear</span>
        </button>

        <button
          onClick={() => { sounds.playSelect(); setIsOpen(!isOpen); }}
          className={`px-3 py-1 rounded-lg text-[11px] font-title font-black flex items-center gap-1.5 transition-all cursor-pointer border ${
            isOpen
              ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
              : 'bg-gradient-to-r from-cyan-500/25 to-purple-500/25 hover:from-cyan-500/35 hover:to-purple-500/35 text-cyan-200 border-cyan-400/50'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5" />
          <span>RELIC & LAB ({totalRelicsEquipped})</span>
        </button>
      </div>

      {/* Collapsible Side Practice Lab Drawer */}
      {isOpen && (
        <div className="absolute top-0 right-0 bottom-0 w-full sm:w-[430px] z-[35] pointer-events-auto bg-slate-950/95 border-l border-cyan-500/30 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-900/80">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-title text-sm font-black text-white tracking-wide">PRACTICE & RELIC LAB</h3>
                <p className="text-[10px] text-slate-400">Uji kombinasi Relic, Hero, Skill Trait & Boss</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { sounds.playSelect(); onToggleSimPause(); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-title font-bold flex items-center gap-1 border cursor-pointer ${
                  isSimPaused
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title="Jeda/jalankan simulasi arena saat memilih relic"
              >
                {isSimPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3" />}
                <span>{isSimPaused ? 'Lanjut' : 'Jeda'}</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-3 gap-1 p-2 bg-slate-900/50 border-b border-slate-800">
            <button
              onClick={() => { sounds.playSelect(); setActiveTab('relics'); }}
              className={`py-2 rounded-lg text-xs font-title font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'relics'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Relic ({totalRelicsEquipped})</span>
            </button>
            <button
              onClick={() => { sounds.playSelect(); setActiveTab('hero'); }}
              className={`py-2 rounded-lg text-xs font-title font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'hero'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Hero & Trait</span>
            </button>
            <button
              onClick={() => { sounds.playSelect(); setActiveTab('enemies'); }}
              className={`py-2 rounded-lg text-xs font-title font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'enemies'
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Skull className="w-3.5 h-3.5" />
              <span>Musuh & Boss</span>
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* TAB 1: RELICS */}
            {activeTab === 'relics' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari nama atau efek relic..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <button
                    onClick={() => { sounds.playSelect(); onClearRelics(); }}
                    disabled={totalRelicsEquipped === 0}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 disabled:opacity-40 border border-rose-500/30 text-rose-300 text-[11px] font-title font-bold cursor-pointer disabled:cursor-not-allowed"
                    title="Lepas semua relic aktif"
                  >
                    Reset Relik
                  </button>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-1">
                  {(['all', 'offense', 'defense', 'utility', 'unique'] as CategoryFilter[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-title font-bold uppercase tracking-wider border cursor-pointer transition-colors ${
                        category === cat
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat === 'all' ? 'Semua' : cat}
                    </button>
                  ))}
                </div>

                {/* Relic Synergy Set Tracker */}
                <div className="grid grid-cols-2 gap-1.5">
                  {RELIC_SYNERGY_SETS.map((setDef) => {
                    const syn = practiceSynergies.find((s) => s.id === setDef.id);
                    const tier = syn?.tier ?? 0;
                    const count = syn?.count ?? 0;
                    return (
                      <div
                        key={setDef.id}
                        className="px-2 py-1.5 rounded-lg border bg-slate-900/90"
                        style={{ borderColor: tier > 0 ? `${setDef.accentColor}77` : '#1e293b' }}
                        title={`2 Set: ${setDef.tiers[0].shortBonus}\n4 Set Overdrive: ${setDef.tiers[1].shortBonus}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-title text-[10px] font-bold truncate" style={{ color: setDef.accentColor }}>
                            {setDef.name}
                          </span>
                          <span className="font-mono text-[9px] font-bold text-slate-300 tabular-nums">
                            {tier === 2 ? 'T2 MAX' : tier === 1 ? `T1 (${count}/4)` : `${count}/2`}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400 truncate">
                          {tier === 2 ? setDef.tiers[1].shortBonus : tier === 1 ? setDef.tiers[0].shortBonus : setDef.tiers[0].shortBonus}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Relic List */}
                <div className="space-y-2">
                  {filteredRelics.map((attr) => {
                    const count = attributeCounts.get(attr.id) ?? 0;
                    const isActive = count > 0;
                    const rarityStyle = RARITY_STYLES[attr.rarity];
                    const isRecommended = attr.recommendedHeroes?.includes(heroKey);

                    return (
                      <div
                        key={attr.id}
                        className={`p-2.5 rounded-xl border transition-all ${
                          isActive
                            ? 'bg-cyan-950/35 border-cyan-400/70 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                            : `bg-slate-900/70 ${rarityStyle.border} hover:bg-slate-900`
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-title text-xs font-bold text-white">{attr.title}</span>
                              <span className={`text-[9px] uppercase font-mono font-bold ${rarityStyle.text}`}>
                                [{rarityStyle.label}]
                              </span>
                              {isRecommended && (
                                <span className="text-[9px] font-bold uppercase text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">
                                  Sinergi Hero
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-300 leading-snug mt-1">{attr.desc}</p>
                          </div>

                          {attr.stackable ? (
                            <div className="flex items-center gap-1 shrink-0 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                              <button
                                onClick={() => { sounds.playSelect(); onSetRelicCount(attr.id, count - 1); }}
                                disabled={count <= 0}
                                className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center font-mono text-xs font-bold text-cyan-300 tabular-nums">
                                {count}
                              </span>
                              <button
                                onClick={() => { sounds.playSelect(); onSetRelicCount(attr.id, count + 1); }}
                                className="w-6 h-6 rounded flex items-center justify-center text-cyan-300 hover:bg-slate-800 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { sounds.playSelect(); onToggleRelic(attr.id); }}
                              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-title font-bold uppercase cursor-pointer transition-colors border ${
                                isActive
                                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 hover:bg-rose-500/20 hover:border-rose-400 hover:text-rose-300'
                                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-cyan-500 hover:text-slate-950 hover:border-cyan-400'
                              }`}
                            >
                              {isActive ? 'Terpasang' : 'Pasang'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* TAB 2: HERO & TRAITS */}
            {activeTab === 'hero' && (
              <>
                {/* Live Hero Stat Sheet */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-title font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5" />
                      Statistik Hero Saat Ini
                    </span>
                    <span className="text-[11px] font-mono text-amber-400 font-bold">LV. {player.level}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                    <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800/80">
                      <span className="text-slate-400 block text-[9px]">ATK</span>
                      <strong className="text-amber-300">{Math.round(player.atk)}</strong>
                    </div>
                    <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800/80">
                      <span className="text-slate-400 block text-[9px]">ASPD</span>
                      <strong className="text-cyan-300">{player.atkSpeed.toFixed(2)}/s</strong>
                    </div>
                    <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800/80">
                      <span className="text-slate-400 block text-[9px]">CRIT</span>
                      <strong className="text-rose-300">{Math.round(player.critChance * 100)}% ({Math.round(player.critDmg * 100)}%)</strong>
                    </div>
                    <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800/80">
                      <span className="text-slate-400 block text-[9px]">DEF</span>
                      <strong className="text-emerald-300">{Math.round(player.defense)}</strong>
                    </div>
                    {(() => {
                      const hasMirageCap = (practiceSynergies.find((s) => s.id === 'temporal_mirage')?.tier ?? 0) >= 1;
                      const cdrCapLabel = hasMirageCap ? '50%' : '40%';
                      return (
                        <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800/80" title={`Max CDR: ${cdrCapLabel} · Max Evasion: 75%`}>
                          <span className="text-slate-400 block text-[9px]">CDR (Max {cdrCapLabel}) / EVA</span>
                          <strong className="text-purple-300">{Math.round(player.cdr * 100)}% / {Math.round(player.evasion * 100)}%</strong>
                        </div>
                      );
                    })()}
                    <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800/80">
                      <span className="text-slate-400 block text-[9px]">LIFESTEAL</span>
                      <strong className="text-pink-300">{Math.round(player.lifesteal * 100)}%</strong>
                    </div>
                  </div>
                </div>

                {/* Practice Toggles & Quick Level */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="text-[10px] font-title font-bold uppercase tracking-wider text-emerald-400">
                    Pengaturan Latihan
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { sounds.playSelect(); onToggleGodMode(); }}
                      className={`p-2 rounded-lg border text-xs font-title font-bold flex items-center justify-between cursor-pointer ${
                        godMode
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> God Mode</span>
                      <span>{godMode ? 'ON' : 'OFF'}</span>
                    </button>
                    <button
                      onClick={() => { sounds.playSelect(); onToggleAutoHealDummy(); }}
                      className={`p-2 rounded-lg border text-xs font-title font-bold flex items-center justify-between cursor-pointer ${
                        autoHealDummy
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> Dummy Abadi</span>
                      <span>{autoHealDummy ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { sounds.playSelect(); onGrantLevel(1); }}
                      className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-title font-bold border border-amber-500/30 cursor-pointer"
                    >
                      +1 Level Hero
                    </button>
                    <button
                      onClick={() => { sounds.playSelect(); onGrantLevel(5); }}
                      className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-title font-bold border border-amber-500/30 cursor-pointer"
                    >
                      +5 Level Hero
                    </button>
                  </div>
                </div>

                {/* Hot-Swap Hero */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[10px] font-title font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Ganti Hero Langsung (Relik Tetap Terpasang)
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.values(HERO_DATABASE).map((h) => {
                      const active = h.key === heroKey;
                      return (
                        <button
                          key={h.key}
                          onClick={() => { if (!active) { sounds.playSelect(); onSwitchHero(h.key); } }}
                          className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2 ${
                            active
                              ? 'bg-slate-800 border-cyan-400 text-white'
                              : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: h.color }} />
                          <span className="font-title text-[11px] font-bold truncate">{h.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hero Skill Upgrade Traits */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="text-[10px] font-title font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    Upgrade Trait Skill ({HERO_DATABASE[heroKey].name})
                  </div>
                  {heroTraits.map(({ skillName, trait }) => {
                    const isUnlocked = unlockedTraits.has(trait.id);
                    return (
                      <div
                        key={trait.id}
                        onClick={() => { sounds.playSelect(); onToggleTrait(trait.id); }}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isUnlocked
                            ? 'bg-purple-950/40 border-purple-400'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-title text-xs font-bold text-white">{trait.title}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isUnlocked ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {isUnlocked ? 'AKTIF' : 'PASANG'}
                          </span>
                        </div>
                        <div className="text-[10px] text-purple-300/80 mt-0.5">{skillName}</div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-snug">{trait.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* TAB 3: ENEMIES & BOSSES */}
            {activeTab === 'enemies' && (
              <>
                {/* Wave Difficulty Scaling */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-title font-bold uppercase tracking-wider text-cyan-400">
                      Skala Kekuatan Gelombang
                    </span>
                    <span className="font-title text-sm font-black text-amber-400">Wave {practiceWave}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSetWave(practiceWave - 1)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex-1 grid grid-cols-6 gap-1">
                      {[1, 4, 8, 12, 16, 20].map((w) => (
                        <button
                          key={w}
                          onClick={() => { sounds.playSelect(); onSetWave(w); }}
                          className={`py-1 rounded text-[11px] font-mono font-bold border cursor-pointer ${
                            practiceWave === w
                              ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                          }`}
                        >
                          W{w}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => onSetWave(practiceWave + 1)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div
                    className="flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-mono"
                    style={{
                      borderColor: `${practiceThreat.color}66`,
                      backgroundColor: `${practiceThreat.color}14`,
                      color: practiceThreat.color
                    }}
                  >
                    <span className="font-bold">⚠️ Ancaman: {practiceThreat.label}</span>
                    <span className="text-slate-200 tabular-nums">
                      {practiceThreat.hpMult.toFixed(2)}x HP · {practiceThreat.atkMult.toFixed(2)}x ATK · Elite {Math.round(practiceThreat.eliteChance * 100)}% · Boss {practiceThreat.bossAffixCount} Affix
                    </span>
                  </div>
                </div>

                {/* Spawn Dummies & Mobs */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[10px] font-title font-bold uppercase tracking-wider text-amber-400">
                      Spawn Target Latihan & Pasukan
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                      Wave DR: <strong className="text-amber-300">{Math.min(80, Math.max(0, (practiceWave - 1) * 5))}%</strong>
                    </span>
                  </div>

                  {/* Dummy Resistance Selector */}
                  <div className="flex items-center justify-between gap-2 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-300 pl-1">Resistansi Dummy:</span>
                    <div className="flex items-center gap-1">
                      {(
                        [
                          { id: 'none', label: 'Normal' },
                          { id: 'physical', label: '🛡️ Phys 35%' },
                          { id: 'magical', label: '✦ Magic 35%' },
                          { id: 'both', label: 'Both 25%' }
                        ] as { id: EnemyResistPreset; label: string }[]
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => { sounds.playSelect(); setDummyResist(opt.id); }}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer whitespace-nowrap ${
                            dummyResist === opt.id
                              ? 'bg-cyan-500 text-slate-950'
                              : 'bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => { sounds.playSelect(); onSpawnDummy('static', dummyResist); }}
                      className="p-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-left cursor-pointer transition-colors"
                    >
                      <div className="font-title text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Target className="w-4 h-4" /> Training Dummy (Diam · 0 ATK · 150K+ HP)
                      </div>
                      <div className="text-[10px] text-slate-300 mt-0.5">Cocok untuk menguji DPS murni, resistansi Physical/Magic & proc Relic.</div>
                    </button>

                    <button
                      onClick={() => { sounds.playSelect(); onSpawnDummy('striker', dummyResist); }}
                      className="p-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-left cursor-pointer transition-colors"
                    >
                      <div className="font-title text-xs font-bold text-rose-300 flex items-center gap-1.5">
                        <Swords className="w-4 h-4" /> Combat Dummy (Bergerak & Menyerang)
                      </div>
                      <div className="text-[10px] text-slate-300 mt-0.5">Untuk menguji Evasion, Shield, Thornmail, Lifesteal & 72-Form.</div>
                    </button>

                    <button
                      onClick={() => { sounds.playSelect(); onSpawnSwarm(); }}
                      className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-left cursor-pointer transition-colors"
                    >
                      <div className="font-title text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                        <Users className="w-4 h-4" /> Spawn Swarm (5 Musuh Arena)
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Memanggil campuran Crawler, Bandit, Skilled Mobs & Brute.</div>
                    </button>

                    <button
                      onClick={() => { sounds.playSelect(); onSpawnSkilledMobs(); }}
                      className="p-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-left cursor-pointer transition-colors"
                    >
                      <div className="font-title text-xs font-bold text-purple-300 flex items-center gap-1.5">
                        <Zap className="w-4 h-4" /> Spawn Monster Lemah Berskill (3 Tipe)
                      </div>
                      <div className="text-[10px] text-slate-300 mt-0.5">Arcane Imp (Bolt & Hex), Thorn Swarmer (Dash & Quill), Frost Acolyte (Nova & Heal).</div>
                    </button>
                  </div>
                </div>

                {/* Spawn Bosses */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="text-[10px] font-title font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5" /> Spawn Boss Arena (Skala Wave {practiceWave})
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { sounds.playSelect(); onSpawnBoss('wari'); }}
                      className="p-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-title font-bold cursor-pointer"
                    >
                      🛡️ Tank: Wari
                    </button>
                    <button
                      onClick={() => { sounds.playSelect(); onSpawnBoss('dank'); }}
                      className="p-2 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/40 text-orange-300 text-xs font-title font-bold cursor-pointer"
                    >
                      ⚔️ Warrior: Dank
                    </button>
                    <button
                      onClick={() => { sounds.playSelect(); onSpawnBoss('shadow_assassin'); }}
                      className="p-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-title font-bold cursor-pointer"
                    >
                      🗡️ Assassin: Nyx
                    </button>
                    <button
                      onClick={() => { sounds.playSelect(); onSpawnBoss('void_dragon'); }}
                      className="p-2 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 text-xs font-title font-bold cursor-pointer"
                    >
                      🌀 Void Dread
                    </button>
                  </div>

                  {/* Corrupted Rival Hero Boss */}
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-red-300">Corrupted Rival Hero:</span>
                      <select
                        value={corruptTarget}
                        onChange={(e) => setCorruptTarget(e.target.value as HeroKey)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-red-400"
                      >
                        {otherHeroes.map((h) => (
                          <option key={h.key} value={h.key}>
                            {h.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => { sounds.playSelect(); onSpawnBoss('corrupted_hero', corruptTarget); }}
                      className="w-full py-2 rounded-lg bg-gradient-to-r from-red-600/30 to-purple-600/30 hover:from-red-600/45 hover:to-purple-600/45 border border-red-500/50 text-red-200 text-xs font-title font-bold cursor-pointer"
                    >
                      👑 Spawn Corrupted {HERO_DATABASE[corruptTarget]?.name || 'Hero'}
                    </button>
                  </div>
                </div>

                {/* Arena Cleanup & Metrics Reset */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { sounds.playSelect(); onClearEnemies(); }}
                    className="py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-title font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Bersihkan Musuh</span>
                  </button>
                  <button
                    onClick={() => { sounds.playSelect(); onResetMetrics(); }}
                    className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-title font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Meter DPS</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
