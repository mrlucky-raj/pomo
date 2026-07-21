import React, { useState, useEffect, useRef } from 'react';
import { FileText, Save, Check, Plus, Trash2, ChevronDown, List } from 'lucide-react';
import { storage } from '../../services/storage';
import { useWidgetInteraction } from '../../hooks/useWidgetInteraction';
import { getTheme } from '../../utils/theme';

function QuickNotesWidget({ themeColor = 'emerald' }) {
  const [allNotes, setAllNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [noteTitle, setNoteTitle] = useState('Quick Note');
  const [noteContent, setNoteContent] = useState('');
  const [savedStatus, setSavedStatus] = useState(false);
  const [isNotesDropdownOpen, setIsNotesDropdownOpen] = useState(false);

  const panelRef = useRef(null);
  const theme = getTheme(themeColor);

  const { position, isDragging, isShiftPressed, bind } = useWidgetInteraction({
    initialPosition: { x: 0, y: 0 },
    onOpenControls: () => setIsNotesDropdownOpen((prev) => !prev),
    positionMode: 'offsetRightCenter',
    panelRef,
  });

  // Sync notes list from storage on mount & storage events
  const loadNotesFromStorage = () => {
    const loaded = storage.getNotes();
    setAllNotes(loaded);
    if (loaded && loaded.length > 0) {
      if (!activeNoteId || !loaded.some((n) => n.id === activeNoteId)) {
        setActiveNoteId(loaded[0].id);
        setNoteTitle(loaded[0].title || 'Quick Note');
        setNoteContent(loaded[0].content || '');
      } else {
        const active = loaded.find((n) => n.id === activeNoteId);
        if (active) {
          setNoteTitle(active.title || 'Quick Note');
          setNoteContent(active.content || '');
        }
      }
    } else {
      // Create default initial note if storage is empty
      const initial = storage.saveNote({
        title: 'Sticky Focus Note',
        content: '',
      });
      setAllNotes(initial);
      if (initial && initial.length > 0) {
        setActiveNoteId(initial[0].id);
        setNoteTitle(initial[0].title);
        setNoteContent(initial[0].content);
      }
    }
  };

  useEffect(() => {
    loadNotesFromStorage();

    const unsubscribe = storage.subscribe((event) => {
      if (event?.type === 'notes_updated' || event?.type === 'realtime_synced') {
        const current = storage.getNotes();
        setAllNotes(current);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSelectNote = (note) => {
    setActiveNoteId(note.id);
    setNoteTitle(note.title || 'Quick Note');
    setNoteContent(note.content || '');
    setIsNotesDropdownOpen(false);
  };

  const handleCreateNewNote = (e) => {
    if (e) e.stopPropagation();
    const newNote = {
      title: `Note #${allNotes.length + 1}`,
      content: '',
    };
    const updated = storage.saveNote(newNote);
    setAllNotes(updated);
    if (updated && updated.length > 0) {
      setActiveNoteId(updated[0].id);
      setNoteTitle(updated[0].title);
      setNoteContent(updated[0].content);
    }
    setIsNotesDropdownOpen(false);
  };

  const handleSave = () => {
    const updated = storage.saveNote({
      id: activeNoteId || `note_${Date.now()}`,
      title: noteTitle.trim() || 'Quick Note',
      content: noteContent,
    });
    setAllNotes(updated);
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 1800);
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setNoteContent(newContent);
    storage.saveNote({
      id: activeNoteId || `note_${Date.now()}`,
      title: noteTitle.trim() || 'Quick Note',
      content: newContent,
    });
  };

  const handleDeleteActiveNote = (e) => {
    if (e) e.stopPropagation();
    if (!activeNoteId) return;
    const updated = storage.deleteNote(activeNoteId);
    setAllNotes(updated);
    if (updated && updated.length > 0) {
      setActiveNoteId(updated[0].id);
      setNoteTitle(updated[0].title || 'Quick Note');
      setNoteContent(updated[0].content || '');
    } else {
      handleCreateNewNote();
    }
  };

  return (
    <div
      ref={panelRef}
      {...bind}
      style={{
        position: 'fixed',
        right: '24px',
        top: '50%',
        transform: `translate(${position.x}px, calc(-50% + ${position.y}px))`,
        userSelect: 'none',
      }}
      className={`glass-panel rounded-3xl p-4 w-full max-w-xs text-slate-100 shadow-2xl transition-all duration-150 z-30 border border-white/15 ${
        isDragging
          ? 'cursor-grabbing'
          : isShiftPressed
          ? 'cursor-grab border-dashed border-amber-400/60'
          : 'cursor-default'
      }`}
      title="Right-Center default position | Shift+Drag to move"
    >
      {/* Sticky Note Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center space-x-1.5 flex-1 min-w-0 pr-1">
          <FileText className={`w-3.5 h-3.5 ${theme.text} shrink-0`} />
          <input
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            onBlur={handleSave}
            placeholder="Note title..."
            className="bg-transparent text-xs font-bold text-white truncate focus:outline-none placeholder-slate-400 flex-1 min-w-0"
          />
          <button
            onClick={() => setIsNotesDropdownOpen((prev) => !prev)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Select previous notes"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={handleCreateNewNote}
            className="p-1 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-white/10 transition-colors"
            title="New note"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </button>

          {allNotes.length > 1 && (
            <button
              onClick={handleDeleteActiveNote}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
              title="Delete note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleSave}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center space-x-1 ${
              savedStatus
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
            title="Save note to database"
          >
            {savedStatus ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Previous Notes Selection Dropdown */}
      {isNotesDropdownOpen && (
        <div className="mb-3 p-2 rounded-2xl bg-slate-900/90 border border-white/15 backdrop-blur-xl shadow-xl max-h-40 overflow-y-auto space-y-1 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-2 py-1 border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>Saved Notes ({allNotes.length})</span>
            <button
              onClick={handleCreateNewNote}
              className="text-emerald-400 hover:underline capitalize"
            >
              + Create New
            </button>
          </div>
          {allNotes.map((n) => {
            const isSelected = n.id === activeNoteId;
            return (
              <div
                key={n.id}
                onClick={() => handleSelectNote(n)}
                className={`px-2.5 py-1.5 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? `${theme.bgGlass} ${theme.border} text-white font-semibold`
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <span className="truncate pr-2">{n.title || 'Untitled Note'}</span>
                <span className="text-[9px] font-mono text-slate-400 shrink-0">
                  {n.updatedAt ? new Date(n.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Note Textarea */}
      <div onClick={(e) => e.stopPropagation()}>
        <textarea
          value={noteContent}
          onChange={handleContentChange}
          placeholder="Jot down quick thoughts, focus goals, or inspiration..."
          className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-white/20 resize-none h-32 leading-relaxed"
        />
      </div>
    </div>
  );
}

export default React.memo(QuickNotesWidget);
