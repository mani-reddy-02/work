import re

filepath = 'backend/src/modules/laboratories/laboratories.controller.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("pincode: true,\n          services: true", "pincode: true,\n          services: true,\n          hospitalShare: true")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched laboratories.controller.ts for hospitalShare")
