import React, { useState } from 'react';
import { X, Quote, RefreshCw, Plus, Trash2, Check, Sparkles } from 'lucide-react';

export default function QuoteEditorModal({
  isOpen,
  onClose,
  quotes = [],
  currentIndex = 0,
  onSelectIndex,
  onSaveQuotes,
}) {
  const [newText, setNewText] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState('');
  const [editAuthor, setEditAuthor] = useState('');

  if (!isOpen) return null;

  const handleAddQuote = (e) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const updated = [
      ...quotes,
      { text: newText.trim(), author: newAuthor.trim() || 'Anonymous' },
    ];
    onSaveQuotes(updated);
    setNewText('');
    setNewAuthor('');
    onSelectIndex(updated.length - 1);
  };

  const handleStartEdit = (idx) => {
    setEditingIndex(idx);
    setEditText(quotes[idx].text);
    setEditAuthor(quotes[idx].author);
  };

  const handleSaveEdit = (idx) => {
    if (!editText.trim()) return;
    const updated = quotes.map((q, i) =>
      i === idx ? { text: editText.trim(), author: editAuthor.trim() || 'Anonymous' } : q
    );
    onSaveQuotes(updated);
    setEditingIndex(null);
  };

  const handleDeleteQuote = (idx) => {
    if (quotes.length <= 1) return; // keep at least 1 quote
    const updated = quotes.filter((_, i) => i !== idx);
    onSaveQuotes(updated);
    if (currentIndex >= updated.length) {
      onSelectIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleShuffle = () => {
    const nextIdx = (currentIndex + 1) % quotes.length;
    onSelectIndex(nextIdx);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border border-white/20 max-h-[90vh] flex flex-col text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Quote className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-extrabold text-white">Quote Editor & Switcher</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Quote Preview & Quick Action */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-900/60 border border-white/10 text-center relative group">
          <p className="text-sm font-semibold italic text-slate-100 drop-shadow">
            "{quotes[currentIndex]?.text}"
          </p>
          <p className="text-xs font-bold text-emerald-400 mt-1 uppercase tracking-wider">
            — {quotes[currentIndex]?.author}
          </p>
          <div className="mt-3 flex items-center justify-center space-x-2">
            <button
              onClick={handleShuffle}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold hover:bg-emerald-500/30 transition-all flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Shuffle Quote</span>
            </button>
          </div>
        </div>

        {/* Add New Custom Quote */}
        <form onSubmit={handleAddQuote} className="mt-4 p-4 rounded-2xl bg-slate-900/40 border border-white/5 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Custom Quote</span>
          </h3>
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Quote inspiration..."
            className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              placeholder="Author name..."
              className="flex-1 glass-input rounded-xl px-3.5 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newText.trim()}
              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs transition-all flex items-center space-x-1"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add</span>
            </button>
          </div>
        </form>

        {/* Quotes Selection List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1 max-h-56">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Saved Quotes ({quotes.length})
          </h3>
          {quotes.map((q, idx) => {
            const isSelected = idx === currentIndex;
            const isEditing = idx === editingIndex;

            if (isEditing) {
              return (
                <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-emerald-500/50 space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:outline-none"
                    rows={2}
                  />
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={editAuthor}
                      onChange={(e) => setEditAuthor(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSaveEdit(idx)}
                        className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="px-2 py-1 text-slate-400 hover:text-white text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                    : 'bg-slate-900/40 border-white/5 hover:border-white/15 text-slate-300'
                }`}
                onClick={() => onSelectIndex(idx)}
              >
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-xs italic truncate">"{q.text}"</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">— {q.author}</p>
                </div>
                <div className="flex items-center space-x-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleStartEdit(idx)}
                    className="px-2 py-1 rounded-lg text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    Edit
                  </button>
                  {quotes.length > 1 && (
                    <button
                      onClick={() => handleDeleteQuote(idx)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
