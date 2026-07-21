import React, { useState, useEffect } from 'react';
import { X, FileText, Plus, Trash2, Save, Sparkles, Check, Clock } from 'lucide-react';
import { storage } from '../../services/storage';

export default function NotesModal({ isOpen, onClose }) {
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [savedStatus, setSavedStatus] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loaded = storage.getNotes();
      setNotes(loaded);
      if (loaded.length > 0) {
        setActiveNoteId(loaded[0].id);
        setTitle(loaded[0].title || '');
        setContent(loaded[0].content || '');
      } else {
        handleCreateNewNote();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeNote = notes.find((n) => n.id === activeNoteId);

  const handleSelectNote = (note) => {
    setActiveNoteId(note.id);
    setTitle(note.title || '');
    setContent(note.content || '');
  };

  const handleCreateNewNote = () => {
    const newNoteData = {
      title: 'New Focus Note',
      content: '',
    };
    const updated = storage.saveNote(newNoteData);
    setNotes(updated);
    if (updated.length > 0) {
      setActiveNoteId(updated[0].id);
      setTitle(updated[0].title);
      setContent(updated[0].content);
    }
  };

  const handleSave = () => {
    if (!activeNoteId) return;
    const updated = storage.saveNote({
      id: activeNoteId,
      title: title.trim() || 'Untitled Note',
      content: content,
    });
    setNotes(updated);
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2000);
  };

  const handleDelete = (id, e) => {
    if (e) e.stopPropagation();
    const updated = storage.deleteNote(id);
    setNotes(updated);
    if (activeNoteId === id) {
      if (updated.length > 0) {
        setActiveNoteId(updated[0].id);
        setTitle(updated[0].title || '');
        setContent(updated[0].content || '');
      } else {
        setActiveNoteId(null);
        setTitle('');
        setContent('');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-3xl rounded-3xl p-6 shadow-2xl relative border border-white/20 h-[85vh] flex flex-col text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center space-x-2.5">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Focus Notes & Scratchpad</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCreateNewNote}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold hover:bg-emerald-500/30 transition-all flex items-center space-x-1"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>New Note</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body: 2-Column Split View */}
        <div className="flex-1 flex gap-4 mt-4 overflow-hidden min-h-0">
          {/* Left Sidebar: Notes List */}
          <div className="w-1/3 border-r border-white/10 pr-3 flex flex-col overflow-y-auto space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
              Saved Notes ({notes.length})
            </span>
            {notes.length === 0 ? (
              <div className="text-xs text-slate-400 italic text-center py-8">
                No notes yet. Click "+ New Note" to write one!
              </div>
            ) : (
              notes.map((n) => {
                const isActive = n.id === activeNoteId;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleSelectNote(n)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between group ${
                      isActive
                        ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md text-white'
                        : 'bg-slate-900/40 border-white/5 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-semibold truncate flex-1 pr-1">
                        {n.title || 'Untitled Note'}
                      </p>
                      <button
                        onClick={(e) => handleDelete(n.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-1">
                      {n.content ? n.content.slice(0, 40) : 'Empty note...'}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Main Editor Pane */}
          <div className="flex-1 flex flex-col min-h-0">
            {activeNoteId ? (
              <>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/5">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Note Title..."
                    className="w-full bg-transparent text-base font-extrabold text-white focus:outline-none placeholder-slate-500"
                  />
                  <button
                    onClick={handleSave}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                      savedStatus
                        ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                        : 'bg-white/10 text-slate-200 hover:bg-white/20'
                    }`}
                  >
                    {savedStatus ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your focus notes, thoughts, or tasks here..."
                  className="flex-1 w-full bg-slate-950/40 border border-white/10 rounded-2xl p-4 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
                />

                {activeNote && (
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>
                        Updated: {activeNote.updatedAt ? new Date(activeNote.updatedAt).toLocaleTimeString() : 'Just now'}
                      </span>
                    </span>
                    <span className="text-emerald-400 font-semibold">Synced to Cloud DB</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
                Select a note or create a new one to begin typing.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
