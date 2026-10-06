import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AuthContext';

interface AddDiseaseModalProps {
  departmentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AddDiseaseModal: React.FC<AddDiseaseModalProps> = ({ departmentId, onClose, onSuccess }) => {
  const { token } = useAdminAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${API_URL}/admin/departments/${departmentId}/diseases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.error?.message || 'Failed to add disease');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Add Disease</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Disease Name *</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" 
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              className="w-full p-2 border border-slate-300 rounded-lg text-sm h-24 focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50" disabled={loading}>
              {loading ? 'Saving...' : 'Save Disease'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDiseaseModal;
