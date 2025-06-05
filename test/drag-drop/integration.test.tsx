/** @jsxRuntime classic */
/** @jsx jsx */

import { TableEditor } from "../../src/table-editor";
import { jsx, withTest } from "../testutils";
import { withTable } from "../../src/with-table";
import { DEFAULT_WITH_TABLE_OPTIONS } from "../../src/options";

describe("Drag-drop integration", () => {
  it("should integrate move functionality with editor", () => {
    const editor = withTest(
      withTable(
        <editor>
          <table>
            <tbody>
              <tr>
                <td>
                  <paragraph>
                    <text>
                      A1
                      <cursor />
                    </text>
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
              <tr>
                <td>
                  <paragraph>
                    <text>A3</text>
                  </paragraph>
                </td>
                <td>
                  <paragraph>
                    <text>B3</text>
                  </paragraph>
                </td>
              </tr>
            </tbody>
          </table>
        </editor>,
        DEFAULT_WITH_TABLE_OPTIONS,
      ),
    );

    // Test that move methods are available
    expect(typeof TableEditor.moveRow).toBe("function");
    expect(typeof TableEditor.moveColumn).toBe("function");
    expect(typeof TableEditor.canMoveRow).toBe("function");
    expect(typeof TableEditor.canMoveColumn).toBe("function");

    // Test row move
    const canMoveRow = TableEditor.canMoveRow(editor, { rowIndex: 0 });
    expect(canMoveRow).toBe(true);

    const rowMoveResult = TableEditor.moveRow(editor, { from: 0, to: 2 });
    expect(rowMoveResult).toBe(true);

    // Test column move
    const canMoveColumn = TableEditor.canMoveColumn(editor, { columnIndex: 0 });
    expect(canMoveColumn).toBe(true);

    const columnMoveResult = TableEditor.moveColumn(editor, { from: 0, to: 1 });
    expect(columnMoveResult).toBe(true);
  });
});
