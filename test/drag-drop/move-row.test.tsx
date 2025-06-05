/** @jsxRuntime classic */
/** @jsx jsx */

import assert from "assert";
import { TableEditor } from "../../src/table-editor";
import { jsx, withTest } from "../testutils";
import { withTable } from "../../src/with-table";
import { DEFAULT_WITH_TABLE_OPTIONS } from "../../src/options";

describe("TableEditor.moveRow", () => {
  it("should move a row from one position to another", () => {
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

    const result = TableEditor.moveRow(editor, { from: 0, to: 2 });
    expect(result).toBe(true);

    expect(editor.children).toEqual([
      <table>
        <tbody>
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
        </tbody>
      </table>,
    ]);
  });

  it("should not move a header row", () => {
    const editor = withTest(
      <editor>
        <table>
          <thead>
            <tr>
              <th>
                <paragraph>Header 1</paragraph>
              </th>
              <th>
                <paragraph>Header 2</paragraph>
              </th>
            </tr>
          </thead>
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

    const result = TableEditor.moveRow(editor, { from: 0, to: 1 });
    expect(result).toBe(false);

    // Table should remain unchanged
    expect(editor.children).toEqual([
      <table>
        <thead>
          <tr>
            <th>
              <paragraph>Header 1</paragraph>
            </th>
            <th>
              <paragraph>Header 2</paragraph>
            </th>
          </tr>
        </thead>
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
      </table>,
    ]);
  });

  it("should not move a row with external merged cells", () => {
    const editor = withTest(
      <editor>
        <table>
          <tbody>
            <tr>
              <td rowSpan={2}>
                <paragraph>A1-A2</paragraph>
              </td>
              <td>
                <paragraph>B1</paragraph>
              </td>
            </tr>
            <tr>
              <td>
                <paragraph>B2</paragraph>
              </td>
            </tr>
            <tr>
              <td>
                <paragraph>A3</paragraph>
              </td>
              <td>
                <paragraph>B3</paragraph>
              </td>
            </tr>
          </tbody>
        </table>
      </editor>,
    );

    // Try to move the second row (which is part of a rowspan from row 1)
    const result = TableEditor.moveRow(editor, { from: 1, to: 2 });
    expect(result).toBe(false);
  });

  it("should allow moving a row with internal merged cells", () => {
    const editor = withTest(
      withTable(
        <editor>
          <table>
            <tbody>
              <tr>
                <td colSpan={2}>
                  <paragraph>
                    <text>
                      A1-B1
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

    const result = TableEditor.moveRow(editor, { from: 0, to: 2 });
    expect(result).toBe(true);

    expect(editor.children).toEqual([
      <table>
        <tbody>
          <tr>
            <td>
              <paragraph>A2</paragraph>
            </td>
            <td>
              <paragraph>B2</paragraph>
            </td>
          </tr>
          <tr>
            <td>
              <paragraph>A3</paragraph>
            </td>
            <td>
              <paragraph>B3</paragraph>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <paragraph>A1-B1</paragraph>
            </td>
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

    const result = TableEditor.moveRow(editor, { from: 0, to: 0 });
    expect(result).toBe(false);
  });
});
