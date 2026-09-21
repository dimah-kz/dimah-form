import {
  fieldLabel,
  isFieldVisible,
  type FormField,
  type ResponseRecord,
} from "@dimah-form/core";

import { categoricalTokens, isCategoricalField } from "./categorical";
import type { InsightsCrosstab } from "./spec";

type TotalAcc = { label?: string; n: number };

/**
 * Fold two categorical fields into a crosstab. multiSelect contributes the
 * cartesian product of selected values.
 */
export function createInsightsCrosstabAccumulator(
  formId: string,
  rowField: FormField,
  colField: FormField,
) {
  const cells = new Map<string, number>();
  const rowTotals = new Map<string, TotalAcc>();
  const colTotals = new Map<string, TotalAcc>();
  let rowLabel = fieldLabel(rowField);
  let colLabel = fieldLabel(colField);

  function bumpTotal(
    map: Map<string, TotalAcc>,
    value: string,
    label: string | undefined,
  ) {
    const existing = map.get(value);
    if (existing) {
      existing.n += 1;
      if (label) existing.label = label;
      return;
    }
    map.set(value, { n: 1, ...(label ? { label } : {}) });
  }

  return {
    add(row: ResponseRecord) {
      const snapshotRow = row.definition.fields.find(
        (field) => field.id === rowField.id,
      );
      const snapshotCol = row.definition.fields.find(
        (field) => field.id === colField.id,
      );
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
      rowLabel = fieldLabel(snapshotRow);
      colLabel = fieldLabel(snapshotCol);
      const rowValue = Object.hasOwn(row.answers, snapshotRow.id)
        ? row.answers[snapshotRow.id]
        : null;
      const colValue = Object.hasOwn(row.answers, snapshotCol.id)
        ? row.answers[snapshotCol.id]
        : null;
      const rowTokens = categoricalTokens(snapshotRow, rowValue);
      const colTokens = categoricalTokens(snapshotCol, colValue);
      if (rowTokens.length === 0 || colTokens.length === 0) return;
      for (const rowToken of rowTokens) {
        bumpTotal(rowTotals, rowToken.value, rowToken.label);
      }
      for (const colToken of colTokens) {
        bumpTotal(colTotals, colToken.value, colToken.label);
      }
      for (const rowToken of rowTokens) {
        for (const colToken of colTokens) {
          const key = `${rowToken.value}\0${colToken.value}`;
          cells.set(key, (cells.get(key) ?? 0) + 1);
        }
      }
    },
    finish(): Omit<InsightsCrosstab, "scanned" | "truncated"> {
      const sortTotals = (entries: [string, TotalAcc][]) =>
        entries
          .map(([value, item]) => ({
            value,
            n: item.n,
            ...(item.label ? { label: item.label } : {}),
          }))
          .sort((a, b) => b.n - a.n || a.value.localeCompare(b.value, "en"));
      return {
        formId,
        row: { id: rowField.id, label: rowLabel },
        col: { id: colField.id, label: colLabel },
        cells: [...cells.entries()]
          .map(([key, n]) => {
            const [rowValue, colValue] = key.split("\0");
            return { row: rowValue ?? "", col: colValue ?? "", n };
          })
          .sort(
            (a, b) =>
              b.n - a.n ||
              a.row.localeCompare(b.row, "en") ||
              a.col.localeCompare(b.col, "en"),
          ),
        rowTotals: sortTotals([...rowTotals.entries()]),
        colTotals: sortTotals([...colTotals.entries()]),
      };
    },
  };
}
