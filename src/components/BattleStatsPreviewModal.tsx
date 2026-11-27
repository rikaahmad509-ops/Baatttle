import React, { useMemo, useState } from 'react';
import {
  AttributeDefinition,
  CombatStats,
  GameMode,
  HeroKey,
  PlayerStats,
  SkillDefinition
} from '../types/game';
import { ATTRIBUTE_POOL, HERO_DATABASE, SKILL_UPGRADE_TRAITS } from '../game/constants';
import { computeRelicSynergies, RELIC_SYNERGY_SETS } from '../game/synergies';
import {
  X,
  Swords,
  Shield,
  Sparkles,
  Zap,
  Pause,
  Play,
  Activity,
  Layers,
  Lock,
  CheckCircle2,
  Flame,
  Gauge
} from 'lucide-react';

interface BattleStatsPreviewModalProps {
  isOpen: boolean;
  heroKey: HeroKey;
  gameMode: GameMode;
  player: PlayerStats;
  combatStats: CombatStats;
  activeSkills: SkillDefinition[];
  attributeCounts: Map<string, number>;
  unlockedTraits: Set<string>;
  isSimPaused: boolean;
  onToggleSimPause?: () => void;
  onClose: () => void;
}

type StatsTab = 'overview' | 'skills' | 'relics';

const RARITY_BADGE: Record<AttributeDefinition['rarity'], string> = {
  common: 'border-slate-700 bg-slate-900/80 text-slate-300',
  rare: 'border-sky-500/45 bg-sky-950/40 text-sky-300',
  epic: 'border-purple-500/45 bg-purple-950/40 text-purple-300',
  legendary: 'border-amber-500/55 bg-amber-950/40 text-amber-300'
};

const CATEGORY_LABEL: Record<AttributeDefinition['category'], string> = {
  offense: 'Offense',
  defense: 'Defense',
  utility: 'Utility',
  unique: 'Unique'
};

const formatDuration = (seconds: number): string => {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
};

const formatDelta = (curr: number, base: number, suffix = '', digits = 0): string | null => {
  const diff = curr - base;
  if (Math.abs(diff) < (digits > 0 ? 0.01 : 0.5)) return null;
  const sign = diff > 0 ? '+' : '';
  return `${sign}${digits > 0 ? diff.toFixed(digits) : Math.round(diff)}${suffix}`;
};

export const BattleStatsPreviewModal: React.FC<BattleStatsPreviewModalProps> = ({
  isOpen,
  heroKey,
  gameMode,
  player,
  combatStats,
  activeSkills,
  attributeCounts,
  unlockedTraits,
  isSimPaused,
  onToggleSimPause,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<StatsTab>('overview');

  const heroCfg = HERO_DATABASE[heroKey];

  const synergies = useMemo(() => {
    const activeSet = new Set<string>();
    attributeCounts.forEach((cnt, id) => {
      if (cnt > 0) activeSet.add(id);
    });
    return player.activeSynergies && player.activeSynergies.length > 0
      ? player.activeSynergies
      : computeRelicSynergies(activeSet);
  }, [attributeCounts, player.activeSynergies]);

  const equippedRelics = useMemo(() => {
    const list: { attr: AttributeDefinition; count: number }[] = [];
    for (const attr of ATTRIBUTE_POOL) {
      const count = attributeCounts.get(attr.id) ?? 0;
      if (count > 0) list.push({ attr, count });
    }
    return list.sort((a, b) => {
      const rank: Record<AttributeDefinition['rarity'], number> = {
        legendary: 4,
        epic: 3,
        rare: 2,
        common: 1
      };
      return rank[b.attr.rarity] - rank[a.attr.rarity] || b.count - a.count;
    });
  }, [attributeCounts]);

  const totalRelicStacks = useMemo(
    () => equippedRelics.reduce((sum, item) => sum + item.count, 0),
    [equippedRelics]
  );

  const unlockedTraitCount = useMemo(() => {
    let count = 0;
    for (const sk of activeSkills) {
      const list = SKILL_UPGRADE_TRAITS[sk.id] || [];
      for (const tr of list) {
        if (unlockedTraits.has(tr.id)) count++;
      }
    }
    return count;
  }, [activeSkills, unlockedTraits]);

  if (!isOpen) return null;

  const hpPct = player.maxHp > 0 ? Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100)) : 0;
  const expPct = player.maxExp > 0 ? Math.max(0, Math.min(100, (player.exp / player.maxExp) * 100)) : 0;
  const armorMitPct = Math.min(62, (player.defense / (player.defense + 110)) * 100);
  const mirageTier = synergies.find((s) => s.id === 'temporal_mirage')?.tier ?? 0;
  const cdrCapPct = mirageTier >= 1 ? 50 : 45;
  const wardDrPct = (player.heroDrWardTimer ?? 0) > 0 ? Math.round((player.heroDrWardPct ?? 0) * 100) : 0;

  const heroPassiveItems: { label: string; value: string; tone?: string }[] = [];
  if (heroKey === 'demonis') {
    heroPassiveItems.push(
      { label: 'FCD Stack', value: `${player.demonisFCD ?? 0} / 30`, tone: 'text-purple-300' },
      { label: 'Shadow Stacks', value: `${player.demonisStacks} / 4`, tone: 'text-fuchsia-300' },
      {
        label: 'Zirah Bayangan',
        value:
          (player.demonisNebulasArmorTimer ?? 0) > 0
            ? `Nebulas (${player.demonisNebulasArmorTimer!.toFixed(1)}s)`
            : (player.demonisBlackholeArmorTimer ?? 0) > 0
            ? `Blackhole (${player.demonisBlackholeArmorTimer!.toFixed(1)}s)`
            : (player.demonisShadowArmorTimer ?? 0) > 0
            ? `Aktif (${player.demonisShadowArmorTimer!.toFixed(1)}s)`
            : 'Tidak Aktif',
        tone: 'text-cyan-300'
      }
    );
  } else if (heroKey === 'traveler') {
    heroPassiveItems.push(
      { label: 'Stance Aktif', value: player.travelerStance.toUpperCase(), tone: 'text-cyan-300' },
      { label: 'Time Stacks', value: `${player.travelerTimeStacks ?? 0}`, tone: 'text-amber-300' },
      { label: 'Paradox Hits', value: `${player.travelerParadoxHits ?? 0} / 4`, tone: 'text-sky-300' },
      {
        label: 'Time Stop',
        value: player.timeStopTimer > 0 ? `${player.timeStopTimer.toFixed(1)}s` : 'Siap',
        tone: 'text-amber-200'
      }
    );
  } else if (heroKey === 'kagero') {
    heroPassiveItems.push(
      { label: 'Blood Stacks', value: `${player.kageroBloodStacks ?? 0}`, tone: 'text-rose-300' },
      { label: 'Blood Marked', value: `${player.kageroBloodMarkCount ?? 0} Musuh`, tone: 'text-red-300' },
      {
        label: 'Crimson Moon',
        value: (player.kageroAwakenTimer ?? 0) > 0 ? `${player.kageroAwakenTimer!.toFixed(1)}s` : 'Normal',
        tone: 'text-rose-200'
      }
    );
  } else if (heroKey === 'axiom') {
    heroPassiveItems.push(
      { label: 'Manipulation Stacks', value: `${player.axiomStacks ?? 0}`, tone: 'text-purple-300' },
      { label: 'Terhipnotis', value: `${player.axiomDominatedCount ?? 0} Musuh`, tone: 'text-cyan-300' },
      {
        label: 'Apex Dominion',
        value: (player.axiomDominionTimer ?? 0) > 0 ? `${player.axiomDominionTimer!.toFixed(1)}s` : player.axiomDeflectReady ? 'Deflect Siap' : 'Vector Control',
        tone: 'text-amber-300'
      }
    );
  } else if (heroKey === 'lumina') {
    heroPassiveItems.push(
      { label: 'Form Saat Ini', value: player.luminaForm === 'light' ? 'LIGHT' : 'MIRROR', tone: 'text-yellow-300' },
      { label: 'Radiant Charge', value: `${player.luminaCharges ?? 0}`, tone: 'text-amber-300' },
      { label: 'Cermin Aktif', value: `${player.luminaMirrorsCount ?? 0}`, tone: 'text-sky-300' }
    );
  } else if (heroKey === 'morphos') {
    heroPassiveItems.push(
      { label: 'Wujud Evo', value: (player.morphosForm ?? 'wolf').toUpperCase(), tone: 'text-emerald-300' },
      { label: 'Evo Stacks', value: `${player.morphosEvoStacks ?? 0}`, tone: 'text-amber-300' },
      {
        label: 'Chimera Mode',
        value: (player.morphosChimeraTimer ?? 0) > 0 ? `${player.morphosChimeraTimer!.toFixed(1)}s` : 'Siap',
        tone: 'text-amber-200'
      }
    );
  } else if (heroKey === 'valkyrie') {
    heroPassiveItems.push(
      { label: 'Frost Mirrors', value: `${player.valkyrieMirrorsCount ?? 0}`, tone: 'text-sky-300' },
      { label: 'Chill Hits', value: `${player.frostChillHits ?? 0} / 3`, tone: 'text-cyan-300' },
      {
        label: 'Sub-Zero State',
        value:
          (player.valkyrieStasisTimer ?? 0) > 0
            ? `Stasis ${player.valkyrieStasisTimer!.toFixed(1)}s`
            : (player.valkyrieEpochTimer ?? 0) > 0
            ? `Epoch ${player.valkyrieEpochTimer!.toFixed(1)}s`
            : 'Frost Armor (-18% DMG)',
        tone: 'text-sky-200'
      }
    );
  } else if (heroKey === 'arcana') {
    heroPassiveItems.push(
      { label: 'Kartu Tangan', value: `${player.arcanaHand?.length ?? 0} / 3`, tone: 'text-pink-300' },
      { label: 'Dadu Takdir', value: `${player.arcanaDiceRoll ?? 6}`, tone: 'text-amber-300' },
      { label: 'Hit Stack', value: `${player.arcanaHitCount ?? 0} / 5`, tone: 'text-cyan-300' }
    );
  } else if (heroKey === 'monkey') {
    heroPassiveItems.push(
      { label: 'Jingu Combo', value: `${player.monkeyComboHits ?? 0} / 4`, tone: 'text-amber-300' },
      { label: 'Segel Sage', value: `${player.monkeySageStacks ?? 0} / 12`, tone: 'text-orange-300' },
      { label: 'Duel Stacks', value: `x${player.monkeyDuelStacks ?? 0}`, tone: 'text-rose-300' }
    );
  } else if (heroKey === 'dimension_judge') {
    heroPassiveItems.push(
      { label: 'Resonansi Dimensi', value: `${Math.min(100, Math.round(player.judgeResonance ?? 0))}%`, tone: 'text-amber-300' },
      {
        label: 'Void Arbiter',
        value: (player.judgeMeleeFormTimer ?? 0) > 0 ? `${player.judgeMeleeFormTimer!.toFixed(1)}s` : 'Tersegel',
        tone: 'text-violet-300'
      },
      {
        label: 'Domain Ruang',
        value: player.judgeDomainTimer > 0 ? `${player.judgeDomainTimer.toFixed(1)}s` : 'Pasif',
        tone: 'text-indigo-300'
      }
    );
  } else if (heroKey === 'rift_walker') {
    heroPassiveItems.push(
      { label: 'Mode', value: player.anomalyCloneActive ? 'CLONE ANOMALI' : 'Quantum Phase', tone: 'text-fuchsia-300' },
      { label: 'Blink Combo', value: `${player.riftBlinkCombo ?? 0} / 5`, tone: 'text-cyan-300' },
      { label: 'Shield Poseidon', value: `${Math.round(player.poseidonArmorHp ?? 0)}`, tone: 'text-sky-300' }
    );
  } else if (heroKey === 'soul_puppeteer') {
    heroPassiveItems.push(
      { label: 'Jiwa Terkumpul', value: `${player.souls ?? 0} / 30`, tone: 'text-fuchsia-300' },
      { label: 'Boneka / Undead', value: `${player.puppetCount ?? 0} / ${player.undeadCount ?? 0}`, tone: 'text-purple-300' },
      {
        label: 'Domain',
        value: (player.puppetDomainTimer ?? 0) > 0 ? `${player.puppetDomainTimer!.toFixed(1)}s` : 'Pasif',
        tone: 'text-rose-300'
      }
    );
  } else if (heroKey === 'solaris') {
    heroPassiveItems.push(
      { label: 'Solar Heat', value: `${player.solarHeat ?? 0} Stack`, tone: 'text-orange-300' },
      {
        label: 'Solar Avatar',
        value: (player.solarAvatarTimer ?? 0) > 0 ? `${player.solarAvatarTimer!.toFixed(1)}s` : 'Pasif',
        tone: 'text-amber-300'
      }
    );
  } else if (heroKey === 'fallen_angel') {
    heroPassiveItems.push(
      { label: 'Bulu Fallen', value: `${player.angelFeathers ?? 0}`, tone: 'text-purple-300' },
      {
        label: 'Ascension Form',
        value:
          (player.trueFallenAngelTimer ?? 0) > 0
            ? `True Fallen ${player.trueFallenAngelTimer!.toFixed(1)}s`
            : (player.angelEclipseTimer ?? 0) > 0
            ? `Eclipse ${player.angelEclipseTimer!.toFixed(1)}s`
            : 'Seraph',
        tone: 'text-fuchsia-300'
      }
    );
  } else if (heroKey === 'demon_raised') {
    heroPassiveItems.push(
      { label: 'Demon Essence', value: `${player.demonEssence ?? 0}`, tone: 'text-rose-300' },
      { label: 'Pasukan Angel / Demon', value: `${player.angelCount ?? 0} / ${player.demonCount ?? 0}`, tone: 'text-amber-200' },
      {
        label: 'Split Realm',
        value: (player.angelDemonTimer ?? 0) > 0 ? `${player.angelDemonTimer!.toFixed(1)}s` : 'Pasif',
        tone: 'text-rose-200'
      }
    );
  } else if (heroKey === 'elementalis') {
    heroPassiveItems.push(
      {
        label: 'Poseidon Armor',
        value:
          (player.poseidonArmorCd ?? 0) > 0
            ? `CD ${Math.ceil(player.poseidonArmorCd!)}s`
            : `${Math.round(player.poseidonArmorHp ?? 1000)} / ${player.poseidonArmorMaxHp ?? 1000}`,
        tone: 'text-teal-300'
      },
      { label: 'Wind / Earth', value: `${player.elementalisWindStacks ?? 0}/10 · ${player.elementalisEarthHits ?? 0}/10`, tone: 'text-emerald-300' },
      {
        label: 'Genesis Realm',
        value: (player.elementalisRealmTimer ?? 0) > 0 ? `${player.elementalisRealmTimer!.toFixed(1)}s` : 'Pasif',
        tone: 'text-cyan-300'
      }
    );
  } else if (heroKey === 'architect') {
    heroPassiveItems.push(
      { label: 'Logic Nodes', value: `${player.architectNodes ?? 0}`, tone: 'text-teal-300' },
      { label: 'Auto-Kode Serangan', value: player.architectCustomAttackName || 'Prisma Pelacak', tone: 'text-amber-200' },
      {
        label: 'Overclock Mode',
        value: (player.architectOverclockTimer ?? 0) > 0 ? `${player.architectOverclockTimer!.toFixed(1)}s` : 'Auto-Coding',
        tone: 'text-amber-300'
      }
    );
  }

  const statRows: {
    label: string;
    value: string;
    delta?: string | null;
    sub?: string;
    accent: string;
  }[] = [
    {
      label: 'Serangan (ATK)',
      value: `${Math.round(player.atk)}`,
      delta: formatDelta(player.atk, heroCfg.atk),
      sub: (player.synergyDmgAmpPct ?? 0) > 0 ? `+${player.synergyDmgAmpPct}% DMG Output` : `Base ${heroCfg.atk}`,
      accent: 'text-rose-300'
    },
    {
      label: 'Kecepatan Serang',
      value: `${player.atkSpeed.toFixed(2)}/d`,
      delta: formatDelta(player.atkSpeed, heroCfg.atkSpeed, '', 2),
      sub: `Base ${heroCfg.atkSpeed.toFixed(2)}/d`,
      accent: 'text-amber-300'
    },
    {
      label: 'Peluang Crit',
      value: `${Math.round(player.critChance * 100)}%`,
      delta: formatDelta(player.critChance * 100, heroCfg.critChance * 100, '%'),
      sub: 'Batas maksimal 100%',
      accent: 'text-orange-300'
    },
    {
      label: 'Damage Crit',
      value: `${Math.round(player.critDmg * 100)}%`,
      delta: formatDelta(player.critDmg * 100, heroCfg.critDmg * 100, '%'),
      sub: `Base ${Math.round(heroCfg.critDmg * 100)}%`,
      accent: 'text-yellow-300'
    },
    {
      label: 'Pertahanan (DEF)',
      value: `${Math.round(player.defense)}`,
      delta: formatDelta(player.defense, heroCfg.defense),
      sub: `Mitigasi Armor -${armorMitPct.toFixed(1)}% (Cap 62%)`,
      accent: 'text-emerald-300'
    },
    {
      label: 'Pengurangan Skill CD',
      value: `${Math.round(player.cdr * 100)}%`,
      delta: null,
      sub: `Batas saat ini ${cdrCapPct}%`,
      accent: 'text-cyan-300'
    },
    {
      label: 'Evasion (Hindar)',
      value: `${Math.round(player.evasion * 100)}%`,
      delta: null,
      sub: 'Batas maksimal 75%',
      accent: 'text-sky-300'
    },
    {
      label: 'Lifesteal',
      value: `${Math.round(player.lifesteal * 100)}%`,
      delta: null,
      sub: 'Pemulihan tiap serangan',
      accent: 'text-pink-300'
    },
    {
      label: 'Kecepatan Gerak',
      value: `${Math.round(player.speed)}`,
      delta: formatDelta(player.speed, heroCfg.speed),
      sub: `Base ${heroCfg.speed}`,
      accent: 'text-teal-300'
    },
    {
      label: 'Jangkauan & Magnet',
      value: `${Math.round(player.range)} px`,
      delta: formatDelta(player.range, heroCfg.range, ' px'),
      sub: `Magnet Soul ${Math.round(player.soulMagnetRange ?? 140)} px`,
      accent: 'text-indigo-300'
    }
  ];

  const activeBuffBadges: { label: string; cls: string }[] = [];
  if (player.rageTimer > 0) {
    activeBuffBadges.push({
      label: `Rage ${player.rageTimer.toFixed(1)}s`,
      cls: 'border-orange-500/50 bg-orange-950/50 text-orange-300'
    });
  }
  if (player.swiftTimer > 0) {
    activeBuffBadges.push({
      label: `Swift +55% Eva (${player.swiftTimer.toFixed(1)}s)`,
      cls: 'border-cyan-500/50 bg-cyan-950/50 text-cyan-300'
    });
  }
  if (player.isTimeStopActive && player.timeStopTimer > 0) {
    activeBuffBadges.push({
      label: `Time Stop ${player.timeStopTimer.toFixed(1)}s`,
      cls: 'border-amber-400/50 bg-amber-950/50 text-amber-200'
    });
  }
  if (player.warArmorActive) {
    activeBuffBadges.push({
      label: `War Armor +${player.warArmorBonusDef || 0} DEF`,
      cls: 'border-blue-500/50 bg-blue-950/50 text-blue-300'
    });
  }
  if (wardDrPct > 0) {
    activeBuffBadges.push({
      label: `Hero Ward -${wardDrPct}% DMG (${(player.heroDrWardTimer ?? 0).toFixed(1)}s)`,
      cls: 'border-emerald-500/50 bg-emerald-950/50 text-emerald-300'
    });
  }
  if ((player.synergyDmgAmpPct ?? 0) > 0) {
    activeBuffBadges.push({
      label: `Sinergi DMG +${player.synergyDmgAmpPct}%`,
      cls: 'border-purple-500/45 bg-purple-950/45 text-purple-200'
    });
  }
  if ((player.synergyDrPct ?? 0) > 0) {
    activeBuffBadges.push({
      label: `Sinergi Bastion -${player.synergyDrPct}% DMG`,
      cls: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
    });
  }
  if ((player.aegisShield ?? 0) > 0) {
    activeBuffBadges.push({
      label: `Titan Aegis ${Math.round(player.aegisShield!)} HP`,
      cls: 'border-cyan-400/50 bg-cyan-950/50 text-cyan-200'
    });
  }

  const threat = combatStats.enemyThreat;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-950/95 border border-slate-700/90 shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header: Hero Identity & Live Vitals */}
        <div className="px-4 py-3.5 sm:px-5 border-b border-slate-800/90 bg-slate-900/70 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center font-title font-black text-lg border-2 shrink-0"
                style={{
                  backgroundColor: `${heroCfg.color}22`,
                  borderColor: heroCfg.color,
                  color: heroCfg.color
                }}
              >
                {heroCfg.name[0]}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-title font-black text-base sm:text-lg text-white tracking-wide truncate">
                    {heroCfg.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/35 text-amber-300 font-title text-[11px] font-bold tabular-nums whitespace-nowrap shrink-0">
                    LV. {player.level}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap shrink-0">
                    {gameMode === 'practice' ? 'Practice Lab' : `Gelombang ${combatStats.wave}`}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">{heroCfg.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onToggleSimPause && (
                <button
                  type="button"
                  onClick={onToggleSimPause}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-title font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isSimPaused
                      ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/30'
                      : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-amber-400/50 hover:text-amber-300'
                  }`}
                  title={isSimPaused ? 'Lanjutkan pertempuran sambil menutup/membuka preview' : 'Jeda pertempuran untuk memeriksa statistik dengan tenang'}
                >
                  {isSimPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isSimPaused ? 'Lanjutkan' : 'Jeda Combat'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-title font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="Tutup Stats Preview [I / Tab / Esc]"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Tutup [I]</span>
              </button>
            </div>
          </div>

          {/* HP & EXP Compact Bars + Instant DPS/Kills Pill Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
            <div className="sm:col-span-7 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                <span className="text-emerald-300 font-bold">
                  HP {Math.round(player.hp)} / {Math.round(player.maxHp)}
                  {(player.aegisShield ?? 0) > 0 && (
                    <span className="text-cyan-300 ml-1.5">(+{Math.round(player.aegisShield!)} Shield)</span>
                  )}
                </span>
                <span className="text-cyan-300">EXP {Math.round(expPct)}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-emerald-400 transition-all duration-150"
                  style={{ width: `${hpPct}%` }}
                />
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-150"
                  style={{ width: `${expPct}%` }}
                />
              </div>
            </div>

            <div className="sm:col-span-5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-slate-900/90 border border-slate-800 px-2 py-1.5">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">DPS Live</div>
                <div className="font-mono text-xs sm:text-sm font-bold text-cyan-300 tabular-nums">
                  {Math.round(combatStats.dps ?? 0).toLocaleString()}
                </div>
              </div>
              <div className="rounded-lg bg-slate-900/90 border border-slate-800 px-2 py-1.5">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Musuh K.O</div>
                <div className="font-mono text-xs sm:text-sm font-bold text-amber-300 tabular-nums">
                  {combatStats.kills.toLocaleString()}
                </div>
              </div>
              <div className="rounded-lg bg-slate-900/90 border border-slate-800 px-2 py-1.5">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Crit Max</div>
                <div className="font-mono text-xs sm:text-sm font-bold text-rose-300 tabular-nums">
                  {Math.round(combatStats.highestCrit).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 pt-0.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-title font-bold flex items-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'overview'
                  ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>Atribut &amp; Combat</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('skills')}
              className={`px-3 py-1.5 rounded-lg text-xs font-title font-bold flex items-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'skills'
                  ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Skill &amp; Trait ({unlockedTraitCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('relics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-title font-bold flex items-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'relics'
                  ? 'bg-purple-500/20 border-purple-400/60 text-purple-200'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Relic &amp; Sinergi ({totalRelicStacks})</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'overview' && (
            <>
              {/* Hero Stats Grid */}
              <div>
                <h3 className="font-title text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Statistik Tempur Efektif</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {statRows.map((row) => (
                    <div
                      key={row.label}
                      className="rounded-xl bg-slate-900/85 border border-slate-800 p-2.5 flex flex-col justify-between"
                    >
                      <div className="text-[11px] text-slate-400 font-semibold leading-tight">
                        {row.label}
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className={`font-mono text-base font-black tabular-nums ${row.accent}`}>
                          {row.value}
                        </span>
                        {row.delta && (
                          <span className="font-mono text-[10px] font-bold text-emerald-400 tabular-nums">
                            ({row.delta})
                          </span>
                        )}
                      </div>
                      {row.sub && (
                        <div className="text-[10px] text-slate-500 font-mono tabular-nums mt-0.5 truncate" title={row.sub}>
                          {row.sub}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Hero Passive State & Active Combat Buffs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <h3 className="font-title text-xs font-bold uppercase tracking-wider text-white">
                        Pasif: {heroCfg.passiveName}
                      </h3>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{heroCfg.passiveDesc}</p>
                  {heroPassiveItems.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {heroPassiveItems.map((item) => (
                        <div
                          key={item.label}
                          className="rounded-lg bg-slate-950/80 border border-slate-800 px-2.5 py-1.5"
                        >
                          <div className="text-[10px] text-slate-400 uppercase">{item.label}</div>
                          <div className={`font-mono text-xs font-bold tabular-nums mt-0.5 ${item.tone || 'text-white'}`}>
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Live Telemetry & Active Buffs */}
                <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-title text-xs font-bold uppercase tracking-wider text-white">
                      Ringkasan Pertempuran &amp; Buff Aktif
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="rounded-lg bg-slate-950/80 border border-slate-800 px-2.5 py-1.5">
                      <div className="text-[10px] text-slate-400">Waktu</div>
                      <div className="font-mono text-xs font-bold text-slate-200 tabular-nums">
                        {formatDuration(combatStats.timeSurvived)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-950/80 border border-slate-800 px-2.5 py-1.5">
                      <div className="text-[10px] text-slate-400">Total DMG</div>
                      <div className="font-mono text-xs font-bold text-emerald-300 tabular-nums">
                        {Math.round(combatStats.damageDealt).toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-950/80 border border-slate-800 px-2.5 py-1.5">
                      <div className="text-[10px] text-slate-400">DMG Diterima</div>
                      <div className="font-mono text-xs font-bold text-rose-300 tabular-nums">
                        {Math.round(combatStats.damageTaken).toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-950/80 border border-slate-800 px-2.5 py-1.5">
                      <div className="text-[10px] text-slate-400">Sisa Musuh</div>
                      <div className="font-mono text-xs font-bold text-cyan-300 tabular-nums">
                        {combatStats.enemiesRemaining ?? 0}
                      </div>
                    </div>
                  </div>

                  {/* Active Buff Tags & Threat */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-400">Buff / Pengubah Aktif:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeBuffBadges.length === 0 && !(threat && threat.tier >= 1) ? (
                        <span className="text-xs text-slate-500">Belum ada buff sementara aktif saat ini</span>
                      ) : (
                        activeBuffBadges.map((b) => (
                          <span
                            key={b.label}
                            className={`px-2 py-0.5 rounded-md border text-[11px] font-mono font-bold tabular-nums ${b.cls}`}
                          >
                            {b.label}
                          </span>
                        ))
                      )}
                      {threat && threat.tier >= 1 && (
                        <span
                          className="px-2 py-0.5 rounded-md border text-[11px] font-mono font-bold tabular-nums"
                          style={{
                            borderColor: `${threat.color}66`,
                            backgroundColor: `${threat.color}1a`,
                            color: threat.color
                          }}
                        >
                          Ancaman {threat.label}: {threat.hpMult.toFixed(2)}x HP · {threat.atkMult.toFixed(2)}x ATK
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Menampilkan {activeSkills.length} Skill Aktif beserta Cooldown Efektif setelah CDR ({Math.round(player.cdr * 100)}%).</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {activeSkills.map((sk, idx) => {
                  const isCdImmune = sk.id === 't_s5' || sk.id === 'mp_s4';
                  let effectiveCd = isCdImmune ? sk.cd : Math.max(1.0, sk.cd * (1 - player.cdr));
                  if (!isCdImmune && player.anomalyCloneActive && unlockedTraits.has('rw_s5_u1')) {
                    effectiveCd = Math.max(0.8, effectiveCd * 0.8);
                  }
                  const remainingCd = player.skillCDs[idx] ?? 0;
                  const traits = SKILL_UPGRADE_TRAITS[sk.id] || [];

                  return (
                    <div
                      key={sk.id}
                      className={`rounded-xl border p-3.5 space-y-2.5 ${
                        sk.isUnique
                          ? 'bg-amber-950/15 border-amber-500/35'
                          : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center font-mono text-xs font-black text-cyan-300 shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-title text-sm font-bold text-white">{sk.name}</span>
                              {sk.isUnique && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-mono font-bold uppercase">
                                  Skill Unik
                                </span>
                              )}
                              {sk.lockedUnique && (
                                <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5" />
                                  Otomatis
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-xs tabular-nums shrink-0">
                          <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300">
                            CD: <strong className="text-cyan-300">{effectiveCd.toFixed(1)}s</strong>
                            {Math.abs(effectiveCd - sk.cd) >= 0.05 && (
                              <span className="text-slate-500 ml-1 line-through">{sk.cd.toFixed(1)}s</span>
                            )}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md border font-bold ${
                              remainingCd <= 0
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                : 'bg-slate-950 border-slate-700 text-amber-300'
                            }`}
                          >
                            {remainingCd <= 0 ? 'SIAP' : `${remainingCd.toFixed(1)}s`}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{sk.desc}</p>

                      {traits.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {traits.map((tr) => {
                            const unlocked = unlockedTraits.has(tr.id);
                            return (
                              <div
                                key={tr.id}
                                className={`rounded-lg border px-2.5 py-2 flex items-start gap-2 ${
                                  unlocked
                                    ? 'bg-emerald-950/30 border-emerald-500/45 text-emerald-100'
                                    : 'bg-slate-950/60 border-slate-800/90 text-slate-400 opacity-75'
                                }`}
                              >
                                {unlocked ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                ) : (
                                  <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                                )}
                                <div className="min-w-0">
                                  <div className="text-xs font-bold flex items-center gap-1.5">
                                    <span>{tr.title}</span>
                                    {unlocked && (
                                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                                        Aktif
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] leading-snug mt-0.5">{tr.desc}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'relics' && (
            <div className="space-y-4">
              {/* Synergies Grid */}
              <div>
                <h3 className="font-title text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-purple-400" />
                  <span>Sinergi Relic Set</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {RELIC_SYNERGY_SETS.map((setDef) => {
                    const live = synergies.find((s) => s.id === setDef.id);
                    const count = live?.count ?? 0;
                    const tier = live?.tier ?? 0;
                    const nextReq = live?.nextRequired ?? setDef.tiers[0].requiredCount;
                    return (
                      <div
                        key={setDef.id}
                        className="rounded-xl border p-3 bg-slate-900/80 space-y-2"
                        style={{
                          borderColor: tier > 0 ? `${setDef.accentColor}77` : '#1e293b'
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="font-title text-xs font-bold" style={{ color: setDef.accentColor }}>
                              {setDef.name}
                            </div>
                            <div className="text-[11px] text-slate-400">{setDef.tagline}</div>
                          </div>
                          <span
                            className="px-2 py-0.5 rounded-md border text-[11px] font-mono font-bold tabular-nums shrink-0"
                            style={{
                              borderColor: tier > 0 ? `${setDef.accentColor}66` : '#334155',
                              backgroundColor: tier > 0 ? `${setDef.accentColor}1f` : 'rgba(15,23,42,0.8)',
                              color: tier > 0 ? setDef.accentColor : '#94a3b8'
                            }}
                          >
                            {tier === 2 ? `Tier II (${count})` : tier === 1 ? `Tier I (${count}/${nextReq})` : `${count}/${nextReq}`}
                          </span>
                        </div>
                        <div className="space-y-1 text-[11px]">
                          {setDef.tiers.map((t) => {
                            const active = tier >= t.tier;
                            return (
                              <div
                                key={t.tier}
                                className={`rounded-lg px-2 py-1 border ${
                                  active
                                    ? 'bg-slate-950/90 border-slate-700 text-slate-100'
                                    : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                                }`}
                              >
                                <span className="font-bold">{t.requiredCount} Relic · {t.title}:</span>{' '}
                                <span>{t.shortBonus}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Equipped Relics */}
              <div>
                <h3 className="font-title text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Relic &amp; Atribut Terpasang ({totalRelicStacks} Total Stack)</span>
                </h3>
                {equippedRelics.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-center text-xs text-slate-400">
                    Belum ada Relic yang dipilih. Naik level atau pasang Relic di Practice Lab untuk melihat rincian efeknya di sini.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {equippedRelics.map(({ attr, count }) => (
                      <div
                        key={attr.id}
                        className={`rounded-xl border p-3 flex items-start justify-between gap-2.5 ${RARITY_BADGE[attr.rarity]}`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-title text-xs font-bold text-white">{attr.title}</span>
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-950/70 border border-slate-700/70">
                              {CATEGORY_LABEL[attr.category]}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-1 leading-snug">{attr.desc}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-slate-950/90 border border-slate-700 font-mono text-xs font-black text-amber-300 tabular-nums shrink-0">
                          x{count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
