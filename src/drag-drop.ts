import { Editor, Location, Path, Transforms } from "slate";
import { filledMatrix } from "./utils/filled-matrix";
import { isOfType } from "./utils/is-of-type";
import { validateRowMove, validateColumnMove } from "./utils/move-validation";

export interface MoveRowOptions {
  from: number;
  to: number;
  at?: Location;
}

export interface MoveColumnOptions {
  from: number;
  to: number;
  at?: Location;
}

/**
 * Moves a row from one position to another within the same table
 */
export function moveRow(editor: Editor, options: MoveRowOptions): boolean {
  const { from, to, at } = options;

  // Validate the move
  const validation = validateRowMove(editor, from, to, { at });
  if (!validation.canMove) {
    // Move validation failed
    return false;
  }

  const [table] = Editor.nodes(editor, {
    match: isOfType(editor, "table"),
    at,
  });

  if (!table) {
    return false;
  }

  // Get all table rows first for validation
  const tableRows = [
    ...Editor.nodes(editor, {
      match: isOfType(editor, "tr"),
      at: table[1],
    }),
  ];

  if (from >= tableRows.length || to >= tableRows.length) {
    return false;
  }

  Editor.withoutNormalizing(editor, () => {
    // Re-get table rows inside the callback
    const currentTableRows = [
      ...Editor.nodes(editor, {
        match: isOfType(editor, "tr"),
        at: table[1],
      }),
    ];

    // Get the row to move
    const [sourceRow, sourceRowPath] = currentTableRows[from];

    // Remove the source row
    Transforms.removeNodes(editor, { at: sourceRowPath });

    // Recalculate table rows after removal
    const updatedTableRows = [
      ...Editor.nodes(editor, {
        match: isOfType(editor, "tr"),
        at: table[1],
      }),
    ];

    // Determine insertion point
    let insertPath: Path;
    if (to >= updatedTableRows.length) {
      // Insert at the end
      const lastRowPath = updatedTableRows[updatedTableRows.length - 1][1];
      insertPath = Path.next(lastRowPath);
    } else {
      // Insert before the target position
      const adjustedTo = from < to ? to - 1 : to;
      insertPath = updatedTableRows[adjustedTo][1];
    }

    // Insert the row at the new position
    Transforms.insertNodes(editor, sourceRow, { at: insertPath });
  });

  return true;
}

/**
 * Moves a column from one position to another within the same table
 */
export function moveColumn(
  editor: Editor,
  options: MoveColumnOptions,
): boolean {
  const { from, to, at } = options;

  // Validate the move
  const validation = validateColumnMove(editor, from, to, { at });
  if (!validation.canMove) {
    // Move validation failed
    return false;
  }

  const [table] = Editor.nodes(editor, {
    match: isOfType(editor, "table"),
    at,
  });

  if (!table) {
    return false;
  }

  const matrix = filledMatrix(editor, { at });
  if (
    matrix.length === 0 ||
    from >= matrix[0].length ||
    to >= matrix[0].length
  ) {
    return false;
  }

  Editor.withoutNormalizing(editor, () => {
    // Process each row to move the column
    for (let rowIndex = 0; rowIndex < matrix.length; rowIndex++) {
      const row = matrix[rowIndex];
      if (!row[from] || !row[to]) continue;

      const [sourceCell] = row[from];
      const [sourceCellElement, sourceCellPath] = sourceCell;

      const context = row[from][1];
      // Skip if this cell is part of a span from another column (colspan)
      // or part of a rowspan from a cell in a previous row
      if (context.rtl > 1 || context.ttb > 1) {
        continue;
      }

      // Remove the source cell
      Transforms.removeNodes(editor, { at: sourceCellPath });

      // Find the insertion point in the same row
      const rowPath = sourceCellPath.slice(0, -1);

      // Get updated cells in this row
      const updatedCells = [
        ...Editor.nodes(editor, {
          match: isOfType(editor, "td", "th"),
          at: rowPath,
        }),
      ];

      let insertPath: Path;
      if (to >= updatedCells.length) {
        // Insert at the end of the row
        insertPath = rowPath.concat([updatedCells.length]);
      } else {
        // Insert before the target position
        const adjustedTo = from < to ? to - 1 : to;
        if (adjustedTo < updatedCells.length) {
          insertPath = updatedCells[adjustedTo][1];
        } else {
          insertPath = rowPath.concat([updatedCells.length]);
        }
      }

      // Insert the cell at the new position
      Transforms.insertNodes(editor, sourceCellElement, { at: insertPath });
    }
  });

  return true;
}
