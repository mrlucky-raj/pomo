import { rtdb, auth } from '../firebase/config';
import { ref, set } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';

const KEYS = {
  TASKS: 'pomo_tasks_v1',
  SESSIONS: 'pomo_sessions_v1',
  SETTINGS: 'pomo_settings_v1',
  STATS: 'pomo_stats_v1',
};

// Default initial settings
export const DEFAULT_SETTINGS = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  autoPlayMusicOnStart: false,
  soundVolume: 0.7,
  ambientVolume: 0.5,
  activeBackground: 'canvas_rain',
  backgroundBlur: 0,
  backgroundOpacity: 0.85,
  selectedMusic: 'track_1',
};

export const getLocalData = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error(`Error reading ${key} from local storage:`, err);
    return fallback;
  }
};

export const setLocalData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to local storage:`, err);
  }
};

/**
 * Storage Service with Direct Firebase Realtime Database Sync for Tasks & Sessions
 */
class StorageService {
  constructor() {
    this.isSyncing = false;
    this.listeners = [];
  }

  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  notifyListeners(status = {}) {
    this.listeners.forEach(fn => fn(status));
  }

  // Load Settings
  getSettings() {
    return { ...DEFAULT_SETTINGS, ...getLocalData(KEYS.SETTINGS, {}) };
  }

  saveSettings(newSettings) {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    setLocalData(KEYS.SETTINGS, updated);
    this.notifyListeners({ type: 'settings_updated', data: updated });
    return updated;
  }

  // Load Tasks
  getTasks() {
    return getLocalData(KEYS.TASKS, []);
  }

  saveTask(task) {
    const tasks = this.getTasks();
    const existingIndex = tasks.findIndex(t => t.id === task.id);
    const updatedTask = {
      ...task,
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    let newTasks;
    if (existingIndex >= 0) {
      newTasks = [...tasks];
      newTasks[existingIndex] = updatedTask;
    } else {
      newTasks = [updatedTask, ...tasks];
    }

    setLocalData(KEYS.TASKS, newTasks);
    this.notifyListeners({ type: 'tasks_updated', tasks: newTasks });
    this.syncTasksAndSessionsToCloud();
    return newTasks;
  }

  deleteTask(taskId) {
    const tasks = this.getTasks();
    const newTasks = tasks.filter(t => t.id !== taskId);
    setLocalData(KEYS.TASKS, newTasks);
    this.notifyListeners({ type: 'tasks_updated', tasks: newTasks });
    this.syncTasksAndSessionsToCloud();
    return newTasks;
  }

  // Load Focus Sessions
  getSessions() {
    return getLocalData(KEYS.SESSIONS, []);
  }

  addSession(session) {
    const sessions = this.getSessions();
    const newSession = {
      id: session.id || `session_${Date.now()}`,
      durationMinutes: session.durationMinutes || 25,
      mode: session.mode || 'work',
      taskTitle: session.taskTitle || 'Focus Session',
      completedAt: session.completedAt || new Date().toISOString(),
      synced: false,
    };
    const updated = [newSession, ...sessions];
    setLocalData(KEYS.SESSIONS, updated);

    // Update Stats locally
    this.updateStats(newSession.durationMinutes);
    this.notifyListeners({ type: 'sessions_updated', sessions: updated });
    this.syncTasksAndSessionsToCloud();
    return updated;
  }

  // Update overall study statistics & streaks
  getStats() {
    return getLocalData(KEYS.STATS, {
      totalFocusMinutes: 0,
      totalCompletedPomodoros: 0,
      streakDays: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
    });
  }

  updateStats(durationMinutes) {
    const stats = this.getStats();
    const today = new Date().toISOString().split('T')[0];

    let streakDays = stats.streakDays || 1;
    if (stats.lastActiveDate) {
      const lastDate = new Date(stats.lastActiveDate);
      const currentDate = new Date(today);
      const diffDays = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        streakDays += 1;
      } else if (diffDays > 1) {
        streakDays = 1;
      }
    }

    const newStats = {
      totalFocusMinutes: (stats.totalFocusMinutes || 0) + durationMinutes,
      totalCompletedPomodoros: (stats.totalCompletedPomodoros || 0) + 1,
      streakDays,
      lastActiveDate: today,
    };

    setLocalData(KEYS.STATS, newStats);
    this.notifyListeners({ type: 'stats_updated', stats: newStats });
    return newStats;
  }

  // Direct Sync ONLY To-Do items and Study Sessions to Realtime Database
  async syncTasksAndSessionsToCloud() {
    if (!rtdb || !navigator.onLine || this.isSyncing) {
      return;
    }

    try {
      this.isSyncing = true;
      this.notifyListeners({ state: 'syncing' });

      if (auth && !auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (authErr) {
          console.warn('Anonymous sign-in note:', authErr);
        }
      }

      const uid = auth?.currentUser?.uid || 'guest_user';
      const tasks = this.getTasks();
      const sessions = this.getSessions();

      // Convert tasks & sessions to objects
      const tasksObj = {};
      tasks.forEach(t => { tasksObj[t.id] = { ...t, synced: true }; });

      const sessionsObj = {};
      sessions.forEach(s => { sessionsObj[s.id] = { ...s, synced: true }; });

      // Write to both root /tasks, /sessions AND /users/{uid}/tasks, /users/{uid}/sessions
      await Promise.all([
        set(ref(rtdb, 'tasks'), tasksObj),
        set(ref(rtdb, 'sessions'), sessionsObj),
        set(ref(rtdb, `users/${uid}/tasks`), tasksObj),
        set(ref(rtdb, `users/${uid}/sessions`), sessionsObj),
      ]);

      // Mark local items synced
      const markTasksSynced = tasks.map(t => ({ ...t, synced: true }));
      const markSessionsSynced = sessions.map(s => ({ ...s, synced: true }));

      setLocalData(KEYS.TASKS, markTasksSynced);
      setLocalData(KEYS.SESSIONS, markSessionsSynced);

      this.notifyListeners({
        state: 'synced',
        lastSynced: new Date(),
        tasks: markTasksSynced,
        sessions: markSessionsSynced,
      });
    } catch (err) {
      console.error('Realtime DB sync error:', err);
      this.notifyListeners({ state: 'error', error: err.message });
    } finally {
      this.isSyncing = false;
    }
  }

  // Alias for backward compatibility
  async syncWithCloud() {
    return this.syncTasksAndSessionsToCloud();
  }
}

export const storage = new StorageService();
