"use client";

import isHotkey from "is-hotkey";
import {
  BaseEditor,
  Descendant,
  createEditor,
  Editor as SlateEditor,
  Element,
  Path,
  Transforms,
} from "slate";
import {
  Editable,
  ReactEditor,
  RenderElementProps,
  RenderLeafProps,
  Slate,
  useSlateSelection,
  useSlateStatic,
  withReact,
} from "slate-react";
import { FC, useCallback, useMemo, useState, useEffect } from "react";
import { HistoryEditor, withHistory } from "slate-history";
import { TableCursor, TableEditor, withTable } from "slate-table";
import { Toolbar } from "./Toolbar";
import { initialValue } from "../constants";
import { toggleMark } from "../utils";
import { useDragDrop } from "../hooks/useDragDrop";
import { DragHandle, RowDragHandle, ColumnDragHandle } from "./DragHandle";
import { DropZone, RowDropZone, ColumnDropZone } from "./DropZone";
import "../styles/drag-drop.css";

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement;
    Text: Text;
  }
}

interface Props {
  onChange: (v: Descendant[]) => void;
}

export const Editor: FC<Props> = ({ onChange }) => {
  const [canMerge, setCanMerge] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const editor = useMemo(
    () =>
      withTable(withReact(withHistory(createEditor())), {
        blocks: {
          table: "table",
          thead: "table-head",
          tbody: "table-body",
          tfoot: "table-footer",
          tr: "table-row",
          th: "header-cell",
          td: "table-cell",
          content: "paragraph",
        },
      }),
    [],
  );

  // Initialize drag-drop functionality
  const dragDrop = useDragDrop(editor, {
    onMoveStart: (type, index) => {
      console.log(`Starting to move ${type} at index ${index}`);
    },
    onMoveEnd: (success) => {
      console.log(`Move ended with success: ${success}`);
    },
    onMove: (type, from, to) => {
      console.log(`Moved ${type} from ${from} to ${to}`);
    },
  });

  const renderElement = useCallback((props: RenderElementProps) => {
    switch (props.element.type) {
      case "table":
        return (
          <Table
            className="table-fixed my-4 sm:w-1/2 w-full text-center"
            {...props}
          />
        );
      case "table-head":
        return (
          <thead
            className="border-b text-sm uppercase bg-slate-100"
            {...props.attributes}
          >
            {props.children}
          </thead>
        );
      case "table-body":
        return (
          <tbody className="border-b text-sm" {...props.attributes}>
            {props.children}
          </tbody>
        );
      case "table-footer":
        return (
          <tfoot className="" {...props.attributes}>
            {props.children}
          </tfoot>
        );
      case "table-row":
        return <TableRow {...props} />;
      case "header-cell":
        return (
          <Th className="border border-gray-400 p-2 align-middle	" {...props} />
        );
      case "table-cell":
        return (
          <Td className="border border-gray-400 p-2 align-middle	" {...props} />
        );
      case "paragraph":
      default:
        return <p {...props.attributes}>{props.children}</p>;
    }
  }, []);

  const renderLeaf = useCallback(
    (props: RenderLeafProps) => <Text {...props} />,
    [],
  );

  const HOTKEYS = useMemo(
    () => ({
      // Formatting
      BOLD: isHotkey("mod+b"),
      ITALIC: isHotkey("mod+i"),
      UNDERLINE: isHotkey("mod+u"),

      // Navigation
      ARROW_UP: isHotkey("up"),
      ARROW_DOWN: isHotkey("down"),
      ARROW_LEFT: isHotkey("left"),
      ARROW_RIGHT: isHotkey("right"),
      TAB: isHotkey("tab"),
      SHIFT_TAB: isHotkey("shift+tab"),
    }),
    [],
  );

  return (
    <section className="mb-4 border border-gray-200 rounded-lg bg-gray-50">
      <Slate
        editor={editor}
        initialValue={initialValue}
        onSelectionChange={() => setCanMerge(TableEditor.canMerge(editor))}
        onChange={(value) => onChange(value)}
      >
        <Toolbar canMerge={canMerge} />
        <div className="prose lg:prose-lg max-w-none bg-white p-4 rounded-b-lg">
          <Editable
            placeholder="👷 Start by creating a table and play around..."
            className="focus:outline-none"
            onDragStart={(event) => {
              // Only handle drag from drag handles, not from cell content
              const target = event.target as HTMLElement;
              const isDragHandle =
                target.closest(".drag-handle") ||
                target.classList.contains("drag-handle");

              if (isDragHandle) {
                // Allow drag handle functionality
                return true;
              }

              // For cell content, prevent drag to allow selection
              if (TableCursor.isInTable(editor)) {
                event.preventDefault();
                return false;
              }
              return false;
            }}
            onKeyDown={(event) => {
              if (TableCursor.isInTable(editor)) {
                switch (true) {
                  case HOTKEYS.ARROW_DOWN(event) &&
                    TableCursor.isOnEdge(editor, "bottom"):
                    event.preventDefault();
                    return TableCursor.downward(editor);
                  case HOTKEYS.ARROW_UP(event) &&
                    TableCursor.isOnEdge(editor, "top"):
                    event.preventDefault();
                    return TableCursor.upward(editor);
                  case HOTKEYS.ARROW_RIGHT(event) &&
                    TableCursor.isOnEdge(editor, "end"):
                    event.preventDefault();
                    return TableCursor.forward(editor);
                  case HOTKEYS.ARROW_LEFT(event) &&
                    TableCursor.isOnEdge(editor, "start"):
                    event.preventDefault();
                    return TableCursor.backward(editor);
                  case HOTKEYS.TAB(event):
                    if (TableCursor.isInLastCell(editor)) {
                      TableEditor.insertRow(editor);
                    }
                    event.preventDefault();
                    return TableCursor.forward(editor, { mode: "all" });
                  case HOTKEYS.SHIFT_TAB(event):
                    event.preventDefault();
                    return TableCursor.backward(editor, { mode: "all" });
                }
              }

              // Formatting
              switch (true) {
                case HOTKEYS.BOLD(event):
                  event.preventDefault();
                  return toggleMark(editor, "bold");
                case HOTKEYS.ITALIC(event):
                  event.preventDefault();
                  return toggleMark(editor, "italic");
                case HOTKEYS.UNDERLINE(event):
                  event.preventDefault();
                  return toggleMark(editor, "underline");
              }
            }}
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            spellCheck={false}
          />
        </div>
      </Slate>
    </section>
  );
};

type CustomElement =
  | Table
  | TableHead
  | TableBody
  | TableFooter
  | Tr
  | Th
  | Td
  | Paragraph;

interface Table {
  type: "table";
  children: Array<TableHead | TableBody | TableFooter>;
}

const Table: FC<RenderElementProps & { className: string }> = ({
  attributes,
  children,
  className,
}) => {
  const editor = useSlateStatic();
  const [isSelecting] = TableCursor.selection(editor);

  // Initialize drag-drop for this table instance
  const dragDrop = useDragDrop(editor, {
    onMoveStart: (type, index) => {
      console.log(`Starting to move ${type} at index ${index}`);
    },
    onMoveEnd: (success) => {
      console.log(`Move ended with success: ${success}`);
    },
    onMove: (type, from, to) => {
      console.log(`Moved ${type} from ${from} to ${to}`);
    },
  });

  return (
    <table
      className={`table-with-drag-drop ${
        !!isSelecting ? "table-selection-none" : ""
      } ${dragDrop.dragState.isDragging ? "table-dragging" : ""} ${className}`}
      {...attributes}
    >
      {children}
    </table>
  );
};

const TableRow: FC<RenderElementProps> = ({
  attributes,
  children,
  element,
}) => {
  const editor = useSlateStatic();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get row index by finding this row's position in the table
  const getRowIndex = useCallback(() => {
    try {
      const [table] = SlateEditor.nodes(editor, {
        match: (n: any) => Element.isElement(n) && n.type === "table",
      });

      if (!table) return -1;

      const rows = Array.from(
        SlateEditor.nodes(editor, {
          match: (n: any) => Element.isElement(n) && n.type === "table-row",
          at: table[1],
        }),
      );

      const currentPath = ReactEditor.findPath(editor, element);
      return rows.findIndex(([, path]: any) => Path.equals(path, currentPath));
    } catch {
      return -1;
    }
  }, [editor, element]);

  const rowIndex = getRowIndex();

  const dragDrop = useDragDrop(editor);

  if (!isClient) {
    // Server-side rendering: render without drag handles
    return <tr {...attributes}>{children}</tr>;
  }

  const shiftDirection = dragDrop.getShiftDirection(rowIndex);
  const isDraggingRow =
    dragDrop.dragState.isDragging &&
    dragDrop.dragState.dragType === "row" &&
    dragDrop.dragState.sourceIndex === rowIndex;

  return (
    <RowDropZone
      targetRowIndex={rowIndex}
      onDrop={(sourceIndex, targetIndex) => {
        if (dragDrop.dragState.dragType === "row") {
          dragDrop.executeDrop();
        }
      }}
    >
      <tr
        className={`table-row-with-drag-handle ${
          isDraggingRow ? "table-row--dragging" : ""
        } ${shiftDirection ? `table-row--will-shift-${shiftDirection}` : ""}`}
        {...attributes}
      >
        <td className="drag-handle-cell" contentEditable={false}>
          <RowDragHandle
            rowIndex={rowIndex}
            onDragStart={(index) => {
              dragDrop.startDrag("row", index);
              // Select the entire row when dragging starts
              const rowPath = ReactEditor.findPath(editor, element);
              Transforms.select(editor, rowPath);
            }}
            onDragEnd={() => dragDrop.endDrag()}
            onDragOver={(index) => {
              if (dragDrop.dragState.dragType === "row") {
                dragDrop.updateDragTarget(index);
              }
            }}
          />
        </td>
        {children}
      </tr>
    </RowDropZone>
  );
};

interface TableHead {
  type: "table-head";
  children: Tr[];
}

interface TableBody {
  type: "table-body";
  children: Tr[];
}

interface TableFooter {
  type: "table-footer";
  children: Tr[];
}

interface Tr {
  type: "table-row";
  children: Array<Td | Th>;
}

interface Th {
  type: "header-cell";
  rowSpan?: number;
  colSpan?: number;
  children: Array<CustomElement | Text>;
}

const Th: FC<RenderElementProps & { className: string }> = ({
  attributes,
  children,
  className,
  element,
}) => {
  if (element.type !== "header-cell") {
    throw new Error('Element "Th" must be of type "header-cell"');
  }

  useSlateSelection();
  const editor = useSlateStatic();
  const selected = TableCursor.isSelected(editor, element);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get column index for this cell
  const getColumnIndex = useCallback(() => {
    try {
      const currentPath = ReactEditor.findPath(editor, element);
      return currentPath[currentPath.length - 1]; // Last path segment is the column index
    } catch {
      return -1;
    }
  }, [editor, element]);

  const columnIndex = getColumnIndex();
  const dragDrop = useDragDrop(editor);

  if (!isClient) {
    // Server-side rendering: render without drag handles
    return (
      <th
        className={`${selected ? "bg-sky-200" : ""} ${className}`}
        rowSpan={element.rowSpan}
        colSpan={element.colSpan}
        {...attributes}
      >
        {children}
      </th>
    );
  }

  const shiftDirection = dragDrop.getShiftDirection(columnIndex);
  const isDraggingColumn =
    dragDrop.dragState.isDragging &&
    dragDrop.dragState.dragType === "column" &&
    dragDrop.dragState.sourceIndex === columnIndex;

  return (
    <ColumnDropZone
      targetColumnIndex={columnIndex}
      onDrop={(sourceIndex, targetIndex) => {
        if (dragDrop.dragState.dragType === "column") {
          dragDrop.executeDrop();
        }
      }}
    >
      <th
        className={`${selected ? "bg-sky-200" : ""} ${
          isDraggingColumn ? "table-column--dragging" : ""
        } ${
          shiftDirection ? `table-column--will-shift-${shiftDirection}` : ""
        } table-column-with-drag-handle ${className}`}
        rowSpan={element.rowSpan}
        colSpan={element.colSpan}
        {...attributes}
      >
        <div className="relative">
          <div
            className="absolute -top-6 left-0 right-0"
            contentEditable={false}
          >
            <ColumnDragHandle
              columnIndex={columnIndex}
              onDragStart={(index) => {
                dragDrop.startDrag("column", index);
                // Select the entire column when dragging starts
                const cellPath = ReactEditor.findPath(editor, element);
                Transforms.select(editor, cellPath);
              }}
              onDragEnd={() => dragDrop.endDrag()}
            />
          </div>
          {children}
        </div>
      </th>
    </ColumnDropZone>
  );
};

interface Td {
  type: "table-cell";
  rowSpan?: number;
  colSpan?: number;
  children: Array<CustomElement | Text>;
}

const Td: FC<RenderElementProps & { className: string }> = ({
  attributes,
  children,
  className,
  element,
}) => {
  if (element.type !== "table-cell") {
    throw new Error('Element "Td" must be of type "table-cell"');
  }

  useSlateSelection();
  const editor = useSlateStatic();
  const selected = TableCursor.isSelected(editor, element);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get column index for this cell
  const getColumnIndex = useCallback(() => {
    try {
      const currentPath = ReactEditor.findPath(editor, element);
      return currentPath[currentPath.length - 1]; // Last path segment is the column index
    } catch {
      return -1;
    }
  }, [editor, element]);

  const columnIndex = getColumnIndex();
  const dragDrop = useDragDrop(editor);

  if (!isClient) {
    // Server-side rendering: render without drag functionality
    return (
      <td
        className={`${selected ? "bg-sky-200" : ""} ${className}`}
        rowSpan={element.rowSpan}
        colSpan={element.colSpan}
        {...attributes}
      >
        {children}
      </td>
    );
  }

  const shiftDirection = dragDrop.getShiftDirection(columnIndex);
  const isDraggingColumn =
    dragDrop.dragState.isDragging &&
    dragDrop.dragState.dragType === "column" &&
    dragDrop.dragState.sourceIndex === columnIndex;

  return (
    <ColumnDropZone
      targetColumnIndex={columnIndex}
      onDrop={(sourceIndex, targetIndex) => {
        if (dragDrop.dragState.dragType === "column") {
          dragDrop.executeDrop();
        }
      }}
    >
      <td
        className={`${selected ? "bg-sky-200" : ""} ${
          isDraggingColumn ? "table-column--dragging" : ""
        } ${
          shiftDirection ? `table-column--will-shift-${shiftDirection}` : ""
        } ${className}`}
        rowSpan={element.rowSpan}
        colSpan={element.colSpan}
        {...attributes}
      >
        {children}
      </td>
    </ColumnDropZone>
  );
};

interface Paragraph {
  type: "paragraph";
  children: Array<CustomElement | Text>;
}

interface Text {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

const Text: FC<RenderLeafProps> = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  return <span {...attributes}>{children}</span>;
};
