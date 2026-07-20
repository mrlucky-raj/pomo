import React from 'react';
import { X, Image, Video, Sparkles, Sliders, Eye } from 'lucide-react';
import { BACKGROUND_OPTIONS } from './BackgroundContainer';

export default function BackgroundPickerModal({
  isOpen,
  onClose,
  settings = {},
  onUpdateSettings,
}) {
  if (!isOpen) return null;

  const activeId = settings.activeBackground || 'canvas_rain';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-slate-700/60 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-5">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Background & Environment</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Opacity & Blur Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 mb-6">
          <div>
            <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1.5">
              <span className="flex items-center space-x-1">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Background Brightness</span>
              </span>
              <span>{Math.round((settings.backgroundOpacity ?? 0.85) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={settings.backgroundOpacity ?? 0.85}
              onChange={(e) => onUpdateSettings({ backgroundOpacity: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1.5">
              <span className="flex items-center space-x-1">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Background Blur</span>
              </span>
              <span>{settings.backgroundBlur ?? 0}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={settings.backgroundBlur ?? 0}
              onChange={(e) => onUpdateSettings({ backgroundBlur: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Background Selection Grid */}
        <div className="space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Select Ambient Environment
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {BACKGROUND_OPTIONS.map((bg) => {
              const isActive = activeId === bg.id;
              return (
                <button
                  key={bg.id}
                  onClick={() => onUpdateSettings({ activeBackground: bg.id })}
                  className={`group relative rounded-2xl overflow-hidden border p-3 text-left transition-all duration-300 h-28 flex flex-col justify-between ${
                    isActive
                      ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-500/10 shadow-lg'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="p-1.5 rounded-lg bg-slate-950/80 text-slate-300 border border-slate-800">
                      {bg.type === 'video' ? <Video className="w-3.5 h-3.5 text-purple-400" /> : bg.type === 'canvas' ? <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> : <Image className="w-3.5 h-3.5 text-emerald-400" />}
                    </span>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold">
                        Active
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                      {bg.name}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                      {bg.type}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
