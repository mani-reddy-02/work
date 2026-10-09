import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../contexts/AuthContext';
import { Plus, GripVertical, Image as ImageIcon, Link as LinkIcon, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import SinglePosterPreview from '../components/SinglePosterPreview';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const MODULES = ['HOME', 'HOSPITAL', 'DOCTOR', 'LABS'];

const POSITIONS_BY_MODULE: Record<string, {id: string, label: string}[]> = {
  HOME: [{id: 'HERO_BANNER', label: 'Home Hero Banner'}],
  HOSPITAL: [{id: 'HERO_BANNER', label: 'Hospital Promotional Banner'}],
  DOCTOR: [{id: 'HERO_BANNER', label: 'Doctor Hero Banner'}],
  LABS: [{id: 'HERO_BANNER', label: 'Labs Hero Banner'}]
};

const HomePosters: React.FC = () => {
  const { token } = useAdminAuth();
  const [module, setModule] = useState('HOME');
  const [posters, setPosters] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentPoster, setCurrentPoster] = useState<any>(null);

  const [formData, setFormData] = useState({
    imageUrl: '',
    title: '',
    description: '',
    buttonText: '',
    buttonAction: '',
    isActive: true,
    module: 'HOME',
    position: 'HERO_BANNER',
    displayOrder: 1
  });

  const fetchPosters = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/home-posters/admin?module=${module}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPosters(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (token) fetchPosters();
  }, [token, module]);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`${API_BASE_URL}/home-posters/admin/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      fetchPosters();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this poster?')) return;
    try {
      await fetch(`${API_BASE_URL}/home-posters/admin/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPosters();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEdit 
        ? `${API_BASE_URL}/home-posters/admin/${currentPoster.id}` 
        : `${API_BASE_URL}/home-posters/admin`;
      const method = isEdit ? 'PATCH' : 'POST';
      
      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      setIsModalOpen(false);
      fetchPosters();
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    setIsEdit(false);
    setFormData({ 
      imageUrl: '', 
      title: '',
      description: '',
      buttonText: '',
      buttonAction: '', 
      isActive: true,
      module,
      position: POSITIONS_BY_MODULE[module]?.[0]?.id || 'HERO_BANNER',
      displayOrder: posters.length + 1
    });
    setIsModalOpen(true);
  };

  const openEditModal = (poster: any) => {
    setIsEdit(true);
    setCurrentPoster(poster);
    setFormData({ 
      imageUrl: poster.imageUrl || '', 
      title: poster.title || '',
      description: poster.description || '',
      buttonText: poster.buttonText || '',
      buttonAction: poster.buttonAction || '', 
      isActive: poster.isActive,
      module: poster.module || module,
      position: poster.position || 'HERO_BANNER',
      displayOrder: poster.displayOrder || 1
    });
    setIsModalOpen(true);
  };

  // Drag and drop sorting
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;

    const newPosters = [...posters];
    const draggedItem = newPosters[draggedIdx];
    newPosters.splice(draggedIdx, 1);
    newPosters.splice(idx, 0, draggedItem);
    
    setDraggedIdx(idx);
    setPosters(newPosters);
  };

  const handleDragEnd = async () => {
    setDraggedIdx(null);
    // Save new order to backend
    const updates = posters.map((p, index) => ({ id: p.id, displayOrder: index + 1 }));
    try {
      await fetch(`${API_BASE_URL}/home-posters/admin/order`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ items: updates })
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Posters</h2>
          <p className="text-sm text-slate-500">Manage posters across different user modules.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Add New Poster
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm font-medium text-slate-700">Module:</label>
        <select 
          value={module}
          onChange={(e) => setModule(e.target.value)}
          className="border-slate-300 rounded-lg text-sm py-2 px-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {MODULES.map(m => (
            <option key={m} value={m}>{m === 'HOME' ? 'Home' : m === 'HOSPITAL' ? 'Hospital' : m === 'DOCTOR' ? 'Doctor' : 'Labs'}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <ShieldAlert size={16} className="text-amber-500" />
            Default posters cannot be deleted or fully edited. Drag to reorder.
          </p>
        </div>

        <div className="divide-y divide-slate-300">
          {(POSITIONS_BY_MODULE[module] || []).map((pos, posIndex) => {
            const posPosters = posters.filter(p => p.position === pos.id || (!p.position && pos.id === 'HERO_BANNER'));
            
            return (
              <div key={pos.id} className="pb-8">
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
                  <h3 className="font-bold text-slate-800 text-sm">POSITION {posIndex + 1}</h3>
                  <p className="text-xs text-slate-500">{pos.label}</p>
                </div>
                
                {posPosters.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No posters found in this position.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {posPosters.map((poster, idx) => (
                      <div 
                        key={poster.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, posters.findIndex(p => p.id === poster.id))}
                        onDragOver={(e) => handleDragOver(e, posters.findIndex(p => p.id === poster.id))}
                        onDragEnd={handleDragEnd}
                        className={`p-6 flex flex-col gap-4 hover:bg-slate-50 transition-colors ${draggedIdx === posters.findIndex(p => p.id === poster.id) ? 'opacity-50 bg-slate-100' : ''}`}
                      >
                        {/* Status and Actions Row */}
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <div className="cursor-grab active:cursor-grabbing text-slate-400">
                              <GripVertical size={20} />
                            </div>
                            <div>
                              <StatusBadge status={poster.isActive ? 'ACTIVE' : 'INACTIVE'} />
                            </div>
                            <span className="text-sm font-medium text-slate-500">Order: {poster.displayOrder}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleToggleStatus(poster.id, poster.isActive)}
                              className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
                                poster.isActive ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-slate-800 border-slate-800 text-white hover:bg-slate-700'
                              }`}
                            >
                              {poster.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            
                            {!poster.isDefault && (
                              <>
                                <button onClick={() => openEditModal(poster)} className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-lg transition-colors flex items-center gap-2 text-sm">
                                  <Edit2 size={16} /> Edit
                                </button>
                                <button onClick={() => handleDelete(poster.id)} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-lg transition-colors flex items-center gap-2 text-sm">
                                  <Trash2 size={16} /> Remove
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Visual Preview */}
                        <div className="w-full mt-2 pointer-events-none shadow-sm rounded-2xl overflow-hidden border border-slate-200">
                          <SinglePosterPreview poster={poster} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 overflow-y-auto py-10">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden my-auto">
            <div className="p-4 md:p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">{isEdit ? 'Edit Poster' : 'Add New Poster'}</h3>
            </div>
            
            <form onSubmit={handleSave} className="p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Module</label>
                  <select 
                    value={formData.module} 
                    onChange={e => setFormData({...formData, module: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                    required
                  >
                    {MODULES.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
                  <select 
                    value={formData.position} 
                    onChange={e => setFormData({...formData, position: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                    required
                  >
                    {(POSITIONS_BY_MODULE[formData.module] || []).map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Poster Image *</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData({...formData, imageUrl: reader.result as string});
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                  required={!isEdit && !formData.imageUrl}
                />
                {formData.imageUrl && (
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase">Image Preview (Aspect Ratio Maintained)</label>
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-auto object-cover rounded-lg border shadow-sm aspect-video" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Button Text</label>
                  <input 
                    type="text" 
                    value={formData.buttonText} 
                    onChange={e => setFormData({...formData, buttonText: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Button Link / Action</label>
                  <input 
                    type="text" 
                    value={formData.buttonAction} 
                    onChange={e => setFormData({...formData, buttonAction: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select 
                    value={formData.isActive ? 'true' : 'false'} 
                    onChange={e => setFormData({...formData, isActive: e.target.value === 'true'})}
                    className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Display Order</label>
                  <input 
                    type="number" 
                    value={formData.displayOrder} 
                    onChange={e => setFormData({...formData, displayOrder: parseInt(e.target.value) || 1})}
                    className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                    min={1}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  {isEdit ? 'Save Poster' : 'Save Poster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePosters;
