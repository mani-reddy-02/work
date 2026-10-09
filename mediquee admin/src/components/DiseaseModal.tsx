import React, { useState } from 'react';
import { useAdminAuth } from '../contexts/AuthContext';
import IconPicker from './IconPicker';

export default function DiseaseModal({ isOpen, onClose, onSuccess, existing, departmentId, departmentName }: any) {
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
      const url = existing ? `${API_URL}/admin/diseases/${existing.id}` : `${API_URL}/admin/departments/${departmentId}/diseases`;
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, icon, isActive, departmentId })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Disease ${existing ? 'updated' : 'created'} successfully.`);
        onSuccess();
        onClose();
      } else {
        setError(data.error?.message || 'Error saving disease');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-xl my-8">
        <h2 className="text-xl font-bold mb-4">{existing ? 'Edit Disease' : 'Add New Disease'}</h2>
        {error && <div className="text-red-500 mb-4 bg-red-50 p-3 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Disease Name *</label>
            <input type="text" className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Description *</label>
            <textarea className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" rows={3} value={description} onChange={e => setDescription(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Department</label>
            <input type="text" className="w-full border border-slate-200 rounded p-2 bg-slate-50 text-slate-500 cursor-not-allowed" value={departmentName} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Disease Icon *</label>
            <IconPicker value={icon} onChange={setIcon} folderType="conditions" />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 font-medium text-slate-700 rounded hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 font-medium text-white rounded hover:bg-blue-700">{loading ? 'Saving...' : (existing ? 'Save Changes' : 'Create Disease')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
