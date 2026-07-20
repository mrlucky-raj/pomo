import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Sparkles, GripHorizontal } from 'lucide-react';
import { soundGen } from '../../services/soundGenerator';

export default function PomodoroTimer({
  settings,
  activeTask,
  onCompleteSession,
  onTaskCompleted,
  onStartFocus,
}) {
  const [mode, setMode] = useState('work'); // 'work', 'shortBreak', 'longBreak'
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  // Drag offset relative to center of screen
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });
  const panelRef = useRef(null);

  // Inactivity Auto-Hide state (3 seconds timeout)
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const inactivityTimerRef = useRef(null);

  const timerRef = useRef(null);
  const endTimeRef = useRef(null);

  // Pointer Down event handler on Drag Handle
  const handlePointerDown = (e) => {
    if (e.button !== 0) return;

    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: offset.x,
      startY: offset.y,
    };

    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  // Pointer Move event handler with viewport clamping
  const handlePointerMove = (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;

    let newX = dragStartRef.current.startX + deltaX;
    let newY = dragStartRef.current.startY + deltaY;

    const panelWidth = panelRef.current ? panelRef.current.offsetWidth : 300;
    const panelHeight = panelRef.current ? panelRef.current.offsetHeight : 300;

    const maxOffsetX = Math.max(10, (window.innerWidth - panelWidth) / 2 - 10);
    const maxOffsetY = Math.max(10, (window.innerHeight - panelHeight) / 2 - 10);

    newX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newX));
    newY = Math.max(-maxOffsetY, Math.min(maxOffsetY, newY));

    setOffset({ x: newX, y: newY });
  };

  // Pointer Up event handler
  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
  };

  // Auto-hide controls after 3 seconds of mouse inactivity
  const handleUserActivity = () => {
    setIsControlsVisible(true);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      setIsControlsVisible(false);
    }, 3000);
  };

  useEffect(() => {
    handleUserActivity();
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

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
      const durationMinutes = settings.workDuration || 25;
      onCompleteSession({
        durationMinutes,
        mode: 'work',
        taskTitle: activeTask ? activeTask.title : 'General Focus',
        completedAt: new Date().toISOString(),
      });

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
    if (!isRunning && onStartFocus) {
      onStartFocus();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
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

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
        userSelect: isDragging ? 'none' : 'auto',
      }}
      onMouseMove={handleUserActivity}
      onMouseEnter={handleUserActivity}
      onTouchStart={handleUserActivity}
      className="flex flex-col items-center justify-center text-center z-20 select-none"
    >
      {/* Header Drag Handle */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`w-full flex items-center justify-center space-x-1.5 py-1 mb-2 text-slate-400 opacity-60 hover:opacity-100 transition-opacity select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        title="Click and drag to move timer"
      >
        <GripHorizontal className="w-4 h-4" />
        <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400">8-SEGMENT TIMER</span>
      </div>

      {/* Mode Switcher Tabs (Fades out after 3s inactivity) */}
      <div className={`flex items-center space-x-2 p-1.5 rounded-2xl glass-panel mb-4 shadow-xl transition-all duration-300 ${
        isControlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}>
        <button
          onClick={() => changeMode('work')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider transition-all ${
            mode === 'work'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          FOCUS (25M)
        </button>
        <button
          onClick={() => changeMode('shortBreak')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider transition-all ${
            mode === 'shortBreak'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          SHORT BREAK (5M)
        </button>
        <button
          onClick={() => changeMode('longBreak')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider transition-all ${
            mode === 'longBreak'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          LONG BREAK (15M)
        </button>
      </div>

      {/* 8-Segment Digital Clock Display (No Black Box) */}
      <div className="relative flex flex-col items-center justify-center py-2 px-4">
        {/* Silhouette Background 88:88 */}
        <div className="relative flex items-center justify-center font-digital">
          <span className="text-7xl sm:text-9xl font-bold tracking-widest text-slate-800/40 select-none">
            88:88
          </span>
          {/* Active Glowing 8-Segment LED Digits */}
          <span className={`absolute text-7xl sm:text-9xl font-bold tracking-widest drop-shadow-[0_0_20px_rgba(34,197,94,0.7)] ${
            mode === 'work' ? 'text-emerald-400' : mode === 'shortBreak' ? 'text-cyan-400' : 'text-purple-400'
          }`}>
            {formattedTime}
          </span>
        </div>

        {/* Subtitle / Mode Status */}
        <div className="mt-2 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
            {mode === 'work' ? `SESSION #${pomodoroCount + 1}` : 'RECHARGE BREAK'}
          </span>
        </div>

        {/* Active Task Badge */}
        {activeTask && (
          <div className="mt-3 max-w-[240px] truncate flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-xs text-emerald-400">
            <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate font-mono text-[11px]">{activeTask.title}</span>
          </div>
        )}
      </div>

      {/* Primary Action Buttons (Reset & Start/Pause - Fades out after 3s inactivity) */}
      <div className={`flex items-center space-x-4 mt-4 transition-all duration-300 ${
        isControlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        <button
          onClick={resetTimer}
          title="Reset Timer"
          className="p-3 rounded-2xl glass-panel text-slate-400 hover:text-white hover:border-slate-600 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={toggleTimer}
          className={`px-7 py-3 rounded-2xl font-mono font-bold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-xl transition-all ${
            isRunning
              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
              : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
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
      </div>
    </div>
  );
}
