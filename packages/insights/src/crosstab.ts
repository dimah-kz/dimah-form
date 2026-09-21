import {
  fieldLabel,
  isFieldVisible,
  type FormField,
  type ResponseRecord,
} from "@dimah-form/core";

import {
  catalogValues,
  categoricalTokens,
  compareByOrder,
  isCategoricalField,
} from "./categorical";
import type { InsightsCrosstab } from "./spec";

type TotalAcc = { label?: string; n: number };

/**
 * Fold two categorical fields into a crosstab. multiSelect contributes the
 * cartesian product of selected values. `n` counts respondents, not tokens.
 * Axis totals follow the document catalog (unused levels stay at `n: 0`).
 */
export function createInsightsCrosstabAccumulator(
  formId: string,
  rowField: FormField,
  colField: FormField,
) {
  const cells = new Map<string, number>();
  const rowTotals = new Map<string, TotalAcc>();
  const colTotals = new Map<string, TotalAcc>();
  const rowOrder: string[] = [];
  const colOrder: string[] = [];
  let rowLabel = fieldLabel(rowField);
  let colLabel = fieldLabel(colField);
  let rowLabeled = false;
  let colLabeled = false;
  let n = 0;

  function seedAxis(
    map: Map<string, TotalAcc>,
    order: string[],
    field: FormField,
  ) {
    if (!isCategoricalField(field)) return;
    for (const token of catalogValues(field)) {
      if (!order.includes(token.value)) order.push(token.value);
      if (map.has(token.value)) continue;
      map.set(token.value, {
        n: 0,
        ...(token.label ? { label: token.label } : {}),
      });
    }
  }

  function bumpTotal(
    map: Map<string, TotalAcc>,
    order: string[],
    value: string,
    label: string | undefined,
  ) {
    const existing = map.get(value);
    if (existing) {
      existing.n += 1;
      if (label && existing.label == null) existing.label = label;
      return;
    }
    map.set(value, { n: 1, ...(label ? { label } : {}) });
    if (!order.includes(value)) order.push(value);
  }

  return {
    add(row: ResponseRecord) {
      const snapshotRow = row.definition.fields.find(
        (field) => field.id === rowField.id,
      );
      const snapshotCol = row.definition.fields.find(
        (field) => field.id === colField.id,
      );
      if (snapshotRow) {
        seedAxis(rowTotals, rowOrder, snapshotRow);
        if (!rowLabeled) {
          rowLabel = fieldLabel(snapshotRow);
          rowLabeled = true;
        }
      }
      if (snapshotCol) {
        seedAxis(colTotals, colOrder, snapshotCol);
        if (!colLabeled) {
          colLabel = fieldLabel(snapshotCol);
          colLabeled = true;
        }
      }
      if (
        !snapshotRow ||
        !snapshotCol ||
        !isCategoricalField(snapshotRow) ||
        !isCategoricalField(snapshotCol) ||
        !isFieldVisible(snapshotRow, row.answers, row.definition.fields) ||
        !isFieldVisible(snapshotCol, row.answers, row.definition.fields)
      ) {
        return;
      }
      const rowValue = Object.hasOwn(row.answers, snapshotRow.id)
        ? row.answers[snapshotRow.id]
        : null;
      const colValue = Object.hasOwn(row.answers, snapshotCol.id)
        ? row.answers[snapshotCol.id]
        : null;
      const rowTokens = categoricalTokens(snapshotRow, rowValue);
      const colTokens = categoricalTokens(snapshotCol, colValue);
      if (rowTokens.length === 0 || colTokens.length === 0) return;
      n += 1;
      for (const rowToken of rowTokens) {
        bumpTotal(rowTotals, rowOrder, rowToken.value, rowToken.label);
      }
      for (const colToken of colTokens) {
        bumpTotal(colTotals, colOrder, colToken.value, colToken.label);
      }
      for (const rowToken of rowTokens) {
        for (const colToken of colTokens) {
          const key = `${rowToken.value}\0${colToken.value}`;
          cells.set(key, (cells.get(key) ?? 0) + 1);
        }
      }
    },
    finish(): Omit<InsightsCrosstab, "scanned" | "truncated"> {
      seedAxis(rowTotals, rowOrder, rowField);
      seedAxis(colTotals, colOrder, colField);
      const sortTotals = (
        entries: [string, TotalAcc][],
        order: readonly string[],
      ) =>
        entries
          .map(([value, item]) => ({
            value,
            n: item.n,
            ...(item.label ? { label: item.label } : {}),
          }))
          .sort((a, b) => compareByOrder(order, a.value, b.value));
      return {
        formId,
        row: { id: rowField.id, label: rowLabel },
        col: { id: colField.id, label: colLabel },
        n,
        cells: [...cells.entries()]
          .map(([key, count]) => {
            const [rowValue, colValue] = key.split("\0");
            return { row: rowValue ?? "", col: colValue ?? "", n: count };
          })
          .sort(
            (a, b) =>
              compareByOrder(rowOrder, a.row, b.row) ||
              compareByOrder(colOrder, a.col, b.col),
          ),
        rowTotals: sortTotals([...rowTotals.entries()], rowOrder),
        colTotals: sortTotals([...colTotals.entries()], colOrder),
      };
    },
  };
}
