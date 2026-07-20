import React, { useState } from 'react';
import { X, Plus, Trash2, CheckCircle2, Circle, Sparkles, Filter, Tag } from 'lucide-react';

export default function TaskDrawerModal({
  isOpen,
  onClose,
  tasks = [],
  activeTaskId,
  onSelectActiveTask,
  onSaveTask,
  onDeleteTask,
}) {
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed'
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Study');
  const [estimatedPomos, setEstimatedPomos] = useState(2);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSaveTask({
      id: `task_${Date.now()}`,
      title: title.trim(),
      category,
      estimatedPomos: Number(estimatedPomos) || 1,
      completedPomos: 0,
      completed: false,
      createdAt: new Date().toISOString(),
    });

    setTitle('');
    setEstimatedPomos(2);
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border border-slate-700/60 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Focus Tasks & Goals</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Task Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you want to accomplish?"
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />

          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="Study">📚 Study</option>
                <option value="Work">💻 Work</option>
                <option value="Coding">⚡ Coding</option>
                <option value="Reading">📖 Reading</option>
                <option value="Personal">🌱 Personal</option>
              </select>
            </div>

            <div className="w-32">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Est. Pomodoros</label>
              <input
                type="number"
                min="1"
                max="20"
                value={estimatedPomos}
                onChange={(e) => setEstimatedPomos(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 text-center focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="self-end">
              <button
                type="submit"
                disabled={!title.trim()}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg transition-all disabled:opacity-40"
              >
                Add Goal
              </button>
            </div>
          </div>
        </form>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 my-4">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
          {['all', 'active', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs capitalize transition-all ${
                filter === f
                  ? 'bg-slate-200 text-slate-950 font-semibold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Task Cards List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-72">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No tasks found in this view.
            </div>
          ) : (
            filteredTasks.map((t) => {
              const isActive = t.id === activeTaskId;
              return (
                <div
                  key={t.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <button
                      onClick={() => onSaveTask({ ...t, completed: !t.completed })}
                      className="mt-0.5 text-slate-400 hover:text-emerald-400"
                    >
                      {t.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium truncate ${t.completed ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                          {t.title}
                        </span>
                        {t.category && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                            {t.category}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center space-x-2 font-mono">
                        <span>🍅 {t.completedPomos || 0} / {t.estimatedPomos || 1} Pomodoros</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-3">
                    {!t.completed && (
                      <button
                        onClick={() => onSelectActiveTask(t.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {isActive ? 'Current' : 'Select'}
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteTask(t.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
