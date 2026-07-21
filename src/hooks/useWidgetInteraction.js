import { useState, useRef, useEffect } from 'react';

/**
 * useWidgetInteraction
 * 
 * Handles desktop & mobile widget repositioning and control triggers:
 * - Desktop:
 *   - Reposition: Shift + Mouse Drag
 *   - Edit/Controls: Ctrl (or Cmd) + Click
 * - Mobile:
 *   - Reposition: Natural Touch & Drag (no modifier required)
 *   - Edit/Controls: Long Press (~500ms)
 * 
 * @param {Object} options
 * @param {Object} options.initialPosition - Initial {x, y} position or offset
 * @param {Function} options.onOpenControls - Callback when Ctrl+Click or Long Press occurs
 * @param {string} options.positionMode - 'absolute' | 'offsetCenter' | 'offsetBottomRight'
 * @param {React.RefObject} options.panelRef - Reference to widget container element
 */
export function useWidgetInteraction({
  initialPosition = { x: 0, y: 0 },
  onOpenControls,
  positionMode = 'absolute',
  panelRef,
}) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });
  const longPressTimerRef = useRef(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const isLongPressedRef = useRef(false);

  // Monitor Shift key state globally on desktop for cursor hint
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift') setIsShiftPressed(true);
    };
    const handleKeyUp = (e) => {
      if (e.key === 'Shift') setIsShiftPressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Viewport clamping utility
  const clampPosition = (newX, newY) => {
    const panelWidth = panelRef?.current ? panelRef.current.offsetWidth : 300;
    const panelHeight = panelRef?.current ? panelRef.current.offsetHeight : 200;

    if (positionMode === 'absolute') {
      const maxX = Math.max(10, window.innerWidth - panelWidth - 10);
      const maxY = Math.max(10, window.innerHeight - panelHeight - 10);
      return {
        x: Math.max(10, Math.min(maxX, newX)),
        y: Math.max(10, Math.min(maxY, newY)),
      };
    } else if (positionMode === 'offsetCenter') {
      const maxOffsetX = Math.max(10, (window.innerWidth - panelWidth) / 2 - 10);
      const maxOffsetY = Math.max(10, (window.innerHeight - panelHeight) / 2 - 10);
      return {
        x: Math.max(-maxOffsetX, Math.min(maxOffsetX, newX)),
        y: Math.max(-maxOffsetY, Math.min(maxOffsetY, newY)),
      };
    } else if (positionMode === 'offsetBottomRight') {
      const minX = -(window.innerWidth - panelWidth - 30);
      const maxX = 0;
      const minY = -(window.innerHeight - panelHeight - 30);
      const maxY = 0;
      return {
        x: Math.max(minX, Math.min(maxX, newX)),
        y: Math.max(minY, Math.min(maxY, newY)),
      };
    }
    return { x: newX, y: newY };
  };

  // --- Mouse / Pointer Handlers (Desktop) ---
  const handlePointerDown = (e) => {
    if (e.pointerType === 'touch') return;
    if (e.button !== 0) return;

    // Desktop Ctrl + Click -> Open Controls / Edit
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      if (onOpenControls) onOpenControls();
      return;
    }

    // Desktop Drag ONLY when Shift key is held down
    if (e.shiftKey) {
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        startX: position.x,
        startY: position.y,
      };

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
  };

  const handlePointerMove = (e) => {
    if (e.pointerType === 'touch') return;
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;

    const rawX = dragStartRef.current.startX + deltaX;
    const rawY = dragStartRef.current.startY + deltaY;

    setPosition(clampPosition(rawX, rawY));
  };

  const handlePointerUp = (e) => {
    if (e.pointerType === 'touch') return;
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
  };

  // --- Touch Handlers (Mobile) ---
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];

    isLongPressedRef.current = false;
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

    dragStartRef.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      startX: position.x,
      startY: position.y,
    };

    // Mobile Long Press Timer (~500ms)
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressedRef.current = true;
      if (navigator.vibrate) navigator.vibrate(50);
      if (onOpenControls) onOpenControls();
    }, 500);
  };

  const handleTouchMove = (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];

    const moveDistance = Math.hypot(
      touch.clientX - touchStartPosRef.current.x,
      touch.clientY - touchStartPosRef.current.y
    );

    // Cancel long press if finger moves more than 8px
    if (moveDistance > 8) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    // If long press triggered, don't drag
    if (isLongPressedRef.current) return;

    // Natural Touch & Drag on Mobile (No modifier required)
    const deltaX = touch.clientX - dragStartRef.current.mouseX;
    const deltaY = touch.clientY - dragStartRef.current.mouseY;

    const rawX = dragStartRef.current.startX + deltaX;
    const rawY = dragStartRef.current.startY + deltaY;

    setPosition(clampPosition(rawX, rawY));
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsDragging(false);
  };

  // Click handler wrapper for child elements to detect Ctrl+Click
  const handleWidgetClick = (e) => {
    if (isLongPressedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      isLongPressedRef.current = false;
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      if (onOpenControls) onOpenControls();
    }
  };

  return {
    position,
    setPosition,
    isDragging,
    isShiftPressed,
    bind: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
      onClick: handleWidgetClick,
    },
  };
}
