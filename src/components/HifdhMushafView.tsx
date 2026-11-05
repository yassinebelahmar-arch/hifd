import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Headphones,
  Pause,
  Play,
  Volume2,
  X,
} from 'lucide-react';
import {
  ALL_HALF_HIZBS,
  ALL_SURAHS,
  OFFLINE_SURAH_VERSES,
  SurahMeta,
  VerseDetail,
  getYasserDosariSurahAudioUrl,
} from '../data/quranMetadata';
import { fetchSurahVersesWithTafsir } from '../services/quranApi';
import {
  HifdhState,
  extractFocusedWordAndPhraseExplanation,
  getOrderedJuzNumbers,
  paginateVersesForMushaf,
} from '../utils/hifdhLogic';

interface HifdhMushafViewProps {
  state: HifdhState;
  selectedSurahNumber: number;
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

  // Page-by-page Mushaf navigation
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [paginationMode, setPaginationMode] = useState<'page' | 'full_surah'>('page');

  // Hifdh memorization mask mode
  const [maskMode, setMaskMode] = useState<'none' | 'blur_all' | 'first_word_only'>('none');
  const [revealedVerses, setRevealedVerses] = useState<Record<number, boolean>>({});

  // Continuous Full-Surah Audio (Sheikh Yasser Al-Dosari)
  const [isPlayingSurah, setIsPlayingSurah] = useState<boolean>(false);
  const [autoAdvanceNextSurah, setAutoAdvanceNextSurah] = useState<boolean>(true);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const surahAudioRef = useRef<HTMLAudioElement | null>(null);
  const versePreviewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Focused Word / Phrase Tafsir Popup (Only shown when clicking/double-clicking a word or verse)
  const [popupTarget, setPopupTarget] = useState<SelectedPopupTarget | null>(null);

  const orderedJuzList = useMemo(
    () => getOrderedJuzNumbers(state.schedule.directionOrder),
    [state.schedule.directionOrder]
  );

  const orderedSurahs = useMemo(() => {
    return [...ALL_SURAHS].sort((a, b) => {
      const idxA = orderedJuzList.indexOf(a.juzStart);
      const idxB = orderedJuzList.indexOf(b.juzStart);
      if (idxA !== idxB) return idxA - idxB;
      return a.number - b.number;
    });
  }, [orderedJuzList]);

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
    return paginateVersesForMushaf(verses, 115);
  }, [verses, paginationMode]);

  const currentPageVerses = useMemo(
    () => pages[Math.min(pageIndex, Math.max(0, pages.length - 1))] || [],
    [pages, pageIndex]
  );

  const fullSurahAudioUrl = useMemo(
    () => getYasserDosariSurahAudioUrl(selectedSurahNumber),
    [selectedSurahNumber]
  );

  useEffect(() => {
    const audio = surahAudioRef.current;
    if (!audio) return;

    if (audio.src !== fullSurahAudioUrl) {
      audio.src = fullSurahAudioUrl;
    }

    if (isPlayingSurah) {
      audio.play().catch(() => setIsPlayingSurah(false));
    } else {
      audio.pause();
    }
  }, [fullSurahAudioUrl, isPlayingSurah]);

  const handleSurahAudioEnded = () => {
    if (!autoAdvanceNextSurah) {
      setIsPlayingSurah(false);
      return;
    }
    const currentIdx = orderedSurahs.findIndex((s) => s.number === selectedSurahNumber);
    if (currentIdx >= 0 && currentIdx + 1 < orderedSurahs.length) {
      onSelectSurah(orderedSurahs[currentIdx + 1].number);
      setIsPlayingSurah(true);
    } else {
      setIsPlayingSurah(false);
    }
  };

  const handleNextPageOrSurah = () => {
    setPopupTarget(null);
    if (pageIndex + 1 < pages.length) {
      setPageIndex((p) => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // Move to next surah in user's memorization trajectory
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

    // If user is in Hifdh mask mode and verse is not yet revealed, first click reveals the verse;
    // clicking again (or double-clicking) opens the Tafsir popup!
    if (maskMode !== 'none' && !revealedVerses[verse.numberInSurah]) {
      setRevealedVerses((prev) => ({ ...prev, [verse.numberInSurah]: true }));
      return;
    }

    // Toggle: if clicking the exact same verse/word while popup is already open, close it and return to Mushaf
    if (
      popupTarget &&
      popupTarget.verse.numberInSurah === verse.numberInSurah &&
      popupTarget.clickedWordIndex === wordIdx
    ) {
      setPopupTarget(null);
      return;
    }

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

  const formatAudioTime = (sec: number) => {
    if (!sec || !Number.isFinite(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div
      className="max-w-4xl mx-auto space-y-4 pb-28"
      onClick={() => {
        // Clicking anywhere on the Mushaf background closes the Tafsir popup immediately
        if (popupTarget) setPopupTarget(null);
      }}
    >
      {/* Top Mushaf Control Bar — Compact, Practical, Everything in 1 Row */}
      <div
        className="theme-surface border rounded-xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Surah Selector + Quick Check 1 & Check 2 */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Choisir la sourate dans le Mushaf"
            value={selectedSurahNumber}
            onChange={(e) => onSelectSurah(Number(e.target.value))}
            className="px-3 py-1.5 text-xs sm:text-sm font-bold theme-muted border rounded-lg cursor-pointer focus:outline-none"
          >
            {orderedSurahs.map((s) => (
              <option key={s.number} value={s.number}>
                {s.number}. Sourate {s.nameFr} ({s.nameAr}) — {s.ayahCount} v.
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

        {/* Center: Hifdh Mask Toggle (Lire / Masquer / 1er mot) + Mode Page */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-0.5 p-0.5 theme-muted border rounded-lg text-xs">
            <button
              type="button"
              onClick={() => {
                setMaskMode('none');
                setRevealedVerses({});
              }}
              className={`px-2.5 py-1 rounded-md cursor-pointer flex items-center gap-1 ${
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
              className={`px-2.5 py-1 rounded-md cursor-pointer ${
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
              className={`px-2.5 py-1 rounded-md cursor-pointer flex items-center gap-1 ${
                maskMode === 'blur_all'
                  ? 'theme-surface font-semibold shadow-2xs'
                  : 'theme-text-muted'
              }`}
            >
              <EyeOff className="w-3 h-3" />
              <span>Masquer (Hifdh)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              setPaginationMode((m) => (m === 'page' ? 'full_surah' : 'page'))
            }
            className="px-2.5 py-1.5 text-xs rounded-lg border theme-muted theme-text-muted hover:text-[var(--text-main)] cursor-pointer"
          >
            {paginationMode === 'page' ? 'Page par page' : 'Sourate entière'}
          </button>
        </div>

        {/* Right: 1-Click Continuous Full Surah Audio */}
        <button
          type="button"
          onClick={() => setIsPlayingSurah((p) => !p)}
          className="px-3.5 py-1.5 text-xs font-semibold theme-btn-primary rounded-lg flex items-center gap-1.5 cursor-pointer"
        >
          {isPlayingSurah ? (
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

      {/* Subtle Instruction Hint */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs theme-text-muted">
        <span>
          Astuce : Cliquez (ou double-cliquez) sur n’importe quel <strong>mot</strong> ou <strong>phrase</strong> pour voir son Tafsir. Re-cliquez sur la page pour fermer.
        </span>
        <span>
          Hizb {matchingHalfHizb.hizbNumber} · Page {pageIndex + 1} / {Math.max(1, pages.length)}
        </span>
      </div>

      {/* THE MUSHAF PAGE ("Comme si j'ai le Coran dans mes mains — ligne après ligne en continu") */}
      <div className="relative">
        <div
          data-testid="mushaf-book-page"
          className="theme-surface border-2 theme-border rounded-2xl p-5 sm:p-10 md:p-12 shadow-sm relative"
        >
          {/* Traditional Inner Mushaf Frame */}
          <div className="border theme-border rounded-xl p-5 sm:p-8 md:p-10 space-y-6">
            {/* Top Page Margin Metadata (Like a real printed Mushaf) */}
            <div className="flex items-center justify-between text-xs theme-text-muted border-b theme-border pb-3">
              <span className="font-arabic text-base">
                الجزء {toArabicIndicDigits(currentSurahMeta.juzStart)} · الحزب{' '}
                {toArabicIndicDigits(currentSurahMeta.hizbStart)}
              </span>
              <span className="font-semibold">
                Sourate {currentSurahMeta.nameFr} ({currentSurahMeta.meaningFr})
              </span>
              <span className="font-arabic text-base">
                سورة {currentSurahMeta.nameAr}
              </span>
            </div>

            {/* Ornate Surah Banner & Bismillah on Page 1 */}
            {pageIndex === 0 && (
              <div className="space-y-4 text-center py-2">
                <div className="py-2.5 px-6 rounded-lg theme-muted border inline-block mx-auto">
                  <span className="font-quran text-2xl sm:text-3xl">
                    سُورَةُ {currentSurahMeta.nameAr}
                  </span>
                </div>

                {selectedSurahNumber !== 1 && selectedSurahNumber !== 9 && (
                  <p className="font-quran text-2xl sm:text-3xl pt-1">
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
              /* CONTINUOUS INLINE MUSHAF FLOW — Verse after verse on the same lines */
              <div
                dir="rtl"
                data-testid="mushaf-continuous-lines"
                className="font-quran text-3xl sm:text-4xl md:text-[40px] leading-[2.55] text-justify [text-align-last:center] select-text"
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
                          ? 'bg-[var(--accent-gold-bg)] ring-1 ring-[var(--accent-gold)] px-1'
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
                              className={`inline cursor-pointer rounded px-0.5 transition-all ${
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

                      {/* Traditional End-of-Ayah Medallion ﴿١﴾ */}
                      <button
                        type="button"
                        onClick={(e) => handleVerseMedallionClick(e, verse)}
                        title={`Verset ${verse.numberInSurah} — Cliquez pour le Tafsir de ce verset`}
                        className="inline-flex items-center justify-center mx-1.5 px-1.5 text-xl sm:text-2xl font-arabic theme-text-muted hover:text-[var(--text-main)] cursor-pointer align-middle"
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
              className="pt-6 border-t theme-border flex items-center justify-between gap-4 text-xs"
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
                Page {pageIndex + 1} / {Math.max(1, pages.length)}
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

        {/* FLOATING FOCUSED TAFSIR POPUP (Appears ONLY for the clicked word/phrase; closes on outside click) */}
        {popupTarget && focusedExplanation && (
          <div
            role="dialog"
            aria-label={`Explication du verset ${popupTarget.verse.numberInSurah}`}
            data-testid="mushaf-tafsir-popup"
            onClick={(e) => e.stopPropagation()}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-xl theme-surface border-2 border-[var(--accent-gold)] rounded-2xl p-5 shadow-2xl space-y-3"
          >
            <div className="flex items-start justify-between gap-3 border-b theme-border pb-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-mono-tabular font-bold rounded theme-badge-check1 border">
                  Sourate {currentSurahMeta.nameFr} · Verset {popupTarget.verse.numberInSurah}
                </span>

                {focusedExplanation.clickedWordAr && (
                  <span className="px-2.5 py-0.5 text-sm font-quran rounded theme-muted border">
                    Mot : « {focusedExplanation.clickedWordAr} »
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (versePreviewAudioRef.current) {
                      versePreviewAudioRef.current.src = popupTarget.verse.audioVerseUrl;
                      versePreviewAudioRef.current.play().catch(() => {});
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-md theme-muted border flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Écouter ce verset</span>
                </button>

                <button
                  type="button"
                  aria-label="Fermer l'explication et revenir au Coran"
                  onClick={() => setPopupTarget(null)}
                  className="p-1 rounded-md theme-muted border cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* If a specific word was clicked, highlight its contextual meaning first */}
            {focusedExplanation.clickedWordAr && focusedExplanation.estimatedWordMeaningFr && (
              <div className="p-2.5 rounded-lg theme-badge-check1 border text-xs flex flex-wrap items-center justify-between gap-2">
                <span>
                  Sens en contexte du mot <strong className="font-quran text-base mx-1">{focusedExplanation.clickedWordAr}</strong> :
                </span>
                <strong className="text-sm">« {focusedExplanation.estimatedWordMeaningFr} »</strong>
              </div>
            )}

            {/* Phrase Arabic */}
            <p dir="rtl" className="font-quran text-2xl text-right leading-[2.1]">
              {focusedExplanation.phraseArabic}
            </p>

            {/* Focused Tafsir Al-Muyassar of ONLY this phrase */}
            <div className="p-3.5 rounded-xl theme-muted border space-y-1.5">
              <div className="text-[11px] font-semibold theme-text-muted flex justify-between">
                <span>Explication de cette phrase uniquement</span>
                <span className="font-arabic text-sm">التفسير الميسر</span>
              </div>
              <p dir="rtl" className="font-arabic text-xl leading-[1.95] text-right">
                {focusedExplanation.phraseTafsirAr}
              </p>
            </div>

            {/* French Meaning of ONLY this phrase */}
            <div className="space-y-1 text-xs sm:text-sm">
              <p className="font-medium leading-relaxed">
                {focusedExplanation.phraseTranslationFr}
              </p>
              <p className="text-xs theme-text-muted">
                {focusedExplanation.phraseKeyTakeawayFr}
              </p>
            </div>

            <div className="pt-1 text-[11px] theme-text-muted text-center">
              Cliquez n’importe où sur la page du Coran pour fermer cette fenêtre et continuer votre lecture.
            </div>
          </div>
        )}
      </div>

      {/* Hidden Audio Elements */}
      <audio
        ref={surahAudioRef}
        onEnded={handleSurahAudioEnded}
        onTimeUpdate={() => {
          if (surahAudioRef.current) {
            setAudioCurrentTime(surahAudioRef.current.currentTime);
            setAudioDuration(surahAudioRef.current.duration || 0);
          }
        }}
        onLoadedMetadata={() => {
          if (surahAudioRef.current) {
            setAudioDuration(surahAudioRef.current.duration || 0);
          }
        }}
        preload="auto"
        className="hidden"
      />
      <audio ref={versePreviewAudioRef} preload="none" className="hidden" />

      {/* Continuous Full-Surah Bottom Audio Bar */}
      <div
        role="region"
        aria-label="Écoute continue de la sourate"
        onClick={(e) => e.stopPropagation()}
        className="fixed bottom-0 left-0 right-0 z-40 theme-surface border-t px-4 py-2.5"
      >
        <div className="max-w-4xl mx-auto flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[11px] font-mono-tabular theme-text-muted">
            <span>{formatAudioTime(audioCurrentTime)}</span>
            <input
              type="range"
              aria-label="Progression de la sourate"
              min={0}
              max={audioDuration > 0 ? audioDuration : 100}
              step={0.5}
              value={audioCurrentTime}
              onChange={(e) => {
                const nextTime = Number(e.target.value);
                setAudioCurrentTime(nextTime);
                if (surahAudioRef.current) surahAudioRef.current.currentTime = nextTime;
              }}
              className="flex-1 h-1 rounded-lg appearance-none cursor-pointer theme-muted accent-[var(--accent-primary)]"
            />
            <span>{formatAudioTime(audioDuration)}</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold">
                Sourate {currentSurahMeta.nameFr} ({currentSurahMeta.nameAr})
              </span>
              <span className="theme-text-muted hidden sm:inline">
                · Récitation complète en continu (Cheikh Yasser Al-Dosari)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlayingSurah((p) => !p)}
                className="px-4 py-1.5 text-xs font-semibold theme-btn-primary rounded-md flex items-center gap-1.5 cursor-pointer"
              >
                {isPlayingSurah ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlayingSurah ? 'Pause' : 'Écouter toute la Sourate'}</span>
              </button>

              <button
                type="button"
                onClick={() => setAutoAdvanceNextSurah((a) => !a)}
                className={`px-2.5 py-1.5 text-xs rounded-md border cursor-pointer ${
                  autoAdvanceNextSurah
                    ? 'theme-badge-check2 font-semibold'
                    : 'theme-muted theme-text-muted'
                }`}
              >
                {autoAdvanceNextSurah ? 'Enchaîner sourates ✓' : 'Enchaîner sourates'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
