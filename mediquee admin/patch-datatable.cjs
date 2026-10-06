const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/ui/DataTable.tsx');
let content = fs.readFileSync(file, 'utf8');

// Update Interface
content = content.replace(
  /actions\?: React\.ReactNode;\s*emptyMessage\?: string;\s*\}/,
  `actions?: React.ReactNode;
  emptyMessage?: string;
  onFilterClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
}`
);

// Update destructuring
content = content.replace(
  /actions,\s*emptyMessage = 'No results found'\s*\}: DataTableProps<T>\)/,
  `actions,
  emptyMessage = 'No results found',
  onFilterClick,
  pagination
}: DataTableProps<T>)`
);

// Update Filters button
content = content.replace(
  /<button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">\s*<Filter size=\{16\} \/>\s*Filters\s*<ChevronDown size=\{14\} className="text-slate-400" \/>\s*<\/button>/m,
  `<button 
            onClick={onFilterClick}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <Filter size={16} />
            Filters
            <ChevronDown size={14} className="text-slate-400" />
          </button>`
);

// Update Pagination footer
const paginationCode = `{/* Table Pagination */}
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
                    className={\`px-3 py-1 border rounded font-medium \${
                      pagination.currentPage === i + 1 
                      ? 'bg-blue-50 text-blue-600 border-blue-200' 
                      : 'border-slate-200 hover:bg-slate-50'
                    }\`}
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
      )}`;

content = content.replace(
  /\{\/\* Table Pagination Placeholder \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*\);\s*\}/,
  paginationCode + '\n    </div>\n  );\n}'
);

fs.writeFileSync(file, content);
console.log('DataTable updated');
