import re

filepath = 'mediquee admin/src/pages/Labs.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add states for KPIs
state_insertion = """  const [totalLabs, setTotalLabs] = useState<number | null>(null);
  const [totalHospitalLabs, setTotalHospitalLabs] = useState<number | null>(null);
  const [totalStandaloneLabs, setTotalStandaloneLabs] = useState<number | null>(null);

  useEffect(() => {
    const fetchKPIs = async () => {
      if (!token) return;
      try {
        const [allRes, hospitalRes, standaloneRes] = await Promise.all([
          fetch(`${API_URL}/laboratories?limit=1`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/laboratories?type=HOSPITAL_BASED&limit=1`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/laboratories?type=STANDALONE&limit=1`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        const allResult = await allRes.json();
        const hospitalResult = await hospitalRes.json();
        const standaloneResult = await standaloneRes.json();

        if (allResult.success) setTotalLabs(allResult.pagination?.total || 0);
        if (hospitalResult.success) setTotalHospitalLabs(hospitalResult.pagination?.total || 0);
        if (standaloneResult.success) setTotalStandaloneLabs(standaloneResult.pagination?.total || 0);
      } catch (err) {
        console.error('Error fetching KPIs', err);
      }
    };
    fetchKPIs();
  }, [token]);
"""

content = content.replace("  const [showFilters, setShowFilters] = useState(false);", state_insertion + "\n  const [showFilters, setShowFilters] = useState(false);")


# Add imports
content = content.replace(
    "import { Search, Filter, Building2 } from 'lucide-react';",
    "import { Search, Filter, Building2, FlaskConical } from 'lucide-react';"
)

# Add KPI UI
kpi_ui = """      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <FlaskConical size={20} />
            </div>
            <h2 className="text-slate-600 font-medium">Total No. of Labs</h2>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold text-slate-900">
              {totalLabs === null ? '—' : totalLabs}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-2">All laboratories</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <h2 className="text-slate-600 font-medium">Hospital Labs</h2>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold text-slate-900">
              {totalHospitalLabs === null ? '—' : totalHospitalLabs}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-2">Hospital-based laboratories</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FlaskConical size={20} />
            </div>
            <h2 className="text-slate-600 font-medium">Standalone Labs</h2>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold text-slate-900">
              {totalStandaloneLabs === null ? '—' : totalStandaloneLabs}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-2">Independent laboratories</p>
        </div>
      </div>
"""

content = content.replace(
    '      <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 gap-1">',
    kpi_ui + '\n      <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 gap-1">'
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched Labs.tsx with KPIs")
