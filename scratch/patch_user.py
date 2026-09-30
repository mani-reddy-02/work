import re

with open('medi-user/src/pages/Specialties.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import
if 'import { departmentIcons, allIcons }' not in content:
    content = content.replace(
        "import { ChevronRight,",
        "import { departmentIcons, allIcons } from '../utils/diseaseIcons';\nimport { ChevronRight,"
    )

# 2. Modify getDiseasesForCategory
content = content.replace(
    """    icon: Stethoscope,
    bg: ['bg-red-50', 'bg-blue-50', 'bg-emerald-50', 'bg-purple-50', 'bg-amber-50'][idx % 5]""",
    """    icon: Stethoscope,
    bg: ['bg-red-50', 'bg-blue-50', 'bg-emerald-50', 'bg-purple-50', 'bg-amber-50'][idx % 5],
    iconName: bm.icon || (departmentIcons[catName] ? departmentIcons[catName][0] : allIcons[0])"""
)

# 3. Modify icon render in Specific Disease List
content = content.replace(
    """<ItemIcon className=\"w-6 h-6 text-slate-700\" />""",
    """{item.iconName ? (
                          <img src={`/icons/conditions/${item.iconName}`} alt={item.name} className=\"w-6 h-6 object-cover\" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <ItemIcon className=\"w-6 h-6 text-slate-700\" />
                        )}"""
)

with open('medi-user/src/pages/Specialties.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
