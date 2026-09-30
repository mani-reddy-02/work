import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Search } from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import { departmentService } from '../services/departmentService';
import { departmentIcons, allIcons } from '../../../medi-user/src/utils/diseaseIcons';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable, { Column } from '../components/ui/DataTable';

const DepartmentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAdminAuth();
  const [department, setDepartment] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DISEASES' | 'HOSPITALS'>('OVERVIEW');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptDesc, setEditDeptDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [newDiseaseName, setNewDiseaseName] = useState('');
  const [searchDisease, setSearchDisease] = useState('');
  const [newDiseaseIcon, setNewDiseaseIcon] = useState('');
  const [isEditDiseaseModalOpen, setIsEditDiseaseModalOpen] = useState(false);
  const [editDiseaseId, setEditDiseaseId] = useState('');
  const [editDiseaseName, setEditDiseaseName] = useState('');
  const [editDiseaseIcon, setEditDiseaseIcon] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearchTerm, setIconSearchTerm] = useState('');
  
  const openAddDiseaseModal = () => {
    const available = departmentIcons[department?.name] || allIcons;
    setNewDiseaseIcon(available[0] || '');
    setNewDiseaseName('');
    setShowIconPicker(false);
    setIconSearchTerm('');
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
  };

  const fetchDepartment = async () => {
    if (!token || !id) return;
    const res = await departmentService.getDepartmentById(token, id);
    if (res.success) {
      setDepartment(res.data);
    }
  };

  useEffect(() => {
    fetchDepartment();
  }, [token, id]);

  const handleEditDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !id || !editDeptName.trim()) return;
    
    setIsSubmitting(true);
    setEditError('');
    
    const res = await departmentService.updateDepartment(token, id, { name: editDeptName, description: editDeptDesc });
    if (res.success) {
      setIsEditModalOpen(false);
      fetchDepartment();
    } else {
      setEditError(res.error?.message || 'Failed to update department');
    }
    setIsSubmitting(false);
  };

  const openEditModal = () => {
    setEditDeptName(department.name);
    setEditDeptDesc(department.description || '');
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleAddDisease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !id || !newDiseaseName.trim()) return;
    const res = await departmentService.createDisease(token, id, newDiseaseName, '', newDiseaseIcon);
    if (res.success) {
      setIsAddModalOpen(false);
      setNewDiseaseName('');
      fetchDepartment();
    } else {
      alert(res.error?.message || 'Failed to add disease');
    }
  };

  const handleDeleteDisease = async (diseaseId: string) => {
    if (!token) return;
    if (window.confirm('Are you sure you want to remove this disease?')) {
      const res = await departmentService.deleteDisease(token, diseaseId);
      if (res.success) {
        fetchDepartment();
      } else {
        alert(res.error?.message || 'Failed to remove disease');
      }
    }
  };

  if (!department) return <div className="p-8 text-center text-slate-500">Loading department details...</div>;

  const filteredDiseases = (department.diseases || []).filter((d: any) => 
    d.name.toLowerCase().includes(searchDisease.toLowerCase())
  );

  const diseaseColumns: Column<any>[] = [
    {
      header: 'Disease Name',
      accessor: (d) => (
        <div className="flex items-center gap-2">
          <img 
            src={`/optimized/${d.icon || departmentIcons[department?.name]?.[0] || allIcons[0]}`} 
            alt={d.name} 
            className="w-8 h-8 object-cover rounded-md bg-slate-50 border border-slate-100" 
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/optimized/' + (departmentIcons[department?.name]?.[0] || allIcons[0]);
            }}
          />
          <span className="font-medium text-slate-900 ">{d.name}</span>
        </div>
      ),
    },
    {
      header: 'Description',
      accessor: (d) => <span className="text-sm text-slate-500">{d.description || '—'}</span>,
    },
    {
      header: 'Actions',
      accessor: (d) => (
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setEditDiseaseId(d.id);
              setEditDiseaseName(d.name);
              setEditDiseaseIcon(d.icon || departmentIcons[department?.name]?.[0] || allIcons[0]);
              setShowIconPicker(false);
              setIconSearchTerm('');
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
          </button>
        </div>
      ),
    }
  ];

  const hospitalColumns: Column<any>[] = [
    {
      header: 'Hospital',
      accessor: (h) => <span className="font-medium">{h.name}</span>,
    },
    {
      header: 'City',
      accessor: (h) => <span>{h.city}</span>,
    },
    {
      header: 'Doctors (in Dept)',
      accessor: (h) => <span>{h.totalDoctors}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/departments')}
            className="p-2 bg-white  text-slate-600  border border-slate-200  rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 ">{department.name}</h1>
            <p className="text-sm text-slate-500 ">Manage diseases and view hospitals for this department</p>
          </div>
        </div>
        <button
          onClick={openEditModal}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Edit2 size={16} /> Edit Department
        </button>
      </div>

      <div className="flex border-b border-slate-200 ">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'OVERVIEW'
              ? 'border-blue-600 text-blue-600  '
              : 'border-transparent text-slate-500 hover:text-slate-700  :text-slate-300'
          }`}
          onClick={() => setActiveTab('OVERVIEW')}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'DISEASES'
              ? 'border-blue-600 text-blue-600  '
              : 'border-transparent text-slate-500 hover:text-slate-700  :text-slate-300'
          }`}
          onClick={() => setActiveTab('DISEASES')}
        >
          Diseases ({department.diseaseCount})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'HOSPITALS'
              ? 'border-blue-600 text-blue-600  '
              : 'border-transparent text-slate-500 hover:text-slate-700  :text-slate-300'
          }`}
          onClick={() => setActiveTab('HOSPITALS')}
        >
          Hospitals ({department.hospitalCount})
        </button>
      </div>

      <div className="bg-white  border border-slate-200  rounded-xl shadow-sm p-6">
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 ">Department Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-sm text-slate-500">Name</span>
                <span className="font-medium text-slate-900 ">{department.name}</span>
              </div>
              <div>
                <span className="block text-sm text-slate-500">Status</span>
                <StatusBadge status={department.status} />
              </div>
              <div>
                <span className="block text-sm text-slate-500">Total Diseases</span>
                <span className="font-medium text-slate-900 ">{department.diseaseCount}</span>
              </div>
              <div>
                <span className="block text-sm text-slate-500">Total Hospitals</span>
                <span className="font-medium text-slate-900 ">{department.hospitalCount}</span>
              </div>
              <div>
                <span className="block text-sm text-slate-500">Total Doctors</span>
                <span className="font-medium text-slate-900 ">{department.doctorCount}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'DISEASES' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search diseases..."
                  value={searchDisease}
                  onChange={(e) => setSearchDisease(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50  border border-slate-200  rounded-lg text-sm focus:outline-none focus:border-blue-500  transition-colors w-64"
                />
              </div>
              <button 
                onClick={openAddDiseaseModal}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} /> Add Disease
              </button>
            </div>
            
            <DataTable 
              columns={diseaseColumns} 
              data={filteredDiseases} 
              keyExtractor={(d) => d.id} 
              emptyMessage={searchDisease ? "No diseases match your search." : "No diseases added to this department."}
            />
          </div>
        )}

        {activeTab === 'HOSPITALS' && (
          <div className="space-y-4">
            <DataTable 
              columns={hospitalColumns} 
              data={department.hospitals || []} 
              keyExtractor={(h) => h.id} 
              emptyMessage="No hospitals associated with this department."
            />
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white  rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200 ">
              <h2 className="text-xl font-bold text-slate-900 ">Add Disease</h2>
              <p className="text-sm text-slate-500 mt-1">Add a new disease to {department.name}</p>
            </div>
            
            <form onSubmit={handleAddDisease} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700  mb-1">
                  Disease Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newDiseaseName}
                  onChange={(e) => setNewDiseaseName(e.target.value)}
                  className="w-full px-3 py-2 bg-white  border border-slate-300  rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 "
                  placeholder="e.g. Heart Attack"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700  mb-1">
                  Disease Icon
                </label>
                {!showIconPicker ? (
                  <div className="flex items-center gap-4 p-3 border border-slate-200 rounded-lg">
                    <img src={`/optimized/${newDiseaseIcon || 'Heart Attack.webp'}`} alt="Icon" className="w-12 h-12 object-cover rounded-md" />
                    <button type="button" onClick={() => setShowIconPicker(true)} className="text-sm text-blue-600 font-medium hover:underline">
                      Change Icon
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="Search icons..." 
                      value={iconSearchTerm} 
                      onChange={(e) => setIconSearchTerm(e.target.value)} 
                      className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
                    />
                    <div className="p-3 border border-slate-200 rounded-lg max-h-48 overflow-y-auto grid grid-cols-5 gap-2">
                      {(departmentIcons[department?.name] || allIcons).filter(icon => icon.toLowerCase().includes(iconSearchTerm.toLowerCase())).map((icon) => (
                        <div 
                          key={icon} 
                          onClick={() => { setNewDiseaseIcon(icon); setShowIconPicker(false); }}
                          className={`cursor-pointer border p-1 rounded-md hover:border-blue-500 ${newDiseaseIcon === icon ? 'border-blue-500 bg-blue-50' : 'border-transparent'}`}
                        >
                          <img src={`/optimized/${icon}`} alt={icon} className="w-full h-auto object-cover rounded" title={icon.replace('.webp', '')} />
                        </div>
                      ))}
                      <div className="col-span-5 text-right mt-2 border-t pt-2">
                        <button type="button" onClick={() => setShowIconPicker(false)} className="text-xs font-medium text-slate-500 hover:underline">Close</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300  rounded-lg text-slate-700  font-medium hover:bg-slate-50 :bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Add Disease
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditDiseaseModalOpen && (
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
                    <img src={`/optimized/${editDiseaseIcon}`} alt="Icon" className="w-12 h-12 object-cover rounded-md" />
                    <button type="button" onClick={() => setShowIconPicker(true)} className="text-sm text-blue-600 font-medium hover:underline">
                      Change Icon
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="Search icons..." 
                      value={iconSearchTerm} 
                      onChange={(e) => setIconSearchTerm(e.target.value)} 
                      className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
                    />
                    <div className="p-3 border border-slate-200 rounded-lg max-h-48 overflow-y-auto grid grid-cols-5 gap-2">
                      {(departmentIcons[department?.name] || allIcons).filter(icon => icon.toLowerCase().includes(iconSearchTerm.toLowerCase())).map((icon) => (
                        <div 
                          key={icon} 
                          onClick={() => { setEditDiseaseIcon(icon); setShowIconPicker(false); }}
                          className={`cursor-pointer border p-1 rounded-md hover:border-blue-500 ${editDiseaseIcon === icon ? 'border-blue-500 bg-blue-50' : 'border-transparent'}`}
                        >
                          <img src={`/optimized/${icon}`} alt={icon} className="w-full h-auto object-cover rounded" title={icon.replace('.webp', '')} />
                        </div>
                      ))}
                      <div className="col-span-5 text-right mt-2 border-t pt-2">
                        <button type="button" onClick={() => setShowIconPicker(false)} className="text-xs font-medium text-slate-500 hover:underline">Close</button>
                      </div>
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

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Edit Department</h2>
            </div>
            <form onSubmit={handleEditDepartment} className="p-4 space-y-4">
              {editError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {editError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  value={editDeptName}
                  onChange={(e) => setEditDeptName(e.target.value)}
                  placeholder="e.g. Cardiology"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={editDeptDesc}
                  onChange={(e) => setEditDeptDesc(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              
              <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !editDeptName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentDetails;
