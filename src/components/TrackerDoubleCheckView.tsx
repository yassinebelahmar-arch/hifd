import React, { useMemo, useState } from 'react';
import { BookOpen, Check, CheckCheck, Headphones, Search } from 'lucide-react';
import { ALL_HALF_HIZBS, ALL_SURAHS, HalfHizbMeta, SurahMeta } from '../data/quranMetadata';
import {
  HifdhComputedStats,
  HifdhState,
  RevisionReminderItem,
  WeeklyScheduleConfig,
  formatProjectionArabic,
  getOrderedJuzNumbers,
  toArabicDigits,
} from '../utils/hifdhLogic';

interface TrackerDoubleCheckViewProps {
  state: HifdhState;
  stats: HifdhComputedStats;
  reminders: RevisionReminderItem[];
  onToggleHalfHizbCheck1: (id: number) => void;
  onToggleHalfHizbCheck2: (id: number) => void;
  onToggleSurahCheck1: (surahNumber: number) => void;
  onToggleSurahCheck2: (surahNumber: number) => void;
  onUpdatePace: (newPace: number) => void;
  onUpdateDirectionOrder: (dir: WeeklyScheduleConfig['directionOrder']) => void;
  onOpenReaderForSurah: (surahNumber: number, subTab?: 'mushaf' | 'tafsir' | 'quiz') => void;
  onOpenHifdhMushafForSurah: (surahNumber: number) => void;
}

export const TrackerDoubleCheckView: React.FC<TrackerDoubleCheckViewProps> = ({
  state,
  stats,
  onToggleHalfHizbCheck1,
  onToggleHalfHizbCheck2,
  onToggleSurahCheck1,
  onToggleSurahCheck2,
  onUpdatePace,
  onUpdateDirectionOrder,
  onOpenReaderForSurah,
  onOpenHifdhMushafForSurah,
}) => {
  // Default view mode is 'surah' (1. Suivi par Sourate / متابعة السور)
  const [viewMode, setViewMode] = useState<'surah' | 'hizb'>('surah');
  // Default Surah sort order is canonical Mushaf order: 1 (Al-Fatiha) -> 114 (An-Nas)
  const [surahSortMode, setSurahSortMode] = useState<'quran_1_to_114' | 'quran_114_to_1' | 'hifdh_juz'>('quran_1_to_114');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'todo' | 'check1_only' | 'validated_check2'
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [juzQuickFilter, setJuzQuickFilter] = useState<number | 'all'>('all');

  const orderedJuzList = useMemo(
    () => getOrderedJuzNumbers(state.schedule.directionOrder),
    [state.schedule.directionOrder]
  );

  // Order Surahs according to canonical Quran order (1 -> 114) by default
  const orderedSurahs = useMemo(() => {
    const copy = [...ALL_SURAHS];
    if (surahSortMode === 'quran_1_to_114') {
      return copy.sort((a, b) => a.number - b.number);
    }
    if (surahSortMode === 'quran_114_to_1') {
      return copy.sort((a, b) => b.number - a.number);
    }
    return copy.sort((a, b) => {
      const idxA = orderedJuzList.indexOf(a.juzStart);
      const idxB = orderedJuzList.indexOf(b.juzStart);
      if (idxA !== idxB) return idxA - idxB;
      return a.number - b.number;
    });
  }, [surahSortMode, orderedJuzList]);

  const filteredSurahs = useMemo(() => {
    return orderedSurahs.filter((surah) => {
      if (juzQuickFilter !== 'all' && surah.juzStart !== juzQuickFilter) {
        return false;
      }

      const prog = state.surahProgress[surah.number];
      const c1 = Boolean(prog?.check1Memorized);
      const c2 = Boolean(prog?.check2Revised);

      if (statusFilter === 'todo' && (c1 || c2)) return false;
      if (statusFilter === 'check1_only' && (!c1 || c2)) return false;
      if (statusFilter === 'validated_check2' && !c2) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          surah.nameFr.toLowerCase().includes(q) ||
          surah.nameAr.includes(q) ||
          surah.meaningFr.toLowerCase().includes(q) ||
          String(surah.number) === q ||
          `hizb ${surah.hizbStart}`.includes(q)
        );
      }
      return true;
    });
  }, [orderedSurahs, juzQuickFilter, state.surahProgress, statusFilter, searchQuery]);

  // Group 120 Half-Hizbs into 60 Full Hizb cards ordered according to selected sort mode
  const hizbGroups = useMemo(() => {
    const groups: {
      hizbNumber: number;
      juz: number;
      half1: HalfHizbMeta;
      half2: HalfHizbMeta;
      surahsInHizb: SurahMeta[];
    }[] = [];

    const hizbNumbersOrder =
      surahSortMode === 'quran_1_to_114'
        ? Array.from({ length: 60 }, (_, i) => i + 1)
        : surahSortMode === 'quran_114_to_1'
          ? Array.from({ length: 60 }, (_, i) => 60 - i)
          : orderedJuzList.flatMap((juzNum) => [juzNum * 2 - 1, juzNum * 2]);

    for (const hNum of hizbNumbersOrder) {
      const halves = ALL_HALF_HIZBS.filter((h) => h.hizbNumber === hNum).sort(
        (a, b) => a.halfPosition - b.halfPosition
      );
      if (halves.length === 2) {
        const surahsInHizb = ALL_SURAHS.filter((s) => s.hizbStart === hNum);
        groups.push({
          hizbNumber: hNum,
          juz: Math.ceil(hNum / 2),
          half1: halves[0],
          half2: halves[1],
          surahsInHizb,
        });
      }
    }
    return groups;
  }, [surahSortMode, orderedJuzList]);

  const filteredHizbGroups = useMemo(() => {
    return hizbGroups.filter((g) => {
      if (juzQuickFilter !== 'all' && g.juz !== juzQuickFilter) {
        return false;
      }

      const p1 = state.halfHizbProgress[g.half1.id];
      const p2 = state.halfHizbProgress[g.half2.id];
      const anyC1 = Boolean(p1?.check1Memorized || p2?.check1Memorized);
      const bothC2 = Boolean(p1?.check2Revised && p2?.check2Revised);
      const anyC1WithoutC2 =
        Boolean(p1?.check1Memorized && !p1?.check2Revised) ||
        Boolean(p2?.check1Memorized && !p2?.check2Revised);

      if (statusFilter === 'todo' && anyC1) return false;
      if (statusFilter === 'check1_only' && !anyC1WithoutC2) return false;
      if (statusFilter === 'validated_check2' && !bothC2) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const surahArMatch = g.surahsInHizb.some((s) => s.nameAr.includes(q));
        return (
          surahArMatch ||
          `hizb ${g.hizbNumber}`.includes(q) ||
          String(g.hizbNumber) === q ||
          g.half1.labelFr.toLowerCase().includes(q) ||
          g.half2.labelFr.toLowerCase().includes(q) ||
          g.half1.featuredSurahNames.toLowerCase().includes(q) ||
          g.half2.featuredSurahNames.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [hizbGroups, juzQuickFilter, state.halfHizbProgress, statusFilter, searchQuery]);

  const surahsCheck1OnlyCount = Math.max(
    0,
    stats.surahsCheck1Count - stats.surahsValidatedCheck2Count
  );
  const surahsRemainingCount = 114 - stats.surahsValidatedCheck2Count;

  const arabicProjection = useMemo(
    () =>
      formatProjectionArabic(
        stats.projectedYears,
        stats.projectedMonths,
        stats.projectedExtraWeeks
      ),
    [stats.projectedYears, stats.projectedMonths, stats.projectedExtraWeeks]
  );

  return (
    <div className="space-y-6 pb-20">
      {/* SECTION 1: BILINGUAL VISUAL & INTERACTIVE SUMMARY HEADER (العربية + Français) */}
      <section className="theme-surface border rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b theme-border pb-4">
          {/* Left: Dynamic Goal Projection in Arabic + French */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium theme-text-muted">
              <span className="font-arabic text-base text-[var(--text-main)]">
                المدة المتبقية لختم القرآن الكريم
              </span>
              <span>·</span>
              <span>Temps restant estimé (recalculé au 2ème Check)</span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <h1
                data-testid="tracker-projected-duration"
                className="text-2xl sm:text-3xl font-bold font-mono-tabular tracking-tight whitespace-nowrap"
              >
                {stats.formattedProjectionFr}
              </h1>
              <span
                dir="rtl"
                className="font-arabic text-xl sm:text-2xl font-bold text-[var(--accent-gold)] whitespace-nowrap"
              >
                ({arabicProjection})
              </span>
              <span className="text-xs sm:text-sm theme-text-muted whitespace-nowrap">
                · Fin prévue : <strong>{stats.estimatedCompletionDateFr}</strong>
              </span>
            </div>
          </div>

          {/* Right: Bilingual Pace Selector (الوتيرة الأسبوعية) */}
          <div className="space-y-1.5">
            <div className="text-xs theme-text-muted flex items-center justify-between lg:justify-end gap-2">
              <span>Rythme hebdomadaire :</span>
              <span className="font-arabic text-sm text-[var(--text-main)]">الوتيرة الأسبوعية</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { val: 0.25, labelFr: '1/4 Hizb/sem', labelAr: 'ربع حزب' },
                { val: 0.5, labelFr: '1/2 Hizb/sem (Objectif)', labelAr: 'نصف حزب' },
                { val: 0.75, labelFr: '3/4 Hizb/sem', labelAr: '٣ أرباع' },
                { val: 1.0, labelFr: '1 Hizb/sem', labelAr: 'حزب كامل' },
              ].map((opt) => {
                const active = Math.abs(stats.weeklyHizbPace - opt.val) < 0.01;
                return (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => onUpdatePace(opt.val)}
                    className={`px-3 py-1.5 text-xs rounded-xl border cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                      active
                        ? 'theme-btn-primary border-transparent font-semibold'
                        : 'theme-muted theme-text-muted hover:text-[var(--text-main)]'
                    }`}
                  >
                    <span className="font-arabic text-sm">{opt.labelAr}</span>
                    <span>· {opt.labelFr}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Full-Width 4 Bilingual Interactive Filter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'ring-2 ring-[var(--text-main)] theme-surface'
                : 'theme-muted opacity-85 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] theme-text-muted">Vue globale</span>
              <span className="font-arabic text-sm font-bold">الكل</span>
            </div>
            <div className="text-lg font-bold font-mono-tabular mt-1 flex items-baseline justify-between">
              <span>{viewMode === 'surah' ? '114 Sourates' : '60 Hizb'}</span>
              <span className="font-arabic text-base">
                {viewMode === 'surah' ? '١١٤ سورة' : '٦٠ حزباً'}
              </span>
            </div>
            <div className="text-[11px] theme-text-muted mt-0.5">
              عرض الجميع · Tout afficher
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              setStatusFilter(statusFilter === 'check1_only' ? 'all' : 'check1_only')
            }
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === 'check1_only'
                ? 'ring-2 ring-[var(--accent-gold)] theme-badge-check1'
                : 'theme-badge-check1 opacity-90 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-medium">1er Check (Appris)</span>
              <span className="font-arabic text-sm font-bold">١. تم الحفظ</span>
            </div>
            <div
              data-testid="kpi-check1-only"
              className="text-lg font-bold font-mono-tabular mt-1 flex items-baseline justify-between"
            >
              <span>
                {viewMode === 'surah'
                  ? `${surahsCheck1OnlyCount} Sourates`
                  : `${stats.check1OnlyHalfHizbs} Demis`}
              </span>
              <span className="font-arabic text-base">
                {viewMode === 'surah'
                  ? `${toArabicDigits(surahsCheck1OnlyCount)} سور`
                  : `${toArabicDigits(stats.check1OnlyHalfHizbs)} أنصاف`}
              </span>
            </div>
            <div className="text-[11px] opacity-85 mt-0.5">
              بانتظار المراجعة · À réviser
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              setStatusFilter(statusFilter === 'validated_check2' ? 'all' : 'validated_check2')
            }
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === 'validated_check2'
                ? 'ring-2 ring-[var(--accent-done)] theme-badge-check2'
                : 'theme-badge-check2 opacity-90 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-medium">2ème Check (Validé)</span>
              <span className="font-arabic text-sm font-bold">٢. تم التثبيت</span>
            </div>
            <div
              data-testid="kpi-validated-hizbs"
              className="text-lg font-bold font-mono-tabular mt-1 flex items-baseline justify-between"
            >
              <span>
                {viewMode === 'surah'
                  ? `${stats.surahsValidatedCheck2Count} / 114`
                  : `${String(stats.validatedHizbs).replace('.', ',')} / 60 Hizb`}
              </span>
              <span className="font-arabic text-base">
                {viewMode === 'surah'
                  ? `${toArabicDigits(stats.surahsValidatedCheck2Count)} / ١١٤`
                  : `${toArabicDigits(stats.validatedHizbs)} / ٦٠`}
              </span>
            </div>
            <div className="text-[11px] opacity-85 mt-0.5">
              متقن ومثبت ✓ · Acquis
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'todo' ? 'all' : 'todo')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === 'todo'
                ? 'ring-2 ring-[var(--text-main)] theme-surface'
                : 'theme-muted opacity-85 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] theme-text-muted">Reste à apprendre</span>
              <span className="font-arabic text-sm font-bold">المتبقي</span>
            </div>
            <div className="text-lg font-bold font-mono-tabular mt-1 flex items-baseline justify-between">
              <span>
                {viewMode === 'surah'
                  ? `${surahsRemainingCount} Sourates`
                  : `${String(stats.remainingHizbs).replace('.', ',')} Hizb`}
              </span>
              <span className="font-arabic text-base">
                {viewMode === 'surah'
                  ? `${toArabicDigits(surahsRemainingCount)} سورة`
                  : `${toArabicDigits(stats.remainingHizbs)} حزب`}
              </span>
            </div>
            <div className="text-[11px] theme-text-muted mt-0.5">
              في البرنامج · À mémoriser
            </div>
          </button>
        </div>

        {/* Visual Progress Bar with Arabic & French Summary */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-medium">
              Progression : {stats.surahsValidatedCheck2Count}/114 sourates ·{' '}
              {String(stats.validatedHizbs).replace('.', ',')}/60 Hizb consolidés
            </span>
            <span className="font-arabic text-sm font-bold">
              نسبة الإنجاز : {toArabicDigits(stats.completionPercentage)}٪ ({stats.completionPercentage}%)
            </span>
          </div>
          <div className="w-full h-3 theme-muted rounded-full overflow-hidden flex">
            <div
              className="h-full bg-[var(--accent-done)] transition-all duration-300"
              style={{ width: `${Math.max(2, stats.completionPercentage)}%` }}
            />
            {stats.check1OnlyHizbs > 0 && (
              <div
                className="h-full bg-[var(--accent-gold)] transition-all duration-300"
                style={{ width: `${(stats.check1OnlyHizbs / 60) * 100}%` }}
              />
            )}
          </div>
        </div>
      </section>

      {/* SECTION 2: BILINGUAL MODE SWITCHER (1. السور PAR SOURATE | 2. الأحزاب PAR HIZB) + SEARCH */}
      <section className="theme-surface border rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Primary Switch: 1. Par Sourate (Default) | 2. Par Hizb */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Mode de suivi"
              className="flex items-center p-1 rounded-xl theme-muted border gap-1"
            >
              <button
                type="button"
                data-testid="tracker-mode-surah"
                onClick={() => setViewMode('surah')}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  viewMode === 'surah'
                    ? 'theme-btn-primary shadow-xs'
                    : 'theme-text-muted hover:text-[var(--text-main)]'
                }`}
              >
                <span className="font-arabic text-base">١. متابعة السور</span>
                <span>· Par Sourate (114)</span>
              </button>
              <button
                type="button"
                data-testid="tracker-mode-hizb"
                onClick={() => setViewMode('hizb')}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  viewMode === 'hizb'
                    ? 'theme-btn-primary shadow-xs'
                    : 'theme-text-muted hover:text-[var(--text-main)]'
                }`}
              >
                <span className="font-arabic text-base">٢. متابعة الأحزاب</span>
                <span>· Par Hizb (60)</span>
              </button>
            </div>
          </div>

          {/* Right: Juz Filter & Search Bar (Arabic + French) */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filtrer par Juz"
              value={juzQuickFilter}
              onChange={(e) =>
                setJuzQuickFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="px-3 py-2 text-xs rounded-xl border theme-muted cursor-pointer font-medium"
            >
              <option value="all">كل الأجزاء · Tous les 30 Juz</option>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
                <option key={j} value={j}>
                  الجزء {toArabicDigits(j)} · Juz {j} (Hizb {j * 2 - 1}–{j * 2})
                </option>
              ))}
            </select>

            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث (الفاتحة، الملك، النبأ، 1، 67)..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border theme-muted focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Canonical Quran Order Selector (1 -> 114 default vs 114 -> 1 vs Mulk & Juz 30) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t theme-border text-xs">
          <span className="theme-text-muted font-medium">
            ترتيب عرض السور والأحزاب · Tri des Sourates :
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              data-testid="sort-quran-1-to-114"
              onClick={() => setSurahSortMode('quran_1_to_114')}
              className={`px-3 py-1.5 rounded-lg border cursor-pointer transition-colors flex items-center gap-1.5 ${
                surahSortMode === 'quran_1_to_114'
                  ? 'theme-btn-primary border-transparent font-semibold'
                  : 'theme-muted theme-text-muted'
              }`}
            >
              <span className="font-arabic text-sm">ترتيب المصحف (١ ← ١١٤)</span>
              <span>· Ordre du Coran (1. Al-Fatiha → 114. An-Nas)</span>
            </button>

            <button
              type="button"
              data-testid="sort-quran-114-to-1"
              onClick={() => setSurahSortMode('quran_114_to_1')}
              className={`px-3 py-1.5 rounded-lg border cursor-pointer transition-colors flex items-center gap-1.5 ${
                surahSortMode === 'quran_114_to_1'
                  ? 'theme-btn-primary border-transparent font-semibold'
                  : 'theme-muted theme-text-muted'
              }`}
            >
              <span className="font-arabic text-sm">من الناس إلى الفاتحة (١١٤ ← ١)</span>
              <span>· Fin vers Début (114 → 1)</span>
            </button>

            <button
              type="button"
              data-testid="sort-hifdh-juz"
              onClick={() => {
                setSurahSortMode('hifdh_juz');
                onUpdateDirectionOrder('custom_mulk_first');
              }}
              className={`px-3 py-1.5 rounded-lg border cursor-pointer transition-colors flex items-center gap-1.5 ${
                surahSortMode === 'hifdh_juz'
                  ? 'theme-btn-primary border-transparent font-semibold'
                  : 'theme-muted theme-text-muted'
              }`}
            >
              <span className="font-arabic text-sm">الملك (٦٧) والجزء ٣٠</span>
              <span>· Al-Mulk (67) &amp; Juz 30</span>
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 3A: VIEW BY SURAH (متابعة السور — DEFAULT) */}
      {viewMode === 'surah' && (
        <section className="space-y-3">
          {filteredSurahs.length === 0 ? (
            <div className="theme-surface border rounded-2xl p-8 text-center space-y-2">
              <p className="font-arabic text-xl">لا توجد سور مطابقة للبحث</p>
              <p className="text-sm theme-text-muted">
                Aucune sourate ne correspond à ce filtre.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setSearchQuery('');
                  setJuzQuickFilter('all');
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg theme-btn-primary cursor-pointer"
              >
                عرض كل السور · Afficher les 114 Sourates
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredSurahs.map((surah) => {
                const prog = state.surahProgress[surah.number];
                const c1 = Boolean(prog?.check1Memorized);
                const c2 = Boolean(prog?.check2Revised);

                return (
                  <div
                    key={surah.number}
                    data-testid={`surah-card-${surah.number}`}
                    className={`rounded-2xl border p-4 sm:p-5 transition-all flex flex-col justify-between gap-4 ${
                      c2
                        ? 'theme-badge-check2 border-[var(--accent-done)]'
                        : c1
                          ? 'theme-badge-check1 border-[var(--accent-gold)]'
                          : 'theme-surface'
                    }`}
                  >
                    {/* Top Row: Left French + Number | Right Prominent Arabic Calligraphy */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-xs font-mono-tabular font-bold rounded-md theme-muted border">
                            #{surah.number}
                          </span>
                          <h3 className="text-base sm:text-lg font-bold tracking-tight">
                            Sourate {surah.nameFr}
                          </h3>
                        </div>
                        <p className="text-xs opacity-80">
                          {surah.meaningFr} · {surah.ayahCount} versets · Hizb {surah.hizbStart}
                        </p>
                      </div>

                      {/* Prominent Arabic Surah Title & Medallion */}
                      <div dir="rtl" className="text-right shrink-0">
                        <div className="font-quran text-2xl sm:text-3xl leading-relaxed">
                          سُورَةُ {surah.nameAr} ﴿{toArabicDigits(surah.number)}﴾
                        </div>
                        <div className="font-arabic text-xs sm:text-sm opacity-85 mt-1.5">
                          {toArabicDigits(surah.ayahCount)} آية · الحزب {toArabicDigits(surah.hizbStart)} · الجزء {toArabicDigits(surah.juzStart)} ·{' '}
                          {surah.revelationType === 'Mecquoise' ? 'مكية' : 'مدنية'}
                        </div>
                      </div>
                    </div>

                    {/* Middle Row: Interactive 2-Step Check Buttons (Bilingual Arabic + French) */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        data-testid={`surah-check1-${surah.number}`}
                        aria-pressed={c1}
                        onClick={() => onToggleSurahCheck1(surah.number)}
                        className={`py-2.5 px-3 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          c1
                            ? 'bg-[var(--accent-gold-bg)] text-[var(--accent-gold)] border-[var(--accent-gold)] ring-1 ring-[var(--accent-gold)] font-bold'
                            : 'theme-muted opacity-90 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-arabic text-base font-bold">
                          <Check className="w-4 h-4 shrink-0" />
                          <span>١. تم الحفظ</span>
                        </div>
                        <span className="text-[11px] font-medium">
                          {c1 ? '1er Check : Mémorisé ✓' : '1er Check : Mémorisé'}
                        </span>
                      </button>

                      <button
                        type="button"
                        data-testid={`surah-check2-${surah.number}`}
                        aria-pressed={c2}
                        onClick={() => onToggleSurahCheck2(surah.number)}
                        className={`py-2.5 px-3 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          c2
                            ? 'bg-[var(--accent-done-bg)] text-[var(--accent-done)] border-[var(--accent-done)] ring-1 ring-[var(--accent-done)] font-bold'
                            : 'theme-muted opacity-90 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-arabic text-base font-bold">
                          <CheckCheck className="w-4 h-4 shrink-0" />
                          <span>٢. تمت المراجعة</span>
                        </div>
                        <span className="text-[11px] font-medium">
                          {c2 ? '2ème Check : Révisé ✓' : '2ème Check : Révisé'}
                        </span>
                      </button>
                    </div>

                    {/* Bottom Row: Bilingual Status & Direct Mushaf / Audio Shortcuts */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t theme-border text-xs">
                      <span className="opacity-85 font-medium flex items-center gap-1.5">
                        {c2 ? (
                          <>
                            <span className="font-arabic text-sm font-bold">مثبت ومتقن ✓</span>
                            <span>· Validée</span>
                          </>
                        ) : c1 ? (
                          <>
                            <span className="font-arabic text-sm font-bold">بانتظار التثبيت</span>
                            <span>· À réviser (2ème Check)</span>
                          </>
                        ) : (
                          <>
                            <span className="font-arabic text-sm">لم يبدأ</span>
                            <span>· Non commencée</span>
                          </>
                        )}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenHifdhMushafForSurah(surah.number)}
                          className="px-2.5 py-1 rounded-lg border theme-muted hover:opacity-80 flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span className="font-arabic text-xs">المصحف</span>
                          <span>· Mushaf</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenReaderForSurah(surah.number, 'mushaf')}
                          className="px-2.5 py-1 rounded-lg border theme-muted hover:opacity-80 flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <Headphones className="w-3.5 h-3.5" />
                          <span className="font-arabic text-xs">استماع</span>
                          <span>· Écoute</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SECTION 3B: VIEW BY HIZB (متابعة الأحزاب — 60 HIZB) */}
      {viewMode === 'hizb' && (
        <section className="space-y-3">
          {filteredHizbGroups.length === 0 ? (
            <div className="theme-surface border rounded-2xl p-8 text-center space-y-2">
              <p className="font-arabic text-xl">لا توجد أحزاب مطابقة للبحث</p>
              <p className="text-sm theme-text-muted">Aucun Hizb ne correspond à ce filtre.</p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setSearchQuery('');
                  setJuzQuickFilter('all');
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg theme-btn-primary cursor-pointer"
              >
                عرض كل الأحزاب · Afficher les 60 Hizb
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredHizbGroups.map(({ hizbNumber, juz, half1, half2, surahsInHizb }) => {
                const p1 = state.halfHizbProgress[half1.id];
                const p2 = state.halfHizbProgress[half2.id];
                const hizbFullyValidated = Boolean(p1?.check2Revised && p2?.check2Revised);
                const hizbStarted = Boolean(p1?.check1Memorized || p2?.check1Memorized);

                const arabicSurahNames =
                  surahsInHizb.length > 0
                    ? surahsInHizb.map((s) => `سورة ${s.nameAr}`).join(' · ')
                    : half1.featuredSurahNames;

                return (
                  <div
                    key={hizbNumber}
                    className={`rounded-2xl border p-5 space-y-4 transition-all ${
                      hizbFullyValidated
                        ? 'theme-badge-check2 border-[var(--accent-done)]'
                        : hizbStarted
                          ? 'theme-badge-check1 border-[var(--accent-gold)]'
                          : 'theme-surface'
                    }`}
                  >
                    {/* Hizb Card Header (Bilingual Arabic + French) */}
                    <div className="flex items-start justify-between gap-3 border-b theme-border pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold font-mono-tabular">
                            Hizb {hizbNumber}
                          </span>
                          <span className="font-arabic text-2xl font-bold">
                            · الحزب {toArabicDigits(hizbNumber)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs opacity-80 mt-0.5">
                          <span>Juz {juz} (الجزء {toArabicDigits(juz)})</span>
                          <span>·</span>
                          <span>{half1.featuredSurahNames}</span>
                        </div>
                        <div dir="rtl" className="font-arabic text-sm opacity-90 mt-1">
                          {arabicSurahNames}
                        </div>
                      </div>

                      {/* Quick 1-click Full Hizb Check 2 */}
                      <button
                        type="button"
                        onClick={() => {
                          if (!p1?.check2Revised) onToggleHalfHizbCheck2(half1.id);
                          if (!p2?.check2Revised) onToggleHalfHizbCheck2(half2.id);
                          if (p1?.check2Revised && p2?.check2Revised) {
                            onToggleHalfHizbCheck2(half1.id);
                            onToggleHalfHizbCheck2(half2.id);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors shrink-0 flex flex-col items-center ${
                          hizbFullyValidated
                            ? 'bg-[var(--accent-done-bg)] text-[var(--accent-done)] border-[var(--accent-done)]'
                            : 'theme-muted hover:opacity-90'
                        }`}
                      >
                        <span className="font-arabic text-sm font-bold">
                          {hizbFullyValidated ? 'الحزب مثبت ✓' : 'تثبيت الحزب كاملاً'}
                        </span>
                        <span className="text-[10px]">
                          {hizbFullyValidated ? 'Hizb validé ✓' : 'Valider tout le Hizb'}
                        </span>
                      </button>
                    </div>

                    {/* Two Halves of the Hizb (النصف الأول & النصف الثاني) */}
                    <div className="space-y-2.5">
                      {[half1, half2].map((hh) => {
                        const prog = state.halfHizbProgress[hh.id];
                        const c1 = Boolean(prog?.check1Memorized);
                        const c2 = Boolean(prog?.check2Revised);

                        return (
                          <div
                            key={hh.id}
                            data-testid={`half-hizb-row-${hh.id}`}
                            className="p-3.5 rounded-xl border theme-surface space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-arabic text-base font-bold">
                                    {hh.halfPosition === 1 ? 'النصف الأول (١/٢)' : 'النصف الثاني (٢/٢)'}
                                  </span>
                                  <span className="text-xs font-semibold">
                                    · {hh.halfPosition === 1 ? '1ère moitié' : '2ème moitié'} (0,5 Hizb)
                                  </span>
                                </div>
                                <div className="text-xs theme-text-muted truncate mt-0.5">
                                  {hh.featuredSurahNames}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => onOpenHifdhMushafForSurah(hh.startSurah)}
                                title="Ouvrir dans le Mushaf"
                                className="px-2.5 py-1 rounded-lg border theme-muted hover:opacity-80 cursor-pointer flex items-center gap-1 text-xs shrink-0"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span className="font-arabic text-xs">المصحف</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                data-testid={`check1-btn-${hh.id}`}
                                aria-pressed={c1}
                                onClick={() => onToggleHalfHizbCheck1(hh.id)}
                                className={`py-2 px-3 rounded-lg text-xs font-semibold border cursor-pointer flex items-center justify-center gap-1.5 ${
                                  c1
                                    ? 'theme-badge-check1 border-[var(--accent-gold)]'
                                    : 'theme-muted theme-text-muted'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5 shrink-0" />
                                <span className="font-arabic text-sm">تم الحفظ</span>
                                <span>· 1er Check</span>
                              </button>

                              <button
                                type="button"
                                data-testid={`check2-btn-${hh.id}`}
                                aria-pressed={c2}
                                onClick={() => onToggleHalfHizbCheck2(hh.id)}
                                className={`py-2 px-3 rounded-lg text-xs font-semibold border cursor-pointer flex items-center justify-center gap-1.5 ${
                                  c2
                                    ? 'theme-badge-check2 border-[var(--accent-done)]'
                                    : 'theme-muted theme-text-muted'
                                }`}
                              >
                                <CheckCheck className="w-3.5 h-3.5 shrink-0" />
                                <span className="font-arabic text-sm">تمت المراجعة</span>
                                <span>· 2ème Check</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
