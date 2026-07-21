import React from 'react';
import { Flame, Clock, CheckCircle2, Award, TrendingUp, Layers, CheckSquare, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getTheme } from '../../utils/theme';
import { storage } from '../../services/storage';

export default function StatsPage({ stats = {}, sessions = [], tasks = [], themeColor = 'emerald' }) {
  const analytics = storage.getAnalyticsSummary();
  const theme = getTheme(themeColor);

  const totalMinutes = Math.round(analytics.totalFocusTimeSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;
  const streakDays = stats.streakDays || 1;

  // Prepare last 7 days chart data
  const getLast7DaysData = () => {
    const days = [];
    const allSessions = storage.getSessions();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

      // Calculate focus minutes on this date
      const secondsOnDay = allSessions
        .filter(s => (s.started_at || s.created_at || '').split('T')[0] === dateStr && s.status === 'completed')
        .reduce((acc, s) => acc + (s.duration_seconds || (s.durationMinutes ? s.durationMinutes * 60 : 1500)), 0);

      days.push({
        day: dayLabel,
        minutes: Math.round(secondsOnDay / 60),
        date: dateStr,
      });
    }
    return days;
  };

  const chartData = getLast7DaysData();

  // Enriched session history table
  const allSessions = storage.getSessions();
  const allSessionTasks = storage.getSessionTasks();
  const allTaskEvents = storage.getTaskEvents();
  const allTasks = storage.getTasks();

  const sessionHistory = allSessions.slice(-10).reverse().map(session => {
    const attachedTaskIds = allSessionTasks
      .filter(st => st.session_id === session.id)
      .map(st => st.task_id);
    const tasksWorkedOn = allTasks.filter(t => attachedTaskIds.includes(t.id));

    const completedEventTaskIds = allTaskEvents
      .filter(te => te.session_id === session.id && te.event_type === 'completed')
      .map(te => te.task_id);
    const tasksCompletedInSession = allTasks.filter(t => completedEventTaskIds.includes(t.id));

    return {
      session,
      tasksWorkedOn,
      tasksCompletedInSession,
    };
  });

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 pb-24 text-slate-100 animate-fadeIn">
      {/* Top Banner */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <span>Study Analytics & Focus History</span>
          <TrendingUp className={`w-6 h-6 ${theme.text}`} />
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Detailed metrics from focus_sessions, tasks, session_tasks, and task_events.
        </p>
      </div>

      {/* Metric Highlight Cards (Glassmorphic) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Total Study Time */}
        <div className="glass-panel p-5 rounded-3xl border border-white/15 shadow-xl">
          <div className={`flex items-center space-x-2 ${theme.text} mb-2`}>
            <Clock className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Total Focus Time</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {hours}<span className={`text-sm ${theme.text} font-normal`}>h</span> {remainingMins}<span className={`text-sm ${theme.text} font-normal`}>m</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Today: {Math.round(analytics.focusTimeTodaySeconds / 60)}m
          </p>
        </div>

        {/* Card 2: Streak */}
        <div className="glass-panel p-5 rounded-3xl border border-amber-500/30 shadow-xl">
          <div className="flex items-center space-x-2 text-amber-400 mb-2">
            <Flame className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Study Streak</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {streakDays} <span className="text-base text-amber-400 font-normal">Days 🔥</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Daily consistency record</p>
        </div>

        {/* Card 3: Completed Focus Sessions */}
        <div className="glass-panel p-5 rounded-3xl border border-cyan-500/30 shadow-xl">
          <div className="flex items-center space-x-2 text-cyan-400 mb-2">
            <Award className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Focus Sessions</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {analytics.totalCompletedSessions} <span className="text-sm font-normal text-cyan-300">sessions</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Avg {Math.round(analytics.avgSessionDurationSeconds / 60)}m per session
          </p>
        </div>

        {/* Card 4: Tasks Breakdown */}
        <div className="glass-panel p-5 rounded-3xl border border-purple-500/30 shadow-xl">
          <div className="flex items-center space-x-2 text-purple-400 mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Tasks Done</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {analytics.totalCompletedTasks}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {analytics.tasksCompletedInSessions} in sessions • {analytics.tasksCompletedOutsideSessions} solo
          </p>
        </div>
      </div>

      {/* 7-Day Focus Time Bar Chart (Glassmorphic) */}
      <div className="glass-panel p-6 rounded-3xl border border-white/15 shadow-2xl mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Weekly Focus Time (Minutes)</span>
            </h2>
            <p className="text-xs text-slate-400">Calculated from focus_sessions table duration_seconds</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${theme.bgLight} ${theme.textLight} ${theme.border}`}>
            7-DAY TREND
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(12px)',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
                formatter={(val) => [`${val} mins`, 'Focus Time']}
              />
              <Bar dataKey="minutes" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.minutes > 0 ? theme.hex : '#334155'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Focus Sessions & Tasks Log (Glassmorphic) */}
      <div className="glass-panel p-6 rounded-3xl border border-white/15 shadow-2xl">
        <div className="flex items-center space-x-2 mb-4">
          <Layers className={`w-5 h-5 ${theme.text}`} />
          <h2 className="text-base font-bold text-white">Focus Sessions & Session Tasks History</h2>
        </div>

        {sessionHistory.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm italic">
            No focus sessions logged yet. Start the Pomodoro timer to record your first focus session!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] font-mono text-slate-400 uppercase border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Session ID</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Tasks Worked On (session_tasks)</th>
                  <th className="py-3 px-4">Tasks Completed (task_events)</th>
                  <th className="py-3 px-4 text-right">Started At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sessionHistory.map(({ session, tasksWorkedOn, tasksCompletedInSession }) => (
                  <tr key={session.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-400 truncate max-w-[120px]">
                      {session.id}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded-md ${theme.bgLight} ${theme.textLight}`}>
                        {Math.round((session.duration_seconds || (session.durationMinutes ? session.durationMinutes * 60 : 1500)) / 60)}m
                      </span>
                    </td>
                    <td className="py-3 px-4 uppercase text-[10px] font-mono font-bold tracking-wider">
                      <span className={session.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'}>
                        {session.status || 'completed'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {tasksWorkedOn.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {tasksWorkedOn.map(t => (
                            <span key={t.id} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-200 border border-slate-700">
                              {t.title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">General Focus</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {tasksCompletedInSession.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {tasksCompletedInSession.map(t => (
                            <span key={t.id} className="px-2 py-0.5 rounded bg-emerald-500/20 text-[10px] text-emerald-300 border border-emerald-500/40 font-bold">
                              ✓ {t.title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">None completed</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {session.started_at ? new Date(session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
