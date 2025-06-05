import { Editor, Location, NodeEntry } from "slate";
import { CellElement } from "./types";
import { filledMatrix } from "./filled-matrix";
import { isOfType } from "./is-of-type";

export interface MergeInfo {
  hasInternalMerges: boolean;
  hasExternalMerges: boolean;
  mergedCells: NodeEntry<CellElement>[];
  blockedIndices: number[];
}

/**
 * Analyzes merge information for a specific row
 */
export function getRowMergeInfo(
  editor: Editor,
  rowIndex: number,
  options: { at?: Location } = {},
): MergeInfo {
  const matrix = filledMatrix(editor, options);

  if (!matrix[rowIndex]) {
    return {
      hasInternalMerges: false,
      hasExternalMerges: false,
      mergedCells: [],
      blockedIndices: [],
    };
  }

  const mergedCells: NodeEntry<CellElement>[] = [];
  const blockedIndices: number[] = [];
  let hasInternalMerges = false;
  let hasExternalMerges = false;

  // Check each cell in the row
  for (let colIndex = 0; colIndex < matrix[rowIndex].length; colIndex++) {
    const [entry, context] = matrix[rowIndex][colIndex];
    const [element] = entry;

    // Check for rowspan (vertical merges)
    if (element.rowSpan && element.rowSpan > 1) {
      mergedCells.push(entry);

      // If this is the start of a rowspan (ttb === 1), it's internal
      // If ttb > 1, it means this cell starts above this row (external)
      if (context.ttb === 1) {
        hasInternalMerges = true;
      } else {
        hasExternalMerges = true;
        // Add all rows this cell spans to blocked indices
        for (
          let i = rowIndex - context.ttb + 1;
          i < rowIndex + context.btt;
          i++
        ) {
          if (i !== rowIndex && !blockedIndices.includes(i)) {
            blockedIndices.push(i);
          }
        }
      }
    }

    // Check for colspan (horizontal merges within the row)
    if (element.colSpan && element.colSpan > 1) {
      mergedCells.push(entry);
      hasInternalMerges = true;
    }
  }

  return {
    hasInternalMerges,
    hasExternalMerges,
    mergedCells,
    blockedIndices: [...new Set(blockedIndices)].sort(),
  };
}

/**
 * Analyzes merge information for a specific column
 */
export function getColumnMergeInfo(
  editor: Editor,
  columnIndex: number,
  options: { at?: Location } = {},
): MergeInfo {
  const matrix = filledMatrix(editor, options);

  const mergedCells: NodeEntry<CellElement>[] = [];
  const blockedIndices: number[] = [];
  let hasInternalMerges = false;
  let hasExternalMerges = false;

  // Check each cell in the column
  for (let rowIndex = 0; rowIndex < matrix.length; rowIndex++) {
    if (!matrix[rowIndex] || !matrix[rowIndex][columnIndex]) {
      continue;
    }

    const [entry, context] = matrix[rowIndex][columnIndex];
    const [element] = entry;

    // Check for colspan (horizontal merges)
    if (element.colSpan && element.colSpan > 1) {
      mergedCells.push(entry);

      // If this is the start of a colspan (ltr === colSpan), it's internal
      // If rtl > 1, it means this cell starts to the left of this column (external)
      if (context.rtl === 1) {
        hasInternalMerges = true;
      } else {
        hasExternalMerges = true;
        // Add all columns this cell spans to blocked indices
        for (
          let i = columnIndex - context.rtl + 1;
          i < columnIndex + context.ltr;
          i++
        ) {
          if (i !== columnIndex && !blockedIndices.includes(i)) {
            blockedIndices.push(i);
          }
        }
      }
    }

    // Check for rowspan (vertical merges within the column)
    if (element.rowSpan && element.rowSpan > 1) {
      mergedCells.push(entry);
      hasInternalMerges = true;
    }
  }

  return {
    hasInternalMerges,
    hasExternalMerges,
    mergedCells,
    blockedIndices: [...new Set(blockedIndices)].sort(),
  };
}

/**
 * Checks if a row can be moved (not blocked by external merges)
 */
export function isRowMovable(
  editor: Editor,
  rowIndex: number,
  options: { at?: Location } = {},
): boolean {
  // Check if it's a header row
  if (isHeaderRow(editor, rowIndex, options)) {
    return false;
  }

  const mergeInfo = getRowMergeInfo(editor, rowIndex, options);
  return !mergeInfo.hasExternalMerges;
}

/**
 * Checks if a column can be moved (not blocked by external merges)
 */
export function isColumnMovable(
  editor: Editor,
  columnIndex: number,
  options: { at?: Location } = {},
): boolean {
  const mergeInfo = getColumnMergeInfo(editor, columnIndex, options);
  return !mergeInfo.hasExternalMerges;
}

/**
 * Checks if a row is a header row (in thead section)
 */
export function isHeaderRow(
  editor: Editor,
  rowIndex: number,
  options: { at?: Location } = {},
): boolean {
  const matrix = filledMatrix(editor, options);

  if (!matrix[rowIndex]) {
    return false;
  }

  // Get the first cell in the row and check its section
  const [entry] = matrix[rowIndex][0];
  const [, cellPath] = entry;

  // Find the parent section (thead, tbody, tfoot)
  const [section] = Editor.nodes(editor, {
    match: isOfType(editor, "thead", "tbody", "tfoot"),
    at: cellPath,
  });

  if (!section) {
    return false;
  }

  const [sectionElement] = section;
  return sectionElement.type === "table-head";
}

/**
 * Checks if moving from one position to another would conflict with merges
 */
export function canMoveAroundMergedCells(
  editor: Editor,
  from: number,
  to: number,
  type: "row" | "column",
  options: { at?: Location } = {},
): boolean {
  const start = Math.min(from, to);
  const end = Math.max(from, to);

  // Check each position in the range for blocking merges
  for (let i = start; i <= end; i++) {
    if (i === from) continue; // Skip the source position

    const mergeInfo =
      type === "row"
        ? getRowMergeInfo(editor, i, options)
        : getColumnMergeInfo(editor, i, options);

    // If any position in the path has external merges that would block the move
    if (mergeInfo.hasExternalMerges) {
      const blockedIndices = mergeInfo.blockedIndices;

      // Check if the move would conflict with blocked indices
      if (blockedIndices.includes(from) || blockedIndices.includes(to)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Gets all movable row indices in a table
 */
export function getMovableRows(
  editor: Editor,
  options: { at?: Location } = {},
): number[] {
  const matrix = filledMatrix(editor, options);
  const movableRows: number[] = [];

  for (let i = 0; i < matrix.length; i++) {
    if (isRowMovable(editor, i, options)) {
      movableRows.push(i);
    }
  }

  return movableRows;
}

/**
 * Gets all movable column indices in a table
 */
export function getMovableColumns(
  editor: Editor,
  options: { at?: Location } = {},
): number[] {
  const matrix = filledMatrix(editor, options);
  if (matrix.length === 0) return [];

  const movableColumns: number[] = [];
  const columnCount = matrix[0].length;

  for (let i = 0; i < columnCount; i++) {
    if (isColumnMovable(editor, i, options)) {
      movableColumns.push(i);
    }
  }

  return movableColumns;
}
