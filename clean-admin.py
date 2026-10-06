import re

filepath = 'backend/src/modules/admin/admin.controller.ts'
with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Remove the bad line
content = content.replace('/ /   t o u c h \n \n ', '')
content = content.replace('/ /   t o u c h', '')
content = content.replace('// touch', '')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content.strip() + '\n')

print("Cleaned admin.controller.ts")
