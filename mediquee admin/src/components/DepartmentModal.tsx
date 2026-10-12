import React, { useState } from 'react';
import { useAdminAuth } from '../contexts/AuthContext';
import IconPicker from './IconPicker';
import { X } from 'lucide-react';

export default function DepartmentModal({ isOpen, onClose, onSuccess, existing }: any) {
  const { token } = useAdminAuth();
  const [name, setName] = useState(existing?.name || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [icon, setIcon] = useState(existing?.icon || '');
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!name || !icon) { setError('Name and Icon are required'); return; }
    setLoading(true);
    setError('');
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
      const method = existing ? 'PATCH' : 'POST';
      const url = existing ? `${API_URL}/admin/departments/${existing.id}` : `${API_URL}/admin/departments`;
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, icon, isActive })
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error?.message || 'Error saving department');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex min-h-full items-center justify-center p-3 sm:p-4">
      <div 
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
          <h2 className="text-lg font-bold text-slate-900">{existing ? 'Edit Department' : 'Add New Department'}</h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {error && <div className="text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-xl text-sm">{error}</div>}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Department Name *</label>
              <input type="text" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Description</label>
              <textarea className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Department Icon *</label>
              <IconPicker value={icon} onChange={setIcon} folderType="specializations" />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 font-medium text-sm text-slate-700 rounded-xl hover:bg-white transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 font-semibold text-sm text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm">{loading ? 'Saving...' : (existing ? 'Save Changes' : 'Create Department')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
