import React, { useState, useEffect } from 'react';
import { visionStorage } from '../../services/visionStorage';
import { Plus, Pin, Trash2, Image as ImageIcon, Video, StickyNote, Quote, X, Upload, Sparkles, Heart } from 'lucide-react';

export default function VisionBoardPage() {
  const [items, setItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [itemType, setItemType] = useState('image'); // 'image' | 'video' | 'note' | 'quote'
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedColor, setSelectedColor] = useState('emerald');
  const [previewMedia, setPreviewMedia] = useState(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await visionStorage.getItems();
      setItems(data);
    } catch (err) {
      console.error('Error loading vision board items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewMedia(event.target.result);
      setContent(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (itemType === 'note' && !content.trim()) return;
    if (itemType === 'quote' && !content.trim()) return;
    if ((itemType === 'image' || itemType === 'video') && !content.trim()) return;

    try {
      const newItem = {
        type: itemType,
        title: title.trim() || (itemType === 'image' ? 'Dream Vision' : itemType === 'video' ? 'Goal Video' : 'Vision Note'),
        content,
        author: author.trim(),
        color: selectedColor,
        pinned: true,
      };

      await visionStorage.saveItem(newItem);
      await loadItems();

      // Reset Form
      setTitle('');
      setContent('');
      setAuthor('');
      setPreviewMedia(null);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error adding vision item:', err);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await visionStorage.deleteItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const handleTogglePin = async (id) => {
    try {
      await visionStorage.togglePin(id);
      await loadItems();
    } catch (err) {
      console.error('Error toggling pin:', err);
    }
  };

  const filteredItems = items.filter(item => {
    if (activeFilter === 'all') return true;
    return item.type === activeFilter;
  });

  const COLOR_MAP = {
    emerald: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200',
    amber: 'bg-amber-500/15 border-amber-500/40 text-amber-200',
    cyan: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200',
    purple: 'bg-purple-500/15 border-purple-500/40 text-purple-200',
    rose: 'bg-rose-500/15 border-rose-500/40 text-rose-200',
    slate: 'bg-slate-800/80 border-slate-700/80 text-slate-200',
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 pb-24 text-slate-100 animate-fadeIn">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span>Vision Board</span>
            <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pin your goals, inspiring photos, videos, sticky notes & quotes saved locally on your device.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-lg hover:shadow-emerald-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Vision Item</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {[
          { id: 'all', label: 'All Items', icon: Sparkles },
          { id: 'image', label: 'Images', icon: ImageIcon },
          { id: 'video', label: 'Videos', icon: Video },
          { id: 'note', label: 'Sticky Notes', icon: StickyNote },
          { id: 'quote', label: 'Quotes', icon: Quote },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all shrink-0 ${
                isActive
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-md'
                  : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Vision Board Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm italic">Loading your vision board...</div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center max-w-lg mx-auto border border-dashed border-slate-700/60 my-10">
          <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400 w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-emerald-500/20">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Your Vision Board is Empty</h3>
          <p className="text-xs text-slate-400 mb-6">
            Upload pictures of your goals, add motivational quotes, video links, or sticky notes to keep your mind focused.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Pin Your First Goal</span>
          </button>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {filteredItems.map((item) => {
            const colorClass = COLOR_MAP[item.color] || COLOR_MAP.slate;

            return (
              <div
                key={item.id}
                className={`break-inside-avoid glass-panel rounded-2xl p-4 relative group transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl border ${
                  item.pinned ? 'border-emerald-500/30 shadow-emerald-950/20' : 'border-slate-800'
                }`}
              >
                {/* Pin Badge & Action Buttons */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => handleTogglePin(item.id)}
                    className={`p-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors ${
                      item.pinned
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                    title={item.pinned ? 'Pinned to Board' : 'Click to Pin'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${item.pinned ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-semibold">{item.pinned ? 'Pinned' : 'Unpinned'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card Content Render based on Type */}
                {item.type === 'image' && (
                  <div className="space-y-2">
                    <div className="rounded-xl overflow-hidden border border-slate-700/50 max-h-72 bg-slate-950">
                      <img
                        src={item.content}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'; }}
                      />
                    </div>
                    {item.title && <h4 className="text-xs font-semibold text-white px-1 pt-1">{item.title}</h4>}
                  </div>
                )}

                {item.type === 'video' && (
                  <div className="space-y-2">
                    <div className="rounded-xl overflow-hidden border border-slate-700/50 bg-slate-950">
                      {item.content.includes('youtube.com') || item.content.includes('youtu.be') ? (
                        <iframe
                          src={item.content.replace('watch?v=', 'embed/')}
                          title={item.title}
                          className="w-full aspect-video rounded-xl"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          src={item.content}
                          controls
                          className="w-full rounded-xl max-h-64 object-cover"
                        />
                      )}
                    </div>
                    {item.title && <h4 className="text-xs font-semibold text-white px-1 pt-1">{item.title}</h4>}
                  </div>
                )}

                {item.type === 'note' && (
                  <div className={`p-4 rounded-xl border ${colorClass} space-y-2`}>
                    {item.title && <h4 className="text-sm font-bold tracking-wide">{item.title}</h4>}
                    <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap">{item.content}</p>
                  </div>
                )}

                {item.type === 'quote' && (
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/20 text-center relative">
                    <Quote className="w-6 h-6 text-emerald-400/40 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm font-semibold italic text-slate-100 leading-relaxed">
                      "{item.content}"
                    </p>
                    {item.author && (
                      <p className="text-[11px] font-bold text-emerald-400 mt-2 uppercase tracking-wider">
                        — {item.author}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-slate-700/60 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>Add to Vision Board</span>
            </h2>

            {/* Type Selector */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[
                { id: 'image', label: 'Image', icon: ImageIcon },
                { id: 'video', label: 'Video', icon: Video },
                { id: 'note', label: 'Note', icon: StickyNote },
                { id: 'quote', label: 'Quote', icon: Quote },
              ].map((t) => {
                const Icon = t.icon;
                const isSel = itemType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setItemType(t.id);
                      setContent('');
                      setPreviewMedia(null);
                    }}
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 border transition-all ${
                      isSel
                        ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              {/* Title Input */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Title / Tagline</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. My Goal, Dream University, Target Score..."
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Image Input */}
              {itemType === 'image' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Upload Local Image File</label>
                    <label className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 hover:bg-slate-800/40 cursor-pointer transition-all">
                      <Upload className="w-5 h-5 text-emerald-400 mb-1" />
                      <span className="text-xs text-slate-300 font-medium">Choose file from your computer</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                  <div className="text-center text-[10px] text-slate-500 font-semibold uppercase">Or Image Direct URL</div>
                  <input
                    type="url"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Video Input */}
              {itemType === 'video' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Upload Local Video File</label>
                    <label className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 hover:bg-slate-800/40 cursor-pointer transition-all">
                      <Upload className="w-5 h-5 text-emerald-400 mb-1" />
                      <span className="text-xs text-slate-300 font-medium">Choose MP4/WebM video file</span>
                      <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                  <div className="text-center text-[10px] text-slate-500 font-semibold uppercase">Or Video Link / YouTube URL</div>
                  <input
                    type="url"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Note Input */}
              {itemType === 'note' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Note Content</label>
                    <textarea
                      rows={4}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write down your goals, affirmation, or key strategy..."
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Color Accent</label>
                    <div className="flex space-x-2">
                      {['emerald', 'amber', 'cyan', 'purple', 'rose', 'slate'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setSelectedColor(c)}
                          className={`w-7 h-7 rounded-full border-2 transition-transform ${
                            c === 'emerald' ? 'bg-emerald-500' :
                            c === 'amber' ? 'bg-amber-500' :
                            c === 'cyan' ? 'bg-cyan-500' :
                            c === 'purple' ? 'bg-purple-500' :
                            c === 'rose' ? 'bg-rose-500' : 'bg-slate-700'
                          } ${selectedColor === c ? 'scale-110 border-white' : 'border-transparent'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Quote Input */}
              {itemType === 'quote' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Quote Text</label>
                    <textarea
                      rows={3}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Enter a quote that inspires you..."
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Author (Optional)</label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="e.g. Marcus Aurelius, Steve Jobs"
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg mt-4"
              >
                Pin to Vision Board
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
