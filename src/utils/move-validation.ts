import { Editor, Location } from "slate";
import { filledMatrix } from "./filled-matrix";
import {
  getRowMergeInfo,
  getColumnMergeInfo,
  isHeaderRow,
  canMoveAroundMergedCells,
  isRowMovable,
  isColumnMovable,
} from "./merge-analysis";

export interface MoveValidationResult {
  canMove: boolean;
  reason?: string;
  blockedBy?:
    | "header"
    | "external-merge"
    | "merge-conflict"
    | "same-position"
    | "out-of-bounds";
}

/**
 * Validates if a row can be moved from one position to another
 */
export function validateRowMove(
  editor: Editor,
  from: number,
  to: number,
  options: { at?: Location } = {},
): MoveValidationResult {
  // Check if source and destination are the same
  if (from === to) {
    return {
      canMove: false,
      reason: "Source and destination positions are the same",
      blockedBy: "same-position",
    };
  }

  // Check if source is a header row
  if (isHeaderRow(editor, from, options)) {
    return {
      canMove: false,
      reason: "Header rows cannot be moved",
      blockedBy: "header",
    };
  }

  // Check if destination would place row in header section
  if (isHeaderRow(editor, to, options)) {
    return {
      canMove: false,
      reason: "Cannot move row to header section",
      blockedBy: "header",
    };
  }

  // Check if source row is movable (no external merges)
  if (!isRowMovable(editor, from, options)) {
    return {
      canMove: false,
      reason: "Source row has external merged cells that prevent movement",
      blockedBy: "external-merge",
    };
  }

  // Check if destination row is movable (no external merges that would block)
  if (!isRowMovable(editor, to, options)) {
    const mergeInfo = getRowMergeInfo(editor, to, options);
    if (mergeInfo.hasExternalMerges) {
      return {
        canMove: false,
        reason:
          "Destination position has external merged cells that prevent movement",
        blockedBy: "external-merge",
      };
    }
  }

  // Check if the move path conflicts with merged cells
  if (!canMoveAroundMergedCells(editor, from, to, "row", options)) {
    return {
      canMove: false,
      reason: "Move path conflicts with merged cells",
      blockedBy: "merge-conflict",
    };
  }

  return {
    canMove: true,
  };
}

/**
 * Validates if a column can be moved from one position to another
 */
export function validateColumnMove(
  editor: Editor,
  from: number,
  to: number,
  options: { at?: Location } = {},
): MoveValidationResult {
  // Check if source and destination are the same
  if (from === to) {
    return {
      canMove: false,
      reason: "Source and destination positions are the same",
      blockedBy: "same-position",
    };
  }

  // Check if source column is movable (no external merges)
  if (!isColumnMovable(editor, from, options)) {
    return {
      canMove: false,
      reason: "Source column has external merged cells that prevent movement",
      blockedBy: "external-merge",
    };
  }

  // Check if destination column is movable (no external merges that would block)
  if (!isColumnMovable(editor, to, options)) {
    const mergeInfo = getColumnMergeInfo(editor, to, options);
    if (mergeInfo.hasExternalMerges) {
      return {
        canMove: false,
        reason:
          "Destination position has external merged cells that prevent movement",
        blockedBy: "external-merge",
      };
    }
  }

  // Check if the move path conflicts with merged cells
  if (!canMoveAroundMergedCells(editor, from, to, "column", options)) {
    return {
      canMove: false,
      reason: "Move path conflicts with merged cells",
      blockedBy: "merge-conflict",
    };
  }

  return {
    canMove: true,
  };
}

/**
 * Validates if a row move is safe and provides detailed feedback
 */
export function canMoveRow(
  editor: Editor,
  options: {
    rowIndex: number;
    at?: Location;
    to?: number; // If provided, validates specific move; otherwise just checks if row is movable
  },
): MoveValidationResult {
  const { rowIndex, at, to } = options;

  if (to !== undefined) {
    return validateRowMove(editor, rowIndex, to, { at });
  }

  // Just check if the row itself is movable
  if (isHeaderRow(editor, rowIndex, { at })) {
    return {
      canMove: false,
      reason: "Header rows cannot be moved",
      blockedBy: "header",
    };
  }

  if (!isRowMovable(editor, rowIndex, { at })) {
    return {
      canMove: false,
      reason: "Row has external merged cells that prevent movement",
      blockedBy: "external-merge",
    };
  }

  return {
    canMove: true,
  };
}

/**
 * Validates if a column move is safe and provides detailed feedback
 */
export function canMoveColumn(
  editor: Editor,
  options: {
    columnIndex: number;
    at?: Location;
    to?: number; // If provided, validates specific move; otherwise just checks if column is movable
  },
): MoveValidationResult {
  const { columnIndex, at, to } = options;

  if (to !== undefined) {
    return validateColumnMove(editor, columnIndex, to, { at });
  }

  // Just check if the column itself is movable
  if (!isColumnMovable(editor, columnIndex, { at })) {
    return {
      canMove: false,
      reason: "Column has external merged cells that prevent movement",
      blockedBy: "external-merge",
    };
  }

  return {
    canMove: true,
  };
}

/**
 * Gets valid drop positions for a row being moved
 */
export function getValidRowDropPositions(
  editor: Editor,
  sourceRowIndex: number,
  options: { at?: Location } = {},
): number[] {
  const validPositions: number[] = [];

  // First check if the source row can be moved at all
  const sourceValidation = canMoveRow(editor, {
    rowIndex: sourceRowIndex,
    at: options.at,
  });

  if (!sourceValidation.canMove) {
    return validPositions;
  }

  // Get table dimensions
  const matrix = filledMatrix(editor, options);
  const rowCount = matrix.length;

  // Check each possible destination
  for (let i = 0; i < rowCount; i++) {
    if (i === sourceRowIndex) continue;

    const validation = validateRowMove(editor, sourceRowIndex, i, options);
    if (validation.canMove) {
      validPositions.push(i);
    }
  }

  return validPositions;
}

/**
 * Gets valid drop positions for a column being moved
 */
export function getValidColumnDropPositions(
  editor: Editor,
  sourceColumnIndex: number,
  options: { at?: Location } = {},
): number[] {
  const validPositions: number[] = [];

  // First check if the source column can be moved at all
  const sourceValidation = canMoveColumn(editor, {
    columnIndex: sourceColumnIndex,
    at: options.at,
  });

  if (!sourceValidation.canMove) {
    return validPositions;
  }

  // Get table dimensions
  const matrix = filledMatrix(editor, options);
  if (matrix.length === 0) return validPositions;

  const columnCount = matrix[0].length;

  // Check each possible destination
  for (let i = 0; i < columnCount; i++) {
    if (i === sourceColumnIndex) continue;

    const validation = validateColumnMove(
      editor,
      sourceColumnIndex,
      i,
      options,
    );
    if (validation.canMove) {
      validPositions.push(i);
    }
  }

  return validPositions;
}
