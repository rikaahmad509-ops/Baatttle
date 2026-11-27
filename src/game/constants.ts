import { HeroConfig, AttributeDefinition, SkillDefinition } from '../types/game';
import { DEFAULT_ARCHITECT_LOADOUT, buildArchitectSkillsFromLoadout } from './architectPresets';

export const DIMENSION_JUDGE_MELEE_SKILLS: SkillDefinition[] = [
  {
    id: 'djm_s1',
    name: 'Rift Breaker Rush',
    cd: 4.8,
    desc: 'Wujud Jarak Dekat: Menerjang menembus ruang ke target terdekat (kebal 0.3s), menebas garis lintasan untuk 155% ATK (bisa Crit) + 45% ATK True Damage, & menarik musuh ke depan tebasan.',
    icon: 'Swords',
    type: 'attack',
    level: 1,
    maxLevel: 5
  },
  {
    id: 'djm_s2',
    name: 'Cosmic Blade Tempest',
    cd: 6.8,
    desc: 'Wujud Jarak Dekat: Memutar pedang dimensi selama 2.0 detik di radius 150px, menebas setiap 0.40s (72% ATK, bisa Crit) & membelah proyektil musuh di sekitar!',
    icon: 'Orbit',
    type: 'aoe',
    level: 1,
    maxLevel: 5
  },
  {
    id: 'djm_s3',
    name: 'Arbiter Execution Slam',
    cd: 8.0,
    desc: 'Wujud Jarak Dekat: Menghantam arena dengan Pedang Realitas (170px AoE), memberi 210% ATK (bisa Crit) + 70% True Damage, stun 1.2s, & eksekusi non-Boss HP < 12%!',
    icon: 'Zap',
    type: 'control',
    level: 1,
    maxLevel: 5
  },
  {
    id: 'djm_s4',
    name: 'Infinity Void Finality',
    cd: 12.0,
    desc: 'Wujud Jarak Dekat (Ultimate): Melancarkan 4 tebasan ruang kilat beruntun (masing-masing 95% ATK True Damage, bisa Crit) + ledakan akhir 145% ATK True Damage & Heal 6% Max HP!',
    icon: 'Sparkles',
    type: 'ultimate',
    level: 1,
    maxLevel: 5
  }
];

export const TRUE_FALLEN_BLINK_SKILLS: SkillDefinition[] = [
  {
    id: 'tfa_s1',
    name: 'Shadow Step Blink',
    cd: 1.2,
    desc: 'Wujud True Fallen Angel: Blink cepat 205px menembus bayangan ke arah target (0.25s Invulnerable), meninggalkan Kabut Bulu yang memperlambat musuh 2.0s & sayatan ringan 35% ATK.',
    icon: 'Zap',
    type: 'attack',
    level: 1,
    maxLevel: 5
  },
  {
    id: 'tfa_s2',
    name: 'Seraph Phase Shift',
    cd: 1.6,
    desc: 'Wujud True Fallen Angel: Blink menghindar 225px menjauh dari ancaman terdekat (0.35s Invulnerable), membersihkan semua debuff racun/slow/sunder, & memulihkan 7% Max HP.',
    icon: 'Sparkles',
    type: 'buff',
    level: 1,
    maxLevel: 5
  },
  {
    id: 'tfa_s3',
    name: 'Eclipse Warp Vortex',
    cd: 2.0,
    desc: 'Wujud True Fallen Angel: Blink 185px melewati formasi musuh, menarik musuh di titik awal ke pusaran & men-stun 1.1 detik (45% ATK damage ringan).',
    icon: 'Wind',
    type: 'control',
    level: 1,
    maxLevel: 5
  },
  {
    id: 'tfa_s4',
    name: 'Six-Wing Phantom Flicker',
    cd: 2.2,
    desc: 'Wujud True Fallen Angel: Melakukan 3 kali Blink bayangan beruntun mengelilingi musuh (0.40s Invulnerable), memperlambat 2.5s & merobek Defense musuh -20% (30% ATK per blink).',
    icon: 'Feather',
    type: 'aoe',
    level: 1,
    maxLevel: 5
  }
];

export const ANGEL_DEMON_SKILLS: SkillDefinition[] = [
  {
    id: 'ad_s1',
    name: 'Seraphic Judgment Spear',
    cd: 2.8,
    desc: 'Wujud Angel & Demon: Meluncurkan 3 Tombak Cahaya Surga penembus (145% ATK, bisa Crit, Stun 0.8s) serta memulihkan 6% Max HP diri sendiri dan seluruh Malaikat & Iblis.',
    icon: 'Zap',
    type: 'attack',
    level: 1,
    maxLevel: 5
  },
  {
    id: 'ad_s2',
    name: 'Infernal Abyssal Surge',
    cd: 3.6,
    desc: 'Wujud Angel & Demon: Meledakkan Api Neraka radius 175px (185% ATK True Damage, merobek -20% Defense musuh) & memicu tebasan serempak seluruh Iblis Neraka.',
    icon: 'Flame',
    type: 'control',
    level: 1,
    maxLevel: 5
  },
  {
    id: 'ad_s3',
    name: 'Dual Legion Invocation',
    cd: 4.5,
    desc: 'Wujud Angel & Demon: Langsung memanggil 1 Malaikat Surga & 1 Iblis Neraka (maks 4+4) serta melepaskan ledakan resonansi Suci-Neraka radius 145px (115% ATK) dari setiap summon!',
    icon: 'Users',
    type: 'buff',
    level: 1,
    maxLevel: 5
  },
  {
    id: 'ad_s4',
    name: 'Twilight Apocalypse: Heaven & Hell',
    cd: 6.0,
    desc: 'Wujud Angel & Demon: Menjatuhkan Pilar Surga & Kawah Neraka raksasa radius 245px (260% ATK + 220% True Damage, Stun 1.4s, Slow 2.5s, Heal 10% Max HP).',
    icon: 'Crown',
    type: 'ultimate',
    level: 1,
    maxLevel: 5
  }
];

export const DEMONIS_BLACKHOLE_SKILL: SkillDefinition = {
  id: 'd_s3_blackhole',
  name: 'BlackHole Armor Shadow Shot',
  cd: 13.5,
  desc: 'SKILL UNIK EVOLUSI (Zirah Bayangan + Skill 3): Meledakkan Cataclysm Void Eclipse & menumpuk Blackhole Armor di atas Zirah Bayangan selama 6.5 detik (-52% total DMG diterima). Membalikkan serangan musuh menjadi Blackhole Shot penembus Barrier yang meledak & menyedot musuh!',
  icon: 'Skull',
  type: 'ultimate',
  level: 1,
  maxLevel: 5,
  isUnique: true
};

export const DEMONIS_NEBULAS_SKILL: SkillDefinition = {
  id: 'd_s3_nebulas',
  name: 'Nebulas Armor',
  cd: 13.5,
  desc: 'SKILL UNIK EVOLUSI (Ultimate Shadow Armor + Skill 3): Meledakkan Cataclysm Void Eclipse & menumpuk Nebulas Armor di atas Ultimate Shadow Armor selama 7.0 detik (-62% total DMG diterima). Membalikkan serangan musuh berbentuk Nebulas Shot kosmik + 2 Nebulas Shard penembus Barrier yang merobek -12% DEF, memperlambat, & memicu Nebula Nova!',
  icon: 'Sparkles',
  type: 'ultimate',
  level: 1,
  maxLevel: 5,
  isUnique: true
};

export const HERO_DATABASE: Record<string, HeroConfig> = {
  monkey: {
    key: 'monkey',
    name: 'MONKEY KING',
    subtitle: 'Melee Brawler & Illusion Master',
    color: '#f59e0b', // Amber
    secondaryColor: '#b45309',
    hp: 800,
    atk: 46,
    atkSpeed: 1.25,
    critChance: 0.12,
    critDmg: 1.35,
    range: 75,
    speed: 175,
    defense: 22,
    lore: 'Master of simian martial arts and clone duplicates. Absorbs lifeforce from enemy strikes.',
    passiveName: 'Crit Converter, Immortal Vajra, Duel Ascendance, Jingu Mastery, 72-Form Substitution & Segel Qi Tian',
    passiveDesc: 'Base Crit Damage: 135%. Setiap 1% bonus Crit Damage di atas 100% diubah menjadi +1.4 Attack Damage dan setiap 1% Crit Chance dikonversi menjadi +4 True Damage per serangan dasar (Maks. 80 True Damage, Clone mewarisi 40%-50% ATK). Tubuh Immortal Vajra mengurangi 25% damage diterima, memberi +12% Lifesteal & +12% Evasion dasar, dan Clone mewarisi 40%-50% ATK (Stats lain 50%-75%) + 100% Relic Attribute. Duel Ascendance: Lawan 1 musuh terus hidup tiap 2s memberi +1 stack (maks 25): +4% ATK, +3% ASPD, +1% Crit, +1.5 DEF. Jingu Mastery: Tiap 4 serangan dasar menyapu 145px (160% ATK, Sunder -8% DEF), heal 3% HP (4% Overdrive), Vajra Guard (-15% DMG diterima 3.0s), -0.4s CD Skill, & Clone Echo Sweep. Segel Qi Tian (Pasif Unik): Tiap Jingu Sweep memberi +1 Segel Qi Tian (maks 12, +1.5% DMG Jingu/Clone per Segel, -1.2s CD Skill Unik) & tiap 4 Segel memanggil Serangan Phantom 72-Kera Emas otomatis! 72-Form Substitution: Menahan serangan mematikan (CD 55s, -1s per Jingu Sweep), memulihkan 45% Max HP, kebal 2.0s, -25% DMG diterima 3.5s, dan menukar posisi dengan Clone.',
    bossCategory: 'Warrior',
    skills: [
      {
        id: 'm_s1',
        name: 'Monkey Clone',
        cd: 20,
        desc: 'Memanggil clone bertarget musuh yang mewarisi 40% ATK & 50% Stats lainnya (HP, DEF, ASPD, Crit, Speed, Evasion), pengurangan damage 18%, 100% seluruh Relic Attribute master & menyembuhkan master saat memukul musuh.',
        icon: 'Copy',
        type: 'buff',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'm_s2',
        name: 'RuYi: Heavenly Staff Slam',
        cd: 10.5,
        desc: 'Memanjangkan Tongkat Emas Sakti RuYi Jingu Bang dan menghantamkannya ke tanah! Menghasilkan 70% Damage garis gempa, stun 0.8 detik, dan seluruh clone ikut menghantam (25%-30% damage, -50% jika target sama). Jika musuh memiliki Barrier, memberi bonus damage hingga 150.',
        icon: 'Zap',
        type: 'aoe',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'm_s3',
        name: 'Somersault Cloud: Gale Cyclone',
        cd: 12.5,
        desc: 'Menaiki Awan Kinton (Jindou Yun) melesat kilat menerobos barisan musuh, menciptakan badai tornado topan emas (115% damage), memperlambat musuh 1.5s, serta kebal (invulnerable) selama 0.8 detik.',
        icon: 'Wind',
        type: 'attack',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'm_s4',
        name: 'Havoc in Heaven: Colossus Pillar',
        cd: 28.0,
        desc: 'Membangkitkan wujud Kera Sakti Sejati! Menghujamkan tiang RuYi, memicu gempa 250px (67.5% damage), 5 sambaran petir emas (150% True Damage), serta Overdrive (+40% ATK) pada master dan semua clone selama 6.5 detik!',
        icon: 'Flame',
        type: 'ultimate',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'm_s5',
        name: 'Qi Tian Da Sheng: Heaven-Cleaver',
        cd: 26.0,
        desc: 'SKILL UNIK: Memicu CUTSCENE 3D EPIK Sembilan Langit — Sun Wukong membangkitkan 72 Pasukan Kera Emas & menghujamkan RuYi Jingu Bang raksasa! Menghasilkan ledakan pemecah langit 360px (240% ATK + 12% per Segel Qi Tian True Damage, Stun 1.6s, -25% DEF), memanggil 3 Immortal Clones, heal 18% Max HP, serta memasuki Wujud Great Sage 9.0 detik (+35% ATK, +30% ASPD, +20% Crit, +25% Speed, -22% DMG, & tiap serangan memicu Gelombang RuYi Emas)!',
        icon: 'Crown',
        type: 'ultimate',
        level: 1,
        maxLevel: 5,
        isUnique: true
      }
    ]
  },
  demonis: {
    key: 'demonis',
    name: 'DEMONIS (REVAMP)',
    subtitle: 'Abyssal Void Sovereign',
    color: '#a855f7', // Purple
    secondaryColor: '#7e22ce',
    hp: 720,
    atk: 58,
    atkSpeed: 1.48,
    critChance: 0.26,
    critDmg: 2.0,
    range: 280,
    speed: 195,
    defense: 12,
    lore: 'Penguasa jurang void yang memanen jiwa musuh untuk mengisi muatan energi kosmik dan melepaskan hujan proyektil kehancuran.',
    passiveName: 'Full Charger Demonis, Abyssal Hunger & Zirah Bayangan',
    passiveDesc: 'Setiap 4 serangan (+2 Stack per kill) memberi +1 FCD (maks 30). Tiap FCD menambah +1 Proyektil Void Single-Target melengkung (10% ATK, bisa Crit), +1.5% Crit Damage & +1.5% ASPD. Pada 30/30 FCD memasuki Abyssal Ascendance (+20% ATK & Proyektil meledak Void AoE!), serta regenerasi 1.5% Max HP/dtk. Mekanik Khusus: Mengaktifkan Skill 1 & Skill 2 bersamaan mengeluarkan Zirah Bayangan (-40% DMG diterima 5.5s) yang saat 30/30 FCD berevolusi menjadi Ultimate Shadow Armor. Saat Zirah Bayangan aktif dan mengeluarkan Skill 3, Skill 3 berevolusi menjadi Skill Unik BlackHole Armor Shadow Shot yang menumpuk Blackhole Armor untuk membalikkan serangan sebagai Blackhole Shot; saat Ultimate Shadow Armor aktif dan mengeluarkan Skill 3, berevolusi menjadi Nebulas Armor yang membalikkan serangan berbentuk Nebulas!',
    bossCategory: 'Assassin',
    skills: [
      {
        id: 'd_s1',
        name: 'Void Obliteration Beam',
        cd: 6.5,
        desc: 'Menembakkan Laser Kosmik berdamage 175% + 3.5% ATK per FCD (dapat Critical!), memberi +2 Stack, mengeksekusi non-Boss HP < 16%, dan +65% True Damage ke Boss HP < 30%.',
        icon: 'Eye',
        type: 'attack',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'd_s2',
        name: 'Abyssal Shadow Waltz',
        cd: 8.5,
        desc: 'Melompat taktis meninggalkan Ledakan Void Singularity (180% ATK True Damage) di titik asal! Memicu Shadow Veil 2.5s (+60% Evasion, +35% Speed) & Dark Soul Drain tiap 0.5s (90% ATK True Damage AoE & heal 3% HP/musuh).',
        icon: 'ShieldAlert',
        type: 'buff',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'd_s3',
        name: 'Cataclysm Void Eclipse',
        cd: 13.5,
        desc: 'Menciptakan gerhana Void di area target (radius 260px): menarik & men-stun musuh selama 1.0s, meledakkan 155% ATK + (20% + 3.5% per FCD) True Damage, memulihkan HP saat kill, dan memberi +1 FCD!',
        icon: 'Skull',
        type: 'ultimate',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'd_s4',
        name: 'Abyssal Judgement',
        cd: 22.0,
        desc: 'SKILL UNIK: Demonis membidik musuh terkuat dari kejauhan, melancarkan Tombak Void Kosmik hingga menghantam dan meledakkan area 300px (240% ATK + 5% ATK per FCD True Damage, Stun 1.4s), lalu kembali ke pertempuran!',
        icon: 'Crosshair',
        type: 'ultimate',
        level: 1,
        maxLevel: 5,
        isUnique: true
      }
    ]
  },
  traveler: {
    key: 'traveler',
    name: 'TRAVELER (REVAMP)',
    subtitle: 'Chronos Stance Sovereign',
    color: '#06b6d4', // Cyan
    secondaryColor: '#0e7490',
    hp: 740,
    atk: 42,
    atkSpeed: 1.40,
    critChance: 0.20,
    critDmg: 1.65,
    range: 155,
    speed: 195,
    defense: 18,
    lore: 'Pengembara dimensi pengendali waktu yang menggabungkan Pedang, Busur, dan Tongkat Kosmik dengan resonansi Chronos yang presisi.',
    passiveName: 'Chronos Resonance & Chrono Paradox',
    passiveDesc: 'Auto Stance Mastery: Sword (+15% ATK, +15% ASPD, +10% Lifesteal, tebasan AoE 42%), Bow (+8% ATK, +30% ASPD, +8% Crit, Twin Arrows 38%), Staff (+20% ATK, +8% ASPD, ledakan AoE 40% True Damage). Setiap kill +0.6% ATK (maks +18%) & tiap Skill memangkas cooldown skill lain 0.5s. Pasif Chrono Paradox: Setiap 4 serangan dasar (atau saat berganti Stance, CD 2.0s) menembakkan 3 Sinar Paradoks AoE (72% True Damage, bisa Crit!), memperlambat musuh 35% (2.5s), memberi -18% DMG diterima (3s), & memangkas CD skill aktif lain 0.6s!',
    bossCategory: 'Warrior',
    skills: [
      {
        id: 't_s1_revamp',
        name: 'Chrono Dimension Nova',
        cd: 8.0,
        desc: 'Gelombang dimensi radius 185px menghasilkan 125% AoE True Damage (dapat Critical!), menarik musuh ke pusat cincin waktu, dan mengurangi 18% damage diterima selama 3.5 detik.',
        icon: 'Sparkles',
        type: 'aoe',
        level: 1,
        maxLevel: 5
      },
      {
        id: 't_s2',
        name: 'Tri-Stance Phantom Slash',
        cd: 8.5,
        desc: 'Melancarkan serangan beruntun 100% Critical Strike sesuai Stance aktif: Sword (3 tebasan AoE 90% + heal 4%), Bow (5 Panah Waktu 62%), Staff (3 Pilar Astral AoE 95%).',
        icon: 'Crosshair',
        type: 'attack',
        level: 1,
        maxLevel: 5
      },
      {
        id: 't_s3',
        name: 'Temporal Stasis & Rewind',
        cd: 13.0,
        desc: 'Membekukan waktu di radius 250px selama 2.4 detik, meledakkan Chrono Rewind (110% True Damage, bisa Crit), kebal 1.0 detik, dan memulihkan 22% Max HP.',
        icon: 'Hourglass',
        type: 'control',
        level: 1,
        maxLevel: 5
      },
      {
        id: 't_s4',
        name: 'Chronos Overdrive Domain',
        cd: 18.0,
        desc: 'Membuka Aura & Zona Chronos selama 7 detik: memperlambat musuh 45%, memberi +14% ATK, +30% ASPD, +15% Crit Damage, dan menembakkan Bilah Waktu (55% True Damage, bisa Crit) tiap 0.75 detik!',
        icon: 'Maximize2',
        type: 'ultimate',
        level: 1,
        maxLevel: 5
      },
      {
        id: 't_s5',
        name: 'Time Stop Berserk',
        cd: 24.0,
        desc: 'SKILL UNIK (Cutscene 3D Time Stop & Rewind): Menghentikan waktu arena selama 4.0–5.0 detik (+0.5s tiap 15 kill, maks +1.0s) SEKALIGUS memundurkan waktu! Memutar balik HP ke puncak 4 detik terakhir (minimal +25%–40% Max HP) & menghapus semua debuff, melarutkan proyektil musuh di udara, menarik mundur posisi musuh ke jejak waktunya 4 detik lalu sambil membekukan mereka, memundurkan jam arena (-5s s/d -15s), me-reset cooldown skill lain, meledakkan 135% True Damage (bisa Crit) radius 260px, serta memberi +18% ATK & +30% ASPD selama Time Stop! (Cooldown 24s kebal CDR).',
        icon: 'Hourglass',
        type: 'ultimate',
        level: 1,
        maxLevel: 5,
        isUnique: true
      }
    ]
  },
  valkyrie: {
    key: 'valkyrie',
    name: 'VALKYRIE FROST',
    subtitle: 'Zero-Kelvin Prism Sovereign & Cryo Mirror Architect',
    color: '#38bdf8', // Sky Blue
    secondaryColor: '#0284c7',
    hp: 840,
    atk: 46,
    atkSpeed: 1.30,
    critChance: 0.18,
    critDmg: 1.75,
    range: 145,
    speed: 205,
    defense: 22,
    lore: 'Valkyrie pemahat kristal absolut yang mengubah medan perang menjadi ruang cermin es raksasa. Setiap cermin esnya memantulkan serangan menjadi jaring laser optik yang membekukan waktu & membelah takdir.',
    passiveName: 'Cryo Mirror Refraction & Frostbite Stasis',
    passiveDesc: 'Frost Armor (-18% DMG diterima, +14 ATK, +15% ASPD, +22 DEF, +15 Speed) & +15% DMG ke target lambat/beku. Setiap 3 hit memicu Deep Freeze (1.8s), 6 pecahan es (48% ATK), Permafrost Ward (-12% DMG 4s), & memanggil Cermin Es (maks 3). Serangan dasar MEMANTUL melalui semua Cermin Es aktif menjadi Laser Optik 25% ATK Magical DMG, & target beku menyebarkan 25% Shatter DMG ke sekitar!',
    bossCategory: 'Tank',
    skills: [
      {
        id: 'v_s1',
        name: 'Prism Anchor & Glacial Swap',
        cd: 4.5,
        desc: 'Meluncur menembakkan Jangkar Cermin Es 200px, memanggil Cermin Es di lokasi awal & tujuan, lalu MENARIK musuh terjauh ke titik tumbukan (130% ATK Frost), memperlambat 3.5s, memberi Permafrost Ward (-12% DMG 4s) & +55 Speed 3s.',
        icon: 'Zap',
        type: 'attack',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'v_s2',
        name: 'Mirror Kaleidoscope Barrage',
        cd: 6.0,
        desc: 'Pusaran Kaca Es merobek -35% DEF & menarik musuh (105% ATK) lalu menembakkan 9 Pecahan Prisma (85% ATK). UNIK: Setiap Cermin Es aktif di arena ikut memantul & menembakkan +4 Tombak Es Homing (52% ATK) secara serentak!',
        icon: 'Wind',
        type: 'aoe',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'v_s3',
        name: 'Cryo Sarcophagus & Mirror Counter',
        cd: 11.5,
        desc: 'Membekukan diri dalam Sarkofagus Kristal (0.9s Stasis Kebal) yang MENYERAP semua serangan masuk menjadi Aegis Shield & Heal, lalu meledak menjadi Glacial Fortress (-30% DMG 5s, Stun 2.8s, 145% ATK Magical)!',
        icon: 'Shield',
        type: 'buff',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'v_s4',
        name: 'Sub-Zero Epoch: Mirror Dimension',
        cd: 22.0,
        desc: 'SKILL UNIK (Cutscene 2D Anime Dimensi Cermin Es): Membekukan waktu & seluruh musuh (3.5s Stun), memanggil 3 Monolith Cermin Raksasa, & menembakkan Jaring Laser Prismatik (220% ATK True DMG). Membuka Absolute Zero Domain 7.5s (+22% ATK, +20% Crit, +28% ASPD, +18% Lifesteal, tembakan Monolith 55% ATK, & 1x Mirror Revive 30% HP saat sekarat)!',
        icon: 'Snowflake',
        type: 'ultimate',
        level: 1,
        maxLevel: 5,
        isUnique: true
      }
    ]
  },
  dimension_judge: {
    key: 'dimension_judge',
    name: 'DIMENSION JUDG',
    subtitle: 'Spatial Architect & Reality Arbiter',
    color: '#818cf8', // Indigo / Celestial Purple
    secondaryColor: '#4f46e5',
    hp: 740,
    atk: 62,
    atkSpeed: 1.48,
    critChance: 0.26,
    critDmg: 1.85,
    range: 210,
    speed: 185,
    defense: 18,
    lore: 'Entitas kosmik pengendali ruang dan gravitasi. Mampu melipat dimensi, memanggil singularitas lubang hitam, dan menciptakan domain ruang penghakiman mutlak.',
    passiveName: 'Spatial Gravity Distortion · Void Arbiter Form',
    passiveDesc: 'Wujud Dasar: Menarik & memperlambat musuh (180px); tiap 3 serangan dasar memicu Pulsa Gravitasi (105px, 55% ATK True Damage & -16% DMG diterima 3s). Wujud Void Arbiter (Jarak Dekat): Pasif berubah menjadi Astral Blade Mastery (-15% DMG diterima, +18% ATK, +20% ASPD, +38 Speed, +15 DEF, +8% Lifesteal/Crit, tiap 3 tebasan memicu Dimension X-Slash 75% True Damage, -15% DEF & Heal 1.5% Max HP).',
    bossCategory: 'Manipulation',
    skills: [
      {
        id: 'dj_s1',
        name: 'Spatial Collapse (Singularitas)',
        cd: 5.8,
        desc: 'Menciptakan ruang singularitas berputar yang menyedot musuh lalu meledak dengan 240% AoE Spatial Damage (dapat menghasilkan Critical Strike!).',
        icon: 'CircleDot',
        type: 'aoe',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'dj_s2',
        name: 'Dimensional Barrier (Dinding Ruang)',
        cd: 8.0,
        desc: 'Menciptakan dinding pembatas ruang dimensional yang memblokade jalan musuh dan memberi 55% ATK damage berkala setiap 0.45 detik (dapat Critical Strike!).',
        icon: 'Shield',
        type: 'control',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'dj_s3',
        name: 'Spatial Warp Blink',
        cd: 7.0,
        desc: 'Membelah ruang untuk berteleportasi seketika, meninggalkan ledakan ruang hampa (175% Vacuum Implosion, dapat Critical Strike!) yang men-stun musuh 1.8 detik.',
        icon: 'Compass',
        type: 'buff',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'dj_s4',
        name: 'Judgement Spatial Domain',
        cd: 16.5,
        desc: 'Membuka kubah ruang isolasi selama 6 detik: seluruh musuh di dalamnya terkena True Damage berkala (25 + 70% ATK) tiap 0.5 detik yang dapat Critical Strike, ATK +65%, dan +40% ASPD!',
        icon: 'Sparkles',
        type: 'ultimate',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'dj_s5',
        name: 'Void Arbiter Ascension (Tersegel)',
        cd: 0,
        desc: 'SKILL UNIK TERSEGEL (Tidak bisa dipakai manual): Hanya serangan dasar yang mengisi Dimensional Resonance (0–100%, +5% per serangan dasar). Saat 100%, memicu CUTSCENE 3D & mengubah Dimension Judg menjadi wujud Jarak Dekat (Void Arbiter) selama 11 detik dengan Pasif & 4 Skill baru yang berbeda!',
        icon: 'Lock',
        type: 'ultimate',
        level: 1,
        maxLevel: 1,
        isUnique: true,
        lockedUnique: true
      }
    ]
  },
  rift_walker: {
    key: 'rift_walker',
    name: 'RIFT WALKER (REVAMP)',
    subtitle: 'Quantum Phantom & Dimensional Assassin',
    color: '#06b6d4', // Cyan
    secondaryColor: '#0891b2',
    hp: 700,
    atk: 52,
    atkSpeed: 1.45,
    critChance: 0.24,
    critDmg: 1.85,
    range: 120,
    speed: 215,
    defense: 15,
    lore: 'Pendekar bayangan kuantum yang membelah dimensi dalam sekejap mata. Mengubah setiap teleportasi dan penghindaran menjadi tebasan pemecah realitas dan tanda ledakan Rift.',
    passiveName: 'Quantum Blink Strike, Phase Crossfire & Phase Shroud',
    passiveDesc: 'Memiliki +10% Evasion dasar. Setiap Dodge atau Blink/Teleport memicu Phase Counter-Slash (48% ATK True Damage AoE, CD 0.85s) & memotong cooldown semua Skill 0.15s! Pasif Blink Strike: Setiap 5 serangan dasar melakukan Quantum Blink ke belakang target, menebas AoE 130px (100% Crit 130% ATK + 2% Max HP True Damage), stun 0.6s, menumpuk Rift Mark (3 mark meledak 90% True Damage AoE), heal 2.5% Max HP, dan Quantum Warp 2.5s (+22% ASPD, +8% Evasion, +6% Crit, -18% DMG diterima). Pasif Phase Crossfire: Setiap 8.0 detik melakukan 3x teleportasi tebasan kilat (100% Crit 85% ATK AoE, stun 0.25s) & Garis Laser Rift (40% ATK True Damage)!',
    bossCategory: 'Assassin',
    skills: [
      {
        id: 'rw_s3',
        name: 'Phantom Decoy Singularity',
        cd: 8.8,
        desc: 'Teleportasi menghindar 185px (kebal 0.45s), memulihkan 4% Max HP, mengaktifkan Quantum Warp 2.5s (-18% DMG diterima), menarik & meledakkan musuh di titik asal (110% ATK True Damage), serta memanggil Klon Bayangan Warp selama 5.5 detik.',
        icon: 'Copy',
        type: 'control',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'rw_s4',
        name: 'Omnipresent Void Storm',
        cd: 19.5,
        desc: 'Menjadi tak tersentuh (Invulnerable) selama badai teleportasi 10x tebasan kilat beruntun (100% Crit 95% ATK + 1.2% Max HP True Damage per tebasan), ditutup ledakan Void Shatter Nova 210% ATK True Damage radius 220px!',
        icon: 'Sparkles',
        type: 'ultimate',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'rw_s5',
        name: 'Anomaly Fusion Portal',
        cd: 26.0,
        desc: 'Skill Biasa (Langsung CD di awal permainan): Membuka Portal Dimensi untuk memanggil 1 Hero Anomali (gabungan seluruh hero) yang akan menyerap Rift Walker ke dalam tubuhnya. Sebagai gantinya tercipta Clone Anomali (ATK dasar 5) yang memiliki SELURUH skill pasif semua hero, lalu Hero Anomali dan Rift Walker (yang terserap) pergi meninggalkan arena!',
        icon: 'Orbit',
        type: 'buff',
        level: 1,
        maxLevel: 5
      }
    ]
  },
  soul_puppeteer: {
    key: 'soul_puppeteer',
    name: 'SOUL PUPPETEER',
    subtitle: 'Necromancer, Puppeteer & Soul Maker Sovereign',
    color: '#e879f9', // Fuchsia Soul Glow
    secondaryColor: '#9333ea',
    hp: 680,
    atk: 48,
    atkSpeed: 1.28,
    critChance: 0.22,
    critDmg: 1.85,
    range: 220,
    speed: 195,
    defense: 15,
    lore: 'Penguasa benang jiwa terlarang yang menempakan Soul, mengendalikan boneka perang, merasuki wadah boneka, membangkitkan pasukan mayat hidup, memodifikasi ciptaannya, hingga bertransformasi menjadi Soul Lich.',
    passiveName: 'Soul Maker & Necro Strings',
    passiveDesc: 'Setiap serangan dasar menempa +1 Soul & membunuh musuh memberi +3 Soul (+10 Boss, maks 30 Soul) serta membangkitkan Bone Revenant (Boneka & Undead hanya mewarisi 25% efek Relic). Tiap 1 Soul memberi +0.8% ATK; pada >=10 Soul, serangan menembakkan Soul Thread Bolt (+10% ATK True Damage).',
    bossCategory: 'Manipulation',
    skills: [
      {
        id: 'sp_s1',
        name: 'Marionette Control (Kendali Boneka)',
        cd: 6.5,
        desc: 'Memanggil 2 Boneka Perang (maks 3 aktif) yang terhubung Benang Jiwa ke Soul Puppeteer. Boneka menyerang otonom (62% ATK) & mewarisi 25% efek Relic + Modifikasi.',
        icon: 'Copy',
        type: 'buff',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'sp_s2',
        name: 'Soul Possession (Merasuki Boneka)',
        cd: 10.0,
        desc: 'Melesat merasuki boneka (3.0 detik, tubuh utama kebal & TIDAK BISA DI-HIT selama durasi rasukan), memulihkan 15% HP, mengurangi 25% damage diterima selama 4.5 detik, meledakkan Soul Shockwave 150% True Damage, serta mendapat +30% ASPD & +65 Speed.',
        icon: 'Ghost',
        type: 'control',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'sp_s3',
        name: 'Necro Forge & Puppet Modify',
        cd: 11.0,
        desc: 'Necromancer membangkitkan 2 Bone Revenant (maks 5) & memodifikasi seluruh Boneka/Undead (+1 Tier Modify: +25% ATK per tier, maks Lv.3) sekaligus men-transform musuh HP <28% menjadi Boneka!',
        icon: 'Wrench',
        type: 'aoe',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'sp_s4',
        name: 'Sovereign Transform: Ascendant Lich',
        cd: 20.0,
        desc: 'Bertransformasi menjadi Soul Lich selama 8 detik (+30% ATK, +20% ASPD, +25 DEF, +180 Range), serangan berubah menjadi 3-arah Soul Scythe (45% samping) & Execution 160% True Damage ke seluruh musuh!',
        icon: 'Crown',
        type: 'ultimate',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'sp_s5',
        name: 'Infinite Marionette Theatre (Domain Requiem)',
        cd: 25.0,
        desc: 'Skill Unik Anime: Membuka Domain Crimson Theatre dengan cutscene anime cel-shaded 3D! Memanggil Raja Marionet Bayangan, memicu Final Curtain (230% ATK Crit + 150% ATK True Damage, Stun 1.8s, -25% DEF), langsung menempa +12 Soul, +2 Boneka & +3 Bone Revenant (+1 Tier Modify), serta memasuki wujud Sovereign Domain selama 9 detik (+35% ATK, +30% ASPD, -28% DMG diterima, +150 Range, & Benang Takdir pada setiap serangan)!',
        icon: 'Sparkles',
        type: 'ultimate',
        level: 1,
        maxLevel: 5,
        isUnique: true
      }
    ]
  },
  solaris: {
    key: 'solaris',
    name: 'SOLARIS IGNIS',
    subtitle: 'Pyre Dragoon & Solar Flare Sovereign',
    color: '#f97316', // Solar Orange
    secondaryColor: '#c2410c',
    hp: 760,
    atk: 56,
    atkSpeed: 1.40,
    critChance: 0.25,
    critDmg: 1.95,
    range: 145,
    speed: 195,
    defense: 18,
    lore: 'Ksatria naga matahari pembawa tombak inti bintang. Mengumpulkan panas surya di setiap serangan untuk meledakkan meteor dan berubah menjadi Avatar Matahari.',
    passiveName: 'Solar Flare Ignition',
    passiveDesc: 'Setiap serangan dasar & skill mengumpulkan +1 Solar Heat (+3 per kill, maks 20). Tiap stack memberi +2% ATK & +1.5% ASPD. Pada 10+ stack, serangan memicu ledakan Solar Flare (45% ATK True Damage AoE) & setiap kill memulihkan 2% Max HP.',
    bossCategory: 'Warrior',
    skills: [
      {
        id: 'sol_s1',
        name: 'Solar Lance Thrust',
        cd: 4.8,
        desc: 'Menerjang menusukkan Tombak Matahari sejauh 220px, menembus semua musuh di jalur dengan 155% ATK + 35% ATK True Damage serta menambah +3 Solar Heat.',
        icon: 'Zap',
        type: 'attack',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'sol_s2',
        name: 'Corona Nova Ring',
        cd: 6.5,
        desc: 'Meledakkan cincin api matahari radius 190px berdamage 130% AoE (dapat Critical), mendorong musuh mundur, dan memberi Solar Guard (-22% DMG diterima selama 4.0 detik).',
        icon: 'Shield',
        type: 'aoe',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'sol_s3',
        name: 'Starfall Meteor Barrage',
        cd: 9.5,
        desc: 'Memanggil 4 meteor matahari menghujani musuh terdekat! Tiap meteor meledak radius 115px berdamage 115% ATK (dapat Critical) dan men-stun 0.9 detik.',
        icon: 'Flame',
        type: 'attack',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'sol_s4',
        name: 'Supernova Incarnation',
        cd: 19.5,
        desc: 'SKILL UNIK (Cutscene 3D Gerhana Supernova): Memanggil gerhana inti bintang & menghantamkan Tombak Matahari dengan ledakan Supernova 3D, berubah menjadi Avatar Matahari selama 8 detik! Membersihkan debuff & heal 18% Max HP, menarik musuh, memangkas -25% DEF + Stun 1.0s lewat ledakan 320% True Damage (250px). Memberi Solar Heat penuh, +45% ATK, +40% ASPD, +40 Speed, +20% Crit, +35% Crit DMG, +10% Lifesteal, +22 DEF, +30 Range, & Solar Ward (-25% DMG diterima). Serangan dasar memicu Gelombang Api (60% ATK True DMG, -0.25s CD skill lain), aura bakar, & ledakan akhir Hypernova!',
        icon: 'Sun',
        type: 'ultimate',
        level: 1,
        maxLevel: 5,
        isUnique: true
      }
    ]
  },
  fallen_angel: {
    key: 'fallen_angel',
    name: 'FALLEN ANGEL',
    subtitle: 'Eclipse Seraph & Abyssal Blink Weaver',
    color: '#c084fc', // Fallen Seraph Violet
    secondaryColor: '#e11d48',
    hp: 670,
    atk: 42,
    atkSpeed: 1.32,
    critChance: 0.16,
    critDmg: 1.65,
    range: 175,
    speed: 200,
    defense: 12,
    lore: 'Seraphim terbuang dengan enam sayap gerhana obsidian. Kekuatan ofensifnya telah disegel berat, namun ia dapat membuka wujud True Fallen Angel sesaat untuk menembus ruang lewat rangkaian Blink cepat.',
    passiveName: 'Eclipse Seraph & Fallen Feathers',
    passiveDesc: 'Memiliki +8% Evasion & +6% Lifesteal alami. Serangan dasar & kill mengumpulkan +1 Fallen Feather (+1 per kill, +3 Boss, maks 12). Tiap Feather memberi +0.8% ATK & +1.5 Speed. Setiap serangan ke-4 (atau saat Feather penuh) menembakkan 3 Bulu Gerhana Penembus (30% ATK) & heal 1% Max HP. Saat HP <45% (Eclipse Grace), menerima -10% DMG & +6% Evasion. Wujud True Fallen Angel (5.5s): +115 Speed, +30% Evasion, +15% ASPD (-15% ATK), tiap Blink memberi 0.25s Invulnerable, -12% DMG Ward (2.0s), kabut slow 130px, & -0.25s CD Blink lain.',
    bossCategory: 'Assassin',
    skills: [
      {
        id: 'fa_s1',
        name: 'Crimson Feather Barrage',
        cd: 6.2,
        desc: 'Meluncurkan 5 Bulu Gerhana berbentuk kipas ke arah target (48% ATK per bulu, bisa Crit) yang merobek Defense musuh -10% & menambah +2 Fallen Feathers.',
        icon: 'Feather',
        type: 'attack',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'fa_s2',
        name: 'Shattered Halo Dash',
        cd: 8.2,
        desc: 'Melesat kebal sesaat (0.4s Invulnerable & mengurangi 14% damage diterima selama 2.5 detik) dan meninggalkan Halo Hitam radius 165px berdamage 105% ATK serta stun 0.8 detik.',
        icon: 'Sparkles',
        type: 'control',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'fa_s3',
        name: 'Judgement of Sin',
        cd: 12.5,
        desc: 'Menjatuhkan Pilar Penghakiman radius 185px: 105% ATK + 2% Max HP (maks 260) True Damage & stun 0.7 detik.',
        icon: 'Zap',
        type: 'aoe',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'fa_s4',
        name: 'Eclipse of the Fallen Seraph',
        cd: 24.0,
        desc: 'Membuka Sayap Gerhana selama 6.5 detik (+22% ATK, +20% ASPD, +10% Evasion), ledakan awal 165% ATK radius 210px, dan menghujankan 3 Bulu Hitam (48% ATK) tiap 0.85 detik.',
        icon: 'Crown',
        type: 'ultimate',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'fa_s5',
        name: 'True Fallen Angel: Abyssal Blink',
        cd: 20.0,
        desc: 'Skill Unik (Cutscene 3D & Pertarungan): Memicu Cutscene 3D Abyssal Eclipse 12 detik (4 Babak: Gerhana, Enam Sayap Obsidian, Abyssal Blink, & Kebangkitan) lalu bertarung dalam wujud True Fallen Angel selama 5.5 detik sebagai Cutscene Pertarungan penuh (Kamera Sinematik, Kebal Damage, & 4 Skill Blink cepat).',
        icon: 'Zap',
        type: 'buff',
        level: 1,
        maxLevel: 5,
        isUnique: true
      }
    ]
  },
  demon_raised: {
    key: 'demon_raised',
    name: 'DEMON RAISED',
    subtitle: 'Risen Archfiend & Hellfire Overlord',
    color: '#e11d48', // Hellfire Crimson
    secondaryColor: '#991b1b',
    hp: 860,
    atk: 56,
    atkSpeed: 1.38,
    critChance: 0.22,
    critDmg: 2.0,
    range: 130,
    speed: 205,
    defense: 20,
    lore: 'Raja Iblis kuno yang bangkit kembali dari jurang neraka abadi. Semakin banyak darah tertumpah, semakin membara amarah Hellfire-nya hingga tak terhentikan oleh kematian itu sendiri.',
    passiveName: 'Risen Abyssal Sovereign',
    passiveDesc: 'Serangan dasar & kill mengumpulkan +1 Hellfire Essence (+3 per kill, +8 Boss, maks 25). Tiap Essence memberi +1.5% ATK, +1.2 DEF, & +0.4% Lifesteal. Pada >=10 Essence atau HP <50%, serangan memicu ledakan Api Neraka (50% ATK True Damage) & -18% DMG diterima. Abyssal Rebirth (CD 60s): saat HP habis, otomatis bangkit dengan 45% HP + Hellfire Nova 260% ATK True Damage!',
    bossCategory: 'Warrior',
    skills: [
      {
        id: 'dr_s1',
        name: 'Hellfire Claw Cleave',
        cd: 4.5,
        desc: 'Tebasan cakar iblis radius 165px ke depan menghasilkan 235% ATK (bisa Crit) + 85% ATK True Damage Api Neraka serta memberi +3 Hellfire Essence.',
        icon: 'Swords',
        type: 'attack',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'dr_s2',
        name: 'Abyssal Chains & Blood Pact',
        cd: 8.0,
        desc: 'Menembakkan rantai neraka radius 235px menarik seluruh musuh (170% ATK AoE), menguras darah untuk memulihkan 14% Max HP & mengurangi 24% damage diterima selama 4.5 detik!',
        icon: 'Shield',
        type: 'control',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'dr_s3',
        name: 'Infernal Abyss Eruption',
        cd: 10.5,
        desc: 'Membelah tanah neraka memanggil 5 letusan pilar magma beruntun di sekitar musuh terdekat (210% ATK per letusan radius 115px) & +4 Hellfire Essence!',
        icon: 'Flame',
        type: 'aoe',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'dr_s4',
        name: 'Risen Archfiend Ascension',
        cd: 21.0,
        desc: 'Kebangkitan Raja Iblis selama 9 detik: langsung mengisi Essence penuh, +45% ATK, +40% ASPD, +40 Speed, -25% DMG diterima, ledakan awal 350% True Damage & aura Hellfire 110% True Damage tiap 0.75s!',
        icon: 'Skull',
        type: 'ultimate',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'dr_s5',
        name: 'Angel & Demon',
        cd: 26.0,
        desc: 'Skill Unik (Cutscene Arena Transform): Mengubah arena menjadi medan Surga & Neraka selama 12 detik, terus memanggil Malaikat & Iblis bertarung bersama, serta mengganti seluruh skill dan pasif menjadi wujud Celestial-Infernal Duality!',
        icon: 'Crown',
        type: 'buff',
        level: 1,
        maxLevel: 5,
        isUnique: true
      }
    ]
  },
  elementalis: {
    key: 'elementalis',
    name: 'ELEMENTALIS',
    subtitle: 'Avatar of the Four Primordial Elements',
    color: '#14b8a6', // Primordial Elemental Teal
    secondaryColor: '#f97316',
    hp: 820,
    atk: 54,
    atkSpeed: 1.35,
    critChance: 0.20,
    critDmg: 1.95,
    range: 260,
    speed: 200,
    defense: 18,
    lore: 'Penguasa empat elemen purba — Air, Api, Tanah, dan Angin. Dengan memadukan kekuatan elemen secara bersamaan, ia memicu reaksi alam dahsyat yang menghancurkan medan pertempuran.',
    passiveName: 'Four Primordial Elements',
    passiveDesc: '• Water Poseidon Armor: Mengurangi 45% damage masuk dengan daya tahan 1000 HP (CD 60 detik saat pecah). • Flaming: Serangan membakar musuh selama 2.5 detik, mengurangi HP tiap detik. • Creation: Setiap 10 serangan dasar menciptakan Retakan Tanah AoE (Physical + Stun + -20% DEF). • Wind Burst: Setiap 10 kali skill Wind aktif memanggil Tornado raksasa! Kombo Skill (aktif bersamaan <2.4s): 1+3 Gelombang Batu, 1+2 Pusaran Api [Wind], 2+3 Pusaran Air [Wind].',
    bossCategory: 'Manipulation',
    skills: [
      {
        id: 'el_s1',
        name: 'Inferno Fireball',
        cd: 5.0,
        desc: 'Menembakkan Bola Api raksasa yang meledak radius 155px menghasilkan 225% ATK Magical Damage (bisa Crit) dan memicu efek Flaming. Kombo <2.4s: (+Skill 2) Pusaran Api | (+Skill 3) Gelombang Batu.',
        icon: 'Flame',
        type: 'attack',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'el_s2',
        name: 'Tempest Wind Vortex',
        cd: 5.5,
        desc: '[Wind] Menciptakan Pusaran Angin radius 175px selama 3.0 detik yang menyedot musuh, memberi ledakan awal 155% ATK & tebasan angin 75% ATK tiap 0.5 detik (+1 Wind Burst). Kombo <2.4s: (+Skill 1) Pusaran Api | (+Skill 3) Pusaran Air.',
        icon: 'Wind',
        type: 'control',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'el_s3',
        name: 'Abyssal Water Wave',
        cd: 6.8,
        desc: 'Meluncurkan Gelombang Air pasang lebar (460px) berdamage 210% ATK Magical, mendorong & memperlambat musuh 2.5 detik, memulihkan 8% Max HP +120 HP Poseidon Armor (-5s CD jika pecah). Kombo <2.4s: (+Skill 1) Gelombang Batu | (+Skill 2) Pusaran Air.',
        icon: 'Droplets',
        type: 'aoe',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'el_s4',
        name: 'Primordial Genesis: Sanctuary Realm',
        cd: 25.0,
        desc: 'SKILL UNIK (Cutscene 3D Penciptaan Dunia): Memicu Cutscene 3D saat Elementalis membentuk Pegunungan, Dataran Hijau, Danau, & Hutan Purba, lalu mengubah arena pertandingan menjadi Primordial Sanctuary selama 14 detik! Memulihkan 10% Max HP & +450 HP Poseidon Armor (-15s CD jika pecah), +14 DEF, -12% DMG diterima, +15% Speed, jendela kombo meluas ke 4.2s, & memperlambat musuh -22%!',
        icon: 'Crown',
        type: 'ultimate',
        level: 1,
        maxLevel: 5,
        isUnique: true
      }
    ]
  },
  arcana: {
    key: 'arcana',
    name: 'ARCANA',
    subtitle: 'Sovereign of Living Cards & Fate',
    color: '#ec4899', // Royal Magenta
    secondaryColor: '#fbbf24', // Gilded Gold
    hp: 720,
    atk: 36,
    atkSpeed: 1.12,
    critChance: 0.10,
    critDmg: 1.60,
    range: 255,
    speed: 205,
    defense: 13,
    lore: 'Penguasa dek kartu hidup dan dadu takdir. Setiap serangannya melempar kartu bumerang berputar, merangkai kombinasi Poker (Pair, Triple Jackpot, Rainbow Flush), dan menghilang menjadi ilusi kartu saat terancam.',
    passiveName: 'Living Tarot, Fate Die & Phantom Mirage',
    passiveDesc: '• Phantom Mirage (Bertahan): Saat hampir terkena serangan musuh (CD 9 detik), Arcana lenyap menjadi badai kartu dan TIDAK BISA DIHIT / kebal serangan serta debuff selama 1.6 detik (+25% Speed)! • Living Tarot Deck: Setiap 5 serangan dasar menarik 1 Kartu (♠ Eksekusi <8%/+15% Crit, ♥ Heal 1%/Shield, ♦ Pantul/-4% DEF, ♣ Petir/Stun 0.3s) ke 3-Slot Hand. Combo: Pair (+6% ATK & -0.4s CD), Triple Jackpot (95% True DMG AoE, Stun 0.35s & -0.7s CD), Rainbow Flush (+10% ATK/+12% ASPD 3.5s). • Loaded Fate Die: Tiap 7s lempar Dadu (1–6); 6 = Miracle (+12% Crit), 1 = Chaos Reversal.',
    bossCategory: 'Manipulation',
    skills: [
      {
        id: 'ar_s1',
        name: 'Card Fan: Boomerang Prism',
        cd: 6.5,
        desc: 'Melempar kipas 5 Kartu Tarot tajam (38% ATK per lintasan) yang melesat keluar lalu berputar BALIK seperti bumerang ke Arcana (menyerang musuh dua kali!) dan langsung menarik +1 Kartu ke Hand.',
        icon: 'Sparkles',
        type: 'attack',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'ar_s2',
        name: 'Roll the Fate Die',
        cd: 8.0,
        desc: 'Melempar Dadu Takdir raksasa (D6) ke kerumunan musuh! Meledak radius 180px sebesar (50% + Angka×12%) ATK True Damage, mengaktifkan buff Dadu, & langsung menarik +1 Kartu (+2 jika keluar angka 6).',
        icon: 'Compass',
        type: 'aoe',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'ar_s3',
        name: 'Mirror Gambit: Trickster Trap',
        cd: 10.0,
        desc: 'Menebar Zona Perangkap Penipu (180px, 3.5s) yang memperlambat musuh -45%, mencuri +1.5% ATK per musuh (maks +9%), serta menggandakan efek kartu terakhir di Hand menjadi 3 proyektil pelacak!',
        icon: 'Zap',
        type: 'control',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'ar_s5',
        name: 'Phantom Card Dash',
        cd: 5.5,
        desc: 'Melesat cepat 200px ke arah gerak (atau menjauh taktis saat Auto-Pilot) menjadi ilusi kartu (0.45s Invulnerable & +30% Speed 2.0s), meninggalkan Ledakan Ilusi 145px (75% ATK Magical + Slow 1.8s), & menarik +1 Kartu ke Hand!',
        icon: 'Wind',
        type: 'control',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'ar_s4',
        name: 'Royal Flush: Destiny Roulette',
        cd: 25.0,
        desc: 'SKILL UNIK (Cutscene 3D & Pertarungan): Memicu Cutscene 3D Tarot Verdict (mengungkap 3 Kartu Tarot & hukuman tiap kartu), lalu seluruh pertarungan di mode Roda Roulette (260px, 4.5s) berjalan sebagai Cutscene Pertarungan penuh (Kamera Sinematik & Kebal Damage) hingga ledakan Grand Royal Flush!',
        icon: 'Crown',
        type: 'ultimate',
        level: 1,
        maxLevel: 5,
        isUnique: true
      }
    ]
  },
  morphos: {
    key: 'morphos',
    name: 'MORPHOS',
    subtitle: 'Primordial Apex Shapeshifter',
    color: '#10b981', // Emerald Bio-Mutagen
    secondaryColor: '#f59e0b',
    hp: 820,
    atk: 50,
    atkSpeed: 1.35,
    critChance: 0.20,
    critDmg: 1.85,
    range: 135,
    speed: 205,
    defense: 18,
    lore: 'Entitas evolusi purba yang dapat bermetamorfosis secara instan antara wujud Serigala Pencabik, Raksasa Behemoth, dan Naga Astral Wyvern, hingga menyatu menjadi Apex Chimera.',
    passiveName: 'Tri-Form Evolution & Chimera DNA',
    passiveDesc: '• 3 Wujud Transformasi: 🐺 Wolf (+35% ASPD, +65 Speed, +18% Crit, +15% Evasion, tiap 3 hit Bleed 35% True DMG AoE); 🐻 Behemoth (+32 DEF, -25% DMG diterima, serangan AoE Smash +35% & Slow); 🦅 Wyvern (Range 285, +25% ATK, +45% Crit DMG, serangan menembak 3 Bola Api Naga 75% ATK). • DNA Shift: Setiap berpindah wujud memicu Ledakan Metamorfosis (95% ATK True DMG, Heal 4% Max HP) & menumpuk Evolution Stack (+5% ATK & +5% ASPD per stack, maks 6, 10 detik)!',
    bossCategory: 'Warrior',
    skills: [
      {
        id: 'mp_s1',
        name: 'Transform: Razor Wolf',
        cd: 5.0,
        desc: 'Berubah menjadi 🐺 Razor Wolf Form! Menerjang 200px mencabik radius 150px dengan 155% ATK + 45% ATK True Damage serta memperlambat musuh 2.0 detik.',
        icon: 'Zap',
        type: 'attack',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'mp_s2',
        name: 'Transform: Titan Behemoth',
        cd: 6.5,
        desc: 'Berubah menjadi 🐻 Titan Behemoth Form! Menghentak tanah 190px menarik musuh (150% ATK), mengaktifkan Iron Hide (-25% DMG diterima), & mendapat Aegis Shield 14% Max HP.',
        icon: 'Shield',
        type: 'control',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'mp_s3',
        name: 'Transform: Astral Wyvern',
        cd: 6.0,
        desc: 'Berubah menjadi 🦅 Astral Wyvern Form! Melompat taktis 150px sambil menyemburkan Nafas Laser Naga (120% True DMG) & 5 Bola Api Kosmik (110% ATK Magical)!',
        icon: 'Wind',
        type: 'aoe',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'mp_s4',
        name: 'Apex Chimera: Omega Metamorphosis',
        cd: 21.0,
        desc: 'SKILL UNIK (Cutscene 3D Transformasi): Menyatukan roh Wolf, Behemoth, & Wyvern menjadi 🐉 APEX CHIMERA selama 9 detik! Langsung 6/6 Evo Stack, -28% DMG diterima, +32% ATK, +35% ASPD, +22% Crit, +45 Speed, +15% Lifesteal, cakaran AoE + 3 Bola Api serentak, & Apex Pulse tiap 1.0 detik! (Cooldown 21s tidak dapat dikurangi oleh CDR atau efek pengurang CD apa pun).',
        icon: 'Crown',
        type: 'ultimate',
        level: 1,
        maxLevel: 5,
        isUnique: true
      }
    ]
  },
  lumina: {
    key: 'lumina',
    name: 'LUMINA',
    subtitle: 'Sovereign of Mirrors & Radiant Light',
    color: '#fde047', // Radiant Light Gold
    secondaryColor: '#e0f2fe', // Silver Mirror Chrome
    hp: 640,
    atk: 45,
    atkSpeed: 1.25,
    critChance: 0.18,
    critDmg: 1.80,
    range: 270,
    speed: 195,
    defense: 13,
    lore: 'Penguasa dimensi kaca dan cahaya suci. Dapat bertransformasi secara taktis antara Wujud Cermin untuk pertahanan dan pantulan kontrol, atau Wujud Cahaya untuk serangan laser presisi jarak jauh.',
    passiveName: 'Prismatic Duality (Mirror ↔ Light)',
    passiveDesc: '• Radiant Charge: Tiap serangan dasar & skill memberi +1 Charge (maks 8, tiap stack +1.5% ATK & +1.2% ASPD). • 🪞 Wujud Cermin (Default): +14 DEF, -12% DMG diterima, maks 3 Cermin aktif; tiap serangan dasar ke-3 memantulkan Laser Pembiasan (40% ATK Magical DMG) & Mirror Aegis (CD 7s) memecah 1 Cermin untuk menahan 30% DMG + ledakan balik 75% ATK. • ☀️ Wujud Cahaya: +18% ATK, +20% ASPD, +10% Crit, +35 Range, & tiap serangan ke-3 menembakkan Sinar Suci (+35% ATK True DMG).',
    bossCategory: 'Manipulation',
    skills: [
      {
        id: 'lm_s1',
        name: 'Prism Mirror Summon',
        cd: 6.0,
        desc: '🪞 Cermin: Memanggil 2 Cermin Cahaya (durasi 10s, maks 3) dengan kilatan pembuka 85% ATK Magical (120px) & laser penghubung. ☀️ Cahaya: Meledakkan cermin sekitar menjadi Solar Implosion 125% ATK Magical (155px, +20% per cermin terpakai, maks 2) + Burn 2.5s!',
        icon: 'Sparkles',
        type: 'control',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'lm_s2',
        name: 'Solaris Laser Beam',
        cd: 6.5,
        desc: 'Menembakkan Laser Cahaya Suci (430px) 135% ATK Magical (+2 Charge). 🪞 Cermin: Memantul ke maks 2 Cermin aktif (65% ATK Magical + Slow 1.4s). ☀️ Cahaya: Menembus dengan Solar Core (+45% ATK True DMG, & dijamin Crit pada target utama bila Charge >= 5)!',
        icon: 'Zap',
        type: 'attack',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'lm_s3',
        name: 'Mirage Mirror Dash',
        cd: 7.2,
        desc: 'Meluncur 180px, memulihkan 8% Max HP, & +22% Speed (2.8s). 🪞 Cermin: Meninggalkan Bayangan Cermin meledak 105% ATK Magical + Stun 0.7s, memanggil 1 Cermin, & -15% DMG diterima (3s). ☀️ Cahaya: Meninggalkan Kilatan Cahaya 115% ATK True DMG & +18% ASPD (3s).',
        icon: 'Shield',
        type: 'buff',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'lm_s4',
        name: 'Dual Aspect: Mirror ↔ Light',
        cd: 5.5,
        desc: 'SKILL UNIK (Transformasi Wujud): Berubah dari kekuatan Cermin ke Cahaya, dan sebaliknya! 🪞→☀️ Cahaya: Menyerap hingga 2 Cermin menjadi gelombang Solaris Flash (125% ATK Magical + 35% per cermin, Stun 0.6s, +2 Charge) & beralih ke Wujud Cahaya. ☀️→🪞 Cermin: Memanggil 2 Cermin, Aegis Shield 8% Max HP (4s), & ledakan pantul 105% ATK Magical (Slow 1.5s)!',
        icon: 'Crown',
        type: 'ultimate',
        level: 1,
        maxLevel: 5,
        isUnique: true
      },
      {
        id: 'lm_s5',
        name: 'Sovereign Equinox: Prismatic Ascension',
        cd: 24.0,
        desc: 'Skill Spesial Anime (Transform Gabungan Cahaya & Cermin): Membuka cutscene anime 3D penggabungan Cahaya Surya & Cermin Suci! Meledakkan Equinox Prism Nova (225% ATK Magical + 145% ATK True DMG, Stun 1.6s, -25% DEF), memulihkan 16% Max HP, memanggil 3 Cermin Agung, mereset Mirror Aegis & menempa +6 Radiant Charge, lalu bertransformasi ke Wujud Equinox selama 9.5 detik (+35% ATK, +32% ASPD, +22% Crit, +85 Range, +50 Speed, -18% DMG diterima, & serangan dasar menembakkan Laser Surya + Pantulan 3 Cermin sekaligus)!',
        icon: 'Sparkles',
        type: 'ultimate',
        level: 1,
        maxLevel: 5,
        isUnique: true
      }
    ]
  },
  axiom: {
    key: 'axiom',
    name: 'AXIOM',
    subtitle: 'Sovereign of Absolute Vector & Mind Manipulation (3D Hero)',
    color: '#a855f7', // Psionic Violet
    secondaryColor: '#22d3ee', // Vector Cyan
    hp: 740,
    atk: 52,
    atkSpeed: 1.38,
    critChance: 0.22,
    critDmg: 1.85,
    range: 255,
    speed: 200,
    defense: 16,
    lore: 'Entitas manipulasi dimensi 3D sejati yang mematahkan hukum fisika dan kesadaran di arena. Tubuh serta seluruh serangannya berwujud konstruksi geometris 3D hidup yang membengkokkan vektor peluru musuh, mengendalikan pikiran lawan agar berbalik membantai kawannya, dan memenjarakan medan tempur di dalam Kubus Realitas.',
    passiveName: 'Absolute Vector & Neural Hijack (3D Combat)',
    passiveDesc: '• 3D Vector Field: Hero & serangan hadir dalam wujud 3D! Aura gravitasi memperlambat musuh 210px & membengkokkan proyektil musuh. • Manipulation Stack (maks 12): Setiap serangan 3D Prism Lance & skill memberi +1 stack (+2% ATK & +1.5% CDR/stack). Serangan ke-4 menghancurkan vektor musuh (85% ATK True DMG AoE + membajak proyektil musuh sekitar menjadi peluru 3D pelacak). • Vector Deflection (CD 6s): Otomatis membelokkan serangan masuk pertama, meniadakan DMG, & menembakkan balik 3 Monolith Shard 3D!',
    bossCategory: 'Manipulation',
    skills: [
      {
        id: 'ax_s1',
        name: 'Telekinetic Singularity Slam',
        cd: 5.2,
        desc: 'Menarik dan mengangkat seluruh musuh dalam radius 220px ke satu titik fokus, lalu menghantamkan Monolit Vektor 3D (185% ATK Magical + 65% True DMG, Stun 1.1s, & merobek DEF -22%)!',
        icon: 'Crosshair',
        type: 'control',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'ax_s2',
        name: 'Neural Puppetry: Mass Betrayal',
        cd: 8.5,
        desc: 'Memancarkan gelombang manipulasi pikiran 250px (120% ATK True DMG): Mengambil alih kesadaran maks 4 musuh non-Boss selama 3.5 detik agar menyerang kawannya sendiri (110% ATK Axiom True DMG AoE) & membajak seluruh peluru musuh di arena menjadi peluru 3D pelacak!',
        icon: 'Skull',
        type: 'control',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'ax_s3',
        name: 'Vector Polarity: Orbital Guillotine',
        cd: 7.0,
        desc: 'Meluncurkan 6 Bilah Monolit 3D pelacak berputar (140% ATK Magical tiap bilah, dapat Crit), memulihkan 10% Max HP, menarik musuh ke pusat lintasan, & memberi Vector Ward (-25% DMG diterima selama 3.5 detik)!',
        icon: 'Zap',
        type: 'attack',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'ax_s4',
        name: 'Reality Inversion: Cube Prison',
        cd: 13.5,
        desc: 'Menciptakan Penjara Kubus Realitas 3D (270px selama 4.5s): Membalikkan gravitasi untuk menarik & menyiksa musuh tiap 0.45s (85% ATK True DMG, dapat Crit), memberi +40% ATK & +35% ASPD saat aktif, serta mengeksekusi instan non-Boss HP < 15%!',
        icon: 'Shield',
        type: 'aoe',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'ax_s5',
        name: 'Apex Dominion: Overlord of Reality',
        cd: 23.0,
        desc: 'Skill Unik 3D Cutscene: Membalikkan dimensi arena dalam Cutscene 3D Manipulasi Puncak! Menghancurkan musuh 380px (260% ATK Magical + 180% True DMG, Stun 2.2s, -35% DEF), mendominasi seluruh non-Boss (4s), memulihkan 15% Max HP, & memasuki Sovereign Mode 9 detik (+45% ATK, +35% ASPD, +22% Crit, -30% DMG diterima, serangan dasar melepaskan 3 Sinar Prisma 3D)!',
        icon: 'Crown',
        type: 'ultimate',
        level: 1,
        maxLevel: 5,
        isUnique: true
      }
    ]
  },
  kagero: {
    key: 'kagero',
    name: 'KAGERO',
    subtitle: 'Crimson Blood Art — Anime Demon-Blade Sovereign',
    color: '#e11d48', // Anime Crimson Blood
    secondaryColor: '#f43f5e', // Scarlet Rose Aura
    hp: 760,
    atk: 56,
    atkSpeed: 1.48,
    critChance: 0.24,
    critDmg: 1.95,
    range: 220,
    speed: 218,
    defense: 14,
    lore: 'Pendekar katana terkutuk bergaya anime dari Klan Bulan Darah yang menempa darahnya sendiri menjadi bilah tebasan dan bunga Higanbana mematikan. Dalam setiap pertarungan, jubah Haori hitam-merahnya berkibar bersama aura tinta darah—memotong musuh dengan teknik Iaido cepat dan menghisap daya hidup lawan untuk bertahan abadi.',
    passiveName: 'Kekkijutsu: Crimson Blood Edge (Anime Combat)',
    passiveDesc: '• Anime Blood Art: Wujud & serangan Kagero hadir dalam gaya Anime cel-shaded (tebasan sabit tinta hitam-merah, jarum Higanbana, & Blood Mark). • Blood Stacks (maks 15): Tiap serangan & skill memberi +1 stack (+1.8% ATK, +1.2% ASPD, +0.6% Lifesteal/stack) serta menanamkan Blood Mark (maks 5) yang memicu pendarahan berkelanjutan. • 3rd-Hit Crimson Lotus: Serangan ke-3 menebas AoE 85% ATK True DMG, meledakkan Blood Mark, memulihkan 4% Max HP, & menembakkan 3 Jarum Darah Higanbana!',
    bossCategory: 'Assassin',
    skills: [
      {
        id: 'kg_s1',
        name: 'Blood Art I: Iaido Crimson Flash',
        cd: 4.5,
        desc: 'Melesat secepat kilat menembus jalur musuh 260px dengan bayangan anime merah-hitam (175% ATK Physical) + menanamkan +2 Blood Mark, lalu memicu ledakan tebasan tertunda 0.22s (75% ATK True DMG) & memulihkan 6% Max HP!',
        icon: 'Sword',
        type: 'attack',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'kg_s2',
        name: 'Blood Art II: Higanbana Rain',
        cd: 6.5,
        desc: 'Memanggil hujan 12 Bilah & Jarum Darah Higanbana anime yang menghujam musuh dalam 260px (115% ATK per bilah, dapat Crit), memperlambat musuh 45% (2.5s), & meledakkan Blood Mark aktif (+40% ATK True DMG per stack)!',
        icon: 'Sparkles',
        type: 'aoe',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'kg_s3',
        name: 'Blood Art III: Sanguine Feast',
        cd: 8.5,
        desc: 'Menghisap esensi darah musuh radius 240px (140% ATK True DMG AoE), memulihkan 16% Max HP seketika, menciptakan Blood Aegis Shield (+22% Max HP), memberi Blood Ward (-28% DMG diterima 4.0s), & +6 Blood Stack!',
        icon: 'Heart',
        type: 'buff',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'kg_s4',
        name: 'Blood Art IV: Vermilion Lily Domain',
        cd: 13.0,
        desc: 'Membuka Lingkaran Sihir Higanbana anime (280px selama 5.0s): Menarik musuh ke pusat, memberi pendarahan berat tiap 0.4s (75% ATK True DMG, dapat Crit), menyedot 2% Max HP per tick, & memberi +35% ATK serta +30% ASPD di dalamnya!',
        icon: 'CircleDot',
        type: 'control',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'kg_s5',
        name: 'Forbidden Art: Crimson Moon Eclipse',
        cd: 22.0,
        desc: 'Skill Unik Cutscene Anime 2D: Membangkitkan Bulan Darah penuh! Menebas seluruh arena 390px dengan tebasan sakuga raksasa (290% ATK Physical + 190% True DMG, Stun 2.0s, -35% DEF, eksekusi non-Boss HP < 18%), memulihkan 22% Max HP, & memasuki Crimson Moon Form 9.5s (+50% ATK, +40% ASPD, +25% Crit, +18% Lifesteal, -28% DMG diterima, serangan dasar melepaskan Sabit Darah Ganda)!',
        icon: 'Crown',
        type: 'ultimate',
        level: 1,
        maxLevel: 5,
        isUnique: true
      }
    ]
  },
  architect: {
    key: 'architect',
    name: 'ARCHITECT',
    subtitle: 'Autonomous Self-Coding & Skill Synthesizer',
    color: '#2dd4bf',
    secondaryColor: '#f59e0b',
    hp: 750,
    atk: 52,
    atkSpeed: 1.38,
    critChance: 0.20,
    critDmg: 1.85,
    range: 255,
    speed: 205,
    defense: 16,
    lore: 'Entitas arsitek otonom yang menulis, merakit, dan memperbarui kode serangan serta jurus tempurnya sendiri secara otomatis mengikuti situasi pertempuran—tanpa perlu diatur oleh pemain sama sekali.',
    passiveName: 'Auto-Coder Matrix (Self-Evolving Code)',
    passiveDesc: '• Koding Otonom: Architect otomatis menulis kode Serangan Dasar baru setiap 6 serangan atau 5.5 detik menyesuaikan jumlah musuh/Boss, serta meracik ulang kode Skill 1–4 secara mandiri tiap selesai dipakai! • Logic Nodes (maks 15): Tiap serangan & skill memberi +1 node (+1.8% ATK, +1.4% ASPD, +0.6% Crit/node). • Auto-Routine Echo: Serangan dasar ke-4 memicu gema +45% True DMG. • Firewall Protocol: Saat diserang (CD 10s), otomatis memunculkan Aegis Shield +14% Max HP & -20% DMG diterima selama 3.0 detik!',
    bossCategory: 'Manipulation',
    skills: buildArchitectSkillsFromLoadout(DEFAULT_ARCHITECT_LOADOUT)
  }
};

export const ATTRIBUTE_POOL: AttributeDefinition[] = [
  {
    id: 's_hp',
    title: 'Titan Health',
    desc: '+220 Max HP & pulihkan 160 HP secara instan.',
    category: 'defense',
    rarity: 'common',
    icon: 'Heart',
    stackable: true
  },
  {
    id: 's_atk',
    title: 'Physical Destruction',
    desc: '+26 Base Physical Damage ke seluruh serangan & skill.',
    category: 'offense',
    rarity: 'common',
    icon: 'Sword',
    stackable: true
  },
  {
    id: 's_crit',
    title: 'Critical Precision',
    desc: '+14% Critical Chance & +40% Critical Strike Damage.',
    category: 'offense',
    rarity: 'rare',
    icon: 'Target',
    stackable: true
  },
  {
    id: 's_speed',
    title: 'Swiftness Aura',
    desc: '+38 Movement Speed & +20% Attack Speed.',
    category: 'utility',
    rarity: 'common',
    icon: 'Footprints',
    stackable: true
  },
  {
    id: 'attr_monkey_wpn',
    title: 'Monkey Staff Resonance',
    desc: '+12% ASPD pasif. Setiap 2 hit berturut memberi +80% ASPD selama 2.5 detik.',
    category: 'unique',
    rarity: 'epic',
    icon: 'Wand2',
    recommendedHeroes: ['monkey']
  },
  {
    id: 'attr_varp_scythe',
    title: 'Varp Death Scythe',
    desc: 'Setiap hit memberikan +5% Attack Speed yang dapat di-stack hingga 20 kali (Total +100% ASPD).',
    category: 'offense',
    rarity: 'epic',
    icon: 'Activity'
  },
  {
    id: 'attr_burst_crit',
    title: 'Burst True Crit',
    desc: 'Serangan Critical memicu ledakan 5% True Damage dari Max HP target (maks 380 vs Boss, CD 0.35s per target).',
    category: 'offense',
    rarity: 'rare',
    icon: 'Zap'
  },
  {
    id: 'attr_fallen_wings',
    title: 'Fallen Angel Wings',
    desc: 'Ketika HP berada di bawah 25%: Dmg masuk berkurang 45% dan peroleh +40% Lifesteal.',
    category: 'defense',
    rarity: 'legendary',
    icon: 'Feather'
  },
  {
    id: 'attr_magic_destro',
    title: 'Magic Destruction Core',
    desc: 'Menambahkan bonus 45 + 45% ATK Magic Damage ekstra pada semua serangan dasar.',
    category: 'offense',
    rarity: 'rare',
    icon: 'Sparkles'
  },
  {
    id: 'attr_war_armor',
    title: 'War God Armor',
    desc: '+16% CDR & +2 Defense permanen setiap kali menerima hit (Maksimal bonus Def: 80).',
    category: 'defense',
    rarity: 'epic',
    icon: 'ShieldCheck'
  },
  {
    id: 'attr_soul_magnet',
    title: 'Cosmic Soul Magnet',
    desc: 'Meningkatkan jangkauan penyerapan Exp Gem sebesar +180% dan bonus +35% EXP.',
    category: 'utility',
    rarity: 'common',
    icon: 'Magnet',
    stackable: true
  },
  {
    id: 'attr_overcharge',
    title: 'Overcharge Conduit',
    desc: 'Setiap 3.0 detik melepaskan rantai petir otomatis ke 4 musuh terdekat berdamage 120 + 95% ATK (Clone: 55%).',
    category: 'offense',
    rarity: 'rare',
    icon: 'Cpu'
  },
  {
    id: 'attr_vampiric_embrace',
    title: 'Bloodthirsty Fang',
    desc: '+16% Lifesteal permanen dan setiap kali membunuh musuh memulihkan 35 HP seketika.',
    category: 'defense',
    rarity: 'rare',
    icon: 'Heart'
  },
  {
    id: 'attr_shield_aegis',
    title: 'Titan Aegis Barrier',
    desc: 'Mendapatkan perisai energi penyerap damage sebesar 420 HP setiap 10 detik. Selama perisai aktif, kebal stun.',
    category: 'defense',
    rarity: 'legendary',
    icon: 'Shield'
  },
  {
    id: 'attr_chain_lightning',
    title: 'Thunder God Orb',
    desc: 'Serangan dasar memiliki peluang 35% memicu petir berantai ke 4 musuh dengan 150% ATK damage.',
    category: 'offense',
    rarity: 'epic',
    icon: 'Zap'
  },
  {
    id: 'attr_singularity_core',
    title: 'Cosmic Singularity Core',
    desc: 'Setiap 6 detik memanggil lubang hitam gravitasi mini yang menyedot dan memperlambat musuh di sekitar.',
    category: 'utility',
    rarity: 'epic',
    icon: 'Sparkles'
  },
  {
    id: 'attr_executioner_blade',
    title: 'Executioner Guillotine',
    desc: '+40% ekstra damage pada musuh dengan HP < 50%, dan mengeksekusi instan monster non-boss ber-HP < 15%.',
    category: 'offense',
    rarity: 'rare',
    icon: 'Sword'
  },
  {
    id: 'attr_chronos_hourglass',
    title: 'Chrono Temporal Hourglass',
    desc: '+22% Cooldown Reduction (CDR) dan +35 Movement Speed permanen.',
    category: 'utility',
    rarity: 'epic',
    icon: 'Hourglass'
  },
  {
    id: 'attr_berserker_blood',
    title: 'Berserker Fury Blood',
    desc: 'Setiap 10% HP yang hilang memberikan +8% Attack Damage dan +6% Attack Speed.',
    category: 'offense',
    rarity: 'epic',
    icon: 'Flame'
  },
  {
    id: 'attr_toxic_spores',
    title: 'Abyssal Venom Flask',
    desc: 'Serangan memberikan racun selama 4 detik (65 damage/detik) dan mengurangi 20% Defense musuh saat beracun.',
    category: 'offense',
    rarity: 'rare',
    icon: 'Skull'
  },
  // --- NEW RELIC ATTRIBUTES ---
  {
    id: 'attr_iron_fortress',
    title: 'Adamantite Plate',
    desc: '+18 Defense & +160 Max HP permanen untuk ketahanan garis depan.',
    category: 'defense',
    rarity: 'common',
    icon: 'Shield',
    stackable: true
  },
  {
    id: 'attr_sniper_scope',
    title: 'Eagle Horizon Lens',
    desc: '+75 Attack Range & +14% Critical Chance secara permanen.',
    category: 'offense',
    rarity: 'rare',
    icon: 'Crosshair',
    stackable: true
  },
  {
    id: 'attr_blood_crescent',
    title: 'Blood Moon Crescent',
    desc: '+28 Attack Damage & +30% Critical Damage. Setiap Critical memulihkan 2.5% Max HP.',
    category: 'offense',
    rarity: 'rare',
    icon: 'Moon',
    stackable: true
  },
  {
    id: 'attr_wind_dancer',
    title: 'Tempest Gale Boots',
    desc: '+48 Movement Speed, +24% Attack Speed, & +10% Evasion permanen.',
    category: 'utility',
    rarity: 'rare',
    icon: 'Wind',
    stackable: true
  },
  {
    id: 'attr_quantum_prism',
    title: 'Quantum Chaos Prism',
    desc: '+35 ATK, +30% ASPD, +16% Crit Chance, +45% Crit Damage, & +15% CDR sekaligus!',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Gem'
  },
  {
    id: 'attr_phoenix_ember',
    title: 'Phoenix Ash Ember',
    desc: 'Setiap 5 detik memicu ledakan api (180% ATK AoE) & bangkit 1x saat mati dengan 55% HP + kebal 2.5 detik.',
    category: 'defense',
    rarity: 'legendary',
    icon: 'Flame'
  },
  {
    id: 'attr_frost_orb',
    title: 'Glacial Frost Orb',
    desc: 'Serangan dasar & Clone berpeluang 30% membekukan musuh 1.2 detik serta memicu ledakan es 80% ATK.',
    category: 'offense',
    rarity: 'rare',
    icon: 'Snowflake'
  },
  {
    id: 'attr_sunfire_cape',
    title: 'Solar Flare Mantle',
    desc: 'Membakar musuh dalam radius 150px setiap detik dengan True Damage sebesar 45 + 3% Max HP pemain.',
    category: 'offense',
    rarity: 'epic',
    icon: 'Sun'
  },
  {
    id: 'attr_giant_slayer',
    title: 'Titan Giant Slayer',
    desc: '+35% damage bonus terhadap Boss dan musuh yang memiliki Max HP lebih tinggi dari pahlawan.',
    category: 'offense',
    rarity: 'epic',
    icon: 'Sword'
  },
  {
    id: 'attr_crimson_meteor',
    title: 'Crimson Meteorite',
    desc: 'Setiap 7 detik menjatuhkan meteor raksasa ke musuh terdekat (320% ATK AoE Damage & stun 1.5 detik).',
    category: 'offense',
    rarity: 'legendary',
    icon: 'Flame'
  },
  {
    id: 'attr_echo_blade',
    title: 'Phantom Echo Blade',
    desc: 'Serangan dasar & Clone berpeluang 30% memicu serangan ganda instan (Double Strike) 65% damage.',
    category: 'offense',
    rarity: 'epic',
    icon: 'Swords'
  },
  {
    id: 'attr_void_piercer',
    title: 'Void Armor Piercer',
    desc: 'Menambahkan 22% bonus True Damage murni pada setiap serangan dasar dan Clone yang menembus Defense.',
    category: 'offense',
    rarity: 'epic',
    icon: 'Zap'
  },
  {
    id: 'attr_thornmail',
    title: 'Spiked Obsidian Armor',
    desc: '+22 Defense permanen & memantulkan 50% damage yang diterima ke musuh terdekat sebagai True Damage.',
    category: 'defense',
    rarity: 'rare',
    icon: 'ShieldAlert'
  },
  {
    id: 'attr_phantom_cloak',
    title: 'Shadow Phantom Cloak',
    desc: '+20% Evasion (peluang menghindar serangan) & +30 Movement Speed permanen.',
    category: 'defense',
    rarity: 'rare',
    icon: 'Ghost'
  },
  {
    id: 'attr_jade_vitality',
    title: 'Emerald Jade Heart',
    desc: '+320 Max HP & regenerasi pasif 2.2% Max HP setiap detik secara terus-menerus.',
    category: 'defense',
    rarity: 'epic',
    icon: 'Heart'
  },
  {
    id: 'attr_divine_sanctuary',
    title: 'Divine Sanctuary Halo',
    desc: 'Setiap 14 detik memancarkan aura suci yang memulihkan 18% Max HP & mendorong mundur seluruh musuh.',
    category: 'defense',
    rarity: 'legendary',
    icon: 'Sparkles'
  },
  {
    id: 'attr_guardian_spirit',
    title: 'Sacred Guardian Spirit',
    desc: 'Mengurangi seluruh damage yang diterima pahlawan sebesar 20% secara permanen.',
    category: 'defense',
    rarity: 'epic',
    icon: 'ShieldCheck'
  },
  {
    id: 'attr_arcane_battery',
    title: 'Arcane Mana Dynamo',
    desc: '+22% Cooldown Reduction (CDR) & setiap mengaktifkan Skill memulihkan 6% Max HP.',
    category: 'utility',
    rarity: 'rare',
    icon: 'BatteryCharging'
  },
  {
    id: 'attr_golden_crown',
    title: 'Scholar Wisdom Crown',
    desc: '+45% bonus EXP dari setiap EXP Gem yang diambil & +100 Jangkauan Magnet.',
    category: 'utility',
    rarity: 'rare',
    icon: 'Crown'
  },
  {
    id: 'attr_soul_harvester',
    title: 'Grim Soul Harvester',
    desc: 'Setiap 10 musuh yang dikalahkan memberikan +5 Base Attack Damage & +20 Max HP permanen (tanpa batas!).',
    category: 'unique',
    rarity: 'epic',
    icon: 'Skull'
  },
  {
    id: 'attr_nova_pulse',
    title: 'Astral Shockwave Core',
    desc: 'Setiap kali melancarkan Skill, memicu gelombang Astral (radius 180px) berdamage 160% ATK.',
    category: 'unique',
    rarity: 'epic',
    icon: 'Sparkles'
  },
  {
    id: 'attr_clone_overlord',
    title: 'Illusion Sovereign Sigil',
    desc: '+30% ATK, +25% ASPD, +15% Lifesteal untuk pahlawan, serta +35% Damage ekstra untuk seluruh Clone!',
    category: 'unique',
    rarity: 'epic',
    icon: 'Crown'
  },
  // --- UNIQUE & TACTICAL RELIC EXPANSION ---
  {
    id: 'attr_blood_pact',
    title: 'Crimson Blood Pact',
    desc: 'Setiap serangan dasar ke-5 mengorbankan 3% HP saat ini untuk melepaskan Blood Rend: 220% ATK + 6% Max HP target (3% vs Boss) sebagai True Damage & heal 6% Max HP!',
    category: 'unique',
    rarity: 'epic',
    icon: 'Flame'
  },
  {
    id: 'attr_mirror_ward',
    title: 'Astral Mirror Barrier',
    desc: 'Setiap 10 detik mendapat perisai cermin yang memblokir 100% damage serangan berikutnya dan memantulkan 300% ATK ke penyerang.',
    category: 'defense',
    rarity: 'legendary',
    icon: 'Shield'
  },
  {
    id: 'attr_chrono_anchor',
    title: 'Temporal Chrono Engine',
    desc: 'Setiap 8 detik memicu Time Pulse: memotong sisa cooldown semua Skill sebesar 1.5 detik & memberi +35% Speed + 25% ASPD selama 3 detik.',
    category: 'utility',
    rarity: 'epic',
    icon: 'Hourglass'
  },
  {
    id: 'attr_abyssal_mark',
    title: 'Abyssal Shatter Mark',
    desc: 'Serangan dasar & Clone menumpuk Abyssal Mark (maks 5). Pada stack ke-5, tanda meledak 300% ATK AoE True Damage & meremukkan 20% Defense target.',
    category: 'offense',
    rarity: 'epic',
    icon: 'Crosshair'
  },
  {
    id: 'attr_celestial_orbit',
    title: 'Celestial Star Orbs',
    desc: 'Memanggil 3 Bola Bintang berputar di sekitar pahlawan (dan 2 di tiap Clone) yang menabrak musuh sebesar 110% ATK menembus armor!',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Sparkles'
  },
  {
    id: 'attr_berserk_totem',
    title: 'Warlord Frenzy Banner',
    desc: 'Setiap musuh yang mati di sekitar menambah 1 stack Bloodlust (maks 20 stack selama 8 detik): +2.5% ASPD & +3 ATK per stack.',
    category: 'offense',
    rarity: 'rare',
    icon: 'Swords',
    stackable: true
  },
  {
    id: 'attr_frostbite_aura',
    title: 'Permafrost Blizzard Heart',
    desc: 'Aura es permanen radius 190px memperlambat musuh 30% (15% Boss), memicu Cryo Burst 120% ATK tiap 2.5 detik, dan membuat musuh menerima +18% damage!',
    category: 'defense',
    rarity: 'epic',
    icon: 'Snowflake'
  },
  {
    id: 'attr_ricochet_glaive',
    title: 'Storm Ricochet Glaive',
    desc: 'Setiap serangan dasar ke-3 (termasuk Clone & Ranged) melempar Bumerang Energi yang memantul ke 4 musuh beruntun berdamage 135% ATK.',
    category: 'offense',
    rarity: 'epic',
    icon: 'Zap'
  },
  {
    id: 'attr_titan_heart',
    title: 'Colossus Titan Heart',
    desc: '+420 Max HP & +25 Defense permanen, serta mengonversi 6% Max HP pahlawan menjadi bonus Attack Damage tambahan!',
    category: 'defense',
    rarity: 'legendary',
    icon: 'Heart'
  },
  {
    id: 'attr_doom_scythe',
    title: 'Reaper Harvest Moon',
    desc: '+25% Crit Chance & +50% Crit Damage. Setiap Critical terhadap Boss memicu True Strike sebesar 2.5% Max HP Boss (maks 450/hit, CD 1.5s).',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Moon'
  },
  // --- ANTI-TANK TACTICAL RELICS ---
  {
    id: 'attr_shield_breaker',
    title: 'Aegis Shatter Fang',
    desc: 'Serangan Hero & Clone menghasilkan +150% Damage terhadap Barrier/Shield musuh (2.5x). Saat Barrier pecah, meledak 12% Max HP musuh (maks 1.200) sebagai True Damage & Stun 1.2 detik!',
    category: 'offense',
    rarity: 'epic',
    icon: 'ShieldAlert'
  },
  {
    id: 'attr_armor_sunder',
    title: 'Titan Sundering Cleaver',
    desc: 'Serangan Hero & Clone merobek Defense musuh -8% per stack (maks 6 stack = -48% DEF selama 5 detik), menembus 50% Iron Plating Tank Boss, serta memberi +30% Damage ke musuh tipe Tank!',
    category: 'offense',
    rarity: 'epic',
    icon: 'Sword'
  },
  {
    id: 'attr_anti_regen',
    title: 'Cursed Blight Brand',
    desc: 'Serangan Hero & Clone mengutuk musuh 5 detik: memangkas 65% semua Healing & Regenerasi Tank, membakar 2.5% Max HP/dtk (maks 350/dtk), dan setiap serangan dasar ke-4 meledak +4% Max HP (maks 500) True Damage!',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Skull'
  },
  // --- HERO-SYNERGY ATTRIBUTE RELICS (TRAVELER, VALKYRIE, DIMENSION JUDGE, RIFT WALKER) ---
  {
    id: 'attr_chrono_pendulum',
    title: 'Chronos Stance Pendulum',
    desc: '+12% CDR & +15% Attack Speed. Bonus ATK semua Stance Traveler +10%. Saat berganti Stance atau tiap serangan ke-4 memicu Chrono Paradox Pulse (95% ATK True Damage AoE & -0.4s sisa cooldown Skill).',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Hourglass',
    recommendedHeroes: ['traveler']
  },
  {
    id: 'attr_temporal_compass',
    title: 'Aether Temporal Compass',
    desc: '+20 ATK & +8% Lifesteal. Setiap menggunakan Skill memicu Time Echo (+22% Attack Speed selama 3 detik) dan serangan di dalam Chrono Field atau Time Stop memberi +15% True Damage.',
    category: 'utility',
    rarity: 'epic',
    icon: 'Zap',
    recommendedHeroes: ['traveler']
  },
  {
    id: 'attr_permafrost_crown',
    title: 'Glacial Sovereign Crown',
    desc: '+24 Defense & +280 Max HP. Menguatkan Frost Armor Valkyrie menjadi -28% DMG diterima & Permafrost Ward menjadi -16% DMG diterima (hero lain: -15% DMG diterima permanen). Serangan ke musuh Slow atau Stun menghasilkan +30% Cryo Damage!',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Snowflake',
    recommendedHeroes: ['valkyrie']
  },
  {
    id: 'attr_cryo_bastion',
    title: 'Frostbite Lance Core',
    desc: '+30 ATK & +20% Attack Speed. Saat memicu Freeze/Deep Freeze atau menerima hit ketika Shield atau Damage Reduction Ward aktif (CD 1.0s), menembakkan 6 Tombak Es ke sekeliling berdamage 115% ATK & memperlambat musuh 2 detik.',
    category: 'offense',
    rarity: 'epic',
    icon: 'Gem',
    recommendedHeroes: ['valkyrie']
  },
  {
    id: 'attr_reality_edict',
    title: 'Arbiter Reality Edict',
    desc: '+32 ATK & +18% CDR. Memperluas radius Zona Dimensi & Gravitasi +35%, durasi Zona +2 detik, serta Aura Gravitasi meledakkan pulsa 110% ATK True Damage setiap 0.8 detik!',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Sparkles',
    recommendedHeroes: ['dimension_judge']
  },
  {
    id: 'attr_singularity_prism',
    title: 'Void Singularity Tether',
    desc: '+28 ATK, +20% Crit Damage & +25 Movement Speed. Musuh di dalam Zona Dimensi atau radius 220px menerima +22% Damage lebih besar, dan setiap 2 Skill memanggil Mini Spatial Collapse!',
    category: 'offense',
    rarity: 'epic',
    icon: 'Cpu',
    recommendedHeroes: ['dimension_judge']
  },
  {
    id: 'attr_quantum_echo',
    title: 'Quantum Rift Shadow Core',
    desc: '+18% Crit Chance, +40% Crit Damage & +10% Evasion. Syarat Quantum Blink berkurang menjadi 3 hit (hero lain: tiap 5 hit), dan setiap Blink/Teleport memicu Rift Shock Slash (165% ATK True Damage AoE) + memperpanjang Warp Buff.',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Zap',
    recommendedHeroes: ['rift_walker']
  },
  {
    id: 'attr_void_assassin_seal',
    title: 'Phantom Phase Seal',
    desc: '+25% Attack Speed, +35 Movement Speed & +15% Evasion. Selama 2.5 detik setelah Blink, Teleport, atau Dodge, memperoleh +20% Crit Chance, +35% Crit Damage & serangan memulihkan 3% Max HP.',
    category: 'offense',
    rarity: 'epic',
    icon: 'Swords',
    recommendedHeroes: ['rift_walker']
  },
  // --- 20 NEW ATTRIBUTE RELICS ---
  {
    id: 'attr_solar_core',
    title: 'Solar Flare Core',
    desc: '+35 ATK & +15% Crit Chance. Batas Solar Heat naik ke 30 stack (hero lain: tiap 3 serangan meledak 35% ATK Solar Burn AoE) & semua ledakan Solar +40% Damage!',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Sun',
    recommendedHeroes: ['solaris']
  },
  {
    id: 'attr_ember_greaves',
    title: 'Blazing Ember Greaves',
    desc: '+45 Movement Speed, +22% Attack Speed & +15% CDR. Meninggalkan jejak api 65% ATK saat bergerak & tiap Skill memulihkan 5% Max HP + cincin api 120% ATK!',
    category: 'utility',
    rarity: 'epic',
    icon: 'Flame',
    recommendedHeroes: ['solaris']
  },
  {
    id: 'attr_crimson_vortex',
    title: 'Crimson Vortex Fang',
    desc: '+28 ATK & +10% Lifesteal. Setiap 6 serangan dasar melepaskan tebasan pusaran darah 180% ATK AoE di sekitar target.',
    category: 'offense',
    rarity: 'rare',
    icon: 'Swords'
  },
  {
    id: 'attr_obsidian_heart',
    title: 'Obsidian Bulwark Heart',
    desc: '+320 Max HP & +28 Defense permanen. Mengurangi seluruh damage yang diterima dari Boss sebesar 12%.',
    category: 'defense',
    rarity: 'epic',
    icon: 'Shield'
  },
  {
    id: 'attr_storm_quiver',
    title: 'Tempest Volt Quiver',
    desc: '+25% Attack Speed & +60 Attack Range. Setiap serangan dasar ikut menembakkan panah petir tambahan (55% ATK) ke musuh terdekat.',
    category: 'offense',
    rarity: 'epic',
    icon: 'Zap'
  },
  {
    id: 'attr_astral_hourglass',
    title: 'Astral Echo Hourglass',
    desc: '+18% Cooldown Reduction (CDR) & +20 Movement Speed. Setiap musuh yang dikalahkan memangkas sisa cooldown semua Skill sebesar 0.25 detik.',
    category: 'utility',
    rarity: 'rare',
    icon: 'Hourglass'
  },
  {
    id: 'attr_reaper_grasp',
    title: 'Soul Reaper Grasp',
    desc: '+32 ATK & +35% Critical Damage. Setiap musuh yang mati meledakkan ledakan jiwa 110% ATK AoE ke musuh di sekitarnya.',
    category: 'offense',
    rarity: 'epic',
    icon: 'Skull'
  },
  {
    id: 'attr_radiant_aegis',
    title: 'Radiant Sun Aegis',
    desc: '+20 Defense & +200 Max HP. Setiap 12 detik memberi Radiant Shield 260 HP dan men-stun musuh sekitar selama 0.8 detik.',
    category: 'defense',
    rarity: 'rare',
    icon: 'ShieldCheck'
  },
  {
    id: 'attr_venom_fang',
    title: 'Viper Neurotoxin Blade',
    desc: '+18 ATK & +12% Attack Speed. Serangan menyuntikkan neurotoksin (+35 True Damage/detik selama 3 detik, dapat di-stack).',
    category: 'offense',
    rarity: 'common',
    icon: 'Sword',
    stackable: true
  },
  {
    id: 'attr_celestial_feather',
    title: 'Seraphim Wing Feather',
    desc: '+30 Movement Speed, +8% Evasion & +90 Jangkauan Magnet EXP secara permanen.',
    category: 'utility',
    rarity: 'common',
    icon: 'Feather',
    stackable: true
  },
  {
    id: 'attr_iron_will',
    title: 'Unbreakable Iron Will',
    desc: '+15 Defense & +150 Max HP permanen. Saat HP di bawah 50%, mendapat bonus +16 Defense tambahan.',
    category: 'defense',
    rarity: 'common',
    icon: 'Shield',
    stackable: true
  },
  {
    id: 'attr_void_lens',
    title: 'Abyssal Rift Lens',
    desc: '+14% Critical Chance & +40% Critical Damage. Setiap serangan Critical memulihkan 20 HP secara instan.',
    category: 'offense',
    rarity: 'rare',
    icon: 'Crosshair'
  },
  {
    id: 'attr_thunder_crown',
    title: 'Stormcaller Crown',
    desc: '+40 ATK & +25% Critical Chance. Setiap 4.5 detik memanggil 3 petir langit menyambar musuh terdekat (185% ATK True Damage & stun 0.8 detik).',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Crown'
  },
  {
    id: 'attr_blood_chalice',
    title: 'Eternal Blood Chalice',
    desc: '+18% Lifesteal & +240 Max HP. Kelebihan heal (Overheal) otomatis diubah menjadi Shield pelindung hingga 350 HP!',
    category: 'defense',
    rarity: 'epic',
    icon: 'Heart'
  },
  {
    id: 'attr_arcane_catalyst',
    title: 'Arcane Catalyst Rune',
    desc: '+20% Cooldown Reduction & +38 ATK. Setiap kali melancarkan Skill, ATK meningkat +20% selama 3.5 detik!',
    category: 'offense',
    rarity: 'epic',
    icon: 'Sparkles'
  },
  {
    id: 'attr_frost_prism',
    title: 'Glacial Mirror Prism',
    desc: '+22 Defense & +12% Evasion. Musuh yang menyerang pahlawan terkena Frostbite (-30% Speed 2.5s) dan balasan 85% ATK Ice Counter!',
    category: 'defense',
    rarity: 'epic',
    icon: 'Snowflake'
  },
  {
    id: 'attr_gravity_anchor',
    title: 'Singularity Mass Anchor',
    desc: '+180 Max HP & +25 ATK. Setiap 5 detik menarik musuh dalam radius 240px ke pusat gravitasi dan memperlambat mereka 1.5 detik.',
    category: 'utility',
    rarity: 'rare',
    icon: 'CircleDot'
  },
  {
    id: 'attr_berserk_claw',
    title: 'Savage Frenzy Claw',
    desc: '+22 ATK & +16% Attack Speed. Membunuh Boss atau tiap 15 kill memberi Frenzy +10% ASPD selama 5 detik.',
    category: 'offense',
    rarity: 'rare',
    icon: 'Activity',
    stackable: true
  },
  {
    id: 'attr_mystic_orb',
    title: 'Infinite Mana Orb',
    desc: '+15% CDR, +25% EXP Gain & +150 Max HP. Setiap kali Level Up, memulihkan 100% HP dan mereset seluruh Cooldown Skill!',
    category: 'utility',
    rarity: 'epic',
    icon: 'BatteryCharging'
  },
  {
    id: 'attr_omega_annihilator',
    title: 'Omega Star Annihilator',
    desc: '+42 ATK, +30% Critical Damage & +18% Attack Speed. Setiap serangan dasar ke-8 memicu Omega Starburst (250% AoE True Damage & stun 1.0 detik)!',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Gem'
  },
  // --- HERO-SYNERGY ATTRIBUTE RELICS (FALLEN ANGEL & DEMON RAISED) ---
  {
    id: 'attr_eclipse_halo',
    title: 'Obsidian Seraph Halo',
    desc: '+34 ATK, +14% Evasion & +15% Lifesteal. Batas Fallen Feathers naik menjadi 20 stack (hero lain: +25% Crit Damage), dan setiap Skill memancarkan 6 Bulu Penghakiman (95% ATK True Damage)!',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Crown',
    recommendedHeroes: ['fallen_angel']
  },
  {
    id: 'attr_abyssal_pinion',
    title: 'Ash-Stained Pinion',
    desc: '+24% Attack Speed, +35 Movement Speed & +15% Crit Chance. Saat HP < 60% atau saat berhasil Dodge, memanggil Pilar Petir Gerhana (145% ATK True Damage AoE, CD 1.0s).',
    category: 'offense',
    rarity: 'epic',
    icon: 'Sparkles',
    recommendedHeroes: ['fallen_angel']
  },
  {
    id: 'attr_hellfire_crown',
    title: 'Crown of the Risen Fiend',
    desc: '+38 ATK, +280 Max HP & +12% Lifesteal. Batas Hellfire Essence naik menjadi 40 stack (hero lain: setiap 4 serangan memicu Hellfire Eruption 125% ATK True Damage) & damage Api Neraka +35%!',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Flame',
    recommendedHeroes: ['demon_raised']
  },
  {
    id: 'attr_infernal_shackles',
    title: 'Abyssal Pact Chains',
    desc: '+24 Defense, +20% Attack Speed & +20% Crit Damage. Mengurangi damage diterima saat HP < 65% sebesar 18% & setiap melancarkan Skill memicu ledakan Rantai Darah (145% ATK + stun 0.8s)!',
    category: 'defense',
    rarity: 'epic',
    icon: 'Shield',
    recommendedHeroes: ['demon_raised']
  },
  // --- HERO-SYNERGY ATTRIBUTE RELICS (ARCANA) ---
  {
    id: 'attr_crimson_deck',
    title: 'Sovereign Ace Deck',
    desc: '+30 ATK, +15% Crit Chance & +25% Crit Damage. Setiap Poker Combo milik Arcana menembakkan +2 Kartu Ace bonus (hero lain: tiap 5 serangan menembakkan Kartu Takdir 75% ATK)!',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Crown',
    recommendedHeroes: ['arcana']
  },
  {
    id: 'attr_loaded_gambler',
    title: 'Loaded Fate Charm',
    desc: '+20% Cooldown Reduction, +14% Evasion & +24 Movement Speed. Setiap melancarkan Skill memberi +10% Crit Chance & +15% Attack Speed selama 3.0 detik!',
    category: 'utility',
    rarity: 'epic',
    icon: 'Sparkles',
    recommendedHeroes: ['arcana']
  },
  // --- HERO-SYNERGY ATTRIBUTE RELICS (MORPHOS) ---
  {
    id: 'attr_chimera_helix',
    title: 'Chimera Evolution Helix',
    desc: '+30 ATK & +16% Attack Speed. Batas Evolution Stack Morphos naik menjadi 10 & tiap ganti Wujud memangkas CD skill lain -0.8 detik (hero lain: tiap 5 serangan memicu gelombang 85% ATK True DMG & heal 2% HP)!',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Sparkles',
    recommendedHeroes: ['morphos']
  },
  {
    id: 'attr_primal_instinct',
    title: 'Primal Shapeshifter Core',
    desc: '+220 Max HP, +18 Defense & +25 Movement Speed. Mendapat +14% Lifesteal serta -16% Damage diterima saat HP < 55% atau selama 4 detik setelah bertransformasi!',
    category: 'defense',
    rarity: 'epic',
    icon: 'ShieldCheck',
    recommendedHeroes: ['morphos']
  },
  // --- HERO-SYNERGY ATTRIBUTE RELICS (LUMINA) ---
  {
    id: 'attr_mirror_halo',
    title: 'Prismatic Mirror Crown',
    desc: '+24 ATK, +14% Attack Speed & +12% Crit Chance. Batas Radiant Charge Lumina naik ke 12 stack (hero lain: tiap 4 serangan memantulkan Sinar Cermin 65% ATK ke 2 musuh) & semua pantulan Cahaya/Cermin +20% Damage!',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Crown',
    recommendedHeroes: ['lumina']
  },
  {
    id: 'attr_radiant_prism',
    title: 'Radiant Glass Shield',
    desc: '+180 Max HP, +14 Defense & +14% CDR. Memperkuat pertahanan dengan Shield Cermin 10% Max HP tiap 9 detik & setiap melancarkan Skill memancarkan Kilatan Cahaya (80% ATK AoE + Slow 1.0s)!',
    category: 'defense',
    rarity: 'epic',
    icon: 'Shield',
    recommendedHeroes: ['lumina']
  },
  // --- HERO-SYNERGY ATTRIBUTE RELICS (AXIOM) ---
  {
    id: 'attr_vector_crown',
    title: 'Sovereign Vector Crown',
    desc: '+28 ATK, +15% Attack Speed & +12% CDR. Batas Manipulation Stack Axiom naik ke 16 & batas musuh terhipnotis bertambah +2 (hero lain: tiap 4 serangan memicu gelombang 90% ATK True DMG & memperlambat musuh 1.5s)!',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Crown',
    recommendedHeroes: ['axiom']
  },
  {
    id: 'attr_psionic_cube',
    title: 'Tesseract Reality Core',
    desc: '+200 Max HP, +16 Defense & +14% Crit Chance. Mempercepat cooldown Vector Deflection -2 detik & setiap Skill memulihkan 4% Max HP + menembakkan 3 Proyektil Prisma pelacak!',
    category: 'defense',
    rarity: 'epic',
    icon: 'ShieldCheck',
    recommendedHeroes: ['axiom']
  },
  // --- HERO-SYNERGY ATTRIBUTE RELICS (KAGERO) ---
  {
    id: 'attr_crimson_scabbard',
    title: 'Akatsuki Blood Scabbard',
    desc: '+30 ATK, +16% Lifesteal & +12% Crit Chance. Batas Blood Stack Kagero naik ke 22 & serangan ke-3 meledakkan Blood Mark ganda (hero lain: tiap serangan ke-3 melepaskan Sabit Darah 85% ATK True DMG + memulihkan 2% Max HP)!',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Sword',
    recommendedHeroes: ['kagero']
  },
  {
    id: 'attr_higanbana_mantle',
    title: 'Higanbana Demon Haori',
    desc: '+220 Max HP, +16 Defense & +14% Attack Speed. Saat HP < 55%, memperoleh +20% Lifesteal & setiap mengaktifkan Skill memulihkan 5% Max HP serta meledakkan Kelopak Higanbana (90% ATK True DMG AoE)!',
    category: 'defense',
    rarity: 'epic',
    icon: 'Shield',
    recommendedHeroes: ['kagero']
  },
  // --- HERO-SYNERGY ATTRIBUTE RELICS (ARCHITECT) ---
  {
    id: 'attr_logic_compiler',
    title: 'Genesis Logic Compiler',
    desc: '+32 ATK, +10% CDR & +14% Attack Speed. Batas Logic Nodes Architect naik ke 22 & keluaran kode Serangan/Skill Otonom +25% lebih kuat (hero lain: tiap serangan ke-4 memicu Logic Nova 95% ATK True DMG)!',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Cpu',
    recommendedHeroes: ['architect']
  },
  {
    id: 'attr_blueprint_matrix',
    title: 'Astral Firewall Matrix',
    desc: '+220 Max HP, +18 Defense & +12% Lifesteal. Mempercepat cooldown Firewall Protocol menjadi 6.5 detik & setiap mengaktifkan Skill memulihkan 5% Max HP serta menembakkan 2 Prism Pulse pelacak (75% ATK)!',
    category: 'defense',
    rarity: 'epic',
    icon: 'ShieldCheck',
    recommendedHeroes: ['architect']
  }
];

export const SKILL_UPGRADE_TRAITS: Record<string, { id: string; title: string; desc: string; icon: string }[]> = {
  m_s1: [
    { id: 'm_s1_u1', title: 'Twin Shadow Clones', desc: 'Memanggil 2 clone sekaligus, meningkatkan pewarisan ATK clone dari 40% menjadi 50% (Maksimal) & Stats lainnya dari 50% menjadi 75%, tetap mewarisi 100% Relic Attribute master.', icon: 'Copy' },
    { id: 'm_s1_u2', title: 'Vampiric Clone Aura', desc: 'Lifesteal clone meningkat menjadi 40% heal ke master.', icon: 'Heart' }
  ],
  m_s2: [
    { id: 'm_s2_u1', title: 'Colossus RuYi Expansion', desc: 'Jangkauan dan lebar hantaman tongkat sakti +45%, damage meningkat menjadi 90% ATK.', icon: 'Zap' },
    { id: 'm_s2_u2', title: 'Synchronized Shockwave', desc: 'Hantaman tongkat master dan clone menciptakan gempa sekunder yang meremukkan armor musuh -20%.', icon: 'ShieldAlert' }
  ],
  m_s3: [
    { id: 'm_s3_u1', title: 'Celestial Typhoon', desc: 'Durasi kebal Awan Kinton naik menjadi 1.2 detik dan menarik musuh ke pusaran.', icon: 'Wind' },
    { id: 'm_s3_u2', title: 'Golden Body Vajra', desc: 'Mengurangi 22% damage diterima selama 3.5 detik saat melesat.', icon: 'Shield' }
  ],
  m_s4: [
    { id: 'm_s4_u1', title: 'Cosmic Pillar Cataclysm', desc: 'Gempa pilar langit mencakup seluruh arena & sambaran petir emas bertambah menjadi 8 sambaran.', icon: 'Flame' },
    { id: 'm_s4_u2', title: 'Immortality of Huaguo', desc: 'Mereset durasi hidup semua clone aktif ke maksimal dan memulihkan 25% HP master seketika.', icon: 'Heart' }
  ],
  m_s5: [
    { id: 'm_s5_u1', title: 'Immortal Golden Army', desc: 'Memanggil 4 Clone sekaligus saat Qi Tian Da Sheng aktif & memperpanjang durasi Wujud Great Sage menjadi 12.0 detik!', icon: 'Crown' },
    { id: 'm_s5_u2', title: 'Heaven-Splitting RuYi', desc: 'Radius hantaman pemecah langit meluas ke 460px, True Damage naik +120% ATK, dan Gelombang RuYi saat Great Sage aktif naik menjadi 95% ATK!', icon: 'Sparkles' }
  ],
  d_s1: [
    { id: 'd_s1_u1', title: 'Hyperion Beam Overdrive', desc: 'Lebar laser 2x lipat, eksekusi non-Boss HP < 22%, dan memicu 3 ledakan Void 65% ATK di sepanjang jalur!', icon: 'Eye' },
    { id: 'd_s1_u2', title: 'Rapid Void Discharge', desc: 'Cooldown laser berkurang menjadi 4.2 detik dan tembakan laser dijamin 100% Critical Strike!', icon: 'Zap' }
  ],
  d_s2: [
    { id: 'd_s2_u1', title: 'Eternal Abyssal Veil', desc: 'Durasi Shadow Veil naik menjadi 3.5 detik & mengurangi 20% damage diterima selama Shadow Veil aktif!', icon: 'ShieldCheck' },
    { id: 'd_s2_u2', title: 'Phantom Barrage Waltz', desc: 'Saat Shadow Veil aktif, setiap 0.6 detik otomatis menembakkan 6 Void Darts (45% ATK, bisa Crit) ke musuh sekitar!', icon: 'Activity' }
  ],
  d_s3: [
    { id: 'd_s3_u1', title: 'Abyssal Rupture Chains', desc: 'Cataclysm memberi +120% True Damage ekstra ke Boss dan meremukkan -30% Defense semua musuh!', icon: 'Skull' },
    { id: 'd_s3_u2', title: 'Soul Harvest Overdrive', desc: 'Setiap musuh yang mati akibat Cataclysm memotong cooldown semua skill 0.6 detik (maks 3.0 detik) & memberi +1 FCD (maks +3 FCD)!', icon: 'Hourglass' }
  ],
  d_s3_blackhole: [
    { id: 'd_s3_u1', title: 'Abyssal Rupture Chains', desc: 'Cataclysm memberi +120% True Damage ekstra ke Boss dan meremukkan -30% Defense semua musuh!', icon: 'Skull' },
    { id: 'd_s3_u2', title: 'Soul Harvest Overdrive', desc: 'Setiap musuh yang mati akibat Cataclysm memotong cooldown semua skill 0.6 detik (maks 3.0 detik) & memberi +1 FCD (maks +3 FCD)!', icon: 'Hourglass' }
  ],
  d_s3_nebulas: [
    { id: 'd_s3_u1', title: 'Abyssal Rupture Chains', desc: 'Cataclysm memberi +120% True Damage ekstra ke Boss dan meremukkan -30% Defense semua musuh!', icon: 'Skull' },
    { id: 'd_s3_u2', title: 'Soul Harvest Overdrive', desc: 'Setiap musuh yang mati akibat Cataclysm memotong cooldown semua skill 0.6 detik (maks 3.0 detik) & memberi +1 FCD (maks +3 FCD)!', icon: 'Hourglass' }
  ],
  d_s4: [
    { id: 'd_s4_u1', title: 'Singularity Headshot', desc: 'Radius ledakan Tombak Void meluas ke 380px, memberi +150% ATK Critical Strike tambahan pada target utama & mengeksekusi non-Boss HP < 25%!', icon: 'Crosshair' },
    { id: 'd_s4_u2', title: 'Abyssal Overcharger', desc: 'Ledakan Abyssal Judgement langsung mengisi +4 FCD (+16 Stack) dan memulihkan 15% Max HP Demonis seketika!', icon: 'Sparkles' }
  ],
  t_s1_revamp: [
    { id: 't_s1_u1', title: 'Grand Singularity Vortex', desc: 'Radius gelombang membesar menjadi 250px, menarik musuh 2x lebih kuat, dan meledakkan pulsa kedua 85% True Damage (bisa Crit)!', icon: 'Sparkles' },
    { id: 't_s1_u2', title: 'Temporal Armor Fracture', desc: 'Meremukkan Defense musuh sebesar -35% dan men-stun semua musuh terkena selama 1.2 detik!', icon: 'Crosshair' }
  ],
  t_s2: [
    { id: 't_s2_u1', title: 'Echoing Mirage Strikes', desc: 'Menambah jumlah serangan semua Stance (+2 hits: Sword 5 tebasan, Bow 7 panah, Staff 5 pilar)!', icon: 'Sword' },
    { id: 't_s2_u2', title: 'Vorpal Chrono Execution', desc: 'Damage meningkat 1.28x pada musuh ber-HP < 50% dan mengeksekusi instan non-Boss ber-HP < 15%!', icon: 'Zap' }
  ],
  t_s3: [
    { id: 't_s3_u1', title: 'Eternal Chrono Sphere', desc: 'Radius Time Stasis meluas ke 420px selama 3.2 detik & pemulihan HP bertambah menjadi 30% Max HP!', icon: 'Hourglass' },
    { id: 't_s3_u2', title: 'Temporal Accelerator', desc: 'Mengurangi sisa cooldown semua skill aktif lain sebesar 3.5 detik & memberi +30% Movement Speed selama 3 detik.', icon: 'FastForward' }
  ],
  v_s1: [
    { id: 'v_s1_u1', title: 'Twin Prism Matrix', desc: 'Membuka batas maksimal 4 Cermin Es & ledakan jalur Prism Anchor meningkat menjadi 170% ATK.', icon: 'Zap' },
    { id: 'v_s1_u2', title: 'Absolute Zero Lock', desc: 'Membekukan seluruh musuh yang tertangkap Jangkar Cermin selama 2.2 detik & memangkas -30% DEF.', icon: 'Snowflake' }
  ],
  v_s2: [
    { id: 'v_s2_u1', title: 'Fractal Mirror Overload', desc: 'Tombak Prisma dasar naik dari 9 menjadi 14 & setiap Cermin Es ikut memantulkan 6 Tombak Homing!', icon: 'Compass' },
    { id: 'v_s2_u2', title: 'Shatter Resonance', desc: 'Daya hancur Tombak Prisma naik menjadi 115% ATK & langsung mengeksekusi non-Boss beku ber-HP < 12%!', icon: 'Sparkles' }
  ],
  v_s3: [
    { id: 'v_s3_u1', title: 'Cryo Thorns Mirror', desc: 'Glacial Fortress DR meningkat menjadi -40%, ledakan +60 + 70% ATK True DMG, & membalas 45% ATK True DMG + memanggil Cermin Es saat diserang!', icon: 'Shield' },
    { id: 'v_s3_u2', title: 'Frozen Rebirth', desc: 'Memulihkan 24% Max HP, memberi +28 DEF permanen, & mengonversi serangan terserap Stasis menjadi Aegis Ice Shield (+18% Max HP)!', icon: 'Heart' }
  ],
  v_s4: [
    { id: 'v_s4_u1', title: 'Absolute Zero Sovereign', desc: 'Memanggil 4 Monolith Cermin Raksasa & damage Jaring Laser Cutscene meningkat menjadi 290% ATK True Damage!', icon: 'Snowflake' },
    { id: 'v_s4_u2', title: 'Perpetual Mirror Realm', desc: 'Durasi Absolute Zero Domain diperpanjang menjadi 10.5 detik (radius 340px) dengan tembakan Monolith 78% ATK True Damage!', icon: 'Wind' }
  ],
  t_s4: [
    { id: 't_s4_u1', title: 'Infinite Chronos Domain', desc: 'Radius aura & zona membesar +50% (345px), durasi menjadi 10 detik, dan menembakkan 2 Bilah Waktu tiap 0.65 detik!', icon: 'Maximize2' },
    { id: 't_s4_u2', title: 'Hyper-Temporal Overdrive', desc: 'Bonus Overdrive meningkat menjadi +22% ATK, +45% ASPD, dan +12% Evasion!', icon: 'Zap' }
  ],
  t_s5: [
    { id: 't_s5_u1', title: 'Eternal Time Stop', desc: 'Durasi Time Stop Berserk bertambah +1.5 detik & ledakan pembuka meluas ke radius 330px dengan 185% True Damage (bisa Crit)!', icon: 'Hourglass' },
    { id: 't_s5_u2', title: 'Chrono Berserker Rage', desc: 'Selama Time Stop Berserk aktif, bonus meningkat menjadi +28% ATK, +45% ASPD, +12% Crit Chance, & +25% Movement Speed!', icon: 'Zap' }
  ],
  dj_s1: [
    { id: 'dj_s1_u1', title: 'Supermassive Collapse', desc: 'Radius sedotan singularitas bertambah +45%.', icon: 'CircleDot' },
    { id: 'dj_s1_u2', title: 'Event Horizon Cleave', desc: 'Ledakan singularitas memicu +80% ATK True Damage ekstra, merobek Defense -25%, & men-stun musuh 1.0 detik!', icon: 'Sparkles' }
  ],
  dj_s2: [
    { id: 'dj_s2_u1', title: 'Reflective Space Mirror', desc: 'Dinding menghancurkan proyektil musuh yang menyentuhnya, mendorong lebih jauh, & meningkatkan damage dinding ke 85% ATK!', icon: 'Shield' },
    { id: 'dj_s2_u2', title: 'Dimensional Fortress', desc: 'Memulihkan 300 HP saat memanggil dinding & memperpanjang durasi menjadi 8 detik.', icon: 'ShieldCheck' }
  ],
  dj_s3: [
    { id: 'dj_s3_u1', title: 'Vacuum Implosion Shatter', desc: 'Radius ledakan asal meluas ke 185px, menarik musuh ke pusat ledakan & menambah +100% ATK True Damage ekstra!', icon: 'Zap' },
    { id: 'dj_s3_u2', title: 'Spatial Shift Reset', desc: 'Teleportasi memulihkan 15% HP secara instan.', icon: 'Compass' }
  ],
  dj_s4: [
    { id: 'dj_s4_u1', title: 'Infinite Reality Domain', desc: 'Radius domain meluas dari 360px menjadi 480px, memperlambat musuh di dalamnya & mengeksekusi non-Boss HP < 15%!', icon: 'Sparkles' },
    { id: 'dj_s4_u2', title: 'Eternal Judgement', desc: 'Durasi domain isolasi meningkat menjadi 9 detik.', icon: 'Hourglass' }
  ],
  rw_s1: [
    { id: 'rw_s1_u1', title: 'Quantum Execution', desc: 'Blink Strike memberi +40% Damage pada target ber-HP < 50% dan mengeksekusi instan non-Boss ber-HP < 16%!', icon: 'Zap' },
    { id: 'rw_s1_u2', title: 'Instant Warp Reset', desc: 'Membunuh musuh dengan Blink Strike memotong -65% cooldown skill ini (atau -30% cooldown jika mengenai Boss)!', icon: 'FastForward' }
  ],
  rw_s2: [
    { id: 'rw_s2_u1', title: 'Dimensional Laser Crossfire', desc: 'Setiap jalur laser warp meledak susulan dengan 90% ATK True Damage (bisa Crit) & memangkas Defense musuh -15%!', icon: 'Compass' },
    { id: 'rw_s2_u2', title: 'Penta-Phase Ambush', desc: 'Jumlah tebasan teleportasi beruntun meningkat dari 3x menjadi 5x tebasan kilat!', icon: 'Maximize2' }
  ],
  rw_s3: [
    { id: 'rw_s3_u1', title: 'Twin Warp Phantoms', desc: 'Memanggil 2 Klon Bayangan Warp sekaligus dengan pewarisan stats 60%!', icon: 'Copy' },
    { id: 'rw_s3_u2', title: 'Decoy Supernova', desc: 'Klon Bayangan meledakkan Void Supernova (135% ATK True Damage, stun 0.9s & slow 45%) saat muncul dan saat berakhir!', icon: 'ShieldAlert' }
  ],
  rw_s4: [
    { id: 'rw_s4_u1', title: 'Endless Omnipresence', desc: 'Jumlah tebasan teleportasi badai meningkat dari 10 menjadi 13 tebasan kilat!', icon: 'Sparkles' },
    { id: 'rw_s4_u2', title: 'Void Shatter Annihilation', desc: 'Radius Void Shatter Nova meluas menjadi 290px, mengeksekusi non-Boss HP < 22%, & memberi +5% Max HP (maks 600) True Damage ke Boss!', icon: 'Flame' }
  ],
  rw_s5: [
    { id: 'rw_s5_u1', title: 'Prismatic Overload', desc: 'Selama wujud Clone Anomali aktif, memperoleh +20% ATK & cooldown seluruh skill berkurang -20%!', icon: 'Sparkles' },
    { id: 'rw_s5_u2', title: 'Abyssal Portal Collapse', desc: 'Saat Hero Anomali pergi bersama Rift Walker, Portal meledak radius 260px berdamage 185% ATK True Damage & stun 1.5s!', icon: 'Flame' }
  ],
  sp_s1: [
    { id: 'sp_s1_u1', title: 'Grand Marionette Theater', desc: 'Batas maksimal boneka aktif meningkat menjadi 4 dan setiap aktivasi langsung memanggil 3 boneka!', icon: 'Copy' },
    { id: 'sp_s1_u2', title: 'Vampiric Thread Link', desc: 'Serangan boneka menyembuhkan Soul Puppeteer sebesar 12% damage yang dihasilkan.', icon: 'Heart' }
  ],
  sp_s2: [
    { id: 'sp_s2_u1', title: 'Phantom Vessel Overload', desc: 'Durasi Merasuki Boneka naik menjadi 4.2 detik, +45% Crit Chance, dan ledakan rasukan men-stun musuh 1.8 detik!', icon: 'Zap' },
    { id: 'sp_s2_u2', title: 'Immortal Soul Anchor', desc: 'Saat merasuki boneka, semua boneka & undead mendapat +40% ASPD dan cooldown skill lain berkurang 1.5 detik.', icon: 'Hourglass' }
  ],
  sp_s3: [
    { id: 'sp_s3_u1', title: 'Forbidden Bio-Mecha Mod', desc: 'Modify langsung menaikkan +2 Tingkat Modifikasi sekaligus serta memberi aura True Damage ke semua boneka & undead!', icon: 'Wrench' },
    { id: 'sp_s3_u2', title: 'Army of the Damned', desc: 'Membangkitkan 3 Bone Revenant sekaligus dan batas maksimal Undead naik menjadi 8.', icon: 'Skull' }
  ],
  sp_s4: [
    { id: 'sp_s4_u1', title: 'Eternal Abyssal Lich', desc: 'Durasi Transformasi Lich meningkat menjadi 11 detik dan bonus ATK naik menjadi +50%!', icon: 'Crown' },
    { id: 'sp_s4_u2', title: 'Soul Maker Genesis', desc: 'Selama Transformasi Lich aktif, setiap 2 detik otomatis menempa +5 Soul, 1 Boneka Modifikasi & 2 Bone Revenant!', icon: 'Sparkles' }
  ],
  sp_s5: [
    { id: 'sp_s5_u1', title: "Overlord's Crimson Thread", desc: 'Durasi Domain Crimson Theatre naik menjadi 12.0 detik, seluruh Boneka & Undead memperoleh +55% ATK & +35% ASPD, dan batas Boneka aktif bertambah +1!', icon: 'Crown' },
    { id: 'sp_s5_u2', title: 'Final Curtain: Soul Guillotine', desc: 'Radius ledakan Domain meluas ke 460px, True Damage bertambah +140% ATK, dan langsung mengeksekusi non-Boss HP < 25% menjadi Boneka baru!', icon: 'Sparkles' }
  ],
  sol_s1: [
    { id: 'sol_s1_u1', title: 'Piercing Sunbeam', desc: 'Jarak tusukan Tombak Matahari bertambah +80px dan men-stun semua musuh yang tertusuk selama 1.2 detik.', icon: 'Zap' },
    { id: 'sol_s1_u2', title: 'Blazing Penetration', desc: 'Tusukan Tombak Matahari selalu Critical Strike dan memangkas Defense musuh -25%.', icon: 'Crosshair' }
  ],
  sol_s2: [
    { id: 'sol_s2_u1', title: 'Superheated Corona', desc: 'Radius ledakan Corona Nova bertambah +50px dan damage meningkat menjadi 175% ATK.', icon: 'Flame' },
    { id: 'sol_s2_u2', title: 'Phoenix Guard', desc: 'Pengurangan damage Solar Guard meningkat menjadi -35% selama 5.0 detik serta memulihkan 12% Max HP secara instan.', icon: 'Shield' }
  ],
  sol_s3: [
    { id: 'sol_s3_u1', title: 'Celestial Bombardment', desc: 'Jumlah meteor matahari yang dijatuhkan bertambah dari 4 meteor menjadi 7 meteor!', icon: 'Flame' },
    { id: 'sol_s3_u2', title: 'Molten Crater', desc: 'Setiap ledakan meteor menambahkan kawah magma berdamage +50% ATK True Damage.', icon: 'Sparkles' }
  ],
  sol_s4: [
    { id: 'sol_s4_u1', title: 'Eternal Star Core', desc: 'Durasi Avatar Matahari meningkat menjadi 11 detik, bonus ATK naik menjadi +70%, & Solar Ward meningkat menjadi -32% DMG diterima!', icon: 'Sun' },
    { id: 'sol_s4_u2', title: 'Hypernova Collapse', desc: 'Selama Avatar Matahari aktif, setiap 2 detik otomatis menjatuhkan Meteor 170% ATK (Stun 0.8s) ke musuh terdekat & ledakan akhir Hypernova naik menjadi 320% ATK True Damage!', icon: 'Zap' }
  ],
  fa_s1: [
    { id: 'fa_s1_u1', title: 'Seven-Wing Volley', desc: 'Jumlah Bulu Gerhana bertambah dari 5 menjadi 7 bulu & menghasilkan +15% Damage ke target ber-HP < 50%!', icon: 'Sparkles' },
    { id: 'fa_s1_u2', title: 'Cursed Plumage', desc: 'Seluruh bulu barrage dijamin Critical Strike & memicu +20% ATK True Damage tambahan!', icon: 'Crosshair' }
  ],
  fa_s2: [
    { id: 'fa_s2_u1', title: 'Sanctuary Redemption', desc: 'Melesat memulihkan 10% Max HP secara instan & memperpanjang durasi kebal menjadi 0.7 detik.', icon: 'Heart' },
    { id: 'fa_s2_u2', title: 'Void Gravity Halo', desc: 'Menarik musuh dalam radius 220px ke pusat Halo Hitam & memperlambat mereka 2.0 detik.', icon: 'CircleDot' }
  ],
  fa_s3: [
    { id: 'fa_s3_u1', title: 'Abyssal Verdict', desc: 'Radius pilar penghakiman meluas menjadi 240px & langsung mengeksekusi non-Boss ber-HP < 10%!', icon: 'Maximize2' },
    { id: 'fa_s3_u2', title: 'Sinful Haste', desc: 'Langsung mereset cooldown Crimson Feather Barrage & memberi +20% Attack Speed selama 3 detik!', icon: 'Zap' }
  ],
  fa_s4: [
    { id: 'fa_s4_u1', title: 'Eternal Fallen Seraph', desc: 'Durasi Sayap Gerhana meningkat menjadi 8.5 detik dan bonus ATK naik menjadi +35%!', icon: 'Crown' },
    { id: 'fa_s4_u2', title: 'Apocalypse Plume Storm', desc: 'Setiap hujan bulu menembakkan 4 bulu & memulihkan 1% Max HP per siklus!', icon: 'Flame' }
  ],
  dr_s1: [
    { id: 'dr_s1_u1', title: 'Crimson Bloodletter', desc: 'Tebasan Cakar Neraka dijamin Critical Strike & memulihkan HP sebesar 25% dari damage yang dihasilkan!', icon: 'Heart' },
    { id: 'dr_s1_u2', title: 'Hellwave Slash', desc: 'Tebasan turut meluncurkan gelombang api neraka jarak jauh (360px) berdamage 175% ATK menembus musuh!', icon: 'Zap' }
  ],
  dr_s2: [
    { id: 'dr_s2_u1', title: 'Torment Shackles', desc: 'Rantai Neraka men-stun musuh selama 1.6 detik & merobek Defense mereka -30%!', icon: 'ShieldAlert' },
    { id: 'dr_s2_u2', title: 'Sovereign Blood Ward', desc: 'Pengurangan damage Blood Ward meningkat menjadi -35% selama 5.5 detik & jangkauan rantai meluas menjadi 310px!', icon: 'Shield' }
  ],
  dr_s3: [
    { id: 'dr_s3_u1', title: 'Cataclysmic Hellscape', desc: 'Jumlah letusan pilar magma bertambah dari 5 menjadi 8 pilar & seluruhnya menghasilkan True Damage!', icon: 'Flame' },
    { id: 'dr_s3_u2', title: 'Ashen Tremor', desc: 'Setiap letusan pilar magma men-stun musuh 1.0 detik & memperlambat gerakan mereka!', icon: 'Sparkles' }
  ],
  dr_s4: [
    { id: 'dr_s4_u1', title: 'Immortal Demon King', desc: 'Durasi Kebangkitan Raja Iblis meningkat menjadi 12 detik & bonus ATK naik menjadi +60%!', icon: 'Crown' },
    { id: 'dr_s4_u2', title: 'Doomsday Hellstorm', desc: 'Selama Kebangkitan aktif, setiap 1.8 detik otomatis memanggil Meteor Neraka 185% ATK + stun 0.9s!', icon: 'Skull' }
  ],
  el_s1: [
    { id: 'el_s1_u1', title: 'Meteor Pyreball', desc: 'Radius ledakan Bola Api meluas menjadi 225px (295% ATK) & efek Flaming bertahan 4.0 detik dengan damage bakar +40%!', icon: 'Flame' },
    { id: 'el_s1_u2', title: 'Twin Ember Volley', desc: 'Setiap aktivasi turut meluncurkan 2 Bola Api tambahan yang mengejar musuh terdekat (110% ATK per bola) & memicu Flaming!', icon: 'Sparkles' }
  ],
  el_s2: [
    { id: 'el_s2_u1', title: 'Cyclone Resonance', desc: 'Wind Vortex langsung menambah +2 stack Wind Burst (kombo Wind +3) dan meremukkan Defense musuh sebesar -20%!', icon: 'Wind' },
    { id: 'el_s2_u2', title: 'Gale Vacuum Burst', desc: 'Radius Wind Vortex & Tornado meluas +35% dengan tarikan jauh lebih kuat serta memberi +40% Attack Speed selama 3.0 detik!', icon: 'Zap' }
  ],
  el_s3: [
    { id: 'el_s3_u1', title: 'Poseidon Tide Blessing', desc: 'Gelombang Air memulihkan 14% Max HP dan memberi 2x regenerasi Water Poseidon Armor (+250 HP atau -12s CD)!', icon: 'Shield' },
    { id: 'el_s3_u2', title: 'Crushing Tsunami', desc: 'Gelombang Air, Gelombang Batu, & Pusaran Air dijamin Critical Strike serta memberi +4% Max HP (maks 350) True Damage!', icon: 'Zap' }
  ],
  el_s4: [
    { id: 'el_s4_u1', title: 'Eternal Eden', desc: 'Memperpanjang durasi Primordial Sanctuary menjadi 18 detik, +18% Movement Speed, & memulihkan 1.5% Max HP per detik!', icon: 'Heart' },
    { id: 'el_s4_u2', title: 'Elemental Leylines', desc: 'Selama Primordial Sanctuary aktif, jendela kombo bertahan 5.0 detik, Cooldown pulih +15% lebih cepat, & langsung memberi +3 Wind Burst serta +4 Earth Hits!', icon: 'Sparkles' }
  ],
  ar_s1: [
    { id: 'ar_s1_u1', title: 'Seven-Card Boomerang', desc: 'Kipas kartu bertambah dari 5 menjadi 7 Kartu Bumerang & pantulan balik menghasilkan True Damage!', icon: 'Sparkles' },
    { id: 'ar_s1_u2', title: 'Ace in the Sleeve', desc: 'Tembakan bumerang memotong sisa CD Skill hingga 0.8s total & berpeluang 25% menarik kartu kembar (Pair)!', icon: 'Zap' }
  ],
  ar_s2: [
    { id: 'ar_s2_u1', title: 'Loaded Golden Dice', desc: 'Angka Dadu minimal menjadi 3, dan saat keluar angka 6 meledakkan gelombang ganda (+60% ATK True Damage & Stun 0.5s)!', icon: 'Crown' },
    { id: 'ar_s2_u2', title: 'Twin Dice Cascade', desc: 'Melempar 2 Dadu Takdir sekaligus! Total kedua angka dikalikan ke damage ledakan & memicu 2 Suit Burst tambahan!', icon: 'Sparkles' }
  ],
  ar_s3: [
    { id: 'ar_s3_u1', title: 'Jester Dominion Trap', desc: 'Zona Gambit menarik musuh ke pusat tiap 0.6s, merobek DEF bertahap, & mengeksekusi instan non-Boss HP < 8%!', icon: 'ShieldAlert' },
    { id: 'ar_s3_u2', title: 'Wildcard Mirror Clone', desc: 'Gandakan kartu menjadi 4 proyektil pelacak & beri -12% Damage diterima selama 3.0 detik!', icon: 'Shield' }
  ],
  ar_s4: [
    { id: 'ar_s4_u1', title: 'Grand Casino Cataclysm', desc: 'Radius Roda Roulette meluas ke 330px selama 6.0 detik & setiap putaran menembakkan 3 Kartu Raksasa!', icon: 'Crown' },
    { id: 'ar_s4_u2', title: 'Guaranteed Jackpot', desc: 'Aktivasi Roulette langsung memicu Triple Jackpot Spade instan & menaikkan damage Roulette +20%!', icon: 'Flame' }
  ],
  ar_s5: [
    { id: 'ar_s5_u1', title: 'Prism Mirage Afterimage', desc: 'Dash meninggalkan Bayangan Ilusi yang meledak ulang setelah 0.35s (105% ATK True Damage & Stun 0.6s) serta memperpanjang Kebal menjadi 0.75 detik!', icon: 'Sparkles' },
    { id: 'ar_s5_u2', title: 'Sleight of Hand Velocity', desc: 'Setiap Dash menembakkan 3 Kartu Suit Pelacak (55% ATK), memangkas cooldown Dash -1.2 detik, & memberi +20% Evasion selama 2.5 detik!', icon: 'Zap' }
  ],
  mp_s1: [
    { id: 'mp_s1_u1', title: 'Feral Frenzy', desc: 'Damage cakaran Razor Wolf meningkat menjadi 215% ATK & memberi +18% Lifesteal selama di Wujud Wolf!', icon: 'Zap' },
    { id: 'mp_s1_u2', title: 'Alpha Pounce', desc: 'Terjangan Razor Wolf men-stun musuh selama 1.2 detik & memangkas Defense mereka sebesar -25%!', icon: 'Crosshair' }
  ],
  mp_s2: [
    { id: 'mp_s2_u1', title: 'Colossus Quake', desc: 'Radius gempa Behemoth meluas menjadi 250px (Stun 1.6s) & memantulkan 45% ATK True Damage saat diserang di Wujud Behemoth!', icon: 'Shield' },
    { id: 'mp_s2_u2', title: 'Primal Vitality', desc: 'Transformasi Behemoth langsung memulihkan 14% Max HP & memberi +20 Defense ekstra selama di Wujud Behemoth!', icon: 'Heart' }
  ],
  mp_s3: [
    { id: 'mp_s3_u1', title: 'Skyfire Barrage', desc: 'Semburan Wyvern meningkat dari 5 menjadi 9 Bola Api Kosmik & membakar musuh 40% ATK/detik selama 3 detik!', icon: 'Flame' },
    { id: 'mp_s3_u2', title: 'Twin Wing Echo', desc: 'Memberi +30% Movement Speed selama 3.0 detik & memangkas sisa cooldown Skill Wyvern sebesar 1.5 detik!', icon: 'Wind' }
  ],
  mp_s4: [
    { id: 'mp_s4_u1', title: 'Omega Devastation', desc: 'Ledakan pembuka Apex Chimera meningkat menjadi 280% ATK True Damage (260px) & damage Apex Pulse naik menjadi 95% ATK True Damage!', icon: 'Crown' },
    { id: 'mp_s4_u2', title: 'Eternal Evolution', desc: 'Durasi wujud Apex Chimera diperpanjang menjadi 12.0 detik & langsung mereset cooldown Skill 1–3 saat bertransformasi!', icon: 'Sparkles' }
  ],
  lm_s1: [
    { id: 'lm_s1_u1', title: 'Triple Kaleidoscope', desc: 'Memanggil 3 Cermin di Wujud Cermin (batas maks cermin jadi 4), pantulan laser cermin naik ke 55% ATK, & Solar Implosion Wujud Cahaya meluas ke 190px!', icon: 'Sparkles' },
    { id: 'lm_s1_u2', title: 'Blinding Glass Shatter', desc: 'Ledakan/kemunculan Cermin men-stun musuh 0.8 detik & memangkas Defense mereka sebesar -15%!', icon: 'Zap' }
  ],
  lm_s2: [
    { id: 'lm_s2_u1', title: 'Twin Refractive Cannon', desc: 'Menembakkan 2 jalur Laser Cahaya Suci sekaligus & memberi +15% Crit Chance pada tembakan laser!', icon: 'Crosshair' },
    { id: 'lm_s2_u2', title: 'Solar Overburn', desc: 'Laser Cahaya membakar musuh selama 2.5 detik serta memotong sisa cooldown skill biasa lain -0.6 detik!', icon: 'Flame' }
  ],
  lm_s3: [
    { id: 'lm_s3_u1', title: 'Light-Speed Reflection', desc: 'Memberi kebal 0.5 detik saat dash, memulihkan 14% Max HP, & menambah 1 Cermin/Kilatan ekstra!', icon: 'Heart' },
    { id: 'lm_s3_u2', title: 'Dazzling Mirage Veil', desc: 'Meningkatkan Mirror Ward menjadi -24% DMG diterima selama 3.5 detik & menambah +12% Evasion!', icon: 'Shield' }
  ],
  lm_s4: [
    { id: 'lm_s4_u1', title: 'Equinox Resonance', desc: 'Setiap transformasi Cermin ↔ Cahaya memberi Aspect Surge (+15% ATK & +15% ASPD selama 3.5s) & memulihkan 6% Max HP!', icon: 'Crown' },
    { id: 'lm_s4_u2', title: 'Prismatic Overdrive', desc: 'Ledakan transformasi Cermin ↔ Cahaya berubah menjadi True Damage (+50% DMG) & langsung mereset cooldown Mirror Aegis!', icon: 'Sparkles' }
  ],
  lm_s5: [
    { id: 'lm_s5_u1', title: 'Eternal Kaleidoscope Halo', desc: 'Durasi Transformasi Equinox (Cahaya + Cermin) meningkat menjadi 13.0 detik, batas maksimal Cermin naik ke 5, & serangan dasar memantul ke +2 target ekstra!', icon: 'Crown' },
    { id: 'lm_s5_u2', title: 'Prism Supernova Convergence', desc: 'Radius ledakan Equinox Nova meluas ke 450px, True Damage bertambah +140% ATK, & tiap 2 detik seluruh Cermin menembakkan Prismatic Cross-Ray (115% Magical + 65% True DMG)!', icon: 'Sparkles' }
  ],
  ax_s1: [
    { id: 'ax_s1_u1', title: 'Hyper-Gravity Crush', desc: 'Radius hisap Telekinetic Slam meluas menjadi 290px & True Damage meningkat menjadi 125% ATK + Stun 1.7 detik!', icon: 'Crosshair' },
    { id: 'ax_s1_u2', title: 'Chain Singularity', desc: 'Hantaman monolit memicu ledakan susulan ke maks 3 musuh terdekat (110% ATK True DMG) & langsung memberi +3 Manipulation Stack!', icon: 'Zap' }
  ],
  ax_s2: [
    { id: 'ax_s2_u1', title: 'Supreme Mind Sovereign', desc: 'Maksimal musuh yang dikendalikan naik ke 7, durasi kontrol 5.5s, & kerusakan serangan boneka naik ke 165% Axiom ATK!', icon: 'Crown' },
    { id: 'ax_s2_u2', title: 'Psychic Detonation', desc: 'Ketika efek kontrol pikiran berakhir atau target mati, meledak menghasilkan 140% ATK True DMG AoE & merobek DEF -25%!', icon: 'Skull' }
  ],
  ax_s3: [
    { id: 'ax_s3_u1', title: 'Nine-Blade Orbit', desc: 'Jumlah Bilah Monolit 3D bertambah dari 6 menjadi 9 bilah, dijamin Critical Strike, & memulihkan 15% Max HP!', icon: 'Sparkles' },
    { id: 'ax_s3_u2', title: 'Absolute Deflect Matrix', desc: 'Vector Ward mengurangi -38% DMG diterima selama 5.0s & langsung mereset cooldown Vector Deflection!', icon: 'Shield' }
  ],
  ax_s4: [
    { id: 'ax_s4_u1', title: 'Dimensional Collapse Cube', desc: 'Radius Cube Prison meluas ke 340px selama 6.0s, ambang eksekusi non-Boss naik ke HP < 22%, & men-stun tiap 1.5s!', icon: 'Maximize2' },
    { id: 'ax_s4_u2', title: 'Overclocked Reality', desc: 'Saat Cube Prison aktif, bonus meningkat ke +60% ATK & +50% ASPD, plus menembakkan Laser Kubus ke 3 musuh tiap 0.9s!', icon: 'Zap' }
  ],
  ax_s5: [
    { id: 'ax_s5_u1', title: 'God of Manipulation', desc: 'Durasi Apex Dominion diperpanjang menjadi 12.5 detik, bonus ATK naik ke +65%, & tiap detik memanggil 2 Monolit 3D otomatis!', icon: 'Crown' },
    { id: 'ax_s5_u2', title: 'Endless Reality Shatter', desc: 'Radius ledakan Apex meluas ke 460px, True Damage bertambah +140% ATK, & setiap serangan dasar melepaskan 5 Sinar Prisma 3D sekaligus!', icon: 'Sparkles' }
  ],
  kg_s1: [
    { id: 'kg_s1_u1', title: 'Thunderclap Blood Iaido', desc: 'Jarak tebasan Iaido meluas menjadi 340px, ledakan tertunda meningkat ke 135% ATK True DMG + Stun 0.9s, & langsung memberi +3 Blood Mark!', icon: 'Zap' },
    { id: 'kg_s1_u2', title: 'Scarlet Flash Reset', desc: 'Membunuh musuh atau mengenai Boss memotong cooldown Iaido Crimson Flash -1.5 detik & memulihkan 10% Max HP!', icon: 'FastForward' }
  ],
  kg_s2: [
    { id: 'kg_s2_u1', title: 'Thousand Spider Lilies', desc: 'Jumlah bilah Higanbana Rain bertambah dari 12 menjadi 18 bilah & semuanya dijamin Critical Strike!', icon: 'Sparkles' },
    { id: 'kg_s2_u2', title: 'Crimson Rupture Feast', desc: 'Detonasi tiap stack Blood Mark naik menjadi +70% ATK True DMG & memulihkan 1.5% Max HP per musuh yang meledak!', icon: 'Heart' }
  ],
  kg_s3: [
    { id: 'kg_s3_u1', title: 'Immortal Blood Aegis', desc: 'Blood Aegis Shield naik menjadi +34% Max HP, Blood Ward mengurangi -38% DMG diterima selama 5.5s, & radius hisap meluas ke 300px!', icon: 'Shield' },
    { id: 'kg_s3_u2', title: 'Carnage Siphon', desc: 'Pemulihan HP meningkat ke 24% Max HP & selama Blood Ward aktif, seluruh serangan Kagero mendapat +25% Bonus Crit Damage!', icon: 'Flame' }
  ],
  kg_s4: [
    { id: 'kg_s4_u1', title: 'Endless Hell-Lily Garden', desc: 'Radius Domain Higanbana meluas ke 340px selama 6.5s & mengeksekusi instan non-Boss ber-HP < 16%!', icon: 'Maximize2' },
    { id: 'kg_s4_u2', title: 'Overdrive Blood Altar', desc: 'Di dalam Domain, bonus meningkat ke +55% ATK & +45% ASPD, plus menembakkan 4 Jarum Darah pelacak tiap 0.8s!', icon: 'Crosshair' }
  ],
  kg_s5: [
    { id: 'kg_s5_u1', title: 'Eternal Blood Moon', desc: 'Durasi Crimson Moon Form diperpanjang menjadi 13.0 detik, bonus ATK naik ke +70%, & memicu Sabit Darah otomatis tiap 1.0s!', icon: 'Crown' },
    { id: 'kg_s5_u2', title: 'Sakuga Final Severance', desc: 'Radius tebasan Eclipse meluas ke 470px, True Damage bertambah +140% ATK, & eksekusi non-Boss naik ke HP < 26%!', icon: 'Sparkles' }
  ],
  arc_custom_1: [
    { id: 'arc_c1_u1', title: 'Overclocked Routine I', desc: 'Daya serang Auto-Skill Slot 1 meningkat +32% & seluruh efek tambahannya (heal/shield/stun/tarik) menjadi 1.35x lebih kuat!', icon: 'Zap' },
    { id: 'arc_c1_u2', title: 'Low-Latency Execution I', desc: 'Cooldown Auto-Skill Slot 1 berkurang -12% & langsung mengisi +2 Logic Nodes saat diaktifkan!', icon: 'FastForward' }
  ],
  arc_custom_2: [
    { id: 'arc_c2_u1', title: 'Overclocked Routine II', desc: 'Daya serang Auto-Skill Slot 2 meningkat +32% & jangkauan area/proyektil meluas +25%!', icon: 'Sparkles' },
    { id: 'arc_c2_u2', title: 'Low-Latency Execution II', desc: 'Cooldown Auto-Skill Slot 2 berkurang -12% & dijamin Critical Strike saat mengenai musuh!', icon: 'Crosshair' }
  ],
  arc_custom_3: [
    { id: 'arc_c3_u1', title: 'Overclocked Routine III', desc: 'Daya serang Auto-Skill Slot 3 meningkat +32% & memulihkan +6% Max HP tambahan setiap kali dipakai!', icon: 'Heart' },
    { id: 'arc_c3_u2', title: 'Low-Latency Execution III', desc: 'Cooldown Auto-Skill Slot 3 berkurang -12% & memotong sisa cooldown seluruh skill biasa lain -0.7 detik!', icon: 'Hourglass' }
  ],
  arc_custom_4: [
    { id: 'arc_c4_u1', title: 'Overclocked Routine IV', desc: 'Daya serang Auto-Skill Slot 4 meningkat +35% & menambahkan ledakan True Damage +75% ATK!', icon: 'Flame' },
    { id: 'arc_c4_u2', title: 'Low-Latency Execution IV', desc: 'Cooldown Auto-Skill Slot 4 berkurang -12% & durasi Zona/Buff meningkat +35%!', icon: 'Maximize2' }
  ],
  arc_s5: [
    { id: 'arc_s5_u1', title: 'Infinite Hyper-Compiler', desc: 'Durasi Mode Overclock diperpanjang menjadi 13.0 detik, bonus ATK naik ke +65%, & secara otomatis memicu Gema Auto-Skill acak tiap 2.5 detik!', icon: 'Crown' },
    { id: 'arc_s5_u2', title: 'Grand Architecture Collapse', desc: 'Radius ledakan Genesis Compiler meluas ke 460px, True Damage bertambah +140% ATK, & memotong cooldown keempat Auto-Skill -2.5 detik seketika!', icon: 'Sparkles' }
  ]
};
