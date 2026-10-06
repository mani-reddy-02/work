import re
import os

filepath = 'mediquee admin/src/pages/LabDetails.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "const res = await fetch(`${API_URL}/admin/labs/${id}`, {",
    "const res = await fetch(`${API_URL}/laboratories/${id}`, {"
)

replacement_block = """        if (result.success) {
          const labData = {
            ...result.data,
            type: result.data.businessType === 'LABORATORY' ? 'STANDALONE' : 'HOSPITAL_BASED',
            address: result.data.addressLine1,
            hospital: result.data.businessType !== 'LABORATORY' ? {
              id: result.data.id,
              name: result.data.name,
              city: result.data.city,
              state: result.data.state
            } : null
          };
          setLab(labData);
        }
        else setError(result.message || 'Lab not found');"""

content = content.replace(
"""        if (result.success) setLab(result.data);
        else setError(result.message || 'Lab not found');""",
replacement_block
)

content = content.replace("Lab Not Found", "Laboratory Not Found")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched LabDetails.tsx")
