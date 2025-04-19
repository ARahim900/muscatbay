import type React from "react"
import { formatNumber } from "@/lib/utils"

interface Column {
  key: string
  header: string
  numeric?: boolean
  decimals?: number
  render?: (value: any, row: any, theme: any) => React.ReactNode
}

interface DataTableProps {
  data: any[]
  columns: Column[]
  theme: any
}

export const DataTable = ({ data, columns, theme }: DataTableProps) => {
  if (!Array.isArray(data)) {
    console.error("Invalid data provided to DataTable:", data)
    return <div className={`${theme.textSecondary} p-4`}>Error: Invalid data format for table.</div>
  }

  if (data.length === 0) {
    return <div className={`${theme.textSecondary} text-center py-6`}>No data available for the selected period.</div>
  }

  return (
    <div className={`overflow-x-auto rounded-lg border ${theme.border}`}>
      <table className={`min-w-full divide-y ${theme.border}`}>
        <thead className={theme.panelBg}>
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={`px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase tracking-wider ${column.numeric ? "text-right" : ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`${theme.cardBg} divide-y ${theme.border}`}>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`transition-colors duration-150 ${
                rowIndex % 2 === 0 ? theme.cardBg : theme.panelBg
              } hover:bg-opacity-70 ${rowIndex % 2 === 0 ? `hover:${theme.panelBg}` : `hover:${theme.cardBg}`}`}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={`px-4 py-3 whitespace-nowrap text-sm ${theme.text} ${column.numeric ? "text-right font-medium" : ""}`}
                >
                  {column.render
                    ? column.render(row[column.key], row, theme)
                    : column.numeric &&
                        (typeof row[column.key] === "number" ||
                          (typeof row[column.key] === "string" && !isNaN(Number(row[column.key]))))
                      ? formatNumber(row[column.key], column.decimals)
                      : (row[column.key] ?? "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
