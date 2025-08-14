import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const ResponsiveTable = ({ 
  columns, 
  data, 
  essentialColumns = [], 
  renderExpandedRow,
  className = "",
  onRowClick,
  sortable = false,
  onSort,
  sortField,
  sortDirection
}) => {
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Determine which columns to show by default on mobile
  const getVisibleColumns = () => {
    if (window.innerWidth >= 768) {
      return columns; // Show all columns on desktop
    }
    return essentialColumns.length > 0 ? essentialColumns : columns.slice(0, 2);
  };

  const toggleRowExpansion = (rowId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(rowId)) {
      newExpandedRows.delete(rowId);
    } else {
      newExpandedRows.add(rowId);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleSort = (field) => {
    if (onSort && sortable) {
      onSort(field);
    }
  };

  const SortableHeader = ({ field, children, className = "" }) => {
    if (!sortable) {
      return <th className={className}>{children}</th>;
    }

    return (
      <th 
        className={`${className} cursor-pointer hover:bg-gray-100`}
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-1">
          {children}
          {sortField === field && (
            <span className="text-blue-600">
              {sortDirection === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </div>
      </th>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <SortableHeader
                  key={column.key || index}
                  field={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </SortableHeader>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr 
                key={row.id || rowIndex} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((column, colIndex) => (
                  <td key={column.key || colIndex} className="px-6 py-4 whitespace-nowrap">
                    {column.render ? column.render(row, column) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {data.map((row, rowIndex) => {
          const isExpanded = expandedRows.has(row.id || rowIndex);
          const visibleColumns = getVisibleColumns();
          
          return (
            <div key={row.id || rowIndex} className="border-b border-gray-200 last:border-b-0">
              {/* Main Row */}
              <div 
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => onRowClick && onRowClick(row)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {visibleColumns.map((column, colIndex) => (
                      <div key={column.key || colIndex} className="mb-2 last:mb-0">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {column.header}
                        </div>
                        <div className="text-sm text-gray-900">
                          {column.render ? column.render(row, column) : row[column.key]}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRowExpansion(row.id || rowIndex);
                    }}
                    className="ml-4 p-2 text-gray-400 hover:text-gray-600"
                  >
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
                  <div className="pt-4 space-y-3">
                    {columns.filter(col => !visibleColumns.includes(col)).map((column, colIndex) => (
                      <div key={column.key || colIndex}>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {column.header}
                        </div>
                        <div className="text-sm text-gray-900">
                          {column.render ? column.render(row, column) : row[column.key]}
                        </div>
                      </div>
                    ))}
                    {renderExpandedRow && renderExpandedRow(row)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResponsiveTable;
