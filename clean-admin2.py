import os

filepath = 'backend/src/modules/admin/admin.controller.ts'
with open(filepath, 'rb') as f:
    data = f.read()

# Remove null bytes
clean_data = data.replace(b'\x00', b'')

with open(filepath, 'wb') as f:
    f.write(clean_data)

print("Removed null bytes from admin.controller.ts")
