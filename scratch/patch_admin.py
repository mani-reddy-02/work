import re

with open('mediquee admin/src/pages/DepartmentDetails.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import { departmentService } from '../services/departmentService';",
    "import { departmentService } from '../services/departmentService';\nimport { departmentIcons, allIcons } from '../utils/diseaseIcons';"
)

# 2. States
content = content.replace(
    "const [searchDisease, setSearchDisease] = useState('');",
    """const [searchDisease, setSearchDisease] = useState('');
  const [newDiseaseIcon, setNewDiseaseIcon] = useState('');
  const [isEditDiseaseModalOpen, setIsEditDiseaseModalOpen] = useState(false);
  const [editDiseaseId, setEditDiseaseId] = useState('');
  const [editDiseaseName, setEditDiseaseName] = useState('');
  const [editDiseaseIcon, setEditDiseaseIcon] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  const openAddDiseaseModal = () => {
    const available = departmentIcons[department?.name] || allIcons;
    setNewDiseaseIcon(available[0] || '');
    setNewDiseaseName('');
    setShowIconPicker(false);
    setIsAddModalOpen(true);
  };
  
  const handleEditDisease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editDiseaseName.trim()) return;
    const res = await departmentService.updateDisease(token, editDiseaseId, { name: editDiseaseName, icon: editDiseaseIcon });
    if (res.success) {
      setIsEditDiseaseModalOpen(false);
      fetchDepartment();
    } else {
      alert(res.error?.message || 'Failed to update disease');
    }
  };"""
)

# 3. handleAddDisease
content = content.replace(
    "const res = await departmentService.createDisease(token, id, newDiseaseName);",
    "const res = await departmentService.createDisease(token, id, newDiseaseName, '', newDiseaseIcon);"
)

# 4. diseaseColumns - Disease Name
content = content.replace(
    "accessor: (d) => <span className=\"font-medium text-slate-900 \">{d.name}</span>,",
    """accessor: (d) => (
        <div className="flex items-center gap-2">
          <img 
            src={`/icons/conditions/${d.icon || departmentIcons[department?.name]?.[0] || allIcons[0]}`} 
            alt={d.name} 
            className="w-8 h-8 object-cover rounded-md bg-slate-50 border border-slate-100" 
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/icons/conditions/' + (departmentIcons[department?.name]?.[0] || allIcons[0]);
            }}
          />
          <span className="font-medium text-slate-900 ">{d.name}</span>
        </div>
      ),"""
)

# 5. diseaseColumns - Actions
content = content.replace(
    """<button 
            onClick={() => handleDeleteDisease(d.id)}
            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
            title="Remove Disease"
          >
            <Trash2 size={16} />
          </button>""",
    """<button 
            onClick={() => {
              setEditDiseaseId(d.id);
              setEditDiseaseName(d.name);
              setEditDiseaseIcon(d.icon || departmentIcons[department?.name]?.[0] || allIcons[0]);
              setShowIconPicker(false);
              setIsEditDiseaseModalOpen(true);
            }}
            className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
            title="Edit Disease"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => handleDeleteDisease(d.id)}
            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
            title="Remove Disease"
          >
            <Trash2 size={16} />
          </button>"""
)

# 6. Add Disease button click
content = content.replace(
    "onClick={() => setIsAddModalOpen(true)}",
    "onClick={openAddDiseaseModal}"
)

# 7. Add Disease Modal Form
form_replacement = """<div>
                <label className="block text-sm font-medium text-slate-700  mb-1">
                  Disease Icon
                </label>
                {!showIconPicker ? (
                  <div className="flex items-center gap-4 p-3 border border-slate-200 rounded-lg">
                    <img src={`/icons/conditions/${newDiseaseIcon || 'Heart Attack.webp'}`} alt="Icon" className="w-12 h-12 object-cover rounded-md" />
                    <button type="button" onClick={() => setShowIconPicker(true)} className="text-sm text-blue-600 font-medium hover:underline">
                      Change Icon
                    </button>
                  </div>
                ) : (
                  <div className="p-3 border border-slate-200 rounded-lg max-h-48 overflow-y-auto grid grid-cols-5 gap-2">
                    {(departmentIcons[department?.name] || allIcons).map((icon) => (
                      <div 
                        key={icon} 
                        onClick={() => { setNewDiseaseIcon(icon); setShowIconPicker(false); }}
                        className={`cursor-pointer border p-1 rounded-md hover:border-blue-500 ${newDiseaseIcon === icon ? 'border-blue-500 bg-blue-50' : 'border-transparent'}`}
                      >
                        <img src={`/icons/conditions/${icon}`} alt={icon} className="w-full h-auto object-cover rounded" title={icon.replace('.webp', '')} />
                      </div>
                    ))}
                    <div className="col-span-5 text-right mt-2 border-t pt-2">
                      <button type="button" onClick={() => setShowIconPicker(false)} className="text-xs font-medium text-slate-500 hover:underline">Close</button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="pt-4 flex gap-3">"""
              
content = content.replace(
    "<div className=\"pt-4 flex gap-3\">",
    form_replacement,
    1 # Only replace the first one for the Add modal
)

# 8. Add Edit Disease Modal
edit_modal = """{isEditDiseaseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Edit Disease</h2>
            </div>
            
            <form onSubmit={handleEditDisease} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Disease Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editDiseaseName}
                  onChange={(e) => setEditDiseaseName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Disease Icon
                </label>
                {!showIconPicker ? (
                  <div className="flex items-center gap-4 p-3 border border-slate-200 rounded-lg">
                    <img src={`/icons/conditions/${editDiseaseIcon}`} alt="Icon" className="w-12 h-12 object-cover rounded-md" />
                    <button type="button" onClick={() => setShowIconPicker(true)} className="text-sm text-blue-600 font-medium hover:underline">
                      Change Icon
                    </button>
                  </div>
                ) : (
                  <div className="p-3 border border-slate-200 rounded-lg max-h-48 overflow-y-auto grid grid-cols-5 gap-2">
                    {(departmentIcons[department?.name] || allIcons).map((icon) => (
                      <div 
                        key={icon} 
                        onClick={() => { setEditDiseaseIcon(icon); setShowIconPicker(false); }}
                        className={`cursor-pointer border p-1 rounded-md hover:border-blue-500 ${editDiseaseIcon === icon ? 'border-blue-500 bg-blue-50' : 'border-transparent'}`}
                      >
                        <img src={`/icons/conditions/${icon}`} alt={icon} className="w-full h-auto object-cover rounded" title={icon.replace('.webp', '')} />
                      </div>
                    ))}
                    <div className="col-span-5 text-right mt-2 border-t pt-2">
                      <button type="button" onClick={() => setShowIconPicker(false)} className="text-xs font-medium text-slate-500 hover:underline">Close</button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditDiseaseModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && ("""

content = content.replace("{isEditModalOpen && (", edit_modal)

with open('mediquee admin/src/pages/DepartmentDetails.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
