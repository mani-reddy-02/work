import React, { useState } from 'react';
import { useAdminAuth } from '../contexts/AuthContext';
import IconPicker from './IconPicker';
import { X } from 'lucide-react';

interface LabDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existing?: any;
}

export default function LabDepartmentModal({ isOpen, onClose, onSuccess, existing }: LabDepartmentModalProps) {
  const { token } = useAdminAuth();
  const [name, setName] = useState(existing?.name || '');
  const [code, setCode] = useState(existing?.code || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [icon, setIcon] = useState(existing?.icon || '/optimized/Blood Test.webp');
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!existing && !code) {
      const words = val.trim().split(/\s+/);
      if (words.length === 1 && words[0].length >= 3) {
        setCode(words[0].substring(0, 4).toUpperCase());
      } else if (words.length > 1) {
        setCode(words.map(w => w[0]).join('').substring(0, 5).toUpperCase());
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Department Name is required');
      return;
    }
    if (!icon) {
      setError('Department Icon is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
      const method = existing ? 'PATCH' : 'POST';
      const url = existing 
        ? `${API_URL}/admin/lab-departments/${existing.id}` 
        : `${API_URL}/admin/lab-departments`;

      const res = await fetch(url, {
        method,
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          name: name.trim(), 
          code: code.trim() || undefined, 
          description: description.trim() || null, 
          icon, 
          isActive 
        })
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error?.message || 'Error saving lab department');
      }
    } catch (err) {
      setError('Network error occurred. Please try again.');
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
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
          <h2 className="text-lg font-bold text-slate-900">
            {existing ? 'Edit Lab Department' : 'Add New Lab Department'}
          </h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 space-y-4.5">
            {error && (
              <div className="text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Department Name *
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Clinical Biochemistry"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" 
                  value={name} 
                  onChange={e => handleNameChange(e.target.value)} 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Dept Code
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. BIO"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm uppercase font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" 
                  value={code} 
                  onChange={e => setCode(e.target.value.toUpperCase())} 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Description
              </label>
              <textarea 
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" 
                rows={2} 
                placeholder="Brief description of diagnostic tests covered by this department"
                value={description} 
                onChange={e => setDescription(e.target.value)} 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Department Icon *
              </label>
              <IconPicker value={icon} onChange={setIcon} folderType="lab-departments" />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-medium text-slate-700">Department Status</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isActive} 
                  onChange={e => setIsActive(e.target.checked)} 
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-xs font-semibold text-slate-600">
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </label>
            </div>
          </div>
          
          {/* Fixed Sticky Footer */}
          <div className="flex justify-end space-x-3 px-6 py-4 border-t border-slate-100 bg-slate-50/70 shrink-0">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 border border-slate-200 font-medium text-sm text-slate-700 rounded-xl hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-5 py-2 bg-blue-600 font-semibold text-sm text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
            >
              {loading ? 'Saving...' : (existing ? 'Save Changes' : 'Create Lab Department')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
