import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  EyeOff,
  Headphones,
  Pause,
  Volume2,
  X,
} from 'lucide-react';
import {
  ALL_HALF_HIZBS,
  ALL_SURAHS,
  OFFLINE_SURAH_VERSES,
  SurahMeta,
  VerseDetail,
} from '../data/quranMetadata';
import { fetchSurahVersesWithTafsir } from '../services/quranApi';
import {
  HifdhState,
  extractFocusedWordAndPhraseExplanation,
  paginateVersesForMushaf,
} from '../utils/hifdhLogic';
import { SharedAudioController } from './GlobalAudioPlayerBar';

interface HifdhMushafViewProps {
  state: HifdhState;
  selectedSurahNumber: number;
  audioController: SharedAudioController;
  onSelectSurah: (surahNumber: number) => void;
  onToggleSurahCheck1: (surahNumber: number) => void;
  onToggleSurahCheck2: (surahNumber: number) => void;
  onToggleHalfHizbCheck1: (id: number) => void;
  onToggleHalfHizbCheck2: (id: number) => void;
}

interface SelectedPopupTarget {
  verse: VerseDetail;
  clickedWordAr?: string;
  clickedWordIndex?: number;
}

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
function toArabicIndicDigits(num: number): string {
  return String(num)
    .split('')
    .map((d) => ARABIC_DIGITS[Number(d)] ?? d)
    .join('');
}

export const HifdhMushafView: React.FC<HifdhMushafViewProps> = ({
  state,
  selectedSurahNumber,
  audioController,
  onSelectSurah,
  onToggleSurahCheck1,
  onToggleSurahCheck2,
}) => {
  const [verses, setVerses] = useState<VerseDetail[]>(
    () => OFFLINE_SURAH_VERSES[selectedSurahNumber] || []
  );
  const [loading, setLoading] = useState<boolean>(
    () => !OFFLINE_SURAH_VERSES[selectedSurahNumber]
  );

  // Page-by-page Mushaf navigation & Real Mushaf Density Mode ('dense' = real dense Mushaf, 'classic' = rollback large text)
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [paginationMode, setPaginationMode] = useState<'page' | 'full_surah'>('page');
  const [mushafDensity, setMushafDensity] = useState<'dense' | 'classic'>('dense');

  // Hifdh memorization mask mode
  const [maskMode, setMaskMode] = useState<'none' | 'blur_all' | 'first_word_only'>('none');
  const [revealedVerses, setRevealedVerses] = useState<Record<number, boolean>>({});

  // Focused Word / Phrase Tafsir Popup (Only shown when clicking/double-clicking a word or verse)
  const [popupTarget, setPopupTarget] = useState<SelectedPopupTarget | null>(null);
  const [isPopupMinimized, setIsPopupMinimized] = useState<boolean>(false);

  // Canonical Quran order (1. Al-Fatiha -> 2. Al-Baqarah -> ... -> 114. An-Nas)
  const orderedSurahs = useMemo(() => {
    return [...ALL_SURAHS].sort((a, b) => a.number - b.number);
  }, []);

  const currentSurahMeta: SurahMeta = useMemo(
    () => ALL_SURAHS.find((s) => s.number === selectedSurahNumber) || ALL_SURAHS[66],
    [selectedSurahNumber]
  );

  useEffect(() => {
    let mounted = true;
    const seed = OFFLINE_SURAH_VERSES[selectedSurahNumber];
    if (seed && seed.length > 0) {
      setVerses(seed);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setPageIndex(0);
    setPopupTarget(null);
    setRevealedVerses({});

    fetchSurahVersesWithTafsir(selectedSurahNumber).then((res) => {
      if (!mounted) return;
      setVerses(res.verses);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [selectedSurahNumber]);

  const pages = useMemo(() => {
    if (paginationMode === 'full_surah') {
      return verses.length > 0 ? [verses] : [];
    }
    // In 'dense' (vrai Mushaf) mode, pack ~350 words per page so a full 15-line Mushaf page is filled with verses
    const maxWords = mushafDensity === 'dense' ? 350 : 115;
    return paginateVersesForMushaf(verses, maxWords);
  }, [verses, paginationMode, mushafDensity]);

  const currentPageVerses = useMemo(
    () => pages[Math.min(pageIndex, Math.max(0, pages.length - 1))] || [],
    [pages, pageIndex]
  );

  const handleNextPageOrSurah = () => {
    setPopupTarget(null);
    if (pageIndex + 1 < pages.length) {
      setPageIndex((p) => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // Move to next surah in canonical Quran order (audio keeps playing!)
    const currentIdx = orderedSurahs.findIndex((s) => s.number === selectedSurahNumber);
    if (currentIdx >= 0 && currentIdx + 1 < orderedSurahs.length) {
      onSelectSurah(orderedSurahs[currentIdx + 1].number);
    }
  };

  const handlePrevPageOrSurah = () => {
    setPopupTarget(null);
    if (pageIndex > 0) {
      setPageIndex((p) => p - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const currentIdx = orderedSurahs.findIndex((s) => s.number === selectedSurahNumber);
    if (currentIdx > 0) {
      onSelectSurah(orderedSurahs[currentIdx - 1].number);
    }
  };

  const handleWordClick = (
    e: React.MouseEvent,
    verse: VerseDetail,
    wordAr: string,
    wordIdx: number
  ) => {
    e.stopPropagation();

    if (maskMode !== 'none' && !revealedVerses[verse.numberInSurah]) {
      setRevealedVerses((prev) => ({ ...prev, [verse.numberInSurah]: true }));
      return;
    }

    if (
      popupTarget &&
      popupTarget.verse.numberInSurah === verse.numberInSurah &&
      popupTarget.clickedWordIndex === wordIdx
    ) {
      setPopupTarget(null);
      return;
    }

    setIsPopupMinimized(false);
    setPopupTarget({
      verse,
      clickedWordAr: wordAr,
      clickedWordIndex: wordIdx,
    });
  };

  const handleWordDoubleClick = (
    e: React.MouseEvent,
    verse: VerseDetail,
    wordAr: string,
    wordIdx: number
  ) => {
    e.stopPropagation();
    setRevealedVerses((prev) => ({ ...prev, [verse.numberInSurah]: true }));
    setIsPopupMinimized(false);
    setPopupTarget({
      verse,
      clickedWordAr: wordAr,
      clickedWordIndex: wordIdx,
    });
  };

  const handleVerseMedallionClick = (e: React.MouseEvent, verse: VerseDetail) => {
    e.stopPropagation();
    if (popupTarget && popupTarget.verse.numberInSurah === verse.numberInSurah) {
      setPopupTarget(null);
      return;
    }
    setIsPopupMinimized(false);
    setPopupTarget({
      verse,
    });
  };

  const focusedExplanation = useMemo(() => {
    if (!popupTarget) return null;
    return extractFocusedWordAndPhraseExplanation({
      textUthmani: popupTarget.verse.textUthmani,
      tafsirMuyassarAr: popupTarget.verse.tafsirMuyassarAr,
      translationFr: popupTarget.verse.translationFr,
      conciseExplanationFr: popupTarget.verse.conciseExplanationFr,
      clickedWordAr: popupTarget.clickedWordAr,
      clickedWordIndex: popupTarget.clickedWordIndex,
    });
  }, [popupTarget]);

  const surahProg = state.surahProgress[selectedSurahNumber];
  const matchingHalfHizb =
    ALL_HALF_HIZBS.find(
      (h) => selectedSurahNumber >= h.startSurah && selectedSurahNumber <= h.endSurah
    ) || ALL_HALF_HIZBS[112];

  const totalWordsOnPage = useMemo(
    () =>
      currentPageVerses.reduce(
        (acc, v) => acc + v.textUthmani.trim().split(/\s+/).filter(Boolean).length,
        0
      ),
    [currentPageVerses]
  );

  const isThisSurahPlaying =
    audioController.isPlaying && audioController.playingSurahNumber === selectedSurahNumber;

  return (
    <div
      className="max-w-4xl mx-auto space-y-3.5 pb-28"
      onClick={() => {
        if (popupTarget) setPopupTarget(null);
      }}
    >
      {/* Top Mushaf Control Bar — Canonical Surah Order (1..114) + Repeat (1x 3x 5x ∞) & Speed (0.85x 1x 1.15x) + Density Toggle */}
      <div
        className="theme-surface border rounded-xl p-3 sm:p-4 space-y-2.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Surah Selector (Sorted 1 to 114 like in the Quran) + Quick Check 1 & Check 2 */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Choisir la sourate dans le Mushaf"
              value={selectedSurahNumber}
              onChange={(e) => onSelectSurah(Number(e.target.value))}
              className="px-3 py-1.5 text-xs sm:text-sm font-bold theme-muted border rounded-lg cursor-pointer focus:outline-none"
            >
              {orderedSurahs.map((s) => (
                <option key={s.number} value={s.number}>
                  {s.number}. Sourate {s.nameFr} (سورة {s.nameAr}) — {s.ayahCount} v.
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => onToggleSurahCheck1(selectedSurahNumber)}
              aria-pressed={Boolean(surahProg?.check1Memorized)}
              className={`px-2.5 py-1.5 text-xs rounded-lg border flex items-center gap-1 cursor-pointer transition-colors ${
                surahProg?.check1Memorized
                  ? 'theme-badge-check1 font-semibold'
                  : 'theme-muted theme-text-muted hover:text-[var(--text-main)]'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>1er Check</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleSurahCheck2(selectedSurahNumber)}
              aria-pressed={Boolean(surahProg?.check2Revised)}
              className={`px-2.5 py-1.5 text-xs rounded-lg border flex items-center gap-1 cursor-pointer transition-colors ${
                surahProg?.check2Revised
                  ? 'theme-badge-check2 font-semibold'
                  : 'theme-muted theme-text-muted hover:text-[var(--text-main)]'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>2ème Check</span>
            </button>
          </div>

          {/* Right: Repeat (1x | 3x | 5x | ∞) + Speed (0.85x | 1x | 1.15x) + 1-Click Continuous Full Surah Audio */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Repeat Menu in Mushaf: 1x | 3x | 5x | ∞ */}
            <div
              role="group"
              aria-label="Répétition dans le Mushaf"
              className="flex items-center gap-0.5 p-0.5 theme-muted border rounded-lg text-xs"
            >
              {(
                [
                  { val: 1, label: '1x' },
                  { val: 3, label: '3x' },
                  { val: 5, label: '5x' },
                  { val: 0, label: '∞' },
                ] as const
              ).map((r) => (
                <button
                  key={r.val}
                  type="button"
                  onClick={() => audioController.setRepeatMode(r.val)}
                  className={`px-2 py-1 rounded font-mono-tabular cursor-pointer transition-colors ${
                    audioController.repeatMode === r.val
                      ? 'theme-btn-primary font-bold shadow-2xs'
                      : 'theme-text-muted hover:text-[var(--text-main)]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Speed Menu in Mushaf: 0.85x | 1x | 1.15x */}
            <div
              role="group"
              aria-label="Vitesse dans le Mushaf"
              className="flex items-center gap-0.5 p-0.5 theme-muted border rounded-lg text-xs"
            >
              {[0.85, 1, 1.15].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => audioController.setPlaybackRate(spd)}
                  className={`px-2 py-1 rounded font-mono-tabular cursor-pointer transition-colors ${
                    audioController.playbackRate === spd
                      ? 'theme-btn-primary font-bold shadow-2xs'
                      : 'theme-text-muted hover:text-[var(--text-main)]'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => audioController.togglePlaySurah(selectedSurahNumber)}
              className="px-3.5 py-1.5 text-xs font-semibold theme-btn-primary rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              {isThisSurahPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Sourate</span>
                </>
              ) : (
                <>
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Écouter la Sourate</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Second Toolbar Row: Quick Surah Jumps + Mushaf Density Toggle (Vrai Mushaf Dense vs Classique Rollback) + Masking */}
        <div className="pt-2 border-t theme-border flex flex-wrap items-center justify-between gap-2">
          {/* Quick Surah Shortcuts */}
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <span className="theme-text-muted text-[11px] mr-1">Accès rapide :</span>
            {[
              { num: 1, label: '1. الفاتحة' },
              { num: 67, label: '67. الملك (Al-Mulk)' },
              { num: 78, label: '78. النبأ (An-Naba)' },
              { num: 87, label: '87. الأعلى' },
              { num: 114, label: '114. الناس' },
            ].map((q) => (
              <button
                key={q.num}
                type="button"
                onClick={() => onSelectSurah(q.num)}
                className={`px-2 py-1 rounded-md border text-[11px] cursor-pointer transition-colors ${
                  selectedSurahNumber === q.num
                    ? 'theme-btn-primary border-transparent font-bold'
                    : 'theme-muted theme-text-muted hover:text-[var(--text-main)]'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Mushaf Density Switcher (Vrai Mushaf Dense vs Classique Rollback) + Hifdh Mask */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Density Toggle with 1-Click Rollback */}
            <div
              role="group"
              aria-label="Densité de la page du Mushaf"
              className="flex items-center gap-0.5 p-0.5 theme-muted border rounded-lg text-xs"
            >
              <button
                type="button"
                data-testid="mushaf-density-dense"
                onClick={() => {
                  setMushafDensity('dense');
                  setPageIndex(0);
                }}
                className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                  mushafDensity === 'dense'
                    ? 'theme-btn-primary font-semibold shadow-2xs'
                    : 'theme-text-muted hover:text-[var(--text-main)]'
                }`}
              >
                Mushaf Dense (Vrai Mushaf)
              </button>
              <button
                type="button"
                data-testid="mushaf-density-classic"
                onClick={() => {
                  setMushafDensity('classic');
                  setPageIndex(0);
                }}
                className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                  mushafDensity === 'classic'
                    ? 'theme-btn-primary font-semibold shadow-2xs'
                    : 'theme-text-muted hover:text-[var(--text-main)]'
                }`}
              >
                Classique (Grands mots)
              </button>
            </div>

            <div className="flex items-center gap-0.5 p-0.5 theme-muted border rounded-lg text-xs">
              <button
                type="button"
                onClick={() => {
                  setMaskMode('none');
                  setRevealedVerses({});
                }}
                className={`px-2 py-1 rounded-md cursor-pointer flex items-center gap-1 ${
                  maskMode === 'none'
                    ? 'theme-surface font-semibold shadow-2xs'
                    : 'theme-text-muted'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Visible</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMaskMode('first_word_only');
                  setRevealedVerses({});
                }}
                className={`px-2 py-1 rounded-md cursor-pointer ${
                  maskMode === 'first_word_only'
                    ? 'theme-surface font-semibold shadow-2xs'
                    : 'theme-text-muted'
                }`}
              >
                1er mot
              </button>
              <button
                type="button"
                onClick={() => {
                  setMaskMode('blur_all');
                  setRevealedVerses({});
                }}
                className={`px-2 py-1 rounded-md cursor-pointer flex items-center gap-1 ${
                  maskMode === 'blur_all'
                    ? 'theme-surface font-semibold shadow-2xs'
                    : 'theme-text-muted'
                }`}
              >
                <EyeOff className="w-3 h-3" />
                <span>Masquer</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                setPaginationMode((m) => (m === 'page' ? 'full_surah' : 'page'))
              }
              className="px-2.5 py-1 text-xs rounded-lg border theme-muted theme-text-muted hover:text-[var(--text-main)] cursor-pointer"
            >
              {paginationMode === 'page' ? 'Page par page' : 'Sourate entière'}
            </button>
          </div>
        </div>
      </div>

      {/* Subtle Instruction Hint */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs theme-text-muted">
        <span>
          Astuce : Touchez un <strong>mot</strong> pour son Tafsir (touchez la carte pour la fermer). Basculez entre <strong>Mushaf Dense</strong> et <strong>Classique</strong> à tout moment.
        </span>
        <span className="font-mono-tabular">
          {currentPageVerses.length} versets ({totalWordsOnPage} mots) · Hizb {matchingHalfHizb.hizbNumber} · Page {pageIndex + 1}/{Math.max(1, pages.length)}
        </span>
      </div>

      {/* THE MUSHAF PAGE ("Comme un vrai Mushaf entre les mains — écriture dense ligne après ligne") */}
      <div className="relative">
        <div
          data-testid="mushaf-book-page"
          className={`theme-surface border-2 theme-border rounded-2xl shadow-sm relative ${
            mushafDensity === 'dense'
              ? 'p-3 sm:p-6 md:p-7'
              : 'p-5 sm:p-10 md:p-12'
          }`}
        >
          {/* Traditional Inner Double-Ruled Mushaf Frame */}
          <div
            className={`border-2 border-[var(--accent-gold)]/45 rounded-xl relative ${
              mushafDensity === 'dense'
                ? 'p-3.5 sm:p-6 md:p-7 space-y-4'
                : 'p-5 sm:p-8 md:p-10 space-y-6'
            }`}
          >
            {/* Top Page Margin Metadata (Like a real printed Madinah Mushaf) */}
            <div className="flex items-center justify-between text-xs theme-text-muted border-b theme-border pb-2.5">
              <span className="font-arabic text-base font-bold text-[var(--text-main)]">
                الجزء {toArabicIndicDigits(currentSurahMeta.juzStart)} · الحزب{' '}
                {toArabicIndicDigits(currentSurahMeta.hizbStart)}
              </span>
              <span className="font-semibold">
                {currentSurahMeta.number}. Sourate {currentSurahMeta.nameFr} ({currentSurahMeta.ayahCount} آيات)
              </span>
              <span className="font-quran text-lg text-[var(--text-main)]">
                سُورَةُ {currentSurahMeta.nameAr}
              </span>
            </div>

            {/* Ornate Surah Header Banner & Bismillah on Page 1 */}
            {pageIndex === 0 && (
              <div className={mushafDensity === 'dense' ? 'space-y-2 text-center py-1' : 'space-y-4 text-center py-2'}>
                <div className="py-1.5 px-6 rounded-lg theme-badge-check1 border border-[var(--accent-gold)]/50 inline-flex items-center gap-4 mx-auto">
                  <span className="font-arabic text-xs opacity-80">
                    آياتها {toArabicIndicDigits(currentSurahMeta.ayahCount)}
                  </span>
                  <span className="font-quran text-xl sm:text-2xl font-bold">
                    سُورَةُ {currentSurahMeta.nameAr}
                  </span>
                  <span className="font-arabic text-xs opacity-80">
                    {currentSurahMeta.revelationType === 'Mecquoise' ? 'مكية' : 'مدنية'}
                  </span>
                </div>

                {selectedSurahNumber !== 1 && selectedSurahNumber !== 9 && (
                  <p
                    className={
                      mushafDensity === 'dense'
                        ? 'font-quran text-xl sm:text-2xl pt-0.5'
                        : 'font-quran text-2xl sm:text-3xl pt-1'
                    }
                  >
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                  </p>
                )}
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="py-20 text-center text-xs theme-text-muted">
                Ouverture de la page du Mushaf...
              </div>
            ) : (
              /* CONTINUOUS INLINE MUSHAF FLOW — Dense authentic 15-line Mushaf feel vs Classic large mode */
              <div
                dir="rtl"
                data-testid="mushaf-continuous-lines"
                className={
                  mushafDensity === 'dense'
                    ? 'font-quran text-[20px] sm:text-[22px] md:text-[24px] leading-[1.98] text-justify [text-align-last:center] tracking-normal select-text'
                    : 'font-quran text-3xl sm:text-4xl md:text-[40px] leading-[2.55] text-justify [text-align-last:center] select-text'
                }
              >
                {currentPageVerses.map((verse) => {
                  const words = verse.textUthmani.trim().split(/\s+/).filter(Boolean);
                  const isVerseSelectedInPopup =
                    popupTarget?.verse.numberInSurah === verse.numberInSurah;
                  const isVerseRevealed = Boolean(revealedVerses[verse.numberInSurah]);

                  return (
                    <span
                      key={verse.numberInSurah}
                      className={`inline rounded-md transition-colors ${
                        isVerseSelectedInPopup
                          ? 'bg-[var(--accent-gold-bg)] ring-1 ring-[var(--accent-gold)] px-0.5'
                          : ''
                      }`}
                    >
                      {words.map((word, wIdx) => {
                        const isWordBlurred =
                          !isVerseRevealed &&
                          (maskMode === 'blur_all' ||
                            (maskMode === 'first_word_only' && wIdx > 0));

                        const isThisWordSelected =
                          isVerseSelectedInPopup && popupTarget?.clickedWordIndex === wIdx;

                        return (
                          <React.Fragment key={`${verse.numberInSurah}-${wIdx}`}>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => handleWordClick(e, verse, word, wIdx)}
                              onDoubleClick={(e) => handleWordDoubleClick(e, verse, word, wIdx)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  handleWordClick(e as any, verse, word, wIdx);
                                }
                              }}
                              className={`inline cursor-pointer rounded px-[1px] transition-all ${
                                isWordBlurred
                                  ? 'blur-[7px] hover:blur-[2px] select-none opacity-65'
                                  : 'hover:bg-[var(--bg-muted)]'
                              } ${
                                isThisWordSelected
                                  ? 'underline decoration-[var(--accent-gold)] decoration-2 font-bold'
                                  : ''
                              }`}
                            >
                              {word}
                            </span>{' '}
                          </React.Fragment>
                        );
                      })}

                      {/* Compact Traditional End-of-Ayah Medallion ﴿١﴾ */}
                      <button
                        type="button"
                        onClick={(e) => handleVerseMedallionClick(e, verse)}
                        title={`Verset ${verse.numberInSurah} — Cliquez pour le Tafsir de ce verset`}
                        className={`inline-flex items-center justify-center mx-1 font-arabic text-[var(--accent-gold)] hover:text-[var(--text-main)] cursor-pointer align-middle ${
                          mushafDensity === 'dense'
                            ? 'text-lg sm:text-xl px-0.5'
                            : 'text-xl sm:text-2xl px-1.5'
                        }`}
                      >
                        ﴿{toArabicIndicDigits(verse.numberInSurah)}﴾
                      </button>{' '}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Bottom Page Number & Flip Controls */}
            <div
              className="pt-4 border-t theme-border flex items-center justify-between gap-4 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={handlePrevPageOrSurah}
                className="px-3.5 py-2 rounded-lg border theme-muted hover:opacity-80 flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Page précédente</span>
              </button>

              <span className="font-mono-tabular font-semibold theme-text-muted">
                Page {pageIndex + 1} / {Math.max(1, pages.length)} · ﴿{toArabicIndicDigits(pageIndex + 1)}﴾
              </span>

              <button
                type="button"
                onClick={handleNextPageOrSurah}
                className="px-3.5 py-2 rounded-lg border theme-muted hover:opacity-80 flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <span>Page suivante</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ULTRA-SIMPLE MOBILE & DESKTOP TAFSIR SHEET: Tapping ANYWHERE on the card or outside closes it immediately */}
        {popupTarget && focusedExplanation && (
          <>
            {/* Full-screen transparent backdrop when open: 1 tap anywhere outside closes immediately */}
            {!isPopupMinimized && (
              <div
                data-testid="mushaf-popup-backdrop"
                onClick={(e) => {
                  e.stopPropagation();
                  setPopupTarget(null);
                }}
                aria-hidden="true"
                className="fixed inset-0 z-40 bg-black/25 cursor-pointer"
              />
            )}

            {isPopupMinimized ? (
              /* MINIMIZED 1-LINE BAR AT BOTTOM */
              <div
                role="dialog"
                aria-label={`Aperçu réduit du verset ${popupTarget.verse.numberInSurah}`}
                data-testid="mushaf-tafsir-minimized"
                onClick={(e) => e.stopPropagation()}
                className="fixed bottom-24 sm:bottom-20 left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-lg theme-surface border-2 border-[var(--accent-gold)] rounded-xl px-3 py-2 shadow-2xl flex items-center justify-between gap-2"
              >
                <button
                  type="button"
                  onClick={() => setIsPopupMinimized(false)}
                  className="flex items-center gap-2 text-left min-w-0 flex-1 cursor-pointer"
                >
                  <span className="px-2 py-0.5 text-[11px] font-mono-tabular font-bold rounded theme-badge-check1 border shrink-0">
                    آية {toArabicIndicDigits(popupTarget.verse.numberInSurah)}
                  </span>
                  {focusedExplanation.clickedWordAr ? (
                    <span className="text-xs truncate">
                      <strong className="font-quran text-base mx-1">
                        {focusedExplanation.clickedWordAr}
                      </strong>
                      : « {focusedExplanation.estimatedWordMeaningFr} »
                    </span>
                  ) : (
                    <span className="text-xs truncate">
                      {focusedExplanation.phraseTranslationFr}
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    data-testid="mushaf-popup-expand"
                    onClick={() => setIsPopupMinimized(false)}
                    className="px-2 py-1 text-xs font-semibold rounded-lg theme-muted border flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Ouvrir</span>
                  </button>
                  <button
                    type="button"
                    aria-label="Fermer l'explication et revenir au Coran"
                    onClick={() => setPopupTarget(null)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg theme-btn-primary flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Fermer</span>
                  </button>
                </div>
              </div>
            ) : (
              /* COMPACT CARD: Touching ANYWHERE on this card (or outside) immediately closes it! */
              <div
                role="dialog"
                aria-label={`Explication du verset ${popupTarget.verse.numberInSurah}`}
                data-testid="mushaf-tafsir-popup"
                onClick={(e) => {
                  e.stopPropagation();
                  setPopupTarget(null);
                }}
                className="fixed bottom-24 sm:bottom-20 left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-lg max-h-[44vh] sm:max-h-[60vh] flex flex-col theme-surface border-2 border-[var(--accent-gold)] rounded-2xl shadow-2xl overflow-hidden cursor-pointer"
              >
                {/* Top Action Bar */}
                <div className="px-3.5 py-2 border-b theme-border flex items-center justify-between gap-2 shrink-0 theme-surface">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="px-2.5 py-1 text-xs font-arabic font-bold rounded-lg theme-badge-check1 border whitespace-nowrap">
                      سورة {currentSurahMeta.nameAr} · آية {toArabicIndicDigits(popupTarget.verse.numberInSurah)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        audioController.playSpecificAyah(
                          selectedSurahNumber,
                          Math.max(0, popupTarget.verse.numberInSurah - 1),
                          verses
                        );
                      }}
                      title="Écouter ce verset"
                      className="px-2 py-1 text-xs font-medium rounded-lg theme-muted border flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Écouter</span>
                    </button>

                    <button
                      type="button"
                      data-testid="mushaf-popup-minimize"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPopupMinimized(true);
                      }}
                      className="px-2 py-1 text-xs font-medium rounded-lg theme-muted border flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Réduire</span>
                    </button>

                    <button
                      type="button"
                      aria-label="Fermer l'explication et revenir au Coran"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPopupTarget(null);
                      }}
                      className="px-3 py-1 text-xs font-bold rounded-lg theme-btn-primary flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      <span>Fermer ✕</span>
                    </button>
                  </div>
                </div>

                {/* Compact Scrollable Body (Tapping anywhere inside also closes immediately!) */}
                <div className="p-3 sm:p-4 space-y-2 overflow-y-auto flex-1">
                  {/* Clicked Word Meaning */}
                  {focusedExplanation.clickedWordAr && focusedExplanation.estimatedWordMeaningFr && (
                    <div className="p-2 rounded-lg theme-badge-check1 border text-xs flex flex-wrap items-center justify-between gap-2">
                      <span className="font-arabic text-sm">
                        معنى الكلمة :{' '}
                        <strong className="font-quran text-lg mx-1">
                          {focusedExplanation.clickedWordAr}
                        </strong>
                      </span>
                      <strong className="text-xs sm:text-sm">
                        « {focusedExplanation.estimatedWordMeaningFr} »
                      </strong>
                    </div>
                  )}

                  {/* Focused Tafsir Al-Muyassar */}
                  <div className="p-2.5 rounded-xl theme-muted border space-y-1">
                    <div className="text-[11px] font-semibold theme-text-muted flex justify-between">
                      <span>Tafsir Al-Muyassar</span>
                      <span className="font-arabic text-sm">التفسير الميسر</span>
                    </div>
                    <p dir="rtl" className="font-arabic text-base sm:text-lg leading-[1.85] text-right">
                      {focusedExplanation.phraseTafsirAr}
                    </p>
                  </div>

                  {/* Concise French Translation */}
                  <p className="text-xs sm:text-sm font-medium leading-snug">
                    {focusedExplanation.phraseTranslationFr}
                  </p>
                </div>

                {/* Full-Width 1-Tap Dismiss Footer */}
                <button
                  type="button"
                  data-testid="mushaf-popup-bottom-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPopupTarget(null);
                  }}
                  className="w-full py-2.5 px-4 border-t theme-border theme-btn-primary text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Fermer (ou toucher n’importe où) · إغلاق التفسير</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
