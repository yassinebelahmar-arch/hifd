import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCheck1Toggle,
  applyCheck2Toggle,
  calculateHifdhStats,
  calculateWeeklySessionSummary,
  createEmptyCheckItem,
  createInitialHifdhState,
  formatRemainingWeeksToYearsMonths,
  generateDailyRevisionPlan,
  getOrderedJuzNumbers,
} from './hifdhLogic';

test('Double Check logic: Check 1 marks memorized without counting as Check 2 validated', () => {
  const initial = createEmptyCheckItem();
  const afterCheck1 = applyCheck1Toggle(initial, '2026-11-01T10:00:00Z');
  assert.equal(afterCheck1.check1Memorized, true);
  assert.equal(afterCheck1.check2Revised, false);
  assert.equal(afterCheck1.check1Date, '2026-11-01T10:00:00Z');
});

test('Double Check logic: Check 2 validates retention and ensures Check 1 is also checked', () => {
  const initial = createEmptyCheckItem();
  const afterCheck2 = applyCheck2Toggle(initial, '2026-11-01T12:00:00Z');
  assert.equal(afterCheck2.check1Memorized, true);
  assert.equal(afterCheck2.check2Revised, true);
  assert.equal(afterCheck2.check2Date, '2026-11-01T12:00:00Z');

  // Unchecking Check 1 resets both Check 1 and Check 2
  const afterUncheck1 = applyCheck1Toggle(afterCheck2, '2026-11-02T12:00:00Z');
  assert.equal(afterUncheck1.check1Memorized, false);
  assert.equal(afterUncheck1.check2Revised, false);
});

test('Statistics & Dynamic Goal Projection: Only Check 2 updates official progress and reduces remaining time', () => {
  const state = createInitialHifdhState();
  const refDate = new Date('2026-11-01T08:00:00Z');

  // In initial state: 2 Half-Hizbs (119, 120) have Check 2 = true (1.0 Hizb validated)
  // 2 Half-Hizbs (117, 113) have only Check 1 = true (1.0 Hizb in consolidation)
  const statsBefore = calculateHifdhStats(state, refDate);
  assert.equal(statsBefore.validatedHalfHizbs, 2);
  assert.equal(statsBefore.validatedHizbs, 1);
  assert.equal(statsBefore.check1OnlyHalfHizbs, 2);
  assert.equal(statsBefore.remainingHizbs, 59);
  // At 0.5 Hizb/week, 59 Hizb remaining = 118 weeks
  assert.equal(statsBefore.remainingWeeks, 118);

  // Now validate Check 2 on Half-Hizb 117 (An-Naba)
  state.halfHizbProgress[117] = applyCheck2Toggle(state.halfHizbProgress[117], '2026-11-01T09:00:00Z');
  const statsAfter = calculateHifdhStats(state, refDate);
  assert.equal(statsAfter.validatedHalfHizbs, 3);
  assert.equal(statsAfter.validatedHizbs, 1.5);
  assert.equal(statsAfter.check1OnlyHalfHizbs, 1);
  assert.equal(statsAfter.remainingHizbs, 58.5);
  assert.equal(statsAfter.remainingWeeks, 117);
});

test('formatRemainingWeeksToYearsMonths converts weeks into years, months, and weeks in French', () => {
  const res = formatRemainingWeeksToYearsMonths(120, new Date('2026-11-01T00:00:00Z'));
  assert.equal(res.years, 2);
  assert.ok(res.months >= 3);
  assert.ok(res.formattedFr.includes('2 ans'));

  const done = formatRemainingWeeksToYearsMonths(0);
  assert.equal(done.years, 0);
  assert.equal(done.months, 0);
  assert.ok(done.formattedFr.includes('Khatm accompli'));
});

test('Reverse Juz ordering starts from Juz 30 down to Juz 1', () => {
  const reverseOrder = getOrderedJuzNumbers('reverse_juz');
  assert.equal(reverseOrder.length, 30);
  assert.equal(reverseOrder[0], 30);
  assert.equal(reverseOrder[1], 29);
  assert.equal(reverseOrder[2], 28);
  assert.equal(reverseOrder[29], 1);

  const mulkFirst = getOrderedJuzNumbers('custom_mulk_first');
  assert.equal(mulkFirst[0], 29);
  assert.equal(mulkFirst[1], 30);
  assert.equal(mulkFirst[2], 28);
});

test('Smart Daily Revision Plan surfaces pending Check 2 items after consolidation window', () => {
  const state = createInitialHifdhState();
  const refDate = new Date('2026-11-01T08:00:00Z');
  const plan = generateDailyRevisionPlan(state, refDate);

  const pendingCheck2 = plan.filter((item) => item.urgency === 'ready_for_check2');
  assert.equal(pendingCheck2.length, 2); // Half-Hizb 117 (6 days ago) and 113 (4 days ago)
  assert.equal(pendingCheck2[0].halfHizb.id, 117);
});

test('Weekly 3h session summary calculates completed minutes and session adherence', () => {
  const state = createInitialHifdhState();
  const refDate = new Date('2026-11-01T08:00:00Z');
  const summary = calculateWeeklySessionSummary(state.sessions, state.schedule, refDate);
  assert.equal(summary.targetMinutes, 180);
  assert.equal(summary.completedMinutesThisWeek, 120);
  assert.equal(summary.completedHoursFormatted, '2h00');
  assert.equal(summary.sessionsCountThisWeek, 2);
  assert.equal(summary.recommendedMinutesPerSession, 60);
});

test('1x continuous playback advances immediately to next verse and loops range when enabled', async () => {
  const { computeNextVersePlaybackState, getArabicFirstWordsHint, computePracticedMinutesFromSeconds } = await import('./hifdhLogic');

  // In 1x mode (repeatTarget = 1), finishing verse 1 moves immediately to verse 2
  const step1 = computeNextVersePlaybackState({
    activeVerse: 1,
    currentIteration: 1,
    repeatTarget: 1,
    rangeStart: 1,
    rangeEnd: 5,
    loopRange: true,
  });
  assert.equal(step1.nextVerse, 2);
  assert.equal(step1.nextIteration, 1);
  assert.equal(step1.shouldContinuePlaying, true);
  assert.equal(step1.shouldReplaySameVerse, false);

  // At verse 5 (end of range) with loopRange = true, it loops back to verse 1
  const stepEnd = computeNextVersePlaybackState({
    activeVerse: 5,
    currentIteration: 1,
    repeatTarget: 1,
    rangeStart: 1,
    rangeEnd: 5,
    loopRange: true,
  });
  assert.equal(stepEnd.nextVerse, 1);
  assert.equal(stepEnd.shouldContinuePlaying, true);

  // First words hint returns first 2 words + ellipsis
  const hint = getArabicFirstWordsHint('تَبَٰرَكَ ٱلَّذِى بِيَدِهِ ٱلْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ', 2);
  assert.equal(hint, 'تَبَٰرَكَ ٱلَّذِى …');

  // Stopwatch seconds conversion
  assert.equal(computePracticedMinutesFromSeconds(125, 60), 2);
  assert.equal(computePracticedMinutesFromSeconds(20, 60), 1);
  assert.equal(computePracticedMinutesFromSeconds(0, 45), 45);
});

test('Hesitation flags (Mutashabihat) and Hifdh Quiz continuation generator work accurately', async () => {
  const { toggleFlaggedVerseMap, buildSurahQuizPrompt } = await import('./hifdhLogic');

  let flags = toggleFlaggedVerseMap({}, 67, 3, '2026-11-01T10:00:00Z');
  assert.ok(flags['67:3']);
  assert.equal(flags['67:3'].surahNumber, 67);
  assert.equal(flags['67:3'].ayahNumber, 3);

  // Toggling again removes the flag
  flags = toggleFlaggedVerseMap(flags, 67, 3);
  assert.equal(flags['67:3'], undefined);

  const sampleVerses = [
    { numberInSurah: 1, text: 'v1' },
    { numberInSurah: 2, text: 'v2' },
    { numberInSurah: 3, text: 'v3' },
    { numberInSurah: 4, text: 'v4' },
  ];
  const quiz = buildSurahQuizPrompt(sampleVerses, 1);
  assert.ok(quiz);
  assert.equal(quiz.promptVerse.numberInSurah, 2);
  assert.equal(quiz.expectedNextVerses.length, 2);
  assert.equal(quiz.expectedNextVerses[0].numberInSurah, 3);
  assert.equal(quiz.expectedNextVerses[1].numberInSurah, 4);
});

test('Mushaf pagination and focused word/phrase Tafsir popup extraction work accurately', async () => {
  const { paginateVersesForMushaf, extractFocusedWordAndPhraseExplanation } = await import('./hifdhLogic');

  const dummyVerses = Array.from({ length: 10 }, (_, idx) => ({
    numberInSurah: idx + 1,
    textUthmani: 'تَبَٰرَكَ ٱلَّذِى بِيَدِهِ ٱلْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ',
  }));

  // 10 verses of 9 words each = 90 words -> with maxWordsPerPage=45, should split into 2 pages of 5 verses
  const pages = paginateVersesForMushaf(dummyVerses, 45);
  assert.equal(pages.length, 2);
  assert.equal(pages[0].length, 5);
  assert.equal(pages[1].length, 5);

  const focused = extractFocusedWordAndPhraseExplanation({
    textUthmani: 'تَبَٰرَكَ ٱلَّذِى بِيَدِهِ ٱلْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ',
    tafsirMuyassarAr: 'تعاظم وكثر خير الله الذي بيده ملك الدنيا والآخرة.',
    translationFr: 'Béni soit Celui dans la main de Qui est la royauté, et Il est Omnipotent.',
    conciseExplanationFr: 'Affirmation de la souveraineté absolue d’Allah.',
    clickedWordAr: 'ٱلْمُلْكُ',
    clickedWordIndex: 3,
  });

  assert.equal(focused.clickedWordAr, 'ٱلْمُلْكُ');
  assert.ok(focused.estimatedWordMeaningFr && focused.estimatedWordMeaningFr.length > 0);
  assert.ok(focused.phraseTafsirAr.includes('تعاظم'));
  assert.ok(focused.phraseTranslationFr.includes('royauté'));
});

test('Weekly session portion labels (1/8 Hizb, 1/4 Hizb, 1 or 2 Surahs) and Arabic projection formatting work accurately', async () => {
  const {
    getPortionLabelBilingual,
    formatProjectionArabic,
    toArabicDigits,
    createDefaultPlannedWeeklySessions,
  } = await import('./hifdhLogic');

  assert.equal(toArabicDigits(114), '١١٤');
  assert.equal(getPortionLabelBilingual('1_8_hizb').shortFr, '1/8 Hizb');
  assert.equal(getPortionLabelBilingual('1_4_hizb').shortFr, '1/4 Hizb');
  assert.equal(getPortionLabelBilingual('1_surah').shortFr, '1 Sourate');
  assert.equal(getPortionLabelBilingual('2_surahs').shortFr, '2 Sourates');
  assert.ok(formatProjectionArabic(2, 3, 1).includes('سنتان'));

  const defaults = createDefaultPlannedWeeklySessions();
  assert.ok(defaults.length >= 3);
  assert.equal(defaults[0].dayName, 'Lundi');
  assert.equal(defaults[0].plannedDurationMinutes, 90);
});


