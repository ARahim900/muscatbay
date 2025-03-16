
import React from 'react';

interface DataTableColumn {
  key: string;
  header: string;
  numeric?: boolean;
  render?: (value: any, row: any, theme: any) => React.ReactNode;
}

interface DataTableProps {
  data: any[];
  columns: DataTableColumn[];
  theme: any;
}

const DataTable: React.FC<DataTableProps> = ({ data, columns, theme }) => {
  // Helper function to format numbers
  const formatNumber = (num: number, decimals = 0) => {
    if (num === undefined || num === null) return '';
    return num.toLocaleString(undefined, { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };
  
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y ${theme.border}`}>
        <thead className={theme.panelBg}>
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={`px-4 py-3 text-left text-xs font-medium ${theme.textSecondary} uppercase tracking-wider ${
                  column.numeric ? 'text-right' : ''
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`${theme.cardBg} divide-y ${theme.border}`}>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? theme.cardBg : theme.panelBg}>
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={`px-4 py-3 whitespace-nowrap text-sm ${theme.text} ${
                    column.numeric ? 'text-right font-medium' : ''
                  }`}
                >
                  {column.render 
                    ? column.render(row[column.key], row, theme) 
                    : column.numeric && typeof row[column.key] === 'number'
                      ? formatNumber(row[column.key])
                      : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
