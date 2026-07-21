import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music,
  ListMusic,
  ChevronDown,
  CheckSquare,
  FileText,
  Image,
  Settings,
} from 'lucide-react';
import { getTheme } from '../../utils/theme';
import songsData from '../../data/songs.json';

// Export hardcoded songs JSON from media/music
export const MUSIC_TRACKS = songsData;

function AudioPlayerUI({
  isPlaying,
  currentTrack,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  onSelectTrack,
  onOpenBackground,
  onOpenSettings,
  onToggleNotesWidget,
  showNotesWidget = true,
  onToggleTodoList,
  showTodoList = true,
  themeColor = 'emerald',
}) {
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const theme = getTheme(themeColor);

  return (
    <div className="relative z-30 flex flex-col items-start select-none">
      {/* Expanded Song Playlist Drawer */}
      {isPlaylistOpen && (
        <div className="mb-2 w-72 p-3 rounded-2xl glass-panel shadow-2xl border border-white/15 backdrop-blur-xl animate-fadeIn">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <ListMusic className={`w-3.5 h-3.5 ${theme.text}`} />
              <span>Song Playlist ({MUSIC_TRACKS.length})</span>
            </span>
            <button
              onClick={() => setIsPlaylistOpen(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded-md"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {MUSIC_TRACKS.map((track, idx) => {
              const isSelected = currentTrack?.src === track.src || currentTrack?.id === track.id;
              return (
                <div
                  key={track.id || idx}
                  onClick={() => {
                    if (onSelectTrack) onSelectTrack(idx);
                  }}
                  className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? `${theme.bgGlass} ${theme.border} text-white`
                      : 'bg-slate-900/40 border-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <Music className={`w-3.5 h-3.5 shrink-0 ${isSelected ? theme.text : 'text-slate-400'}`} />
                    <div className="truncate">
                      <p className="text-xs font-semibold truncate leading-tight">{track.title}</p>
                      <p className="text-[10px] text-slate-400 font-mono leading-tight">{track.artist}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0 ml-2">
                    {track.duration || 'MP3'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unified Bottom-Left Horizontal Toolbar & Audio Dock */}
      <div className="flex items-center space-x-2.5 px-3.5 py-2 rounded-2xl glass-panel shadow-2xl border border-white/15 backdrop-blur-xl transition-all">
        {/* Minimal Track Info — Click Title to Toggle Playlist */}
        <div
          onClick={() => setIsPlaylistOpen((prev) => !prev)}
          className="flex flex-col max-w-[110px] sm:max-w-[150px] pr-2.5 border-r border-white/10 min-w-0 cursor-pointer group"
          title="Click track title to open song playlist"
        >
          <span className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors truncate leading-tight">
            {currentTrack?.title || 'No Track'}
          </span>
          <span className={`text-[10px] font-mono leading-tight font-bold ${isPlaying ? theme.text : 'text-slate-400'}`}>
            {isPlaying ? 'Playing ♪' : 'Paused'}
          </span>
        </div>

        {/* Player Controls (Prev, Play/Pause, Next) */}
        <div className="flex items-center space-x-1 pr-2.5 border-r border-white/10">
          <button
            onClick={onPrevTrack}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Previous Track"
          >
            <SkipBack className="w-3.5 h-3.5 fill-current" />
          </button>

          <button
            onClick={onTogglePlay}
            className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
              isPlaying
                ? `${theme.bg} ${theme.textDark} ${theme.bgHover} ${theme.glow}`
                : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
          </button>

          <button
            onClick={onNextTrack}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Next Track"
          >
            <SkipForward className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>

        {/* Unified Tool Buttons Bar (To-Do Toggle, Sticky Quick Note Toggle, Background, Settings) */}
        <div className="flex items-center space-x-1">
          {/* To-Do Toggle Button */}
          {onToggleTodoList && (
            <button
              onClick={onToggleTodoList}
              className={`p-2 rounded-xl border transition-all ${
                showTodoList
                  ? `${theme.bgLight} ${theme.textLight} ${theme.border}`
                  : 'bg-slate-900/40 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              title={showTodoList ? 'Hide To-do Widget' : 'Show To-do Widget'}
            >
              <CheckSquare className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Sticky Quick Note Toggle Button */}
          {onToggleNotesWidget && (
            <button
              onClick={onToggleNotesWidget}
              className={`p-2 rounded-xl border transition-all ${
                showNotesWidget
                  ? `${theme.bgLight} ${theme.textLight} ${theme.border}`
                  : 'bg-slate-900/40 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              title={showNotesWidget ? 'Hide Quick Note Widget' : 'Show Quick Note Widget'}
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Ambient Background Picker */}
          {onOpenBackground && (
            <button
              onClick={onOpenBackground}
              className="p-2 rounded-xl bg-slate-900/40 border border-white/5 text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
              title="Change Ambient Background"
            >
              <Image className="w-3.5 h-3.5" />
            </button>
          )}

          {/* App & Timer Settings */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-900/40 border border-white/5 text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
              title="Preferences & Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(AudioPlayerUI);
