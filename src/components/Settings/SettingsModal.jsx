import React from 'react';
import { X, Settings, Clock, Bell, Zap } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  settings = {},
  onUpdateSettings,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-slate-700/60 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-5">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Timer Preferences</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Timer Durations */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Time Durations (Minutes)</span>
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-2xl text-center">
                <label className="text-[11px] text-slate-400 block mb-1">Focus</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={settings.workDuration ?? 25}
                  onChange={(e) => onUpdateSettings({ workDuration: parseInt(e.target.value, 10) || 25 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-1 text-center font-bold text-sm text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-2xl text-center">
                <label className="text-[11px] text-slate-400 block mb-1">Short Break</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.shortBreakDuration ?? 5}
                  onChange={(e) => onUpdateSettings({ shortBreakDuration: parseInt(e.target.value, 10) || 5 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-1 text-center font-bold text-sm text-cyan-400 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-2xl text-center">
                <label className="text-[11px] text-slate-400 block mb-1">Long Break</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.longBreakDuration ?? 15}
                  onChange={(e) => onUpdateSettings({ longBreakDuration: parseInt(e.target.value, 10) || 15 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-1 text-center font-bold text-sm text-purple-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Auto Start Options */}
          <div className="space-y-3 pt-3 border-t border-slate-700/60">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Automation</span>
            </h3>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800 cursor-pointer">
              <span className="text-xs font-medium text-slate-200">Auto-start Breaks</span>
              <input
                type="checkbox"
                checked={settings.autoStartBreaks ?? false}
                onChange={(e) => onUpdateSettings({ autoStartBreaks: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800 cursor-pointer">
              <span className="text-xs font-medium text-slate-200">Auto-start Pomodoros</span>
              <input
                type="checkbox"
                checked={settings.autoStartPomodoros ?? false}
                onChange={(e) => onUpdateSettings({ autoStartPomodoros: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800 cursor-pointer">
              <span className="text-xs font-medium text-slate-200">Auto-play Background Music on Start</span>
              <input
                type="checkbox"
                checked={settings.autoPlayMusicOnStart ?? false}
                onChange={(e) => onUpdateSettings({ autoPlayMusicOnStart: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
