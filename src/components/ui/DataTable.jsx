import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function DataTable({ 
  columns, 
  data, 
  onRowClick,
  sortColumn,
  sortDirection,
  onSort,
  emptyMessage = "No data available"
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.08]">
            {columns.map((col, i) => (
              <th 
                key={i}
                className={`
                  px-4 py-3 text-left text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500
                  ${col.sortable ? 'cursor-pointer hover:text-gray-400' : ''}
                  ${col.width ? col.width : ''}
                `}
                onClick={() => col.sortable && onSort && onSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortColumn === col.key && (
                    sortDirection === 'asc' 
                      ? <ChevronUp className="w-3 h-3" />
                      : <ChevronDown className="w-3 h-3" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td 
                colSpan={columns.length} 
                className="px-4 py-12 text-center text-gray-500 text-sm"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr 
                key={row.id || rowIndex}
                className={`
                  border-b border-white/[0.05] transition-colors
                  ${onRowClick ? 'cursor-pointer hover:bg-white/[0.02]' : ''}
                `}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((col, colIndex) => (
                  <td 
                    key={colIndex}
                    className={`px-4 py-4 text-sm ${col.className || ''}`}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}