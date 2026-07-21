import { rtdb, auth } from '../firebase/config';
import { ref, set, onValue } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';

const KEYS = {
  TASKS: 'pomo_tasks_v2',
  FOCUS_SESSIONS: 'pomo_focus_sessions_v2',
  SESSION_TASKS: 'pomo_session_tasks_v2',
  TASK_EVENTS: 'pomo_task_events_v2',
  SETTINGS: 'pomo_settings_v1',
  STATS: 'pomo_stats_v1',
  QUOTES: 'pomo_quotes_v1',
  ACTIVE_QUOTE_INDEX: 'pomo_active_quote_index_v1',
  NOTES: 'pomo_notes_v1',
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
  timerScale: 'normal',
  timerFontSize: '9xl',
  themeColor: 'emerald',
  showTimer: true,
  showTodoList: true,
  showQuotes: true,
  showMusicPlayer: true,
  showNavBtns: true,
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
 * Storage Service — Full FRD Implementation for Firebase Realtime Database
 * Tables: tasks, focus_sessions, session_tasks, task_events
 */
class StorageService {
  constructor() {
    this.isSyncing = false;
    this.listeners = [];
    this.initRealtimeListener();
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

  // --- Realtime DB Live Listener ---
  initRealtimeListener() {
    if (!rtdb) return;

    // Listen for live updates on root database
    try {
      const rootRef = ref(rtdb);
      onValue(rootRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        if (data.tasks) {
          const remoteTasks = Object.values(data.tasks);
          setLocalData(KEYS.TASKS, remoteTasks);
        }
        if (data.focus_sessions) {
          const remoteSessions = Object.values(data.focus_sessions);
          setLocalData(KEYS.FOCUS_SESSIONS, remoteSessions);
        }
        if (data.session_tasks) {
          const remoteSessionTasks = Object.values(data.session_tasks);
          setLocalData(KEYS.SESSION_TASKS, remoteSessionTasks);
        }
        if (data.task_events) {
          const remoteEvents = Object.values(data.task_events);
          setLocalData(KEYS.TASK_EVENTS, remoteEvents);
        }
        if (data.notes) {
          const remoteNotes = Object.values(data.notes);
          setLocalData(KEYS.NOTES, remoteNotes);
        }

        this.notifyListeners({ type: 'realtime_synced' });
      }, (err) => {
        console.warn('Realtime listener note:', err);
      });
    } catch (err) {
      console.warn('Realtime DB listener setup note:', err);
    }
  }

  // --- Settings ---
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

  // --- 1. Tasks Table ---
  getTasks() {
    return getLocalData(KEYS.TASKS, []);
  }

  createTask({ title, description = null, priority = null }) {
    const tasks = this.getTasks();
    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      description,
      status: 'pending', // 'pending' | 'completed' | 'archived'
      priority, // 'low' | 'medium' | 'high' | null
      created_at: new Date().toISOString(),
      completed_at: null,
    };

    const updatedTasks = [newTask, ...tasks];
    setLocalData(KEYS.TASKS, updatedTasks);
    this.notifyListeners({ type: 'tasks_updated', tasks: updatedTasks });
    this.syncAllToCloud();
    return newTask;
  }

  saveTask(taskData) {
    const tasks = this.getTasks();
    const existingIndex = tasks.findIndex(t => t.id === taskData.id);

    let updatedTask;
    if (existingIndex >= 0) {
      updatedTask = { ...tasks[existingIndex], ...taskData };
      tasks[existingIndex] = updatedTask;
    } else {
      updatedTask = {
        id: taskData.id || `task_${Date.now()}`,
        title: taskData.title || 'New Task',
        description: taskData.description || null,
        status: taskData.status || (taskData.completed ? 'completed' : 'pending'),
        priority: taskData.priority || null,
        created_at: taskData.created_at || new Date().toISOString(),
        completed_at: taskData.completed_at || (taskData.completed ? new Date().toISOString() : null),
      };
      tasks.unshift(updatedTask);
    }

    setLocalData(KEYS.TASKS, tasks);
    this.notifyListeners({ type: 'tasks_updated', tasks });
    this.syncAllToCloud();
    return tasks;
  }

  deleteTask(taskId) {
    const tasks = this.getTasks().filter(t => t.id !== taskId);
    const sessionTasks = this.getSessionTasks().filter(st => st.task_id !== taskId);
    const taskEvents = this.getTaskEvents().filter(te => te.task_id !== taskId);

    setLocalData(KEYS.TASKS, tasks);
    setLocalData(KEYS.SESSION_TASKS, sessionTasks);
    setLocalData(KEYS.TASK_EVENTS, taskEvents);

    this.notifyListeners({ type: 'tasks_updated', tasks });
    this.syncAllToCloud();
    return tasks;
  }

  completeTask(taskId, sessionId = null) {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex < 0) return tasks;

    const completedAt = new Date().toISOString();
    const updatedTask = {
      ...tasks[taskIndex],
      status: 'completed',
      completed_at: completedAt,
    };
    tasks[taskIndex] = updatedTask;
    setLocalData(KEYS.TASKS, tasks);

    // Ensure session_tasks relationship exists if during active session
    if (sessionId) {
      this.associateTaskWithSession(sessionId, taskId);
    }

    // Create Task Event
    this.createTaskEvent({
      task_id: taskId,
      session_id: sessionId || null,
      event_type: 'completed',
    });

    this.notifyListeners({ type: 'tasks_updated', tasks });
    this.syncAllToCloud();
    return tasks;
  }

  reopenTask(taskId, sessionId = null) {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex < 0) return tasks;

    const updatedTask = {
      ...tasks[taskIndex],
      status: 'pending',
      completed_at: null,
    };
    tasks[taskIndex] = updatedTask;
    setLocalData(KEYS.TASKS, tasks);

    // Create Task Event
    this.createTaskEvent({
      task_id: taskId,
      session_id: sessionId || null,
      event_type: 'reopened',
    });

    this.notifyListeners({ type: 'tasks_updated', tasks });
    this.syncAllToCloud();
    return tasks;
  }

  // --- 2. Focus Sessions Table ---
  getSessions() {
    return getLocalData(KEYS.FOCUS_SESSIONS, []);
  }

  getActiveSession() {
    const sessions = this.getSessions();
    return sessions.find(s => s.status === 'active') || null;
  }

  startFocusSession() {
    const sessions = this.getSessions();

    // Cancel any existing active session before starting a new one
    const updatedSessions = sessions.map(s => {
      if (s.status === 'active') {
        return {
          ...s,
          status: 'cancelled',
          ended_at: new Date().toISOString(),
        };
      }
      return s;
    });

    const newSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      started_at: new Date().toISOString(),
      ended_at: null,
      duration_seconds: null,
      status: 'active', // 'active' | 'completed' | 'cancelled'
      created_at: new Date().toISOString(),
    };

    const finalSessions = [newSession, ...updatedSessions];
    setLocalData(KEYS.FOCUS_SESSIONS, finalSessions);
    this.notifyListeners({ type: 'sessions_updated', sessions: finalSessions });
    this.syncAllToCloud();
    return newSession;
  }

  endFocusSession(sessionId, elapsedSeconds = null) {
    const sessions = this.getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex < 0) return null;

    const session = sessions[sessionIndex];
    const endedAt = new Date().toISOString();
    const startTime = new Date(session.started_at).getTime();
    const calculatedDuration = Math.max(0, Math.round((new Date(endedAt).getTime() - startTime) / 1000));

    const updatedSession = {
      ...session,
      ended_at: endedAt,
      duration_seconds: elapsedSeconds !== null ? elapsedSeconds : calculatedDuration,
      status: 'completed',
    };

    sessions[sessionIndex] = updatedSession;
    setLocalData(KEYS.FOCUS_SESSIONS, sessions);

    // Update Stats
    const durationMins = Math.round(updatedSession.duration_seconds / 60);
    this.updateStats(durationMins);

    this.notifyListeners({ type: 'sessions_updated', sessions });
    this.syncAllToCloud();
    return updatedSession;
  }

  cancelFocusSession(sessionId) {
    const sessions = this.getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex < 0) return null;

    const updatedSession = {
      ...sessions[sessionIndex],
      ended_at: new Date().toISOString(),
      status: 'cancelled',
    };

    sessions[sessionIndex] = updatedSession;
    setLocalData(KEYS.FOCUS_SESSIONS, sessions);
    this.notifyListeners({ type: 'sessions_updated', sessions });
    this.syncAllToCloud();
    return updatedSession;
  }

  // --- 3. Session Tasks Table ---
  getSessionTasks() {
    return getLocalData(KEYS.SESSION_TASKS, []);
  }

  associateTaskWithSession(sessionId, taskId) {
    if (!sessionId || !taskId) return null;

    const sessionTasks = this.getSessionTasks();
    const exists = sessionTasks.some(st => st.session_id === sessionId && st.task_id === taskId);
    if (exists) return null;

    const newSessionTask = {
      id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      session_id: sessionId,
      task_id: taskId,
      created_at: new Date().toISOString(),
    };

    const updated = [newSessionTask, ...sessionTasks];
    setLocalData(KEYS.SESSION_TASKS, updated);
    this.syncAllToCloud();
    return newSessionTask;
  }

  // --- 4. Task Events Table ---
  getTaskEvents() {
    return getLocalData(KEYS.TASK_EVENTS, []);
  }

  createTaskEvent({ task_id, session_id = null, event_type }) {
    const events = this.getTaskEvents();
    const newEvent = {
      id: `te_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      task_id,
      session_id: session_id || null,
      event_type, // 'completed' | 'reopened'
      created_at: new Date().toISOString(),
    };

    const updated = [newEvent, ...events];
    setLocalData(KEYS.TASK_EVENTS, updated);
    this.syncAllToCloud();
    return newEvent;
  }

  // --- Stats & Analytics ---
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

  getAnalyticsSummary() {
    const sessions = this.getSessions().filter(s => s.status === 'completed');
    const tasks = this.getTasks();
    const events = this.getTaskEvents();

    const totalFocusTimeSeconds = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
    
    const todayStr = new Date().toISOString().split('T')[0];
    const focusTimeTodaySeconds = sessions
      .filter(s => s.started_at && s.started_at.split('T')[0] === todayStr)
      .reduce((sum, s) => sum + (s.duration_seconds || 0), 0);

    const completedEvents = events.filter(e => e.event_type === 'completed');
    const tasksCompletedInSessions = completedEvents.filter(e => e.session_id !== null).length;
    const tasksCompletedOutsideSessions = completedEvents.filter(e => e.session_id === null).length;

    return {
      totalFocusTimeSeconds,
      focusTimeTodaySeconds,
      totalCompletedSessions: sessions.length,
      totalCompletedTasks: tasks.filter(t => t.status === 'completed').length,
      tasksCompletedInSessions,
      tasksCompletedOutsideSessions,
      avgSessionDurationSeconds: sessions.length > 0 ? Math.round(totalFocusTimeSeconds / sessions.length) : 0,
    };
  }

  // --- Quote Persistence Helpers ---
  getCustomQuotes(fallbackQuotes = []) {
    return getLocalData(KEYS.QUOTES, fallbackQuotes);
  }

  saveCustomQuotes(quotes) {
    setLocalData(KEYS.QUOTES, quotes);
    this.notifyListeners({ type: 'quotes_updated', quotes });
    return quotes;
  }

  getActiveQuoteIndex() {
    return getLocalData(KEYS.ACTIVE_QUOTE_INDEX, 0);
  }

  setActiveQuoteIndex(index) {
    setLocalData(KEYS.ACTIVE_QUOTE_INDEX, index);
    this.notifyListeners({ type: 'quote_index_updated', index });
    return index;
  }

  // --- Notes Persistence Helpers ---
  getNotes() {
    return getLocalData(KEYS.NOTES, []);
  }

  saveNote(noteData) {
    const notes = this.getNotes();
    const now = new Date().toISOString();

    let updatedNotes;
    if (noteData.id) {
      const exists = notes.some(n => n.id === noteData.id);
      if (exists) {
        updatedNotes = notes.map(n =>
          n.id === noteData.id ? { ...n, ...noteData, updatedAt: now } : n
        );
      } else {
        updatedNotes = [{ ...noteData, createdAt: noteData.createdAt || now, updatedAt: now }, ...notes];
      }
    } else {
      const newNote = {
        id: `note_${Date.now()}`,
        title: noteData.title || 'Untitled Note',
        content: noteData.content || '',
        createdAt: now,
        updatedAt: now,
      };
      updatedNotes = [newNote, ...notes];
    }

    setLocalData(KEYS.NOTES, updatedNotes);
    this.notifyListeners({ type: 'notes_updated', notes: updatedNotes });
    if (navigator.onLine) this.syncAllToCloud();
    return updatedNotes;
  }

  deleteNote(noteId) {
    const notes = this.getNotes().filter(n => n.id !== noteId);
    setLocalData(KEYS.NOTES, notes);
    this.notifyListeners({ type: 'notes_updated', notes });
    if (navigator.onLine) this.syncAllToCloud();
    return notes;
  }

  // --- Realtime Database Cloud Sync ---
  async syncAllToCloud() {
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

      const tasks = this.getTasks();
      const focusSessions = this.getSessions();
      const sessionTasks = this.getSessionTasks();
      const taskEvents = this.getTaskEvents();
      const notes = this.getNotes();

      // Convert arrays to indexed objects for Realtime DB
      const tasksObj = {};
      tasks.forEach(t => { tasksObj[t.id] = t; });

      const sessionsObj = {};
      focusSessions.forEach(s => { sessionsObj[s.id] = s; });

      const sessionTasksObj = {};
      sessionTasks.forEach(st => { sessionTasksObj[st.id] = st; });

      const eventsObj = {};
      taskEvents.forEach(te => { eventsObj[te.id] = te; });

      const notesObj = {};
      notes.forEach(n => { notesObj[n.id] = n; });

      // Save directly to Firebase RTDB top-level tables
      await Promise.all([
        set(ref(rtdb, 'tasks'), tasksObj),
        set(ref(rtdb, 'focus_sessions'), sessionsObj),
        set(ref(rtdb, 'session_tasks'), sessionTasksObj),
        set(ref(rtdb, 'task_events'), eventsObj),
        set(ref(rtdb, 'notes'), notesObj),
      ]);

      this.notifyListeners({
        state: 'synced',
        lastSynced: new Date(),
      });
    } catch (err) {
      console.error('Firebase Realtime Database sync error:', err);
      this.notifyListeners({ state: 'error', error: err.message });
    } finally {
      this.isSyncing = false;
    }
  }

  // Alias for backwards compatibility
  async syncWithCloud() {
    return this.syncAllToCloud();
  }

  // Compatibility helper method for older UI calls
  addSession(sessionData) {
    const active = this.getActiveSession() || this.startFocusSession();
    const durationSeconds = (sessionData.durationMinutes || 25) * 60;
    return this.endFocusSession(active.id, durationSeconds);
  }
}

export const storage = new StorageService();
