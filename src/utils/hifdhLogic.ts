import { ALL_HALF_HIZBS, ALL_SURAHS, HalfHizbMeta, SurahMeta } from '../data/quranMetadata';

export interface CheckProgressItem {
  check1Memorized: boolean;
  check1Date: string | null; // ISO string
  check2Revised: boolean;
  check2Date: string | null; // ISO string
  lastReviewedDate: string | null; // ISO string for spaced repetition
  notes?: string;
}

export interface HifdhSessionLog {
  id: string;
  dateIso: string; // YYYY-MM-DD or ISO
  durationMinutes: number;
  sessionType: 'memorization' | 'revision_check2' | 'wird_consolidation';
  targetLabel: string;
  halfHizbId?: number;
  surahNumber?: number;
}

export interface WeeklyScheduleConfig {
  weeklyHoursTarget: number; // Default: 3 hours/week
  sessionsPerWeek: 2 | 3; // Default: 3 sessions/week (3x1h or 2x1h30)
  selectedDays: string[]; // e.g., ['Lundi', 'Mercredi', 'Samedi']
  reminderTime: string; // e.g., '20:00'
  weeklyHizbPace: number; // Default: 0.5 Hizb/week
  consolidationDelayDays: number; // Recommended delay between Check 1 and Check 2 (default 5 days, range 3-7)
  directionOrder: 'reverse_juz' | 'custom_mulk_first' | 'standard';
}

export interface FlaggedVerseItem {
  key: string; // `${surahNumber}:${ayahNumber}`
  surahNumber: number;
  ayahNumber: number;
  createdAt: string;
}

export interface HifdhState {
  halfHizbProgress: Record<number, CheckProgressItem>; // key: 1..120
  surahProgress: Record<number, CheckProgressItem>; // key: 1..114
  sessions: HifdhSessionLog[];
  schedule: WeeklyScheduleConfig;
  flaggedVerses?: Record<string, FlaggedVerseItem>;
}

export interface HifdhComputedStats {
  totalHizbs: number; // 60
  totalHalfHizbs: number; // 120
  totalJuz: number; // 30
  // Check 1 (Memorized, waiting for Check 2 consolidation)
  check1TotalHalfHizbs: number;
  check1OnlyHalfHizbs: number; // Memorized but NOT yet revised (Check 2 false)
  check1OnlyHizbs: number;
  // Check 2 (Revised & Validated — official completion metric)
  validatedHalfHizbs: number;
  validatedHizbs: number;
  validatedJuzCount: number;
  completionPercentage: number;
  remainingHizbs: number;
  remainingHalfHizbs: number;
  // Surah counts
  surahsCheck1Count: number;
  surahsValidatedCheck2Count: number;
  // Dynamic End-Date Projection based on Check 2 + weeklyHizbPace
  weeklyHizbPace: number;
  remainingWeeks: number;
  projectedYears: number;
  projectedMonths: number;
  projectedExtraWeeks: number;
  formattedProjectionFr: string;
  estimatedCompletionDateFr: string;
}

export interface RevisionReminderItem {
  id: string;
  halfHizb: HalfHizbMeta;
  urgency: 'ready_for_check2' | 'consolidating_soon' | 'spaced_review';
  daysSinceCheck1: number;
  daysUntilRecommendedCheck2: number;
  headlineFr: string;
  sublineFr: string;
}

export function createEmptyCheckItem(): CheckProgressItem {
  return {
    check1Memorized: false,
    check1Date: null,
    check2Revised: false,
    check2Date: null,
    lastReviewedDate: null,
  };
}

/**
 * Pure transition for Check 1 (Mémorisé).
 * If Check 1 is unchecked, Check 2 must also be unchecked to maintain consistency.
 */
export function applyCheck1Toggle(
  current: CheckProgressItem | undefined,
  nowIso: string = new Date().toISOString()
): CheckProgressItem {
  const base = current ?? createEmptyCheckItem();
  const nextCheck1 = !base.check1Memorized;
  if (!nextCheck1) {
    return {
      ...base,
      check1Memorized: false,
      check1Date: null,
      check2Revised: false,
      check2Date: null,
    };
  }
  return {
    ...base,
    check1Memorized: true,
    check1Date: nowIso,
  };
}

/**
 * Pure transition for Check 2 (Révisé & Consolidé).
 * Checking Check 2 automatically ensures Check 1 is also marked true.
 * Only when Check 2 is true is the Hizb counted in official completion stats.
 */
export function applyCheck2Toggle(
  current: CheckProgressItem | undefined,
  nowIso: string = new Date().toISOString()
): CheckProgressItem {
  const base = current ?? createEmptyCheckItem();
  const nextCheck2 = !base.check2Revised;
  if (nextCheck2) {
    return {
      ...base,
      check1Memorized: true,
      check1Date: base.check1Date ?? nowIso,
      check2Revised: true,
      check2Date: nowIso,
      lastReviewedDate: nowIso,
    };
  }
  return {
    ...base,
    check2Revised: false,
    check2Date: null,
  };
}

/**
 * Converts a number of remaining weeks into { years, months, weeks } and a clean French human-readable string.
 * Example: "2 ans, 3 mois et 1 semaine" or "4 mois et 2 semaines".
 */
export function formatRemainingWeeksToYearsMonths(
  remainingWeeks: number,
  referenceDate: Date = new Date()
): {
  years: number;
  months: number;
  weeks: number;
  formattedFr: string;
  estimatedDateFr: string;
} {
  if (remainingWeeks <= 0) {
    return {
      years: 0,
      months: 0,
      weeks: 0,
      formattedFr: 'Khatm accompli — 100% consolidé',
      estimatedDateFr: 'Objectif atteint',
    };
  }

  const totalDays = Math.round(remainingWeeks * 7);
  const years = Math.floor(totalDays / 365);
  const remainingDaysAfterYears = totalDays % 365;
  const months = Math.floor(remainingDaysAfterYears / 30);
  const leftoverDays = remainingDaysAfterYears % 30;
  const weeks = Math.round(leftoverDays / 7);

  // Normalize if weeks == 4
  let normYears = years;
  let normMonths = months;
  let normWeeks = weeks;
  if (normWeeks >= 4) {
    normMonths += 1;
    normWeeks -= 4;
  }
  if (normMonths >= 12) {
    normYears += 1;
    normMonths -= 12;
  }

  const parts: string[] = [];
  if (normYears > 0) {
    parts.push(`${normYears} ${normYears === 1 ? 'an' : 'ans'}`);
  }
  if (normMonths > 0) {
    parts.push(`${normMonths} mois`);
  }
  if (normWeeks > 0 && normYears < 3) {
    parts.push(`${normWeeks} ${normWeeks === 1 ? 'semaine' : 'semaines'}`);
  }
  if (parts.length === 0) {
    parts.push('Moins d’une semaine');
  }

  const formattedFr =
    parts.length === 1
      ? parts[0]
      : parts.slice(0, -1).join(', ') + ' et ' + parts[parts.length - 1];

  const targetDate = new Date(referenceDate.getTime() + totalDays * 86400000);
  const monthsFr = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];
  const estimatedDateFr = `${monthsFr[targetDate.getUTCMonth()]} ${targetDate.getUTCFullYear()}`;

  return {
    years: normYears,
    months: normMonths,
    weeks: normWeeks,
    formattedFr,
    estimatedDateFr,
  };
}

/**
 * Computes all Hifdh statistics and dynamic end-date projection strictly from Check 2 validations.
 */
export function calculateHifdhStats(
  state: HifdhState,
  referenceDate: Date = new Date()
): HifdhComputedStats {
  const totalHalfHizbs = 120;
  const totalHizbs = 60;
  const totalJuz = 30;

  let check1TotalHalfHizbs = 0;
  let validatedHalfHizbs = 0;

  for (let id = 1; id <= totalHalfHizbs; id++) {
    const item = state.halfHizbProgress[id];
    if (item?.check1Memorized) {
      check1TotalHalfHizbs++;
    }
    if (item?.check2Revised) {
      validatedHalfHizbs++;
    }
  }

  const check1OnlyHalfHizbs = Math.max(0, check1TotalHalfHizbs - validatedHalfHizbs);
  const check1OnlyHizbs = check1OnlyHalfHizbs * 0.5;
  const validatedHizbs = validatedHalfHizbs * 0.5;
  const remainingHalfHizbs = totalHalfHizbs - validatedHalfHizbs;
  const remainingHizbs = totalHizbs - validatedHizbs;
  const completionPercentage = Number(((validatedHalfHizbs / totalHalfHizbs) * 100).toFixed(1));

  // Count how many full Juz have all 4 Half-Hizbs validated with Check 2
  let validatedJuzCount = 0;
  for (let juz = 1; juz <= 30; juz++) {
    const hizbA = (juz - 1) * 2 + 1;
    const hizbB = juz * 2;
    const halfIds = [(hizbA - 1) * 2 + 1, (hizbA - 1) * 2 + 2, (hizbB - 1) * 2 + 1, (hizbB - 1) * 2 + 2];
    if (halfIds.every((hid) => state.halfHizbProgress[hid]?.check2Revised)) {
      validatedJuzCount++;
    }
  }

  // Count Surahs
  let surahsCheck1Count = 0;
  let surahsValidatedCheck2Count = 0;
  for (const s of ALL_SURAHS) {
    const sp = state.surahProgress[s.number];
    if (sp?.check1Memorized) surahsCheck1Count++;
    if (sp?.check2Revised) surahsValidatedCheck2Count++;
  }

  const weeklyHizbPace = state.schedule.weeklyHizbPace > 0 ? state.schedule.weeklyHizbPace : 0.5;
  const remainingWeeks = remainingHizbs / weeklyHizbPace;
  const projection = formatRemainingWeeksToYearsMonths(remainingWeeks, referenceDate);

  return {
    totalHizbs,
    totalHalfHizbs,
    totalJuz,
    check1TotalHalfHizbs,
    check1OnlyHalfHizbs,
    check1OnlyHizbs,
    validatedHalfHizbs,
    validatedHizbs,
    validatedJuzCount,
    completionPercentage,
    remainingHizbs,
    remainingHalfHizbs,
    surahsCheck1Count,
    surahsValidatedCheck2Count,
    weeklyHizbPace,
    remainingWeeks,
    projectedYears: projection.years,
    projectedMonths: projection.months,
    projectedExtraWeeks: projection.weeks,
    formattedProjectionFr: projection.formattedFr,
    estimatedCompletionDateFr: projection.estimatedDateFr,
  };
}

/**
 * Generates the Smart Daily Revision & Consolidation Queue:
 * 1. Half-Hizbs with Check 1 = true and Check 2 = false (prioritizing those >= consolidationDelayDays, e.g., 3-7 days).
 * 2. Spaced repetition (Muraaja'a) for already double-checked Half-Hizbs.
 */
export function generateDailyRevisionPlan(
  state: HifdhState,
  referenceDate: Date = new Date()
): RevisionReminderItem[] {
  const reminders: RevisionReminderItem[] = [];
  const recommendedDelay = state.schedule.consolidationDelayDays || 5;
  const nowMs = referenceDate.getTime();

  // 1. Check 1 items waiting for Check 2 validation
  for (const hh of ALL_HALF_HIZBS) {
    const prog = state.halfHizbProgress[hh.id];
    if (prog?.check1Memorized && !prog?.check2Revised) {
      const check1Ms = prog.check1Date ? new Date(prog.check1Date).getTime() : nowMs;
      const daysElapsed = Math.max(0, Math.floor((nowMs - check1Ms) / 86400000));
      const daysUntilRecommended = Math.max(0, recommendedDelay - daysElapsed);
      const isReady = daysElapsed >= 3;

      reminders.push({
        id: `check2-pending-${hh.id}`,
        halfHizb: hh,
        urgency: isReady ? 'ready_for_check2' : 'consolidating_soon',
        daysSinceCheck1: daysElapsed,
        daysUntilRecommendedCheck2: daysUntilRecommended,
        headlineFr: isReady
          ? `Prêt pour le 2ème Check (Mémorisé il y a ${daysElapsed} j)`
          : `En consolidation — 2ème Check conseillé dans ${daysUntilRecommended} j`,
        sublineFr: `${hh.labelFr} · ${hh.featuredSurahNames}`,
      });
    }
  }

  // Sort pending Check 2 items by longest time since Check 1 first
  reminders.sort((a, b) => b.daysSinceCheck1 - a.daysSinceCheck1);

  // 2. Add Spaced Repetition items from already validated Check 2 items
  const validatedList = ALL_HALF_HIZBS.filter((hh) => state.halfHizbProgress[hh.id]?.check2Revised);
  validatedList.sort((a, b) => {
    const dateA = state.halfHizbProgress[a.id]?.lastReviewedDate || state.halfHizbProgress[a.id]?.check2Date || '';
    const dateB = state.halfHizbProgress[b.id]?.lastReviewedDate || state.halfHizbProgress[b.id]?.check2Date || '';
    return dateA.localeCompare(dateB);
  });

  for (const hh of validatedList.slice(0, 3)) {
    const prog = state.halfHizbProgress[hh.id]!;
    const revMs = prog.lastReviewedDate
      ? new Date(prog.lastReviewedDate).getTime()
      : prog.check2Date
        ? new Date(prog.check2Date).getTime()
        : nowMs;
    const daysSinceRev = Math.max(0, Math.floor((nowMs - revMs) / 86400000));

    reminders.push({
      id: `spaced-${hh.id}`,
      halfHizb: hh,
      urgency: 'spaced_review',
      daysSinceCheck1: daysSinceRev,
      daysUntilRecommendedCheck2: 0,
      headlineFr: `Wird d’entretien (Consolidé · Dernière révision il y a ${daysSinceRev} j)`,
      sublineFr: `${hh.labelFr} · ${hh.featuredSurahNames}`,
    });
  }

  return reminders;
}

/**
 * Calculates weekly session hours & adherence against the 3h / week (180 min) target.
 */
export function calculateWeeklySessionSummary(
  sessions: HifdhSessionLog[],
  schedule: WeeklyScheduleConfig,
  referenceDate: Date = new Date()
): {
  targetMinutes: number;
  completedMinutesThisWeek: number;
  completedHoursFormatted: string;
  sessionsCountThisWeek: number;
  recommendedMinutesPerSession: number;
  progressPercent: number;
} {
  const targetMinutes = Math.round((schedule.weeklyHoursTarget || 3) * 60);
  const sessionsPerWeek = schedule.sessionsPerWeek || 3;
  const recommendedMinutesPerSession = Math.round(targetMinutes / sessionsPerWeek);

  // Filter sessions in the last 7 days
  const cutoffMs = referenceDate.getTime() - 7 * 86400000;
  const recentSessions = sessions.filter((s) => {
    const t = new Date(s.dateIso).getTime();
    return !Number.isNaN(t) && t >= cutoffMs;
  });

  const completedMinutesThisWeek = recentSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const hrs = Math.floor(completedMinutesThisWeek / 60);
  const mins = completedMinutesThisWeek % 60;
  const completedHoursFormatted = `${hrs}h${String(mins).padStart(2, '0')}`;
  const progressPercent = Math.min(100, Math.round((completedMinutesThisWeek / targetMinutes) * 100));

  return {
    targetMinutes,
    completedMinutesThisWeek,
    completedHoursFormatted,
    sessionsCountThisWeek: recentSessions.length,
    recommendedMinutesPerSession,
    progressPercent,
  };
}

/**
 * Orders the 30 Juz according to the user's chosen progression strategy:
 * - 'reverse_juz' (Default confirmed by user): Juz 30 -> Juz 29 -> Juz 28 -> ... -> Juz 1
 * - 'custom_mulk_first': Juz 29 (Sourate Al-Mulk) -> Juz 30 (Sourate An-Naba) -> Juz 28 -> ... -> Juz 1
 * - 'standard': Juz 1 -> Juz 2 -> ... -> Juz 30
 */
export function getOrderedJuzNumbers(direction: WeeklyScheduleConfig['directionOrder'] = 'reverse_juz'): number[] {
  if (direction === 'standard') {
    return Array.from({ length: 30 }, (_, i) => i + 1);
  }
  if (direction === 'custom_mulk_first') {
    const rest = Array.from({ length: 28 }, (_, i) => 28 - i);
    return [29, 30, ...rest];
  }
  return Array.from({ length: 30 }, (_, i) => 30 - i);
}

/**
 * Extracts the first N words of a Quranic verse in Uthmani script to serve as a memory prompt ("Indice 1ers mots").
 */
export function getArabicFirstWordsHint(textUthmani: string, wordCount: number = 2): string {
  const words = textUthmani.trim().split(/\s+/);
  if (words.length <= wordCount) return textUthmani;
  return `${words.slice(0, wordCount).join(' ')} …`;
}

/**
 * Pure state machine for verse-by-verse audio transitions (including 1x fluid continuous mode,
 * N-times verse repeat, and [rangeStart..rangeEnd] loop).
 */
export function computeNextVersePlaybackState(params: {
  activeVerse: number;
  currentIteration: number;
  repeatTarget: number; // 1 = 1x continuous, 3 = 3x, 5 = 5x, 0 = infinite single verse
  rangeStart: number;
  rangeEnd: number;
  loopRange: boolean;
}): {
  nextVerse: number;
  nextIteration: number;
  shouldContinuePlaying: boolean;
  shouldReplaySameVerse: boolean;
} {
  const { activeVerse, currentIteration, repeatTarget, rangeStart, rangeEnd, loopRange } = params;
  const safeStart = Math.max(1, Math.min(rangeStart, rangeEnd));
  const safeEnd = Math.max(safeStart, rangeEnd);

  // Infinite repeat of a single verse
  if (repeatTarget === 0) {
    return {
      nextVerse: activeVerse,
      nextIteration: currentIteration + 1,
      shouldContinuePlaying: true,
      shouldReplaySameVerse: true,
    };
  }

  // Still repeating the current verse (e.g. 1/3 -> 2/3)
  if (currentIteration < repeatTarget) {
    return {
      nextVerse: activeVerse,
      nextIteration: currentIteration + 1,
      shouldContinuePlaying: true,
      shouldReplaySameVerse: true,
    };
  }

  // Completed target repetitions for activeVerse -> advance to next verse in range
  if (activeVerse < safeEnd) {
    return {
      nextVerse: activeVerse + 1,
      nextIteration: 1,
      shouldContinuePlaying: true,
      shouldReplaySameVerse: false,
    };
  }

  // Reached end of range
  if (loopRange) {
    return {
      nextVerse: safeStart,
      nextIteration: 1,
      shouldContinuePlaying: true,
      shouldReplaySameVerse: safeStart === activeVerse,
    };
  }

  return {
    nextVerse: activeVerse,
    nextIteration: 1,
    shouldContinuePlaying: false,
    shouldReplaySameVerse: false,
  };
}

/**
 * Converts elapsed stopwatch seconds into credit minutes (minimum 1 minute if >= 5 seconds elapsed,
 * or fallback to chosen preset minutes).
 */
export function computePracticedMinutesFromSeconds(
  elapsedSeconds: number,
  fallbackPresetMinutes: number
): number {
  if (elapsedSeconds >= 5) {
    return Math.max(1, Math.round(elapsedSeconds / 60));
  }
  return Math.max(1, fallbackPresetMinutes);
}

/**
 * Toggles a verse hesitation flag ("Point d'attention / Mutashabihat") so the user can review
 * difficult verses before validating their 2nd Check.
 */
export function toggleFlaggedVerseMap(
  currentMap: Record<string, FlaggedVerseItem> | undefined,
  surahNumber: number,
  ayahNumber: number,
  nowIso: string = new Date().toISOString()
): Record<string, FlaggedVerseItem> {
  const base = { ...(currentMap || {}) };
  const key = `${surahNumber}:${ayahNumber}`;
  if (base[key]) {
    delete base[key];
  } else {
    base[key] = {
      key,
      surahNumber,
      ayahNumber,
      createdAt: nowIso,
    };
  }
  return base;
}

/**
 * Creates a deterministic or indexed Hifdh continuation quiz prompt from a Surah's verses:
 * Gives promptVerse (verse N) and expects the user to recite nextVerses (verse N+1 and N+2).
 */
export function buildSurahQuizPrompt<T extends { numberInSurah: number }>(
  verses: T[],
  promptIndex: number
): {
  promptVerse: T;
  expectedNextVerses: T[];
  safeIndex: number;
} | null {
  if (!verses || verses.length < 2) return null;
  const maxStartIdx = verses.length - 2;
  const safeIndex = Math.max(0, Math.min(promptIndex, maxStartIdx));
  const promptVerse = verses[safeIndex];
  const expectedNextVerses = verses.slice(safeIndex + 1, Math.min(verses.length, safeIndex + 3));
  return {
    promptVerse,
    expectedNextVerses,
    safeIndex,
  };
}

/**
 * Splits a Surah's verses into Mushaf-sized pages (based on Arabic word count ~110 words per page)
 * so the user can read page by page ("page par page, ligne après ligne comme le Coran dans mes mains").
 */
export function paginateVersesForMushaf<T extends { textUthmani: string; numberInSurah: number }>(
  verses: T[],
  maxWordsPerPage: number = 115
): T[][] {
  if (!verses || verses.length === 0) return [];
  const pages: T[][] = [];
  let currentPage: T[] = [];
  let currentWords = 0;

  for (const v of verses) {
    const wordCount = v.textUthmani.trim().split(/\s+/).length;
    if (currentPage.length > 0 && currentWords + wordCount > maxWordsPerPage) {
      pages.push(currentPage);
      currentPage = [v];
      currentWords = wordCount;
    } else {
      currentPage.push(v);
      currentWords += wordCount;
    }
  }
  if (currentPage.length > 0) {
    pages.push(currentPage);
  }
  return pages;
}

const QURAN_WORD_GLOSSARY: Record<string, string> = {
  // Sourate Al-Mulk (67) & Juz 29-30 common vocabulary
  تبارك: 'Béni et exalté soit (abondance de bien divin)',
  الذي: 'Celui qui',
  بيده: 'Dans Sa main (sous Son pouvoir absolu)',
  الملك: 'La royauté / La souveraineté absolue',
  وهو: 'Et Il est',
  على: 'Sur / Envers',
  كل: 'Toute',
  شيء: 'Chose',
  قدير: 'Omnipotent / Tout-Puissant',
  خلق: 'Il a créé',
  الموت: 'La mort',
  والحياة: 'Et la vie',
  ليبلوكم: 'Afin de vous éprouver (tester)',
  أيكم: 'Lequel d’entre vous',
  أحسن: 'Est le meilleur',
  عملا: 'En œuvre / En action',
  العزيز: 'Le Tout-Puissant (L’Irrésistible)',
  الغفور: 'Le Très-Pardonneur',
  سبع: 'Sept',
  سموات: 'Cieux',
  طباقا: 'Superposés en harmonie',
  ترى: 'Tu vois',
  الرحمن: 'Le Tout Miséricordieux',
  تفاوت: 'Disproportion / Défaut',
  فارجع: 'Ramène / Retourne donc',
  البصر: 'Le regard / La vue',
  فطور: 'Brèches / Fissures',
  كرتين: 'À deux reprises (encore et encore)',
  ينقلب: 'Reviendra',
  خاسئا: 'Humilié / Confus',
  حسير: 'Épuisé / Frustré',
  زينا: 'Nous avons embelli / paré',
  السماء: 'Le ciel',
  الدنيا: 'Le plus proche (d’ici-bas)',
  بمصابيح: 'Avec des lampes (les étoiles lumineuses)',
  وجعلناها: 'Et Nous en avons fait',
  رجوما: 'Des projectiles (météores)',
  للشياطين: 'Contre les diables',
  وأعتدنا: 'Et Nous avons préparé',
  عذاب: 'Le châtiment',
  السعير: 'De la Fournaise ardente',
  // Sourate An-Naba (78) & Juz 30
  عم: 'Sur quoi',
  يتساءلون: 'S’interrogent-ils mutuellement',
  النبإ: 'La grande nouvelle (la Résurrection et le Coran)',
  العظيم: 'Immense / Solennelle',
  مختلفون: 'En désaccord / Divergent',
  كلا: 'Eh bien non ! (Certes non)',
  سيعلمون: 'Ils sauront bientôt',
  المهاد: 'Un berceau / Une couche étendue (la terre)',
  أوتادا: 'Des pieux / Des piliers (les montagnes)',
  أزواجا: 'Par couples',
  سباتا: 'Un repos réparateur (le sommeil)',
  لباسا: 'Un vêtement / Un manteau (la nuit)',
  معاشا: 'Un temps pour gagner sa vie (le jour)',
  شدادا: 'Sept cieux solidement édifiés',
  سراجا: 'Une lampe éblouissante (le soleil)',
  وهاجا: 'Ardente et rayonnante',
  المعصرات: 'Les nuages chargés de pluie',
  ثجاجا: 'Une eau abondante qui se déverse',
  حبا: 'Des grains',
  ونباتا: 'Et des plantes',
  وجنات: 'Et des jardins',
  ألفافا: 'Aux arbres touffus et entrelacés',
  الفصل: 'Le Jour de la Décision (du Jugement)',
  ميقاتا: 'Un terme fixé',
  الصور: 'La Trompe (du Jour Dernier)',
  أفواجا: 'En foules / Par groupes',
  سرابا: 'Un mirage',
  مرصادا: 'Un lieu d’embuscade (l’Enfer)',
  مفازا: 'Un grand succès / Un lieu de salut (le Paradis)',
  حدائق: 'Des vergers / Jardins',
  وأعنابا: 'Et des vignes',
  دهاقا: 'Des coupes débordantes',
  // Sourate Al-Fatiha & general
  بسم: 'Au nom de',
  الله: 'Allah',
  الرحيم: 'Le Très Miséricordieux',
  الحمد: 'La louange parfaite',
  لله: 'Appartient à Allah',
  رب: 'Seigneur et Éducateur',
  العالمين: 'De l’univers (de tous les mondes)',
  مالك: 'Maître souverain',
  يوم: 'Du Jour',
  الدين: 'De la Rétribution (du Jugement)',
  إياك: 'C’est Toi Seul',
  نعبد: 'Que nous adorons',
  نستعين: 'Dont nous implorons le secours',
  اهدنا: 'Guide-nous',
  الصراط: 'Sur le droit chemin',
  المستقيم: 'Droit et sans déviation',
  أنعمت: 'Tu as comblé de faveurs',
  المغضوب: 'Ceux qui ont encouru Ta colère',
  الضالين: 'Les égarés',
};

function normalizeArabicWordForLookup(word: string): string {
  return word
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // Strip harakat & tajwid marks
    .replace(/ٱ/g, 'ا')
    .replace(/أ|إ|آ/g, 'أ')
    .replace(/ى/g, 'ي')
    .replace(/[^\u0621-\u064A]/g, '')
    .trim();
}

/**
 * Extracts a focused popup explanation for ONLY the clicked word and/or verse phrase,
 * mapping the clicked Arabic word to its exact glossary translation or contextual French segment.
 */
export function extractFocusedWordAndPhraseExplanation(params: {
  textUthmani: string;
  tafsirMuyassarAr: string;
  translationFr: string;
  conciseExplanationFr: string;
  clickedWordAr?: string;
  clickedWordIndex?: number;
}): {
  clickedWordAr: string | null;
  estimatedWordMeaningFr: string | null;
  phraseArabic: string;
  phraseTafsirAr: string;
  phraseTranslationFr: string;
  phraseKeyTakeawayFr: string;
} {
  const {
    textUthmani,
    tafsirMuyassarAr,
    translationFr,
    conciseExplanationFr,
    clickedWordAr,
    clickedWordIndex,
  } = params;

  const arWords = textUthmani.trim().split(/\s+/).filter(Boolean);
  const frWords = translationFr.trim().split(/\s+/).filter(Boolean);

  let estimatedWordMeaningFr: string | null = null;
  if (clickedWordAr) {
    const norm = normalizeArabicWordForLookup(clickedWordAr);
    const normAlef = norm.replace(/أ/g, 'ا');
    // Check direct or Alef-normalized glossary match
    const directMatch =
      QURAN_WORD_GLOSSARY[norm] ||
      Object.entries(QURAN_WORD_GLOSSARY).find(
        ([k]) => normalizeArabicWordForLookup(k).replace(/أ/g, 'ا') === normAlef
      )?.[1];

    if (directMatch) {
      estimatedWordMeaningFr = directMatch;
    } else if (
      typeof clickedWordIndex === 'number' &&
      arWords.length > 0 &&
      frWords.length > 0
    ) {
      const ratioStart = Math.max(0, clickedWordIndex / arWords.length);
      const ratioEnd = Math.min(1, (clickedWordIndex + 1.5) / arWords.length);
      const startFrIdx = Math.max(0, Math.floor(ratioStart * frWords.length));
      const endFrIdx = Math.min(frWords.length, Math.ceil(ratioEnd * frWords.length) + 2);
      const slice = frWords.slice(startFrIdx, Math.max(startFrIdx + 3, endFrIdx)).join(' ');
      estimatedWordMeaningFr = slice || translationFr;
    }
  }

  return {
    clickedWordAr: clickedWordAr || null,
    estimatedWordMeaningFr,
    phraseArabic: textUthmani,
    phraseTafsirAr: tafsirMuyassarAr,
    phraseTranslationFr: translationFr,
    phraseKeyTakeawayFr: conciseExplanationFr,
  };
}

/**
 * Creates a realistic initial Hifdh state so the user immediately sees how the Double Check
 * and 3h/week tracker work on Juz 30 and Juz 29, while allowing 1-click reset or toggle.
 */
export function createInitialHifdhState(): HifdhState {
  const now = new Date('2026-11-01T08:00:00Z');
  const sixDaysAgo = new Date(now.getTime() - 6 * 86400000).toISOString();
  const fourDaysAgo = new Date(now.getTime() - 4 * 86400000).toISOString();
  const twoDaysAgo = new Date(now.getTime() - 2 * 86400000).toISOString();
  const tenDaysAgo = new Date(now.getTime() - 10 * 86400000).toISOString();

  return {
    halfHizbProgress: {
      // Hizb 60 (Juz 30) fully memorized & consolidated (Check 1 + Check 2)
      120: {
        check1Memorized: true,
        check1Date: tenDaysAgo,
        check2Revised: true,
        check2Date: fourDaysAgo,
        lastReviewedDate: fourDaysAgo,
      },
      119: {
        check1Memorized: true,
        check1Date: tenDaysAgo,
        check2Revised: true,
        check2Date: twoDaysAgo,
        lastReviewedDate: twoDaysAgo,
      },
      // Hizb 59 - 1ère moitié (An-Naba) : 1er Check fait il y a 5 jours -> Prêt pour le 2ème Check !
      117: {
        check1Memorized: true,
        check1Date: sixDaysAgo,
        check2Revised: false,
        check2Date: null,
        lastReviewedDate: null,
      },
      // Hizb 57 - 1ère moitié (Sourate Al-Mulk, Juz 29) : 1er Check fait il y a 4 jours -> Prêt pour le 2ème Check !
      113: {
        check1Memorized: true,
        check1Date: fourDaysAgo,
        check2Revised: false,
        check2Date: null,
        lastReviewedDate: null,
      },
    },
    surahProgress: {
      1: {
        check1Memorized: true,
        check1Date: tenDaysAgo,
        check2Revised: true,
        check2Date: fourDaysAgo,
        lastReviewedDate: fourDaysAgo,
      },
      67: {
        check1Memorized: true,
        check1Date: fourDaysAgo,
        check2Revised: false,
        check2Date: null,
        lastReviewedDate: null,
      },
      78: {
        check1Memorized: true,
        check1Date: sixDaysAgo,
        check2Revised: false,
        check2Date: null,
        lastReviewedDate: null,
      },
      87: {
        check1Memorized: true,
        check1Date: tenDaysAgo,
        check2Revised: true,
        check2Date: twoDaysAgo,
        lastReviewedDate: twoDaysAgo,
      },
      112: {
        check1Memorized: true,
        check1Date: tenDaysAgo,
        check2Revised: true,
        check2Date: fourDaysAgo,
        lastReviewedDate: fourDaysAgo,
      },
      113: {
        check1Memorized: true,
        check1Date: tenDaysAgo,
        check2Revised: true,
        check2Date: fourDaysAgo,
        lastReviewedDate: fourDaysAgo,
      },
      114: {
        check1Memorized: true,
        check1Date: tenDaysAgo,
        check2Revised: true,
        check2Date: fourDaysAgo,
        lastReviewedDate: fourDaysAgo,
      },
    },
    sessions: [
      {
        id: 'sess-1',
        dateIso: fourDaysAgo,
        durationMinutes: 60,
        sessionType: 'memorization',
        targetLabel: 'Juz 29 · Hizb 57 (Sourate Al-Mulk 1–30) — Écoute Cheikh Yasser Al-Dosari',
        halfHizbId: 113,
        surahNumber: 67,
      },
      {
        id: 'sess-2',
        dateIso: twoDaysAgo,
        durationMinutes: 60,
        sessionType: 'revision_check2',
        targetLabel: 'Juz 30 · Hizb 60 (Sourates Al-A\'la à Ad-Duha) — Validation 2ème Check',
        halfHizbId: 119,
        surahNumber: 87,
      },
    ],
    schedule: {
      weeklyHoursTarget: 3,
      sessionsPerWeek: 3,
      selectedDays: ['Mardi', 'Jeudi', 'Dimanche'],
      reminderTime: '20:00',
      weeklyHizbPace: 0.5,
      consolidationDelayDays: 5,
      directionOrder: 'reverse_juz',
    },
  };
}
