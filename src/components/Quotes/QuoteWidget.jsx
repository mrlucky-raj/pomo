import React, { useState, useRef } from 'react';
import { Quote, RefreshCw, GripHorizontal } from 'lucide-react';

const FOCUS_QUOTES = [
  { text: "Focus is a muscle. The more you practice, the stronger your mind becomes.", author: "Cal Newport" },
  { text: "It’s not that I’m so smart, it’s just that I stay with problems longer.", author: "Albert Einstein" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "Do what you have to do until you can do what you want to do.", author: "Oprah Winfrey" },
  { text: "Concentrate all your thoughts upon the work in hand. The sun’s rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
  { text: "You don't need more time, you need more focus.", author: "Anonymous" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Deep work is the superpower of the 21st century.", author: "Cal Newport" },
];

export default function QuoteWidget() {
  const [index, setIndex] = useState(0);

  // Position offset relative to bottom-right corner default location
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });
  const panelRef = useRef(null);

  const handlePointerDown = (e) => {
    if (e.button !== 0) return;

    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: offset.x,
      startY: offset.y,
    };

    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;

    let newX = dragStartRef.current.startX + deltaX;
    let newY = dragStartRef.current.startY + deltaY;

    // Viewport bounds clamping relative to bottom-right anchor
    const panelWidth = panelRef.current ? panelRef.current.offsetWidth : 320;
    const panelHeight = panelRef.current ? panelRef.current.offsetHeight : 150;

    const minX = -(window.innerWidth - panelWidth - 30);
    const maxX = 0;
    const minY = -(window.innerHeight - panelHeight - 30);
    const maxY = 0;

    newX = Math.max(minX, Math.min(maxX, newX));
    newY = Math.max(minY, Math.min(maxY, newY));

    setOffset({ x: newX, y: newY });
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
  };

  const shuffleQuote = (e) => {
    e.stopPropagation();
    setIndex((prev) => (prev + 1) % FOCUS_QUOTES.length);
  };

  const current = FOCUS_QUOTES[index];

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        right: '24px',
        bottom: '24px',
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        userSelect: isDragging ? 'none' : 'auto',
      }}
      className="bg-slate-900/90 rounded-2xl p-4 max-w-xs w-full text-center relative border border-slate-800 z-30 shadow-xl"
    >
      {/* Draggable Header Handle */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`flex items-center justify-between pb-2 mb-2 border-b border-slate-800 select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        title="Click and drag to move quote widget"
      >
        <div className="flex items-center space-x-1.5 text-slate-400">
          <GripHorizontal className="w-4 h-4 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Daily Quote</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={shuffleQuote}
            onPointerDown={(e) => e.stopPropagation()}
            title="New Quote"
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quote Text Content */}
      <div className="flex justify-center mb-1 text-emerald-400">
        <Quote className="w-4 h-4 opacity-70" />
      </div>

      <p className="text-xs font-medium text-slate-100 italic leading-relaxed px-2">
        "{current.text}"
      </p>
      <p className="text-[10px] font-bold text-emerald-300/80 mt-1.5 uppercase tracking-wider">
        — {current.author}
      </p>
    </div>
  );
}
