import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Sparkles, Settings } from 'lucide-react';
import { soundGen } from '../../services/soundGenerator';
import { getTheme } from '../../utils/theme';
import { storage } from '../../services/storage';
import { useWidgetInteraction } from '../../hooks/useWidgetInteraction';

function PomodoroTimer({
  settings = {},
  activeTask,
  onCompleteSession,
  onStartFocus,
  onOpenSettings,
}) {
  const [mode, setMode] = useState('work'); // 'work', 'shortBreak', 'longBreak'
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  // Controls visibility: Only visible while hovering over the widget (or via Ctrl+Click/Long Press)
  const [isHovered, setIsHovered] = useState(false);
  const [isPinnedControls, setIsPinnedControls] = useState(false);

  const panelRef = useRef(null);
  const timerRef = useRef(null);
  const endTimeRef = useRef(null);

  const theme = getTheme(settings.themeColor);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const { position, isDragging, isShiftPressed, bind } = useWidgetInteraction({
    initialPosition: { x: 0, y: 0 },
    onOpenControls: () => {
      setIsPinnedControls((prev) => !prev);
    },
    positionMode: 'offsetCenter',
    panelRef,
  });

  // Get duration based on mode
  const getDurationForMode = (m) => {
    switch (m) {
      case 'shortBreak':
        return (settings.shortBreakDuration || 5) * 60;
      case 'longBreak':
        return (settings.longBreakDuration || 15) * 60;
      default:
        return (settings.workDuration || 25) * 60;
    }
  };

  useEffect(() => {
    if (!isRunning) {
      setSecondsLeft(getDurationForMode(mode));
    }
  }, [mode, settings.workDuration, settings.shortBreakDuration, settings.longBreakDuration]);

  // Countdown timer loop
  useEffect(() => {
    if (isRunning) {
      endTimeRef.current = Date.now() + secondsLeft * 1000;

      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
        setSecondsLeft(remaining);

        if (remaining <= 0) {
          clearInterval(timerRef.current);
          handleTimerComplete();
        }
      }, 250);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Update browser document title
  useEffect(() => {
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const modeLabel = mode === 'work' ? 'Focus' : mode === 'shortBreak' ? 'Short Break' : 'Long Break';
    document.title = `${formatted} - ${modeLabel} | Pomo`;
  }, [secondsLeft, mode]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    soundGen.playCompletionChime();

    if (mode === 'work') {
      const activeSession = storage.getActiveSession();
      if (activeSession) {
        const durationSecs = (settings.workDuration || 25) * 60;
        storage.endFocusSession(activeSession.id, durationSecs);
      } else {
        const durationMinutes = settings.workDuration || 25;
        onCompleteSession({
          durationMinutes,
          mode: 'work',
          taskTitle: activeTask ? activeTask.title : 'General Focus',
          completedAt: new Date().toISOString(),
        });
      }

      const nextCount = pomodoroCount + 1;
      setPomodoroCount(nextCount);

      if (nextCount % (settings.longBreakInterval || 4) === 0) {
        setMode('longBreak');
        setSecondsLeft((settings.longBreakDuration || 15) * 60);
      } else {
        setMode('shortBreak');
        setSecondsLeft((settings.shortBreakDuration || 5) * 60);
      }

      if (settings.autoStartBreaks) {
        setIsRunning(true);
      }
    } else {
      setMode('work');
      setSecondsLeft((settings.workDuration || 25) * 60);
      if (settings.autoStartPomodoros) {
        setIsRunning(true);
      }
    }
  };

  const toggleTimer = () => {
    if (!isRunning) {
      if (mode === 'work') {
        const newSession = storage.startFocusSession();
        if (activeTask) {
          storage.associateTaskWithSession(newSession.id, activeTask.id);
        }
      }
      if (onStartFocus) onStartFocus();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    if (isRunning) {
      const activeSession = storage.getActiveSession();
      if (activeSession) {
        storage.cancelFocusSession(activeSession.id);
      }
    }
    setIsRunning(false);
    setSecondsLeft(getDurationForMode(mode));
  };

  const changeMode = (newMode) => {
    setIsRunning(false);
    setMode(newMode);
    setSecondsLeft(getDurationForMode(newMode));
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const scaleClass =
    settings.timerScale === 'small'
      ? 'scale-75'
      : settings.timerScale === 'large'
      ? 'scale-125'
      : settings.timerScale === 'huge'
      ? 'scale-150'
      : 'scale-100';

  const digitColor =
    mode === 'work' ? theme.text : mode === 'shortBreak' ? 'text-cyan-400' : 'text-purple-400';

  const fontSizeClass =
    settings.timerFontSize === '6xl' ? 'text-5xl sm:text-6xl' :
    settings.timerFontSize === '7xl' ? 'text-6xl sm:text-7xl' :
    settings.timerFontSize === '8xl' ? 'text-7xl sm:text-8xl' :
    settings.timerFontSize === '10xl' ? 'text-8xl sm:text-[10rem]' :
    settings.timerFontSize === '12xl' ? 'text-9xl sm:text-[12rem]' :
    'text-7xl sm:text-9xl';

  const displayScale = (settings.timerDisplaySize ?? 100) / 100;
  const showControls = isHovered || isPinnedControls;

  return (
    <div
      ref={panelRef}
      {...bind}
      style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${displayScale})`,
        userSelect: 'none',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseEnter}
      onTouchEnd={handleMouseLeave}
      className={`flex flex-col items-center justify-center text-center z-20 select-none transition-transform duration-300 ${
        isDragging
          ? 'cursor-grabbing'
          : isShiftPressed
          ? 'cursor-grab border border-dashed border-emerald-400/50 rounded-3xl p-2'
          : 'cursor-default'
      }`}
      title="Hover over to reveal controls | Shift+Drag to move"
    >
      {/* Mode Switcher Tabs (Only visible while hovering) */}
      <div
        className={`flex items-center space-x-2 p-1.5 rounded-full glass-panel mb-4 shadow-xl border border-white/10 transition-all duration-150 ${
          showControls ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => changeMode('work')}
          className={`px-4 py-2 rounded-full text-xs font-bold font-mono tracking-wider transition-all ${
            mode === 'work'
              ? `${theme.bgLight} ${theme.textLight} ${theme.border} shadow-sm`
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          FOCUS ({settings.workDuration || 25}M)
        </button>
        <button
          onClick={() => changeMode('shortBreak')}
          className={`px-4 py-2 rounded-full text-xs font-bold font-mono tracking-wider transition-all ${
            mode === 'shortBreak'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          SHORT BREAK ({settings.shortBreakDuration || 5}M)
        </button>
        <button
          onClick={() => changeMode('longBreak')}
          className={`px-4 py-2 rounded-full text-xs font-bold font-mono tracking-wider transition-all ${
            mode === 'longBreak'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          LONG BREAK ({settings.longBreakDuration || 15}M)
        </button>
      </div>

      {/* Minimal Digital Clock Display */}
      <div className="relative flex flex-col items-center justify-center py-2 px-4">
        {/* Silhouette Background 88:88 */}
        <div className="relative flex items-center justify-center font-digital">
          <span className={`${fontSizeClass} font-bold tracking-widest text-slate-800/30 select-none`}>
            88:88
          </span>
          {/* Active Glowing LED Digits */}
          <span className={`absolute ${fontSizeClass} font-bold tracking-widest drop-shadow-[0_0_25px_rgba(0,0,0,0.5)] ${digitColor}`}>
            {formattedTime}
          </span>
        </div>

        {/* Subtitle / Mode Status */}
        <div className="mt-2 flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${theme.bg}`} />
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
            {mode === 'work' ? `SESSION #${pomodoroCount + 1}` : 'RECHARGE BREAK'}
          </span>
        </div>

        {/* Active Task Badge */}
        {activeTask && (
          <div className={`mt-3 max-w-[240px] truncate flex items-center space-x-1.5 px-3.5 py-1 rounded-full glass-panel border ${theme.border} text-xs ${theme.text}`}>
            <Sparkles className={`w-3 h-3 ${theme.text} shrink-0`} />
            <span className="truncate font-mono text-[11px]">{activeTask.title}</span>
          </div>
        )}
      </div>

      {/* Primary Action Buttons & Settings (Only visible while hovering) */}
      <div
        className={`flex items-center space-x-3 mt-4 transition-all duration-150 ${
          showControls ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={resetTimer}
          title="Reset Timer"
          className="p-3 rounded-2xl glass-panel text-slate-400 hover:text-white hover:border-white/20 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={toggleTimer}
          className={`px-7 py-3 rounded-2xl font-mono font-bold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-2xl transition-all ${
            isRunning
              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/30'
              : `${theme.bg} ${theme.textDark} ${theme.bgHover} ${theme.glow}`
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>PAUSE</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>START FOCUS</span>
            </>
          )}
        </button>

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            title="Configure Timer & App Settings"
            className="p-3 rounded-2xl glass-panel text-slate-400 hover:text-white hover:border-white/20 transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default React.memo(PomodoroTimer);
