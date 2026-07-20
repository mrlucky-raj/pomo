import React from 'react';
import { Flame, Clock, CheckCircle2, Calendar, Award, Sparkles, TrendingUp, BookOpen, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function StatsPage({ stats = {}, sessions = [], tasks = [] }) {
  const totalMinutes = stats.totalFocusMinutes || 0;
  const hours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;
  const totalCompletedPomos = stats.totalCompletedPomodoros || 0;
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const streakDays = stats.streakDays || 1;

  // Prepare last 7 days chart data
  const getLast7DaysData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

      // Calculate focus minutes on this date
      const minutesOnDay = sessions
        .filter(s => s.completedAt && s.completedAt.split('T')[0] === dateStr)
        .reduce((acc, s) => acc + (s.durationMinutes || 25), 0);

      days.push({
        day: dayLabel,
        minutes: minutesOnDay,
        date: dateStr,
      });
    }
    return days;
  };

  const chartData = getLast7DaysData();

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 pb-24 text-slate-100 animate-fadeIn">
      {/* Top Banner */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <span>Study Analytics & States</span>
          <TrendingUp className="w-6 h-6 text-emerald-400" />
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Track your focus performance, streak records, study sessions, and task completions.
        </p>
      </div>

      {/* Metric Highlight Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Total Study Time */}
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 shadow-lg">
          <div className="flex items-center space-x-2 text-emerald-400 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Total Studied</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {hours}<span className="text-sm text-emerald-400 font-normal">h</span> {remainingMins}<span className="text-sm text-emerald-400 font-normal">m</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Accumulated focus hours</p>
        </div>

        {/* Card 2: Streak */}
        <div className="glass-panel p-5 rounded-2xl border border-amber-500/20 shadow-lg">
          <div className="flex items-center space-x-2 text-amber-400 mb-2">
            <Flame className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Study Streak</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {streakDays} <span className="text-base text-amber-400 font-normal">Days 🔥</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Daily consistency</p>
        </div>

        {/* Card 3: Completed Pomodoros */}
        <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 shadow-lg">
          <div className="flex items-center space-x-2 text-cyan-400 mb-2">
            <Award className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Pomodoros</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            🍅 {totalCompletedPomos}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Focus intervals</p>
        </div>

        {/* Card 4: Tasks Done */}
        <div className="glass-panel p-5 rounded-2xl border border-purple-500/20 shadow-lg">
          <div className="flex items-center space-x-2 text-purple-400 mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Tasks Done</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {completedTasksCount} / {tasks.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {tasks.length > 0 ? `${Math.round((completedTasksCount / tasks.length) * 100)}% completed` : 'No tasks yet'}
          </p>
        </div>
      </div>

      {/* Main Graph & Task Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left 2 Columns: 7 Days Focus Activity Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Weekly Focus Time (Minutes)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Last 7 Days</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '14px', color: '#fff', fontSize: '12px' }}
                  formatter={(val) => [`${val} mins`, 'Study Duration']}
                />
                <Bar dataKey="minutes" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.minutes > 0 ? '#10b981' : '#334155'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Column: Task Completion Progress Bar */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Task Progress</span>
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-300">Completion Ratio</span>
                  <span className="text-emerald-400">
                    {tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${tasks.length > 0 ? (completedTasksCount / tasks.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Tasks:</span>
                  <span className="font-semibold text-white">{tasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Completed:</span>
                  <span className="font-semibold text-emerald-400">{completedTasksCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pending:</span>
                  <span className="font-semibold text-amber-400">{tasks.length - completedTasksCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Focus Session Log Table */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Completed Session Log</span>
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs italic">
              No completed sessions recorded yet. Finish a Pomodoro timer session to start logging!
            </div>
          ) : (
            sessions.slice(0, 15).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                    {s.durationMinutes}m
                  </span>
                  <div className="truncate">
                    <p className="font-semibold text-slate-100 truncate">{s.taskTitle || 'Focus Session'}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(s.completedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-semibold ${
                  s.synced ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {s.synced ? 'Realtime DB' : 'Local Queue'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
