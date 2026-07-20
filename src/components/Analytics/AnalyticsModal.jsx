import React from 'react';
import { X, Flame, Clock, CheckCircle2, Calendar, Award, Sparkles, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AnalyticsModal({
  isOpen,
  onClose,
  stats = {},
  sessions = [],
  tasks = [],
}) {
  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-slate-700/60 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Study Analytics & Summary</h2>
              <p className="text-xs text-slate-400">Track your focus hours, completed tasks, and streak</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlight Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {/* Card 1: Total Study Time */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center space-x-2 text-emerald-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-semibold">Total Study</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {hours}h {remainingMins}m
            </div>
          </div>

          {/* Card 2: Streak */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center space-x-2 text-amber-400 mb-1">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-semibold">Day Streak</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {streakDays} {streakDays === 1 ? 'Day' : 'Days'} 🔥
            </div>
          </div>

          {/* Card 3: Completed Pomodoros */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center space-x-2 text-cyan-400 mb-1">
              <Award className="w-4 h-4" />
              <span className="text-xs font-semibold">Pomodoros</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">
              🍅 {totalCompletedPomos}
            </div>
          </div>

          {/* Card 4: Tasks Done */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center space-x-2 text-purple-400 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-semibold">Tasks Done</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {completedTasksCount} / {tasks.length}
            </div>
          </div>
        </div>

        {/* 7 Days Focus Activity Chart */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl mb-6">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Focus Activity (Minutes Last 7 Days)</span>
          </h3>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  formatter={(val) => [`${val} mins`, 'Focus Time']}
                />
                <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.minutes > 0 ? '#22c55e' : '#334155'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Study Session History Table */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Completed Session Log</span>
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {sessions.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs italic">
                No completed study sessions logged yet. Complete a Pomodoro timer to start tracking!
              </div>
            ) : (
              sessions.slice(0, 10).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono">
                      {s.durationMinutes}m
                    </span>
                    <div className="truncate">
                      <p className="font-semibold text-slate-200 truncate">{s.taskTitle || 'Focus Session'}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(s.completedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold ${
                    s.synced ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {s.synced ? 'Synced Cloud' : 'Local Queue'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
