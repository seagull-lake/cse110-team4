import type { FieldLayout } from "./MainProblemLayout.ts";

// Multiplication by a 2+ digit multiplier is worked one row (one digit of the multiplier) at a time:
// the carries of the row, then its partial product. Every row's carries share the same boxes above the
// numbers, so the screen only shows the carries of one row. These functions decide which one and how far
// each row is. They are plain functions (no Konva) so they can be unit tested; the View only draws the result.
// `fields` is the screen's field list: layout.steps followed by layout.answer, in the model's order.

/** How many of a row's carry boxes are filled in. */
export type RowProgress = "empty" | "partial" | "complete";

/** The row whose carries are shown: the row of the field being typed in, or the previous row when that field (the answer) has none. */
export function getShownRow(fields: readonly FieldLayout[], active: number, previousRow: number): number {
  return fields[active]?.row ?? previousRow;
}

/** The indexes (into `fields`) of the carry boxes of one row, in the order they are filled in. */
export function getCarryFieldIndexes(fields: readonly FieldLayout[], row: number): number[] {
  return fields.flatMap((field, index) => (field.carry && field.row === row ? [index] : []));
}

/** Whether a row's carries are filled in, or null if the row has no carries to fill. */
export function getRowProgress(fields: readonly FieldLayout[], entries: readonly string[], row: number): RowProgress | null {
  const carries = getCarryFieldIndexes(fields, row);
  if (carries.length === 0) return null;
  const filled = carries.filter(index => (entries[index] ?? "").length === fields[index].cellXs.length).length;
  if (filled === carries.length) return "complete";
  return filled > 0 ? "partial" : "empty";
}

/** A carry box that belongs to another row than the one shown: those boxes are not drawn. */
export function isHiddenCarry(field: FieldLayout, shownRow: number): boolean {
  return field.carry === true && field.row !== shownRow;
}

/**
 * Whether a field is one of the carries or the partial product of the row being worked on, which are
 * drawn with a thicker outline. Only when the problem has several rows (partial products), not for a
 * 1-digit multiplier whose only row is just its carries.
 */
export function isWorkingRow(field: FieldLayout, shownRow: number, hasPartialProductRows: boolean): boolean {
  return hasPartialProductRows && field.row === shownRow;
}
