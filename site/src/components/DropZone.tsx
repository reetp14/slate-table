"use client";

import React, { FC, useState } from "react";
import { useSlateStatic } from "slate-react";
import { TableEditor } from "slate-table";

interface DropZoneProps {
  type: "row" | "column";
  targetIndex: number;
  className?: string;
  onDrop?: (sourceIndex: number, targetIndex: number) => void;
  children?: React.ReactNode;
}

export const DropZone: FC<DropZoneProps> = ({
  type,
  targetIndex,
  className = "",
  onDrop,
  children,
}) => {
  const editor = useSlateStatic();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isValidDrop, setIsValidDrop] = useState(false);

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();

    try {
      const dragData = event.dataTransfer.getData("text/plain");
      if (!dragData) {
        setIsValidDrop(false);
        return;
      }

      const { type: dragType, index: sourceIndex } = JSON.parse(dragData);

      if (dragType !== type) {
        setIsValidDrop(false);
        setIsDragOver(false);
        return;
      }

      // Don't allow drop on the same position
      if (sourceIndex === targetIndex) {
        setIsValidDrop(false);
        return;
      }

      // Check if this is a valid drop target
      const canMove =
        type === "row"
          ? TableEditor.canMoveRow(editor, { rowIndex: sourceIndex })
          : TableEditor.canMoveColumn(editor, { columnIndex: sourceIndex });

      if (!canMove) {
        setIsValidDrop(false);
        return;
      }

      // Additional validation can be added here
      setIsValidDrop(true);
      setIsDragOver(true);
      event.dataTransfer.dropEffect = "move";
    } catch (error) {
      setIsValidDrop(false);
    }
  };

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();

    try {
      const dragData = event.dataTransfer.getData("text/plain");
      if (!dragData) return;

      const { type: dragType } = JSON.parse(dragData);

      if (dragType === type) {
        setIsDragOver(true);
      }
    } catch (error) {
      // Ignore parsing errors
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    // Always reset state on drag leave from this specific drop zone
    setIsDragOver(false);
    setIsValidDrop(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    setIsValidDrop(false);

    try {
      const dragData = event.dataTransfer.getData("text/plain");
      if (!dragData) return;

      const { type: dragType, index: sourceIndex } = JSON.parse(dragData);

      if (dragType !== type || sourceIndex === targetIndex) {
        return;
      }

      // Execute the move
      const success =
        type === "row"
          ? TableEditor.moveRow(editor, { from: sourceIndex, to: targetIndex })
          : TableEditor.moveColumn(editor, {
              from: sourceIndex,
              to: targetIndex,
            });

      if (success) {
        onDrop?.(sourceIndex, targetIndex);
      }
    } catch (error) {
      console.error("Drop failed:", error);
    }
  };

  const getDropZoneClasses = () => {
    const baseClasses = `drop-zone drop-zone--${type} ${className}`;

    if (isDragOver && isValidDrop) {
      return `${baseClasses} drop-zone--valid`;
    } else if (isDragOver && !isValidDrop) {
      return `${baseClasses} drop-zone--invalid`;
    }

    return baseClasses;
  };

  return (
    <div
      className={getDropZoneClasses()}
      style={{ display: "contents" }} // Add display: contents
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
      {isDragOver && isValidDrop && (
        <div className="drop-indicator drop-indicator--valid">
          Drop {type} here
        </div>
      )}
    </div>
  );
};

interface RowDropZoneProps {
  targetRowIndex: number;
  className?: string;
  onDrop?: (sourceIndex: number, targetIndex: number) => void;
  children?: React.ReactNode;
}

export const RowDropZone: FC<RowDropZoneProps> = ({
  targetRowIndex,
  className,
  onDrop,
  children,
}) => (
  <DropZone
    type="row"
    targetIndex={targetRowIndex}
    className={className}
    onDrop={onDrop}
  >
    {children}
  </DropZone>
);

interface ColumnDropZoneProps {
  targetColumnIndex: number;
  className?: string;
  onDrop?: (sourceIndex: number, targetIndex: number) => void;
  children?: React.ReactNode;
}

export const ColumnDropZone: FC<ColumnDropZoneProps> = ({
  targetColumnIndex,
  className,
  onDrop,
  children,
}) => (
  <DropZone
    type="column"
    targetIndex={targetColumnIndex}
    className={className}
    onDrop={onDrop}
  >
    {children}
  </DropZone>
);
