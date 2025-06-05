/** @jsxRuntime classic */
/** @jsx jsx */

import assert from "assert";
import { DEFAULT_WITH_TABLE_OPTIONS } from "../../src/options";
import { TableEditor } from "../../src/table-editor";
import { jsx, withTest } from "../testutils";
import { withTable } from "../../src/with-table";

describe("Working move test", () => {
  it("should work with selection like existing tests", () => {
    const actual = (
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
            </tr>
            <tr>
              <td>
                <paragraph>
                  <text>A2</text>
                </paragraph>
              </td>
            </tr>
          </tbody>
        </table>
      </editor>
    );

    const editor = withTest(withTable(actual, DEFAULT_WITH_TABLE_OPTIONS));

    // First try the canMoveRow which we know works
    const canMove = TableEditor.canMoveRow(editor, { rowIndex: 0 });
    expect(canMove).toBe(true);

    // Now try a simple insertion to make sure the editor works
    TableEditor.insertRow(editor, { before: true });

    // The table should now have 3 rows (one inserted before)
    expect(editor.children[0].children[0].children.length).toBe(3);
  });
});
