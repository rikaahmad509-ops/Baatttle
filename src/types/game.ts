export type GameState = 
  | 'TITLE' 
  | 'CODEX'
  | 'CHARACTER_SELECT' 
  | 'SKILL_SELECT' 
  | 'PLAYING' 
  | 'LEVEL_UP' 
  | 'PAUSED' 
  | 'GAME_OVER' 
  | 'VICTORY';

export type GameMode = 'arena' | 'practice';

export type HeroKey = 'monkey' | 'demonis' | 'traveler' | 'valkyrie' | 'dimension_judge' | 'rift_walker' | 'soul_puppeteer' | 'solaris' | 'fallen_angel' | 'demon_raised' | 'elementalis' | 'arcana' | 'morphos' | 'lumina' | 'axiom' | 'kagero' | 'architect';

export type BossCategory = 'Tank' | 'Warrior' | 'Assassin' | 'Manipulation';

export type TravelerStance = 'sword' | 'bow' | 'staff';

export type ArcanaSuit = 'spade' | 'heart' | 'diamond' | 'club';

export type MorphosForm = 'wolf' | 'behemoth' | 'wyvern' | 'chimera';

export type LuminaForm = 'mirror' | 'light';

export type CustomAttackForm = 'bolt' | 'crescent' | 'nova' | 'beam' | 'orbit_blade';
export type CustomAttackPattern = 'single' | 'twin' | 'spread' | 'ring' | 'barrage';
export type CustomAttackChannel = 'physical' | 'magical' | 'true';
export type CustomAttackModifier = 'homing' | 'pierce' | 'lifesteal' | 'slow' | 'sunder' | 'chain' | 'execute';

export interface CustomAttackProgram {
  name: string;
  color: string;
  form: CustomAttackForm;
  pattern: CustomAttackPattern;
  channel: CustomAttackChannel;
  modifiers: CustomAttackModifier[];
}

export type CustomSkillCore =
  | 'meteor_drop'
  | 'dash_strike'
  | 'nova_burst'
  | 'projectile_storm'
  | 'gravity_zone'
  | 'guardian_aegis';

export type CustomSkillAddon =
  | 'stun'
  | 'pull'
  | 'heal'
  | 'shield'
  | 'true_dmg'
  | 'buff_atk'
  | 'sunder'
  | 'reset_cd';

export type CustomSkillScale = 'rapid' | 'balanced' | 'heavy';

export interface CustomSkillBlueprint {
  slotIndex: number;
  id: string;
  name: string;
  color: string;
  core: CustomSkillCore;
  addons: CustomSkillAddon[];
  scale: CustomSkillScale;
  multiCount: 1 | 3 | 5;
}

export interface ArchitectLoadout {
  attackProgram: CustomAttackProgram;
  customSkills: CustomSkillBlueprint[];
}

export interface SkillDefinition {
  id: string;
  name: string;
  cd: number; // base cooldown in seconds
  desc: string;
  icon: string;
  type: 'attack' | 'aoe' | 'buff' | 'control' | 'ultimate';
  level: number;
  maxLevel: number;
  isUnique?: boolean;
  lockedUnique?: boolean;
}

export interface AttributeDefinition {
  id: string;
  title: string;
  desc: string;
  category: 'offense' | 'defense' | 'utility' | 'unique';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  stackable?: boolean;
  recommendedHeroes?: HeroKey[];
}

export interface HeroConfig {
  key: HeroKey;
  name: string;
  subtitle: string;
  color: string;
  secondaryColor: string;
  hp: number;
  atk: number;
  atkSpeed: number;
  critChance: number;
  critDmg: number;
  range: number;
  speed: number;
  defense: number;
  lore: string;
  passiveName: string;
  passiveDesc: string;
  bossCategory?: BossCategory;
  skills: SkillDefinition[];
}

export type EnemyResistPreset = 'none' | 'physical' | 'magical' | 'both';

export interface DpsSample {
  t: number;
  dps: number;
}

export type RelicSynergyId =
  | 'crimson_carnage'
  | 'eternal_bastion'
  | 'temporal_mirage'
  | 'prism_apex';

export type RelicSynergyCategory = AttributeDefinition['category'];

export interface RelicSynergyTierEffect {
  tier: 1 | 2;
  requiredCount: number;
  title: string;
  shortBonus: string;
  desc: string;
}

export interface RelicSynergySetDefinition {
  id: RelicSynergyId;
  name: string;
  category: RelicSynergyCategory;
  accentColor: string;
  tagline: string;
  tiers: [RelicSynergyTierEffect, RelicSynergyTierEffect];
}

export interface ActiveRelicSynergyState {
  id: RelicSynergyId;
  name: string;
  category: RelicSynergyCategory;
  accentColor: string;
  count: number;
  tier: 0 | 1 | 2;
  nextRequired: number;
  activeDesc: string;
}

export type EnemyAffix =
  | 'ironclad'
  | 'frenzied'
  | 'vampiric'
  | 'void_thorns'
  | 'frost_warden';

export interface EnemyThreatInfo {
  tier: number;
  label: string;
  color: string;
  hpMult: number;
  atkMult: number;
  defMult: number;
  speedMult: number;
  eliteChance: number;
  bossAffixCount: number;
  synergyTiersTotal: number;
}

export interface CombatStats {
  kills: number;
  wave: number;
  waveDr?: number;
  enemiesRemaining?: number;
  timeSurvived: number;
  damageDealt: number;
  highestCrit: number;
  damageTaken: number;
  level: number;
  dps?: number;
  dpsHistory?: DpsSample[];
  enemyThreat?: EnemyThreatInfo;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  atk: number;
  atkSpeed: number;
  critChance: number;
  critDmg: number;
  speed: number;
  range: number;
  defense: number;
  cdr: number;
  evasion: number;
  lifesteal: number;
  level: number;
  exp: number;
  maxExp: number;
  demonisStacks: number;
  demonisFCD: number;
  travelerStance: TravelerStance;
  travelerTimeStacks: number;
  travelerParadoxHits?: number;
  travelerRewindReady: boolean;
  travelerKillsRecharge: number;
  isTimeStopActive: boolean;
  timeStopTimer: number;
  rageTimer: number;
  swiftTimer: number;
  monkeyWeaponActive: boolean;
  varpScytheStacks: number;
  burstCritActive: boolean;
  fallenWingsActive: boolean;
  magicDestroActive: boolean;
  warArmorActive: boolean;
  warArmorBonusDef: number;
  judgeDomainTimer: number;
  travelerFieldTimer: number;
  soulMagnetRange: number;
  aegisShield?: number;
  riftBlinkCombo?: number;
  riftWarpBuffTimer?: number;
  anomalyCloneActive?: boolean;
  isInvulnerable?: boolean;
  valkyrieWardTimer?: number;
  valkyrieFortressTimer?: number;
  valkyrieMirrorsCount?: number;
  valkyrieStasisTimer?: number;
  valkyrieEpochTimer?: number;
  valkyrieCutsceneTimer?: number;
  valkyrieCutsceneMonolithCount?: number;
  valkyrieCutsceneFrozenCount?: number;
  heroDrWardTimer?: number;
  heroDrWardPct?: number;
  frostChillHits?: number;
  monkeyHavocTimer?: number;
  monkeyDuelStacks?: number;
  monkeyComboHits?: number;
  monkeySubCd?: number;
  monkeySageStacks?: number;
  monkeySageTimer?: number;
  monkeyCutsceneTimer?: number;
  souls?: number;
  puppetCount?: number;
  undeadCount?: number;
  puppetPossessTimer?: number;
  lichTransformTimer?: number;
  puppetCutsceneTimer?: number;
  puppetDomainTimer?: number;
  solarHeat?: number;
  solarAvatarTimer?: number;
  travelerOverdriveTimer?: number;
  riftStormTimer?: number;
  angelFeathers?: number;
  angelEclipseTimer?: number;
  trueFallenAngelTimer?: number;
  angelCutsceneTimer?: number;
  demonEssence?: number;
  demonAwakenTimer?: number;
  demonRebirthCd?: number;
  angelDemonTimer?: number;
  angelDemonCutsceneTimer?: number;
  angelCount?: number;
  demonCount?: number;
  demonisShadowArmorTimer?: number;
  demonisUltimateShadowArmor?: boolean;
  demonisBlackholeArmorTimer?: number;
  demonisNebulasArmorTimer?: number;
  poseidonArmorHp?: number;
  poseidonArmorMaxHp?: number;
  poseidonArmorCd?: number;
  elementalisWindStacks?: number;
  elementalisEarthHits?: number;
  elementalisCutsceneTimer?: number;
  elementalisRealmTimer?: number;
  judgeResonance?: number;
  judgeMeleeFormTimer?: number;
  judgeCutsceneTimer?: number;
  judgeBladeSpinTimer?: number;
  arcanaHand?: ArcanaSuit[];
  arcanaDiceRoll?: number;
  arcanaDiceTimer?: number;
  arcanaMiracleTimer?: number;
  arcanaRouletteTimer?: number;
  arcanaFlushTimer?: number;
  arcanaHitCount?: number;
  arcanaVanishTimer?: number;
  arcanaVanishCd?: number;
  arcanaDashBuffTimer?: number;
  arcanaCutsceneTimer?: number;
  arcanaCutsceneCards?: ArcanaSuit[];
  morphosForm?: MorphosForm;
  morphosEvoStacks?: number;
  morphosEvoTimer?: number;
  morphosChimeraTimer?: number;
  morphosCutsceneTimer?: number;
  travelerCutsceneTimer?: number;
  solarisCutsceneTimer?: number;
  demonisCutsceneTimer?: number;
  demonisCutsceneTargetName?: string;
  demonisCutsceneTargetIsBoss?: boolean;
  luminaForm?: LuminaForm;
  luminaCharges?: number;
  luminaMirrorsCount?: number;
  luminaAspectSurgeTimer?: number;
  luminaCutsceneTimer?: number;
  luminaFusionTimer?: number;
  axiomStacks?: number;
  axiomDominatedCount?: number;
  axiomDeflectReady?: boolean;
  axiomDominionTimer?: number;
  axiomCutsceneTimer?: number;
  kageroBloodStacks?: number;
  kageroBloodMarkCount?: number;
  kageroAwakenTimer?: number;
  kageroCutsceneTimer?: number;
  architectNodes?: number;
  architectOverclockTimer?: number;
  architectCustomAttackName?: string;
  isCutsceneActive?: boolean;
  activeSynergies?: ActiveRelicSynergyState[];
  synergyDmgAmpPct?: number;
  synergyDrPct?: number;
  skillCDs: number[];
  skillMaxCDs: number[];
}

export type BestiaryTier = 'standard' | 'summon' | 'boss' | 'apex';

export interface BestiaryEntryDefinition {
  id: string;
  name: string;
  title: string;
  tier: BestiaryTier;
  bossCategory?: BossCategory;
  waveIntro: string;
  color: string;
  baseHp: number;
  baseAtk: number;
  defense: number;
  speed: number;
  physResist?: number;
  magicResist?: number;
  abilities: string[];
  lore: string;
  tacticalTip: string;
}

export interface HeroLoreChronicle {
  heroKey: HeroKey;
  originRealm: string;
  titleBadge: string;
  archetype: BossCategory;
  signatureArtifact: string;
  quote: string;
  chapters: {
    heading: string;
    body: string;
  }[];
}

export interface CodexHeroRecord {
  runs: number;
  victories: number;
  kills: number;
  bestWave: number;
  loreRead: boolean;
}

export interface CodexMonsterRecord {
  encountered: number;
  defeated: number;
}

export interface CodexRelicRecord {
  collectedCount: number;
  firstWave?: number;
}

export interface CodexProgress {
  heroes: Partial<Record<HeroKey, CodexHeroRecord>>;
  monsters: Record<string, CodexMonsterRecord>;
  relics: Record<string, CodexRelicRecord>;
  lastUpdated: string;
}

