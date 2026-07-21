import React, { useState, useRef } from 'react';
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { getTheme } from '../../utils/theme';
import { storage } from '../../services/storage';
import { useWidgetInteraction } from '../../hooks/useWidgetInteraction';

function QuickTodoList({
  tasks = [],
  activeTaskId,
  onSelectActiveTask,
  onOpenFullModal,
  themeColor = 'emerald',
}) {
  const [newTitle, setNewTitle] = useState('');
  const panelRef = useRef(null);

  const theme = getTheme(themeColor);

  const { position, isDragging, isShiftPressed, bind } = useWidgetInteraction({
    initialPosition: { x: 24, y: 16 },
    onOpenControls: onOpenFullModal,
    positionMode: 'absolute',
    panelRef,
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    storage.createTask({ title: newTitle.trim() });
    setNewTitle('');
  };

  const toggleTaskCompleted = (task) => {
    const isCompleted = task.status === 'completed' || task.completed;
    const activeSession = storage.getActiveSession();
    const sessionId = activeSession ? activeSession.id : null;

    if (isCompleted) {
      storage.reopenTask(task.id, sessionId);
    } else {
      storage.completeTask(task.id, sessionId);
    }
  };

  const handleDelete = (taskId) => {
    storage.deleteTask(taskId);
  };

  const handleSelectTask = (taskId) => {
    const activeSession = storage.getActiveSession();
    if (activeSession) {
      storage.associateTaskWithSession(activeSession.id, taskId);
    }
    onSelectActiveTask(taskId);
  };

  return (
    <div
      ref={panelRef}
      {...bind}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        userSelect: 'none',
      }}
      className={`glass-panel rounded-3xl p-5 w-full max-w-xs text-slate-100 shadow-2xl transition-all duration-150 z-30 border border-white/15 ${
        isDragging
          ? 'cursor-grabbing'
          : isShiftPressed
          ? 'cursor-grab border-dashed border-emerald-400/60'
          : 'cursor-default'
      }`}
      title="Shift+Drag to move | Ctrl+Click or Long Press for Task Drawer"
    >
      {/* Quick Add Input (Glassmorphic) */}
      <form onSubmit={handleAdd} className="relative mb-4">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a new task..."
          className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-white/30 transition-all pr-10"
        />
        <button
          type="submit"
          disabled={!newTitle.trim()}
          className={`absolute right-1.5 top-1.5 bottom-1.5 px-2.5 rounded-lg ${theme.bg} ${theme.textDark} ${theme.bgHover} disabled:opacity-30 transition-all flex items-center justify-center font-bold`}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
        </button>
      </form>

      {/* Task List */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs italic">
            No tasks yet. Add a focus goal to get started!
          </div>
        ) : (
          tasks.slice(0, 6).map((task) => {
            const isCompleted = task.status === 'completed' || task.completed;
            const isActive = task.id === activeTaskId;
            return (
              <div
                key={task.id}
                className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 ${
                  isActive
                    ? `${theme.bgGlass} ${theme.border} shadow-sm`
                    : 'bg-slate-900/40 border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTaskCompleted(task);
                    }}
                    className="text-slate-400 hover:text-white transition-colors shrink-0"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className={`w-4 h-4 ${theme.text} ${theme.fill}`} />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTask(task.id);
                    }}
                    className={`text-xs cursor-pointer truncate font-medium flex-1 ${
                      isCompleted
                        ? 'line-through text-slate-400'
                        : isActive
                        ? `${theme.textLight} font-semibold`
                        : 'text-slate-200 hover:text-white'
                    }`}
                  >
                    {task.title}
                  </span>
                </div>

                <div className="flex items-center space-x-1 ml-2" onClick={(e) => e.stopPropagation()}>
                  {!isCompleted && (
                    <button
                      onClick={() => handleSelectTask(task.id)}
                      title={isActive ? 'Active Task' : 'Set as Focus Task'}
                      className={`p-1 rounded-md text-[10px] font-bold transition-all ${
                        isActive
                          ? `${theme.bg} ${theme.textDark} px-2`
                          : `text-slate-400 hover:${theme.textLight} hover:bg-white/10 px-1.5`
                      }`}
                    >
                      {isActive ? 'Active' : 'Focus'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(task.id)}
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

export default React.memo(QuickTodoList);
