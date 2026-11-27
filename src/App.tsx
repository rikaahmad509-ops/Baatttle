/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BossCategory,
  CombatStats,
  EnemyAffix,
  GameMode,
  GameState,
  HeroKey,
  PlayerStats,
  SkillDefinition
} from './types/game';
import { HERO_DATABASE } from './game/constants';
import { GameEngine } from './game/GameEngine';
import { pickAutoUpgrade } from './game/upgradePicker';
import { sounds } from './audio/soundManager';
import { TitleScreen } from './components/TitleScreen';
import { CodexModal } from './components/CodexModal';
import { CharacterSelectModal } from './components/CharacterSelectModal';
import { SkillSelectModal } from './components/SkillSelectModal';
import { GameHud, UpgradeToastInfo } from './components/GameHud';
import { PracticeLabPanel } from './components/PracticeLabPanel';
import { BattleStatsPreviewModal } from './components/BattleStatsPreviewModal';
import { LevelUpModal } from './components/LevelUpModal';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';
import { AnomalyCutsceneModal } from './components/AnomalyCutsceneModal';
import { MorphosChimera2DAnimeCutscene } from './components/MorphosChimera2DAnimeCutscene';
import { ValkyrieFrost2DAnimeCutscene } from './components/ValkyrieFrost2DAnimeCutscene';
import { TravelerTimeStop3DCutscene } from './components/TravelerTimeStop3DCutscene';
import { ArcanaTarot3DCutscene } from './components/ArcanaTarot3DCutscene';
import { SolarisSupernova3DCutscene } from './components/SolarisSupernova3DCutscene';
import { DimensionJudgeVoidArbiter3DCutscene } from './components/DimensionJudgeVoidArbiter3DCutscene';
import { FallenAngelAscension3DCutscene } from './components/FallenAngelAscension3DCutscene';
import { ElementalisGenesis3DCutscene } from './components/ElementalisGenesis3DCutscene';
import { ElementalisSanctuary3DMap } from './components/ElementalisSanctuary3DMap';
import { DemonRaisedHeavenHell3DCutscene } from './components/DemonRaisedHeavenHell3DCutscene';
import {
  DemonRaised3DMinionSync,
  DemonRaised3DSyncData,
  DemonRaisedHeavenHell3DMap
} from './components/DemonRaisedHeavenHell3DMap';
import { DemonisVoidJudgement3DCutscene } from './components/DemonisVoidJudgement3DCutscene';
import { MonkeyKingGreatSage3DCutscene } from './components/MonkeyKingGreatSage3DCutscene';
import { SoulPuppeteerAnime3DCutscene } from './components/SoulPuppeteerAnime3DCutscene';
import { LuminaEquinoxAnime3DCutscene } from './components/LuminaEquinoxAnime3DCutscene';
import { Axiom3DBattleLayer } from './components/Axiom3DBattleLayer';
import { AxiomManipulation3DCutscene } from './components/AxiomManipulation3DCutscene';
import { KageroBlood2DAnimeCutscene } from './components/KageroBlood2DAnimeCutscene';
import { EasterEggChronicleCutscene } from './components/EasterEggChronicleCutscene';

interface BossHudState {
  name: string;
  hp: number;
  maxHp: number;
  category?: BossCategory;
  shield?: number;
  physResist?: number;
  magicResist?: number;
  mirroredRelicsCount?: number;
  affixes?: EnemyAffix[];
}

const createFallbackPlayerStats = (heroKey: HeroKey): PlayerStats => {
  const cfg = HERO_DATABASE[heroKey];
  return {
    hp: cfg.hp,
    maxHp: cfg.hp,
    atk: cfg.atk,
    atkSpeed: cfg.atkSpeed,
    critChance: cfg.critChance,
    critDmg: cfg.critDmg,
    speed: cfg.speed,
    range: cfg.range,
    defense: cfg.defense,
    cdr: 0,
    evasion: 0,
    lifesteal: 0,
    level: 1,
    exp: 0,
    maxExp: 100,
    demonisStacks: 0,
    demonisFCD: 0,
    travelerStance: 'sword',
    travelerTimeStacks: 0,
    travelerParadoxHits: 0,
    travelerRewindReady: false,
    travelerKillsRecharge: 0,
    isTimeStopActive: false,
    timeStopTimer: 0,
    rageTimer: 0,
    swiftTimer: 0,
    monkeyWeaponActive: false,
    varpScytheStacks: 0,
    burstCritActive: false,
    fallenWingsActive: false,
    magicDestroActive: false,
    warArmorActive: false,
    warArmorBonusDef: 0,
    judgeDomainTimer: 0,
    travelerFieldTimer: 0,
    soulMagnetRange: 140,
    judgeResonance: 0,
    judgeMeleeFormTimer: 0,
    judgeCutsceneTimer: 0,
    judgeBladeSpinTimer: 0,
    trueFallenAngelTimer: 0,
    angelCutsceneTimer: 0,
    angelDemonTimer: 0,
    angelDemonCutsceneTimer: 0,
    angelCount: 0,
    demonCount: 0,
    anomalyCloneActive: false,
    demonisShadowArmorTimer: 0,
    demonisUltimateShadowArmor: false,
    demonisBlackholeArmorTimer: 0,
    demonisNebulasArmorTimer: 0,
    arcanaHand: [],
    arcanaDiceRoll: 6,
    arcanaDiceTimer: 0,
    arcanaMiracleTimer: 0,
    arcanaRouletteTimer: 0,
    arcanaFlushTimer: 0,
    arcanaHitCount: 0,
    arcanaVanishTimer: 0,
    arcanaVanishCd: 0,
    arcanaDashBuffTimer: 0,
    arcanaCutsceneTimer: 0,
    valkyrieMirrorsCount: 0,
    valkyrieStasisTimer: 0,
    valkyrieEpochTimer: 0,
    valkyrieCutsceneTimer: 0,
    morphosForm: 'wolf',
    morphosEvoStacks: 0,
    morphosEvoTimer: 0,
    morphosChimeraTimer: 0,
    morphosCutsceneTimer: 0,
    travelerCutsceneTimer: 0,
    solarisCutsceneTimer: 0,
    elementalisCutsceneTimer: 0,
    elementalisRealmTimer: 0,
    demonisCutsceneTimer: 0,
    demonisCutsceneTargetName: 'MUSUH',
    demonisCutsceneTargetIsBoss: false,
    monkeySageStacks: 0,
    monkeySageTimer: 0,
    monkeyCutsceneTimer: 0,
    puppetCutsceneTimer: 0,
    puppetDomainTimer: 0,
    luminaForm: 'mirror',
    luminaCharges: 0,
    luminaMirrorsCount: 0,
    luminaAspectSurgeTimer: 0,
    luminaCutsceneTimer: 0,
    luminaFusionTimer: 0,
    axiomStacks: 0,
    axiomDominatedCount: 0,
    axiomDeflectReady: true,
    axiomDominionTimer: 0,
    axiomCutsceneTimer: 0,
    kageroBloodStacks: 0,
    kageroBloodMarkCount: 0,
    kageroAwakenTimer: 0,
    kageroCutsceneTimer: 0,
    architectNodes: 0,
    architectOverclockTimer: 0,
    architectCustomAttackName: 'Prisma Pelacak',
    isCutsceneActive: false,
    skillCDs: cfg.skills.map((s) => (s.id === 'rw_s5' ? s.cd : 0)),
    skillMaxCDs: cfg.skills.map((s) => s.cd)
  };
};

const INITIAL_COMBAT_STATS: CombatStats = {
  kills: 0,
  wave: 1,
  waveDr: 0,
  enemiesRemaining: 0,
  timeSurvived: 0,
  damageDealt: 0,
  highestCrit: 0,
  damageTaken: 0,
  level: 1,
  dps: 0,
  dpsHistory: []
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [gameMode, setGameMode] = useState<GameMode>('arena');
  const [selectedHero, setSelectedHero] = useState<HeroKey>('monkey');
  const [activeSkills, setActiveSkills] = useState<SkillDefinition[]>(() => [...HERO_DATABASE.monkey.skills]);

  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => createFallbackPlayerStats('monkey'));
  const [combatStats, setCombatStats] = useState<CombatStats>(INITIAL_COMBAT_STATS);
  const [bossState, setBossState] = useState<BossHudState | null>(null);
  const [finalStats, setFinalStats] = useState<CombatStats>(INITIAL_COMBAT_STATS);
  const [levelUpLevel, setLevelUpLevel] = useState<number>(2);

  const [autoPilot, setAutoPilot] = useState<boolean>(true);
  const [autoCastSkills, setAutoCastSkills] = useState<boolean>(true);
  const [autoUpgrade, setAutoUpgrade] = useState<boolean>(false);
  const autoUpgradeRef = useRef<boolean>(false);
  const [pendingLevelUps, setPendingLevelUps] = useState<number[]>([]);
  const pendingLevelUpsRef = useRef<number[]>([]);
  const upgradesMinimizedRef = useRef<boolean>(false);
  const [upgradeToast, setUpgradeToast] = useState<UpgradeToastInfo | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => sounds.getMuted());

  // Practice Lab reactive snapshots
  const [practiceAttributeCounts, setPracticeAttributeCounts] = useState<Map<string, number>>(() => new Map());
  const [practiceUnlockedTraits, setPracticeUnlockedTraits] = useState<Set<string>>(() => new Set());
  const [practiceWave, setPracticeWave] = useState<number>(1);
  const [practiceGodMode, setPracticeGodMode] = useState<boolean>(true);
  const [practiceAutoHealDummy, setPracticeAutoHealDummy] = useState<boolean>(true);
  const [isSimPaused, setIsSimPaused] = useState<boolean>(false);
  const [isFullCombatMode, setIsFullCombatMode] = useState<boolean>(false);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState<boolean>(false);
  const [isStatsPreviewOpen, setIsStatsPreviewOpen] = useState<boolean>(false);
  const [showAnomalyCutscene, setShowAnomalyCutscene] = useState<boolean>(false);
  const [showEasterEggCutscene, setShowEasterEggCutscene] = useState<boolean>(false);
  const easterEggResumeEngineRef = useRef<boolean>(false);
  const [traveler3DFallback, setTraveler3DFallback] = useState<boolean>(false);
  const [arcana3DFallback, setArcana3DFallback] = useState<boolean>(false);
  const [solaris3DFallback, setSolaris3DFallback] = useState<boolean>(false);
  const [judge3DFallback, setJudge3DFallback] = useState<boolean>(false);
  const [angel3DFallback, setAngel3DFallback] = useState<boolean>(false);
  const [elementalis3DFallback, setElementalis3DFallback] = useState<boolean>(false);
  const [elementalis3DMapFallback, setElementalis3DMapFallback] = useState<boolean>(false);
  const [angelDemon3DFallback, setAngelDemon3DFallback] = useState<boolean>(false);
  const [demonRaised3DMapFallback, setDemonRaised3DMapFallback] = useState<boolean>(false);
  const [demonis3DFallback, setDemonis3DFallback] = useState<boolean>(false);
  const [monkey3DFallback, setMonkey3DFallback] = useState<boolean>(false);
  const [puppet3DFallback, setPuppet3DFallback] = useState<boolean>(false);
  const [lumina3DFallback, setLumina3DFallback] = useState<boolean>(false);
  const [axiom3DFallback, setAxiom3DFallback] = useState<boolean>(false);
  const [axiom3DHeroFallback, setAxiom3DHeroFallback] = useState<boolean>(false);

  const syncEngineSnapshots = useCallback((engine: GameEngine) => {
    setSelectedHero(engine.heroKey);
    setActiveSkills([...engine.activeSkills]);
    setPlayerStats({ ...engine.player, skillCDs: [...engine.player.skillCDs], skillMaxCDs: [...engine.player.skillMaxCDs] });
    setPracticeAttributeCounts(new Map(engine.attributeCounts));
    setPracticeUnlockedTraits(new Set(engine.unlockedTraits));
    setPracticeWave(engine.practiceWaveLevel);
    setPracticeGodMode(engine.practiceGodMode);
    setPracticeAutoHealDummy(engine.practiceAutoHealDummy);
    setIsSimPaused(engine.isPaused);
  }, []);

  const resetUpgradeQueue = useCallback(() => {
    pendingLevelUpsRef.current = [];
    setPendingLevelUps([]);
    upgradesMinimizedRef.current = false;
    setUpgradeToast(null);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }, []);

  const showAutoUpgradeToast = useCallback((info: UpgradeToastInfo) => {
    setUpgradeToast(info);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setUpgradeToast(null);
      toastTimerRef.current = null;
    }, 3400);
  }, []);

  const applyAutoUpgradesForLevels = useCallback(
    (levels: number[], keepPaused: boolean = false) => {
      const engine = engineRef.current;
      if (!engine || levels.length === 0) return;

      let lastChoice: ReturnType<typeof pickAutoUpgrade> | null = null;
      let lastLevel = levels[levels.length - 1];

      for (const lvl of levels) {
        const choice = pickAutoUpgrade({
          heroKey: engine.heroKey,
          level: lvl,
          activeSkillIds: engine.activeSkills.map((s) => s.id),
          unlockedTraits: engine.unlockedTraits,
          acquiredAttributes: engine.acquiredAttributes
        });
        engine.applySkillUpgrade(choice.traitId);
        engine.applyAttribute(choice.attr.id);
        lastChoice = choice;
        lastLevel = lvl;
      }

      engine.isPaused = keepPaused;
      pendingLevelUpsRef.current = [];
      setPendingLevelUps([]);
      upgradesMinimizedRef.current = false;
      syncEngineSnapshots(engine);

      if (lastChoice) {
        showAutoUpgradeToast({
          level: lastLevel,
          traitTitle: lastChoice.traitTitle,
          attrTitle: lastChoice.attr.title,
          count: levels.length
        });
      }
    },
    [showAutoUpgradeToast, syncEngineSnapshots]
  );

  const destroyEngine = useCallback(() => {
    setShowAnomalyCutscene(false);
    setIsFullCombatMode(false);
    setIsStatsPreviewOpen(false);
    setTraveler3DFallback(false);
    setArcana3DFallback(false);
    setSolaris3DFallback(false);
    setJudge3DFallback(false);
    setAngel3DFallback(false);
    setElementalis3DFallback(false);
    setElementalis3DMapFallback(false);
    setAngelDemon3DFallback(false);
    setDemonRaised3DMapFallback(false);
    setDemonis3DFallback(false);
    setMonkey3DFallback(false);
    setPuppet3DFallback(false);
    setLumina3DFallback(false);
    setAxiom3DFallback(false);
    setAxiom3DHeroFallback(false);
    resetUpgradeQueue();
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
  }, [resetUpgradeQueue]);

  const handleToggleMute = useCallback(() => {
    const nextMuted = sounds.toggleMute();
    setIsMuted(nextMuted);
  }, []);

  const handleToggleFullCombatMode = useCallback(() => {
    setIsFullCombatMode((prev) => !prev);
  }, []);

  const handleToggleNativeFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // Browser or iframe policy may disallow OS fullscreen; in-app Full Combat Mode remains active.
    }
  }, []);

  const handleToggleStatsPreview = useCallback(() => {
    setIsStatsPreviewOpen((prev) => {
      const next = !prev;
      if (next && engineRef.current) {
        syncEngineSnapshots(engineRef.current);
      }
      return next;
    });
  }, [syncEngineSnapshots]);

  const handleCompleteAnomalyCutscene = useCallback(() => {
    setShowAnomalyCutscene(false);
    if (engineRef.current && gameState === 'PLAYING') {
      engineRef.current.isPaused = false;
      setIsSimPaused(false);
    }
  }, [gameState]);

  const handleSkipMorphosCutscene = useCallback(() => {
    engineRef.current?.skipMorphosCutscene();
  }, []);

  const handleSkipValkyrieCutscene = useCallback(() => {
    engineRef.current?.skipValkyrieCutscene();
  }, []);

  const handleSkipTravelerCutscene = useCallback(() => {
    engineRef.current?.skipTravelerCutscene();
  }, []);

  const handleSkipArcanaCutscene = useCallback(() => {
    engineRef.current?.skipArcanaCutscene();
  }, []);

  const handleSkipSolarisCutscene = useCallback(() => {
    engineRef.current?.skipSolarisCutscene();
  }, []);

  const handleSkipJudgeCutscene = useCallback(() => {
    engineRef.current?.skipJudgeCutscene();
  }, []);

  const handleSkipAngelCutscene = useCallback(() => {
    engineRef.current?.skipAngelCutscene();
  }, []);

  const handleSkipElementalisCutscene = useCallback(() => {
    engineRef.current?.skipElementalisCutscene();
  }, []);

  const handleSkipAngelDemonCutscene = useCallback(() => {
    engineRef.current?.skipAngelDemonCutscene();
  }, []);

  const handleSkipDemonisCutscene = useCallback(() => {
    engineRef.current?.skipDemonisCutscene();
  }, []);

  const handleSkipMonkeyCutscene = useCallback(() => {
    engineRef.current?.skipMonkeyCutscene();
  }, []);

  const handleSkipPuppetCutscene = useCallback(() => {
    engineRef.current?.skipPuppetCutscene();
  }, []);

  const handleSkipLuminaCutscene = useCallback(() => {
    engineRef.current?.skipLuminaCutscene();
  }, []);

  const handleSkipAxiomCutscene = useCallback(() => {
    engineRef.current?.skipAxiomCutscene();
  }, []);

  const handleSkipKageroCutscene = useCallback(() => {
    engineRef.current?.skipKageroCutscene();
  }, []);

  useEffect(() => {
    if ((playerStats.travelerCutsceneTimer ?? 0) <= 0 && traveler3DFallback) {
      setTraveler3DFallback(false);
    }
  }, [playerStats.travelerCutsceneTimer, traveler3DFallback]);

  useEffect(() => {
    if ((playerStats.arcanaCutsceneTimer ?? 0) <= 0 && arcana3DFallback) {
      setArcana3DFallback(false);
    }
  }, [playerStats.arcanaCutsceneTimer, arcana3DFallback]);

  useEffect(() => {
    if ((playerStats.solarisCutsceneTimer ?? 0) <= 0 && solaris3DFallback) {
      setSolaris3DFallback(false);
    }
  }, [playerStats.solarisCutsceneTimer, solaris3DFallback]);

  useEffect(() => {
    if ((playerStats.judgeCutsceneTimer ?? 0) <= 0 && judge3DFallback) {
      setJudge3DFallback(false);
    }
  }, [playerStats.judgeCutsceneTimer, judge3DFallback]);

  useEffect(() => {
    if ((playerStats.angelCutsceneTimer ?? 0) <= 0 && angel3DFallback) {
      setAngel3DFallback(false);
    }
  }, [playerStats.angelCutsceneTimer, angel3DFallback]);

  useEffect(() => {
    if ((playerStats.elementalisCutsceneTimer ?? 0) <= 0 && elementalis3DFallback) {
      setElementalis3DFallback(false);
    }
  }, [playerStats.elementalisCutsceneTimer, elementalis3DFallback]);

  useEffect(() => {
    if ((playerStats.angelDemonCutsceneTimer ?? 0) <= 0 && angelDemon3DFallback) {
      setAngelDemon3DFallback(false);
    }
  }, [playerStats.angelDemonCutsceneTimer, angelDemon3DFallback]);

  useEffect(() => {
    if ((playerStats.demonisCutsceneTimer ?? 0) <= 0 && demonis3DFallback) {
      setDemonis3DFallback(false);
    }
  }, [playerStats.demonisCutsceneTimer, demonis3DFallback]);

  useEffect(() => {
    if ((playerStats.monkeyCutsceneTimer ?? 0) <= 0 && monkey3DFallback) {
      setMonkey3DFallback(false);
    }
  }, [playerStats.monkeyCutsceneTimer, monkey3DFallback]);

  useEffect(() => {
    if ((playerStats.puppetCutsceneTimer ?? 0) <= 0 && puppet3DFallback) {
      setPuppet3DFallback(false);
    }
  }, [playerStats.puppetCutsceneTimer, puppet3DFallback]);

  useEffect(() => {
    if ((playerStats.luminaCutsceneTimer ?? 0) <= 0 && lumina3DFallback) {
      setLumina3DFallback(false);
    }
  }, [playerStats.luminaCutsceneTimer, lumina3DFallback]);

  useEffect(() => {
    if ((playerStats.axiomCutsceneTimer ?? 0) <= 0 && axiom3DFallback) {
      setAxiom3DFallback(false);
    }
  }, [playerStats.axiomCutsceneTimer, axiom3DFallback]);

  const handleOpenPendingUpgrades = useCallback(() => {
    const engine = engineRef.current;
    const queue = pendingLevelUpsRef.current;
    if (!engine || queue.length === 0 || showAnomalyCutscene) return;
    upgradesMinimizedRef.current = false;
    engine.isPaused = true;
    setIsSimPaused(true);
    setLevelUpLevel(queue[0]);
    setGameState('LEVEL_UP');
  }, [showAnomalyCutscene]);

  const handleToggleAutoUpgrade = useCallback(() => {
    const next = !autoUpgradeRef.current;
    autoUpgradeRef.current = next;
    setAutoUpgrade(next);
    if (next && pendingLevelUpsRef.current.length > 0 && engineRef.current) {
      applyAutoUpgradesForLevels([...pendingLevelUpsRef.current], false);
      setGameState('PLAYING');
    }
  }, [applyAutoUpgradesForLevels]);

  const startBattle = useCallback(
    (heroKey: HeroKey, skills: SkillDefinition[], mode: GameMode) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      destroyEngine();

      const engine = new GameEngine(canvas, heroKey);
      engine.setPracticeMode(mode === 'practice');
      engine.setHero(heroKey, skills);
      engine.autoPilot = autoPilot;
      engine.autoCastSkills = autoCastSkills;

      engine.onStatsUpdate = (stats, player, boss) => {
        setCombatStats(stats);
        setPlayerStats({
          ...player,
          skillCDs: [...player.skillCDs],
          skillMaxCDs: [...player.skillMaxCDs]
        });
        setBossState(boss);
      };

      engine.onSkillsChange = (nextSkills) => {
        setActiveSkills([...nextSkills]);
      };

      engine.onLevelUpTrigger = (level) => {
        if (autoUpgradeRef.current) {
          applyAutoUpgradesForLevels([level], false);
          return;
        }
        const nextQueue = [...pendingLevelUpsRef.current, level];
        pendingLevelUpsRef.current = nextQueue;
        setPendingLevelUps(nextQueue);

        if (upgradesMinimizedRef.current || engine.player.isCutsceneActive) {
          engine.isPaused = false;
          setIsSimPaused(false);
          return;
        }

        setLevelUpLevel(nextQueue[0]);
        setGameState('LEVEL_UP');
      };

      engine.onGameOverTrigger = (stats) => {
        setFinalStats(stats);
        setIsStatsPreviewOpen(false);
        setGameState('GAME_OVER');
      };

      engine.onVictoryTrigger = (stats) => {
        setFinalStats(stats);
        setIsStatsPreviewOpen(false);
        setGameState('VICTORY');
      };

      engine.onAnomalyCutsceneTrigger = () => {
        setIsSimPaused(true);
        setShowAnomalyCutscene(true);
      };

      engineRef.current = engine;
      engine.handleResize();
      engine.start();
      syncEngineSnapshots(engine);
      setCombatStats(INITIAL_COMBAT_STATS);
      setBossState(null);
      setShowAnomalyCutscene(false);
      setIsStatsPreviewOpen(false);
      setGameState('PLAYING');
    },
    [applyAutoUpgradesForLevels, autoCastSkills, autoPilot, destroyEngine, syncEngineSnapshots]
  );

  // Keep canvas sized properly to viewport & sync native fullscreen state
  useEffect(() => {
    const handleResize = () => {
      engineRef.current?.handleResize();
    };
    const handleFullscreenChange = () => {
      setIsNativeFullscreen(Boolean(document.fullscreenElement));
      engineRef.current?.handleResize();
    };
    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const openEasterEggCutscene = useCallback(() => {
    if (showEasterEggCutscene) return;
    const engine = engineRef.current;
    if (engine && !engine.isPaused && !engine.isGameOver) {
      easterEggResumeEngineRef.current = true;
      engine.isPaused = true;
      setIsSimPaused(true);
    } else {
      easterEggResumeEngineRef.current = false;
    }
    sounds.playTimeStop();
    setShowEasterEggCutscene(true);
  }, [showEasterEggCutscene]);

  const handleCompleteEasterEggCutscene = useCallback((completedNaturally: boolean) => {
    setShowEasterEggCutscene(false);
    const engine = engineRef.current;
    if (engine) {
      if (completedNaturally && !engine.isGameOver) {
        engine.applyEasterEggChronicleBlessing();
      }
      if (easterEggResumeEngineRef.current) {
        engine.isPaused = false;
        setIsSimPaused(false);
      }
    }
    easterEggResumeEngineRef.current = false;
  }, []);

  // Secret keyboard triggers for 3-minute Easter Egg cutscene (Konami Arrows or 7-7-7)
  useEffect(() => {
    const konamiSeq = [
      'ArrowUp',
      'ArrowUp',
      'ArrowDown',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ArrowLeft',
      'ArrowRight'
    ];
    let konamiIdx = 0;
    let sevenCount = 0;
    let lastSecretTs = 0;

    const handleSecretKey = (e: KeyboardEvent) => {
      if (showEasterEggCutscene) return;
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;

      const now = Date.now();
      if (now - lastSecretTs > 3500) {
        konamiIdx = 0;
        sevenCount = 0;
      }
      lastSecretTs = now;

      if (e.key === '7') {
        sevenCount++;
        if (sevenCount >= 3) {
          sevenCount = 0;
          konamiIdx = 0;
          openEasterEggCutscene();
          return;
        }
      } else {
        sevenCount = 0;
      }

      if (e.key === konamiSeq[konamiIdx]) {
        konamiIdx++;
        if (konamiIdx >= konamiSeq.length) {
          konamiIdx = 0;
          openEasterEggCutscene();
        }
      } else if (e.key === konamiSeq[0]) {
        konamiIdx = 1;
      } else if (e.key !== '7') {
        konamiIdx = 0;
      }
    };

    window.addEventListener('keydown', handleSecretKey);
    return () => window.removeEventListener('keydown', handleSecretKey);
  }, [openEasterEggCutscene, showEasterEggCutscene]);

  // Global keyboard shortcuts (Escape pause, M mute, F full combat mode, I/Tab stats preview)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;

      const cutsceneActive =
        showEasterEggCutscene ||
        showAnomalyCutscene ||
        (playerStats.morphosCutsceneTimer ?? 0) > 0 ||
        (playerStats.travelerCutsceneTimer ?? 0) > 0 ||
        (playerStats.arcanaCutsceneTimer ?? 0) > 0 ||
        (playerStats.solarisCutsceneTimer ?? 0) > 0 ||
        (playerStats.judgeCutsceneTimer ?? 0) > 0 ||
        (playerStats.angelCutsceneTimer ?? 0) > 0 ||
        (playerStats.elementalisCutsceneTimer ?? 0) > 0 ||
        (playerStats.angelDemonCutsceneTimer ?? 0) > 0 ||
        (playerStats.demonisCutsceneTimer ?? 0) > 0 ||
        (playerStats.monkeyCutsceneTimer ?? 0) > 0 ||
        (playerStats.puppetCutsceneTimer ?? 0) > 0 ||
        (playerStats.luminaCutsceneTimer ?? 0) > 0 ||
        (playerStats.axiomCutsceneTimer ?? 0) > 0 ||
        (playerStats.kageroCutsceneTimer ?? 0) > 0 ||
        (playerStats.valkyrieCutsceneTimer ?? 0) > 0;

      if (e.key === 'm' || e.key === 'M') {
        handleToggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        if (!cutsceneActive && gameState === 'PLAYING') {
          handleToggleFullCombatMode();
        }
      } else if (e.key === 'i' || e.key === 'I' || e.key === 'Tab') {
        if (!cutsceneActive && (gameState === 'PLAYING' || gameState === 'PAUSED')) {
          e.preventDefault();
          handleToggleStatsPreview();
        }
      } else if (e.key === 'u' || e.key === 'U') {
        if (!showAnomalyCutscene && gameState === 'PLAYING' && pendingLevelUpsRef.current.length > 0) {
          handleOpenPendingUpgrades();
        }
      } else if (e.key === 'Escape') {
        if (cutsceneActive) return;
        if (isStatsPreviewOpen) {
          setIsStatsPreviewOpen(false);
          return;
        }
        if (gameState === 'PLAYING' && engineRef.current) {
          engineRef.current.isPaused = true;
          setIsSimPaused(true);
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED' && engineRef.current) {
          engineRef.current.isPaused = false;
          setIsSimPaused(false);
          setGameState('PLAYING');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    gameState,
    handleOpenPendingUpgrades,
    handleToggleFullCombatMode,
    handleToggleMute,
    handleToggleStatsPreview,
    isStatsPreviewOpen,
    playerStats.angelCutsceneTimer,
    playerStats.angelDemonCutsceneTimer,
    playerStats.arcanaCutsceneTimer,
    playerStats.axiomCutsceneTimer,
    playerStats.demonisCutsceneTimer,
    playerStats.elementalisCutsceneTimer,
    playerStats.judgeCutsceneTimer,
    playerStats.kageroCutsceneTimer,
    playerStats.luminaCutsceneTimer,
    playerStats.monkeyCutsceneTimer,
    playerStats.morphosCutsceneTimer,
    playerStats.puppetCutsceneTimer,
    playerStats.solarisCutsceneTimer,
    playerStats.travelerCutsceneTimer,
    playerStats.valkyrieCutsceneTimer,
    showAnomalyCutscene,
    showEasterEggCutscene
  ]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      destroyEngine();
    };
  }, [destroyEngine]);

  const activeHeroConfig = HERO_DATABASE[selectedHero];
  const isInArenaView =
    gameState === 'PLAYING' ||
    gameState === 'LEVEL_UP' ||
    gameState === 'PAUSED' ||
    gameState === 'GAME_OVER' ||
    gameState === 'VICTORY';
  const isMorphosCutsceneActive =
    isInArenaView &&
    gameState === 'PLAYING' &&
    (playerStats.morphosCutsceneTimer ?? 0) > 0;
  const isValkyrieCutsceneActive =
    isInArenaView &&
    gameState === 'PLAYING' &&
    (playerStats.valkyrieCutsceneTimer ?? 0) > 0;
  const isTravelerCutsceneActive =
    isInArenaView &&
    gameState === 'PLAYING' &&
    (playerStats.travelerCutsceneTimer ?? 0) > 0;
  const isArcanaCutsceneActive =
    isInArenaView &&
    gameState === 'PLAYING' &&
    (playerStats.arcanaCutsceneTimer ?? 0) > 0;
  const isSolarisCutsceneActive =
    isInArenaView &&
    gameState === 'PLAYING' &&
    (playerStats.solarisCutsceneTimer ?? 0) > 0;
  const isJudgeCutsceneActive =
    isInArenaView &&
    gameState === 'PLAYING' &&
    (playerStats.judgeCutsceneTimer ?? 0) > 0;
  const isAngelCutsceneActive =
    isInArenaView &&
    gameState === 'PLAYING' &&
    (playerStats.angelCutsceneTimer ?? 0) > 0;
  const isElementalisCutsceneActive =
    isInArenaView &&
    gameState === 'PLAYING' &&
    (playerStats.elementalisCutsceneTimer ?? 0) > 0;
  const isAngelDemonCutsceneActive =
    isInArenaView &&
    gameState === 'PLAYING' &&
    (playerStats.angelDemonCutsceneTimer ?? 0) > 0;
  const isDemonisCutsceneActive =
    isInArenaView &&
    gameState === 'PLAYING' &&
    (playerStats.demonisCutsceneTimer ?? 0) > 0;
  const isMonkeyCutsceneActive =
    isInArenaView &&
    gameState === 'PLAYING' &&
    (playerStats.monkeyCutsceneTimer ?? 0) > 0;
  const isPuppetCutsceneActive =
    isInArenaView &&
    gameState === 'PLAYING' &&
    (playerStats.puppetCutsceneTimer ?? 0) > 0;
  const isLuminaCutsceneActive =
    isInArenaView &&
    gameState === 'PLAYING' &&
    (playerStats.luminaCutsceneTimer ?? 0) > 0;
  const isAxiomCutsceneActive =
    isInArenaView &&
    gameState === 'PLAYING' &&
    (playerStats.axiomCutsceneTimer ?? 0) > 0;
  const isKageroCutsceneActive =
    isInArenaView &&
    gameState === 'PLAYING' &&
    (playerStats.kageroCutsceneTimer ?? 0) > 0;
  const isCutsceneActive =
    showEasterEggCutscene ||
    showAnomalyCutscene ||
    Boolean(
      playerStats.isCutsceneActive ||
      (playerStats.judgeCutsceneTimer ?? 0) > 0 ||
      (playerStats.angelCutsceneTimer ?? 0) > 0 ||
      (playerStats.trueFallenAngelTimer ?? 0) > 0 ||
      (playerStats.angelDemonCutsceneTimer ?? 0) > 0 ||
      (playerStats.arcanaCutsceneTimer ?? 0) > 0 ||
      (playerStats.arcanaRouletteTimer ?? 0) > 0 ||
      (playerStats.valkyrieCutsceneTimer ?? 0) > 0 ||
      (playerStats.morphosCutsceneTimer ?? 0) > 0 ||
      (playerStats.travelerCutsceneTimer ?? 0) > 0 ||
      (playerStats.solarisCutsceneTimer ?? 0) > 0 ||
      (playerStats.elementalisCutsceneTimer ?? 0) > 0 ||
      (playerStats.demonisCutsceneTimer ?? 0) > 0 ||
      (playerStats.monkeyCutsceneTimer ?? 0) > 0 ||
      (playerStats.puppetCutsceneTimer ?? 0) > 0 ||
      (playerStats.luminaCutsceneTimer ?? 0) > 0 ||
      (playerStats.axiomCutsceneTimer ?? 0) > 0 ||
      (playerStats.kageroCutsceneTimer ?? 0) > 0
    );

  const isElementalisSanctuary3DMapActive =
    isInArenaView &&
    !isElementalisCutsceneActive &&
    !elementalis3DMapFallback &&
    (playerStats.elementalisRealmTimer ?? 0) > 0 &&
    (selectedHero === 'elementalis' || Boolean(playerStats.anomalyCloneActive));

  const isDemonRaised3DMapActive =
    isInArenaView &&
    !isAngelDemonCutsceneActive &&
    !demonRaised3DMapFallback &&
    (playerStats.angelDemonTimer ?? 0) > 0 &&
    selectedHero === 'demon_raised';

  const isAxiom3DBattleActive =
    isInArenaView &&
    !isAxiomCutsceneActive &&
    !axiom3DHeroFallback &&
    selectedHero === 'axiom';

  const getPlayerNormPos = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || engine.width <= 0 || engine.height <= 0) return null;
    return {
      x: (engine.playerPos.x / engine.width) * 2 - 1,
      y: (engine.playerPos.y / engine.height) * 2 - 1
    };
  }, []);

  const getAxiomSyncData = useCallback(() => {
    return engineRef.current?.getAxiom3DSyncData() ?? null;
  }, []);

  const getDemonRaisedSyncData = useCallback((): DemonRaised3DSyncData | null => {
    const engine = engineRef.current;
    if (!engine || engine.width <= 0 || engine.height <= 0) return null;
    const normX = (engine.playerPos.x / engine.width) * 2 - 1;
    const normY = (engine.playerPos.y / engine.height) * 2 - 1;
    const minions: DemonRaised3DMinionSync[] = [];
    for (const m of engine.minions) {
      if (m.hp <= 0 || (m.kind !== 'angel' && m.kind !== 'demon')) continue;
      minions.push({
        id: m.id,
        kind: m.kind,
        ndcX: (m.x / engine.width) * 2 - 1,
        ndcY: 1 - (m.y / engine.height) * 2,
        hpRatio: m.maxHp > 0 ? Math.max(0, Math.min(1, m.hp / m.maxHp)) : 1,
        modLevel: m.modLevel ?? 0,
        attackFlash: m.attackFlash ?? 0,
        facing: m.facing ?? 0
      });
    }
    return {
      playerNorm: { x: normX, y: normY },
      playerNdc: { x: normX, y: -normY },
      minions
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* Live 3D Three.js Primordial Sanctuary Map (Temporary Arena Replacement) */}
      {isElementalisSanctuary3DMapActive && (
        <ElementalisSanctuary3DMap
          realmRemaining={playerStats.elementalisRealmTimer ?? 0}
          getPlayerNormPos={getPlayerNormPos}
          onWebGLUnavailable={() => {
            setElementalis3DMapFallback(true);
            if (engineRef.current) engineRef.current.elementalis3DMapActive = false;
          }}
        />
      )}

      {/* Live 3D Three.js Heaven & Hell Battle Arena + 3D Angel/Demon Army */}
      {isDemonRaised3DMapActive && (
        <DemonRaisedHeavenHell3DMap
          domainRemaining={playerStats.angelDemonTimer ?? 0}
          getArenaSyncData={getDemonRaisedSyncData}
          onWebGLUnavailable={() => {
            setDemonRaised3DMapFallback(true);
            if (engineRef.current) engineRef.current.demonRaised3DMapActive = false;
          }}
        />
      )}

      {/* Main Arena Canvas */}
      <canvas
        ref={canvasRef}
        className={`relative z-10 block w-full h-full touch-none ${isInArenaView ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Live 3D Three.js AXIOM Hero Body & 3D Vector Attacks Layer */}
      {isAxiom3DBattleActive && (
        <Axiom3DBattleLayer
          getSyncData={getAxiomSyncData}
          onWebGLUnavailable={() => {
            setAxiom3DHeroFallback(true);
            if (engineRef.current) engineRef.current.axiom3DHeroActive = false;
          }}
        />
      )}

      {/* Title Screen */}
      {gameState === 'TITLE' && (
        <TitleScreen
          onStart={() => {
            setGameMode('arena');
            setGameState('CHARACTER_SELECT');
          }}
          onStartPractice={() => {
            setGameMode('practice');
            setGameState('CHARACTER_SELECT');
          }}
          onOpenCodex={() => setGameState('CODEX')}
          onSelectHeroDirect={(hero) => {
            setSelectedHero(hero);
            setActiveSkills([...HERO_DATABASE[hero].skills]);
            setGameState('SKILL_SELECT');
          }}
          onTriggerEasterEgg={openEasterEggCutscene}
          disableHotkeys={showEasterEggCutscene}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Codex Archive Screen */}
      {gameState === 'CODEX' && (
        <CodexModal
          onBack={() => setGameState('TITLE')}
          onSelectHeroToPlay={(hero) => {
            setSelectedHero(hero);
            setActiveSkills([...HERO_DATABASE[hero].skills]);
            setGameState('SKILL_SELECT');
          }}
        />
      )}

      {/* Character Select */}
      {gameState === 'CHARACTER_SELECT' && (
        <CharacterSelectModal
          gameMode={gameMode}
          onChangeGameMode={setGameMode}
          onConfirmCharacter={(hero) => {
            setSelectedHero(hero);
            setActiveSkills([...HERO_DATABASE[hero].skills]);
            setGameState('SKILL_SELECT');
          }}
          onBack={() => setGameState('TITLE')}
        />
      )}

      {/* Skill Select */}
      {gameState === 'SKILL_SELECT' && (
        <SkillSelectModal
          heroKey={selectedHero}
          gameMode={gameMode}
          onConfirmSkills={(skills) => {
            setActiveSkills(skills);
            startBattle(selectedHero, skills, gameMode);
          }}
          onBack={() => setGameState('CHARACTER_SELECT')}
        />
      )}

      {/* Active Combat HUD (temporarily hidden during any cutscene) */}
      {isInArenaView && !isCutsceneActive && (
        <GameHud
          player={playerStats}
          combatStats={combatStats}
          activeSkills={activeSkills}
          heroName={activeHeroConfig.name}
          heroColor={activeHeroConfig.color}
          boss={bossState}
          autoPilot={autoPilot}
          autoCastSkills={autoCastSkills}
          autoUpgrade={autoUpgrade}
          isMuted={isMuted}
          isFullCombatMode={isFullCombatMode}
          isFullscreen={isNativeFullscreen}
          isStatsPreviewOpen={isStatsPreviewOpen}
          pendingUpgradesCount={gameState === 'PLAYING' ? pendingLevelUps.length : 0}
          upgradeToast={upgradeToast}
          onToggleAutoPilot={() => {
            const next = !autoPilot;
            setAutoPilot(next);
            if (engineRef.current) engineRef.current.autoPilot = next;
          }}
          onToggleAutoCast={() => {
            const next = !autoCastSkills;
            setAutoCastSkills(next);
            if (engineRef.current) engineRef.current.autoCastSkills = next;
          }}
          onToggleAutoUpgrade={handleToggleAutoUpgrade}
          onToggleMute={handleToggleMute}
          onToggleFullCombatMode={handleToggleFullCombatMode}
          onToggleNativeFullscreen={handleToggleNativeFullscreen}
          onToggleStatsPreview={handleToggleStatsPreview}
          onOpenPendingUpgrades={handleOpenPendingUpgrades}
          onAutoPickPendingUpgrades={() => {
            if (pendingLevelUpsRef.current.length > 0) {
              applyAutoUpgradesForLevels([...pendingLevelUpsRef.current], false);
            }
          }}
          onPause={() => {
            setIsStatsPreviewOpen(false);
            if (engineRef.current) {
              engineRef.current.isPaused = true;
              setIsSimPaused(true);
            }
            setGameState('PAUSED');
          }}
          onTriggerSkill={(idx) => {
            const engine = engineRef.current;
            if (!engine || engine.isPaused || engine.isGameOver) return;
            if (idx >= 0 && idx < engine.activeSkills.length && !engine.activeSkills[idx]?.lockedUnique && engine.player.skillCDs[idx] <= 0) {
              const target = engine.getClosestEnemy(engine.playerPos.x, engine.playerPos.y);
              engine.useSkill(idx, target);
            }
          }}
        />
      )}

      {/* In-Battle Live Stats Preview Drawer/Modal */}
      {isInArenaView && !isCutsceneActive && (
        <BattleStatsPreviewModal
          isOpen={isStatsPreviewOpen}
          heroKey={selectedHero}
          gameMode={gameMode}
          player={playerStats}
          combatStats={combatStats}
          activeSkills={activeSkills}
          attributeCounts={practiceAttributeCounts}
          unlockedTraits={practiceUnlockedTraits}
          isSimPaused={isSimPaused}
          onToggleSimPause={
            gameState === 'PLAYING'
              ? () => {
                  const engine = engineRef.current;
                  if (!engine) return;
                  engine.isPaused = !engine.isPaused;
                  setIsSimPaused(engine.isPaused);
                }
              : undefined
          }
          onClose={() => setIsStatsPreviewOpen(false)}
        />
      )}

      {/* Practice Lab Controls (temporarily hidden during any cutscene or Full Combat Mode) */}
      {gameState === 'PLAYING' && gameMode === 'practice' && engineRef.current && !isCutsceneActive && !isFullCombatMode && (
        <PracticeLabPanel
          heroKey={selectedHero}
          player={playerStats}
          combatStats={combatStats}
          activeSkills={activeSkills}
          attributeCounts={practiceAttributeCounts}
          unlockedTraits={practiceUnlockedTraits}
          practiceWave={practiceWave}
          godMode={practiceGodMode}
          autoHealDummy={practiceAutoHealDummy}
          isSimPaused={isSimPaused}
          onToggleSimPause={() => {
            const engine = engineRef.current;
            if (!engine) return;
            engine.isPaused = !engine.isPaused;
            setIsSimPaused(engine.isPaused);
          }}
          onToggleRelic={(attrId) => {
            const engine = engineRef.current;
            if (!engine) return;
            engine.togglePracticeRelic(attrId);
            syncEngineSnapshots(engine);
          }}
          onSetRelicCount={(attrId, count) => {
            const engine = engineRef.current;
            if (!engine) return;
            engine.setPracticeRelicCount(attrId, count);
            syncEngineSnapshots(engine);
          }}
          onClearRelics={() => {
            const engine = engineRef.current;
            if (!engine) return;
            engine.clearPracticeRelics();
            syncEngineSnapshots(engine);
          }}
          onToggleTrait={(traitId) => {
            const engine = engineRef.current;
            if (!engine) return;
            engine.togglePracticeTrait(traitId);
            syncEngineSnapshots(engine);
          }}
          onSwitchHero={(newHeroKey) => {
            const engine = engineRef.current;
            if (!engine) return;
            setAxiom3DHeroFallback(false);
            engine.axiom3DHeroActive = true;
            engine.switchHeroInPractice(newHeroKey);
            syncEngineSnapshots(engine);
          }}
          onSetWave={(wave) => {
            const engine = engineRef.current;
            if (!engine) return;
            engine.setPracticeWaveLevel(wave);
            syncEngineSnapshots(engine);
          }}
          onSpawnDummy={(kind, resistPreset) => {
            const engine = engineRef.current;
            if (!engine) return;
            engine.spawnPracticeDummy(kind, undefined, undefined, resistPreset);
            syncEngineSnapshots(engine);
          }}
          onSpawnSwarm={() => {
            const engine = engineRef.current;
            if (!engine) return;
            engine.spawnPracticeSwarm(5);
            syncEngineSnapshots(engine);
          }}
          onSpawnSkilledMobs={() => {
            const engine = engineRef.current;
            if (!engine) return;
            engine.spawnPracticeSkilledMobs();
            syncEngineSnapshots(engine);
          }}
          onSpawnBoss={(type, corruptedHeroKey) => {
            const engine = engineRef.current;
            if (!engine) return;
            engine.spawnPracticeBoss(type, corruptedHeroKey);
            syncEngineSnapshots(engine);
          }}
          onClearEnemies={() => {
            const engine = engineRef.current;
            if (!engine) return;
            engine.clearPracticeEnemies();
            syncEngineSnapshots(engine);
          }}
          onResetMetrics={() => {
            const engine = engineRef.current;
            if (!engine) return;
            engine.resetPracticeMetrics();
            syncEngineSnapshots(engine);
          }}
          onResetCooldowns={() => {
            const engine = engineRef.current;
            if (!engine) return;
            engine.resetPracticeCooldowns();
            syncEngineSnapshots(engine);
          }}
          onFullHeal={() => {
            const engine = engineRef.current;
            if (!engine) return;
            engine.fullHealPractice();
            syncEngineSnapshots(engine);
          }}
          onGrantLevel={(levels) => {
            const engine = engineRef.current;
            if (!engine) return;
            engine.grantPracticeLevel(levels);
            syncEngineSnapshots(engine);
          }}
          onToggleGodMode={() => {
            const engine = engineRef.current;
            if (!engine) return;
            engine.practiceGodMode = !engine.practiceGodMode;
            setPracticeGodMode(engine.practiceGodMode);
          }}
          onToggleAutoHealDummy={() => {
            const engine = engineRef.current;
            if (!engine) return;
            engine.practiceAutoHealDummy = !engine.practiceAutoHealDummy;
            setPracticeAutoHealDummy(engine.practiceAutoHealDummy);
          }}
        />
      )}

      {/* Level Up Modal */}
      {gameState === 'LEVEL_UP' && engineRef.current && (
        <LevelUpModal
          key={`${levelUpLevel}-${pendingLevelUps.length}`}
          level={levelUpLevel}
          wave={combatStats.wave}
          heroKey={selectedHero}
          activeSkillIds={activeSkills.map((s) => s.id)}
          unlockedTraits={new Set(engineRef.current.unlockedTraits)}
          acquiredAttributes={new Set(engineRef.current.acquiredAttributes)}
          pendingCount={Math.max(1, pendingLevelUps.length)}
          onConfirmUpgrade={(selectedTraitId, selectedAttrId) => {
            const engine = engineRef.current;
            if (!engine) return;
            if (selectedTraitId) {
              engine.applySkillUpgrade(selectedTraitId);
            }
            engine.applyAttribute(selectedAttrId);

            const remaining = pendingLevelUpsRef.current.slice(1);
            pendingLevelUpsRef.current = remaining;
            setPendingLevelUps(remaining);

            if (remaining.length > 0) {
              engine.isPaused = true;
              setIsSimPaused(true);
              setLevelUpLevel(remaining[0]);
              syncEngineSnapshots(engine);
            } else {
              engine.isPaused = false;
              setIsSimPaused(false);
              upgradesMinimizedRef.current = false;
              syncEngineSnapshots(engine);
              setGameState('PLAYING');
            }
          }}
          onDeferUpgrade={() => {
            const engine = engineRef.current;
            if (!engine) return;
            upgradesMinimizedRef.current = true;
            engine.isPaused = false;
            setIsSimPaused(false);
            setGameState('PLAYING');
          }}
          onEnableAutoUpgrade={(selectedTraitId, selectedAttrId) => {
            const engine = engineRef.current;
            if (!engine) return;
            autoUpgradeRef.current = true;
            setAutoUpgrade(true);

            if (selectedTraitId) {
              engine.applySkillUpgrade(selectedTraitId);
            }
            engine.applyAttribute(selectedAttrId);

            const remaining = pendingLevelUpsRef.current.slice(1);
            if (remaining.length > 0) {
              applyAutoUpgradesForLevels(remaining, false);
            } else {
              pendingLevelUpsRef.current = [];
              setPendingLevelUps([]);
              upgradesMinimizedRef.current = false;
              engine.isPaused = false;
              setIsSimPaused(false);
              syncEngineSnapshots(engine);
            }
            setGameState('PLAYING');
          }}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={() => {
            if (engineRef.current) {
              engineRef.current.isPaused = false;
              setIsSimPaused(false);
            }
            setGameState('PLAYING');
          }}
          onRestart={() => {
            resetUpgradeQueue();
            if (engineRef.current) {
              engineRef.current.restart();
              syncEngineSnapshots(engineRef.current);
              setBossState(null);
            }
            setGameState('PLAYING');
          }}
          onQuitToTitle={() => {
            destroyEngine();
            setBossState(null);
            setGameState('TITLE');
          }}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          isPracticeMode={gameMode === 'practice'}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          stats={finalStats}
          heroName={activeHeroConfig.name}
          onRestart={() => {
            resetUpgradeQueue();
            if (engineRef.current) {
              engineRef.current.restart();
              syncEngineSnapshots(engineRef.current);
              setBossState(null);
            }
            setGameState('PLAYING');
          }}
          onSelectHero={() => {
            destroyEngine();
            setBossState(null);
            setGameState('CHARACTER_SELECT');
          }}
        />
      )}

      {/* Victory Modal */}
      {gameState === 'VICTORY' && (
        <VictoryModal
          stats={finalStats}
          heroName={activeHeroConfig.name}
          onContinueEndless={() => {
            if (engineRef.current) {
              engineRef.current.isPaused = false;
              setIsSimPaused(false);
            }
            setGameState('PLAYING');
          }}
          onRestart={() => {
            resetUpgradeQueue();
            if (engineRef.current) {
              engineRef.current.restart();
              syncEngineSnapshots(engineRef.current);
              setBossState(null);
            }
            setGameState('PLAYING');
          }}
          onSelectHero={() => {
            destroyEngine();
            setBossState(null);
            setGameState('CHARACTER_SELECT');
          }}
        />
      )}

      {/* Anomaly Fusion Portal Video Cutscene */}
      {showAnomalyCutscene && (
        <AnomalyCutsceneModal
          isMuted={isMuted}
          onComplete={handleCompleteAnomalyCutscene}
        />
      )}

      {/* Morphos: Apex Chimera 2D Anime Cutscene */}
      {isMorphosCutsceneActive && (
        <MorphosChimera2DAnimeCutscene
          remainingTime={playerStats.morphosCutsceneTimer ?? 0}
          totalDuration={4.8}
          onSkip={handleSkipMorphosCutscene}
        />
      )}

      {/* Valkyrie Frost: Sub-Zero Epoch Mirror Dimension 2D Anime Cutscene */}
      {isValkyrieCutsceneActive && (
        <ValkyrieFrost2DAnimeCutscene
          remainingTime={playerStats.valkyrieCutsceneTimer ?? 0}
          totalDuration={4.6}
          monolithCount={playerStats.valkyrieCutsceneMonolithCount ?? 3}
          frozenEnemiesCount={playerStats.valkyrieCutsceneFrozenCount ?? 0}
          onSkip={handleSkipValkyrieCutscene}
        />
      )}

      {/* Traveler: Time Stop Berserk 3D Three.js Cutscene */}
      {isTravelerCutsceneActive && !traveler3DFallback && (
        <TravelerTimeStop3DCutscene
          remainingTime={playerStats.travelerCutsceneTimer ?? 0}
          totalDuration={5.4}
          onSkip={handleSkipTravelerCutscene}
          onWebGLUnavailable={() => setTraveler3DFallback(true)}
        />
      )}

      {/* Arcana: Royal Flush Tarot Verdict 3D Three.js Cutscene */}
      {isArcanaCutsceneActive && !arcana3DFallback && (
        <ArcanaTarot3DCutscene
          remainingTime={playerStats.arcanaCutsceneTimer ?? 0}
          totalDuration={4.0}
          cards={playerStats.arcanaCutsceneCards ?? playerStats.arcanaHand}
          onSkip={handleSkipArcanaCutscene}
          onWebGLUnavailable={() => setArcana3DFallback(true)}
        />
      )}

      {/* Solaris Ignis: Solar Eclipse & Supernova Incarnation 3D Three.js Cutscene */}
      {isSolarisCutsceneActive && !solaris3DFallback && (
        <SolarisSupernova3DCutscene
          remainingTime={playerStats.solarisCutsceneTimer ?? 0}
          totalDuration={4.8}
          onSkip={handleSkipSolarisCutscene}
          onWebGLUnavailable={() => setSolaris3DFallback(true)}
        />
      )}

      {/* Dimension Judg: Void Arbiter Ascension 3D Three.js Cutscene */}
      {isJudgeCutsceneActive && !judge3DFallback && (
        <DimensionJudgeVoidArbiter3DCutscene
          remainingTime={playerStats.judgeCutsceneTimer ?? 0}
          totalDuration={5.4}
          onSkip={handleSkipJudgeCutscene}
          onWebGLUnavailable={() => setJudge3DFallback(true)}
        />
      )}

      {/* Fallen Angel: Abyssal Eclipse & Six-Winged Ascension 3D Three.js Cutscene */}
      {isAngelCutsceneActive && !angel3DFallback && (
        <FallenAngelAscension3DCutscene
          remainingTime={playerStats.angelCutsceneTimer ?? 0}
          totalDuration={12.0}
          onSkip={handleSkipAngelCutscene}
          onWebGLUnavailable={() => setAngel3DFallback(true)}
        />
      )}

      {/* Elementalis: Primordial Genesis World-Creation 3D Three.js Cutscene */}
      {isElementalisCutsceneActive && !elementalis3DFallback && (
        <ElementalisGenesis3DCutscene
          remainingTime={playerStats.elementalisCutsceneTimer ?? 0}
          totalDuration={5.8}
          onSkip={handleSkipElementalisCutscene}
          onWebGLUnavailable={() => setElementalis3DFallback(true)}
        />
      )}

      {/* Demon Raised: Heaven & Hell Split World-Creation & 3D Army Summoning Cutscene */}
      {isAngelDemonCutsceneActive && !angelDemon3DFallback && (
        <DemonRaisedHeavenHell3DCutscene
          remainingTime={playerStats.angelDemonCutsceneTimer ?? 0}
          totalDuration={5.6}
          onSkip={handleSkipAngelDemonCutscene}
          onWebGLUnavailable={() => setAngelDemon3DFallback(true)}
        />
      )}

      {/* Demonis: Abyssal Judgement Void Annihilation 3D Three.js Cutscene */}
      {isDemonisCutsceneActive && !demonis3DFallback && (
        <DemonisVoidJudgement3DCutscene
          remainingTime={playerStats.demonisCutsceneTimer ?? 0}
          totalDuration={4.6}
          targetName={playerStats.demonisCutsceneTargetName ?? 'MUSUH'}
          targetIsBoss={Boolean(playerStats.demonisCutsceneTargetIsBoss)}
          onSkip={handleSkipDemonisCutscene}
          onWebGLUnavailable={() => setDemonis3DFallback(true)}
        />
      )}

      {/* Monkey King: Qi Tian Da Sheng 72 Celestial Clones 3D Three.js Cutscene */}
      {isMonkeyCutsceneActive && !monkey3DFallback && (
        <MonkeyKingGreatSage3DCutscene
          remainingTime={playerStats.monkeyCutsceneTimer ?? 0}
          totalDuration={6.2}
          sageStacks={playerStats.monkeySageStacks ?? 0}
          onSkip={handleSkipMonkeyCutscene}
          onWebGLUnavailable={() => setMonkey3DFallback(true)}
        />
      )}

      {/* Soul Puppeteer: Infinite Marionette Theatre Anime 3D Three.js Cutscene */}
      {isPuppetCutsceneActive && !puppet3DFallback && (
        <SoulPuppeteerAnime3DCutscene
          remainingTime={playerStats.puppetCutsceneTimer ?? 0}
          totalDuration={6.0}
          soulCount={playerStats.souls ?? 0}
          onSkip={handleSkipPuppetCutscene}
          onWebGLUnavailable={() => setPuppet3DFallback(true)}
        />
      )}

      {/* Lumina: Sovereign Equinox Light+Mirror Fusion Anime 3D Three.js Cutscene */}
      {isLuminaCutsceneActive && !lumina3DFallback && (
        <LuminaEquinoxAnime3DCutscene
          remainingTime={playerStats.luminaCutsceneTimer ?? 0}
          totalDuration={6.0}
          radiantCharges={playerStats.luminaCharges ?? 0}
          onSkip={handleSkipLuminaCutscene}
          onWebGLUnavailable={() => setLumina3DFallback(true)}
        />
      )}

      {/* AXIOM: Apex Dominion Reality Manipulation 3D Three.js Cutscene */}
      {isAxiomCutsceneActive && !axiom3DFallback && (
        <AxiomManipulation3DCutscene
          remainingTime={playerStats.axiomCutsceneTimer ?? 0}
          totalDuration={4.6}
          onSkip={handleSkipAxiomCutscene}
          onWebGLUnavailable={() => setAxiom3DFallback(true)}
        />
      )}

      {/* KAGERO: Forbidden Art Crimson Moon Eclipse 2D Anime Sakuga Cutscene */}
      {isKageroCutsceneActive && (
        <KageroBlood2DAnimeCutscene
          remainingTime={playerStats.kageroCutsceneTimer ?? 0}
          totalDuration={4.8}
          bloodStacks={playerStats.kageroBloodStacks ?? 0}
          onSkip={handleSkipKageroCutscene}
        />
      )}

      {/* Secret 3-Minute Easter Egg Chronicle Cutscene */}
      {showEasterEggCutscene && (
        <EasterEggChronicleCutscene
          isMuted={isMuted}
          isInBattle={isInArenaView}
          onToggleMute={handleToggleMute}
          onComplete={handleCompleteEasterEggCutscene}
        />
      )}
    </div>
  );
}
