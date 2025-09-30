import React from 'react';

interface Column {
  key: string;
  label: string;
  width?: string;
  hideOnMobile?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface ResponsiveTableProps {
  columns: Column[];
  data: any[];
  emptyState?: React.ReactNode;
  onRowClick?: (row: any) => void;
}

export function ResponsiveTable({ 
  columns, 
  data, 
  emptyState,
  onRowClick 
}: ResponsiveTableProps) {
  if (data.length === 0 && emptyState) {
    return <div>{emptyState}</div>;
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr 
                key={index} 
                className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {data.map((row, index) => (
          <div 
            key={index} 
            className={`bg-white border border-gray-200 rounded-lg p-4 ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
            onClick={() => onRowClick?.(row)}
          >
            {columns.filter(col => !col.hideOnMobile).map((column) => (
              <div key={column.key} className="flex justify-between items-center py-1">
                <span className="text-sm font-medium text-gray-500">{column.label}:</span>
                <span className="text-sm text-gray-900">
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

export default ResponsiveTable;