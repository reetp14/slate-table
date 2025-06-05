/** @jsxRuntime classic */
/** @jsx jsx */

import assert from "assert";
import { Editor, Node as SlateNode } from "slate";
import { TableEditor } from "../../src/table-editor";
import { jsx, withTest } from "../testutils";
import { withTable } from "../../src/with-table";
import { DEFAULT_WITH_TABLE_OPTIONS } from "../../src/options";
import { isOfType } from "../../src/utils";

describe("Debug move operations", () => {
  it("should analyze simple table structure", () => {
    const actual = (
      <editor>
        <table>
          <tbody>
            <tr>
              <td>
                <paragraph>
                  <text>A1</text>
                </paragraph>
              </td>
              <td>
                <paragraph>
                  <text>B1</text>
                </paragraph>
              </td>
            </tr>
            <tr>
              <td>
                <paragraph>
                  <text>A2</text>
                </paragraph>
              </td>
              <td>
                <paragraph>
                  <text>B2</text>
                </paragraph>
              </td>
            </tr>
          </tbody>
        </table>
      </editor>
    );

    const editor = withTest(withTable(actual, DEFAULT_WITH_TABLE_OPTIONS));

    // Test canMoveRow
    const canMoveRow0 = TableEditor.canMoveRow(editor, { rowIndex: 0 });
    const canMoveRow1 = TableEditor.canMoveRow(editor, { rowIndex: 1 });

    // Debug: Check what the editor actually contains
    expect(editor.children.length).toBeGreaterThan(0);
    expect(editor.children[0].type).toBe("table");

    // Debug: Check if we can find the table
    const allNodes = [
      ...Editor.nodes(editor, {
        match: (node) => node.type === "table",
      }),
    ];

    expect(allNodes.length).toBeGreaterThan(0);
    expect(canMoveRow0).toBe(true);
    expect(canMoveRow1).toBe(true);

    // Test actual move
    const moveResult = TableEditor.moveRow(editor, { from: 0, to: 1 });
    expect(moveResult).toBe(true);
  });
});
