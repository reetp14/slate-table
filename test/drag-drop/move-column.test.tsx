/** @jsxRuntime classic */
/** @jsx jsx */

import assert from "assert";
import { TableEditor } from "../../src/table-editor";
import { jsx, withTest } from "../testutils";
import { withTable } from "../../src/with-table";
import { DEFAULT_WITH_TABLE_OPTIONS } from "../../src/options";

describe("TableEditor.moveColumn", () => {
  it("should move a column from one position to another", () => {
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
                <td>
                  <paragraph>
                    <text>C1</text>
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
                <td>
                  <paragraph>
                    <text>C2</text>
                  </paragraph>
                </td>
              </tr>
            </tbody>
          </table>
        </editor>,
        DEFAULT_WITH_TABLE_OPTIONS,
      ),
    );

    const result = TableEditor.moveColumn(editor, { from: 0, to: 2 });
    expect(result).toBe(true);

    expect(editor.children).toEqual([
      <table>
        <tbody>
          <tr>
            <td>
              <paragraph>B1</paragraph>
            </td>
            <td>
              <paragraph>C1</paragraph>
            </td>
            <td>
              <paragraph>A1</paragraph>
            </td>
          </tr>
          <tr>
            <td>
              <paragraph>B2</paragraph>
            </td>
            <td>
              <paragraph>C2</paragraph>
            </td>
            <td>
              <paragraph>A2</paragraph>
            </td>
          </tr>
        </tbody>
      </table>,
    ]);
  });

  it("should not move a column with external merged cells", () => {
    const editor = withTest(
      <editor>
        <table>
          <tbody>
            <tr>
              <td colSpan={2}>
                <paragraph>A1-B1</paragraph>
              </td>
              <td>
                <paragraph>C1</paragraph>
              </td>
            </tr>
            <tr>
              <td>
                <paragraph>A2</paragraph>
              </td>
              <td>
                <paragraph>B2</paragraph>
              </td>
              <td>
                <paragraph>C2</paragraph>
              </td>
            </tr>
          </tbody>
        </table>
      </editor>,
    );

    // Try to move the second column (which is part of a colspan from column 1)
    const result = TableEditor.moveColumn(editor, { from: 1, to: 2 });
    expect(result).toBe(false);
  });

  it("should allow moving a column with internal merged cells", () => {
    const editor = withTest(
      withTable(
        <editor>
          <table>
            <tbody>
              <tr>
                <td rowSpan={2}>
                  <paragraph>
                    <text>
                      A1-A2
                      <cursor />
                    </text>
                  </paragraph>
                </td>
                <td>
                  <paragraph>
                    <text>B1</text>
                  </paragraph>
                </td>
                <td>
                  <paragraph>
                    <text>C1</text>
                  </paragraph>
                </td>
              </tr>
              <tr>
                <td>
                  <paragraph>
                    <text>B2</text>
                  </paragraph>
                </td>
                <td>
                  <paragraph>
                    <text>C2</text>
                  </paragraph>
                </td>
              </tr>
            </tbody>
          </table>
        </editor>,
        DEFAULT_WITH_TABLE_OPTIONS,
      ),
    );

    const result = TableEditor.moveColumn(editor, { from: 0, to: 2 });
    expect(result).toBe(true);

    expect(editor.children).toEqual([
      <table>
        <tbody>
          <tr>
            <td>
              <paragraph>
                <text>B1</text>
              </paragraph>
            </td>
            <td>
              <paragraph>
                <text>C1</text>
              </paragraph>
            </td>
            <td rowSpan={2}>
              <paragraph>
                <text>A1-A2</text>
              </paragraph>
            </td>
          </tr>
          <tr>
            <td>
              <paragraph>
                <text>B2</text>
              </paragraph>
            </td>
            <td>
              <paragraph>
                <text>C2</text>
              </paragraph>
            </td>
            {/* This cell is removed due to the rowspan of the moved cell */}
          </tr>
        </tbody>
      </table>,
    ]);
  });

  it("should return false when trying to move to the same position", () => {
    const editor = withTest(
      <editor>
        <table>
          <tbody>
            <tr>
              <td>
                <paragraph>A1</paragraph>
              </td>
              <td>
                <paragraph>B1</paragraph>
              </td>
            </tr>
          </tbody>
        </table>
      </editor>,
    );

    const result = TableEditor.moveColumn(editor, { from: 0, to: 0 });
    expect(result).toBe(false);
  });
});
