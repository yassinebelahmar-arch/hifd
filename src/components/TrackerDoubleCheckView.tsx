import React, { useMemo, useState } from 'react';
import { BookOpen, Check, Headphones, Search } from 'lucide-react';
import {
  ALL_HALF_HIZBS,
  ALL_SURAHS,
} from '../data/quranMetadata';
import {
  HifdhComputedStats,
  HifdhState,
  RevisionReminderItem,
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
  onUpdateDirectionOrder: (dir: 'reverse_juz' | 'custom_mulk_first' | 'standard') => void;
  onOpenReaderForSurah: (surahNumber: number, tab?: 'mushaf' | 'tafsir' | 'quiz') => void;
  onOpenHifdhMushafForSurah?: (surahNumber: number) => void;
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
  // Default is BY SURAH first, as requested by the user ("par défaut c'est par sourate, et par hizb en deuxième")
  const [viewMode, setViewMode] = useState<'surah' | 'hizb'>('surah');
  const [statusFilter, setStatusFilter] = useState<'all' | 'check1_only' | 'validated_check2' | 'todo'>('all');
  const [surahSectionFilter, setSurahSectionFilter] = useState<'end_67_114' | 'mid_30_66' | 'start_1_29' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Order Surahs in practical memorization order from the end of the Quran:
  // If 'custom_mulk_first': 67..77 (Al-Mulk..Al-Mursalat), then 78..114 (An-Naba..An-Nas), then 66 down to 1
  // Otherwise: 78..114 (An-Naba..An-Nas), then 67..77 (Al-Mulk..Al-Mursalat), then 66 down to 1
  const orderedSurahs = useMemo(() => {
    const juz30Surahs = ALL_SURAHS.filter((s) => s.number >= 78 && s.number <= 114);
    const juz29Surahs = ALL_SURAHS.filter((s) => s.number >= 67 && s.number <= 77);
    const restSurahs = ALL_SURAHS.filter((s) => s.number < 67).sort((a, b) => b.number - a.number);

    if (state.schedule.directionOrder === 'custom_mulk_first') {
      return [...juz29Surahs, ...juz30Surahs, ...restSurahs];
    }
    return [...juz30Surahs, ...juz29Surahs, ...restSurahs];
  }, [state.schedule.directionOrder]);

  const filteredSurahs = useMemo(() => {
    return orderedSurahs.filter((s) => {
      const sp = state.surahProgress[s.number];
      const c1 = Boolean(sp?.check1Memorized);
      const c2 = Boolean(sp?.check2Revised);

      if (statusFilter === 'todo' && (c1 || c2)) return false;
      if (statusFilter === 'check1_only' && (!c1 || c2)) return false;
      if (statusFilter === 'validated_check2' && !c2) return false;

      if (surahSectionFilter === 'end_67_114' && s.number < 67) return false;
      if (surahSectionFilter === 'mid_30_66' && (s.number < 30 || s.number > 66)) return false;
      if (surahSectionFilter === 'start_1_29' && s.number > 29) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          s.nameFr.toLowerCase().includes(q) ||
          s.meaningFr.toLowerCase().includes(q) ||
          s.nameAr.includes(q) ||
          String(s.number) === q
        );
      }
      return true;
    });
  }, [orderedSurahs, state.surahProgress, statusFilter, surahSectionFilter, searchQuery]);

  // Flat, clear 60 Hizb list (from Hizb 60 down to Hizb 1)
  const hizbGroups = useMemo(() => {
    const list = Array.from({ length: 60 }, (_, idx) => {
      const hizbNumber = 60 - idx;
      const halves = ALL_HALF_HIZBS.filter((h) => h.hizbNumber === hizbNumber);
      return {
        hizbNumber,
        half1: halves[0],
        half2: halves[1],
      };
    });

    if (state.schedule.directionOrder === 'custom_mulk_first') {
      // Put Hizb 57 & 58 (Al-Mulk..Al-Mursalat) first, then Hizb 59 & 60 (An-Naba..An-Nas), then 56..1
      const h57_58 = list.filter((g) => g.hizbNumber === 57 || g.hizbNumber === 58).reverse();
      const h59_60 = list.filter((g) => g.hizbNumber === 59 || g.hizbNumber === 60).reverse();
      const rest = list.filter((g) => g.hizbNumber < 57);
      return [...h57_58, ...h59_60, ...rest];
    }

    return list;
  }, [state.schedule.directionOrder]);

  const filteredHizbGroups = useMemo(() => {
    return hizbGroups.filter((g) => {
      const p1 = state.halfHizbProgress[g.half1.id];
      const p2 = state.halfHizbProgress[g.half2.id];
      const anyC1 = Boolean(p1?.check1Memorized || p2?.check1Memorized);
      const bothC2 = Boolean(p1?.check2Revised && p2?.check2Revised);
      const anyC2 = Boolean(p1?.check2Revised || p2?.check2Revised);

      if (statusFilter === 'todo' && (anyC1 || anyC2)) return false;
      if (statusFilter === 'check1_only' && (!anyC1 || bothC2)) return false;
      if (statusFilter === 'validated_check2' && !anyC2) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          `hizb ${g.hizbNumber}`.includes(q) ||
          g.half1.labelFr.toLowerCase().includes(q) ||
          g.half2.labelFr.toLowerCase().includes(q) ||
          g.half1.featuredSurahNames.toLowerCase().includes(q) ||
          g.half2.featuredSurahNames.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [hizbGroups, state.halfHizbProgress, statusFilter, searchQuery]);

  const surahsCheck1OnlyCount = Math.max(
    0,
    stats.surahsCheck1Count - stats.surahsValidatedCheck2Count
  );
  const surahsRemainingCount = 114 - stats.surahsValidatedCheck2Count;

  return (
    <div className="space-y-6 pb-20">
      {/* SECTION 1: VISUAL & INTERACTIVE SUMMARY HEADER */}
      <section className="theme-surface border rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Dynamic Goal Projection */}
          <div className="space-y-1">
            <div className="text-xs font-medium theme-text-muted">
              Temps restant estimé (recalculé à chaque 2ème Check)
            </div>
            <div className="flex flex-wrap items-baseline gap-2.5">
              <h1
                data-testid="tracker-projected-duration"
                className="text-2xl sm:text-3xl font-bold font-mono-tabular tracking-tight whitespace-nowrap"
              >
                {stats.formattedProjectionFr}
              </h1>
              <span className="text-xs sm:text-sm theme-text-muted whitespace-nowrap">
                · Fin prévue en <strong>{stats.estimatedCompletionDateFr}</strong>
              </span>
            </div>
          </div>

          {/* Right: Pace Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs theme-text-muted mr-1 whitespace-nowrap">Votre rythme :</span>
            {[
              { val: 0.25, label: '0,25 Hizb/sem' },
              { val: 0.5, label: '0,5 Hizb/sem (Objectif)' },
              { val: 0.75, label: '0,75 Hizb/sem' },
              { val: 1.0, label: '1 Hizb/sem' },
            ].map((opt) => {
              const active = Math.abs(stats.weeklyHizbPace - opt.val) < 0.01;
              return (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => onUpdatePace(opt.val)}
                  className={`px-3 py-1.5 text-xs rounded-lg border cursor-pointer transition-colors whitespace-nowrap ${
                    active
                      ? 'theme-btn-primary border-transparent font-semibold'
                      : 'theme-muted theme-text-muted hover:text-[var(--text-main)]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Full-Width 4 Interactive Visual Filter Cards (Click to filter immediately) */}
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
            <div className="text-[11px] theme-text-muted">Vue globale</div>
            <div className="text-lg font-bold font-mono-tabular mt-0.5">
              {viewMode === 'surah' ? '114 Sourates' : '60 Hizb'}
            </div>
            <div className="text-[11px] theme-text-muted mt-0.5">Tout afficher</div>
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
            <div className="text-[11px] font-medium">1er Check (Appris)</div>
            <div
              data-testid="kpi-check1-only"
              className="text-lg font-bold font-mono-tabular mt-0.5"
            >
              {viewMode === 'surah'
                ? `${surahsCheck1OnlyCount} Sourates`
                : `${stats.check1OnlyHalfHizbs} Demis-Hizb`}
            </div>
            <div className="text-[11px] opacity-80 mt-0.5">À réviser</div>
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
            <div className="text-[11px] font-medium">2ème Check (Validé)</div>
            <div
              data-testid="kpi-validated-hizbs"
              className="text-lg font-bold font-mono-tabular mt-0.5"
            >
              {viewMode === 'surah'
                ? `${stats.surahsValidatedCheck2Count} / 114`
                : `${String(stats.validatedHizbs).replace('.', ',')} / 60 Hizb`}
            </div>
            <div className="text-[11px] opacity-80 mt-0.5">Acquis définitivement</div>
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
            <div className="text-[11px] theme-text-muted">Reste à apprendre</div>
            <div className="text-lg font-bold font-mono-tabular mt-0.5">
              {viewMode === 'surah'
                ? `${surahsRemainingCount} Sourates`
                : `${String(stats.remainingHizbs).replace('.', ',')} Hizb`}
            </div>
            <div className="text-[11px] theme-text-muted mt-0.5">Cliquer pour filtrer</div>
          </button>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">
              Progression totale ({stats.surahsValidatedCheck2Count} sourates ·{' '}
              {String(stats.validatedHizbs).replace('.', ',')}/60 Hizb consolidés)
            </span>
            <span className="font-mono-tabular font-semibold">{stats.completionPercentage}%</span>
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

      {/* SECTION 2: MAIN MODE SWITCHER (1. PAR SOURATE BY DEFAULT | 2. PAR HIZB) + SEARCH */}
      <section className="theme-surface border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Primary Switch: Par Sourate (1st) vs Par Hizb (2nd) */}
          <div className="flex items-center gap-1 p-1 theme-muted border rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('surah')}
              className={`px-4 py-2 text-xs sm:text-sm rounded-lg transition-colors cursor-pointer ${
                viewMode === 'surah'
                  ? 'theme-btn-primary font-bold shadow-xs'
                  : 'theme-text-muted hover:text-[var(--text-main)] font-medium'
              }`}
            >
              1. Suivi par Sourate (114)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('hizb')}
              className={`px-4 py-2 text-xs sm:text-sm rounded-lg transition-colors cursor-pointer ${
                viewMode === 'hizb'
                  ? 'theme-btn-primary font-bold shadow-xs'
                  : 'theme-text-muted hover:text-[var(--text-main)] font-medium'
              }`}
            >
              2. Suivi par Hizb (60 Hizb)
            </button>
          </div>

          {/* Starting Point Toggle (Al-Mulk first vs An-Naba first) */}
          <div className="flex items-center gap-1 p-1 theme-muted border rounded-xl text-xs">
            <button
              type="button"
              onClick={() => onUpdateDirectionOrder('custom_mulk_first')}
              className={`px-2.5 py-1.5 rounded-lg cursor-pointer ${
                state.schedule.directionOrder === 'custom_mulk_first'
                  ? 'theme-surface font-semibold shadow-2xs'
                  : 'theme-text-muted'
              }`}
            >
              Début : Al-Mulk (67) puis An-Naba (78)
            </button>
            <button
              type="button"
              onClick={() => onUpdateDirectionOrder('reverse_juz')}
              className={`px-2.5 py-1.5 rounded-lg cursor-pointer ${
                state.schedule.directionOrder === 'reverse_juz'
                  ? 'theme-surface font-semibold shadow-2xs'
                  : 'theme-text-muted'
              }`}
            >
              Début : An-Naba (78) puis Al-Mulk (67)
            </button>
          </div>
        </div>

        {/* Right: Search & Quick Range Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {viewMode === 'surah' && (
            <select
              aria-label="Filtrer par partie du Coran"
              value={surahSectionFilter}
              onChange={(e) => setSurahSectionFilter(e.target.value as any)}
              className="px-3 py-2 text-xs theme-muted border rounded-xl cursor-pointer focus:outline-none"
            >
              <option value="all">Toutes les 114 Sourates</option>
              <option value="end_67_114">Fin du Coran (Sourates 67 à 114)</option>
              <option value="mid_30_66">Milieu du Coran (Sourates 30 à 66)</option>
              <option value="start_1_29">Grandes Sourates (Sourates 1 à 29)</option>
            </select>
          )}

          <div className="relative min-w-[210px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                viewMode === 'surah'
                  ? 'Chercher une sourate (ex: Mulk, 67)...'
                  : 'Chercher un Hizb (ex: Hizb 60, Mulk)...'
              }
              aria-label="Rechercher"
              className="w-full pl-8 pr-3 py-2 text-xs theme-muted border rounded-xl focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* VIEW 1 (DEFAULT): INTERACTIVE VISUAL SURAH CARDS */}
      {viewMode === 'surah' && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredSurahs.map((surah) => {
            const sp = state.surahProgress[surah.number];
            const c1 = Boolean(sp?.check1Memorized);
            const c2 = Boolean(sp?.check2Revised);

            return (
              <div
                key={surah.number}
                className={`theme-surface border rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all border-l-4 ${
                  c2
                    ? 'border-l-[var(--accent-done)]'
                    : c1
                      ? 'border-l-[var(--accent-gold)]'
                      : 'border-l-transparent'
                }`}
              >
                {/* Top Row: Surah Number, Name FR & AR, and Quick Open Links */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-xs font-mono-tabular font-bold rounded theme-muted border">
                        #{surah.number}
                      </span>
                      <h2 className="text-base sm:text-lg font-bold">
                        Sourate {surah.nameFr}
                      </h2>
                      <span className="text-xs theme-text-muted">({surah.meaningFr})</span>
                    </div>
                    <div className="text-xs theme-text-muted mt-1">
                      {surah.ayahCount} versets · Hizb {surah.hizbStart} · {surah.revelationType}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-quran text-2xl theme-text-muted">
                      {surah.nameAr}
                    </span>
                  </div>
                </div>

                {/* Middle Row: Interactive 2-Step Visual Check Buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => onToggleSurahCheck1(surah.number)}
                    aria-pressed={c1}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      c1
                        ? 'theme-badge-check1 font-bold shadow-2xs'
                        : 'theme-muted theme-text-muted hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Check className="w-4 h-4 shrink-0" />
                    <span>1er Check : Mémorisé</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleSurahCheck2(surah.number)}
                    aria-pressed={c2}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      c2
                        ? 'theme-badge-check2 font-bold shadow-2xs'
                        : 'theme-muted theme-text-muted hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Check className="w-4 h-4 shrink-0" />
                    <span>2ème Check : Révisé</span>
                  </button>
                </div>

                {/* Bottom Row: Open in Hifdh Mushaf or Audio Reader */}
                <div className="pt-2.5 border-t theme-border flex items-center justify-between gap-2 text-xs">
                  <span className="theme-text-muted">
                    {c2
                      ? '✓ Sourate consolidée'
                      : c1
                        ? 'En attente du 2ème Check de révision'
                        : 'Non commencée'}
                  </span>

                  <div className="flex items-center gap-2">
                    {onOpenHifdhMushafForSurah && (
                      <button
                        type="button"
                        onClick={() => onOpenHifdhMushafForSurah(surah.number)}
                        className="px-2.5 py-1 rounded-lg border theme-muted hover:opacity-80 flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Lire Mushaf</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenReaderForSurah(surah.number, 'mushaf')}
                      className="px-2.5 py-1 rounded-lg border theme-muted hover:opacity-80 flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Headphones className="w-3.5 h-3.5" />
                      <span>Écouter</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* VIEW 2 (SECOND OPTION): VISUAL HIZB CARDS (60 HIZB) — Flat, clear, no confusing square grid */}
      {viewMode === 'hizb' && (
        <section className="space-y-3.5">
          {filteredHizbGroups.map((group) => {
            const p1 = state.halfHizbProgress[group.half1.id];
            const p2 = state.halfHizbProgress[group.half2.id];
            const c1_1 = Boolean(p1?.check1Memorized);
            const c2_1 = Boolean(p1?.check2Revised);
            const c1_2 = Boolean(p2?.check1Memorized);
            const c2_2 = Boolean(p2?.check2Revised);

            const validatedHalvesCount = (c2_1 ? 1 : 0) + (c2_2 ? 1 : 0);

            return (
              <div
                key={group.hizbNumber}
                className="theme-surface border rounded-2xl p-5 space-y-4"
              >
                {/* Hizb Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b theme-border pb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 text-sm font-mono-tabular font-bold rounded-lg theme-btn-primary">
                      Hizb {group.hizbNumber}
                    </span>
                    <span className="text-sm font-semibold">
                      {group.half1.featuredSurahNames}
                      {group.half2.featuredSurahNames !== group.half1.featuredSurahNames
                        ? ` · ${group.half2.featuredSurahNames}`
                        : ''}
                    </span>
                  </div>

                  <span className="text-xs font-mono-tabular font-semibold theme-text-muted">
                    {validatedHalvesCount === 2
                      ? '✓ Hizb complet validé (1,0 Hizb)'
                      : validatedHalvesCount === 1
                        ? '0,5 / 1 Hizb validé'
                        : '0 / 1 Hizb validé'}
                  </span>
                </div>

                {/* 2 Halves Side by Side (0.5 Hizb each) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[group.half1, group.half2].map((hh, idx) => {
                    const prog = state.halfHizbProgress[hh.id];
                    const c1 = Boolean(prog?.check1Memorized);
                    const c2 = Boolean(prog?.check2Revised);

                    return (
                      <div
                        key={hh.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                          c2
                            ? 'theme-badge-check2'
                            : c1
                              ? 'theme-badge-check1'
                              : 'theme-muted'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-mono-tabular font-bold opacity-80">
                              {idx === 0 ? '1ère Moitié (0,5 Hizb)' : '2ème Moitié (0,5 Hizb)'}
                            </div>
                            <div className="text-sm font-bold mt-0.5">{hh.labelFr}</div>
                            <div className="text-xs opacity-85 mt-0.5">
                              Sourates : {hh.featuredSurahNames}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              onOpenHifdhMushafForSurah
                                ? onOpenHifdhMushafForSurah(hh.startSurah)
                                : onOpenReaderForSurah(hh.startSurah, 'mushaf')
                            }
                            className="px-2.5 py-1 text-xs rounded-lg border theme-surface text-[var(--text-main)] shrink-0 cursor-pointer"
                          >
                            Ouvrir
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => onToggleHalfHizbCheck1(hh.id)}
                            aria-pressed={c1}
                            className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer ${
                              c1
                                ? 'theme-btn-primary border-transparent'
                                : 'theme-surface text-[var(--text-main)]'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>1er Check : Appris</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onToggleHalfHizbCheck2(hh.id)}
                            aria-pressed={c2}
                            className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer ${
                              c2
                                ? 'theme-btn-primary border-transparent'
                                : 'theme-surface text-[var(--text-main)]'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>2ème Check (+0,5 Hizb)</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
};
