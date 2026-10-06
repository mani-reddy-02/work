const fs = require('fs');
const content = fs.readFileSync('mediquee admin/src/pages/Departments.tsx', 'utf8');

let newContent = content.replace(/<div className="flex items-center gap-4 bg-white p-4 border border-slate-200 rounded-xl shadow-sm relative">[\s\S]*?<\/div>\s*<div className="relative">/g, '<div className="relative">');

newContent = newContent.replace(/<DataTable[\s\S]*?pagination=\{\{/g, (match) => {
    if(match.includes('onSearch=')) return match;
    return match.replace(/emptyMessage/, searchPlaceholder="Search departments..."\n            onSearch={setSearch}\n            onFilterClick={(e) => {\n              e.stopPropagation();\n              setShowFilters(!showFilters);\n            }}\n            emptyMessage);
});

newContent = newContent.replace(/\{showFilters && FilterPopover\}\s*<\/div>\s*<div className="relative">/, '{showFilters && FilterPopover}\n        <div className="relative">');

fs.writeFileSync('mediquee admin/src/pages/Departments.tsx', newContent, 'utf8');
console.log('patched Departments.tsx');

