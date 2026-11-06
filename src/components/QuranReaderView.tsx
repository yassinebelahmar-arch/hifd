import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  Check,
  Eye,
  EyeOff,
  Headphones,
  Mic,
  Pause,
  Play,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
} from 'lucide-react';
import {
  ALL_HALF_HIZBS,
  ALL_SURAHS,
  SurahMeta,
  VerseDetail,
  getYasserDosariSurahAudioUrl,
} from '../data/quranMetadata';
import { fetchSurahVersesWithTafsir } from '../services/quranApi';
import {
  HifdhState,
  buildSurahQuizPrompt,
  computeNextVersePlaybackState,
  getArabicFirstWordsHint,
} from '../utils/hifdhLogic';

interface QuranReaderViewProps {
  state: HifdhState;
  selectedSurahNumber: number;
  initialSubTab?: 'mushaf' | 'tafsir' | 'quiz';
  onSelectSurah: (surahNumber: number) => void;
  onToggleSurahCheck1: (surahNumber: number) => void;
  onToggleSurahCheck2: (surahNumber: number) => void;
  onToggleHalfHizbCheck1: (id: number) => void;
  onToggleHalfHizbCheck2: (id: number) => void;
  onToggleFlaggedVerse: (surahNumber: number, ayahNumber: number) => void;
}

export const QuranReaderView: React.FC<QuranReaderViewProps> = ({
  state,
  selectedSurahNumber,
  initialSubTab = 'mushaf',
  onSelectSurah,
  onToggleHalfHizbCheck1,
  onToggleHalfHizbCheck2,
  onToggleFlaggedVerse,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'mushaf' | 'tafsir' | 'quiz'>(initialSubTab);
  const [verses, setVerses] = useState<VerseDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [surahSearch, setSurahSearch] = useState<string>('');
  const [selectedJuzFilter, setSelectedJuzFilter] = useState<number | 'all'>('all');

  // Hifdh memory helper modes
  const [hifdhVisibilityMode, setHifdhVisibilityMode] = useState<'full' | 'first_words' | 'hidden'>('full');
  const [revealedVerses, setRevealedVerses] = useState<Record<number, boolean>>({});
  const [showFrenchUnderMushaf, setShowFrenchUnderMushaf] = useState<boolean>(true);
  const [inlineTafsirAyah, setInlineTafsirAyah] = useState<number | null>(null);
  const [onlyFlaggedFilter, setOnlyFlaggedFilter] = useState<boolean>(false);

  // Audio Player State (Sheikh Yasser Al-Dosari)
  const [audioMode, setAudioMode] = useState<'ayah' | 'surah'>('ayah');
  const [currentAyahIndex, setCurrentAyahIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<1 | 3 | 5 | 0>(1);
  const [currentRepeatIteration, setCurrentRepeatIteration] = useState<number>(1);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(1);
  const [loopRange, setLoopRange] = useState<boolean>(false);
  const [showRangeControls, setShowRangeControls] = useState<boolean>(false);

  // Echo Mode (Wait 4s after each verse so user can repeat aloud)
  const [echoPauseMode, setEchoPauseMode] = useState<boolean>(false);
  const [isEchoWaiting, setIsEchoWaiting] = useState<boolean>(false);
  const echoTimeoutRef = useRef<number | null>(null);

  // Audio timeline state
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  // Quiz & Voice Comparator state
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [quizRevealed, setQuizRevealed] = useState<boolean>(false);
  const [isRecordingMic, setIsRecordingMic] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setIsPlaying(false);
    setIsEchoWaiting(false);
    setCurrentAyahIndex(0);
    setCurrentRepeatIteration(1);
    setRevealedVerses({});
    setInlineTafsirAyah(null);
    setOnlyFlaggedFilter(false);

    fetchSurahVersesWithTafsir(selectedSurahNumber).then((res) => {
      if (!mounted) return;
      setVerses(res.verses);
      setRangeStart(1);
      setRangeEnd(res.verses.length || 1);
      setQuizIndex(0);
      setQuizRevealed(false);
      setLoading(false);
    });

    return () => {
      mounted = false;
      if (echoTimeoutRef.current) window.clearTimeout(echoTimeoutRef.current);
    };
  }, [selectedSurahNumber]);

  const currentSurahMeta: SurahMeta = useMemo(
    () => ALL_SURAHS.find((s) => s.number === selectedSurahNumber) || ALL_SURAHS[66],
    [selectedSurahNumber]
  );

  const orderedJuzList = useMemo(
    () => Array.from({ length: 30 }, (_, i) => i + 1),
    []
  );

  const filteredSurahs = useMemo(() => {
    const ordered = [...ALL_SURAHS].sort((a, b) => a.number - b.number);

    return ordered.filter((s) => {
      if (selectedJuzFilter !== 'all' && s.juzStart !== selectedJuzFilter) return false;
      if (!surahSearch.trim()) return true;
      const q = surahSearch.toLowerCase().trim();
      return (
        s.nameFr.toLowerCase().includes(q) ||
        s.meaningFr.toLowerCase().includes(q) ||
        s.nameAr.includes(q) ||
        String(s.number) === q
      );
    });
  }, [selectedJuzFilter, surahSearch]);

  const currentVerse: VerseDetail | undefined = verses[currentAyahIndex];

  const activeAudioSrc = useMemo(() => {
    if (audioMode === 'surah') {
      return getYasserDosariSurahAudioUrl(selectedSurahNumber);
    }
    return currentVerse?.audioVerseUrl || '';
  }, [audioMode, selectedSurahNumber, currentVerse]);

  // Gapless preloading of verse N+1
  useEffect(() => {
    if (audioMode !== 'ayah' || verses.length === 0) return;
    const nextIdx = currentAyahIndex + 1;
    if (nextIdx < verses.length && preloadAudioRef.current) {
      const nextUrl = verses[nextIdx]?.audioVerseUrl;
      if (nextUrl && preloadAudioRef.current.src !== nextUrl) {
        preloadAudioRef.current.src = nextUrl;
        preloadAudioRef.current.load();
      }
    }
  }, [audioMode, currentAyahIndex, verses]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeAudioSrc) return;

    if (audio.src !== activeAudioSrc) {
      audio.src = activeAudioSrc;
      audio.playbackRate = playbackRate;
    }

    if (isPlaying && !isEchoWaiting) {
      audio.playbackRate = playbackRate;
      audio.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [activeAudioSrc, isPlaying, isEchoWaiting, playbackRate]);

  const advanceToNextStep = () => {
    const activeVerseNum = (currentVerse?.numberInSurah ?? currentAyahIndex + 1);
    const nextState = computeNextVersePlaybackState({
      activeVerse: activeVerseNum,
      currentIteration: currentRepeatIteration,
      repeatTarget: repeatMode,
      rangeStart,
      rangeEnd,
      loopRange,
    });

    if (nextState.shouldReplaySameVerse && nextState.shouldContinuePlaying && audioRef.current) {
      setCurrentRepeatIteration(nextState.nextIteration);
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      setCurrentAyahIndex(Math.max(0, nextState.nextVerse - 1));
      setCurrentRepeatIteration(nextState.nextIteration);
      setIsPlaying(nextState.shouldContinuePlaying);
    }
  };

  const handleAudioEnded = () => {
    if (audioMode === 'surah') {
      setIsPlaying(false);
      return;
    }

    if (echoPauseMode) {
      setIsEchoWaiting(true);
      if (echoTimeoutRef.current) window.clearTimeout(echoTimeoutRef.current);
      echoTimeoutRef.current = window.setTimeout(() => {
        setIsEchoWaiting(false);
        advanceToNextStep();
      }, 4000);
      return;
    }

    advanceToNextStep();
  };

  const playSpecificAyah = (index: number) => {
    if (echoTimeoutRef.current) window.clearTimeout(echoTimeoutRef.current);
    setIsEchoWaiting(false);
    setAudioMode('ayah');
    setCurrentAyahIndex(index);
    setCurrentRepeatIteration(1);
    setIsPlaying(true);
  };

  const toggleRevealAyah = (ayahNum: number) => {
    setRevealedVerses((prev) => ({
      ...prev,
      [ayahNum]: !prev[ayahNum],
    }));
  };

  const handleStartVoiceRecording = async () => {
    setMicError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError('Microphone non disponible sur ce navigateur.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingMic(true);
    } catch {
      setMicError('Autorisez le microphone pour enregistrer votre récitation.');
    }
  };

  const handleStopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecordingMic) {
      mediaRecorderRef.current.stop();
      setIsRecordingMic(false);
    }
  };

  const matchingHalfHizb =
    ALL_HALF_HIZBS.find(
      (h) => selectedSurahNumber >= h.startSurah && selectedSurahNumber <= h.endSurah
    ) || ALL_HALF_HIZBS[112];
  const halfHizbProg = state.halfHizbProgress[matchingHalfHizb.id];

  const flaggedInCurrentSurah = useMemo(
    () =>
      verses.filter((v) =>
        Boolean(state.flaggedVerses?.[`${selectedSurahNumber}:${v.numberInSurah}`])
      ),
    [verses, state.flaggedVerses, selectedSurahNumber]
  );

  const displayedVerses = useMemo(() => {
    if (onlyFlaggedFilter) return flaggedInCurrentSurah;
    return verses;
  }, [onlyFlaggedFilter, flaggedInCurrentSurah, verses]);

  const quizPrompt = useMemo(
    () => buildSurahQuizPrompt(verses, quizIndex),
    [verses, quizIndex]
  );

  const formatAudioTime = (sec: number) => {
    if (!sec || !Number.isFinite(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-28">
      {/* Left Sidebar (3 Cols on desktop): Clean, Compact Surah Navigator */}
      <aside className="lg:col-span-3 space-y-3">
        <div className="theme-surface border rounded-xl p-3.5 space-y-3">
          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1">
            {[
              { num: 67, label: '67. Al-Mulk' },
              { num: 78, label: '78. An-Naba' },
              { num: 87, label: "87. Al-A'la" },
              { num: 1, label: '1. Al-Fatiha' },
            ].map((q) => (
              <button
                key={q.num}
                type="button"
                onClick={() => onSelectSurah(q.num)}
                className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors cursor-pointer ${
                  selectedSurahNumber === q.num
                    ? 'theme-btn-primary border-transparent font-semibold'
                    : 'theme-muted theme-text-muted hover:text-[var(--text-main)]'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Search & Juz Filter */}
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 theme-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={surahSearch}
                onChange={(e) => setSurahSearch(e.target.value)}
                placeholder="Sourate..."
                aria-label="Rechercher une sourate"
                className="w-full pl-8 pr-2.5 py-1.5 text-xs theme-muted border rounded-md focus:outline-none"
              />
            </div>

            <select
              aria-label="Filtrer par Juz"
              value={selectedJuzFilter}
              onChange={(e) =>
                setSelectedJuzFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="px-2 py-1.5 text-xs theme-muted border rounded-md focus:outline-none"
            >
              <option value="all">Juz 30→1</option>
              {orderedJuzList.map((j) => (
                <option key={j} value={j}>
                  Juz {j}
                </option>
              ))}
            </select>
          </div>

          {/* Scrollable Surah List */}
          <div className="max-h-[480px] overflow-y-auto divide-y theme-border pr-0.5">
            {filteredSurahs.map((s) => {
              const sp = state.surahProgress[s.number];
              const isSelected = s.number === selectedSurahNumber;
              const c1 = Boolean(sp?.check1Memorized);
              const c2 = Boolean(sp?.check2Revised);

              return (
                <button
                  key={s.number}
                  type="button"
                  onClick={() => onSelectSurah(s.number)}
                  className={`w-full text-left py-2 px-2.5 flex items-center justify-between gap-2 transition-colors cursor-pointer rounded-md ${
                    isSelected ? 'theme-muted font-semibold' : 'hover:bg-[var(--bg-muted)]/60'
                  }`}
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="font-mono-tabular text-[11px] theme-text-muted w-6 shrink-0">
                      {s.number}.
                    </span>
                    <div className="truncate">
                      <span className="text-xs">{s.nameFr}</span>
                      <span className="text-[11px] theme-text-muted ml-1.5">J{s.juzStart}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {c2 ? (
                      <span className="w-2 h-2 rounded-full bg-[var(--accent-done)]" title="2ème Check validé" />
                    ) : c1 ? (
                      <span className="w-2 h-2 rounded-full bg-[var(--accent-gold)]" title="1er Check mémorisé" />
                    ) : null}
                    <span className="font-arabic text-sm theme-text-muted">{s.nameAr}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main Content Area (9 Cols on desktop): Focused Mushaf & Study Workspace */}
      <div className="lg:col-span-9 space-y-4">
        {/* Compact Single Header Bar — Zero Duplication */}
        <div className="theme-surface border rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {currentSurahMeta.number}. Sourate {currentSurahMeta.nameFr}
              </h1>
              <span className="font-quran text-2xl theme-text-muted">
                سورة {currentSurahMeta.nameAr}
              </span>
              <span className="text-xs theme-text-muted">
                Juz {currentSurahMeta.juzStart} · Hizb {currentSurahMeta.hizbStart} · {currentSurahMeta.ayahCount} versets
              </span>
            </div>

            {/* Compact Check 1 / Check 2 & Audio Trigger on a single clean row */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => onToggleHalfHizbCheck1(matchingHalfHizb.id)}
                aria-pressed={Boolean(halfHizbProg?.check1Memorized)}
                title={`Valider le 1er Check pour ${matchingHalfHizb.labelFr}`}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md border flex items-center gap-1.5 cursor-pointer transition-colors ${
                  halfHizbProg?.check1Memorized
                    ? 'theme-badge-check1 font-semibold'
                    : 'theme-muted theme-text-muted hover:text-[var(--text-main)]'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>1er Check (0,5 Hizb)</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleHalfHizbCheck2(matchingHalfHizb.id)}
                aria-pressed={Boolean(halfHizbProg?.check2Revised)}
                title={`Valider le 2ème Check (Consolidé) pour ${matchingHalfHizb.labelFr}`}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md border flex items-center gap-1.5 cursor-pointer transition-colors ${
                  halfHizbProg?.check2Revised
                    ? 'theme-badge-check2 font-semibold'
                    : 'theme-muted theme-text-muted hover:text-[var(--text-main)]'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>2ème Check (Consolidé)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (audioMode === 'surah' && isPlaying) {
                    setIsPlaying(false);
                  } else {
                    setAudioMode('surah');
                    setIsPlaying(true);
                  }
                }}
                className="px-3 py-1.5 text-xs font-semibold theme-btn-primary rounded-md flex items-center gap-1.5 cursor-pointer"
              >
                {audioMode === 'surah' && isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Headphones className="w-3.5 h-3.5" />
                    <span>Écouter Sourate</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Clean Toolbar: Mode Tabs + Hifdh Masking + Options */}
          <div className="pt-3 border-t theme-border flex flex-wrap items-center justify-between gap-2">
            <div
              role="tablist"
              aria-label="Mode d'étude"
              className="flex items-center gap-1 p-0.5 theme-muted border rounded-lg"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeSubTab === 'mushaf'}
                onClick={() => setActiveSubTab('mushaf')}
                className={`px-3 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                  activeSubTab === 'mushaf'
                    ? 'theme-surface font-semibold shadow-2xs'
                    : 'theme-text-muted hover:text-[var(--text-main)]'
                }`}
              >
                Mushaf &amp; Écoute
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeSubTab === 'tafsir'}
                onClick={() => setActiveSubTab('tafsir')}
                className={`px-3 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                  activeSubTab === 'tafsir'
                    ? 'theme-surface font-semibold shadow-2xs'
                    : 'theme-text-muted hover:text-[var(--text-main)]'
                }`}
              >
                Tafsir Al-Muyassar
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeSubTab === 'quiz'}
                onClick={() => setActiveSubTab('quiz')}
                className={`px-3 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                  activeSubTab === 'quiz'
                    ? 'theme-surface font-semibold shadow-2xs'
                    : 'theme-text-muted hover:text-[var(--text-main)]'
                }`}
              >
                Auto-Test &amp; Voix {flaggedInCurrentSurah.length > 0 ? `(${flaggedInCurrentSurah.length})` : ''}
              </button>
            </div>

            {activeSubTab === 'mushaf' && (
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center gap-0.5 p-0.5 theme-muted border rounded-lg text-xs">
                  {[
                    { id: 'full', label: 'Texte' },
                    { id: 'first_words', label: '1ers mots' },
                    { id: 'hidden', label: 'Masqué' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setHifdhVisibilityMode(m.id as any);
                        setRevealedVerses({});
                      }}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        hifdhVisibilityMode === m.id
                          ? 'theme-surface font-semibold shadow-2xs'
                          : 'theme-text-muted'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowFrenchUnderMushaf((prev) => !prev)}
                  className={`px-2.5 py-1 text-xs rounded-md border cursor-pointer ${
                    showFrenchUnderMushaf ? 'theme-surface font-medium' : 'theme-muted theme-text-muted'
                  }`}
                >
                  FR
                </button>

                <button
                  type="button"
                  onClick={() => setEchoPauseMode((e) => !e)}
                  title="Pause automatique de 4 secondes après chaque verset pour répéter après le Cheikh"
                  className={`px-2.5 py-1 text-xs rounded-md border cursor-pointer ${
                    echoPauseMode ? 'theme-badge-check1 font-semibold' : 'theme-muted theme-text-muted'
                  }`}
                >
                  {echoPauseMode ? 'Écho 4s ✓' : 'Mode Écho'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowRangeControls((r) => !r)}
                  className={`px-2.5 py-1 text-xs rounded-md border cursor-pointer ${
                    loopRange || showRangeControls
                      ? 'theme-surface font-semibold'
                      : 'theme-muted theme-text-muted'
                  }`}
                >
                  Plage {rangeStart}–{rangeEnd}
                </button>
              </div>
            )}
          </div>

          {/* Collapsible Verse Range Bar */}
          {showRangeControls && (
            <div className="pt-2.5 border-t theme-border flex flex-wrap items-center gap-3 text-xs">
              <span className="theme-text-muted">Boucler du verset</span>
              <input
                type="number"
                min={1}
                max={verses.length || 1}
                value={rangeStart}
                onChange={(e) => setRangeStart(Math.max(1, Number(e.target.value)))}
                className="w-14 px-2 py-1 font-mono-tabular theme-muted border rounded text-center"
              />
              <span className="theme-text-muted">au</span>
              <input
                type="number"
                min={rangeStart}
                max={verses.length || 1}
                value={rangeEnd}
                onChange={(e) => setRangeEnd(Math.max(rangeStart, Number(e.target.value)))}
                className="w-14 px-2 py-1 font-mono-tabular theme-muted border rounded text-center"
              />
              <button
                type="button"
                onClick={() => setLoopRange((l) => !l)}
                className={`px-3 py-1 rounded border cursor-pointer ${
                  loopRange ? 'theme-badge-check2 font-semibold' : 'theme-muted'
                }`}
              >
                {loopRange ? 'Boucle active ✓' : 'Activer la boucle'}
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="theme-surface border rounded-xl p-12 text-center">
            <p className="text-xs theme-text-muted">Chargement des versets...</p>
          </div>
        )}

        {/* SUB-TAB 1: CLEAN MUSHAF PAGE */}
        {!loading && activeSubTab === 'mushaf' && (
          <div className="theme-surface border rounded-xl p-5 sm:p-8">
            {selectedSurahNumber !== 1 && selectedSurahNumber !== 9 && (
              <div className="text-center pb-6 mb-6 border-b theme-border">
                <p className="font-quran text-2xl sm:text-3xl">
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                </p>
              </div>
            )}

            <div className="divide-y theme-border">
              {displayedVerses.map((v) => {
                const actualIdx = verses.findIndex((item) => item.numberInSurah === v.numberInSurah);
                const isCurrentAyah = audioMode === 'ayah' && currentAyahIndex === actualIdx;
                const isRevealed = Boolean(revealedVerses[v.numberInSurah]);
                const effectiveMode = isRevealed ? 'full' : hifdhVisibilityMode;
                const isFlagged = Boolean(
                  state.flaggedVerses?.[`${selectedSurahNumber}:${v.numberInSurah}`]
                );
                const isTafsirOpen = inlineTafsirAyah === v.numberInSurah;

                return (
                  <article
                    key={v.numberInSurah}
                    className={`py-6 transition-colors ${
                      isCurrentAyah ? 'bg-[var(--bg-muted)]/60 -mx-4 px-4 rounded-lg' : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      {/* Left Minimal Action Rail */}
                      <div className="flex sm:flex-col items-center sm:items-start gap-2 shrink-0">
                        <span className="font-mono-tabular text-xs font-semibold theme-text-muted px-2 py-0.5 rounded theme-muted border">
                          {selectedSurahNumber}:{v.numberInSurah}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (isCurrentAyah && isPlaying) {
                                setIsPlaying(false);
                              } else {
                                playSpecificAyah(actualIdx);
                              }
                            }}
                            title="Écouter ce verset (Yasser Al-Dosari)"
                            className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
                              isCurrentAyah && isPlaying
                                ? 'theme-btn-primary border-transparent'
                                : 'theme-muted theme-text-muted hover:text-[var(--text-main)]'
                            }`}
                          >
                            {isCurrentAyah && isPlaying ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setInlineTafsirAyah(isTafsirOpen ? null : v.numberInSurah)
                            }
                            title="Afficher le Tafsir Al-Muyassar sous ce verset"
                            className={`px-2 py-1 text-[11px] rounded-md border transition-colors cursor-pointer ${
                              isTafsirOpen
                                ? 'theme-badge-check1 font-semibold'
                                : 'theme-muted theme-text-muted hover:text-[var(--text-main)]'
                            }`}
                          >
                            Tafsir
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onToggleFlaggedVerse(selectedSurahNumber, v.numberInSurah)
                            }
                            title="Marquer une hésitation sur ce verset"
                            className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
                              isFlagged
                                ? 'theme-badge-check1'
                                : 'theme-muted theme-text-muted hover:text-[var(--text-main)]'
                            }`}
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>

                          {hifdhVisibilityMode !== 'full' && (
                            <button
                              type="button"
                              onClick={() => toggleRevealAyah(v.numberInSurah)}
                              title="Révéler ou masquer le verset"
                              className="p-1.5 rounded-md border theme-muted theme-text-muted hover:text-[var(--text-main)] cursor-pointer"
                            >
                              {isRevealed ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Right Arabic Verse & Optional French / Inline Tafsir */}
                      <div className="flex-1 space-y-3 min-w-0">
                        <div dir="rtl" className="text-right">
                          {effectiveMode === 'full' && (
                            <p className="font-quran text-3xl sm:text-4xl leading-[2.35] select-text">
                              {v.textUthmani}{' '}
                              <span className="inline-flex items-center justify-center w-7 h-7 text-xs font-mono-tabular rounded-full border theme-border theme-text-muted mx-1 align-middle">
                                {v.numberInSurah}
                              </span>
                            </p>
                          )}

                          {effectiveMode === 'first_words' && (
                            <div
                              onClick={() => toggleRevealAyah(v.numberInSurah)}
                              className="p-4 rounded-lg theme-muted border cursor-pointer"
                            >
                              <p className="font-quran text-3xl sm:text-4xl leading-[2.35]">
                                {getArabicFirstWordsHint(v.textUthmani, 2)}
                              </p>
                              <p className="text-xs theme-text-muted mt-1 font-sans">
                                Cliquez pour vérifier la suite du verset
                              </p>
                            </div>
                          )}

                          {effectiveMode === 'hidden' && (
                            <div
                              onClick={() => toggleRevealAyah(v.numberInSurah)}
                              className="p-5 rounded-lg border border-dashed theme-border text-center cursor-pointer hover:bg-[var(--bg-muted)]/50"
                            >
                              <p className="text-xs theme-text-muted font-sans">
                                Verset {v.numberInSurah} masqué — récitez puis cliquez pour vérifier
                              </p>
                            </div>
                          )}
                        </div>

                        {isCurrentAyah && isEchoWaiting && (
                          <div className="px-3 py-1.5 rounded-md theme-badge-check1 border text-xs font-medium">
                            À votre tour : répétez le verset à voix haute (4s)...
                          </div>
                        )}

                        {showFrenchUnderMushaf && effectiveMode === 'full' && (
                          <p className="text-sm theme-text-muted leading-relaxed">
                            {v.translationFr}
                          </p>
                        )}

                        {/* Inline Expandable Tafsir Al-Muyassar */}
                        {isTafsirOpen && (
                          <div className="mt-3 p-4 rounded-lg theme-muted border space-y-2">
                            <div className="flex items-center justify-between text-xs theme-text-muted">
                              <span className="font-semibold text-[var(--text-main)]">
                                التفسير الميسر · Tafsir Al-Muyassar
                              </span>
                              <span>Verset {selectedSurahNumber}:{v.numberInSurah}</span>
                            </div>
                            <p
                              dir="rtl"
                              className="font-arabic text-xl sm:text-2xl leading-[2.0] text-right"
                            >
                              {v.tafsirMuyassarAr}
                            </p>
                            <p className="text-xs theme-text-muted pt-1 border-t theme-border">
                              {v.conciseExplanationFr}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* SUB-TAB 2: DEDICATED TAFSIR AL-MUYASSAR VIEW */}
        {!loading && activeSubTab === 'tafsir' && (
          <div className="theme-surface border rounded-xl p-5 sm:p-8 divide-y theme-border">
            {verses.map((v, idx) => (
              <article key={v.numberInSurah} className="py-6 first:pt-0 last:pb-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono-tabular text-xs font-semibold theme-text-muted px-2 py-0.5 rounded theme-muted border">
                    {selectedSurahNumber}:{v.numberInSurah}
                  </span>
                  <button
                    type="button"
                    onClick={() => playSpecificAyah(idx)}
                    className="px-2.5 py-1 text-xs rounded-md theme-muted border cursor-pointer flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3" />
                    <span>Écouter</span>
                  </button>
                </div>

                <p dir="rtl" className="font-quran text-2xl sm:text-3xl leading-[2.25] text-right">
                  {v.textUthmani}
                </p>

                <div className="p-4 rounded-lg theme-muted border space-y-2">
                  <div className="text-xs font-semibold theme-text-muted text-right" dir="rtl">
                    التفسير الميسر :
                  </div>
                  <p dir="rtl" className="font-arabic text-xl sm:text-2xl leading-[2.0] text-right">
                    {v.tafsirMuyassarAr}
                  </p>
                </div>

                <p className="text-xs sm:text-sm theme-text-muted leading-relaxed">
                  {v.translationFr}
                </p>
              </article>
            ))}
          </div>
        )}

        {/* SUB-TAB 3: AUTO-TEST & VOICE COMPARATOR */}
        {!loading && activeSubTab === 'quiz' && (
          <div className="space-y-4">
            <section className="theme-surface border rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold">
                  Comparateur Vocal — Verset {selectedSurahNumber}:{currentVerse?.numberInSurah || 1}
                </h2>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => playSpecificAyah(Math.max(0, currentAyahIndex - 1))}
                    className="px-2.5 py-1 text-xs rounded border theme-muted cursor-pointer"
                  >
                    ← Préc.
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      playSpecificAyah(Math.min(verses.length - 1, currentAyahIndex + 1))
                    }
                    className="px-2.5 py-1 text-xs rounded border theme-muted cursor-pointer"
                  >
                    Suiv. →
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-lg theme-muted border">
                <p dir="rtl" className="font-quran text-2xl sm:text-3xl text-right leading-[2.25]">
                  {currentVerse?.textUthmani}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => playSpecificAyah(currentAyahIndex)}
                  className="px-3.5 py-2 text-xs font-semibold theme-btn-primary rounded-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>1. Écouter le Cheikh</span>
                </button>

                {!isRecordingMic ? (
                  <button
                    type="button"
                    onClick={handleStartVoiceRecording}
                    className="px-3.5 py-2 text-xs font-semibold rounded-md border theme-surface hover:bg-[var(--bg-muted)] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>2. Enregistrer ma voix</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopVoiceRecording}
                    className="px-3.5 py-2 text-xs font-semibold rounded-md theme-badge-check1 border flex items-center gap-1.5 cursor-pointer animate-pulse"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Arrêter l’enregistrement</span>
                  </button>
                )}

                {recordedAudioUrl && (
                  <audio controls src={recordedAudioUrl} className="h-8 max-w-[220px]" />
                )}
              </div>

              {micError && <p className="text-xs theme-text-muted">{micError}</p>}
            </section>

            {/* Continuation Quiz */}
            {quizPrompt && (
              <section className="theme-surface border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-bold">
                    Test d’enchaînement — Que vient-il après le verset {quizPrompt.promptVerse.numberInSurah} ?
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      const randomSeed = Math.floor(Math.random() * Math.max(1, verses.length - 1));
                      setQuizIndex(randomSeed);
                      setQuizRevealed(false);
                    }}
                    className="px-2.5 py-1 text-xs rounded border theme-muted flex items-center gap-1 cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Autre verset</span>
                  </button>
                </div>

                <div className="p-4 rounded-lg theme-muted border">
                  <p dir="rtl" className="font-quran text-2xl sm:text-3xl text-right leading-[2.25]">
                    {quizPrompt.promptVerse.textUthmani}
                  </p>
                </div>

                {!quizRevealed ? (
                  <button
                    type="button"
                    onClick={() => setQuizRevealed(true)}
                    className="w-full py-3 rounded-lg border border-dashed theme-border text-xs font-semibold cursor-pointer hover:bg-[var(--bg-muted)]"
                  >
                    Révéler les versets suivants ({quizPrompt.expectedNextVerses.map((v) => v.numberInSurah).join(', ')})
                  </button>
                ) : (
                  <div className="space-y-2">
                    {quizPrompt.expectedNextVerses.map((cv) => (
                      <div key={cv.numberInSurah} className="p-4 rounded-lg theme-badge-check2 border">
                        <div className="text-xs font-mono-tabular mb-1">
                          Verset {cv.numberInSurah}
                        </div>
                        <p dir="rtl" className="font-quran text-2xl sm:text-3xl text-right leading-[2.25]">
                          {cv.textUthmani}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>

      {/* Hidden Audio Elements */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setAudioCurrentTime(audioRef.current.currentTime);
            setAudioDuration(audioRef.current.duration || 0);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setAudioDuration(audioRef.current.duration || 0);
          }
        }}
        preload="auto"
        className="hidden"
      />
      <audio ref={preloadAudioRef} preload="auto" className="hidden" />

      {/* Clean, Minimal Bottom Audio Player Bar */}
      <div
        role="region"
        aria-label="Lecteur audio Cheikh Yasser Al-Dosari"
        className="fixed bottom-0 left-0 right-0 z-40 theme-surface border-t px-4 py-2"
      >
        <div className="max-w-6xl mx-auto flex flex-col gap-1.5">
          {/* Scrubber */}
          <div className="flex items-center gap-2 text-[11px] font-mono-tabular theme-text-muted">
            <span>{formatAudioTime(audioCurrentTime)}</span>
            <input
              type="range"
              aria-label="Position de lecture audio"
              min={0}
              max={audioDuration > 0 ? audioDuration : 100}
              step={0.1}
              value={audioCurrentTime}
              onChange={(e) => {
                const nextTime = Number(e.target.value);
                setAudioCurrentTime(nextTime);
                if (audioRef.current) audioRef.current.currentTime = nextTime;
              }}
              className="flex-1 h-1 rounded-lg appearance-none cursor-pointer theme-muted accent-[var(--accent-primary)]"
            />
            <span>{formatAudioTime(audioDuration)}</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Track Info */}
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xs font-semibold truncate">
                {currentSurahMeta.nameFr} ·{' '}
                {audioMode === 'surah'
                  ? 'Sourate complète'
                  : `Verset ${currentVerse?.numberInSurah || 1}/${verses.length}`}
              </span>
              <span className="text-xs theme-text-muted hidden sm:inline">
                (Yasser Al-Dosari)
              </span>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Verset précédent"
                onClick={() => {
                  setAudioMode('ayah');
                  setCurrentAyahIndex((prev) => Math.max(0, prev - 1));
                  setCurrentRepeatIteration(1);
                }}
                className="p-1.5 rounded border theme-muted cursor-pointer"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsPlaying((prev) => !prev)}
                className="px-3.5 py-1.5 text-xs font-semibold theme-btn-primary rounded-md flex items-center gap-1.5 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Lecture'}</span>
              </button>

              <button
                type="button"
                aria-label="Verset suivant"
                onClick={() => {
                  setAudioMode('ayah');
                  setCurrentAyahIndex((prev) => Math.min(verses.length - 1, prev + 1));
                  setCurrentRepeatIteration(1);
                }}
                className="p-1.5 rounded border theme-muted cursor-pointer"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Repeat & Speed */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 p-0.5 theme-muted border rounded-md text-[11px]">
                {[
                  { val: 1, label: '1x' },
                  { val: 3, label: '3x' },
                  { val: 5, label: '5x' },
                  { val: 0, label: '∞' },
                ].map((r) => (
                  <button
                    key={r.val}
                    type="button"
                    onClick={() => {
                      setRepeatMode(r.val as any);
                      setCurrentRepeatIteration(1);
                    }}
                    className={`px-2 py-0.5 rounded font-mono-tabular cursor-pointer ${
                      repeatMode === r.val
                        ? 'theme-surface font-semibold shadow-2xs'
                        : 'theme-text-muted'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="hidden sm:flex items-center gap-0.5 p-0.5 theme-muted border rounded-md text-[11px]">
                {[0.85, 1, 1.15].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setPlaybackRate(spd)}
                    className={`px-1.5 py-0.5 rounded font-mono-tabular cursor-pointer ${
                      playbackRate === spd
                        ? 'theme-surface font-semibold shadow-2xs'
                        : 'theme-text-muted'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
