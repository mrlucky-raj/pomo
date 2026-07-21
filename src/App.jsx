import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import BackgroundContainer from './components/Background/BackgroundContainer';
import PomodoroTimer from './components/Timer/PomodoroTimer';
import QuickTodoList from './components/Tasks/QuickTodoList';
import QuickNotesWidget from './components/Notes/QuickNotesWidget';
import AudioPlayerUI, { MUSIC_TRACKS } from './components/Audio/AudioPlayer';
import QuoteWidget from './components/Quotes/QuoteWidget';

import { storage } from './services/storage';
import { getTheme } from './utils/theme';
import { Home, BarChart2 } from 'lucide-react';

// Lazy load heavy page sections and modals for lightning-fast initial load & low RAM memory usage
const StatsPage = lazy(() => import('./components/Stats/StatsPage'));
const SettingsModal = lazy(() => import('./components/Settings/SettingsModal'));
const TaskDrawerModal = lazy(() => import('./components/Tasks/TaskDrawerModal'));
const BackgroundPickerModal = lazy(() => import('./components/Background/BackgroundPickerModal'));
const AnalyticsModal = lazy(() => import('./components/Analytics/AnalyticsModal'));
const AuthModal = lazy(() => import('./components/Auth/AuthModal'));

export default function App() {
  // Data States loaded from Storage
  const [settings, setSettings] = useState(storage.getSettings());
  const [tasks, setTasks] = useState(storage.getTasks());
  const [sessions, setSessions] = useState(storage.getSessions());
  const [stats, setStats] = useState(storage.getStats());

  const [activeTaskId, setActiveTaskId] = useState(null);
  const [syncStatus, setSyncStatus] = useState({ state: 'idle' });

  // Active Page Navigation State ('home' | 'stats')
  const [currentPage, setCurrentPage] = useState('home');

  // UI Visibility & Modals
  const [showNotesWidget, setShowNotesWidget] = useState(true);
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

  const theme = getTheme(settings.themeColor);

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

  const handleSelectTrack = (idx) => {
    setActiveTrackIndex(idx);
    setIsPlayingMusic(false);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().then(() => setIsPlayingMusic(true)).catch(err => console.log(err));
      }
    }, 100);
  };

  // Synchronize OS/Browser Media Metadata Tags & Media Keys (Windows / macOS / Mobile Now Playing)
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      try {
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist || 'Lo-Fi Focus Music',
          album: currentTrack.album || 'Pomo Ambient Workspace',
          artwork: [
            { src: '/favicon.svg', sizes: '512x512', type: 'image/svg+xml' },
          ],
        });

        navigator.mediaSession.setActionHandler('play', () => {
          if (audioRef.current) {
            audioRef.current.play().then(() => setIsPlayingMusic(true)).catch((err) => console.log(err));
          }
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          if (audioRef.current) {
            audioRef.current.pause();
            setIsPlayingMusic(false);
          }
        });
        navigator.mediaSession.setActionHandler('previoustrack', handlePrevTrack);
        navigator.mediaSession.setActionHandler('nexttrack', handleNextTrack);
      } catch (err) {
        // Ignore unsupported media session actions
      }
    }
  }, [currentTrack, isPlayingMusic]);

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

  // Read Widget Visibility Toggles from Settings
  const showNavBtns = settings.showNavBtns ?? true;
  const showTimer = settings.showTimer ?? true;
  const showTodoList = settings.showTodoList ?? true;
  const showQuotes = settings.showQuotes ?? true;
  const showMusicPlayer = settings.showMusicPlayer ?? true;

  return (
    <div className={`relative min-h-screen w-full flex flex-col justify-between text-slate-100 overflow-x-hidden font-sans select-none theme-${settings.themeColor || 'emerald'}`}>
      {/* 1. Global Persistent Audio Tag */}
      <audio
        ref={audioRef}
        src={currentTrack.src}
        loop
        onEnded={handleNextTrack}
        onError={() => setIsPlayingMusic(false)}
      />

      {/* 2. Dynamic Ambient Background Engine */}
      <BackgroundContainer settings={settings} />

      {/* 3. Top Header Navigation (Nav Dock at top-right corner, auto-hides on desktop & reveals on hover) */}
      <header className="relative z-40 flex items-center justify-end p-4 sm:p-6">
        {showNavBtns && (
          <div className="fixed right-6 top-4 z-50 group">
            <nav className="flex items-center p-1.5 rounded-full glass-panel shadow-2xl border border-white/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300">
              <button
                onClick={() => setCurrentPage('home')}
                className={`p-2.5 rounded-full transition-colors duration-75 flex items-center justify-center ${
                  currentPage === 'home'
                    ? `${theme.bg} ${theme.textDark} ${theme.glow}`
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title="Home Workspace"
              >
                <Home className="w-5 h-5" />
              </button>

              <button
                onClick={() => setCurrentPage('stats')}
                className={`p-2.5 rounded-full transition-colors duration-75 flex items-center justify-center ${
                  currentPage === 'stats'
                    ? `${theme.bg} ${theme.textDark} ${theme.glow}`
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title="Study Analytics & States"
              >
                <BarChart2 className="w-5 h-5" />
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* 4. Page Content Viewport with Suspense Code Splitting */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-4 my-auto min-h-[80vh]">
        {currentPage === 'home' && (
          <div className="relative w-full flex-1 flex flex-col items-center justify-center min-h-[75vh]">
            {/* Draggable Quick Tasks Panel */}
            {showTodoList && (
              <div>
                <QuickTodoList
                  tasks={tasks}
                  activeTaskId={activeTaskId}
                  onSelectActiveTask={(id) => setActiveTaskId(id === activeTaskId ? null : id)}
                  onSaveTask={handleSaveTask}
                  onDeleteTask={handleDeleteTask}
                  onOpenFullModal={() => setIsTaskModalOpen(true)}
                  themeColor={settings.themeColor}
                />
              </div>
            )}

            {/* Draggable Sticky Quick Note Widget */}
            {showNotesWidget && (
              <div>
                <QuickNotesWidget themeColor={settings.themeColor} />
              </div>
            )}

            {/* Draggable 8-Bit Pomodoro Timer Panel */}
            {showTimer && (
              <div>
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
                  onOpenSettings={() => setIsSettingsOpen(true)}
                />
              </div>
            )}

            {/* Draggable Quotes Widget Panel */}
            {showQuotes && (
              <div>
                <QuoteWidget themeColor={settings.themeColor} />
              </div>
            )}

            {/* Unified Bottom-Left Dock (Music Player + Tools) */}
            {showMusicPlayer && (
              <div className="fixed bottom-6 left-6 z-50">
                <AudioPlayerUI
                  isPlaying={isPlayingMusic}
                  currentTrack={currentTrack}
                  onTogglePlay={handleTogglePlayMusic}
                  onNextTrack={handleNextTrack}
                  onPrevTrack={handlePrevTrack}
                  onSelectTrack={handleSelectTrack}
                  onOpenBackground={() => setIsBackgroundOpen(true)}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                  onToggleNotesWidget={() => setShowNotesWidget(!showNotesWidget)}
                  showNotesWidget={showNotesWidget}
                  onToggleTodoList={() => handleUpdateSettings({ showTodoList: !showTodoList })}
                  showTodoList={showTodoList}
                  themeColor={settings.themeColor}
                />
              </div>
            )}
          </div>
        )}

        {/* Lazy Loaded Analytics & States Page */}
        {currentPage === 'stats' && (
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <StatsPage stats={stats} sessions={sessions} tasks={tasks} themeColor={settings.themeColor} />
          </Suspense>
        )}
      </main>

      {/* 5. Lazy Loaded Modals (Zero RAM impact when closed) */}
      <Suspense fallback={null}>
        {isTaskModalOpen && (
          <TaskDrawerModal
            isOpen={isTaskModalOpen}
            onClose={() => setIsTaskModalOpen(false)}
            tasks={tasks}
            activeTaskId={activeTaskId}
            onSelectActiveTask={(id) => setActiveTaskId(id === activeTaskId ? null : id)}
            onSaveTask={handleSaveTask}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {isAnalyticsOpen && (
          <AnalyticsModal
            isOpen={isAnalyticsOpen}
            onClose={() => setIsAnalyticsOpen(false)}
            stats={stats}
            sessions={sessions}
            tasks={tasks}
          />
        )}

        {isAuthOpen && (
          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            storage={storage}
            syncStatus={syncStatus}
          />
        )}

        {isBackgroundOpen && (
          <BackgroundPickerModal
            isOpen={isBackgroundOpen}
            onClose={() => setIsBackgroundOpen(false)}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </Suspense>
    </div>
  );
}
