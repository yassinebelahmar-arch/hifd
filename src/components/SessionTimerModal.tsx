import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Clock, Pause, Play, RotateCcw, X } from 'lucide-react';
import { ALL_HALF_HIZBS } from '../data/quranMetadata';
import { HifdhSessionLog, computePracticedMinutesFromSeconds } from '../utils/hifdhLogic';

interface SessionTimerModalProps {
  isOpen: boolean;
  defaultDurationMinutes: number;
  onClose: () => void;
  onSaveSession: (session: Omit<HifdhSessionLog, 'id' | 'dateIso'>) => void;
}

export const SessionTimerModal: React.FC<SessionTimerModalProps> = ({
  isOpen,
  defaultDurationMinutes,
  onClose,
  onSaveSession,
}) => {
  const [timerMode, setTimerMode] = useState<'stopwatch' | 'countdown'>('stopwatch');
  const [targetMinutes, setTargetMinutes] = useState<number>(defaultDurationMinutes || 60);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [halfHizbId, setHalfHizbId] = useState<number>(113);
  const [sessionType, setSessionType] = useState<HifdhSessionLog['sessionType']>('memorization');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    setTargetMinutes(defaultDurationMinutes || 60);
  }, [defaultDurationMinutes]);

  useEffect(() => {
    if (isOpen && elapsedSeconds === 0 && !running) {
      setRunning(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  if (!isOpen) return null;

  const totalTargetSeconds = targetMinutes * 60;
  const displaySeconds =
    timerMode === 'countdown'
      ? Math.max(0, totalTargetSeconds - elapsedSeconds)
      : elapsedSeconds;

  const hrs = Math.floor(displaySeconds / 3600);
  const mins = Math.floor((displaySeconds % 3600) / 60);
  const secs = displaySeconds % 60;
  const formattedTimer =
    hrs > 0
      ? `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const creditMinutes = computePracticedMinutesFromSeconds(elapsedSeconds, targetMinutes);

  const handleSave = () => {
    const hh = ALL_HALF_HIZBS.find((h) => h.id === halfHizbId) || ALL_HALF_HIZBS[112];
    onSaveSession({
      durationMinutes: creditMinutes,
      sessionType,
      targetLabel: `${hh.labelFr} (${hh.featuredSurahNames})`,
      halfHizbId: hh.id,
      surahNumber: hh.startSurah,
    });
    setRunning(false);
    setSavedNotice(`+${creditMinutes} min enregistrées`);
    setTimeout(() => {
      setSavedNotice(null);
      setElapsedSeconds(0);
      onClose();
    }, 1000);
  };

  return (
    <aside
      aria-label="Chronomètre Hifdh"
      className="fixed bottom-18 right-4 z-50 w-[310px] theme-surface border rounded-xl shadow-xl overflow-hidden"
    >
      {/* Compact Top Bar */}
      <div className="theme-muted border-b px-3.5 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 theme-text-muted" />
          <span
            data-testid="live-chrono-display"
            className="font-mono-tabular text-sm font-bold"
          >
            {formattedTimer}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={running ? 'Pause' : 'Lecture'}
            onClick={() => setRunning((r) => !r)}
            className="p-1.5 rounded theme-btn-primary cursor-pointer"
          >
            {running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>
          <button
            type="button"
            aria-label="Réinitialiser"
            onClick={() => {
              setRunning(false);
              setElapsedSeconds(0);
            }}
            className="p-1.5 rounded theme-surface border cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            type="button"
            aria-label={isMinimized ? 'Déplier' : 'Réduire'}
            onClick={() => setIsMinimized((m) => !m)}
            className="p-1.5 rounded hover:opacity-75 cursor-pointer"
          >
            {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => {
              setRunning(false);
              onClose();
            }}
            className="p-1.5 rounded hover:opacity-75 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-3.5 space-y-3 text-xs">
          {savedNotice ? (
            <div className="py-4 text-center font-semibold">{savedNotice}</div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-0.5 p-0.5 theme-muted border rounded">
                  <button
                    type="button"
                    onClick={() => setTimerMode('stopwatch')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      timerMode === 'stopwatch' ? 'theme-surface font-semibold' : 'theme-text-muted'
                    }`}
                  >
                    Chrono
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimerMode('countdown')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      timerMode === 'countdown' ? 'theme-surface font-semibold' : 'theme-text-muted'
                    }`}
                  >
                    Minuteur
                  </button>
                </div>

                <div className="flex items-center gap-1 font-mono-tabular">
                  {[30, 60, 90].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTargetMinutes(m)}
                      className={`px-1.5 py-0.5 rounded border cursor-pointer ${
                        targetMinutes === m ? 'theme-btn-primary border-transparent' : 'theme-muted'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              <select
                aria-label="Demi-Hizb étudié"
                value={halfHizbId}
                onChange={(e) => setHalfHizbId(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 theme-muted border rounded-md"
              >
                {ALL_HALF_HIZBS.slice()
                  .reverse()
                  .map((hh) => (
                    <option key={hh.id} value={hh.id}>
                      Juz {hh.juzNumber} · {hh.labelFr}
                    </option>
                  ))}
              </select>

              <button
                type="button"
                onClick={handleSave}
                className="w-full py-2 px-3 font-semibold theme-btn-primary rounded-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Valider +{creditMinutes} min sur mes 3h/sem</span>
              </button>
            </>
          )}
        </div>
      )}
    </aside>
  );
};
