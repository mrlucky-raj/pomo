import React, { useState, useEffect, useRef } from 'react';
import BackgroundContainer from './components/Background/BackgroundContainer';
import PomodoroTimer from './components/Timer/PomodoroTimer';
import QuickTodoList from './components/Tasks/QuickTodoList';
import TaskDrawerModal from './components/Tasks/TaskDrawerModal';
import AudioPlayerUI, { MUSIC_TRACKS } from './components/Audio/AudioPlayer';
import QuoteWidget from './components/Quotes/QuoteWidget';
import AnalyticsModal from './components/Analytics/AnalyticsModal';
import AuthModal from './components/Auth/AuthModal';
import BackgroundPickerModal from './components/Background/BackgroundPickerModal';
import SettingsModal from './components/Settings/SettingsModal';
import VisionBoardPage from './components/Vision/VisionBoardPage';
import StatsPage from './components/Stats/StatsPage';
import Draggable from 'react-draggable';

import { storage } from './services/storage';
import { Home, LayoutGrid, BarChart2, Image, Settings, Eye, EyeOff } from 'lucide-react';

export default function App() {
  // Data States loaded from Storage
  const [settings, setSettings] = useState(storage.getSettings());
  const [tasks, setTasks] = useState(storage.getTasks());
  const [sessions, setSessions] = useState(storage.getSessions());
  const [stats, setStats] = useState(storage.getStats());

  const [activeTaskId, setActiveTaskId] = useState(null);
  const [syncStatus, setSyncStatus] = useState({ state: 'idle' });

  // Active Page Navigation State ('home' | 'vision' | 'stats')
  const [currentPage, setCurrentPage] = useState('home');

  // UI Visibility & Modals
  const [isZenMode, setIsZenMode] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isBackgroundOpen, setIsBackgroundOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Background Audio Engine State (Persists across all page navigation)
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const audioRef = useRef(null);
  const currentTrack = MUSIC_TRACKS[activeTrackIndex] || MUSIC_TRACKS[0];

  const handleTogglePlayMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlayingMusic(true))
        .catch(err => console.log('Audio error:', err));
    }
  };

  const handleNextTrack = () => {
    const nextIdx = (activeTrackIndex + 1) % MUSIC_TRACKS.length;
    setActiveTrackIndex(nextIdx);
    setIsPlayingMusic(false);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().then(() => setIsPlayingMusic(true)).catch(err => console.log(err));
      }
    }, 100);
  };

  const handlePrevTrack = () => {
    const prevIdx = (activeTrackIndex - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
    setActiveTrackIndex(prevIdx);
    setIsPlayingMusic(false);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().then(() => setIsPlayingMusic(true)).catch(err => console.log(err));
      }
    }, 100);
  };

  // Subscribe to storage changes & network status
  useEffect(() => {
    const handleOnline = () => {
      storage.syncWithCloud();
    };

    window.addEventListener('online', handleOnline);

    const unsubscribeStorage = storage.subscribe((event) => {
      setSyncStatus(event);
      setTasks(storage.getTasks());
      setSessions(storage.getSessions());
      setStats(storage.getStats());
      setSettings(storage.getSettings());
    });

    if (navigator.onLine) {
      storage.syncWithCloud();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      unsubscribeStorage();
    };
  }, []);

  // Handlers
  const handleUpdateSettings = (newSettings) => {
    const updated = storage.saveSettings(newSettings);
    setSettings(updated);
  };

  const handleSaveTask = (task) => {
    const updatedTasks = storage.saveTask(task);
    setTasks(updatedTasks);
  };

  const handleDeleteTask = (taskId) => {
    const updatedTasks = storage.deleteTask(taskId);
    setTasks(updatedTasks);
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
    }
  };

  const handleCompleteSession = (sessionData) => {
    const updatedSessions = storage.addSession(sessionData);
    setSessions(updatedSessions);
    setStats(storage.getStats());

    if (activeTaskId) {
      const task = tasks.find(t => t.id === activeTaskId);
      if (task) {
        handleSaveTask({
          ...task,
          completedPomos: (task.completedPomos || 0) + 1,
        });
      }
    }
  };

  const activeTask = tasks.find(t => t.id === activeTaskId);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between text-slate-100 overflow-x-hidden font-sans select-none">
      {/* 1. Global Persistent Audio Tag (Music continues playing across all pages) */}
      <audio
        ref={audioRef}
        src={currentTrack.src}
        loop
        onEnded={handleNextTrack}
        onError={() => setIsPlayingMusic(false)}
      />

      {/* 2. Dynamic Ambient Background Engine */}
      <BackgroundContainer settings={settings} />

      {/* 3. Top Header Navigation (Logo & Realtime DB badge removed) */}
      <header className={`relative z-40 flex items-center justify-between p-4 sm:p-6 transition-all duration-500 ${
        isZenMode ? 'opacity-0 pointer-events-none -translate-y-6' : 'opacity-100'
      }`}>
        {/* Left Side: Empty clean layout */}
        <div className="w-10" />

        {/* Top-Middle: Navigation Dock with JUST ICONS */}
        <nav className="fixed left-1/2 -translate-x-1/2 top-4 flex items-center p-1.5 rounded-full glass-panel shadow-2xl border border-slate-700/60 backdrop-blur-xl z-50">
          <button
            onClick={() => setCurrentPage('home')}
            className={`p-2.5 rounded-full transition-all flex items-center justify-center ${
              currentPage === 'home'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Home Workspace"
          >
            <Home className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCurrentPage('vision')}
            className={`p-2.5 rounded-full transition-all flex items-center justify-center ${
              currentPage === 'vision'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Vision Board"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCurrentPage('stats')}
            className={`p-2.5 rounded-full transition-all flex items-center justify-center ${
              currentPage === 'stats'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Study Analytics & States"
          >
            <BarChart2 className="w-5 h-5" />
          </button>
        </nav>

        {/* Right Side Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsBackgroundOpen(true)}
            className="p-2.5 rounded-2xl glass-pill text-slate-300 hover:text-white hover:border-slate-600 transition-all"
            title="Change Ambient Background"
          >
            <Image className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-2xl glass-pill text-slate-300 hover:text-white hover:border-slate-600 transition-all"
            title="Timer & Preferences"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsZenMode(!isZenMode)}
            className="p-2.5 rounded-2xl bg-slate-900/60 border border-slate-700 text-slate-300 hover:text-white transition-all"
            title="Toggle Zen Focus Mode"
          >
            {isZenMode ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 4. Page Content Viewport */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-4 my-auto min-h-[80vh]">
        {/* PAGE 1: HOME WORKSPACE */}
        {currentPage === 'home' && (
          <div className="relative w-full flex-1 flex flex-col items-center justify-center min-h-[75vh]">
            {/* Draggable Quick Tasks Panel (Header Drag Handle with Viewport Clamping) */}
            <div className={`transition-opacity duration-500 ${
              isZenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}>
              <QuickTodoList
                tasks={tasks}
                activeTaskId={activeTaskId}
                onSelectActiveTask={(id) => setActiveTaskId(id === activeTaskId ? null : id)}
                onSaveTask={handleSaveTask}
                onDeleteTask={handleDeleteTask}
                onOpenFullModal={() => setIsTaskModalOpen(true)}
              />
            </div>

            {/* Draggable 8-Bit Pomodoro Timer Panel */}
            <div className={`transition-all duration-500 ${isZenMode ? 'scale-110' : 'scale-100'}`}>
              <PomodoroTimer
                settings={settings}
                activeTask={activeTask}
                onCompleteSession={handleCompleteSession}
                onTaskCompleted={() => {
                  if (activeTask) handleSaveTask({ ...activeTask, completed: true });
                }}
                onStartFocus={() => {
                  if (!isPlayingMusic) handleTogglePlayMusic();
                }}
              />
            </div>

            {/* Draggable Quotes Widget Panel */}
            <div className={`transition-opacity duration-500 ${
              isZenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}>
              <QuoteWidget />
            </div>

            {/* Mini Music Player UI (Rendered ONLY on Home Page at Bottom Left) */}
            {!isZenMode && (
              <div className="fixed bottom-6 left-6 z-30">
                <AudioPlayerUI
                  isPlaying={isPlayingMusic}
                  currentTrack={currentTrack}
                  onTogglePlay={handleTogglePlayMusic}
                  onNextTrack={handleNextTrack}
                  onPrevTrack={handlePrevTrack}
                />
              </div>
            )}
          </div>
        )}

        {/* PAGE 2: VISION BOARD */}
        {currentPage === 'vision' && (
          <VisionBoardPage />
        )}

        {/* PAGE 3: STUDY ANALYTICS & STATES */}
        {currentPage === 'stats' && (
          <StatsPage stats={stats} sessions={sessions} tasks={tasks} />
        )}
      </main>

      {/* Zen Mode Exit Button */}
      {isZenMode && (
        <button
          onClick={() => setIsZenMode(false)}
          className="fixed top-6 right-6 z-50 p-3 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white transition-all shadow-2xl animate-pulse"
          title="Exit Zen Mode"
        >
          <Eye className="w-5 h-5 text-emerald-400" />
        </button>
      )}

      {/* 5. Modals */}
      <TaskDrawerModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        tasks={tasks}
        activeTaskId={activeTaskId}
        onSelectActiveTask={(id) => setActiveTaskId(id === activeTaskId ? null : id)}
        onSaveTask={handleSaveTask}
        onDeleteTask={handleDeleteTask}
      />

      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        stats={stats}
        sessions={sessions}
        tasks={tasks}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        storage={storage}
        syncStatus={syncStatus}
      />

      <BackgroundPickerModal
        isOpen={isBackgroundOpen}
        onClose={() => setIsBackgroundOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}
