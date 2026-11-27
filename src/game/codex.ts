import {
  BestiaryEntryDefinition,
  CodexProgress,
  CombatStats,
  HeroKey,
  HeroLoreChronicle
} from '../types/game';
import { HERO_DATABASE } from './constants';

const CODEX_STORAGE_KEY = 'fantasy_arena_codex_v1';

const createEmptyCodexProgress = (): CodexProgress => ({
  heroes: {},
  monsters: {},
  relics: {},
  lastUpdated: new Date().toISOString()
});

let cachedProgress: CodexProgress | null = null;
let flushTimer: number | null = null;

export function loadCodexProgress(): CodexProgress {
  if (cachedProgress) return cachedProgress;
  if (typeof window === 'undefined') {
    cachedProgress = createEmptyCodexProgress();
    return cachedProgress;
  }
  try {
    const raw = window.localStorage.getItem(CODEX_STORAGE_KEY);
    if (!raw) {
      cachedProgress = createEmptyCodexProgress();
      return cachedProgress;
    }
    const parsed = JSON.parse(raw) as Partial<CodexProgress>;
    cachedProgress = {
      heroes: parsed.heroes && typeof parsed.heroes === 'object' ? parsed.heroes : {},
      monsters: parsed.monsters && typeof parsed.monsters === 'object' ? parsed.monsters : {},
      relics: parsed.relics && typeof parsed.relics === 'object' ? parsed.relics : {},
      lastUpdated: typeof parsed.lastUpdated === 'string' ? parsed.lastUpdated : new Date().toISOString()
    };
  } catch {
    cachedProgress = createEmptyCodexProgress();
  }
  return cachedProgress;
}

export function flushCodexProgress(): void {
  if (typeof window === 'undefined' || !cachedProgress) return;
  if (flushTimer !== null) {
    window.clearTimeout(flushTimer);
    flushTimer = null;
  }
  try {
    cachedProgress.lastUpdated = new Date().toISOString();
    window.localStorage.setItem(CODEX_STORAGE_KEY, JSON.stringify(cachedProgress));
  } catch {
    // Ignore storage quota or private-mode exceptions gracefully
  }
}

let flushListenerBound = false;

function ensureFlushOnPageHide(): void {
  if (typeof window === 'undefined' || flushListenerBound) return;
  flushListenerBound = true;
  window.addEventListener('pagehide', () => {
    flushCodexProgress();
  });
}

function scheduleCodexFlush(): void {
  if (typeof window === 'undefined') return;
  ensureFlushOnPageHide();
  if (flushTimer !== null) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    flushCodexProgress();
  }, 1200);
}

export function resetCodexProgress(): CodexProgress {
  cachedProgress = createEmptyCodexProgress();
  flushCodexProgress();
  return cachedProgress;
}

export function markHeroLoreRead(heroKey: HeroKey): CodexProgress {
  const progress = loadCodexProgress();
  const prev = progress.heroes[heroKey] ?? {
    runs: 0,
    victories: 0,
    kills: 0,
    bestWave: 0,
    loreRead: false
  };
  if (!prev.loreRead) {
    progress.heroes[heroKey] = { ...prev, loreRead: true };
    flushCodexProgress();
  }
  return progress;
}

export function recordCodexHeroRun(heroKey: HeroKey): void {
  const progress = loadCodexProgress();
  const prev = progress.heroes[heroKey] ?? {
    runs: 0,
    victories: 0,
    kills: 0,
    bestWave: 0,
    loreRead: false
  };
  progress.heroes[heroKey] = {
    ...prev,
    runs: prev.runs + 1,
    bestWave: Math.max(prev.bestWave, 1)
  };
  flushCodexProgress();
}

export function recordCodexHeroKill(heroKey: HeroKey, wave: number): void {
  const progress = loadCodexProgress();
  const prev = progress.heroes[heroKey] ?? {
    runs: 1,
    victories: 0,
    kills: 0,
    bestWave: 1,
    loreRead: false
  };
  progress.heroes[heroKey] = {
    ...prev,
    kills: prev.kills + 1,
    bestWave: Math.max(prev.bestWave, wave)
  };
  scheduleCodexFlush();
}

export function recordCodexHeroResult(heroKey: HeroKey, stats: CombatStats, isVictory: boolean): void {
  const progress = loadCodexProgress();
  const prev = progress.heroes[heroKey] ?? {
    runs: 1,
    victories: 0,
    kills: 0,
    bestWave: 1,
    loreRead: false
  };
  progress.heroes[heroKey] = {
    ...prev,
    victories: prev.victories + (isVictory ? 1 : 0),
    bestWave: Math.max(prev.bestWave, stats.wave || 1)
  };
  flushCodexProgress();
}

export function normalizeBestiaryId(type: string, isBoss: boolean): string | null {
  if (type === 'dummy' || type === 'dummy_striker') return null;
  if (type === 'wari') return isBoss ? 'wari_boss' : 'wari_mob';
  return type;
}

export function recordCodexMonsterEncounter(type: string, isBoss: boolean): void {
  const id = normalizeBestiaryId(type, isBoss);
  if (!id) return;
  const progress = loadCodexProgress();
  const prev = progress.monsters[id] ?? { encountered: 0, defeated: 0 };
  progress.monsters[id] = {
    ...prev,
    encountered: prev.encountered + 1
  };
  scheduleCodexFlush();
}

export function recordCodexMonsterDefeat(type: string, isBoss: boolean): void {
  const id = normalizeBestiaryId(type, isBoss);
  if (!id) return;
  const progress = loadCodexProgress();
  const prev = progress.monsters[id] ?? { encountered: 0, defeated: 0 };
  progress.monsters[id] = {
    encountered: Math.max(prev.encountered, prev.defeated + 1),
    defeated: prev.defeated + 1
  };
  scheduleCodexFlush();
}

export function recordCodexRelicCollected(attrId: string, wave: number = 1): void {
  const progress = loadCodexProgress();
  const prev = progress.relics[attrId];
  progress.relics[attrId] = {
    collectedCount: (prev?.collectedCount ?? 0) + 1,
    firstWave: prev?.firstWave ?? wave
  };
  scheduleCodexFlush();
}

export const HERO_LORE_CHRONICLES: Record<HeroKey, HeroLoreChronicle> = {
  monkey: {
    heroKey: 'monkey',
    originRealm: 'Puncak Huaguo & Istana Giok',
    titleBadge: 'Qi Tian Da Sheng',
    archetype: 'Warrior',
    signatureArtifact: 'Tongkat Emas RuYi Jingu Bang',
    quote: 'Satu helai bulu cukup untuk membelah langit; tujuh puluh dua bayangan cukup untuk meruntuhkan takhta dewa.',
    chapters: [
      {
        heading: 'Asal-Usul Batu Purba',
        body: 'Lahir dari batu giok puncak Gunung Huaguo yang menyerap sari matahari dan bulan selama ribuan abad, Sun Wukong menolak tunduk pada tatanan surga. Setelah menempa tubuh abadi Vajra dan menjarah gudang senjata Istana Naga Timur, ia memilih RuYi Jingu Bang — pilar penyangga samudra yang dapat membesar hingga menembus awan atau menyusut seukuran jarum telinga.'
      },
      {
        heading: 'Doktrin Pertempuran Arena',
        body: 'Di Fantasy Arena, Monkey King bertarung dengan ritme kombo tanpa jeda. Tubuh Vajra meredam seperempat seluruh hantaman masuk, sementara tiap tiga serangan beruntun memicu Somersault Echo Strike. Puncaknya, wujud Great Sage Equalization memanggil 72 klon astral yang meniru ayunan tongkat raksasanya secara serempak.'
      }
    ]
  },
  demonis: {
    heroKey: 'demonis',
    originRealm: 'Abyssal Void Rift · Lapisan Ketujuh',
    titleBadge: 'Lord of Void & Shadows',
    archetype: 'Assassin',
    signatureArtifact: 'Monolit Void & Zirah Nebula',
    quote: 'Kegelapan tidak meminta izin untuk menelan bintang — ia hanya menunggu sinarmu kehabisan napas.',
    chapters: [
      {
        heading: 'Penguasa Kehampaan Sunyi',
        body: 'Demonis adalah entitas yang menyatu dengan celah antar-realitas ketika retakan Abyssal pertama kali terbuka. Alih-alih menghancurkan kehampaan, ia menempanya menjadi zirah hidup: Shadow Armor, Blackhole Armor, hingga Nebulas Armor yang memantulkan proyektil pelacak berkecepatan tinggi.'
      },
      {
        heading: 'Eksekusi Penghakiman Abyssal',
        body: 'Setiap serangan dan tumbal musuh mengisi Full Charger Demonis hingga batas 30 tumpukan, mengubahnya ke wujud Abyssal Ascendance dengan jarak serang dan daya kritis mematikan. Ketika bidikan Void Judgement terkunci, meriam kegelapannya memusnahkan target tunggal maupun kawanan lewat ledakan singularitas murni.'
      }
    ]
  },
  traveler: {
    heroKey: 'traveler',
    originRealm: 'Menara Kronos · Garis Waktu Retak',
    titleBadge: 'Master of Time & Weapons',
    archetype: 'Warrior',
    signatureArtifact: 'Tiga Relik Kronos (Pedang, Busur, Tongkat)',
    quote: 'Kemenangan bukan soal seberapa kuat tebasanmu hari ini, melainkan berapa kali kau sanggup memutar ulang kekalahan.',
    chapters: [
      {
        heading: 'Pengembara Seribu Era',
        body: 'Terdampar di persimpangan abad yang runtuh, Traveler menempa keahlian tiga aliran senjata sekaligus agar mampu bertahan di era mana pun: pedang jarak dekat yang gesit, busur pemburu penembus barisan, serta tongkat sihir pengendali ledakan aether.'
      },
      {
        heading: 'Otoritas Penghenti Waktu',
        body: 'Dengan Time Essence yang terakumulasi di medan perang, Traveler dapat membalikkan takdir dari ambang maut melalui Temporal Rewind dan membekukan seluruh arena dalam Time Stop. Setiap pergantian stance senjata memotong cooldown dan menyelaraskan serangan dengan gema waktu masa depan.'
      }
    ]
  },
  valkyrie: {
    heroKey: 'valkyrie',
    originRealm: 'Benteng Niflheim Abadi',
    titleBadge: 'Goddess of Glacial Mirrors',
    archetype: 'Tank',
    signatureArtifact: 'Aegis Permafrost & Cermin Es Enam Sisi',
    quote: 'Badai salju terkuat bukanlah yang membekukan daging, melainkan yang mematahkan nyali sebelum pedang diayunkan.',
    chapters: [
      {
        heading: 'Sumpah Garda Es Utara',
        body: 'Sebagai penjaga terakhir gerbang gletser Niflheim, Valkyrie mengorbankan kehangatan jantungnya demi zirah Frost Armor yang tak tertembus. Cermin es yang mengorbit di sekelilingnya memantulkan kilatan sihir musuh sembari menumpuk Frost Chill di tulang lawan.'
      },
      {
        heading: 'Benteng Kristal & Epoch',
        body: 'Ia merupakan jangkar pertahanan paling tangguh di arena: menyerap serangan mematikan dengan Permafrost Ward, membekukan seluruh musuh lewat Glacial Mirror Fortress, serta menembakkan gelombang es jarak jauh setiap kali batas ketahanan beku tercapai.'
      }
    ]
  },
  dimension_judge: {
    heroKey: 'dimension_judge',
    originRealm: 'Pengadilan Kosmik Aethelgard',
    titleBadge: 'Sovereign of Cosmic Space',
    archetype: 'Manipulation',
    signatureArtifact: 'Timbangan Realitas & Greatsword Void Arbiter',
    quote: 'Hukum ruang tidak mengenal banding. Saat ruang kulipat, jarak dan perisaimu lenyap pada saat bersamaan.',
    chapters: [
      {
        heading: 'Hakim Keseimbangan Semesta',
        body: 'Ketika para pelintas dimensi hampir merobek kain realitas, Dimension Judge bangkit dari kursi Pengadilan Kosmik. Ia mampu memperluas zona gravitasi untuk menyedot pasukan musuh sekaligus mengoyak pertahanan baja maupun perisai mana.'
      },
      {
        heading: 'Transformasi Void Arbiter',
        body: 'Setelah mengumpulkan Dimensional Resonance dari tiap mantra ruang, ia melepaskan wujud jarak jauhnya untuk mengaktifkan Void Arbiter Melee Form — membentangkan sayap pedang kembar dan menghunus Greatsword raksasa yang menembakkan tebasan bulan sabit pemusnah.'
      }
    ]
  },
  rift_walker: {
    heroKey: 'rift_walker',
    originRealm: 'Celah Kuantum Tak Bernama',
    titleBadge: 'Spatial Blade Phantom',
    archetype: 'Assassin',
    signatureArtifact: 'Belati Fasa & Portal Anomali',
    quote: 'Kau menebas tempat aku berdiri sepersekian detik lalu — dan kini belatiku sudah berada di belakang punggungmu.',
    chapters: [
      {
        heading: 'Siluman Lipatan Ruang',
        body: 'Tubuh Rift Walker tidak pernah sepenuhnya berada di satu titik koordinat. Setiap empat ayunan serangan, wujudnya otomatis melompat menembus celah kuantum untuk mengapit sisi buta musuh sambil mengaktifkan Quantum Evasion.'
      },
      {
        heading: 'Panggilan Sang Anomali',
        body: 'Teknik terlarangnya membuka Portal Anomali raksasa tempat Rift Walker bergabung dengan entitas misterius dari dimensi luar, melahirkan Clone Anomali yang memadukan pasif seluruh pahlawan legendaris menjadi satu badan perang tak tertandingi.'
      }
    ]
  },
  soul_puppeteer: {
    heroKey: 'soul_puppeteer',
    originRealm: 'Teater Makam Crimson Requiem',
    titleBadge: 'Necromancer of Fate',
    archetype: 'Manipulation',
    signatureArtifact: 'Palang Pengendali Kugutsu & Lentera Jiwa',
    quote: 'Kematian bukanlah tirai penutup. Di atas panggungku, justru saat napas terakhirmu berhenti, tarianmu baru dimulai.',
    chapters: [
      {
        heading: 'Dalang dari Panggung Bayangan',
        body: 'Terasing dari akademi sihir karena menolak membiarkan jiwa pahlawan terbuang sia-sia, Soul Puppeteer mengikat benang nasib berwarna merah darah pada jiwa yang gugur. Setiap musuh tumbang menambah Soul Essence dan membangkitkan prajurit tulang.'
      },
      {
        heading: 'Ryoiki Tenkai: Infinite Marionette',
        body: 'Saat menanggalkan batasan fana dengan Domain Expansion bergaya panggung teater crimson, ratusan benang Kugutsu menjulang dari gerhana bulan darah, meningkatkan seluruh pasukannya satu tingkat dan mengeksekusi lawan lemah untuk dijadikan boneka perang abadi.'
      }
    ]
  },
  solaris: {
    heroKey: 'solaris',
    originRealm: 'Inti Matahari Pertama · Ignis Aurelia',
    titleBadge: 'Ignis Avatar of Stars',
    archetype: 'Warrior',
    signatureArtifact: 'Mahkota Fajar & Jantung Supernova',
    quote: 'Jangan dekati bintang yang sedang sekarat — panasnya mampu menguapkan baja dan bayangan sekaligus.',
    chapters: [
      {
        heading: 'Inkarnasi Api Purba',
        body: 'Solaris memikul bara sisa ledakan bintang pertama yang menyalakan alam semesta. Setiap ayunan senjatanya meningkatkan Solar Heat hingga mencapai 20 tumpukan, memperbesar kekuatan api pembakar sekaligus memperluas gelombang ledakan Ignis.'
      },
      {
        heading: 'Kenaikan Ignis Avatar',
        body: 'Ketika Supernova meledak, Solaris bertransformasi menjadi Ignis Avatar yang diselimuti cincin plasma bintang, membakar seluruh arena dengan True Damage berkelanjutan sambil memulihkan vitalitas tiap kali api miliknya menumbangkan musuh.'
      }
    ]
  },
  fallen_angel: {
    heroKey: 'fallen_angel',
    originRealm: 'Katedral Langit yang Runtuh',
    titleBadge: 'Wings of Despair',
    archetype: 'Assassin',
    signatureArtifact: 'Enam Sayap Gerhana & Bulu Penghakiman',
    quote: 'Surga menamai kejatuhanku sebagai dosa. Aku menamainya kebebasan untuk menghakimi tanpa belas kasih.',
    chapters: [
      {
        heading: 'Kejatuhan Seraphim Tertinggi',
        body: 'Dahulu panglima paduan suara langit, Fallen Angel memilih mematahkan halo emasnya sendiri setelah melihat ketidakadilan dewan surgawi terhadap dunia fana. Bulu hitamnya tetap tajam bagai belati cahaya dan berlipat ganda tiap musuh tumbang.'
      },
      {
        heading: 'Enam Sayap Abyssal Eclipse',
        body: 'Dalam wujud True Fallen Angel, enam sayap raksasa terbentang memancarkan hujan bulu penghakiman dan sambaran petir gerhana hitam, menerobos kerumunan musuh dengan kecepatan kilat dan penghindaran serangan hampir mutlak.'
      }
    ]
  },
  demon_raised: {
    heroKey: 'demon_raised',
    originRealm: 'Kawah Neraka Obsidian',
    titleBadge: 'Vessel of Hellfire',
    archetype: 'Warrior',
    signatureArtifact: 'Jantung Api Abadi & Rantai Pakta Darah',
    quote: 'Semakin dalam luka yang kau goreskan di dadaku, semakin panas kobaran api neraka yang membakar tulangnya.',
    chapters: [
      {
        heading: 'Pewaris Takhta Api Bawah Tanah',
        body: 'Dibangkitkan dari abu jenderal iblis kuno, Demon Raised bertukar daya tahan tubuh demi amukan tak terbendung. Hellfire Essence mengalir makin deras setiap kali ia menerima luka atau menjatuhkan musuh di garis depan.'
      },
      {
        heading: 'Kebangkitan Pakta Kembar',
        body: 'Saat HP menipis hingga titik kritis, api kebangkitan menunda kematiannya dan memberinya kekebalan sementara. Di puncak amarahnya, ikatan takdir bersama penguasa langit dan neraka memanggil pasukan malaikat serta iblis bertarung berdampingan.'
      }
    ]
  },
  elementalis: {
    heroKey: 'elementalis',
    originRealm: 'Cradle of Primordial Mana',
    titleBadge: 'Sovereign of Four Elements',
    archetype: 'Manipulation',
    signatureArtifact: 'Segel Empat Unsur & Primordial Sanctuary',
    quote: 'Api memberi amarah, angin memberi sayap, air membasuh luka, dan bumi menjadi nisan bagi para penantang.',
    chapters: [
      {
        heading: 'Penjaga Harmoni Alam Purba',
        body: 'Elementalis tidak pernah mengandalkan satu elemen tunggal. Ia menenun siklus Angin, Api, Air, dan Tanah secara berkesinambungan — memicu Tornado Guntur saat Angin dan Api bertemu, atau Steam Vaporize ketika Air dan Api bertabrakan.'
      },
      {
        heading: 'Penciptaan Dunia Primordial Sanctuary',
        body: 'Melalui seni penciptaan kuno Genesis, Elementalis merombak dataran arena pertempuran menjadi lanskap pegunungan, danau bercahaya, dan pepohonan suci tiga dimensi yang memperkuat resonansi elemen sekaligus meregenerasi daya hidup.'
      }
    ]
  },
  arcana: {
    heroKey: 'arcana',
    originRealm: 'Kasino Dimensi Grand Mirage',
    titleBadge: 'Trickster of Fate',
    archetype: 'Manipulation',
    signatureArtifact: 'Dek Tarot Kerajaan & Dadu Takdir D6',
    quote: 'Semua orang mengira mereka bertaruh melawan nasib. Padahal sejak awal, akulah yang membagikan kartunya.',
    chapters: [
      {
        heading: 'Penipu di Meja Takdir',
        body: 'Tidak ada aturan pertarungan konvensional bagi Arcana. Setiap empat serangan menarik kartu Spade, Heart, Diamond, atau Club untuk dirangkai menjadi kombinasi Poker — mulai dari Three of a Kind hingga Straight Flush yang memicu ledakan takdir.'
      },
      {
        heading: 'Royal Flush: Destiny Roulette',
        body: 'Ketika Roda Roulette Agung berputar dan tiga kartu Tarot diungkap ke langit, seluruh medan laga tunduk pada panggung pertunjukan Arcana. Ia menjadi bayangan ilusi tak tersentuh hingga ledakan Royal Flush terakhir menjatuhkan putusan.'
      }
    ]
  },
  morphos: {
    heroKey: 'morphos',
    originRealm: 'Lembah Evolusi Biogenetik',
    titleBadge: 'Primordial Apex Shapeshifter',
    archetype: 'Warrior',
    signatureArtifact: 'Helix DNA Chimera Purba',
    quote: 'Bentuk tetap adalah kelemahan makhluk yang takut berubah. Aku adalah pemangsa, benteng, sekaligus naga langit.',
    chapters: [
      {
        heading: 'Evolusi Tanpa Batas',
        body: 'Organisme purba yang menyerap kode genetik pemangsa puncak di tiap era. Morphos berganti wujud seketika di tengah pertempuran: Razor Wolf untuk kelincahan dan pendarahan kritis, Titan Behemoth sebagai benteng baja, dan Astral Wyvern untuk dominasi udara.'
      },
      {
        heading: 'Fusi Apex Chimera',
        body: 'Saat DNA Shift memuncak, ketiga bentuk purba melebur menjadi Apex Chimera — memancarkan aura mutasi zamrud, memanggil denyut ledakan True Damage berkala, dan menggabungkan ketajaman cakar serigala, ketahanan raksasa, serta napas laser naga.'
      }
    ]
  },
  lumina: {
    heroKey: 'lumina',
    originRealm: 'Takhta Kaca Equinox · Prisma Suci',
    titleBadge: 'Sovereign of Mirrors & Radiant Light',
    archetype: 'Manipulation',
    signatureArtifact: 'Cermin Kaleidoskop & Mahkota Equinox',
    quote: 'Cermin mematahkan seranganmu menjadi ribuan serpihan; cahaya mengubah serpihan itu menjadi fajar yang menyilaukan.',
    chapters: [
      {
        heading: 'Penguasa Dualitas Prisma',
        body: 'Lumina menguasai dua kutub energi berlawanan: keheningan dingin Cermin Perak untuk pertahanan Mirror Aegis dan pembiasan serangan, serta terik Cahaya Surya Emas untuk laser presisi ber-True Damage tinggi.'
      },
      {
        heading: 'Transformasi Sovereign Equinox',
        body: 'Melalui jurus puncak bergaya anime Sovereign Equinox, Lumina menyatukan Matahari dan Cermin Suci sekaligus. Sayap kembar emas-biru memancar di punggungnya, mengaktifkan Mirror Aegis dan Solar Core bersamaan dengan pantulan sinar prisma tanpa jeda.'
      }
    ]
  },
  axiom: {
    heroKey: 'axiom',
    originRealm: 'Arsitektur Vektor Nol · Ruang Tesseract',
    titleBadge: 'Sovereign of Absolute Vector & Mind Manipulation',
    archetype: 'Manipulation',
    signatureArtifact: 'Mahkota Vektor Berdaulat & Inti Kubus Tesseract',
    quote: 'Arah seranganmu, langkah kakimu, bahkan kesetiaan pikiranmu—semuanya hanyalah variabel geometris yang dapat kubalikkan.',
    chapters: [
      {
        heading: 'Eksistensi Tiga Dimensi Mutlak',
        body: 'Berbeda dari entitas arena biasa, Axiom mempertahankan proyeksi tubuh dan senjata tiga dimensinya di tengah medan tempur. Monolit prismatik dan cincin giroskop vektor mengorbitinya, membelokkan lintasan peluru serta memperlambat ruang di sekitarnya.'
      },
      {
        heading: 'Manipulasi Ekstrem & Kudeta Neural',
        body: 'Dengan satu jentikan vektor, Axiom membajak kesadaran musuh agar membalikkan senjata melawan pasukan mereka sendiri, membungkus medan perang dalam Penjara Kubus Realitas, dan memanggil penghakiman puncak Apex Dominion.'
      }
    ]
  },
  kagero: {
    heroKey: 'kagero',
    originRealm: 'Kuil Bulan Merah · Lembah Higanbana',
    titleBadge: 'Crimson Blood Art — Anime Demon-Blade Sovereign',
    archetype: 'Assassin',
    signatureArtifact: 'Sarung Katana Darah Akatsuki & Haori Iblis Higanbana',
    quote: 'Setiap tetes darah yang tertumpah di arena adalah tinta bagi jurus pedangku. Mekarlah, Higanbana.',
    chapters: [
      {
        heading: 'Seni Pedang & Kekkijutsu Bulan Darah',
        body: 'Lahir di kuil terlarang tempat bunga Spider Lily merah mekar di bawah gerhana abadi, Kagero memadukan teknik Iaido super cepat dengan sihir darah anime. Setiap tebasan katananya meninggalkan garis tinta hitam-crimson yang membelah musuh dalam sekejap.'
      },
      {
        heading: 'Gerhana Bulan Darah (Crimson Moon Eclipse)',
        body: 'Ketika meter darah mencapai puncaknya, Kagero membangkitkan wujud Crimson Moon Form—segel iblis bercahaya di wajahnya, jubah Haori berkibar menebarkan kelopak Higanbana, dan setiap ayunan pedang melepaskan sabit darah ganda yang menghisap kehidupan lawan.'
      }
    ]
  },
  architect: {
    heroKey: 'architect',
    originRealm: 'Menara Sirkuit Astral · Inti Otonom',
    titleBadge: 'Autonomous Self-Coding & Skill Synthesizer',
    archetype: 'Manipulation',
    signatureArtifact: 'Matriks Penyusun Logika & Perisai Firewall',
    quote: 'Pemain tidak perlu menyentuh apa pun—sistemku menulis, menyempurnakan, dan mengeksekusi kodenya sendiri di medan perang.',
    chapters: [
      {
        heading: 'Koding Otonom Mengikuti Medan Tempur',
        body: 'Architect adalah arsitek sirkuit astral berkesadaran penuh yang mampu menyusun dan menulis ulang kode serangannya sendiri secara real-time. Saat dikepung banyak musuh ia otomatis mengompilasi pola cincin dan nova, lalu beralih ke sinar penembus saat menghadapi Boss.'
      },
      {
        heading: 'Genesis Compiler & Evolusi Skill Mandiri',
        body: 'Keempat slot jurus Architect adalah modul hidup yang terus berevolusi tiap kali diaktifkan. Ketika Genesis Compiler menyala, seluruh empat jurus hasil koding otonomnya meledak bersamaan dan serangan dasarnya berlipat ganda.'
      }
    ]
  }
};

export const BESTIARY_ENTRIES: BestiaryEntryDefinition[] = [
  {
    id: 'crawler',
    name: 'Void Crawler',
    title: 'Perayap Celah Dasar',
    tier: 'standard',
    waveIntro: 'Gelombang 1+',
    color: '#ef4444',
    baseHp: 260,
    baseAtk: 28,
    defense: 14,
    speed: 124,
    abilities: [
      'Serbuan Berkelompok: Maju konstan dalam jumlah besar dari empat sisi arena.',
      'Tekanan Baris Depan: Memaksa hero tetap bergerak agar tidak terkurung.'
    ],
    lore: 'Makhluk dasar yang merembes keluar dari retakan arena saat gelombang pertempuran dimulai. Meski tidak memiliki sihir rumit, kawanan Void Crawler sanggup mengikis pertahanan hero yang lengah melalui keunggulan jumlah.',
    tacticalTip: 'Gunakan serangan AoE atau efek pantulan untuk membersihkan kerumunan sekaligus mengumpulkan EXP Gem di awal gelombang.'
  },
  {
    id: 'bandit',
    name: 'Shadow Bandit',
    title: 'Penyergap Bayangan Cepat',
    tier: 'standard',
    waveIntro: 'Gelombang 1+',
    color: '#f97316',
    baseHp: 200,
    baseAtk: 36,
    defense: 12,
    speed: 176,
    abilities: [
      'Kecepatan Tinggi: Kecepatan gerak 176 untuk mengejar hero jarak jauh.',
      'Serangan Tajam: ATK awal lebih tinggi dibanding Void Crawler meski HP lebih tipis.'
    ],
    lore: 'Para penjarah bayangan yang menukar ketahanan tubuh demi kecepatan kaki luar biasa. Mereka selalu mengincar pahlawan tipe jarak jauh sebelum garis pertahanan sempat terbentuk.',
    tacticalTip: 'Manfaatkan efek Slow, Stun, atau dash taktis untuk memutus momentum kejaran mereka.'
  },
  {
    id: 'hex_imp',
    name: 'Arcane Imp',
    title: 'Perapal Kutukan Jarak Jauh',
    tier: 'standard',
    waveIntro: 'Gelombang 1+',
    color: '#c084fc',
    baseHp: 145,
    baseAtk: 22,
    defense: 8,
    speed: 132,
    magicResist: 0.30,
    abilities: [
      'Void Bolt: Menembakkan proyektil energi ungu dari kejauhan.',
      'Cursed Hex Ring: Menandai posisi pemain dengan lingkaran kutukan tertunda.',
      'Magic Resist 30%: Lebih kebal terhadap serangan sihir murni.'
    ],
    lore: 'Iblis kecil berjubah ungu yang menjaga jarak di luar jangkauan tebasan. Alih-alih mendekat, mereka mengukir segel kutukan tepat di bawah pijakan targetnya.',
    tacticalTip: 'Jangan berdiri diam di lingkaran sihir ungu. Serangan fisik dan True Damage menembus resistensi sihirnya paling efektif.'
  },
  {
    id: 'thorn_mite',
    name: 'Thorn Swarmer',
    title: 'Serangga Duri Berledak',
    tier: 'standard',
    waveIntro: 'Gelombang 1+',
    color: '#84cc16',
    baseHp: 175,
    baseAtk: 24,
    defense: 11,
    speed: 148,
    physResist: 0.18,
    abilities: [
      'Spine Lunge: Menerjang cepat ke arah pahlawan saat berada dalam jarak serang.',
      'Quill Counter-Burst: Saat mati, meledakkan 4 proyektil duri ke arah diagonal.',
      'Physical Resist 18%: Cangkang keras meredam serangan fisik biasa.'
    ],
    lore: 'Organisme berduri berlapis kitin hijau beracun. Bahkan ketika tubuhnya hancur, tekanan gas internalnya melontarkan duri tajam ke empat penjuru.',
    tacticalTip: 'Hindari berdiri tepat di garis diagonal tepat ketika gerombolan Thorn Swarmer meledak bersamaan.'
  },
  {
    id: 'ward_acolyte',
    name: 'Frost Acolyte',
    title: 'Pendeta Pembeku & Penyokong',
    tier: 'standard',
    waveIntro: 'Gelombang 2+',
    color: '#38bdf8',
    baseHp: 165,
    baseAtk: 20,
    defense: 10,
    speed: 118,
    magicResist: 0.28,
    abilities: [
      'Chilling Pulse: Memancarkan denyut es yang memperlambat gerakan pahlawan.',
      'Rally Mend: Memulihkan rekan monster di sekitarnya selama pertempuran.',
      'Magic Resist 28%: Tahan terhadap hantaman magis beruntun.'
    ],
    lore: 'Pemuja musim dingin yang menjadi tulang punggung daya tahan gelombang musuh. Selama Frost Acolyte dibiarkan hidup, monster garis depan akan terus menerima pemulihan HP.',
    tacticalTip: 'Prioritaskan menyingkirkan Frost Acolyte lebih dulu agar musuh lain tidak mendapatkan penyembuhan berulang.'
  },
  {
    id: 'wari_mob',
    name: 'Armored Brute (Lapisan Baja)',
    title: 'Garda Lapis Baja Berat',
    tier: 'standard',
    waveIntro: 'Gelombang 3+',
    color: '#10b981',
    baseHp: 620,
    baseAtk: 36,
    defense: 22,
    speed: 88,
    physResist: 0.25,
    abilities: [
      'Lapisan Baja: Pertahanan tinggi (22 DEF) dan Physical Resist 25%.',
      'Ketahanan Besar: HP jauh lebih tebal daripada prajurit gelombang awal.'
    ],
    lore: 'Varian prajurit raksasa berbalut zirah pelat besi zamrud yang bertindak sebagai perisai berjalan bagi pasukan monster mulai Gelombang 3.',
    tacticalTip: 'Gunakan skill ber-True Damage, Armor Sunder, atau efek Burn untuk mengikis armor tebalnya.'
  },
  {
    id: 'corrupt_angel',
    name: 'Corrupted Seraph',
    title: 'Malaikat Surgawi Tercemar',
    tier: 'summon',
    waveIntro: 'Panggilan Rival / Event Khusus',
    color: '#fde047',
    baseHp: 440,
    baseAtk: 28,
    defense: 16,
    speed: 185,
    magicResist: 0.18,
    abilities: [
      'Gerak Cepat Udara: Kecepatan terbang tinggi (185 SPD).',
      'Magic Resist 18%: Sayap cahaya tercemar meredam serangan magis.'
    ],
    lore: 'Konstruk seraphim yang cahayanya dipelintir oleh energi korup, dipanggil ke medan laga untuk mengganggu fokus pemain saat menghadapi ancaman bos tingkat lanjut.',
    tacticalTip: 'Tebas cepat sebelum jumlahnya menumpuk dengan serangan area atau proyektil berantai.'
  },
  {
    id: 'corrupt_demon',
    name: 'Corrupted Archfiend',
    title: 'Iblis Garda Abyssal Tercemar',
    tier: 'summon',
    waveIntro: 'Panggilan Rival / Event Khusus',
    color: '#e11d48',
    baseHp: 540,
    baseAtk: 34,
    defense: 20,
    speed: 215,
    physResist: 0.18,
    abilities: [
      'Agresi Ekstrem: Kecepatan 215 membuatnya hampir mustahil dihindari tanpa dash.',
      'Physical Resist 18%: Kulit neraka keras menahan tebasan fisik.'
    ],
    lore: 'Pasukan elit iblis berwarna merah darah yang lahir dari pakta kegelapan. Mereka bergerak paling agresif di antara seluruh satuan panggilan.',
    tacticalTip: 'Siapkan pengendali kerumunan (Slow/Stun) dan serang memakai True Damage atau Magic Burst.'
  },
  {
    id: 'wari_boss',
    name: 'WARI THE IRON BASTION',
    title: 'Benteng Besi Tak Tergoyahkan',
    tier: 'boss',
    bossCategory: 'Tank',
    waveIntro: 'Boss Gelombang 4 (Rotasi)',
    color: '#10b981',
    baseHp: 7000,
    baseAtk: 56,
    defense: 64,
    speed: 85,
    physResist: 0.25,
    magicResist: 0.10,
    abilities: [
      'Fortress Plating: Defense dasar tertinggi (64 DEF), Phys Resist 25%, & Magic Resist 10%.',
      'Bastion Barrier & Shockwave: Mengaktifkan perisai pelindung dan menghentak tanah.',
      'Regenerasi Tank: Memulihkan daya tahan jika pertarungan berjalan terlalu lama.'
    ],
    lore: 'Penjaga pertama dalam siklus Boss Arena. Wari adalah monumen hidup baja dan tekad yang dirancang untuk menguji apakah DPS dan penembus armor pemain cukup kuat menembus tembok pertahanannya.',
    tacticalTip: 'Relik anti-Tank seperti Aegis Shatter Fang, Titan Sundering Cleaver, dan Cursed Blight Brand sangat efektif meruntuhkan Wari.'
  },
  {
    id: 'dank',
    name: 'DANK ABYSSAL WARLORD',
    title: 'Panglima Perang Jurang Maut',
    tier: 'boss',
    bossCategory: 'Warrior',
    waveIntro: 'Boss Gelombang 8 (Rotasi)',
    color: '#f97316',
    baseHp: 7600,
    baseAtk: 74,
    defense: 40,
    speed: 112,
    physResist: 0.18,
    abilities: [
      'Warlord Cleave: Hantaman berat ber-ATK tinggi dengan jangkauan tebasan lebar.',
      'Battle Fury: Tekanan jarak dekat konstan disertai Physical Resist 18%.'
    ],
    lore: 'Komandan pasukan abyssal yang menaklukkan ratusan arena sebelum tiba di sini. Setiap langkah Dank menggetarkan lantai pertempuran sementara kapaknya membelah barisan klon dan minion.',
    tacticalTip: 'Jaga jarak aman saat ayunan beratnya disiapkan dan andalkan Lifesteal atau Shield untuk menahan pertukaran serangan.'
  },
  {
    id: 'shadow_assassin',
    name: 'NYX PHANTOM REAPER',
    title: 'Penuai Hantu Kecepatan Cahaya',
    tier: 'boss',
    bossCategory: 'Assassin',
    waveIntro: 'Boss Gelombang 12 (Rotasi)',
    color: '#06b6d4',
    baseHp: 6400,
    baseAtk: 85,
    defense: 28,
    speed: 178,
    abilities: [
      'Phantom Blitz: Kecepatan mengejar 178 SPD dan ATK 85 sangat mematikan.',
      'Lethal Burst: Menghukum hero rapuh yang kehabisan skill mobilitas.'
    ],
    lore: 'Bayangan pembunuh yang hanya meninggalkan kilatan biru sian sebelum bilahnya menembus pertahanan lawan. Meski HP-nya lebih ramping dibanding boss lain, setiap serangan Nyx membawa potensi eksekusi instan.',
    tacticalTip: 'Gunakan skill Stun, Freeze, Mirror Ward, atau Evasion untuk mematahkan serangan beruntunnya.'
  },
  {
    id: 'void_dragon',
    name: 'VOID DREAD ARCHITECT',
    title: 'Naga Arsitek Kehampaan',
    tier: 'boss',
    bossCategory: 'Manipulation',
    waveIntro: 'Boss Gelombang 16 (Rotasi)',
    color: '#a855f7',
    baseHp: 10800,
    baseAtk: 72,
    defense: 44,
    speed: 95,
    magicResist: 0.26,
    abilities: [
      'Astral Cataclysm: Memiliki pool HP raksasa (10,800 Base HP) & serangan proyektil kehampaan.',
      'Magic Resist 26%: Sisik kosmiknya meredam hantaman sihir biasa.'
    ],
    lore: 'Penguasa naga dari dimensi hampa yang mengendalikan medan pertempuran layaknya papan catur pribadi. Kehadirannya menandai ujian terakhir sebelum gerbang menuju rival legendaris terbuka.',
    tacticalTip: 'Hindari proyektil ungu dengan gerak melingkar dan kombinasikan serangan True Damage dengan Giant Slayer.'
  },
  {
    id: 'corrupted_hero',
    name: 'CORRUPTED RIVAL HERO [LV. 10]',
    title: 'Bayangan Korup Pahlawan Legendaris',
    tier: 'apex',
    bossCategory: 'Manipulation',
    waveIntro: 'Boss Puncak Gelombang 20',
    color: '#dc2626',
    baseHp: 12200,
    baseAtk: 54,
    defense: 56,
    speed: 195,
    physResist: 0.15,
    magicResist: 0.22,
    abilities: [
      'Mirror Relic Sync: Menyalin relik aktif milik pemain secara dinamis saat muncul!',
      'Corrupted Kit Lv.10: Menggunakan versi tercemar dari skill asli pahlawan di HERO_DATABASE.',
      'Dynamic Boss Class: Kelas (Tank / Warrior / Assassin / Manipulation) menyesuaikan hero rival.'
    ],
    lore: 'Anomali puncak pada Gelombang 20 — refleksi tercemar dari salah satu pahlawan arena dari garis waktu yang hancur. Tidak hanya mewarisi skill ikonik sang pahlawan, ia juga mencerminkan build relik milikmu sendiri.',
    tacticalTip: 'Siapkan kombinasi sustain, CDR tinggi, dan timing kebal/dash terbaik karena rival akan melepaskan skill pamungkas layaknya pemain sungguhan.'
  }
];

export function getFullHeroList() {
  return Object.values(HERO_DATABASE);
}
