import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Headphones,
  Play,
} from 'lucide-react';
import {
  ALL_HALF_HIZBS,
  HalfHizbMeta,
  JUZ_NAMES,
} from '../data/quranMetadata';
import {
  HifdhComputedStats,
  HifdhState,
  RevisionReminderItem,
  calculateWeeklySessionSummary,
} from '../utils/hifdhLogic';

interface DashboardViewProps {
  state: HifdhState;
  stats: HifdhComputedStats;
  reminders: RevisionReminderItem[];
  onToggleHalfHizbCheck1: (id: number) => void;
  onToggleHalfHizbCheck2: (id: number) => void;
  onUpdatePace: (newPace: number) => void;
  onUpdateDirectionOrder: (dir: 'reverse_juz' | 'custom_mulk_first' | 'standard') => void;
  onOpenReaderForSurah: (surahNumber: number, tab?: 'mushaf' | 'tafsir' | 'quiz') => void;
  onNavigateTab: (tab: 'dashboard' | 'quran' | 'tracker' | 'planner') => void;
  onOpenSessionModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  stats,
  reminders,
  onToggleHalfHizbCheck1,
  onToggleHalfHizbCheck2,
  onUpdatePace,
  onUpdateDirectionOrder,
  onOpenReaderForSurah,
  onNavigateTab,
  onOpenSessionModal,
}) => {
  const [selectedMapHizb, setSelectedMapHizb] = useState<number>(59); // Default Hizb 59 (An-Naba)
  const weeklySummary = calculateWeeklySessionSummary(state.sessions, state.schedule);

  const priorityHalfHizbs: HalfHizbMeta[] =
    state.schedule.directionOrder === 'custom_mulk_first'
      ? [
          ALL_HALF_HIZBS.find((h) => h.id === 113)!,
          ALL_HALF_HIZBS.find((h) => h.id === 114)!,
          ALL_HALF_HIZBS.find((h) => h.id === 117)!,
          ALL_HALF_HIZBS.find((h) => h.id === 118)!,
          ALL_HALF_HIZBS.find((h) => h.id === 119)!,
          ALL_HALF_HIZBS.find((h) => h.id === 120)!,
        ]
      : [
          ALL_HALF_HIZBS.find((h) => h.id === 117)!,
          ALL_HALF_HIZBS.find((h) => h.id === 118)!,
          ALL_HALF_HIZBS.find((h) => h.id === 119)!,
          ALL_HALF_HIZBS.find((h) => h.id === 120)!,
          ALL_HALF_HIZBS.find((h) => h.id === 113)!,
          ALL_HALF_HIZBS.find((h) => h.id === 114)!,
        ];

  const paceOptions = [
    { value: 0.25, label: '0,25 Hizb/sem' },
    { value: 0.5, label: '0,5 Hizb/sem (Mon Objectif)' },
    { value: 0.75, label: '0,75 Hizb/sem' },
    { value: 1.0, label: '1 Hizb/sem' },
    { value: 1.5, label: '1,5 Hizb/sem' },
  ];

  const hizbOverview = Array.from({ length: 60 }, (_, idx) => {
    const hizbNumber = 60 - idx;
    const half1Id = (hizbNumber - 1) * 2 + 1;
    const half2Id = (hizbNumber - 1) * 2 + 2;
    const h1 = state.halfHizbProgress[half1Id];
    const h2 = state.halfHizbProgress[half2Id];
    const bothCheck2 = Boolean(h1?.check2Revised && h2?.check2Revised);
    const anyCheck2 = Boolean(h1?.check2Revised || h2?.check2Revised);
    const anyCheck1 = Boolean(h1?.check1Memorized || h2?.check1Memorized);
    return {
      hizbNumber,
      half1Id,
      half2Id,
      status: bothCheck2
        ? 'completed'
        : anyCheck2
          ? 'half_completed'
          : anyCheck1
            ? 'memorized_check1'
            : 'todo',
    };
  });

  const selectedMapHalves = ALL_HALF_HIZBS.filter((h) => h.hizbNumber === selectedMapHizb);

  return (
    <div className="space-y-8 pb-16">
      {/* SECTION 1: ULTRA-CLEAR MODERN HERO & GOAL CALCULATOR */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Main Goal & Projection Card (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                Cheikh Yasser Al-Dosari
              </span>
              <span aria-hidden="true">·</span>
              <span>Riwayat Hafs &apos;an &apos;Asim</span>
              <span aria-hidden="true">·</span>
              <span>Parcours de la fin vers le début (Juz 30 → Juz 1)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Votre Objectif de Fin du Coran :{' '}
              <span
                data-testid="projected-duration-text"
                className="text-emerald-700 dark:text-emerald-400 font-mono-tabular"
              >
                {stats.formattedProjectionFr}
              </span>
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              Date d’achèvement estimée :{' '}
              <strong className="font-semibold text-slate-900 dark:text-white">
                {stats.estimatedCompletionDateFr}
              </strong>{' '}
              (il reste <strong className="font-mono-tabular">{stats.remainingHizbs} Hizb</strong> sur 60 à valider au 2ème Check).
            </p>
          </div>

          {/* Visual Progress Bar of the 60 Hizb */}
          <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-200">
                Avancement Officiel (2ème Check Consolidé)
              </span>
              <span className="font-mono-tabular text-emerald-700 dark:text-emerald-400">
                {String(stats.validatedHizbs).replace('.', ',')} / 60 Hizb ({stats.completionPercentage}%)
              </span>
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${Math.max(2, stats.completionPercentage)}%` }}
                title="Consolidé (2ème Check)"
              />
              {stats.check1OnlyHizbs > 0 && (
                <div
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${(stats.check1OnlyHizbs / 60) * 100}%` }}
                  title="En consolidation (1er Check)"
                />
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span>Vert : 2ème Check validé ({String(stats.validatedHizbs).replace('.', ',')} Hizb)</span>
              <span>Ambre : 1er Check en attente de révision ({String(stats.check1OnlyHizbs).replace('.', ',')} Hizb)</span>
            </div>
          </div>

          {/* Pace Selector & Quick Surah Launchers */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Simuler votre rythme hebdomadaire :
              </span>
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {paceOptions.map((opt) => {
                  const active = Math.abs(stats.weeklyHizbPace - opt.value) < 0.01;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onUpdatePace(opt.value)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onOpenReaderForSurah(67, 'mushaf')}
                className="px-4 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Headphones className="w-4 h-4" />
                <span>Écouter Sourate Al-Mulk (Juz 29)</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenReaderForSurah(78, 'mushaf')}
                className="px-4 py-2.5 text-xs font-bold bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Écouter Sourate An-Naba (Juz 30)</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenReaderForSurah(67, 'quiz')}
                className="px-4 py-2.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Tester mon Hifdh (Quiz &amp; Comparateur Vocal)
              </button>
            </div>
          </div>
        </div>

        {/* Right Card (4 cols): Weekly 3h Goal & Instant Live Stopwatch Launcher */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Assiduité Hebdomadaire
              </span>
              <span className="text-xs font-mono-tabular font-semibold text-emerald-700 dark:text-emerald-400">
                {state.schedule.sessionsPerWeek} séances / sem
              </span>
            </div>

            <div>
              <div className="text-3xl font-mono-tabular font-bold text-slate-900 dark:text-white">
                {weeklySummary.completedHoursFormatted}{' '}
                <span className="text-lg font-normal text-slate-400">
                  / {state.schedule.weeklyHoursTarget}h00
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {weeklySummary.sessionsCountThisWeek} sur {state.schedule.sessionsPerWeek} sessions réalisées ({weeklySummary.recommendedMinutesPerSession} min / séance)
              </p>
            </div>

            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${weeklySummary.progressPercent}%` }}
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Vos jours programmés ({state.schedule.reminderTime}) :
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                {state.schedule.selectedDays.join(' · ')}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={onOpenSessionModal}
              className="w-full py-3 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>Lancer le Chrono Hifdh (Flottant)</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('planner')}
              className="w-full py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-center cursor-pointer"
            >
              Modifier mes {state.schedule.sessionsPerWeek} séances hebdomadaires →
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2: 4 BIG, ULTRA-LEGIBLE KPI CARDS */}
      <section
        aria-label="Chiffres clés de votre Hifdh"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            1. Validés au 2ème Check (Acquis)
          </div>
          <div
            data-testid="kpi-validated-hizbs"
            className="text-3xl font-mono-tabular font-bold text-emerald-700 dark:text-emerald-400 mt-2"
          >
            {String(stats.validatedHizbs).replace('.', ',')} / 60 Hizb
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-mono-tabular">
            {stats.validatedHalfHizbs} / 120 Demis-Hizb consolidés
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            2. En attente du 2ème Check
          </div>
          <div
            data-testid="kpi-check1-only"
            className="text-3xl font-mono-tabular font-bold text-amber-600 dark:text-amber-400 mt-2"
          >
            {stats.check1OnlyHalfHizbs} Demis-Hizb
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Mémorisés (1er Check) · À réviser sous 3–7j
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            3. Sourates Consolidées
          </div>
          <div className="text-3xl font-mono-tabular font-bold text-slate-900 dark:text-white mt-2">
            {stats.surahsValidatedCheck2Count} / 114
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Dont {stats.surahsCheck1Count} sourates au 1er Check
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            4. Rythme &amp; Juz Complétés
          </div>
          <div className="text-3xl font-mono-tabular font-bold text-slate-900 dark:text-white mt-2">
            {stats.validatedJuzCount} / 30 Juz
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Cible : {String(stats.weeklyHizbPace).replace('.', ',')} Hizb / semaine
          </div>
        </div>
      </section>

      {/* SECTION 3: RAPPELS DU JOUR & VALIDATION EN 1 CLIC DU 2ÈME CHECK */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              À Réviser Aujourd’hui (Validation du 2ème Check)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Dès que vous avez révisé un Demi-Hizb appris lors du 1er Check, cliquez sur <strong>« Valider 2ème Check »</strong> pour l’ajouter à vos statistiques et réduire votre temps restant.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('tracker')}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Ouvrir la grille des 60 Hizb →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reminders.map((item) => {
            const prog = state.halfHizbProgress[item.halfHizb.id];
            const isCheck2Done = Boolean(prog?.check2Revised);

            return (
              <div
                key={item.id}
                className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-700 dark:text-amber-400">
                      {item.headlineFr}
                    </span>
                    <span className="font-mono-tabular font-semibold text-slate-500">
                      Juz {item.halfHizb.juzNumber} · Hizb {item.halfHizb.hizbNumber}
                    </span>
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    {item.halfHizb.labelFr}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {item.halfHizb.featuredSurahNames}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => onOpenReaderForSurah(item.halfHizb.startSurah, 'mushaf')}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Écouter Cheikh Yasser Al-Dosari</span>
                  </button>

                  {!isCheck2Done && (
                    <button
                      type="button"
                      onClick={() => onToggleHalfHizbCheck2(item.halfHizb.id)}
                      className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Valider 2ème Check (+0,5 Hizb)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 4: QUICK DOUBLE-CHECK CARDS (JUZ 30 & JUZ 29) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Votre Parcours Actuel — Début par la Fin du Coran (Juz 30 &amp; Juz 29)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Choisissez l’ordre d’affichage de vos premiers Hizb et cochez directement vos 1er et 2ème Checks :
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => onUpdateDirectionOrder('reverse_juz')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                state.schedule.directionOrder === 'reverse_juz'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Juz 30 (An-Naba) puis Juz 29
            </button>
            <button
              type="button"
              onClick={() => onUpdateDirectionOrder('custom_mulk_first')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                state.schedule.directionOrder === 'custom_mulk_first'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Juz 29 (Al-Mulk) puis Juz 30
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {priorityHalfHizbs.map((hh) => {
            const prog = state.halfHizbProgress[hh.id];
            const c1 = Boolean(prog?.check1Memorized);
            const c2 = Boolean(prog?.check2Revised);

            return (
              <div
                key={hh.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4 transition-colors ${
                  c2
                    ? 'border-emerald-500/60 dark:border-emerald-500/50'
                    : c1
                      ? 'border-amber-500/60 dark:border-amber-500/50'
                      : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>
                      Juz {hh.juzNumber} · Hizb {hh.hizbNumber} ({hh.halfPosition === 1 ? '1ère moitié' : '2ème moitié'})
                    </span>
                    <span className="font-arabic text-base text-slate-700 dark:text-slate-300">
                      {JUZ_NAMES[hh.juzNumber]?.nameAr}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {hh.labelFr}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {hh.featuredSurahNames}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleHalfHizbCheck1(hh.id)}
                      aria-pressed={c1}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                        c1
                          ? 'bg-amber-500 border-amber-500 text-white'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>1er Check : Mémorisé</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleHalfHizbCheck2(hh.id)}
                      aria-pressed={c2}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                        c2
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-600'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>2ème Check : Révisé</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => onOpenReaderForSurah(hh.startSurah, 'mushaf')}
                      className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Headphones className="w-3.5 h-3.5" />
                      <span>Écouter Yasser Al-Dosari</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenReaderForSurah(hh.startSurah, 'tafsir')}
                      className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:underline cursor-pointer"
                    >
                      Tafsir Al-Muyassar →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 5: CARTE VISUELLE INTERACTIVE DES 60 HIZB (DU HIZB 60 AU HIZB 1) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Carte Interactive des 60 Hizb (Ordre Inversé : Hizb 60 → Hizb 1)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cliquez sur n’importe quel numéro de Hizb ci-dessous pour afficher et cocher directement ses 2 moitiés (0,5 Hizb).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span className="text-emerald-700 dark:text-emerald-400">Vert : 2ème Check Validé</span>
            <span>·</span>
            <span className="text-amber-600 dark:text-amber-400">Ambre : 1er Check Mémorisé</span>
            <span>·</span>
            <span>Gris : À apprendre</span>
          </div>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-20 gap-2">
          {hizbOverview.map((h) => {
            const isSelected = selectedMapHizb === h.hizbNumber;
            return (
              <button
                key={h.hizbNumber}
                type="button"
                onClick={() => setSelectedMapHizb(h.hizbNumber)}
                title={`Inspecter Hizb ${h.hizbNumber}`}
                className={`h-10 rounded-xl font-mono-tabular text-xs font-bold border transition-all cursor-pointer flex items-center justify-center ${
                  isSelected ? 'ring-2 ring-slate-900 dark:ring-white scale-105' : ''
                } ${
                  h.status === 'completed'
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : h.status === 'half_completed'
                      ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                      : h.status === 'memorized_check1'
                        ? 'bg-amber-100 dark:bg-amber-950 border-amber-500 text-amber-900 dark:text-amber-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                H{h.hizbNumber}
              </button>
            );
          })}
        </div>

        {/* Live Inspector Panel for Selected Hizb from the 60-Hizb Map */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              Détail du Hizb {selectedMapHizb} (Juz {Math.ceil(selectedMapHizb / 2)}) — Validation rapide :
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('tracker')}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Voir tous les 30 Juz en détail →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedMapHalves.map((hh) => {
              const prog = state.halfHizbProgress[hh.id];
              const c1 = Boolean(prog?.check1Memorized);
              const c2 = Boolean(prog?.check2Revised);

              return (
                <div
                  key={hh.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-mono-tabular font-bold text-slate-500">
                      {hh.halfPosition === 1 ? '1ère Moitié (0,5 Hizb)' : '2ème Moitié (0,5 Hizb)'}
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {hh.labelFr}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {hh.featuredSurahNames}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => onToggleHalfHizbCheck1(hh.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer ${
                        c1
                          ? 'bg-amber-500 border-amber-500 text-white'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      1er Check : Mémorisé
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleHalfHizbCheck2(hh.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer ${
                        c2
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      2ème Check : Révisé
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenReaderForSurah(hh.startSurah, 'mushaf')}
                      className="ml-auto text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Écouter →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
