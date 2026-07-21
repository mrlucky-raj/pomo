import React from 'react';
import CanvasBackground from './CanvasBackground';
import videosData from '../../data/videos.json';

// Combine video media files from media/video (loaded via json) with procedural and image wallpapers
export const BACKGROUND_OPTIONS = [
  ...videosData.map((v) => ({
    id: v.id,
    name: v.name,
    type: 'video',
    src: v.src,
    fileType: v.fileType,
  })),
  { id: 'canvas_rain', name: 'Procedural Rain Window', type: 'canvas', subType: 'canvas_rain' },
  { id: 'canvas_stars', name: 'Deep Space & Stars', type: 'canvas', subType: 'canvas_stars' },
  { id: 'canvas_fog', name: 'Forest Mist & Fog', type: 'canvas', subType: 'canvas_fog' },
  { id: 'canvas_waves', name: 'Aurora Liquid Waves', type: 'canvas', subType: 'canvas_waves' },
  { id: 'wallpaper_lofi', name: 'Cozy Lo-Fi Study Room', type: 'image', src: 'https://images.unsplash.com/photo-1518655048521-f130df041f66?q=80&w=1920&auto=format&fit=crop' },
  { id: 'wallpaper_mountains', name: 'Minimalist Dark Peaks', type: 'image', src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1920&auto=format&fit=crop' },
  { id: 'wallpaper_coffee', name: 'Ambient Warm Desk', type: 'image', src: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1920&auto=format&fit=crop' },
];

export default function BackgroundContainer({ settings }) {
  const activeBgId = settings?.activeBackground || 'video_208812';
  const currentBg = BACKGROUND_OPTIONS.find(b => b.id === activeBgId) || BACKGROUND_OPTIONS[0];
  const opacity = settings?.backgroundOpacity ?? 0.75;
  const blur = settings?.backgroundBlur ?? 0;

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {/* 1. Video Background */}
      {currentBg.type === 'video' && (
        <video
          key={currentBg.src}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{ filter: `blur(${blur}px)` }}
        >
          <source src={currentBg.src} type={currentBg.fileType || 'video/mp4'} />
          <source src={currentBg.src} type="video/mp4" />
          <source src={currentBg.src} type="video/quicktime" />
        </video>
      )}

      {/* 2. Canvas Procedural Background */}
      {currentBg.type === 'canvas' && (
        <CanvasBackground type={currentBg.subType} />
      )}

      {/* 3. Image Wallpaper */}
      {currentBg.type === 'image' && (
        <div
          key={currentBg.src}
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-1000"
          style={{
            backgroundImage: `url(${currentBg.src})`,
            filter: `blur(${blur}px)`,
          }}
        />
      )}

      {/* 4. Overlay for text & UI contrast */}
      <div
        className="absolute inset-0 bg-slate-950 transition-opacity duration-500"
        style={{ opacity: 1 - opacity }}
      />
    </div>
  );
}
