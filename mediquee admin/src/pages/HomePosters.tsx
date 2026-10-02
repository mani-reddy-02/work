import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../contexts/AuthContext';
import { Plus, GripVertical, Image as ImageIcon, Link as LinkIcon, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const HomePosters: React.FC = () => {
  const { token } = useAdminAuth();
  const [posters, setPosters] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentPoster, setCurrentPoster] = useState<any>(null);

  const [formData, setFormData] = useState({
    imageUrl: '',
    buttonAction: '',
    isActive: true
  });

  const fetchPosters = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/home-posters/admin`, {
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
  }, [token]);

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
    setFormData({ imageUrl: '', buttonAction: '', isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (poster: any) => {
    setIsEdit(true);
    setCurrentPoster(poster);
    setFormData({ 
      imageUrl: poster.imageUrl || '', 
      buttonAction: poster.buttonAction || '', 
      isActive: poster.isActive 
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
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Home Page Posters</h2>
          <p className="text-sm text-slate-500">Manage promotional banners and navigation cards on the User Home Page.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Add New Poster
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <ShieldAlert size={16} className="text-amber-500" />
            Default posters cannot be deleted or fully edited. Drag to reorder.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {posters.map((poster, idx) => (
            <div 
              key={poster.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`p-4 flex items-center gap-6 hover:bg-slate-50 transition-colors ${draggedIdx === idx ? 'opacity-50 bg-slate-100' : ''}`}
            >
              <div className="cursor-grab active:cursor-grabbing text-slate-400">
                <GripVertical size={20} />
              </div>
              
              <div className="w-32 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center relative">
                {poster.isDefault ? (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-400 flex flex-col items-center justify-center text-white">
                    <span className="text-xs font-bold text-center px-1">{poster.title}</span>
                  </div>
                ) : poster.imageUrl ? (
                  <img src={poster.imageUrl} alt="Poster" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-slate-800 text-sm">
                    {poster.isDefault ? `Default: ${poster.title}` : 'Custom Poster'}
                  </h3>
                  {poster.isDefault && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      System
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <LinkIcon size={12} /> {poster.buttonAction || 'No link'}
                  </span>
                </div>
              </div>

              <div className="shrink-0 w-32">
                 <StatusBadge status={poster.isActive ? 'ACTIVE' : 'INACTIVE'} />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => handleToggleStatus(poster.id, poster.isActive)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors ${
                    poster.isActive ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-slate-800 border-slate-800 text-white hover:bg-slate-700'
                  }`}
                >
                  {poster.isActive ? 'Deactivate' : 'Activate'}
                </button>
                
                {!poster.isDefault && (
                  <>
                    <button onClick={() => openEditModal(poster)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(poster.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {posters.length === 0 && (
            <div className="p-8 text-center text-slate-500">No posters found.</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">{isEdit ? 'Edit Poster' : 'Add New Poster'}</h3>
            </div>
            
            <form onSubmit={handleSave} className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Image File</label>
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
                  <div className="mt-2 text-xs text-blue-600 font-medium">Image ready for upload</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Redirect Link</label>
                <input 
                  type="text" 
                  value={formData.buttonAction} 
                  onChange={e => setFormData({...formData, buttonAction: e.target.value})}
                  className="w-full border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                  placeholder="/hospitals"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="isActive" 
                  checked={formData.isActive}
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Active</label>
              </div>

              <div className="flex justify-end gap-3 pt-6">
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
                  {isEdit ? 'Save Changes' : 'Add Poster'}
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
