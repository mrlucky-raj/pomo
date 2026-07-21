import React, { useState, useRef, useEffect } from 'react';
import { Quote } from 'lucide-react';
import { getTheme } from '../../utils/theme';
import { storage } from '../../services/storage';
import { useWidgetInteraction } from '../../hooks/useWidgetInteraction';
import QuoteEditorModal from './QuoteEditorModal';

const DEFAULT_QUOTES = [
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

function QuoteWidget({ themeColor = 'emerald' }) {
  const [quotes, setQuotes] = useState(() => storage.getCustomQuotes(DEFAULT_QUOTES));
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = storage.getActiveQuoteIndex();
    return idx >= 0 && idx < quotes.length ? idx : 0;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const panelRef = useRef(null);
  const theme = getTheme(themeColor);

  const { position, isDragging, isShiftPressed, bind } = useWidgetInteraction({
    initialPosition: { x: 0, y: 0 },
    onOpenControls: () => setIsModalOpen(true),
    positionMode: 'offsetBottomRight',
    panelRef,
  });

  const handleSaveQuotes = (newQuotes) => {
    setQuotes(newQuotes);
    storage.saveCustomQuotes(newQuotes);
  };

  const handleSelectIndex = (idx) => {
    setCurrentIndex(idx);
    storage.setActiveQuoteIndex(idx);
  };

  const current = quotes[currentIndex] || quotes[0] || DEFAULT_QUOTES[0];

  return (
    <>
      <div
        ref={panelRef}
        {...bind}
        style={{
          position: 'fixed',
          right: '24px',
          bottom: '24px',
          transform: `translate(${position.x}px, ${position.y}px)`,
          userSelect: 'none',
        }}
        className={`bg-transparent p-4 max-w-xs w-full text-center relative z-30 select-none group transition-all ${
          isDragging
            ? 'cursor-grabbing'
            : isShiftPressed
            ? 'cursor-grab border border-dashed border-emerald-400/50 rounded-2xl'
            : 'cursor-default'
        }`}
        title="Shift+Drag to move | Ctrl+Click or Long Press to edit"
      >
        {/* Quote Text Content - Minimal Distraction-Free Display */}
        <div className={`flex justify-center mb-1 ${theme.text}`}>
          <Quote className="w-4 h-4 opacity-90" />
        </div>

        <p className="text-xs font-bold text-white italic leading-relaxed px-2 drop-shadow-md">
          "{current.text}"
        </p>
        <p className={`text-[11px] font-extrabold ${theme.textLight} mt-1.5 uppercase tracking-wider drop-shadow`}>
          — {current.author}
        </p>
      </div>

      {/* Quote Editor & Selector Modal */}
      {isModalOpen && (
        <QuoteEditorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          quotes={quotes}
          currentIndex={currentIndex}
          onSelectIndex={handleSelectIndex}
          onSaveQuotes={handleSaveQuotes}
        />
      )}
    </>
  );
}

export default React.memo(QuoteWidget);
