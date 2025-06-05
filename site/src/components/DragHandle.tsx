"use client";

import React, { FC } from "react";
import { useSlateStatic } from "slate-react";
import { TableEditor } from "slate-table";

interface DragHandleProps {
  type: "row" | "column";
  index: number;
  className?: string;
  onDragStart?: (index: number) => void;
  onDragEnd?: () => void;
  onDragOver?: (index: number) => void;
}

export const DragHandle: FC<DragHandleProps> = ({
  type,
  index,
  className = "",
  onDragStart,
  onDragEnd,
  onDragOver,
}) => {
  const editor = useSlateStatic();

  // Check if this row/column can be moved
  const canMove =
    type === "row"
      ? TableEditor.canMoveRow(editor, { rowIndex: index })
      : TableEditor.canMoveColumn(editor, { columnIndex: index });

  const handleDragStart = (event: React.DragEvent) => {
    if (!canMove) {
      event.preventDefault();
      return;
    }

    // Set drag data
    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        type,
        index,
      }),
    );

    event.dataTransfer.effectAllowed = "move";

    // Add visual feedback
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.style.opacity = "0.5";
    }

    onDragStart?.(index);
  };

  const handleDragEnd = (event: React.DragEvent) => {
    // Reset visual feedback
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.style.opacity = "1";
    }

    onDragEnd?.();
  };

  if (!canMove) {
    return (
      <div
        className={`drag-handle drag-handle--disabled ${className}`}
        title={`Cannot move this ${type} (has merged cells or is header)`}
      >
        <div className="drag-handle__icon drag-handle__icon--disabled">
          {type === "row" ? "⋮⋮" : "⋯⋯"}
        </div>
      </div>
    );
  }

  return (
    <div
      draggable
      className={`drag-handle drag-handle--${type} ${className}`}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      title={`Drag to move this ${type}`}
    >
      <div className="drag-handle__icon">{type === "row" ? "⋮⋮" : "⋯⋯"}</div>
    </div>
  );
};

interface RowDragHandleProps {
  rowIndex: number;
  className?: string;
  onDragStart?: (index: number) => void;
  onDragEnd?: () => void;
  onDragOver?: (index: number) => void;
}

export const RowDragHandle: FC<RowDragHandleProps> = (props) => (
  <DragHandle type="row" index={props.rowIndex} {...props} />
);

interface ColumnDragHandleProps {
  columnIndex: number;
  className?: string;
  onDragStart?: (index: number) => void;
  onDragEnd?: () => void;
}

export const ColumnDragHandle: FC<ColumnDragHandleProps> = (props) => (
  <DragHandle type="column" index={props.columnIndex} {...props} />
);
