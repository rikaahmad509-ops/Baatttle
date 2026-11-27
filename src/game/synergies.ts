import {
  ActiveRelicSynergyState,
  AttributeDefinition,
  EnemyAffix,
  EnemyThreatInfo,
  RelicSynergyCategory,
  RelicSynergyId,
  RelicSynergySetDefinition
} from '../types/game';
import { ATTRIBUTE_POOL } from './constants';

export const RELIC_SYNERGY_SETS: RelicSynergySetDefinition[] = [
  {
    id: 'crimson_carnage',
    name: 'Crimson Carnage',
    category: 'offense',
    accentColor: '#f43f5e',
    tagline: 'Sinergi Relic Offense — Kritikal & Penghancur Armor',
    tiers: [
      {
        tier: 1,
        requiredCount: 2,
        title: 'Tier I · Bloodlust Edge',
        shortBonus: '+14% Crit DMG · +8% DMG Output',
        desc: '+14% Critical Damage dan +8% seluruh Damage Hero & Clone.'
      },
      {
        tier: 2,
        requiredCount: 4,
        title: 'Tier II · Crimson Overdrive',
        shortBonus: '+10% Crit · +18% ASPD · Armor Sunder & +12% Crit True DMG',
        desc: '+10% Crit Chance, +18% ASPD, dan Critical merobek -8% DEF musuh (stack) + +12% True Damage bonus!'
      }
    ]
  },
  {
    id: 'eternal_bastion',
    name: 'Eternal Bastion',
    category: 'defense',
    accentColor: '#10b981',
    tagline: 'Sinergi Relic Defense — Benteng & Balasan Aegis',
    tiers: [
      {
        tier: 1,
        requiredCount: 2,
        title: 'Tier I · Aegis Plate',
        shortBonus: '+18 DEF · +180 HP · -8% DMG Diterima',
        desc: '+18 Defense, +180 Max HP, dan mengurangi seluruh damage diterima sebesar 8%.'
      },
      {
        tier: 2,
        requiredCount: 4,
        title: 'Tier II · Bulwark Overdrive',
        shortBonus: 'Auto Shield +140+6% HP · Skill Bulwark Wave',
        desc: 'Setiap Skill memancarkan gelombang Benteng (95% DEF + 45% ATK True DMG) & memberi Shield 140 + 6% Max HP (CD 4.5s).'
      }
    ]
  },
  {
    id: 'temporal_mirage',
    name: 'Temporal Mirage',
    category: 'utility',
    accentColor: '#06b6d4',
    tagline: 'Sinergi Relic Utility — Tempo Skill & Mobilitas',
    tiers: [
      {
        tier: 1,
        requiredCount: 2,
        title: 'Tier I · Quicksilver Flow',
        shortBonus: '+10% CDR (Cap 50%) · +24 SPD · +6% Evasion',
        desc: '+10% Cooldown Reduction (batas CDR naik ke 50%), +24 Speed, dan +6% Evasion.'
      },
      {
        tier: 2,
        requiredCount: 4,
        title: 'Tier II · Chrono Overdrive',
        shortBonus: 'Skill Cast: -0.45s CD Lain · +20% ASPD (3s)',
        desc: 'Setiap mengaktifkan Skill memotong cooldown skill lain -0.45 detik & memberi +20% Attack Speed selama 3 detik.'
      }
    ]
  },
  {
    id: 'prism_apex',
    name: 'Prism Apex',
    category: 'unique',
    accentColor: '#c084fc',
    tagline: 'Sinergi Relic Unique — Resonansi Skill & Prism Bolt',
    tiers: [
      {
        tier: 1,
        requiredCount: 2,
        title: 'Tier I · Astral Resonance',
        shortBonus: '+12% ATK · +150 HP · +10 DEF · +6% Lifesteal',
        desc: '+12% ATK, +150 Max HP, +10 Defense, dan +6% Lifesteal secara permanen.'
      },
      {
        tier: 2,
        requiredCount: 4,
        title: 'Tier II · Prismatic Overdrive',
        shortBonus: '+18% DMG Amp · Tiap 4 Hit: 2 Prism Bolt (95% ATK True DMG)',
        desc: '+18% total Damage Amplification dan setiap 4 serangan dasar menembakkan 2 Prism Bolt (95% ATK True DMG)!'
      }
    ]
  }
];

export const SYNERGY_BY_CATEGORY: Record<RelicSynergyCategory, RelicSynergySetDefinition> = {
  offense: RELIC_SYNERGY_SETS[0],
  defense: RELIC_SYNERGY_SETS[1],
  utility: RELIC_SYNERGY_SETS[2],
  unique: RELIC_SYNERGY_SETS[3]
};

export const ENEMY_AFFIX_META: Record<
  EnemyAffix,
  { label: string; shortTag: string; color: string; desc: string }
> = {
  ironclad: {
    label: 'Ironclad',
    shortTag: '🛡️ BAJA',
    color: '#34d399',
    desc: '+35% DEF, +28% HP & memiliki Energy Barrier pelindung'
  },
  frenzied: {
    label: 'Frenzied',
    shortTag: '⚡ FRENZY',
    color: '#fb923c',
    desc: '+26% Speed, +32% Kecepatan Serang & +18% ATK'
  },
  vampiric: {
    label: 'Vampiric',
    shortTag: '🩸 VAMPIR',
    color: '#f43f5e',
    desc: '+16% ATK & memulihkan HP tiap mengenai target'
  },
  void_thorns: {
    label: 'Void Pulse',
    shortTag: '🟣 VOID',
    color: '#c084fc',
    desc: 'Memancarkan gelombang kejut Void berkala & memantulkan hit jarak dekat'
  },
  frost_warden: {
    label: 'Frostbind',
    shortTag: '❄️ FROST',
    color: '#38bdf8',
    desc: 'Serangan memperlambat gerakan pahlawan (-Slow) & +15% ketahanan'
  }
};

const ATTR_CATEGORY_BY_ID: Map<string, AttributeDefinition['category']> = new Map(
  ATTRIBUTE_POOL.map((attr) => [attr.id, attr.category])
);

export function getRelicCategory(attrId: string): RelicSynergyCategory | null {
  return ATTR_CATEGORY_BY_ID.get(attrId) ?? null;
}

export function getSynergySetById(id: RelicSynergyId): RelicSynergySetDefinition {
  return RELIC_SYNERGY_SETS.find((s) => s.id === id) || RELIC_SYNERGY_SETS[0];
}

export function computeRelicSynergies(acquiredAttributes: Set<string>): ActiveRelicSynergyState[] {
  const counts: Record<RelicSynergyCategory, number> = {
    offense: 0,
    defense: 0,
    utility: 0,
    unique: 0
  };

  acquiredAttributes.forEach((attrId) => {
    const cat = ATTR_CATEGORY_BY_ID.get(attrId);
    if (cat) counts[cat]++;
  });

  return RELIC_SYNERGY_SETS.map((setDef) => {
    const count = counts[setDef.category] || 0;
    const t1Req = setDef.tiers[0].requiredCount;
    const t2Req = setDef.tiers[1].requiredCount;
    const tier: 0 | 1 | 2 = count >= t2Req ? 2 : count >= t1Req ? 1 : 0;
    const nextRequired = tier === 0 ? t1Req : t2Req;
    const activeDesc =
      tier === 2
        ? `${setDef.tiers[0].shortBonus} + ${setDef.tiers[1].shortBonus}`
        : tier === 1
        ? setDef.tiers[0].shortBonus
        : `Butuh ${t1Req} relic ${setDef.category} berbeda`;

    return {
      id: setDef.id,
      name: setDef.name,
      category: setDef.category,
      accentColor: setDef.accentColor,
      count,
      tier,
      nextRequired,
      activeDesc
    };
  });
}

export function computeEnemyThreat(
  wave: number,
  synergies: ActiveRelicSynergyState[],
  totalEquippedRelics: number
): EnemyThreatInfo {
  const synergyTiersTotal = synergies.reduce((sum, s) => sum + s.tier, 0);
  const score =
    synergyTiersTotal * 1.15 +
    Math.max(0, wave - 2) * 0.22 +
    Math.max(0, totalEquippedRelics - 2) * 0.14;

  if (score < 1.5) {
    return {
      tier: 0,
      label: 'Normal',
      color: '#94a3b8',
      hpMult: 1.0,
      atkMult: 1.0,
      defMult: 1.0,
      speedMult: 1.0,
      eliteChance: 0,
      bossAffixCount: 0,
      synergyTiersTotal
    };
  }
  if (score < 3.2) {
    return {
      tier: 1,
      label: 'Awakened',
      color: '#38bdf8',
      hpMult: 1.24,
      atkMult: 1.12,
      defMult: 1.15,
      speedMult: 1.04,
      eliteChance: 0.22,
      bossAffixCount: 0,
      synergyTiersTotal
    };
  }
  if (score < 5.2) {
    return {
      tier: 2,
      label: 'Vanguard',
      color: '#fbbf24',
      hpMult: 1.52,
      atkMult: 1.24,
      defMult: 1.32,
      speedMult: 1.08,
      eliteChance: 0.36,
      bossAffixCount: 1,
      synergyTiersTotal
    };
  }
  if (score < 7.6) {
    return {
      tier: 3,
      label: 'Ruthless',
      color: '#f97316',
      hpMult: 1.92,
      atkMult: 1.38,
      defMult: 1.52,
      speedMult: 1.13,
      eliteChance: 0.50,
      bossAffixCount: 1,
      synergyTiersTotal
    };
  }
  if (score < 10.5) {
    return {
      tier: 4,
      label: 'Cataclysm',
      color: '#f43f5e',
      hpMult: 2.42,
      atkMult: 1.54,
      defMult: 1.75,
      speedMult: 1.18,
      eliteChance: 0.65,
      bossAffixCount: 2,
      synergyTiersTotal
    };
  }

  const extra = Math.max(0, score - 10.5);
  return {
    tier: 5,
    label: 'Abyssal Nemesis',
    color: '#e879f9',
    hpMult: Number((2.90 + extra * 0.24).toFixed(2)),
    atkMult: Number((1.68 + extra * 0.06).toFixed(2)),
    defMult: Number((1.95 + extra * 0.10).toFixed(2)),
    speedMult: Number(Math.min(1.32, 1.22 + extra * 0.015).toFixed(2)),
    eliteChance: Math.min(0.85, 0.72 + extra * 0.02),
    bossAffixCount: 2,
    synergyTiersTotal
  };
}
