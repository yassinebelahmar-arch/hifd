/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HifdhMushafView } from './components/HifdhMushafView';
import { QuranReaderView } from './components/QuranReaderView';
import { TrackerDoubleCheckView } from './components/TrackerDoubleCheckView';
import { PlannerAndRemindersView } from './components/PlannerAndRemindersView';
import { SessionTimerModal } from './components/SessionTimerModal';
import {
  GlobalAudioPlayerBar,
  SharedAudioController,
} from './components/GlobalAudioPlayerBar';
import {
  ALL_HALF_HIZBS,
  VerseDetail,
  getYasserDosariSurahAudioUrl,
} from './data/quranMetadata';
import { fetchSurahVersesWithTafsir } from './services/quranApi';
import {
  HifdhSessionLog,
  HifdhState,
  PlannedWeeklySession,
  WeeklyScheduleConfig,
  applyCheck1Toggle,
  applyCheck2Toggle,
  calculateHifdhStats,
  calculateWeeklySessionSummary,
  computeNextVersePlaybackState,
  createInitialHifdhState,
  generateDailyRevisionPlan,
  toggleFlaggedVerseMap,
} from './utils/hifdhLogic';

const STORAGE_KEY = 'tartil_hifdh_yasser_dossari_v1';
const THEME_KEY = 'tartil_hifdh_theme_v2';

export type AppTheme = 'mushaf' | 'dark' | 'minimal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'hifdh' | 'quran' | 'tracker' | 'planner'>('hifdh');
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(67);
  const [readerSubTab, setReaderSubTab] = useState<'mushaf' | 'tafsir' | 'quiz'>('mushaf');
  const [isSessionModalOpen, setIsSessionModalOpen] = useState<boolean>(false);

  // Persistent Global Audio State (never unmounts when switching tabs or pages)
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioMode, setAudioModeState] = useState<'surah' | 'ayah'>('surah');
  const [playingSurahNumber, setPlayingSurahNumber] = useState<number>(67);
  const [playingSurahVerses, setPlayingSurahVerses] = useState<VerseDetail[]>([]);
  const [currentAyahIndex, setCurrentAyahIndex] = useState<number>(0);
  const [repeatMode, setRepeatModeState] = useState<1 | 3 | 5 | 0>(1);
  const [currentRepeatIteration, setCurrentRepeatIteration] = useState<number>(1);
  const [playbackRate, setPlaybackRateState] = useState<number>(1);
  const [autoAdvanceNextSurah, setAutoAdvanceNextSurah] = useState<boolean>(true);
  const [echoPauseMode, setEchoPauseMode] = useState<boolean>(false);
  const [isEchoWaiting, setIsEchoWaiting] = useState<boolean>(false);
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(30);
  const [loopRange, setLoopRange] = useState<boolean>(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadAudioRef = useRef<HTMLAudioElement | null>(null);
  const echoTimeoutRef = useRef<number | null>(null);

  // When audio is NOT actively playing, keep the ready-to-play Surah synced with the viewed Surah
  useEffect(() => {
    if (!isPlaying) {
      setPlayingSurahNumber(selectedSurahNumber);
      setCurrentAyahIndex(0);
      setCurrentRepeatIteration(1);
    }
  }, [selectedSurahNumber, isPlaying]);

  // Load verses for playingSurahNumber so verse-by-verse audio is always available
  useEffect(() => {
    let mounted = true;
    fetchSurahVersesWithTafsir(playingSurahNumber).then((res) => {
      if (!mounted) return;
      setPlayingSurahVerses(res.verses);
      setRangeStart(1);
      setRangeEnd(res.verses.length || 1);
    });
    return () => {
      mounted = false;
    };
  }, [playingSurahNumber]);

  const currentPlayingVerse: VerseDetail | undefined = playingSurahVerses[currentAyahIndex];

  const activeAudioSrc = useMemo(() => {
    if (audioMode === 'surah') {
      return getYasserDosariSurahAudioUrl(playingSurahNumber);
    }
    return currentPlayingVerse?.audioVerseUrl || getYasserDosariSurahAudioUrl(playingSurahNumber);
  }, [audioMode, playingSurahNumber, currentPlayingVerse]);

  // Gapless preloading of verse N+1 when in ayah mode
  useEffect(() => {
    if (audioMode !== 'ayah' || playingSurahVerses.length === 0) return;
    const nextIdx = currentAyahIndex + 1;
    if (nextIdx < playingSurahVerses.length && preloadAudioRef.current) {
      const nextUrl = playingSurahVerses[nextIdx]?.audioVerseUrl;
      if (nextUrl && preloadAudioRef.current.src !== nextUrl) {
        preloadAudioRef.current.src = nextUrl;
        preloadAudioRef.current.load();
      }
    }
  }, [audioMode, currentAyahIndex, playingSurahVerses]);

  // Drive persistent HTMLAudioElement
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeAudioSrc) return;

    if (audio.src !== activeAudioSrc) {
      audio.src = activeAudioSrc;
      audio.playbackRate = playbackRate;
    }

    if (isPlaying && !isEchoWaiting) {
      audio.playbackRate = playbackRate;
      audio.play().catch(() => {
        // Note: in headless browsers or restricted autoplay, keep UI state or handle gracefully
      });
    } else {
      audio.pause();
    }
  }, [activeAudioSrc, isPlaying, isEchoWaiting, playbackRate]);

  // Update playbackRate immediately when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const advanceToNextAyahStep = () => {
    const totalVerses = Math.max(1, playingSurahVerses.length);
    const activeVerseNum = currentPlayingVerse?.numberInSurah ?? currentAyahIndex + 1;
    const effectiveEnd = Math.min(totalVerses, Math.max(rangeStart, rangeEnd));

    const nextState = computeNextVersePlaybackState({
      activeVerse: activeVerseNum,
      currentIteration: currentRepeatIteration,
      repeatTarget: repeatMode,
      rangeStart,
      rangeEnd: effectiveEnd,
      loopRange,
    });

    if (nextState.shouldReplaySameVerse && nextState.shouldContinuePlaying && audioRef.current) {
      setCurrentRepeatIteration(nextState.nextIteration);
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } else if (nextState.shouldContinuePlaying) {
      setCurrentAyahIndex(Math.max(0, nextState.nextVerse - 1));
      setCurrentRepeatIteration(nextState.nextIteration);
      setIsPlaying(true);
    } else if (autoAdvanceNextSurah) {
      const nextSurah = playingSurahNumber < 114 ? playingSurahNumber + 1 : 1;
      setPlayingSurahNumber(nextSurah);
      setCurrentAyahIndex(0);
      setCurrentRepeatIteration(1);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const handleGlobalAudioEnded = () => {
    if (audioMode === 'surah') {
      const shouldRepeatSurah =
        repeatMode === 0 || (repeatMode > 1 && currentRepeatIteration < repeatMode);

      if (shouldRepeatSurah && audioRef.current) {
        setCurrentRepeatIteration((it) => (repeatMode === 0 ? it + 1 : it + 1));
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
        return;
      }

      setCurrentRepeatIteration(1);
      if (autoAdvanceNextSurah) {
        const nextSurah = playingSurahNumber < 114 ? playingSurahNumber + 1 : 1;
        setPlayingSurahNumber(nextSurah);
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
      return;
    }

    if (echoPauseMode) {
      setIsEchoWaiting(true);
      if (echoTimeoutRef.current) window.clearTimeout(echoTimeoutRef.current);
      echoTimeoutRef.current = window.setTimeout(() => {
        setIsEchoWaiting(false);
        advanceToNextAyahStep();
      }, 4000);
      return;
    }

    advanceToNextAyahStep();
  };

  const audioController: SharedAudioController = {
    isPlaying,
    audioMode,
    playingSurahNumber,
    playingSurahVerses,
    currentAyahIndex,
    repeatMode,
    currentRepeatIteration,
    playbackRate,
    autoAdvanceNextSurah,
    echoPauseMode,
    isEchoWaiting,
    rangeStart,
    rangeEnd,
    loopRange,
    audioCurrentTime,
    audioDuration,
    togglePlaySurah: (surahNumber?: number) => {
      const target = surahNumber ?? selectedSurahNumber;
      if (echoTimeoutRef.current) window.clearTimeout(echoTimeoutRef.current);
      setIsEchoWaiting(false);

      if (playingSurahNumber === target && audioMode === 'surah') {
        setIsPlaying((p) => !p);
      } else {
        setPlayingSurahNumber(target);
        setAudioModeState('surah');
        setCurrentRepeatIteration(1);
        setIsPlaying(true);
      }
    },
    playSpecificAyah: (surahNumber: number, ayahIndex: number, versesList?: VerseDetail[]) => {
      if (echoTimeoutRef.current) window.clearTimeout(echoTimeoutRef.current);
      setIsEchoWaiting(false);
      if (versesList && versesList.length > 0) {
        setPlayingSurahVerses(versesList);
        setRangeEnd(versesList.length);
      }
      setPlayingSurahNumber(surahNumber);
      setAudioModeState('ayah');
      setCurrentAyahIndex(Math.max(0, ayahIndex));
      setCurrentRepeatIteration(1);
      setIsPlaying(true);
    },
    togglePlayPause: () => {
      if (echoTimeoutRef.current) window.clearTimeout(echoTimeoutRef.current);
      setIsEchoWaiting(false);
      setIsPlaying((p) => !p);
    },
    prevTrackOrAyah: () => {
      if (echoTimeoutRef.current) window.clearTimeout(echoTimeoutRef.current);
      setIsEchoWaiting(false);
      setCurrentRepeatIteration(1);
      if (audioMode === 'ayah') {
        setCurrentAyahIndex((idx) => Math.max(0, idx - 1));
      } else {
        setPlayingSurahNumber((num) => (num > 1 ? num - 1 : 114));
      }
    },
    nextTrackOrAyah: () => {
      if (echoTimeoutRef.current) window.clearTimeout(echoTimeoutRef.current);
      setIsEchoWaiting(false);
      setCurrentRepeatIteration(1);
      if (audioMode === 'ayah') {
        setCurrentAyahIndex((idx) =>
          Math.min(Math.max(0, playingSurahVerses.length - 1), idx + 1)
        );
      } else {
        setPlayingSurahNumber((num) => (num < 114 ? num + 1 : 1));
      }
    },
    setAudioMode: (mode: 'surah' | 'ayah') => {
      setAudioModeState(mode);
      setCurrentRepeatIteration(1);
    },
    setRepeatMode: (repeat: 1 | 3 | 5 | 0) => {
      setRepeatModeState(repeat);
      setCurrentRepeatIteration(1);
    },
    setPlaybackRate: (rate: number) => {
      setPlaybackRateState(rate);
      if (audioRef.current) {
        audioRef.current.playbackRate = rate;
      }
    },
    setAutoAdvanceNextSurah,
    setEchoPauseMode,
    setRangeStart,
    setRangeEnd,
    setLoopRange,
    seekTo: (timeSec: number) => {
      setAudioCurrentTime(timeSec);
      if (audioRef.current) {
        audioRef.current.currentTime = timeSec;
      }
    },
  };

  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY) as AppTheme | null;
      if (saved === 'mushaf' || saved === 'dark' || saved === 'minimal') return saved;
    } catch {
      // ignore
    }
    return 'mushaf';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const [state, setState] = useState<HifdhState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.halfHizbProgress && parsed.schedule) {
          return parsed;
        }
      }
    } catch {
      // Ignore storage error
    }
    return createInitialHifdhState();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage error
    }
  }, [state]);

  const stats = useMemo(() => calculateHifdhStats(state), [state]);
  const reminders = useMemo(() => generateDailyRevisionPlan(state), [state]);
  const weeklySummary = useMemo(
    () => calculateWeeklySessionSummary(state.sessions, state.schedule),
    [state.sessions, state.schedule]
  );

  const handleToggleHalfHizbCheck1 = (id: number) => {
    setState((prev) => ({
      ...prev,
      halfHizbProgress: {
        ...prev.halfHizbProgress,
        [id]: applyCheck1Toggle(prev.halfHizbProgress[id]),
      },
    }));
  };

  const handleToggleHalfHizbCheck2 = (id: number) => {
    setState((prev) => ({
      ...prev,
      halfHizbProgress: {
        ...prev.halfHizbProgress,
        [id]: applyCheck2Toggle(prev.halfHizbProgress[id]),
      },
    }));
  };

  const handleToggleSurahCheck1 = (surahNum: number) => {
    setState((prev) => {
      const updatedSurahItem = applyCheck1Toggle(prev.surahProgress[surahNum]);
      const nextSurahProgress = {
        ...prev.surahProgress,
        [surahNum]: updatedSurahItem,
      };

      const nextHalfHizbProgress = { ...prev.halfHizbProgress };
      const matchingHalf = ALL_HALF_HIZBS.find((h) => h.startSurah === surahNum);
      if (matchingHalf && updatedSurahItem.check1Memorized && !nextHalfHizbProgress[matchingHalf.id]?.check1Memorized) {
        nextHalfHizbProgress[matchingHalf.id] = applyCheck1Toggle(nextHalfHizbProgress[matchingHalf.id]);
      }

      return {
        ...prev,
        surahProgress: nextSurahProgress,
        halfHizbProgress: nextHalfHizbProgress,
      };
    });
  };

  const handleToggleSurahCheck2 = (surahNum: number) => {
    setState((prev) => {
      const updatedSurahItem = applyCheck2Toggle(prev.surahProgress[surahNum]);
      const nextSurahProgress = {
        ...prev.surahProgress,
        [surahNum]: updatedSurahItem,
      };

      const nextHalfHizbProgress = { ...prev.halfHizbProgress };
      const matchingHalf = ALL_HALF_HIZBS.find((h) => h.startSurah === surahNum);
      if (matchingHalf) {
        nextHalfHizbProgress[matchingHalf.id] = updatedSurahItem;
      }

      return {
        ...prev,
        surahProgress: nextSurahProgress,
        halfHizbProgress: nextHalfHizbProgress,
      };
    });
  };

  const handleToggleFlaggedVerse = (surahNum: number, ayahNum: number) => {
    setState((prev) => ({
      ...prev,
      flaggedVerses: toggleFlaggedVerseMap(prev.flaggedVerses, surahNum, ayahNum),
    }));
  };

  const handleUpdateSchedule = (patch: Partial<WeeklyScheduleConfig>) => {
    setState((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        ...patch,
      },
    }));
  };

  const handleUpdatePlannedSessions = (plannedWeeklySessions: PlannedWeeklySession[]) => {
    setState((prev) => ({
      ...prev,
      plannedWeeklySessions,
    }));
  };

  const handleAddSession = (newSess: Omit<HifdhSessionLog, 'id' | 'dateIso'>) => {
    const entry: HifdhSessionLog = {
      ...newSess,
      id: `sess-${Date.now()}`,
      dateIso: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      sessions: [entry, ...prev.sessions],
    }));
  };

  const handleDeleteSession = (sessionId: string) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((s) => s.id !== sessionId),
    }));
  };

  const handleOpenReaderForSurah = (
    surahNum: number,
    subTab: 'mushaf' | 'tafsir' | 'quiz' = 'mushaf'
  ) => {
    setSelectedSurahNumber(surahNum);
    setReaderSubTab(subTab);
    setActiveTab('quran');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleOpenHifdhMushafForSurah = (surahNum: number) => {
    setSelectedSurahNumber(surahNum);
    setActiveTab('hifdh');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeTab]);

  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hifdh-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackupJson = (jsonText: string): boolean => {
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed && parsed.halfHizbProgress && parsed.schedule) {
        setState(parsed);
        return true;
      }
    } catch {
      // Invalid JSON
    }
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col theme-app transition-colors duration-200 pb-20">
      {/* Clean, Practical Header */}
      <header className="sticky top-0 z-40 theme-surface border-b px-4 sm:px-6 py-2.5 flex flex-wrap md:flex-nowrap items-center justify-between gap-y-2 gap-x-6">
        {/* Left: Brand + Essential Live Status Pill */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('hifdh')}
            className="text-base font-bold tracking-tight cursor-pointer flex items-center gap-2"
          >
            <span className="font-arabic text-xl leading-none">القرآن</span>
            <span>Hifdh</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tracker')}
            title="Voir votre progression par Sourate et Hizb"
            className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md text-xs theme-muted border cursor-pointer hover:opacity-80 transition-opacity"
          >
            <span className="font-mono-tabular font-semibold">
              {stats.surahsValidatedCheck2Count}/114 Sourates
            </span>
            <span className="theme-text-muted">·</span>
            <span data-testid="projected-duration-text" className="theme-text-muted">
              Fin : <strong className="font-medium text-[var(--text-main)]">{stats.formattedProjectionFr}</strong>
            </span>
          </button>
        </div>

        {/* Center: 4 Focused Navigation Tabs */}
        <nav
          aria-label="Navigation principale"
          className="order-3 md:order-2 w-full md:w-auto flex items-center justify-between sm:justify-start gap-1 sm:gap-2 text-xs sm:text-sm font-medium pt-1.5 md:pt-0 border-t md:border-t-0 theme-border overflow-x-auto"
        >
          <button
            type="button"
            onClick={() => setActiveTab('hifdh')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'hifdh'
                ? 'theme-btn-primary font-semibold'
                : 'theme-text-muted hover:text-[var(--text-main)]'
            }`}
          >
            Hifdh (Mushaf)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quran')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'quran'
                ? 'theme-btn-primary font-semibold'
                : 'theme-text-muted hover:text-[var(--text-main)]'
            }`}
          >
            Coran &amp; Écoute
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tracker')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'tracker'
                ? 'theme-btn-primary font-semibold'
                : 'theme-text-muted hover:text-[var(--text-main)]'
            }`}
          >
            Suivi ({stats.surahsValidatedCheck2Count}/114)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('planner')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'planner'
                ? 'theme-btn-primary font-semibold'
                : 'theme-text-muted hover:text-[var(--text-main)]'
            }`}
          >
            Séances 3h/sem ({weeklySummary.completedHoursFormatted})
          </button>
        </nav>

        {/* Right: Palette Switcher (Papier / Nuit / Blanc) + Floating Chrono Toggle */}
        <div className="order-2 md:order-3 flex items-center gap-2 shrink-0">
          <div
            role="group"
            aria-label="Thème de couleur"
            className="flex items-center p-0.5 rounded-md theme-muted border text-[11px]"
          >
            {(
              [
                { id: 'mushaf', label: 'Papier' },
                { id: 'dark', label: 'Nuit' },
                { id: 'minimal', label: 'Blanc' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  theme === t.id
                    ? 'theme-surface font-semibold shadow-2xs'
                    : 'theme-text-muted hover:text-[var(--text-main)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsSessionModalOpen((prev) => !prev)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
              isSessionModalOpen
                ? 'theme-badge-check1'
                : 'theme-surface hover:bg-[var(--bg-muted)]'
            }`}
          >
            {isSessionModalOpen ? 'Chrono actif ⏱' : 'Chrono'}
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5">
        {activeTab === 'hifdh' && (
          <HifdhMushafView
            state={state}
            selectedSurahNumber={selectedSurahNumber}
            audioController={audioController}
            onSelectSurah={(num) => setSelectedSurahNumber(num)}
            onToggleSurahCheck1={handleToggleSurahCheck1}
            onToggleSurahCheck2={handleToggleSurahCheck2}
            onToggleHalfHizbCheck1={handleToggleHalfHizbCheck1}
            onToggleHalfHizbCheck2={handleToggleHalfHizbCheck2}
          />
        )}

        {activeTab === 'quran' && (
          <QuranReaderView
            state={state}
            selectedSurahNumber={selectedSurahNumber}
            initialSubTab={readerSubTab}
            audioController={audioController}
            onSelectSurah={(num) => setSelectedSurahNumber(num)}
            onToggleSurahCheck1={handleToggleSurahCheck1}
            onToggleSurahCheck2={handleToggleSurahCheck2}
            onToggleHalfHizbCheck1={handleToggleHalfHizbCheck1}
            onToggleHalfHizbCheck2={handleToggleHalfHizbCheck2}
            onToggleFlaggedVerse={handleToggleFlaggedVerse}
          />
        )}

        {activeTab === 'tracker' && (
          <TrackerDoubleCheckView
            state={state}
            stats={stats}
            reminders={reminders}
            onToggleHalfHizbCheck1={handleToggleHalfHizbCheck1}
            onToggleHalfHizbCheck2={handleToggleHalfHizbCheck2}
            onToggleSurahCheck1={handleToggleSurahCheck1}
            onToggleSurahCheck2={handleToggleSurahCheck2}
            onUpdatePace={(newPace) => handleUpdateSchedule({ weeklyHizbPace: newPace })}
            onUpdateDirectionOrder={(dir) => handleUpdateSchedule({ directionOrder: dir })}
            onOpenReaderForSurah={handleOpenReaderForSurah}
            onOpenHifdhMushafForSurah={handleOpenHifdhMushafForSurah}
          />
        )}

        {activeTab === 'planner' && (
          <PlannerAndRemindersView
            state={state}
            reminders={reminders}
            onUpdateSchedule={handleUpdateSchedule}
            onUpdatePlannedSessions={handleUpdatePlannedSessions}
            onAddSession={handleAddSession}
            onDeleteSession={handleDeleteSession}
            onToggleSurahCheck1={handleToggleSurahCheck1}
            onToggleSurahCheck2={handleToggleSurahCheck2}
            onToggleHalfHizbCheck2={handleToggleHalfHizbCheck2}
            onOpenReaderForSurah={handleOpenReaderForSurah}
            onOpenHifdhMushafForSurah={handleOpenHifdhMushafForSurah}
            onExportBackup={handleExportBackup}
            onImportBackupJson={handleImportBackupJson}
            onResetState={() => setState(createInitialHifdhState())}
          />
        )}
      </main>

      {/* Persistent Root-Level Audio Elements (Never unmount across tab/page changes) */}
      <audio
        ref={audioRef}
        onEnded={handleGlobalAudioEnded}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setAudioCurrentTime(audioRef.current.currentTime);
            setAudioDuration(audioRef.current.duration || 0);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setAudioDuration(audioRef.current.duration || 0);
            audioRef.current.playbackRate = playbackRate;
          }
        }}
        preload="auto"
        className="hidden"
      />
      <audio ref={preloadAudioRef} preload="auto" className="hidden" />

      {/* Persistent Bottom Audio Player Bar with 1x | 3x | 5x | ∞ and 0.85x | 1x | 1.15x */}
      <GlobalAudioPlayerBar controller={audioController} />

      {/* Non-Blocking Floating Chrono Dock */}
      <SessionTimerModal
        isOpen={isSessionModalOpen}
        defaultDurationMinutes={state.schedule.sessionsPerWeek === 2 ? 90 : 60}
        onClose={() => setIsSessionModalOpen(false)}
        onSaveSession={handleAddSession}
      />
    </div>
  );
}
