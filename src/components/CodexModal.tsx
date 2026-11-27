import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  BatteryCharging,
  BookOpen,
  Check,
  CircleDot,
  Compass,
  Copy,
  Crosshair,
  Cpu,
  Crown,
  Feather,
  Flame,
  Footprints,
  Gem,
  Ghost,
  Heart,
  Hourglass,
  Lock,
  Magnet,
  Moon,
  Play,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Skull,
  Snowflake,
  Sparkles,
  Sun,
  Sword,
  Swords,
  Target,
  Wand2,
  Wind,
  X,
  Zap
} from 'lucide-react';
import {
  AttributeDefinition,
  BestiaryTier,
  BossCategory,
  CodexProgress,
  HeroKey
} from '../types/game';
import { ATTRIBUTE_POOL, HERO_DATABASE } from '../game/constants';
import {
  BESTIARY_ENTRIES,
  HERO_LORE_CHRONICLES,
  getFullHeroList,
  loadCodexProgress,
  markHeroLoreRead,
  resetCodexProgress
} from '../game/codex';
import { sounds } from '../audio/soundManager';

interface CodexModalProps {
  onBack: () => void;
  onSelectHeroToPlay: (heroKey: HeroKey) => void;
}

type CodexTab = 'heroes' | 'bestiary' | 'relics';
type HeroClassFilter = 'all' | BossCategory;
type BestiaryFilter = 'all' | 'discovered' | 'undiscovered' | BestiaryTier;
type RelicFilter = 'all' | 'collected' | 'uncollected' | 'common' | 'rare' | 'epic' | 'legendary';

const RARITY_STYLES: Record<
  AttributeDefinition['rarity'],
  { label: string; textClass: string; surfaceClass: string; borderClass: string }
> = {
  common: {
    label: 'Common',
    textClass: 'text-slate-300',
    surfaceClass: 'bg-slate-800/50',
    borderClass: 'border-slate-700'
  },
  rare: {
    label: 'Rare',
    textClass: 'text-sky-300',
    surfaceClass: 'bg-sky-950/35',
    borderClass: 'border-sky-800/70'
  },
  epic: {
    label: 'Epic',
    textClass: 'text-violet-300',
    surfaceClass: 'bg-violet-950/35',
    borderClass: 'border-violet-800/70'
  },
  legendary: {
    label: 'Legendary',
    textClass: 'text-amber-300',
    surfaceClass: 'bg-amber-950/30',
    borderClass: 'border-amber-700/70'
  }
};

const TIER_LABELS: Record<BestiaryTier, string> = {
  standard: 'Monster Gelombang',
  summon: 'Panggilan Faksi',
  boss: 'Boss Rotasi',
  apex: 'Boss Puncak Wave 20'
};

const renderRelicIcon = (iconName: string, className: string) => {
  switch (iconName) {
    case 'Heart': return <Heart className={className} />;
    case 'Sword': return <Sword className={className} />;
    case 'Swords': return <Swords className={className} />;
    case 'Target': return <Target className={className} />;
    case 'Footprints': return <Footprints className={className} />;
    case 'Wand2': return <Wand2 className={className} />;
    case 'Activity': return <Activity className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'Feather': return <Feather className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'ShieldCheck': return <ShieldCheck className={className} />;
    case 'ShieldAlert': return <ShieldAlert className={className} />;
    case 'Shield': return <Shield className={className} />;
    case 'Magnet': return <Magnet className={className} />;
    case 'Cpu': return <Cpu className={className} />;
    case 'Hourglass': return <Hourglass className={className} />;
    case 'Flame': return <Flame className={className} />;
    case 'Skull': return <Skull className={className} />;
    case 'Crosshair': return <Crosshair className={className} />;
    case 'Moon': return <Moon className={className} />;
    case 'Wind': return <Wind className={className} />;
    case 'Gem': return <Gem className={className} />;
    case 'Snowflake': return <Snowflake className={className} />;
    case 'Sun': return <Sun className={className} />;
    case 'Ghost': return <Ghost className={className} />;
    case 'BatteryCharging': return <BatteryCharging className={className} />;
    case 'Crown': return <Crown className={className} />;
    case 'CircleDot': return <CircleDot className={className} />;
    case 'Compass': return <Compass className={className} />;
    case 'Copy': return <Copy className={className} />;
    default: return <Sparkles className={className} />;
  }
};

const BestiaryCrest: React.FC<{ color: string; tier: BestiaryTier; unlocked: boolean }> = ({
  color,
  tier,
  unlocked
}) => {
  const stroke = unlocked ? color : '#475569';
  const fill = unlocked ? `${color}1f` : 'rgba(15, 23, 42, 0.7)';
  return (
    <svg viewBox="0 0 64 64" className="w-12 h-12 shrink-0" aria-hidden="true">
      {tier === 'boss' || tier === 'apex' ? (
        <>
          <polygon points="32,4 58,20 52,50 32,60 12,50 6,20" fill={fill} stroke={stroke} strokeWidth="2.2" />
          <polygon points="32,14 46,24 42,42 32,49 22,42 18,24" fill="none" stroke={stroke} strokeWidth="1.4" opacity="0.7" />
          <circle cx="32" cy="31" r={tier === 'apex' ? 6 : 4.5} fill={stroke} opacity={unlocked ? 0.9 : 0.4} />
        </>
      ) : tier === 'summon' ? (
        <>
          <polygon points="32,6 56,32 32,58 8,32" fill={fill} stroke={stroke} strokeWidth="2.2" />
          <circle cx="32" cy="32" r="9" fill="none" stroke={stroke} strokeWidth="1.5" opacity="0.8" />
        </>
      ) : (
        <>
          <circle cx="32" cy="32" r="24" fill={fill} stroke={stroke} strokeWidth="2.2" />
          <polygon points="32,16 44,38 20,38" fill="none" stroke={stroke} strokeWidth="1.8" opacity="0.8" />
        </>
      )}
    </svg>
  );
};

export const CodexModal: React.FC<CodexModalProps> = ({ onBack, onSelectHeroToPlay }) => {
  const allHeroes = useMemo(() => getFullHeroList(), []);
  const [progress, setProgress] = useState<CodexProgress>(() => markHeroLoreRead(allHeroes[0]?.key ?? 'monkey'));

  const [activeTab, setActiveTab] = useState<CodexTab>('heroes');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  const [heroFilter, setHeroFilter] = useState<HeroClassFilter>('all');
  const [selectedHeroKey, setSelectedHeroKey] = useState<HeroKey>(allHeroes[0]?.key ?? 'monkey');

  const [bestiaryFilter, setBestiaryFilter] = useState<BestiaryFilter>('all');
  const [selectedMonsterId, setSelectedMonsterId] = useState<string>(BESTIARY_ENTRIES[0]?.id ?? 'crawler');

  const [relicFilter, setRelicFilter] = useState<RelicFilter>('all');
  const [selectedRelicId, setSelectedRelicId] = useState<string>(ATTRIBUTE_POOL[0]?.id ?? 's_hp');

  // Keyboard Escape returns to title unless typing in search box
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' && searchQuery.length > 0) {
          setSearchQuery('');
          return;
        }
        sounds.playSelect();
        onBack();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onBack, searchQuery.length]);

  const handleSelectHero = (heroKey: HeroKey) => {
    sounds.playSelect();
    setSelectedHeroKey(heroKey);
    const updated = markHeroLoreRead(heroKey);
    setProgress({ ...updated });
  };

  const handleResetCodex = () => {
    sounds.playSelect();
    const fresh = resetCodexProgress();
    if (activeTab === 'heroes') {
      const withCurrentHero = markHeroLoreRead(selectedHeroKey);
      setProgress({ ...withCurrentHero });
    } else {
      setProgress({ ...fresh });
    }
    setConfirmReset(false);
  };

  // Summary completion counts
  const summaryCounts = useMemo(() => {
    const heroesRead = allHeroes.filter((h) => progress.heroes[h.key]?.loreRead).length;
    const heroesPlayed = allHeroes.filter((h) => (progress.heroes[h.key]?.runs ?? 0) > 0).length;
    const monstersDiscovered = BESTIARY_ENTRIES.filter((m) => {
      const rec = progress.monsters[m.id];
      return rec && (rec.encountered > 0 || rec.defeated > 0);
    }).length;
    const relicsCollected = ATTRIBUTE_POOL.filter((r) => (progress.relics[r.id]?.collectedCount ?? 0) > 0).length;
    const totalEntries = allHeroes.length + BESTIARY_ENTRIES.length + ATTRIBUTE_POOL.length;
    const completedEntries = heroesRead + monstersDiscovered + relicsCollected;
    const pct = totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0;
    return {
      heroesRead,
      heroesPlayed,
      heroesTotal: allHeroes.length,
      monstersDiscovered,
      monstersTotal: BESTIARY_ENTRIES.length,
      relicsCollected,
      relicsTotal: ATTRIBUTE_POOL.length,
      pct
    };
  }, [allHeroes, progress]);

  // Filtered Heroes
  const filteredHeroes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allHeroes.filter((hero) => {
      const chronicle = HERO_LORE_CHRONICLES[hero.key];
      const archetype = chronicle?.archetype ?? hero.bossCategory ?? 'Warrior';
      if (heroFilter !== 'all' && archetype !== heroFilter) return false;
      if (!q) return true;
      return (
        hero.name.toLowerCase().includes(q) ||
        hero.subtitle.toLowerCase().includes(q) ||
        hero.lore.toLowerCase().includes(q) ||
        (chronicle?.originRealm.toLowerCase().includes(q) ?? false)
      );
    });
  }, [allHeroes, heroFilter, searchQuery]);

  // Filtered Bestiary
  const filteredMonsters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return BESTIARY_ENTRIES.filter((entry) => {
      const rec = progress.monsters[entry.id];
      const isDiscovered = Boolean(rec && (rec.encountered > 0 || rec.defeated > 0));
      if (bestiaryFilter === 'discovered' && !isDiscovered) return false;
      if (bestiaryFilter === 'undiscovered' && isDiscovered) return false;
      if (
        (bestiaryFilter === 'standard' ||
          bestiaryFilter === 'summon' ||
          bestiaryFilter === 'boss' ||
          bestiaryFilter === 'apex') &&
        entry.tier !== bestiaryFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        entry.name.toLowerCase().includes(q) ||
        entry.title.toLowerCase().includes(q) ||
        entry.waveIntro.toLowerCase().includes(q) ||
        (isDiscovered && entry.lore.toLowerCase().includes(q))
      );
    });
  }, [bestiaryFilter, progress.monsters, searchQuery]);

  // Filtered Relics
  const filteredRelics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ATTRIBUTE_POOL.filter((relic) => {
      const rec = progress.relics[relic.id];
      const isCollected = Boolean(rec && rec.collectedCount > 0);
      if (relicFilter === 'collected' && !isCollected) return false;
      if (relicFilter === 'uncollected' && isCollected) return false;
      if (
        (relicFilter === 'common' ||
          relicFilter === 'rare' ||
          relicFilter === 'epic' ||
          relicFilter === 'legendary') &&
        relic.rarity !== relicFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        relic.title.toLowerCase().includes(q) ||
        relic.desc.toLowerCase().includes(q) ||
        relic.category.toLowerCase().includes(q)
      );
    });
  }, [progress.relics, relicFilter, searchQuery]);

  // Keep selected item aligned with filtered list when filters or search change
  useEffect(() => {
    if (activeTab === 'heroes' && filteredHeroes.length > 0) {
      if (!filteredHeroes.some((h) => h.key === selectedHeroKey)) {
        const nextKey = filteredHeroes[0].key;
        setSelectedHeroKey(nextKey);
        const updated = markHeroLoreRead(nextKey);
        setProgress({ ...updated });
      }
    }
  }, [activeTab, filteredHeroes, selectedHeroKey]);

  useEffect(() => {
    if (activeTab === 'bestiary' && filteredMonsters.length > 0) {
      if (!filteredMonsters.some((m) => m.id === selectedMonsterId)) {
        setSelectedMonsterId(filteredMonsters[0].id);
      }
    }
  }, [activeTab, filteredMonsters, selectedMonsterId]);

  useEffect(() => {
    if (activeTab === 'relics' && filteredRelics.length > 0) {
      if (!filteredRelics.some((r) => r.id === selectedRelicId)) {
        setSelectedRelicId(filteredRelics[0].id);
      }
    }
  }, [activeTab, filteredRelics, selectedRelicId]);

  const activeHero = HERO_DATABASE[selectedHeroKey] ?? allHeroes[0];
  const activeHeroChronicle = HERO_LORE_CHRONICLES[activeHero.key];
  const activeHeroRecord = progress.heroes[activeHero.key] ?? {
    runs: 0,
    victories: 0,
    kills: 0,
    bestWave: 0,
    loreRead: true
  };

  const activeMonster =
    BESTIARY_ENTRIES.find((m) => m.id === selectedMonsterId) ?? BESTIARY_ENTRIES[0];
  const activeMonsterRecord = progress.monsters[activeMonster.id] ?? {
    encountered: 0,
    defeated: 0
  };
  const isMonsterUnlocked =
    activeMonsterRecord.encountered > 0 || activeMonsterRecord.defeated > 0;

  const activeRelic =
    ATTRIBUTE_POOL.find((r) => r.id === selectedRelicId) ?? ATTRIBUTE_POOL[0];
  const activeRelicRecord = progress.relics[activeRelic.id];
  const isRelicCollected = Boolean(activeRelicRecord && activeRelicRecord.collectedCount > 0);

  return (
    <div className="absolute inset-0 z-40 bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Three-Zone Top Bar */}
      <header className="shrink-0 border-b border-slate-800/90 bg-slate-950 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <BookOpen className="w-5 h-5 text-amber-400" aria-hidden="true" />
            <h1 className="font-title text-lg sm:text-xl font-black tracking-wide text-slate-100 whitespace-nowrap">
              Arsip Codex Arena
            </h1>
          </div>

          {/* Zone 2: Section Tabs */}
          <nav
            aria-label="Kategori Codex"
            className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 order-3 lg:order-2 w-full lg:w-auto overflow-x-auto"
          >
            <button
              type="button"
              onClick={() => {
                sounds.playSelect();
                setActiveTab('heroes');
                const updated = markHeroLoreRead(selectedHeroKey);
                setProgress({ ...updated });
              }}
              className={`flex-1 lg:flex-initial min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-title font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                activeTab === 'heroes'
                  ? 'bg-slate-800 text-amber-300 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <span>Lore Pahlawan</span>
              <span className="ml-2 font-mono text-xs tabular-nums text-slate-400">
                {summaryCounts.heroesRead}/{summaryCounts.heroesTotal}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playSelect();
                setActiveTab('bestiary');
              }}
              className={`flex-1 lg:flex-initial min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-title font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                activeTab === 'bestiary'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <span>Bestiary Monster</span>
              <span className="ml-2 font-mono text-xs tabular-nums text-slate-400">
                {summaryCounts.monstersDiscovered}/{summaryCounts.monstersTotal}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playSelect();
                setActiveTab('relics');
              }}
              className={`flex-1 lg:flex-initial min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-title font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                activeTab === 'relics'
                  ? 'bg-slate-800 text-emerald-300 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <span>Koleksi Relik</span>
              <span className="ml-2 font-mono text-xs tabular-nums text-slate-400">
                {summaryCounts.relicsCollected}/{summaryCounts.relicsTotal}
              </span>
            </button>
          </nav>

          {/* Zone 3: Single Primary Exit Action */}
          <div className="flex items-center gap-3 shrink-0 order-2 lg:order-3">
            <button
              type="button"
              onClick={() => {
                sounds.playSelect();
                onBack();
              }}
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs sm:text-sm font-title font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Utility Strip: Completion Overview, Search & Filters */}
      <div className="shrink-0 border-b border-slate-800/70 bg-slate-900/40 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Operational Completion Summary (Zero-Pill plain text with tabular numerals) */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-400 tabular-nums">
            <span className="font-semibold text-slate-200">
              Progres Arsip: {summaryCounts.pct}%
            </span>
            <span aria-hidden="true">·</span>
            <span>Dimainkan {summaryCounts.heroesPlayed}/{summaryCounts.heroesTotal} Pahlawan</span>
            <span aria-hidden="true">·</span>
            <span>Teridentifikasi {summaryCounts.monstersDiscovered}/{summaryCounts.monstersTotal} Monster</span>
            <span aria-hidden="true">·</span>
            <span>Terkumpul {summaryCounts.relicsCollected}/{summaryCounts.relicsTotal} Relik</span>
          </div>

          {/* Search Input + Safe Reset Action */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'heroes'
                    ? 'Cari pahlawan atau alam asal...'
                    : activeTab === 'bestiary'
                      ? 'Cari monster atau gelombang...'
                      : 'Cari nama atau efek relik...'
                }
                aria-label="Cari di dalam Codex"
                className="w-full min-h-[40px] pl-9 pr-8 py-1.5 rounded-lg bg-slate-900 border border-slate-800 focus:border-cyan-500/70 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Hapus pencarian"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 hover:text-slate-200 whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Progres</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleResetCodex}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold whitespace-nowrap cursor-pointer"
                >
                  Konfirmasi Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs whitespace-nowrap cursor-pointer"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Split Archive Workspace */}
      <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto px-4 sm:px-8 py-5 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 h-full min-h-0">
          {/* Left Column: Filter Controls + Entry Index */}
          <aside className="flex flex-col min-h-0 rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden">
            {/* Tab-specific segmented filters */}
            <div className="p-3 border-b border-slate-800/80 flex flex-wrap gap-1.5 shrink-0">
              {activeTab === 'heroes' &&
                (
                  [
                    ['all', 'Semua'],
                    ['Warrior', 'Warrior'],
                    ['Assassin', 'Assassin'],
                    ['Manipulation', 'Manipulation'],
                    ['Tank', 'Tank']
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setHeroFilter(key)}
                    className={`min-h-[34px] px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      heroFilter === key
                        ? 'bg-amber-500/20 text-amber-200 border border-amber-500/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                    }`}
                  >
                    {label}
                  </button>
                ))}

              {activeTab === 'bestiary' &&
                (
                  [
                    ['all', 'Semua'],
                    ['discovered', 'Terbuka'],
                    ['undiscovered', 'Terkunci'],
                    ['standard', 'Standar'],
                    ['summon', 'Summon'],
                    ['boss', 'Boss'],
                    ['apex', 'Wave 20']
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setBestiaryFilter(key)}
                    className={`min-h-[34px] px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      bestiaryFilter === key
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                    }`}
                  >
                    {label}
                  </button>
                ))}

              {activeTab === 'relics' &&
                (
                  [
                    ['all', 'Semua'],
                    ['collected', 'Terkumpul'],
                    ['uncollected', 'Belum Ada'],
                    ['common', 'Common'],
                    ['rare', 'Rare'],
                    ['epic', 'Epic'],
                    ['legendary', 'Legendary']
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRelicFilter(key)}
                    className={`min-h-[34px] px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      relicFilter === key
                        ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                    }`}
                  >
                    {label}
                  </button>
                ))}
            </div>

            {/* Scrollable Index List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/70">
              {activeTab === 'heroes' &&
                (filteredHeroes.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">
                    Tidak ada pahlawan yang cocok dengan pencarian Anda.
                  </div>
                ) : (
                  filteredHeroes.map((hero) => {
                    const rec = progress.heroes[hero.key];
                    const chronicle = HERO_LORE_CHRONICLES[hero.key];
                    const isSelected = selectedHeroKey === hero.key;
                    const playedRuns = rec?.runs ?? 0;
                    return (
                      <button
                        key={hero.key}
                        type="button"
                        onClick={() => handleSelectHero(hero.key)}
                        className={`w-full min-h-[68px] px-4 py-3 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                          isSelected ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center font-title font-black text-base shrink-0 border"
                            style={{
                              backgroundColor: `${hero.color}18`,
                              borderColor: isSelected ? hero.color : `${hero.color}45`,
                              color: hero.color
                            }}
                          >
                            {hero.name[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="font-title text-sm font-bold text-slate-100 truncate">
                              {hero.name}
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              {chronicle?.archetype ?? hero.bossCategory ?? 'Warrior'} ·{' '}
                              <span className="tabular-nums">
                                {playedRuns > 0 ? `${playedRuns}× dimainkan` : 'Belum dimainkan'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">
                          {rec?.loreRead ? (
                            <Check className="w-4 h-4 text-emerald-400" aria-label="Sudah dibaca" />
                          ) : null}
                        </span>
                      </button>
                    );
                  })
                ))}

              {activeTab === 'bestiary' &&
                (filteredMonsters.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">
                    Tidak ada monster yang cocok dengan filter saat ini.
                  </div>
                ) : (
                  filteredMonsters.map((monster) => {
                    const rec = progress.monsters[monster.id];
                    const unlocked = Boolean(rec && (rec.encountered > 0 || rec.defeated > 0));
                    const isSelected = selectedMonsterId === monster.id;
                    return (
                      <button
                        key={monster.id}
                        type="button"
                        onClick={() => {
                          sounds.playSelect();
                          setSelectedMonsterId(monster.id);
                        }}
                        className={`w-full min-h-[68px] px-4 py-3 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                          isSelected ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <BestiaryCrest color={monster.color} tier={monster.tier} unlocked={unlocked} />
                          <div className="min-w-0">
                            <div
                              className={`font-title text-sm font-bold truncate ${
                                unlocked ? 'text-slate-100' : 'text-slate-400'
                              }`}
                            >
                              {monster.name}
                            </div>
                            <div className="text-xs text-slate-400 truncate tabular-nums">
                              {TIER_LABELS[monster.tier]} ·{' '}
                              {unlocked ? `${rec?.defeated ?? 0} dikalahkan` : 'Belum ditemui'}
                            </div>
                          </div>
                        </div>
                        {!unlocked && <Lock className="w-4 h-4 text-slate-500 shrink-0" />}
                      </button>
                    );
                  })
                ))}

              {activeTab === 'relics' &&
                (filteredRelics.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">
                    Tidak ada relik yang cocok dengan filter saat ini.
                  </div>
                ) : (
                  filteredRelics.map((relic) => {
                    const rec = progress.relics[relic.id];
                    const collected = Boolean(rec && rec.collectedCount > 0);
                    const rarityMeta = RARITY_STYLES[relic.rarity];
                    const isSelected = selectedRelicId === relic.id;
                    return (
                      <button
                        key={relic.id}
                        type="button"
                        onClick={() => {
                          sounds.playSelect();
                          setSelectedRelicId(relic.id);
                        }}
                        className={`w-full min-h-[68px] px-4 py-3 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                          isSelected ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                              collected
                                ? `${rarityMeta.surfaceClass} ${rarityMeta.borderClass} ${rarityMeta.textClass}`
                                : 'bg-slate-900 border-slate-800 text-slate-500'
                            }`}
                          >
                            {renderRelicIcon(relic.icon, 'w-5 h-5')}
                          </div>
                          <div className="min-w-0">
                            <div
                              className={`font-title text-sm font-bold truncate ${
                                collected ? 'text-slate-100' : 'text-slate-400'
                              }`}
                            >
                              {relic.title}
                            </div>
                            <div className="text-xs text-slate-400 truncate tabular-nums">
                              <span className={collected ? rarityMeta.textClass : 'text-slate-500'}>
                                {rarityMeta.label}
                              </span>{' '}
                              · {collected ? `Diperoleh ${rec?.collectedCount ?? 0}×` : 'Belum diperoleh'}
                            </div>
                          </div>
                        </div>
                        {!collected && <Lock className="w-4 h-4 text-slate-500 shrink-0" />}
                      </button>
                    );
                  })
                ))}
            </div>
          </aside>

          {/* Right Column: Curatorial Dossier Reader */}
          <section className="min-h-0 rounded-xl bg-slate-900/50 border border-slate-800 overflow-y-auto p-6 sm:p-8">
            {/* HERO LORE DOSSIER */}
            {activeTab === 'heroes' && activeHero && (
              <article className="space-y-7 max-w-4xl">
                <div
                  className="h-[2px] w-full rounded-full"
                  style={{ backgroundColor: activeHero.color }}
                />

                {/* Hero Masthead */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center font-title font-black text-3xl shrink-0 border"
                      style={{
                        backgroundColor: `${activeHero.color}1a`,
                        borderColor: `${activeHero.color}66`,
                        color: activeHero.color
                      }}
                    >
                      {activeHero.name[0]}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 tracking-wide mb-1">
                        {activeHeroChronicle?.originRealm ?? 'Arena Kosmik'} ·{' '}
                        {activeHeroChronicle?.archetype ?? activeHero.bossCategory ?? 'Warrior'} ·{' '}
                        {activeHeroChronicle?.signatureArtifact ?? 'Artifak Pahlawan'}
                      </p>
                      <h2 className="font-title text-2xl sm:text-3xl font-black text-white text-balance">
                        {activeHero.name}
                      </h2>
                      <p className="text-sm font-semibold mt-0.5" style={{ color: activeHero.color }}>
                        {activeHero.subtitle}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playSelect();
                      onSelectHeroToPlay(activeHero.key);
                    }}
                    className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-title font-bold text-sm whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Pilih Pahlawan Ini</span>
                  </button>
                </div>

                {/* Battle Chronicle Strip */}
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-800/80 tabular-nums">
                  <div>
                    <dt className="text-xs text-slate-400">Pertempuran</dt>
                    <dd className="font-mono text-lg font-bold text-slate-100 mt-0.5">
                      {activeHeroRecord.runs}×
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400">Kemenangan Wave 20</dt>
                    <dd className="font-mono text-lg font-bold text-amber-300 mt-0.5">
                      {activeHeroRecord.victories}×
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400">Gelombang Terbaik</dt>
                    <dd className="font-mono text-lg font-bold text-cyan-300 mt-0.5">
                      {activeHeroRecord.bestWave > 0 ? `Wave ${activeHeroRecord.bestWave}` : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400">Total Eliminasi</dt>
                    <dd className="font-mono text-lg font-bold text-emerald-300 mt-0.5">
                      {activeHeroRecord.kills.toLocaleString()}
                    </dd>
                  </div>
                </dl>

                {/* Epigraph Quote */}
                {activeHeroChronicle?.quote && (
                  <blockquote className="py-4 border-b border-slate-800/80 font-title italic text-base sm:text-lg text-slate-200 leading-relaxed max-w-prose">
                    “{activeHeroChronicle.quote}”
                  </blockquote>
                )}

                {/* Lore Chapters */}
                <div className="space-y-6 max-w-prose">
                  <div>
                    <h3 className="font-title text-base font-bold text-slate-100 mb-2">
                      Ringkasan Tawarikh
                    </h3>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed first-letter:text-4xl first-letter:font-title first-letter:font-black first-letter:float-left first-letter:mr-3 first-letter:leading-none first-letter:text-amber-300">
                      {activeHero.lore}
                    </p>
                  </div>

                  {activeHeroChronicle?.chapters.map((chapter, idx) => (
                    <div key={chapter.heading} className="pt-4 border-t border-slate-800/70">
                      <h3 className="font-title text-base font-bold text-slate-100 mb-2">
                        0{idx + 1}. {chapter.heading}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                        {chapter.body}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Combat Attributes & Passive Reference */}
                <div className="pt-5 border-t border-slate-800/80 space-y-5">
                  <div>
                    <h3 className="font-title text-base font-bold text-slate-100 mb-2">
                      Pasif Bawaan · {activeHero.passiveName}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed max-w-prose">
                      {activeHero.passiveDesc}
                    </p>
                  </div>

                  <dl className="grid grid-cols-3 sm:grid-cols-6 gap-3 py-3 border-y border-slate-800/70 text-xs tabular-nums">
                    <div>
                      <dt className="text-slate-400">HP</dt>
                      <dd className="font-mono font-bold text-slate-100 mt-0.5">{activeHero.hp}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">ATK</dt>
                      <dd className="font-mono font-bold text-slate-100 mt-0.5">{activeHero.atk}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">ASPD</dt>
                      <dd className="font-mono font-bold text-slate-100 mt-0.5">{activeHero.atkSpeed}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Crit</dt>
                      <dd className="font-mono font-bold text-slate-100 mt-0.5">
                        {Math.round(activeHero.critChance * 100)}%
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Range</dt>
                      <dd className="font-mono font-bold text-slate-100 mt-0.5">{activeHero.range}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">DEF</dt>
                      <dd className="font-mono font-bold text-slate-100 mt-0.5">{activeHero.defense}</dd>
                    </div>
                  </dl>

                  {/* Skill Roster */}
                  <div>
                    <h3 className="font-title text-base font-bold text-slate-100 mb-3">
                      Daftar Kemampuan ({activeHero.skills.length} Skill)
                    </h3>
                    <div className="divide-y divide-slate-800/70 border-t border-slate-800/70">
                      {activeHero.skills.map((skill, idx) => (
                        <div key={skill.id} className="py-3.5">
                          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                            <span className="font-title text-sm font-bold text-slate-100">
                              {idx + 1}. {skill.name}
                            </span>
                            <span className="text-xs font-mono tabular-nums text-slate-400">
                              CD {skill.cd.toFixed(1)}s · {skill.isUnique ? 'Skill Unik' : skill.type}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-prose">
                            {skill.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            )}

            {/* BESTIARY DOSSIER */}
            {activeTab === 'bestiary' && activeMonster && (
              <article className="space-y-6 max-w-4xl">
                <div
                  className="h-[2px] w-full rounded-full"
                  style={{ backgroundColor: isMonsterUnlocked ? activeMonster.color : '#334155' }}
                />

                <div className="flex items-start gap-4">
                  <BestiaryCrest
                    color={activeMonster.color}
                    tier={activeMonster.tier}
                    unlocked={isMonsterUnlocked}
                  />
                  <div>
                    <p className="text-xs text-slate-400 mb-1">
                      {TIER_LABELS[activeMonster.tier]} · {activeMonster.waveIntro}
                      {activeMonster.bossCategory ? ` · Kelas ${activeMonster.bossCategory}` : ''}
                    </p>
                    <h2 className="font-title text-2xl sm:text-3xl font-black text-white text-balance">
                      {activeMonster.name}
                    </h2>
                    <p
                      className="text-sm font-semibold mt-0.5"
                      style={{ color: isMonsterUnlocked ? activeMonster.color : '#94a3b8' }}
                    >
                      {activeMonster.title}
                    </p>
                  </div>
                </div>

                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-y border-slate-800/80 tabular-nums">
                  <div>
                    <dt className="text-xs text-slate-400">Status Identifikasi</dt>
                    <dd className="text-sm font-bold text-slate-100 mt-0.5">
                      {isMonsterUnlocked ? 'Teridentifikasi' : 'Tersegel (Belum Ditemui)'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400">Total Ditemui</dt>
                    <dd className="font-mono text-base font-bold text-cyan-300 mt-0.5">
                      {activeMonsterRecord.encountered.toLocaleString()}×
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400">Total Dikalahkan</dt>
                    <dd className="font-mono text-base font-bold text-emerald-300 mt-0.5">
                      {activeMonsterRecord.defeated.toLocaleString()}×
                    </dd>
                  </div>
                </dl>

                {!isMonsterUnlocked ? (
                  <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-2 max-w-prose">
                    <div className="flex items-center gap-2 text-slate-200 font-title font-bold text-base">
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span>Catatan Bestiary Masih Tersegel</span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Temui atau kalahkan entitas ini pada <strong className="text-slate-200">{activeMonster.waveIntro}</strong> di Mode Arena atau munculkan di Mode Practice untuk membuka statistik penuh, perilaku serangan, serta catatan kelemahan taktisnya.
                    </p>
                  </div>
                ) : (
                  <>
                    <dl className="grid grid-cols-2 sm:grid-cols-6 gap-3 py-3 border-b border-slate-800/70 text-xs tabular-nums">
                      <div>
                        <dt className="text-slate-400">Base HP</dt>
                        <dd className="font-mono font-bold text-slate-100 mt-0.5">
                          {activeMonster.baseHp.toLocaleString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Base ATK</dt>
                        <dd className="font-mono font-bold text-slate-100 mt-0.5">
                          {activeMonster.baseAtk}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Defense</dt>
                        <dd className="font-mono font-bold text-slate-100 mt-0.5">
                          {activeMonster.defense}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Speed</dt>
                        <dd className="font-mono font-bold text-slate-100 mt-0.5">
                          {activeMonster.speed}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Phys Resist</dt>
                        <dd className="font-mono font-bold text-slate-100 mt-0.5">
                          {activeMonster.physResist ? `${Math.round(activeMonster.physResist * 100)}%` : '0%'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Magic Resist</dt>
                        <dd className="font-mono font-bold text-slate-100 mt-0.5">
                          {activeMonster.magicResist ? `${Math.round(activeMonster.magicResist * 100)}%` : '0%'}
                        </dd>
                      </div>
                    </dl>

                    <div className="space-y-4 max-w-prose">
                      <h3 className="font-title text-base font-bold text-slate-100">
                        Catatan Lapangan
                      </h3>
                      <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                        {activeMonster.lore}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-800/70 space-y-3 max-w-prose">
                      <h3 className="font-title text-base font-bold text-slate-100">
                        Pola Ancaman & Kemampuan
                      </h3>
                      <ul className="space-y-2 text-sm text-slate-300 leading-relaxed list-disc pl-5">
                        {activeMonster.abilities.map((ab) => (
                          <li key={ab}>{ab}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-slate-800/70 space-y-2 max-w-prose">
                      <h3 className="font-title text-base font-bold text-cyan-300">
                        Rekomendasi Taktis
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {activeMonster.tacticalTip}
                      </p>
                    </div>
                  </>
                )}
              </article>
            )}

            {/* RELIC VAULT DOSSIER */}
            {activeTab === 'relics' && activeRelic && (
              <article className="space-y-6 max-w-4xl">
                {(() => {
                  const rarityMeta = RARITY_STYLES[activeRelic.rarity];
                  const heroPartners = (activeRelic.recommendedHeroes ?? [])
                    .map((k) => HERO_DATABASE[k]?.name)
                    .filter(Boolean);
                  return (
                    <>
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 border ${
                            isRelicCollected
                              ? `${rarityMeta.surfaceClass} ${rarityMeta.borderClass} ${rarityMeta.textClass}`
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}
                        >
                          {renderRelicIcon(activeRelic.icon, 'w-8 h-8')}
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">
                            <span className={rarityMeta.textClass}>{rarityMeta.label}</span> · Kategori{' '}
                            {activeRelic.category} ·{' '}
                            {activeRelic.stackable ? 'Dapat di-stack' : 'Relik Tunggal'}
                          </p>
                          <h2 className="font-title text-2xl sm:text-3xl font-black text-white text-balance">
                            {activeRelic.title}
                          </h2>
                          <p className="text-xs sm:text-sm text-slate-400 mt-1 tabular-nums">
                            {isRelicCollected
                              ? `Terkumpul ${activeRelicRecord?.collectedCount ?? 0}× · Pertama ditemukan di Gelombang ${activeRelicRecord?.firstWave ?? 1}`
                              : 'Belum ditemukan dalam pertempuran'}
                          </p>
                        </div>
                      </div>

                      <div className="py-5 border-y border-slate-800/80 space-y-4 max-w-prose">
                        <h3 className="font-title text-base font-bold text-slate-100">
                          Efek & Modifikasi Relik
                        </h3>
                        {isRelicCollected ? (
                          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                            {activeRelic.desc}
                          </p>
                        ) : (
                          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                              <Lock className="w-4 h-4 text-slate-500" />
                              <span>Deskripsi Penuh Menunggu Akuisisi</span>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed">
                              Pilih relik tingkat <strong className={rarityMeta.textClass}>{rarityMeta.label}</strong> ini saat naik level di Arena atau uji coba melalui Mode Practice untuk mencatatnya di Arsip Relik.
                            </p>
                          </div>
                        )}
                      </div>

                      {heroPartners.length > 0 && (
                        <div className="space-y-2 max-w-prose">
                          <h3 className="font-title text-sm font-bold text-amber-300">
                            Sinergi Pahlawan Khusus
                          </h3>
                          <p className="text-sm text-slate-300 leading-relaxed">
                            Relik ini dirancang dengan sinergi istimewa untuk {heroPartners.join(', ')} serta tetap dapat dipakai oleh pahlawan lainnya.
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </article>
            )}
          </section>
        </div>
      </main>
      <footer className="px-4 sm:px-8 py-2 border-t border-slate-900 bg-slate-950/90 text-center">
        <p className="text-[11px] font-mono text-slate-500 tracking-wide">
          Catatan Arsip Terenkripsi: Ketuk Lambang Utama 7x · tekan 7-7-7 · atau ↑↑↓↓←→←→ untuk membuka Kronik Omega (03:00).
        </p>
      </footer>
    </div>
  );
};
