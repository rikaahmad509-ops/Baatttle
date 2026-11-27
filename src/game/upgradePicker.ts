import { AttributeDefinition, HeroKey } from '../types/game';
import { ATTRIBUTE_POOL, SKILL_UPGRADE_TRAITS } from './constants';
import { computeRelicSynergies, SYNERGY_BY_CATEGORY } from './synergies';

export interface AutoUpgradeChoice {
  traitId: string;
  traitTitle: string;
  attr: AttributeDefinition;
}

const RARITY_SCORE: Record<AttributeDefinition['rarity'], number> = {
  common: 6,
  rare: 16,
  epic: 28,
  legendary: 40
};

export function pickAutoUpgrade(params: {
  heroKey: HeroKey;
  level: number;
  activeSkillIds: string[];
  unlockedTraits: Set<string>;
  acquiredAttributes: Set<string>;
}): AutoUpgradeChoice {
  const { heroKey, level, activeSkillIds, unlockedTraits, acquiredAttributes } = params;

  // 1. Pick first/best available skill trait from active skills
  const availableTraits: { id: string; title: string }[] = [];
  for (const skId of activeSkillIds) {
    const traits = SKILL_UPGRADE_TRAITS[skId] || [];
    for (const t of traits) {
      if (!unlockedTraits.has(t.id)) {
        availableTraits.push({ id: t.id, title: t.title });
      }
    }
  }

  const chosenTrait = availableTraits.length > 0
    ? availableTraits[Math.floor(Math.random() * Math.min(3, availableTraits.length))]
    : { id: 'default_mastery', title: 'Combat Overload' };

  // 2. Pick highest-synergy / highest-tier eligible relic attribute
  const eligible = ATTRIBUTE_POOL.filter(attr => attr.stackable || !acquiredAttributes.has(attr.id));
  const pool = eligible.length > 0 ? eligible : ATTRIBUTE_POOL.filter(attr => attr.stackable);

  const highTierPool = pool.filter(a =>
    level >= 2 ? (a.rarity === 'epic' || a.rarity === 'legendary') : a.rarity !== 'common'
  );
  const candidatePool = highTierPool.length > 0 ? highTierPool : pool;

  const currentSynergies = computeRelicSynergies(acquiredAttributes);
  const synergyCountById = new Map(currentSynergies.map(s => [s.id, s.count]));

  let bestAttr = candidatePool[0] || ATTRIBUTE_POOL[0];
  let bestScore = -Infinity;

  for (const attr of candidatePool) {
    const heroSynergyBonus = attr.recommendedHeroes?.includes(heroKey) ? 45 : 0;
    const rarityScore = RARITY_SCORE[attr.rarity] ?? 10;

    // Bonus for advancing a distinct Relic Synergy set toward Tier I (2) or Tier II Overdrive (4)
    let setSynergyBonus = 0;
    if (!acquiredAttributes.has(attr.id)) {
      const setDef = SYNERGY_BY_CATEGORY[attr.category];
      const curCount = synergyCountById.get(setDef.id) ?? 0;
      if (curCount === 1) setSynergyBonus = 28; // Unlocks Tier I immediately
      else if (curCount === 3) setSynergyBonus = 36; // Unlocks Tier II Overdrive immediately
      else if (curCount === 2) setSynergyBonus = 14; // Moves toward Tier II
      else if (curCount === 0) setSynergyBonus = 8;
    }

    const score = heroSynergyBonus + setSynergyBonus + rarityScore + Math.random() * 14;
    if (score > bestScore) {
      bestScore = score;
      bestAttr = attr;
    }
  }

  return {
    traitId: chosenTrait.id,
    traitTitle: chosenTrait.title,
    attr: bestAttr
  };
}
