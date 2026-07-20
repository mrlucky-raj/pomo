import React, { useState, useRef } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, Sparkles, ChevronRight, GripHorizontal } from 'lucide-react';

export default function QuickTodoList({
  tasks = [],
  activeTaskId,
  onSelectActiveTask,
  onSaveTask,
  onDeleteTask,
  onOpenFullModal,
}) {
  const [newTitle, setNewTitle] = useState('');

  // Track position (default top-left corner with margin: x=24, y=80)
  const [position, setPosition] = useState({ x: 24, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });
  const panelRef = useRef(null);

  // Pointer Down event handler on Header Handle
  const handlePointerDown = (e) => {
    if (e.button !== 0) return; // Primary pointer button only

    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y,
    };

    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  // Pointer Move event handler with viewport clamping
  const handlePointerMove = (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;

    let newX = dragStartRef.current.startX + deltaX;
    let newY = dragStartRef.current.startY + deltaY;

    // Viewport boundary clamping to prevent dragging off-screen
    const panelWidth = panelRef.current ? panelRef.current.offsetWidth : 320;
    const panelHeight = panelRef.current ? panelRef.current.offsetHeight : 300;

    const maxX = Math.max(10, window.innerWidth - panelWidth - 10);
    const maxY = Math.max(10, window.innerHeight - panelHeight - 10);

    newX = Math.max(10, Math.min(maxX, newX));
    newY = Math.max(10, Math.min(maxY, newY));

    setPosition({ x: newX, y: newY });
  };

  // Pointer Up event handler
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

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onSaveTask({
      id: `task_${Date.now()}`,
      title: newTitle.trim(),
      completed: false,
      estimatedPomos: 1,
      completedPomos: 0,
      createdAt: new Date().toISOString(),
    });
    setNewTitle('');
  };

  const toggleTaskCompleted = (task) => {
    onSaveTask({
      ...task,
      completed: !task.completed,
    });
  };

  const pendingTasks = tasks.filter(t => !t.completed);

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        userSelect: isDragging ? 'none' : 'auto',
      }}
      className="glass-panel rounded-2xl p-5 w-full max-w-xs text-slate-100 shadow-2xl transition-shadow duration-300 z-30"
    >
      {/* Draggable Header Handle Area */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`flex items-center justify-between pb-3 border-b border-slate-700/50 mb-4 select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        title="Click and drag to move panel"
      >
        <div className="flex items-center space-x-2">
          <GripHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h3 className="font-semibold text-sm tracking-wide">Quick Tasks</h3>
          <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
            {pendingTasks.length}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenFullModal();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="text-xs text-slate-400 hover:text-emerald-400 flex items-center transition-colors"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>

      {/* Quick Add Input (Non-draggable) */}
      <form onSubmit={handleAdd} className="relative mb-4" onPointerDown={(e) => e.stopPropagation()}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a new task..."
          className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all pr-10"
        />
        <button
          type="submit"
          disabled={!newTitle.trim()}
          className="absolute right-1.5 top-1.5 bottom-1.5 px-2.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 transition-all flex items-center justify-center"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
        </button>
      </form>

      {/* Task List (Non-draggable) */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1" onPointerDown={(e) => e.stopPropagation()}>
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs italic">
            No tasks yet. Add a focus goal to get started!
          </div>
        ) : (
          tasks.slice(0, 6).map((task) => {
            const isActive = task.id === activeTaskId;
            return (
              <div
                key={task.id}
                className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-500/15 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                  <button
                    onClick={() => toggleTaskCompleted(task)}
                    className="text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/20" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>
                  <span
                    onClick={() => onSelectActiveTask(task.id)}
                    className={`text-xs cursor-pointer truncate font-medium flex-1 ${
                      task.completed
                        ? 'line-through text-slate-400'
                        : isActive
                        ? 'text-emerald-300 font-semibold'
                        : 'text-slate-200 hover:text-white'
                    }`}
                  >
                    {task.title}
                  </span>
                </div>

                <div className="flex items-center space-x-1 ml-2">
                  {!task.completed && (
                    <button
                      onClick={() => onSelectActiveTask(task.id)}
                      title={isActive ? 'Active Task' : 'Set as Focus Task'}
                      className={`p-1 rounded-md text-[10px] font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950 px-2'
                          : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800 px-1.5'
                      }`}
                    >
                      {isActive ? 'Active' : 'Focus'}
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
