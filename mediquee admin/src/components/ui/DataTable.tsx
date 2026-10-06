import React from 'react';
import { Search, ChevronDown, Filter } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T, rowIndex: number) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  onRowClick?: (item: T) => void;
  actions?: React.ReactNode;
  emptyMessage?: string;
  onFilterClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
}

function DataTable<T>({ 
  data, 
  columns, 
  keyExtractor, 
  searchPlaceholder = 'Search...',
  onSearch,
  onRowClick,
  actions,
  emptyMessage = 'No results found',
  onFilterClick,
  pagination
}: DataTableProps<T>) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch?.(e.target.value)}
            className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {actions}
          <button 
            onClick={onFilterClick}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <Filter size={16} />
            Filters
            <ChevronDown size={14} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th key={idx} className={`px-6 py-3 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length > 0 ? (
              data.map((item, rowIndex) => (
                <tr 
                  key={keyExtractor(item)} 
                  onClick={() => onRowClick?.(item)}
                  className={`group transition-colors ${onRowClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className={`px-6 py-4 text-sm text-slate-700 ${col.className || ''}`}>
                      {typeof col.accessor === 'function' 
                        ? col.accessor(item, rowIndex) 
                        : (item[col.accessor as keyof T] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <Search size={24} className="text-slate-400" />
                    </div>
                    <p className="text-base font-medium text-slate-900 mb-1">{emptyMessage}</p>
                    <p className="text-sm">Try adjusting your search or filters to find what you're looking for.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Table Pagination */}
      {pagination && pagination.totalResults > 0 && (
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-500 gap-4">
          <div>
            Showing {(pagination.currentPage - 1) * pagination.pageSize + 1}–{Math.min(pagination.currentPage * pagination.pageSize, pagination.totalResults)} of {pagination.totalResults} results
          </div>
          <div className="flex gap-1 overflow-x-auto max-w-full pb-1">
            <button 
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: pagination.totalPages }).map((_, i) => {
              // Show max 5 pages logic if needed, but for now just show all or implement a basic window
              // To keep it simple and match reqs, we'll show pages
              if (
                pagination.totalPages <= 7 ||
                i === 0 ||
                i === pagination.totalPages - 1 ||
                (i + 1 >= pagination.currentPage - 1 && i + 1 <= pagination.currentPage + 1)
              ) {
                return (
                  <button
                    key={i}
                    onClick={() => pagination.onPageChange(i + 1)}
                    className={`px-3 py-1 border rounded font-medium ${
                      pagination.currentPage === i + 1 
                      ? 'bg-blue-50 text-blue-600 border-blue-200' 
                      : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              } else if (
                (i === 1 && pagination.currentPage > 3) ||
                (i === pagination.totalPages - 2 && pagination.currentPage < pagination.totalPages - 2)
              ) {
                return <span key={i} className="px-2 py-1">...</span>;
              }
              return null;
            })}

            <button 
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
      {!pagination && data.length > 0 && (
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
          <div>Showing {data.length} results</div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
