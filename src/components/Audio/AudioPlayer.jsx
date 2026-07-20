import React from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

export const MUSIC_TRACKS = [
  { id: 'track_1', title: 'Lo-Fi Chill Focus', src: '/media/music/23242.mp3' },
  { id: 'track_2', title: 'Aesthetic Ambient Flow', src: '/media/music/34243.mp3' },
  { id: 'track_3', title: 'Deep Study Wave', src: '/media/music/23242.mp3' },
];

export default function AudioPlayerUI({
  isPlaying,
  currentTrack,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
}) {
  return (
    <div className="relative z-30">
      {/* Clean, Coverless & Iconless Mini Music Player Dock */}
      <div className="flex items-center space-x-2 px-3.5 py-2 rounded-2xl glass-panel shadow-xl border border-slate-700/60 transition-all">
        {/* Minimal Track Title */}
        <div className="flex flex-col max-w-[130px] sm:max-w-[160px] pr-2 border-r border-slate-700/50 min-w-0">
          <span className="text-xs font-semibold text-white truncate leading-tight">{currentTrack.title}</span>
          <span className="text-[10px] text-slate-400 font-mono leading-tight">{isPlaying ? 'Playing' : 'Paused'}</span>
        </div>

        {/* Player Controls (Prev, Play/Pause, Next) */}
        <div className="flex items-center space-x-1">
          <button
            onClick={onPrevTrack}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Previous Track"
          >
            <SkipBack className="w-3.5 h-3.5 fill-current" />
          </button>

          <button
            onClick={onTogglePlay}
            className={`p-2 rounded-full transition-all flex items-center justify-center ${
              isPlaying
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
          </button>

          <button
            onClick={onNextTrack}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Next Track"
          >
            <SkipForward className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}
