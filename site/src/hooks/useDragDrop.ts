"use client";

import { useState, useCallback } from "react";
// import { useSlateStatic } from 'slate-react'; // No longer needed here
import { TableEditor } from "slate-table";
import { BaseEditor, CustomTypes } from "slate"; // Import BaseEditor and CustomTypes for editor type
import { ReactEditor } from "slate-react"; // Import ReactEditor for editor type
import { HistoryEditor } from "slate-history"; // Import HistoryEditor for editor type

// Use the editor type defined in slate module augmentation
type AppEditor = CustomTypes["Editor"];

export interface DragState {
  isDragging: boolean;
  dragType: "row" | "column" | null;
  sourceIndex: number | null;
  targetIndex: number | null;
  isValidTarget: boolean;
  affectedIndices: number[]; // Indices of rows/columns that will be shifted
}

export interface DragDropOptions {
  onMoveStart?: (type: "row" | "column", index: number) => void;
  onMoveEnd?: (success: boolean) => void;
  onMove?: (type: "row" | "column", from: number, to: number) => void;
}

export function useDragDrop(editor: AppEditor, options: DragDropOptions = {}) {
  // const editor = useSlateStatic(); // Editor is now passed as an argument
  const { onMoveStart, onMoveEnd, onMove } = options;

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    sourceIndex: null,
    targetIndex: null,
    isValidTarget: false,
    affectedIndices: [],
  });

  const startDrag = useCallback(
    (type: "row" | "column", sourceIndex: number) => {
      setDragState({
        isDragging: true,
        dragType: type,
        sourceIndex,
        targetIndex: null,
        isValidTarget: false,
        affectedIndices: [],
      });
      onMoveStart?.(type, sourceIndex);
    },
    [onMoveStart],
  );

  const updateDragTarget = useCallback(
    (targetIndex: number) => {
      if (
        !dragState.isDragging ||
        dragState.sourceIndex === null ||
        dragState.dragType === null
      ) {
        return;
      }

      // Validate if this is a valid drop target
      const isValid =
        dragState.dragType === "row"
          ? TableEditor.canMoveRow(editor, {
              rowIndex: dragState.sourceIndex,
            }) && targetIndex !== dragState.sourceIndex
          : TableEditor.canMoveColumn(editor, {
              columnIndex: dragState.sourceIndex,
            }) && targetIndex !== dragState.sourceIndex;

      // Calculate which indices will be affected by the move
      const affectedIndices: number[] = [];
      if (isValid && dragState.sourceIndex !== null) {
        const sourceIndex = dragState.sourceIndex;
        if (sourceIndex < targetIndex) {
          // Moving down/right: items between source and target shift up/left
          for (let i = sourceIndex + 1; i <= targetIndex; i++) {
            affectedIndices.push(i);
          }
        } else if (sourceIndex > targetIndex) {
          // Moving up/left: items between target and source shift down/right
          for (let i = targetIndex; i < sourceIndex; i++) {
            affectedIndices.push(i);
          }
        }
      }

      setDragState((prev) => ({
        ...prev,
        targetIndex,
        isValidTarget: isValid,
        affectedIndices,
      }));
    },
    [editor, dragState.isDragging, dragState.sourceIndex, dragState.dragType],
  );

  const executeDrop = useCallback(() => {
    if (
      !dragState.isDragging ||
      dragState.sourceIndex === null ||
      dragState.targetIndex === null ||
      dragState.dragType === null ||
      !dragState.isValidTarget
    ) {
      endDrag();
      return false;
    }

    const success =
      dragState.dragType === "row"
        ? TableEditor.moveRow(editor, {
            from: dragState.sourceIndex,
            to: dragState.targetIndex,
          })
        : TableEditor.moveColumn(editor, {
            from: dragState.sourceIndex,
            to: dragState.targetIndex,
          });

    if (success) {
      onMove?.(
        dragState.dragType,
        dragState.sourceIndex,
        dragState.targetIndex,
      );
    }

    endDrag();
    onMoveEnd?.(success);
    return success;
  }, [editor, dragState, onMove, onMoveEnd]);

  const endDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      dragType: null,
      sourceIndex: null,
      targetIndex: null,
      isValidTarget: false,
      affectedIndices: [],
    });
  }, []);

  const canMoveRow = useCallback(
    (rowIndex: number) => {
      return TableEditor.canMoveRow(editor, { rowIndex });
    },
    [editor],
  );

  const canMoveColumn = useCallback(
    (columnIndex: number) => {
      return TableEditor.canMoveColumn(editor, { columnIndex });
    },
    [editor],
  );

  const getValidDropPositions = useCallback(
    (type: "row" | "column", sourceIndex: number) => {
      // This would need to be implemented in the TableEditor
      // For now, return empty array
      return [];
    },
    [],
  );

  const getShiftDirection = useCallback(
    (index: number) => {
      if (
        !dragState.isDragging ||
        dragState.sourceIndex === null ||
        dragState.targetIndex === null
      ) {
        return null;
      }

      if (!dragState.affectedIndices.includes(index)) {
        return null;
      }

      const sourceIndex = dragState.sourceIndex;
      const targetIndex = dragState.targetIndex;

      if (dragState.dragType === "row") {
        return sourceIndex < targetIndex ? "up" : "down";
      } else {
        return sourceIndex < targetIndex ? "left" : "right";
      }
    },
    [dragState],
  );

  return {
    dragState,
    startDrag,
    updateDragTarget,
    executeDrop,
    endDrag,
    canMoveRow,
    canMoveColumn,
    getValidDropPositions,
    getShiftDirection,
  };
}

export default useDragDrop;
