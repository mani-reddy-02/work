import re

filepath = 'mediquee admin/src/pages/Dashboard.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
import_pattern = r"import KpiCard from '../components/ui/KpiCard';"
content = content.replace(import_pattern, "import KpiCard from '../components/ui/KpiCard';\nimport PendingVerifications from '../components/admin/PendingVerifications';")

# Add component after master filters
injection_pattern = r'        </div>\n      </div>\n\n      \{loading \? \('
replacement = """        </div>
      </div>

      <PendingVerifications />

      {loading ? ("""
content = re.sub(injection_pattern, replacement, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected PendingVerifications into Dashboard.tsx")
