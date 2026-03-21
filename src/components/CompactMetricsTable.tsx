import type { ReactNode } from "react";
import "./CompactMetricsTable.css";

export type CompactMetricsTone = "positive" | "negative" | "neutral";

export type CompactMetricsColumn = {
  key: string;
  label: ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
  headClassName?: string;
};

export type CompactMetricsCell = {
  content: ReactNode;
  tone?: CompactMetricsTone;
  className?: string;
};

export type CompactMetricsRow = {
  key: string;
  label: ReactNode;
  labelClassName?: string;
  rowClassName?: string;
  cells: CompactMetricsCell[];
};

type CompactMetricsTableProps = {
  ariaLabel: string;
  rowHeaderLabel: ReactNode;
  columns: CompactMetricsColumn[];
  rows: CompactMetricsRow[];
  tableClassName?: string;
};

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function getToneClass(tone?: CompactMetricsTone) {
  if (!tone || tone === "neutral") return "compact-metrics-table__value--neutral";
  return tone === "positive" ? "compact-metrics-table__value--positive" : "compact-metrics-table__value--negative";
}

function getAlignClass(align: CompactMetricsColumn["align"]) {
  if (align === "left") return "compact-metrics-table__head--left";
  if (align === "right") return "compact-metrics-table__head--right";
  return "compact-metrics-table__head--center";
}

function getCellAlignClass(align: CompactMetricsColumn["align"]) {
  if (align === "left") return "compact-metrics-table__value--left";
  if (align === "right") return "compact-metrics-table__value--right";
  return "compact-metrics-table__value--center";
}

export function CompactMetricsTable({
  ariaLabel,
  rowHeaderLabel,
  columns,
  rows,
  tableClassName,
}: CompactMetricsTableProps) {
  return (
    <table className={joinClasses("compact-metrics-table", tableClassName)} aria-label={ariaLabel}>
      <thead>
        <tr>
          <th scope="col" className="compact-metrics-table__head compact-metrics-table__head--rowHeader">
            {rowHeaderLabel}
          </th>
          {columns.map((column) => (
            <th
              key={column.key}
              scope="col"
              className={joinClasses(
                "compact-metrics-table__head",
                getAlignClass(column.align),
                column.className,
                column.headClassName,
              )}
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className={row.rowClassName}>
            <th scope="row" className={joinClasses("compact-metrics-table__name", row.labelClassName)}>
              {row.label}
            </th>
            {row.cells.map((cell, index) => (
              <td
                key={`${row.key}-${columns[index]?.key ?? index}`}
                className={joinClasses(
                  "compact-metrics-table__value",
                  getCellAlignClass(columns[index]?.align),
                  getToneClass(cell.tone),
                  cell.className,
                )}
              >
                {cell.content}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
