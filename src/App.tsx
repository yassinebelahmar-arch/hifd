/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { HifdhMushafView } from './components/HifdhMushafView';
import { QuranReaderView } from './components/QuranReaderView';
import { TrackerDoubleCheckView } from './components/TrackerDoubleCheckView';
import { PlannerAndRemindersView } from './components/PlannerAndRemindersView';
import { SessionTimerModal } from './components/SessionTimerModal';
import { ALL_HALF_HIZBS } from './data/quranMetadata';
import {
  HifdhSessionLog,
  HifdhState,
  PlannedWeeklySession,
  WeeklyScheduleConfig,
  applyCheck1Toggle,
  applyCheck2Toggle,
  calculateHifdhStats,
  calculateWeeklySessionSummary,
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

      // Also sync Half-Hizb Check 1 if this Surah is the startSurah of a Half-Hizb
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

      // Also sync Half-Hizb Check 2 if this Surah is the startSurah of a Half-Hizb so the projection updates!
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
    <div className="min-h-screen flex flex-col theme-app transition-colors duration-200">
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
