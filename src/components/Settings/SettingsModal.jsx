import React from 'react';
import { X, Settings, Clock, Palette, Eye, Maximize2, Zap } from 'lucide-react';
import { getTheme } from '../../utils/theme';

export default function SettingsModal({
  isOpen,
  onClose,
  settings = {},
  onUpdateSettings,
}) {
  if (!isOpen) return null;

  const activeTheme = getTheme(settings.themeColor);

  const THEMES = [
    { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-500' },
    { id: 'cyan', name: 'Cyan', bg: 'bg-cyan-500' },
    { id: 'purple', name: 'Purple', bg: 'bg-purple-500' },
    { id: 'rose', name: 'Rose', bg: 'bg-rose-500' },
    { id: 'amber', name: 'Amber', bg: 'bg-amber-500' },
    { id: 'orange', name: 'Orange', bg: 'bg-orange-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* Clean & Minimal Glassmorphic Settings Panel */}
      <div className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-white/20 max-h-[90vh] overflow-y-auto flex flex-col justify-between text-slate-100">
        <div>
          {/* Minimal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
            <div className="flex items-center space-x-2.5">
              <div className={`p-2 rounded-xl ${activeTheme.bgLight} ${activeTheme.border}`}>
                <Settings className={`w-5 h-5 ${activeTheme.text}`} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Settings</h2>
                <p className="text-xs text-slate-400">Customize timer size, theme, and durations</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-5">
            {/* 1. Single Unified Timer Display Size Range Slider */}
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/10 space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <Maximize2 className={`w-4 h-4 ${activeTheme.text}`} />
                  <span>Timer Scale & Digit Size</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  {settings.timerDisplaySize ?? 100}%
                </span>
              </div>
              <input
                type="range"
                min="60"
                max="160"
                step="5"
                value={settings.timerDisplaySize ?? 100}
                onChange={(e) => onUpdateSettings({ timerDisplaySize: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>

            {/* 2. Theme Color Picker */}
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/10 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <Palette className={`w-3.5 h-3.5 ${activeTheme.text}`} />
                <span>Theme Accent Color</span>
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {THEMES.map((themeItem) => {
                  const isSel = (settings.themeColor || 'emerald') === themeItem.id;
                  return (
                    <button
                      key={themeItem.id}
                      onClick={() => onUpdateSettings({ themeColor: themeItem.id })}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                        isSel
                          ? 'bg-white/15 text-white border-white/40 shadow-md'
                          : 'bg-slate-900/40 text-slate-400 border-white/5 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${themeItem.bg}`} />
                      <span className="text-[11px]">{themeItem.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Timer Durations */}
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/10 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <Clock className={`w-3.5 h-3.5 ${activeTheme.text}`} />
                <span>Durations (Minutes)</span>
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/10 text-center">
                  <label className="text-[10px] text-slate-400 block mb-0.5">Focus</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={settings.workDuration ?? 25}
                    onChange={(e) => onUpdateSettings({ workDuration: parseInt(e.target.value, 10) || 25 })}
                    className={`w-full bg-transparent border-b border-white/20 py-0.5 text-center font-bold text-sm ${activeTheme.text} focus:outline-none`}
                  />
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/10 text-center">
                  <label className="text-[10px] text-slate-400 block mb-0.5">Short Break</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.shortBreakDuration ?? 5}
                    onChange={(e) => onUpdateSettings({ shortBreakDuration: parseInt(e.target.value, 10) || 5 })}
                    className="w-full bg-transparent border-b border-white/20 py-0.5 text-center font-bold text-sm text-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/10 text-center">
                  <label className="text-[10px] text-slate-400 block mb-0.5">Long Break</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.longBreakDuration ?? 15}
                    onChange={(e) => onUpdateSettings({ longBreakDuration: parseInt(e.target.value, 10) || 15 })}
                    className="w-full bg-transparent border-b border-white/20 py-0.5 text-center font-bold text-sm text-purple-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 4. Workspace Widgets Visibility */}
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/10 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span>Show / Hide Workspace Widgets</span>
              </span>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/40 border border-white/5 cursor-pointer">
                  <span className="text-xs text-slate-200">Timer</span>
                  <input
                    type="checkbox"
                    checked={settings.showTimer ?? true}
                    onChange={(e) => onUpdateSettings({ showTimer: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/40 border border-white/5 cursor-pointer">
                  <span className="text-xs text-slate-200">Quick Tasks</span>
                  <input
                    type="checkbox"
                    checked={settings.showTodoList ?? true}
                    onChange={(e) => onUpdateSettings({ showTodoList: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/40 border border-white/5 cursor-pointer">
                  <span className="text-xs text-slate-200">Daily Quote</span>
                  <input
                    type="checkbox"
                    checked={settings.showQuotes ?? true}
                    onChange={(e) => onUpdateSettings({ showQuotes: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/40 border border-white/5 cursor-pointer">
                  <span className="text-xs text-slate-200">Music Player</span>
                  <input
                    type="checkbox"
                    checked={settings.showMusicPlayer ?? true}
                    onChange={(e) => onUpdateSettings({ showMusicPlayer: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* 5. Automation */}
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/10 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Automation</span>
              </span>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/40 border border-white/5 cursor-pointer">
                  <span className="text-xs text-slate-200">Auto-start Breaks</span>
                  <input
                    type="checkbox"
                    checked={settings.autoStartBreaks ?? false}
                    onChange={(e) => onUpdateSettings({ autoStartBreaks: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/40 border border-white/5 cursor-pointer">
                  <span className="text-xs text-slate-200">Auto-start Pomodoros</span>
                  <input
                    type="checkbox"
                    checked={settings.autoStartPomodoros ?? false}
                    onChange={(e) => onUpdateSettings({ autoStartPomodoros: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Done Button */}
        <div className="pt-4 border-t border-white/10 mt-6 flex justify-end">
          <button
            onClick={onClose}
            className={`px-7 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider ${activeTheme.bg} ${activeTheme.textDark} ${activeTheme.bgHover} ${activeTheme.glow} transition-all`}
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
