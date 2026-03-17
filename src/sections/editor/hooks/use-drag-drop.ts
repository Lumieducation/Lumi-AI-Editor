import type { DragEvent } from 'react';

import * as React from 'react';

import type { Content, DropPosition } from '../types';

// ----------------------------------------------------------------------

export function useDragDrop(content: Content[], setContent: (content: Content[]) => void) {
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = React.useState<string | null>(null);
  const [dropPosition, setDropPosition] = React.useState<DropPosition>('after');

  const handleDragStart = (event: DragEvent<HTMLButtonElement>, id: string) => {
    setDragId(id);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = event.clientY < midpoint ? 'before' : 'after';

    if (dropTargetId !== targetId || dropPosition !== position) {
      setDropTargetId(targetId);
      setDropPosition(position);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault();
    if (dragId && dragId !== targetId) {
      const sourceIndex = content.findIndex((c) => c.id === dragId);
      const targetIndex = content.findIndex((c) => c.id === targetId);
      if (sourceIndex !== -1 && targetIndex !== -1) {
        const newContent = [...content];
        const [removed] = newContent.splice(sourceIndex, 1);
        let finalIndex = targetIndex;
        if (dropPosition === 'after') {
          finalIndex += 1;
        }
        if (sourceIndex < targetIndex) {
          finalIndex -= 1;
        }
        newContent.splice(finalIndex, 0, removed);
        setContent(newContent);
      }
    }
    setDragId(null);
    setDropTargetId(null);
  };

  return {
    dragId,
    dropTargetId,
    dropPosition,
    setDragId,
    handleDragStart,
    handleDragOver,
    handleDrop,
  };
}
