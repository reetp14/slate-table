/** @jsxRuntime classic */
/** @jsx jsx */

import assert from "assert";
import { TableEditor } from "../../src/table-editor";
import { jsx, withTest } from "../testutils";
import { withTable } from "../../src/with-table";
import { DEFAULT_WITH_TABLE_OPTIONS } from "../../src/options";

describe("TableEditor.moveRow - Basic", () => {
  it("should have moveRow method", () => {
    expect(typeof TableEditor.moveRow).toBe("function");
  });

  it("should have canMoveRow method", () => {
    expect(typeof TableEditor.canMoveRow).toBe("function");
  });

  it("should have moveColumn method", () => {
    expect(typeof TableEditor.moveColumn).toBe("function");
  });

  it("should have canMoveColumn method", () => {
    expect(typeof TableEditor.canMoveColumn).toBe("function");
  });
});
