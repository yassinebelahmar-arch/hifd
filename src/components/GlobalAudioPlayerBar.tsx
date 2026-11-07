import React from 'react';
import { Headphones, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { ALL_SURAHS, VerseDetail } from '../data/quranMetadata';

export interface SharedAudioController {
  isPlaying: boolean;
  audioMode: 'surah' | 'ayah';
  playingSurahNumber: number;
  playingSurahVerses: VerseDetail[];
  currentAyahIndex: number;
  repeatMode: 1 | 3 | 5 | 0;
  currentRepeatIteration: number;
  playbackRate: number;
  autoAdvanceNextSurah: boolean;
  echoPauseMode: boolean;
  isEchoWaiting: boolean;
  rangeStart: number;
  rangeEnd: number;
  loopRange: boolean;
  audioCurrentTime: number;
  audioDuration: number;
  togglePlaySurah: (surahNumber?: number) => void;
  playSpecificAyah: (surahNumber: number, ayahIndex: number, versesList?: VerseDetail[]) => void;
  togglePlayPause: () => void;
  prevTrackOrAyah: () => void;
  nextTrackOrAyah: () => void;
  setAudioMode: (mode: 'surah' | 'ayah') => void;
  setRepeatMode: (repeat: 1 | 3 | 5 | 0) => void;
  setPlaybackRate: (rate: number) => void;
  setAutoAdvanceNextSurah: React.Dispatch<React.SetStateAction<boolean>>;
  setEchoPauseMode: React.Dispatch<React.SetStateAction<boolean>>;
  setRangeStart: React.Dispatch<React.SetStateAction<number>>;
  setRangeEnd: React.Dispatch<React.SetStateAction<number>>;
  setLoopRange: React.Dispatch<React.SetStateAction<boolean>>;
  seekTo: (timeSec: number) => void;
}

interface GlobalAudioPlayerBarProps {
  controller: SharedAudioController;
}

export const GlobalAudioPlayerBar: React.FC<GlobalAudioPlayerBarProps> = ({ controller }) => {
  const {
    isPlaying,
    audioMode,
    playingSurahNumber,
    playingSurahVerses,
    currentAyahIndex,
    repeatMode,
    currentRepeatIteration,
    playbackRate,
    autoAdvanceNextSurah,
    audioCurrentTime,
    audioDuration,
    togglePlayPause,
    prevTrackOrAyah,
    nextTrackOrAyah,
    setAudioMode,
    setRepeatMode,
    setPlaybackRate,
    setAutoAdvanceNextSurah,
    seekTo,
  } = controller;

  const surahMeta =
    ALL_SURAHS.find((s) => s.number === playingSurahNumber) || ALL_SURAHS[66];
  const currentVerse = playingSurahVerses[currentAyahIndex];

  const formatAudioTime = (sec: number) => {
    if (!sec || !Number.isFinite(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div
      role="region"
      aria-label="Lecteur audio permanent Cheikh Yasser Al-Dosari"
      data-testid="global-audio-player-bar"
      onClick={(e) => e.stopPropagation()}
      className="fixed bottom-0 left-0 right-0 z-40 theme-surface border-t px-3 sm:px-4 py-2 shadow-lg"
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-1.5">
        {/* Timeline Scrubber */}
        <div className="flex items-center gap-2 text-[11px] font-mono-tabular theme-text-muted">
          <span>{formatAudioTime(audioCurrentTime)}</span>
          <input
            type="range"
            aria-label="Position de lecture audio"
            min={0}
            max={audioDuration > 0 ? audioDuration : 100}
            step={0.1}
            value={audioCurrentTime}
            onChange={(e) => seekTo(Number(e.target.value))}
            className="flex-1 h-1 rounded-lg appearance-none cursor-pointer theme-muted accent-[var(--accent-primary)]"
          />
          <span>{formatAudioTime(audioDuration)}</span>
        </div>

        {/* Controls Row: Track Info + Play/Prev/Next + Repeat (1x 3x 5x ∞) + Speed (0.85x 1x 1.15x) */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left: Active Surah & Mode Switcher (Sourate complète vs Verset par verset) */}
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <Headphones className="w-3.5 h-3.5 text-[var(--accent-gold)] shrink-0" />
              <span className="text-xs font-bold truncate">
                {surahMeta.number}. {surahMeta.nameFr} ({surahMeta.nameAr})
              </span>
              <span className="text-[11px] theme-text-muted font-mono-tabular">
                {audioMode === 'surah'
                  ? '· Sourate'
                  : `· Verset ${currentVerse?.numberInSurah || currentAyahIndex + 1}/${Math.max(1, playingSurahVerses.length)}`}
                {repeatMode !== 1 && (
                  <span className="ml-1 text-[var(--accent-gold)] font-semibold">
                    ({repeatMode === 0 ? '∞' : `${currentRepeatIteration}/${repeatMode}`})
                  </span>
                )}
              </span>
            </div>

            {/* Mode Toggle: Sourate entière vs Par verset */}
            <div
              role="group"
              aria-label="Mode audio"
              className="flex items-center gap-0.5 p-0.5 theme-muted border rounded-md text-[11px]"
            >
              <button
                type="button"
                data-testid="audio-mode-surah"
                onClick={() => setAudioMode('surah')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  audioMode === 'surah'
                    ? 'theme-surface font-semibold shadow-2xs'
                    : 'theme-text-muted hover:text-[var(--text-main)]'
                }`}
              >
                Sourate
              </button>
              <button
                type="button"
                data-testid="audio-mode-ayah"
                onClick={() => setAudioMode('ayah')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  audioMode === 'ayah'
                    ? 'theme-surface font-semibold shadow-2xs'
                    : 'theme-text-muted hover:text-[var(--text-main)]'
                }`}
              >
                Par verset
              </button>
            </div>
          </div>

          {/* Center: Prev / Play-Pause / Next */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label={audioMode === 'surah' ? 'Sourate précédente' : 'Verset précédent'}
              onClick={prevTrackOrAyah}
              className="p-1.5 rounded-md border theme-muted hover:opacity-80 cursor-pointer"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              data-testid="global-audio-play-pause"
              onClick={togglePlayPause}
              className="px-3.5 py-1.5 text-xs font-semibold theme-btn-primary rounded-md flex items-center gap-1.5 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Écouter'}</span>
            </button>

            <button
              type="button"
              aria-label={audioMode === 'surah' ? 'Sourate suivante' : 'Verset suivant'}
              onClick={nextTrackOrAyah}
              className="p-1.5 rounded-md border theme-muted hover:opacity-80 cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Repeat (1x | 3x | 5x | ∞) & Playback Speed (0.85x | 1x | 1.15x) & Auto-Advance */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Repeat Menu: 1x | 3x | 5x | ∞ */}
            <div
              role="group"
              aria-label="Répétition audio"
              data-testid="audio-repeat-group"
              className="flex items-center gap-0.5 p-0.5 theme-muted border rounded-md text-[11px]"
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
                  data-testid={`audio-repeat-${r.label}`}
                  onClick={() => setRepeatMode(r.val)}
                  className={`px-2 py-0.5 rounded font-mono-tabular cursor-pointer transition-colors ${
                    repeatMode === r.val
                      ? 'theme-btn-primary font-bold shadow-2xs'
                      : 'theme-text-muted hover:text-[var(--text-main)]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Playback Speed Menu: 0.85x | 1x | 1.15x (Always visible on mobile & desktop) */}
            <div
              role="group"
              aria-label="Vitesse de récitation"
              data-testid="audio-speed-group"
              className="flex items-center gap-0.5 p-0.5 theme-muted border rounded-md text-[11px]"
            >
              {[0.85, 1, 1.15].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  data-testid={`audio-speed-${spd}x`}
                  onClick={() => setPlaybackRate(spd)}
                  className={`px-2 py-0.5 rounded font-mono-tabular cursor-pointer transition-colors ${
                    playbackRate === spd
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
              onClick={() => setAutoAdvanceNextSurah((a) => !a)}
              title="Enchaîner automatiquement la sourate suivante"
              className={`px-2 py-1 text-[11px] rounded-md border cursor-pointer hidden md:inline-flex items-center ${
                autoAdvanceNextSurah
                  ? 'theme-badge-check2 font-semibold'
                  : 'theme-muted theme-text-muted'
              }`}
            >
              {autoAdvanceNextSurah ? 'Enchaîner ✓' : 'Enchaîner'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
