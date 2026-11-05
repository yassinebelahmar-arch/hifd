import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  Clock,
  Download,
  Headphones,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { ALL_HALF_HIZBS, ALL_SURAHS } from '../data/quranMetadata';
import {
  HifdhSessionLog,
  HifdhState,
  RevisionReminderItem,
  WeeklyScheduleConfig,
  calculateWeeklySessionSummary,
  computePracticedMinutesFromSeconds,
} from '../utils/hifdhLogic';

interface PlannerAndRemindersViewProps {
  state: HifdhState;
  reminders: RevisionReminderItem[];
  onUpdateSchedule: (patch: Partial<WeeklyScheduleConfig>) => void;
  onAddSession: (session: Omit<HifdhSessionLog, 'id' | 'dateIso'>) => void;
  onDeleteSession?: (sessionId: string) => void;
  onToggleHalfHizbCheck2: (id: number) => void;
  onOpenReaderForSurah: (surahNumber: number, tab?: 'mushaf' | 'tafsir' | 'quiz') => void;
  onOpenHifdhMushafForSurah?: (surahNumber: number) => void;
  onExportBackup: () => void;
  onImportBackupJson: (jsonText: string) => boolean;
  onResetState: () => void;
}

const ALL_WEEK_DAYS = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
];

export const PlannerAndRemindersView: React.FC<PlannerAndRemindersViewProps> = ({
  state,
  reminders,
  onUpdateSchedule,
  onAddSession,
  onDeleteSession,
  onToggleHalfHizbCheck2,
  onOpenReaderForSurah,
  onOpenHifdhMushafForSurah,
  onExportBackup,
  onImportBackupJson,
  onResetState,
}) => {
  const summary = calculateWeeklySessionSummary(state.sessions, state.schedule);

  // Live Studio Stopwatch / Countdown State
  const [studioMode, setStudioMode] = useState<'stopwatch' | 'countdown'>('countdown');
  const [targetMinutes, setTargetMinutes] = useState<number>(
    state.schedule.sessionsPerWeek === 2 ? 90 : 60
  );
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedSurahNum, setSelectedSurahNum] = useState<number>(67);
  const [sessionType, setSessionType] = useState<HifdhSessionLog['sessionType']>('memorization');
  const [customNote, setCustomNote] = useState<string>('');
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'memorization' | 'revision_check2'>('all');

  // Interactive 3-Step Hifdh Session Checklist
  const [stepChecks, setStepChecks] = useState<{ s1: boolean; s2: boolean; s3: boolean }>({
    s1: false,
    s2: false,
    s3: false,
  });

  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRunning]);

  const totalTargetSeconds = targetMinutes * 60;
  const displaySeconds =
    studioMode === 'countdown'
      ? Math.max(0, totalTargetSeconds - elapsedSeconds)
      : elapsedSeconds;

  const hrs = Math.floor(displaySeconds / 3600);
  const mins = Math.floor((displaySeconds % 3600) / 60);
  const secs = displaySeconds % 60;
  const formattedStudioTime =
    hrs > 0
      ? `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const practicedMinutes = computePracticedMinutesFromSeconds(elapsedSeconds, targetMinutes);

  const selectedSurahMeta = useMemo(
    () => ALL_SURAHS.find((s) => s.number === selectedSurahNum) || ALL_SURAHS[66],
    [selectedSurahNum]
  );

  const matchingHalfHizb = useMemo(
    () =>
      ALL_HALF_HIZBS.find(
        (h) => selectedSurahNum >= h.startSurah && selectedSurahNum <= h.endSurah
      ) || ALL_HALF_HIZBS[112],
    [selectedSurahNum]
  );

  const toggleDaySelection = (day: string) => {
    const exists = state.schedule.selectedDays.includes(day);
    let nextDays: string[];
    if (exists) {
      if (state.schedule.selectedDays.length <= 1) return;
      nextDays = state.schedule.selectedDays.filter((d) => d !== day);
    } else {
      nextDays = [...state.schedule.selectedDays, day];
    }
    onUpdateSchedule({ selectedDays: nextDays });
  };

  const handleSaveSessionFromStudio = (minutesToCredit: number) => {
    if (!minutesToCredit || minutesToCredit <= 0) return;
    const completedStepsCount =
      (stepChecks.s1 ? 1 : 0) + (stepChecks.s2 ? 1 : 0) + (stepChecks.s3 ? 1 : 0);
    const stepSuffix =
      completedStepsCount > 0 ? ` · ${completedStepsCount}/3 étapes validées` : '';
    const notePart = customNote.trim() ? ` — ${customNote.trim()}` : '';

    const label = `Sourate ${selectedSurahMeta.nameFr} (${matchingHalfHizb.labelFr})${stepSuffix}${notePart}`;

    onAddSession({
      durationMinutes: Number(minutesToCredit),
      sessionType,
      targetLabel: label,
      halfHizbId: matchingHalfHizb.id,
      surahNumber: selectedSurahMeta.number,
    });

    setIsRunning(false);
    setElapsedSeconds(0);
    setCustomNote('');
    setStepChecks({ s1: false, s2: false, s3: false });
    setFeedbackBanner(
      `Séance de ${minutesToCredit} min sur Sourate ${selectedSurahMeta.nameFr} enregistrée dans votre objectif de 3h/semaine.`
    );
    window.setTimeout(() => setFeedbackBanner(null), 4000);
  };

  const handleManualFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveSessionFromStudio(targetMinutes);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const ok = onImportBackupJson(reader.result);
        setFeedbackBanner(ok ? 'Sauvegarde importée avec succès.' : 'Fichier JSON invalide.');
      }
    };
    reader.readAsText(file);
  };

  // Breakdown of all-time statistics
  const totalMinutesAllTime = useMemo(
    () => state.sessions.reduce((acc, s) => acc + s.durationMinutes, 0),
    [state.sessions]
  );
  const memorizationMinutes = useMemo(
    () =>
      state.sessions
        .filter((s) => s.sessionType === 'memorization')
        .reduce((acc, s) => acc + s.durationMinutes, 0),
    [state.sessions]
  );
  const revisionMinutes = useMemo(
    () =>
      state.sessions
        .filter((s) => s.sessionType !== 'memorization')
        .reduce((acc, s) => acc + s.durationMinutes, 0),
    [state.sessions]
  );

  const filteredSessions = useMemo(() => {
    if (historyFilter === 'all') return state.sessions;
    if (historyFilter === 'memorization') {
      return state.sessions.filter((s) => s.sessionType === 'memorization');
    }
    return state.sessions.filter((s) => s.sessionType !== 'memorization');
  }, [state.sessions, historyFilter]);

  return (
    <div className="space-y-6 pb-20">
      {feedbackBanner && (
        <div
          role="status"
          className="p-3.5 rounded-xl theme-badge-check2 border text-xs sm:text-sm font-semibold"
        >
          {feedbackBanner}
        </div>
      )}

      {/* SECTION 1: LIVE SESSION STUDIO (CHRONO & MINUTEUR + PROTOCOLE EN 3 ÉTAPES) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left 7 Cols: Interactive Timer & Session Target */}
        <div className="lg:col-span-7 theme-surface border rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b theme-border pb-3.5">
            <div>
              <h1 className="text-lg sm:text-xl font-bold">
                Studio de Séance Hifdh (Chrono &amp; Minuteur)
              </h1>
              <p className="text-xs theme-text-muted">
                Lancez votre séance, ouvrez le Mushaf pour mémoriser, puis validez votre temps en 1 clic.
              </p>
            </div>

            {/* Mode Switch: Minuteur vs Chrono libre */}
            <div className="flex items-center gap-1 p-1 theme-muted border rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setStudioMode('countdown')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                  studioMode === 'countdown'
                    ? 'theme-surface font-semibold shadow-2xs'
                    : 'theme-text-muted'
                }`}
              >
                Minuteur
              </button>
              <button
                type="button"
                onClick={() => setStudioMode('stopwatch')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                  studioMode === 'stopwatch'
                    ? 'theme-surface font-semibold shadow-2xs'
                    : 'theme-text-muted'
                }`}
              >
                Chrono libre
              </button>
            </div>
          </div>

          {/* Big Timer Display + Duration Presets */}
          <div className="p-5 rounded-2xl theme-muted border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs theme-text-muted">
                {studioMode === 'countdown'
                  ? `Compte à rebours (Séance de ${targetMinutes} min)`
                  : `Temps écoulé (Cible : ${targetMinutes} min)`}
              </div>
              <div
                data-testid="studio-timer-display"
                className="text-4xl sm:text-5xl font-mono-tabular font-bold tracking-tight mt-1"
              >
                {formattedStudioTime}
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-2.5">
              {/* Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { m: 30, label: '30 min' },
                  { m: 45, label: '45 min' },
                  { m: 60, label: '1h00 (3×/sem)' },
                  { m: 90, label: '1h30 (2×/sem)' },
                ].map((p) => (
                  <button
                    key={p.m}
                    type="button"
                    onClick={() => {
                      setTargetMinutes(p.m);
                      if (!isRunning) setElapsedSeconds(0);
                    }}
                    className={`px-2.5 py-1 text-xs font-mono-tabular rounded-lg border cursor-pointer ${
                      targetMinutes === p.m
                        ? 'theme-btn-primary border-transparent font-semibold'
                        : 'theme-surface theme-text-muted'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Start / Pause / Reset */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRunning((r) => !r)}
                  className="px-4 py-2 text-xs font-bold theme-btn-primary rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isRunning ? 'Mettre en pause' : 'Démarrer la séance'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsRunning(false);
                    setElapsedSeconds(0);
                  }}
                  title="Remettre à zéro"
                  className="p-2 rounded-xl border theme-surface cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Target Surah & Session Type Selector */}
          <form onSubmit={handleManualFormSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="studio-surah-select" className="block text-xs font-medium theme-text-muted mb-1">
                  Sourate étudiée pendant cette séance :
                </label>
                <select
                  id="studio-surah-select"
                  value={selectedSurahNum}
                  onChange={(e) => setSelectedSurahNum(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-semibold theme-muted border rounded-xl focus:outline-none"
                >
                  {ALL_SURAHS.slice()
                    .reverse()
                    .map((s) => (
                      <option key={s.number} value={s.number}>
                        {s.number}. Sourate {s.nameFr} ({s.nameAr}) — Hizb {s.hizbStart}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label htmlFor="studio-type-select" className="block text-xs font-medium theme-text-muted mb-1">
                  Objectif de la séance :
                </label>
                <select
                  id="studio-type-select"
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs font-semibold theme-muted border rounded-xl focus:outline-none"
                >
                  <option value="memorization">Mémorisation (1er Check)</option>
                  <option value="revision_check2">Consolidation &amp; Révision (2ème Check)</option>
                  <option value="wird_consolidation">Révision d’entretien</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 text-xs font-bold theme-btn-primary rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>
                  Valider &amp; Enregistrer +{practicedMinutes} min sur mes 3h/semaine
                </span>
              </button>

              {onOpenHifdhMushafForSurah && (
                <button
                  type="button"
                  onClick={() => onOpenHifdhMushafForSurah(selectedSurahNum)}
                  className="py-2.5 px-3.5 text-xs font-semibold rounded-xl border theme-muted hover:opacity-80 flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Ouvrir le Mushaf</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right 5 Cols: Guided 3-Step Hifdh Method Checklist + Weekly 3h Gauge */}
        <div className="lg:col-span-5 theme-surface border rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b theme-border pb-3">
              <h2 className="text-base font-bold">
                Méthode Hifdh en 3 Étapes (Pendant la séance)
              </h2>
              <span className="text-xs font-mono-tabular theme-text-muted">
                {(stepChecks.s1 ? 1 : 0) + (stepChecks.s2 ? 1 : 0) + (stepChecks.s3 ? 1 : 0)}/3
              </span>
            </div>

            <div className="space-y-2">
              {[
                {
                  key: 's1' as const,
                  title: '1. Écoute & Compréhension (15 min)',
                  desc: 'Écouter Cheikh Yasser Al-Dosari et cliquer sur les mots difficiles pour lire leur Tafsir.',
                },
                {
                  key: 's2' as const,
                  title: '2. Répétition & Liaison (30 min)',
                  desc: 'Mémoriser verset par verset puis lier les versets entre eux de façon fluide.',
                },
                {
                  key: 's3' as const,
                  title: '3. Récitation Mushaf Masqué (15 min)',
                  desc: 'Activer le mode « Masquer (Hifdh) » sur la page Hifdh et réciter toute la page sans faute.',
                },
              ].map((step) => {
                const checked = stepChecks[step.key];
                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() =>
                      setStepChecks((prev) => ({ ...prev, [step.key]: !prev[step.key] }))
                    }
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      checked ? 'theme-badge-check2' : 'theme-muted'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                        checked ? 'theme-btn-primary border-transparent' : 'theme-surface'
                      }`}
                    >
                      {checked && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold">{step.title}</div>
                      <div className="text-[11px] opacity-80 mt-0.5 leading-relaxed">
                        {step.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weekly 3h Summary Box */}
          <div className="p-4 rounded-xl theme-muted border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold">Volume réalisé cette semaine :</span>
              <span className="font-mono-tabular font-bold">
                {summary.completedHoursFormatted} / {state.schedule.weeklyHoursTarget}h00 ({summary.progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2.5 theme-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent-done)] transition-all duration-300"
                style={{ width: `${summary.progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] theme-text-muted pt-0.5">
              <span>
                Total cumulé : <strong>{Math.floor(totalMinutesAllTime / 60)}h{String(totalMinutesAllTime % 60).padStart(2, '0')}</strong>
              </span>
              <span>
                Hifdh : {memorizationMinutes}m · Révision : {revisionMinutes}m
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: INTERACTIVE 7-DAY WEEKLY SCHEDULE (2 OR 3 SESSIONS / WEEK) */}
      <section className="theme-surface border rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold">
              Votre Planning Hebdomadaire (3 Heures divisées en {state.schedule.sessionsPerWeek} séances)
            </h2>
            <p className="text-xs theme-text-muted">
              Choisissez 2 séances de 1h30 ou 3 séances de 1h00 et cliquez sur vos jours dans le semainier ci-dessous.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onUpdateSchedule({
                  sessionsPerWeek: 2,
                  selectedDays: ['Mercredi', 'Dimanche'],
                });
                setTargetMinutes(90);
              }}
              className={`px-3 py-1.5 text-xs rounded-xl border cursor-pointer ${
                state.schedule.sessionsPerWeek === 2
                  ? 'theme-btn-primary border-transparent font-bold'
                  : 'theme-muted theme-text-muted'
              }`}
            >
              2 × 1h30 / sem
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdateSchedule({
                  sessionsPerWeek: 3,
                  selectedDays: ['Mardi', 'Jeudi', 'Dimanche'],
                });
                setTargetMinutes(60);
              }}
              className={`px-3 py-1.5 text-xs rounded-xl border cursor-pointer ${
                state.schedule.sessionsPerWeek === 3
                  ? 'theme-btn-primary border-transparent font-bold'
                  : 'theme-muted theme-text-muted'
              }`}
            >
              3 × 1h00 / sem
            </button>
          </div>
        </div>

        {/* Visual 7-Day Week Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {ALL_WEEK_DAYS.map((day) => {
            const isPlanned = state.schedule.selectedDays.includes(day);
            const recommendedMin = state.schedule.sessionsPerWeek === 2 ? 90 : 60;

            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDaySelection(day)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isPlanned ? 'theme-badge-check2 font-semibold' : 'theme-muted opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{day}</span>
                  {isPlanned && <Clock className="w-3.5 h-3.5" />}
                </div>
                <div className="text-[11px]">
                  {isPlanned ? `Séance ${recommendedMin} min` : 'Repos / Wird'}
                </div>
                <div className="text-[10px] opacity-75">
                  {isPlanned ? `Rappel à ${state.schedule.reminderTime}` : 'Cliquer pour activer'}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: SMART REVISION REMINDERS & SESSION LOG HISTORY */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 6 Cols: Passages waiting for Revision (Check 2) */}
        <div className="lg:col-span-6 theme-surface border rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">
              Passages à réviser (Pour valider le 2ème Check)
            </h2>
            <span className="text-xs theme-text-muted">Délai conseillé : 3–7j</span>
          </div>

          <div className="space-y-2.5">
            {reminders.map((item) => {
              const prog = state.halfHizbProgress[item.halfHizb.id];
              const isCheck2Done = Boolean(prog?.check2Revised);

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl theme-muted border flex flex-col justify-between gap-2.5"
                >
                  <div>
                    <div className="text-[11px] font-semibold text-[var(--accent-gold)]">
                      {item.headlineFr}
                    </div>
                    <div className="text-sm font-bold mt-0.5">{item.halfHizb.labelFr}</div>
                    <div className="text-xs theme-text-muted">
                      {item.halfHizb.featuredSurahNames}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t theme-border">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSurahNum(item.halfHizb.startSurah);
                        setSessionType('revision_check2');
                        setIsRunning(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border theme-surface cursor-pointer flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" />
                      <span>Lancer séance dessus</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenReaderForSurah(item.halfHizb.startSurah, 'mushaf')}
                      className="px-2.5 py-1 text-xs rounded-lg border theme-surface cursor-pointer flex items-center gap-1"
                    >
                      <Headphones className="w-3 h-3" />
                      <span>Écouter</span>
                    </button>

                    {!isCheck2Done && (
                      <button
                        type="button"
                        onClick={() => onToggleHalfHizbCheck2(item.halfHizb.id)}
                        className="px-3 py-1 text-xs font-semibold rounded-lg border theme-badge-check2 cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        <Check className="w-3 h-3" />
                        <span>Valider 2ème Check</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 6 Cols: Session Log History */}
        <div className="lg:col-span-6 theme-surface border rounded-2xl p-5 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold">
                Historique des séances ({filteredSessions.length})
              </h2>
              <div className="flex items-center gap-1 p-0.5 theme-muted border rounded-lg text-[11px]">
                {[
                  { id: 'all', label: 'Toutes' },
                  { id: 'memorization', label: 'Hifdh' },
                  { id: 'revision_check2', label: 'Révision' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setHistoryFilter(f.id as any)}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      historyFilter === f.id
                        ? 'theme-surface font-semibold'
                        : 'theme-text-muted'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y theme-border">
              {filteredSessions.map((sess) => (
                <div
                  key={sess.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{sess.targetLabel}</div>
                    <div className="text-[11px] theme-text-muted mt-0.5">
                      {sess.sessionType === 'memorization'
                        ? 'Mémorisation (1er Check)'
                        : sess.sessionType === 'revision_check2'
                          ? 'Consolidation (2ème Check)'
                          : 'Révision libre'}{' '}
                      · {new Date(sess.dateIso).toLocaleDateString('fr-FR')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded theme-badge-check2 border font-mono-tabular font-bold">
                      {sess.durationMinutes} min
                    </span>
                    {onDeleteSession && (
                      <button
                        type="button"
                        onClick={() => onDeleteSession(sess.id)}
                        title="Supprimer cette séance"
                        className="p-1 rounded hover:bg-[var(--bg-muted)] theme-text-muted cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Backup Footer inside History Card */}
          <div className="pt-3 border-t theme-border flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="theme-text-muted">Sauvegarde locale automatique</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onExportBackup}
                className="px-2.5 py-1 rounded border theme-muted flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Exporter</span>
              </button>
              <label className="px-2.5 py-1 rounded border theme-muted flex items-center gap-1 cursor-pointer">
                <Upload className="w-3 h-3" />
                <span>Importer</span>
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={onResetState}
                className="px-2 py-1 theme-text-muted hover:text-[var(--text-main)] cursor-pointer"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
