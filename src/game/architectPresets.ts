import {
  ArchitectLoadout,
  CustomAttackChannel,
  CustomAttackForm,
  CustomAttackModifier,
  CustomAttackPattern,
  CustomAttackProgram,
  CustomSkillAddon,
  CustomSkillBlueprint,
  CustomSkillCore,
  CustomSkillScale,
  SkillDefinition,
} from '../types/game';

export const ARCHITECT_COLOR_PALETTE: { hex: string; label: string }[] = [
  { hex: '#2dd4bf', label: 'Teal Siber' },
  { hex: '#38bdf8', label: 'Biru Kuantum' },
  { hex: '#f59e0b', label: 'Emas Energi' },
  { hex: '#f43f5e', label: 'Merah Plasma' },
  { hex: '#a855f7', label: 'Ungu Prisma' },
  { hex: '#4ade80', label: 'Hijau Vektor' },
];

export const ATTACK_FORMS: {
  id: CustomAttackForm;
  label: string;
  shortDesc: string;
  dmgMult: number;
  speedMult: number;
}[] = [
  { id: 'bolt', label: 'Peluru Energi', shortDesc: 'Tembakan cepat akurat menuju musuh', dmgMult: 1.0, speedMult: 1.15 },
  { id: 'crescent', label: 'Sabit Tebasan', shortDesc: 'Gelombang sabit lebar menebas area depan', dmgMult: 1.12, speedMult: 0.95 },
  { id: 'nova', label: 'Bintang Nova', shortDesc: 'Bola energi meledak area saat mengenai musuh', dmgMult: 0.96, speedMult: 0.88 },
  { id: 'beam', label: 'Sinar Instan', shortDesc: 'Tembakan sinar lurus menembus barisan musuh', dmgMult: 1.08, speedMult: 1.3 },
  { id: 'orbit_blade', label: 'Bilah Orbit', shortDesc: 'Bilah berputar yang meluncur dan menyayat target', dmgMult: 1.05, speedMult: 1.0 },
];

export const ATTACK_PATTERNS: {
  id: CustomAttackPattern;
  label: string;
  shortDesc: string;
  countLabel: string;
  perHitScale: number;
}[] = [
  { id: 'single', label: 'Fokus Tunggal', shortDesc: '1 proyektil terkonsentrasi penuh', countLabel: '1x', perHitScale: 1.18 },
  { id: 'twin', label: 'Kembar Sejajar', shortDesc: '2 tembakan paralel ke target utama', countLabel: '2x', perHitScale: 0.68 },
  { id: 'spread', label: 'Kipas 3 Arah', shortDesc: '3 tembakan menyebar menyapu kerumunan', countLabel: '3x', perHitScale: 0.54 },
  { id: 'ring', label: 'Cincin 6 Arah', shortDesc: '6 energi memancar ke segala penjuru', countLabel: '6x', perHitScale: 0.42 },
  { id: 'barrage', label: 'Hujan 4 Beruntun', shortDesc: '4 tembakan cepat memburu target sekitar', countLabel: '4x', perHitScale: 0.48 },
];

export const ATTACK_CHANNELS: {
  id: CustomAttackChannel;
  label: string;
  shortDesc: string;
  dmgScale: number;
}[] = [
  { id: 'physical', label: 'Fisik (Physical)', shortDesc: 'Kuat memicu Critical & menembus perisai sihir', dmgScale: 1.04 },
  { id: 'magical', label: 'Energi (Magical)', shortDesc: 'Serangan murni energi bersinergi dengan radius luas', dmgScale: 1.04 },
  { id: 'true', label: 'Tembus Armor (True)', shortDesc: 'Mengabaikan seluruh Defense & resistensi musuh', dmgScale: 0.9 },
];

export const ATTACK_MODIFIERS: {
  id: CustomAttackModifier;
  label: string;
  shortDesc: string;
}[] = [
  { id: 'homing', label: 'Pelacak Otomatis', shortDesc: 'Membelok mengejar musuh terdekat' },
  { id: 'pierce', label: 'Menembus Barisan', shortDesc: 'Menembus hingga 3 musuh sekaligus' },
  { id: 'lifesteal', label: 'Serap Nyawa', shortDesc: 'Memulihkan +3.5% HP dari damage yang dihasilkan' },
  { id: 'slow', label: 'Perlambat Target', shortDesc: 'Mengurangi kecepatan musuh -35% selama 1.8 detik' },
  { id: 'sunder', label: 'Retak Armor', shortDesc: 'Mengurangi Defense musuh -12% (maks 3 lapis)' },
  { id: 'chain', label: 'Sambaran Berantai', shortDesc: 'Memantulkan 45% damage ke musuh di dekatnya' },
  { id: 'execute', label: 'Eksekusi Kritis', shortDesc: '+25% Damage pada musuh dengan HP di bawah 45%' },
];

export const SKILL_CORES: {
  id: CustomSkillCore;
  label: string;
  shortDesc: string;
  skillType: SkillDefinition['type'];
  icon: string;
  baseCd: number;
  basePowerPct: number;
}[] = [
  { id: 'meteor_drop', label: 'Hujan Meteor', shortDesc: 'Menjatuhkan meteor energi beruntun ke musuh sekitar', skillType: 'aoe', icon: 'Flame', baseCd: 10.0, basePowerPct: 155 },
  { id: 'dash_strike', label: 'Terjang Kilat', shortDesc: 'Melesat cepat menembus barisan musuh + kebal sesaat', skillType: 'attack', icon: 'Zap', baseCd: 7.5, basePowerPct: 170 },
  { id: 'nova_burst', label: 'Ledakan Gelombang', shortDesc: 'Melepaskan gelombang energi melingkar radius luas', skillType: 'aoe', icon: 'Sparkles', baseCd: 9.0, basePowerPct: 185 },
  { id: 'projectile_storm', label: 'Badai Proyektil', shortDesc: 'Menembakkan rentetan peluru energi ke segala arah', skillType: 'attack', icon: 'Crosshair', baseCd: 8.5, basePowerPct: 96 },
  { id: 'gravity_zone', label: 'Zona Gravitasi', shortDesc: 'Menciptakan medan aktif selama 4.5 detik di arena', skillType: 'control', icon: 'CircleDot', baseCd: 13.5, basePowerPct: 76 },
  { id: 'guardian_aegis', label: 'Pelindung Inti', shortDesc: 'Mengaktifkan perisai pelindung + pulsa energi sekitar', skillType: 'buff', icon: 'Shield', baseCd: 11.5, basePowerPct: 125 },
];

export const SKILL_ADDONS: {
  id: CustomSkillAddon;
  label: string;
  shortDesc: string;
  cdAdd: number;
}[] = [
  { id: 'stun', label: 'Lumpuhkan (Stun)', shortDesc: 'Men-stun musuh terkena selama 1.3 detik', cdAdd: 0.9 },
  { id: 'pull', label: 'Tarik Pusat', shortDesc: 'Menarik musuh mendekat ke titik hantaman', cdAdd: 0.7 },
  { id: 'heal', label: 'Pulihkan HP', shortDesc: 'Memulihkan +10% Max HP seketika saat dipakai', cdAdd: 1.1 },
  { id: 'shield', label: 'Perisai Aegis', shortDesc: 'Memberi Aegis Shield +16% Max HP & -18% DMG 3s', cdAdd: 1.1 },
  { id: 'true_dmg', label: 'Damage Murni', shortDesc: 'Mengubah damage skill menjadi True Damage', cdAdd: 0.8 },
  { id: 'buff_atk', label: 'Overdrive ATK', shortDesc: 'Menambah +25% ATK & +20% ASPD selama 4.0 detik', cdAdd: 1.0 },
  { id: 'sunder', label: 'Hancur Armor', shortDesc: 'Memangkas Defense musuh terkena sebesar -25%', cdAdd: 0.7 },
  { id: 'reset_cd', label: 'Percepat Skill Lain', shortDesc: 'Memotong sisa cooldown skill lain sebesar 1.0 detik', cdAdd: 1.0 },
];

export const SKILL_SCALES: {
  id: CustomSkillScale;
  label: string;
  shortDesc: string;
  cdMult: number;
  powerMult: number;
}[] = [
  { id: 'rapid', label: 'Cepat (Rapid)', shortDesc: 'Cooldown -15% · Daya serang 0.88x', cdMult: 0.85, powerMult: 0.88 },
  { id: 'balanced', label: 'Seimbang', shortDesc: 'Cooldown 1.0x · Daya serang 1.0x', cdMult: 1.0, powerMult: 1.0 },
  { id: 'heavy', label: 'Berat (Heavy)', shortDesc: 'Cooldown +24% · Daya serang 1.32x', cdMult: 1.24, powerMult: 1.32 },
];

export const DEFAULT_ARCHITECT_LOADOUT: ArchitectLoadout = {
  attackProgram: {
    name: 'Prisma Pelacak',
    color: '#2dd4bf',
    form: 'bolt',
    pattern: 'spread',
    channel: 'magical',
    modifiers: ['homing', 'chain'],
  },
  customSkills: [
    {
      slotIndex: 0,
      id: 'arc_custom_1',
      name: 'Auto-Skill I: Terjang Retak',
      color: '#2dd4bf',
      core: 'dash_strike',
      addons: ['sunder', 'shield'],
      scale: 'rapid',
      multiCount: 1,
    },
    {
      slotIndex: 1,
      id: 'arc_custom_2',
      name: 'Auto-Skill II: Hujan Meteor',
      color: '#f59e0b',
      core: 'meteor_drop',
      addons: ['stun', 'true_dmg'],
      scale: 'balanced',
      multiCount: 3,
    },
    {
      slotIndex: 2,
      id: 'arc_custom_3',
      name: 'Auto-Skill III: Benteng Inti',
      color: '#4ade80',
      core: 'guardian_aegis',
      addons: ['heal', 'buff_atk'],
      scale: 'balanced',
      multiCount: 1,
    },
    {
      slotIndex: 3,
      id: 'arc_custom_4',
      name: 'Auto-Skill IV: Medan Gravitasi',
      color: '#a855f7',
      core: 'gravity_zone',
      addons: ['pull', 'true_dmg'],
      scale: 'heavy',
      multiCount: 1,
    },
  ],
};

export function cloneArchitectLoadout(loadout: ArchitectLoadout): ArchitectLoadout {
  return {
    attackProgram: {
      ...loadout.attackProgram,
      modifiers: [...loadout.attackProgram.modifiers],
    },
    customSkills: loadout.customSkills.map((s) => ({
      ...s,
      addons: [...s.addons],
    })),
  };
}

const AUTO_ATK_NAME_PREFIX: Record<CustomAttackForm, string[]> = {
  bolt: ['Peluru Kuantum', 'Prisma Pelacak', 'Tembakan Logika'],
  crescent: ['Sabit Algoritma', 'Tebasan Sirkuit', 'Sabit Vektor'],
  nova: ['Bintang Sintesis', 'Ledakan Nova', 'Pulsa Astral'],
  beam: ['Sinar Kompilasi', 'Laser Penembus', 'Garis Kebenaran'],
  orbit_blade: ['Cakram Orbit', 'Bilah Otonom', 'Rotasi Siber'],
};

const AUTO_MOD_SUFFIX: Record<CustomAttackModifier, string> = {
  homing: 'Pelacak',
  pierce: 'Penembus',
  lifesteal: 'Vampirik',
  slow: 'Beku',
  sunder: 'Perusak',
  chain: 'Berantai',
  execute: 'Eksekusi',
};

export function synthesizeAutonomousAttackProgram(
  nearbyEnemyCount: number,
  hasBossNearby: boolean,
  lowHp: boolean,
  prevForm?: CustomAttackForm
): CustomAttackProgram {
  const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  // Context-aware autonomous coding: adapts form & pattern to battlefield conditions
  const candidateForms: CustomAttackForm[] = hasBossNearby
    ? ['beam', 'bolt', 'crescent', 'orbit_blade']
    : nearbyEnemyCount >= 4
    ? ['nova', 'crescent', 'orbit_blade', 'bolt']
    : ['bolt', 'crescent', 'beam', 'nova', 'orbit_blade'];
  const filteredForms = candidateForms.filter((f) => f !== prevForm);
  const form = pickRandom(filteredForms.length > 0 ? filteredForms : candidateForms);

  const pattern: CustomAttackPattern =
    nearbyEnemyCount >= 5
      ? pickRandom(['ring', 'spread', 'barrage'])
      : hasBossNearby
      ? pickRandom(['single', 'twin', 'barrage'])
      : pickRandom(['twin', 'spread', 'barrage', 'single']);

  const channel: CustomAttackChannel = hasBossNearby
    ? pickRandom(['true', 'physical', 'magical'])
    : pickRandom(['magical', 'physical', 'true']);

  const modPool: CustomAttackModifier[] = ['homing', 'pierce', 'lifesteal', 'slow', 'sunder', 'chain', 'execute'];
  const firstMod: CustomAttackModifier = lowHp
    ? 'lifesteal'
    : hasBossNearby
    ? pickRandom(['sunder', 'execute', 'homing'])
    : pickRandom(['homing', 'pierce', 'chain', 'slow']);
  const secondPool = modPool.filter((m) => m !== firstMod);
  const secondMod = pickRandom(secondPool);

  const color = pickRandom(ARCHITECT_COLOR_PALETTE).hex;
  const prefix = pickRandom(AUTO_ATK_NAME_PREFIX[form]);
  const name = `${prefix} · ${AUTO_MOD_SUFFIX[firstMod]}`;

  return {
    name,
    color,
    form,
    pattern,
    channel,
    modifiers: [firstMod, secondMod],
  };
}

const AUTO_SKILL_NOUNS: Record<CustomSkillCore, string[]> = {
  meteor_drop: ['Hujan Meteor', 'Jatuhan Bintang', 'Kawah Sintesis'],
  dash_strike: ['Terjang Kilat', 'Lompatan Siber', 'Tebasan Vektor'],
  nova_burst: ['Gelombang Inti', 'Ledakan Matriks', 'Ledakan Astral'],
  projectile_storm: ['Badai Proyektil', 'Salvo Logika', 'Rentetan Prisma'],
  gravity_zone: ['Zona Gravitasi', 'Medan Kompilasi', 'Ruang Singular'],
  guardian_aegis: ['Benteng Firewall', 'Perisai Otonom', 'Aegis Inti'],
};

export function synthesizeAutonomousSkillBlueprint(
  slotIndex: number,
  nearbyEnemyCount: number,
  hasBossNearby: boolean,
  lowHp: boolean,
  prevCore?: CustomSkillCore
): CustomSkillBlueprint {
  const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  // Bias slot roles slightly while still freely inventing new code combinations
  const slotCores: CustomSkillCore[] =
    lowHp
      ? ['guardian_aegis', 'gravity_zone', 'nova_burst']
      : nearbyEnemyCount >= 4
      ? ['meteor_drop', 'nova_burst', 'gravity_zone', 'projectile_storm']
      : hasBossNearby
      ? ['dash_strike', 'projectile_storm', 'meteor_drop', 'guardian_aegis']
      : ['dash_strike', 'meteor_drop', 'nova_burst', 'projectile_storm', 'gravity_zone', 'guardian_aegis'];

  const filteredCores = slotCores.filter((c) => c !== prevCore);
  const core = pickRandom(filteredCores.length > 0 ? filteredCores : slotCores);

  const addonPool: CustomSkillAddon[] = ['stun', 'pull', 'heal', 'shield', 'true_dmg', 'buff_atk', 'sunder', 'reset_cd'];
  const firstAddon: CustomSkillAddon = lowHp
    ? pickRandom(['heal', 'shield'])
    : hasBossNearby
    ? pickRandom(['true_dmg', 'sunder', 'buff_atk'])
    : pickRandom(['stun', 'pull', 'true_dmg', 'buff_atk']);
  const secondAddon = pickRandom(addonPool.filter((a) => a !== firstAddon));

  const scale: CustomSkillScale = pickRandom(['rapid', 'balanced', 'heavy']);
  const multiCount: 1 | 3 | 5 =
    core === 'projectile_storm'
      ? pickRandom([3, 5])
      : core === 'meteor_drop'
      ? pickRandom([1, 3, 5])
      : pickRandom([1, 3]);

  const color = pickRandom(ARCHITECT_COLOR_PALETTE).hex;
  const roman = ['I', 'II', 'III', 'IV'][slotIndex] || `${slotIndex + 1}`;
  const coreLabel = pickRandom(AUTO_SKILL_NOUNS[core]);
  const addonTag = SKILL_ADDONS.find((a) => a.id === firstAddon)?.label.split(' ')[0] || 'Otonom';

  return {
    slotIndex,
    id: `arc_custom_${slotIndex + 1}`,
    name: `Auto-Skill ${roman}: ${coreLabel} (${addonTag})`,
    color,
    core,
    addons: [firstAddon, secondAddon],
    scale,
    multiCount,
  };
}

export function describeAttackProgram(program: CustomAttackProgram): {
  count: number;
  perProjectilePct: number;
  totalPotencyPct: number;
  channelLabel: string;
  summary: string;
} {
  const form = ATTACK_FORMS.find((f) => f.id === program.form) || ATTACK_FORMS[0];
  const pattern = ATTACK_PATTERNS.find((p) => p.id === program.pattern) || ATTACK_PATTERNS[0];
  const channel = ATTACK_CHANNELS.find((c) => c.id === program.channel) || ATTACK_CHANNELS[0];
  const count =
    program.pattern === 'single' ? 1
    : program.pattern === 'twin' ? 2
    : program.pattern === 'spread' ? 3
    : program.pattern === 'barrage' ? 4
    : 6;
  const perProjectilePct = Math.round(form.dmgMult * pattern.perHitScale * channel.dmgScale * 100);
  const totalPotencyPct = perProjectilePct * count;
  const modLabels = program.modifiers
    .map((m) => ATTACK_MODIFIERS.find((x) => x.id === m)?.label)
    .filter(Boolean) as string[];
  const summary = `${form.label} · ${pattern.label} (${count}x @ ${perProjectilePct}% ATK ${channel.label})${
    modLabels.length ? ` + ${modLabels.join(' & ')}` : ''
  }`;
  return {
    count,
    perProjectilePct,
    totalPotencyPct,
    channelLabel: channel.label,
    summary,
  };
}

export function computeCustomSkillStats(bp: CustomSkillBlueprint): {
  cd: number;
  powerPct: number;
  hits: number;
  isTrueDmg: boolean;
  icon: string;
  type: SkillDefinition['type'];
  desc: string;
} {
  const core = SKILL_CORES.find((c) => c.id === bp.core) || SKILL_CORES[0];
  const scale = SKILL_SCALES.find((s) => s.id === bp.scale) || SKILL_SCALES[1];
  const addonItems = bp.addons
    .map((id) => SKILL_ADDONS.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  const addonCdSum = addonItems.reduce((acc, a) => acc + a.cdAdd, 0);
  const multiCdBonus = bp.multiCount === 5 ? 1.8 : bp.multiCount === 3 ? 0.9 : 0;
  const cd = Math.max(5.5, Number(((core.baseCd + addonCdSum + multiCdBonus) * scale.cdMult).toFixed(1)));

  const multiPowerAdj =
    bp.core === 'meteor_drop' || bp.core === 'projectile_storm'
      ? bp.multiCount === 5
        ? 0.72
        : bp.multiCount === 3
        ? 0.88
        : 1.15
      : bp.multiCount === 5
      ? 0.85
      : bp.multiCount === 3
      ? 0.94
      : 1.08;
  const powerPct = Math.round(core.basePowerPct * scale.powerMult * multiPowerAdj);
  const hits =
    bp.core === 'projectile_storm'
      ? bp.multiCount === 5
        ? 12
        : bp.multiCount === 3
        ? 8
        : 5
      : bp.core === 'meteor_drop'
      ? bp.multiCount === 5
        ? 6
        : bp.multiCount === 3
        ? 4
        : 2
      : bp.multiCount;

  const isTrueDmg = bp.addons.includes('true_dmg');
  const dmgChannelWord = isTrueDmg ? 'True DMG' : 'ATK DMG';
  const addonText = addonItems.map((a) => a.label).join(' + ');

  const hitDesc =
    bp.core === 'gravity_zone'
      ? `Membuka Zona Gravitasi 4.5d (${powerPct}% ${dmgChannelWord}/tick)`
      : bp.core === 'guardian_aegis'
      ? `Memicu Perisai Inti & Pulsa ${powerPct}% ${dmgChannelWord}`
      : bp.core === 'meteor_drop'
      ? `Menjatuhkan ${hits} Meteor (${powerPct}% ${dmgChannelWord}/meteor)`
      : bp.core === 'projectile_storm'
      ? `Meluncurkan ${hits} Proyektil (${powerPct}% ${dmgChannelWord}/proyektil)`
      : bp.core === 'dash_strike'
      ? `Melesat menembus barisan musuh (${powerPct}% ${dmgChannelWord}${hits > 1 ? ` · ${hits} Gelombang Samping` : ''})`
      : `Ledakan Gelombang ${hits > 1 ? `${hits} Lapis ` : ''}(${powerPct}% ${dmgChannelWord})`;

  const desc = `${hitDesc}${addonText ? ` · Tambahan: ${addonText}` : ''}. (Ditulis & berevolusi otomatis oleh Architect saat bertarung)`;

  return {
    cd,
    powerPct,
    hits,
    isTrueDmg,
    icon: core.icon,
    type: core.skillType,
    desc,
  };
}

export function buildSkillDefinitionFromBlueprint(bp: CustomSkillBlueprint): SkillDefinition {
  const stats = computeCustomSkillStats(bp);
  const slotNum = bp.slotIndex + 1;
  return {
    id: `arc_custom_${slotNum}`,
    name: bp.name.trim() || `Auto-Skill ${slotNum}`,
    cd: stats.cd,
    desc: stats.desc,
    icon: stats.icon,
    type: stats.type,
    level: 1,
    maxLevel: 5,
  };
}

export const ARCHITECT_UNIQUE_SKILL: SkillDefinition = {
  id: 'arc_s5',
  name: 'Genesis Compiler: Infinite Execution',
  cd: 26.0,
  desc: 'Skill Unik: Mengeksekusi KEEMPAT Skill hasil koding otomatis Architect secara bersamaan (390px) & memasuki Mode Overclock selama 9.5 detik (+45% ATK, +40% ASPD, +20% Crit, -25% DMG diterima, serta menggandakan keluaran Serangan Dasar 2x lipat)!',
  icon: 'Crown',
  type: 'ultimate',
  level: 1,
  maxLevel: 5,
  isUnique: true,
};

export function buildArchitectSkillsFromLoadout(loadout: ArchitectLoadout): SkillDefinition[] {
  const custom = [0, 1, 2, 3].map((slotIndex) => {
    const bp = loadout.customSkills[slotIndex] || DEFAULT_ARCHITECT_LOADOUT.customSkills[slotIndex];
    return buildSkillDefinitionFromBlueprint({ ...bp, slotIndex });
  });
  return [...custom, { ...ARCHITECT_UNIQUE_SKILL }];
}
