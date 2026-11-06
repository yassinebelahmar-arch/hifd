import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Calendar,
  Check,
  CheckCheck,
  Clock,
  Download,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { ALL_SURAHS } from '../data/quranMetadata';
import {
  HifdhSessionLog,
  HifdhState,
  PlannedWeeklySession,
  RevisionReminderItem,
  SessionPortionType,
  WeeklyScheduleConfig,
  calculateWeeklySessionSummary,
  computePracticedMinutesFromSeconds,
  createDefaultPlannedWeeklySessions,
  getPortionLabelBilingual,
  toArabicDigits,
} from '../utils/hifdhLogic';

interface PlannerAndRemindersViewProps {
  state: HifdhState;
  reminders: RevisionReminderItem[];
  onUpdateSchedule: (patch: Partial<WeeklyScheduleConfig>) => void;
  onUpdatePlannedSessions: (sessions: PlannedWeeklySession[]) => void;
  onAddSession: (session: Omit<HifdhSessionLog, 'id' | 'dateIso'>) => void;
  onDeleteSession: (sessionId: string) => void;
  onToggleSurahCheck1: (surahNumber: number) => void;
  onToggleSurahCheck2: (surahNumber: number) => void;
  onToggleHalfHizbCheck2: (id: number) => void;
  onOpenReaderForSurah: (surahNumber: number, subTab?: 'mushaf' | 'tafsir' | 'quiz') => void;
  onOpenHifdhMushafForSurah: (surahNumber: number) => void;
  onExportBackup: () => void;
  onImportBackupJson: (jsonText: string) => boolean;
  onResetState: () => void;
}

const DAYS_OF_WEEK: { fr: string; ar: string }[] = [
  { fr: 'Lundi', ar: 'الإثنين' },
  { fr: 'Mardi', ar: 'الثلاثاء' },
  { fr: 'Mercredi', ar: 'الأربعاء' },
  { fr: 'Jeudi', ar: 'الخميس' },
  { fr: 'Vendredi', ar: 'الجمعة' },
  { fr: 'Samedi', ar: 'السبت' },
  { fr: 'Dimanche', ar: 'الأحد' },
];

const PORTION_OPTIONS: {
  id: SessionPortionType;
  labelFr: string;
  labelAr: string;
}[] = [
  { id: '1_8_hizb', labelFr: '1/8 Hizb', labelAr: 'ثمن حزب (١/٨)' },
  { id: '1_4_hizb', labelFr: '1/4 Hizb', labelAr: 'ربع حزب (١/٤)' },
  { id: '1_2_hizb', labelFr: '1/2 Hizb', labelAr: 'نصف حزب (١/٢)' },
  { id: '1_surah', labelFr: '1 Sourate', labelAr: 'سورة واحدة (١)' },
  { id: '2_surahs', labelFr: '2 Sourates', labelAr: 'سورتان (٢)' },
];

export const PlannerAndRemindersView: React.FC<PlannerAndRemindersViewProps> = ({
  state,
  onUpdatePlannedSessions,
  onAddSession,
  onDeleteSession,
  onToggleSurahCheck1,
  onToggleSurahCheck2,
  onOpenHifdhMushafForSurah,
  onExportBackup,
  onImportBackupJson,
  onResetState,
}) => {
  const weeklySummary = useMemo(
    () => calculateWeeklySessionSummary(state.sessions, state.schedule),
    [state.sessions, state.schedule]
  );

  // Canonical Quran Surah order (1. Al-Fatiha -> 2. Al-Baqarah -> ... -> 114. An-Nas)
  const orderedSurahs = useMemo(() => {
    return [...ALL_SURAHS].sort((a, b) => a.number - b.number);
  }, []);

  const plannedSessions = useMemo(
    () => state.plannedWeeklySessions || createDefaultPlannedWeeklySessions(),
    [state.plannedWeeklySessions]
  );

  // --- FORM STATE FOR PREPARING A SESSION BEFOREHAND ---
  const [newDayName, setNewDayName] = useState<string>('Lundi');
  const [newDurationMinutes, setNewDurationMinutes] = useState<number>(90); // 1h30 default
  const [newGoalType, setNewGoalType] = useState<'revision' | 'memorization' | 'both'>('revision');
  const [newPortionType, setNewPortionType] = useState<SessionPortionType>('1_surah');
  const [newPrimarySurah, setNewPrimarySurah] = useState<number>(67); // Al-Mulk
  const [newSecondarySurah, setNewSecondarySurah] = useState<number>(78); // An-Naba
  const [newHizbNumber, setNewHizbNumber] = useState<number>(57);
  const [newCustomNote, setNewCustomNote] = useState<string>('');

  // --- POST-SESSION UPDATE DRAWER STATE ---
  const [updatingSessionId, setUpdatingSessionId] = useState<string | null>(null);
  const [updateActualMinutes, setUpdateActualMinutes] = useState<number>(90);
  const [updatePostNote, setUpdatePostNote] = useState<string>('');

  // --- LIVE CHRONO & TIMER STUDIO STATE ---
  const [timerMode, setTimerMode] = useState<'stopwatch' | 'countdown'>('countdown');
  const [presetMinutes, setPresetMinutes] = useState<number>(90);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activePlannedSessionId, setActivePlannedSessionId] = useState<string | null>(null);
  const [activeTimerSurah, setActiveTimerSurah] = useState<number>(67);
  const [sessionSavedToast, setSessionSavedToast] = useState<string | null>(null);

  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);

  const countdownTotalSeconds = presetMinutes * 60;
  const remainingCountdownSeconds = Math.max(0, countdownTotalSeconds - elapsedSeconds);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        if (timerMode === 'countdown' && prev + 1 >= countdownTotalSeconds) {
          setIsRunning(false);
          return countdownTotalSeconds;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, timerMode, countdownTotalSeconds]);

  const formatTimerClock = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDurationLabel = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h${String(m).padStart(2, '0')}`;
    if (h > 0) return `${h}h00`;
    return `${m} min`;
  };

  const handleAddPlannedSession = (e: React.FormEvent) => {
    e.preventDefault();
    const s1 = ALL_SURAHS.find((s) => s.number === newPrimarySurah) || ALL_SURAHS[66];
    const newItem: PlannedWeeklySession = {
      id: `plan-${Date.now()}`,
      dayName: newDayName,
      plannedDurationMinutes: newDurationMinutes,
      goalType: newGoalType,
      portionType: newPortionType,
      primarySurahNumber: newPrimarySurah,
      secondarySurahNumber: newPortionType === '2_surahs' ? newSecondarySurah : undefined,
      hizbNumber:
        newPortionType === '1_8_hizb' ||
        newPortionType === '1_4_hizb' ||
        newPortionType === '1_2_hizb'
          ? newHizbNumber
          : s1.hizbStart,
      customNote: newCustomNote.trim() || undefined,
      status: 'planned',
    };

    onUpdatePlannedSessions([newItem, ...plannedSessions]);
    setNewCustomNote('');
    setSessionSavedToast(
      `Séance programmée pour ${newDayName} (${formatDurationLabel(newDurationMinutes)}) !`
    );
    setTimeout(() => setSessionSavedToast(null), 3500);
  };

  const handleDeletePlannedSession = (id: string) => {
    onUpdatePlannedSessions(plannedSessions.filter((s) => s.id !== id));
  };

  const handleOpenPostSessionUpdate = (item: PlannedWeeklySession) => {
    if (updatingSessionId === item.id) {
      setUpdatingSessionId(null);
      return;
    }
    setUpdatingSessionId(item.id);
    setUpdateActualMinutes(item.actualDurationMinutes || item.plannedDurationMinutes);
    setUpdatePostNote(item.postSessionNote || '');
  };

  const handleConfirmPostSessionUpdate = (item: PlannedWeeklySession) => {
    const s1 = ALL_SURAHS.find((s) => s.number === item.primarySurahNumber) || ALL_SURAHS[66];
    const s2 =
      item.portionType === '2_surahs' && item.secondarySurahNumber
        ? ALL_SURAHS.find((s) => s.number === item.secondarySurahNumber)
        : undefined;
    const portionMeta = getPortionLabelBilingual(item.portionType);

    const updatedList: PlannedWeeklySession[] = plannedSessions.map((s) =>
      s.id === item.id
        ? {
            ...s,
            status: 'completed',
            completedAtIso: new Date().toISOString(),
            actualDurationMinutes: updateActualMinutes,
            postSessionNote: updatePostNote.trim() || undefined,
          }
        : s
    );

    onUpdatePlannedSessions(updatedList);

    // Also record in weekly session logs if not already completed before
    if (item.status !== 'completed') {
      const surahLabel = s2
        ? `Sourates ${s1.nameFr} (${s1.nameAr}) & ${s2.nameFr} (${s2.nameAr})`
        : `Sourate ${s1.nameFr} (${s1.nameAr})`;

      onAddSession({
        durationMinutes: updateActualMinutes,
        sessionType: item.goalType === 'memorization' ? 'memorization' : 'revision_check2',
        targetLabel: `${item.dayName} · ${portionMeta.shortFr} (${portionMeta.ar}) · ${surahLabel}${
          updatePostNote.trim() ? ` — ${updatePostNote.trim()}` : ''
        }`,
        surahNumber: item.primarySurahNumber,
      });
    }

    setUpdatingSessionId(null);
    setSessionSavedToast(
      `Séance de ${item.dayName} validée (${formatDurationLabel(updateActualMinutes)}) !`
    );
    setTimeout(() => setSessionSavedToast(null), 3500);
  };

  const handleLaunchPlannedSessionInChrono = (item: PlannedWeeklySession) => {
    setActivePlannedSessionId(item.id);
    setPresetMinutes(item.plannedDurationMinutes);
    setActiveTimerSurah(item.primarySurahNumber);
    setTimerMode('countdown');
    setElapsedSeconds(0);
    setIsRunning(true);
    const el = document.getElementById('live-chrono-studio');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSaveManualChronoSession = () => {
    const practicedMinutes = computePracticedMinutesFromSeconds(elapsedSeconds, presetMinutes);
    const sMeta = ALL_SURAHS.find((s) => s.number === activeTimerSurah) || ALL_SURAHS[66];

    onAddSession({
      durationMinutes: practicedMinutes,
      sessionType: 'memorization',
      targetLabel: `Séance Chrono · Sourate ${sMeta.nameFr} (${sMeta.nameAr})`,
      surahNumber: sMeta.number,
    });

    if (activePlannedSessionId) {
      const updatedList: PlannedWeeklySession[] = plannedSessions.map((s) =>
        s.id === activePlannedSessionId
          ? {
              ...s,
              status: 'completed',
              completedAtIso: new Date().toISOString(),
              actualDurationMinutes: practicedMinutes,
            }
          : s
      );
      onUpdatePlannedSessions(updatedList);
      setActivePlannedSessionId(null);
    }

    setIsRunning(false);
    setElapsedSeconds(0);
    setSessionSavedToast(`Séance de ${practicedMinutes} min enregistrée !`);
    setTimeout(() => setSessionSavedToast(null), 3500);
  };

  const totalPlannedMinutes = useMemo(
    () => plannedSessions.reduce((acc, s) => acc + s.plannedDurationMinutes, 0),
    [plannedSessions]
  );

  const completedPlannedCount = useMemo(
    () => plannedSessions.filter((s) => s.status === 'completed').length,
    [plannedSessions]
  );

  return (
    <div className="space-y-6 pb-20">
      {/* TOP SUMMARY BANNER: WEEKLY 3H TARGET & PLANNED OVERVIEW */}
      <section className="theme-surface border rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium theme-text-muted">
              <span className="font-arabic text-base text-[var(--text-main)]">
                برنامج الحفظ والمراجعة الأسبوعي (٣ ساعات / أسبوع)
              </span>
              <span>·</span>
              <span>Objectif 3h / semaine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Préparez votre programme avant la séance &amp; mettez-le à jour après
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 rounded-xl border theme-muted text-xs space-y-0.5">
              <div className="theme-text-muted">Heures effectuées (7j)</div>
              <div className="text-lg font-bold font-mono-tabular">
                {weeklySummary.completedHoursFormatted} / {state.schedule.weeklyHoursTarget}h00
              </div>
            </div>

            <div className="px-4 py-2.5 rounded-xl border theme-badge-check1 text-xs space-y-0.5">
              <div>Séances programmées</div>
              <div className="text-lg font-bold font-mono-tabular">
                {completedPlannedCount}/{plannedSessions.length} faites ({formatDurationLabel(totalPlannedMinutes)} prévues)
              </div>
            </div>
          </div>
        </div>

        {sessionSavedToast && (
          <div className="p-3 rounded-xl theme-badge-check2 border text-xs sm:text-sm font-semibold flex items-center justify-between">
            <span>✓ {sessionSavedToast}</span>
            <span className="font-arabic text-base">تم الحفظ بنجاح</span>
          </div>
        )}
      </section>

      {/* SECTION 1: PREPARE / SCHEDULE A SESSION BEFOREHAND (Programmer avant la séance) */}
      <section className="theme-surface border rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b theme-border pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[var(--accent-gold)]" />
              <span>1. Programmer une séance à l’avance (Avant la séance)</span>
            </h2>
            <p className="text-xs theme-text-muted mt-0.5">
              Exemple : Lundi · 1h30 · Réviser Sourate Al-Mulk (ou choisir 1/8 Hizb, 1/4 Hizb, 1 ou 2 Sourates).
            </p>
          </div>
          <span className="font-arabic text-lg font-bold text-[var(--accent-gold)]">
            ١. برمجة حصة جديدة قبل البدء
          </span>
        </div>

        <form onSubmit={handleAddPlannedSession} className="space-y-4">
          {/* Row 1: Day of Week + Duration + Goal Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step A: Choose Day (Lundi..Dimanche) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold flex items-center justify-between">
                <span>Jour de la séance :</span>
                <span className="font-arabic text-sm">اليوم</span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5">
                {DAYS_OF_WEEK.map((d) => {
                  const active = newDayName === d.fr;
                  return (
                    <button
                      key={d.fr}
                      type="button"
                      onClick={() => setNewDayName(d.fr)}
                      className={`py-1.5 px-2 rounded-lg border text-xs cursor-pointer transition-all flex flex-col items-center ${
                        active
                          ? 'theme-btn-primary border-transparent font-bold'
                          : 'theme-muted theme-text-muted hover:text-[var(--text-main)]'
                      }`}
                    >
                      <span>{d.fr.slice(0, 3)}.</span>
                      <span className="font-arabic text-[11px]">{d.ar}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step B: Choose Planned Duration (1h30, 1h00, 45m, 30m) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold flex items-center justify-between">
                <span>Durée prévue :</span>
                <span className="font-arabic text-sm">مدة الحصة</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { mins: 90, label: '1h30 (2×/sem)', ar: 'ساعة ونصف' },
                  { mins: 60, label: '1h00 (3×/sem)', ar: 'ساعة واحدة' },
                  { mins: 45, label: '45 min', ar: '٤٥ دقيقة' },
                  { mins: 30, label: '30 min', ar: '٣٠ دقيقة' },
                ].map((d) => {
                  const active = newDurationMinutes === d.mins;
                  return (
                    <button
                      key={d.mins}
                      type="button"
                      onClick={() => setNewDurationMinutes(d.mins)}
                      className={`py-2 px-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        active
                          ? 'theme-btn-primary border-transparent font-bold'
                          : 'theme-muted theme-text-muted hover:text-[var(--text-main)]'
                      }`}
                    >
                      <span className="font-mono-tabular">{d.label}</span>
                      <span className="font-arabic text-xs">{d.ar}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step C: Goal Type (Réviser vs Mémoriser vs Les deux) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold flex items-center justify-between">
                <span>Type de séance :</span>
                <span className="font-arabic text-sm">نوع الحصة</span>
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { id: 'revision' as const, fr: 'Réviser (Validation / Entretien)', ar: 'مراجعة وتثبيت' },
                  { id: 'memorization' as const, fr: 'Mémoriser (Nouveau Hifdh)', ar: 'حفظ جديد' },
                  { id: 'both' as const, fr: 'Hifdh + Révision combinés', ar: 'حفظ ومراجعة' },
                ].map((g) => {
                  const active = newGoalType === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setNewGoalType(g.id)}
                      className={`py-1.5 px-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        active
                          ? 'theme-btn-primary border-transparent font-bold'
                          : 'theme-muted theme-text-muted hover:text-[var(--text-main)]'
                      }`}
                    >
                      <span>{g.fr}</span>
                      <span className="font-arabic text-sm">{g.ar}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 2: Portion Per Session Selector (1/8 Hizb | 1/4 Hizb | 1/2 Hizb | 1 Sourate | 2 Sourates) */}
          <div className="space-y-2 pt-2 border-t theme-border">
            <label className="text-xs font-semibold flex items-center justify-between">
              <span>Quantité à travailler pendant la séance (1/8, 1/4 Hizb ou 1 / 2 Sourates) :</span>
              <span className="font-arabic text-sm">المقدار المبرمج في الحصة</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {PORTION_OPTIONS.map((p) => {
                const active = newPortionType === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    data-testid={`portion-${p.id}`}
                    onClick={() => setNewPortionType(p.id)}
                    className={`p-3 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-0.5 ${
                      active
                        ? 'theme-badge-check1 border-[var(--accent-gold)] ring-2 ring-[var(--accent-gold)] font-bold'
                        : 'theme-muted opacity-90 hover:opacity-100'
                    }`}
                  >
                    <span className="font-arabic text-base font-bold">{p.labelAr}</span>
                    <span className="text-xs">{p.labelFr}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Target Surah(s) & Hizb Selection + Custom Pre-Session Note */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t theme-border">
            <div className="space-y-3">
              {/* Primary Surah Selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold flex items-center justify-between">
                  <span>
                    {newPortionType === '2_surahs'
                      ? '1ère Sourate à travailler :'
                      : 'Sourate à réviser / mémoriser :'}
                  </span>
                  <span className="font-arabic text-sm">اختيار السورة</span>
                </label>
                <select
                  aria-label="Choisir la sourate principale pour la séance"
                  value={newPrimarySurah}
                  onChange={(e) => {
                    const num = Number(e.target.value);
                    setNewPrimarySurah(num);
                    const found = ALL_SURAHS.find((s) => s.number === num);
                    if (found) setNewHizbNumber(found.hizbStart);
                  }}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border theme-muted font-medium cursor-pointer"
                >
                  {orderedSurahs.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number}. Sourate {s.nameFr} — سورة {s.nameAr} (Hizb {s.hizbStart} · {s.ayahCount} v.)
                    </option>
                  ))}
                </select>
              </div>

              {/* Secondary Surah Selector (Only when '2_surahs' is chosen) */}
              {newPortionType === '2_surahs' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold flex items-center justify-between">
                    <span>2ème Sourate de la séance :</span>
                    <span className="font-arabic text-sm">السورة الثانية</span>
                  </label>
                  <select
                    aria-label="Choisir la deuxième sourate pour la séance"
                    value={newSecondarySurah}
                    onChange={(e) => setNewSecondarySurah(Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border theme-muted font-medium cursor-pointer"
                  >
                    {orderedSurahs.map((s) => (
                      <option key={s.number} value={s.number}>
                        {s.number}. Sourate {s.nameFr} — سورة {s.nameAr} (Hizb {s.hizbStart} · {s.ayahCount} v.)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Hizb selector when 1/8, 1/4, or 1/2 Hizb is chosen */}
              {(newPortionType === '1_8_hizb' ||
                newPortionType === '1_4_hizb' ||
                newPortionType === '1_2_hizb') && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold flex items-center justify-between">
                    <span>Numéro du Hizb ciblé (1 à 60) :</span>
                    <span className="font-arabic text-sm">رقم الحزب</span>
                  </label>
                  <select
                    aria-label="Choisir le numéro du Hizb"
                    value={newHizbNumber}
                    onChange={(e) => setNewHizbNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border theme-muted font-medium cursor-pointer"
                  >
                    {Array.from({ length: 60 }, (_, i) => 60 - i).map((h) => (
                      <option key={h} value={h}>
                        Hizb {h} · الحزب {toArabicDigits(h)} (Juz {Math.ceil(h / 2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Pre-session custom note + Submit button */}
            <div className="flex flex-col justify-between gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold flex items-center justify-between">
                  <span>Note / Programme précis avant la séance (optionnel) :</span>
                  <span className="font-arabic text-sm">ملاحظة قبل الحصة</span>
                </label>
                <input
                  type="text"
                  value={newCustomNote}
                  onChange={(e) => setNewCustomNote(e.target.value)}
                  placeholder="Ex: Réviser versets 1 à 20 + écouter Cheikh Yasser Al-Dosari..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border theme-muted focus:outline-none"
                />
              </div>

              <button
                type="submit"
                data-testid="add-planned-session-btn"
                className="w-full py-3 px-4 rounded-xl theme-btn-primary text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter à mon programme ({newDayName} · {formatDurationLabel(newDurationMinutes)})</span>
                <span className="font-arabic text-base">· إضافة للبرنامج</span>
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* SECTION 2: WEEKLY PROGRAM BOARD (Update manually after each session!) */}
      <section className="theme-surface border rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b theme-border pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold">
              2. Mon Programme de la Semaine (Mise à jour après chaque séance)
            </h2>
            <p className="text-xs theme-text-muted">
              Lancez votre séance prévue ou cliquez sur « Mettre à jour après la séance » pour valider votre avancement et vos Checks.
            </p>
          </div>
          <span className="font-arabic text-lg font-bold">
            ٢. جدول الأسبوع وتحديث ما بعد الحصة
          </span>
        </div>

        {plannedSessions.length === 0 ? (
          <div className="p-8 rounded-2xl border theme-muted text-center space-y-2">
            <p className="font-arabic text-xl">لا توجد حصص مبرمجة حالياً</p>
            <p className="text-xs theme-text-muted">
              Utilisez le formulaire ci-dessus pour préparer vos séances de la semaine.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {plannedSessions.map((item) => {
              const dayObj = DAYS_OF_WEEK.find((d) => d.fr === item.dayName) || {
                fr: item.dayName,
                ar: '',
              };
              const s1 =
                ALL_SURAHS.find((s) => s.number === item.primarySurahNumber) || ALL_SURAHS[66];
              const s2 =
                item.portionType === '2_surahs' && item.secondarySurahNumber
                  ? ALL_SURAHS.find((s) => s.number === item.secondarySurahNumber)
                  : undefined;
              const portionLabels = getPortionLabelBilingual(item.portionType);
              const isCompleted = item.status === 'completed';
              const isUpdatingThis = updatingSessionId === item.id;

              const s1Prog = state.surahProgress[s1.number];
              const s1Check1 = Boolean(s1Prog?.check1Memorized);
              const s1Check2 = Boolean(s1Prog?.check2Revised);

              return (
                <div
                  key={item.id}
                  data-testid={`planned-session-card-${item.id}`}
                  className={`rounded-2xl border p-4 sm:p-5 transition-all space-y-3.5 ${
                    isCompleted
                      ? 'theme-badge-check2 border-[var(--accent-done)]'
                      : 'theme-surface border-[var(--border-subtle)]'
                  }`}
                >
                  {/* Top Row: Day + Duration + Portion Badge + Arabic Surah Title */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Day Pill */}
                        <span className="px-3 py-1 rounded-lg theme-btn-primary text-xs font-bold flex items-center gap-1.5">
                          <span>{dayObj.fr}</span>
                          {dayObj.ar && <span className="font-arabic text-sm">· {dayObj.ar}</span>}
                        </span>

                        {/* Planned Duration Pill */}
                        <span className="px-2.5 py-1 rounded-lg border theme-muted text-xs font-mono-tabular font-semibold">
                          ⏱ {formatDurationLabel(item.plannedDurationMinutes)}
                          {isCompleted &&
                            item.actualDurationMinutes &&
                            ` (Réel : ${formatDurationLabel(item.actualDurationMinutes)})`}
                        </span>

                        {/* Goal Type Pill */}
                        <span className="px-2.5 py-1 rounded-lg border theme-muted text-xs font-medium">
                          {item.goalType === 'revision'
                            ? 'Révision · مراجعة'
                            : item.goalType === 'memorization'
                              ? 'Hifdh · حفظ جديد'
                              : 'Hifdh & Révision · حفظ ومراجعة'}
                        </span>

                        {/* Portion Type Badge (1/8, 1/4, 1/2 Hizb, 1 or 2 Surahs) */}
                        <span className="px-3 py-1 rounded-lg border theme-badge-check1 text-xs font-bold flex items-center gap-1.5">
                          <span className="font-arabic text-sm">{portionLabels.ar}</span>
                          <span>· {portionLabels.shortFr}</span>
                          {(item.portionType === '1_8_hizb' ||
                            item.portionType === '1_4_hizb' ||
                            item.portionType === '1_2_hizb') &&
                            item.hizbNumber && <span>(Hizb {item.hizbNumber})</span>}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isCompleted
                              ? 'bg-[var(--accent-done-bg)] text-[var(--accent-done)] border border-[var(--accent-done)]'
                              : 'theme-muted theme-text-muted'
                          }`}
                        >
                          {isCompleted ? '✓ Séance faite · تم الإنجاز' : 'À faire · مبرمج'}
                        </span>
                      </div>

                      {/* Target Surah(s) Title in French & Arabic */}
                      <div className="flex flex-wrap items-baseline gap-3 pt-1">
                        <h3 className="text-base sm:text-lg font-bold">
                          Sourate {s1.nameFr} (#{s1.number})
                          {s2 ? ` + Sourate ${s2.nameFr} (#${s2.number})` : ''}
                        </h3>
                        <span dir="rtl" className="font-quran text-2xl text-[var(--accent-gold)]">
                          سُورَةُ {s1.nameAr}
                          {s2 ? ` + سُورَةُ ${s2.nameAr}` : ''}
                        </span>
                      </div>

                      {item.customNote && (
                        <p className="text-xs opacity-85">
                          <strong>Programme prévu :</strong> {item.customNote}
                        </p>
                      )}

                      {item.postSessionNote && (
                        <p className="text-xs font-medium text-[var(--accent-done)]">
                          <strong>Bilan après séance :</strong> {item.postSessionNote}
                        </p>
                      )}
                    </div>

                    {/* Right Action Buttons: Launch Chrono | Open Mushaf | Update After Session | Delete */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleLaunchPlannedSessionInChrono(item)}
                        className="px-3 py-2 rounded-xl border theme-muted hover:opacity-90 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Lancer Chrono ({formatDurationLabel(item.plannedDurationMinutes)})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenHifdhMushafForSurah(s1.number)}
                        className="px-3 py-2 rounded-xl border theme-muted hover:opacity-90 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Mushaf</span>
                      </button>

                      <button
                        type="button"
                        data-testid={`open-update-session-${item.id}`}
                        onClick={() => handleOpenPostSessionUpdate(item)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                          isCompleted
                            ? 'border theme-muted'
                            : 'theme-btn-primary'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>
                          {isCompleted
                            ? 'Modifier le bilan · تعديل'
                            : 'Mettre à jour après séance · تحديث'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePlannedSession(item.id)}
                        title="Supprimer cette séance programmée"
                        className="p-2 rounded-xl border theme-muted hover:opacity-80 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* POST-SESSION UPDATE DRAWER (Mettre à jour après la séance) */}
                  {isUpdatingThis && (
                    <div className="p-4 rounded-xl border-2 border-[var(--accent-gold)] theme-surface space-y-3.5 mt-2">
                      <div className="flex items-center justify-between border-b theme-border pb-2">
                        <span className="text-xs sm:text-sm font-bold">
                          Bilan &amp; Mise à jour après la séance ({dayObj.fr} · Sourate {s1.nameFr})
                        </span>
                        <span className="font-arabic text-base font-bold">
                          تحديث الحصة بعد الانتهاء
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* 1. Actual Duration Spent */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold block">
                            Durée réelle effectuée (minutes) :
                          </label>
                          <div className="flex items-center gap-1.5">
                            {[30, 45, 60, 90].map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setUpdateActualMinutes(m)}
                                className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono-tabular cursor-pointer ${
                                  updateActualMinutes === m
                                    ? 'theme-btn-primary font-bold'
                                    : 'theme-muted'
                                }`}
                              >
                                {formatDurationLabel(m)}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 2. Direct Surah Check 1 / Check 2 Validation */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold block">
                            Valider l’avancement de Sourate {s1.nameFr} (سورة {s1.nameAr}) :
                          </label>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onToggleSurahCheck1(s1.number)}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                                s1Check1
                                  ? 'theme-badge-check1 border-[var(--accent-gold)] font-bold'
                                  : 'theme-muted'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>1er Check (تم الحفظ) {s1Check1 ? '✓' : ''}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onToggleSurahCheck2(s1.number)}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                                s1Check2
                                  ? 'theme-badge-check2 border-[var(--accent-done)] font-bold'
                                  : 'theme-muted'
                              }`}
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span>2ème Check (تمت المراجعة) {s1Check2 ? '✓' : ''}</span>
                            </button>
                          </div>
                        </div>

                        {/* 3. Post-Session Note */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold block">
                            Note après la séance (où je me suis arrêté, remarques) :
                          </label>
                          <input
                            type="text"
                            value={updatePostNote}
                            onChange={(e) => setUpdatePostNote(e.target.value)}
                            placeholder="Ex: Récité sans erreur, prêt pour la suite..."
                            className="w-full px-3 py-1.5 text-xs rounded-lg border theme-muted"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setUpdatingSessionId(null)}
                          className="px-3 py-1.5 rounded-lg border theme-muted text-xs font-medium cursor-pointer"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          data-testid={`complete-planned-session-${item.id}`}
                          onClick={() => handleConfirmPostSessionUpdate(item)}
                          className="px-4 py-2 rounded-xl theme-btn-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Enregistrer &amp; Marquer la séance terminée ✓</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 3: LIVE CHRONO & TIMER STUDIO */}
      <section
        id="live-chrono-studio"
        className="theme-surface border rounded-2xl p-5 sm:p-6 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b theme-border pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--accent-gold)]" />
            <h2 className="text-base sm:text-lg font-bold">
              3. Chronomètre &amp; Minuteur de Séance en direct
            </h2>
          </div>
          <span className="font-arabic text-lg font-bold">٣. مؤقت الحصة المباشر</span>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Mode & Presets */}
          <div className="space-y-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsRunning(false);
                  setElapsedSeconds(0);
                  setTimerMode('countdown');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                  timerMode === 'countdown' ? 'theme-btn-primary' : 'theme-muted'
                }`}
              >
                Minuteur · عداد تنازلي
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRunning(false);
                  setElapsedSeconds(0);
                  setTimerMode('stopwatch');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                  timerMode === 'stopwatch' ? 'theme-btn-primary' : 'theme-muted'
                }`}
              >
                Chronomètre libre · كرونومتر
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[30, 45, 60, 90].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setPresetMinutes(m);
                    setElapsedSeconds(0);
                    setIsRunning(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono-tabular border cursor-pointer ${
                    presetMinutes === m ? 'theme-badge-check1 font-bold' : 'theme-muted'
                  }`}
                >
                  {formatDurationLabel(m)}
                </button>
              ))}
            </div>
          </div>

          {/* Center: Digital Clock Display */}
          <div className="text-4xl sm:text-5xl font-bold font-mono-tabular tracking-tight">
            {timerMode === 'countdown'
              ? formatTimerClock(remainingCountdownSeconds)
              : formatTimerClock(elapsedSeconds)}
          </div>

          {/* Right: Play / Pause / Reset / Save */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRunning((prev) => !prev)}
              className="px-5 py-2.5 rounded-xl theme-btn-primary text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer"
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isRunning ? 'Pause' : 'Démarrer'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRunning(false);
                setElapsedSeconds(0);
              }}
              className="p-2.5 rounded-xl border theme-muted cursor-pointer"
              title="Réinitialiser"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleSaveManualChronoSession}
              className="px-4 py-2.5 rounded-xl border theme-badge-check2 text-xs font-bold cursor-pointer"
            >
              ✓ Terminer &amp; Enregistrer
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 4: SESSION LOG HISTORY & BACKUP */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 theme-surface border rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Historique des séances effectuées</h3>
            <span className="font-arabic text-base font-bold">سجل الحصص المنجزة</span>
          </div>
          {state.sessions.length === 0 ? (
            <p className="text-xs theme-text-muted">Aucune séance enregistrée.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {state.sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-3 rounded-xl border theme-muted flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-semibold">{sess.targetLabel}</div>
                    <div className="theme-text-muted">
                      {new Date(sess.dateIso).toLocaleDateString('fr-FR')} ·{' '}
                      {formatDurationLabel(sess.durationMinutes)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteSession(sess.id)}
                    className="p-1.5 rounded-lg border theme-surface cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Backup Export / Import */}
        <div className="theme-surface border rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Sauvegarde locale</h3>
            <span className="font-arabic text-base font-bold">النسخ الاحتياطي</span>
          </div>
          <p className="text-xs theme-text-muted">
            Votre programme de la semaine et vos Checks sont sauvegardés automatiquement sur votre appareil.
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onExportBackup}
              className="w-full py-2 px-3 rounded-xl border theme-muted text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter ma sauvegarde (.json)</span>
            </button>

            <label className="w-full py-2 px-3 rounded-xl border theme-muted text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Importer une sauvegarde (.json)</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const ok = onImportBackupJson(String(reader.result || ''));
                    setImportSuccess(ok);
                    setImportError(ok ? null : 'Fichier JSON invalide');
                  };
                  reader.readAsText(file);
                }}
              />
            </label>

            {importSuccess && (
              <p className="text-xs text-[var(--accent-done)] font-semibold">
                ✓ Sauvegarde restaurée avec succès !
              </p>
            )}
            {importError && <p className="text-xs text-red-600">{importError}</p>}

            <button
              type="button"
              onClick={onResetState}
              className="w-full py-1.5 px-3 rounded-xl text-[11px] theme-text-muted hover:underline cursor-pointer"
            >
              Réinitialiser les données d’exemple
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
