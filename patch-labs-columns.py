import re

filepath = 'mediquee admin/src/pages/Labs.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "const baseColumns = [\n    { key: 'sno', label: 'S.No' },\n    { key: 'name', label: 'Lab Name' },\n    { key: 'id', label: 'Lab ID' },\n  ];",
    "const baseColumns = [\n    { accessor: 'sno', header: 'S.No' },\n    { accessor: 'name', header: 'Lab Name' },\n    { accessor: 'id', header: 'Lab ID' },\n  ];"
)

content = content.replace(
    "const hospitalColumns = activeTab === 'HOSPITAL_BASED' \n    ? [{ key: 'hospitalName', label: 'Hospital' }] \n    : [];",
    "const hospitalColumns = activeTab === 'HOSPITAL_BASED' \n    ? [{ accessor: 'hospitalName', header: 'Hospital' }] \n    : [];"
)

content = content.replace(
    "const endColumns = [\n    { key: 'location', label: 'Location' },\n    { key: 'contactPhone', label: 'Contact' },\n    { key: 'status', label: 'Status', render: (val: string) => (\n      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${val === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>\n        {val || 'Active'}\n      </span>\n    )}\n  ];",
    "const endColumns = [\n    { accessor: 'location', header: 'Location' },\n    { accessor: 'contactPhone', header: 'Contact' },\n    { accessor: (item: any) => (\n      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>\n        {item.status || 'Active'}\n      </span>\n    ), header: 'Status' }\n  ];"
)

content = content.replace(
    "onRowClick={(o) => navigate(`/admin/labs/${o.rawId}`)}",
    "onRowClick={(o: any) => navigate(`/admin/labs/${o.id}`)}"
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched Labs.tsx columns format")
