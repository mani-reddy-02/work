import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const AddLab: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAdminAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'STANDALONE',
    hospitalId: '',
    contactPhone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    description: '',
    status: 'Active'
  });

  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHospitals = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/admin/hospitals?limit=1000`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (result.success) setHospitals(result.data);
      } catch (err) {
        console.error('Error fetching hospitals', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHospitals();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    if (formData.type === 'HOSPITAL_BASED' && !formData.hospitalId) {
      setError('Please select a hospital for the hospital-based laboratory.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(`${API_URL}/admin/labs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const result = await res.json();
      if (result.success) {
        navigate('/admin/labs');
      } else {
        setError(result.message || 'Failed to create laboratory');
      }
    } catch (err) {
      setError('An error occurred while creating laboratory');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/labs')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Add Laboratory</h2>
          <p className="text-sm text-slate-500">Create a new standalone or hospital-based laboratory</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Laboratory Name *</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" 
              placeholder="e.g. ABC Diagnostics"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lab Type *</label>
              <select 
                value={formData.type}
                onChange={(e) => {
                  const type = e.target.value;
                  setFormData({...formData, type, hospitalId: type === 'STANDALONE' ? '' : formData.hospitalId});
                }}
                className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="STANDALONE">Standalone Laboratory</option>
                <option value="HOSPITAL_BASED">Hospital-Based Laboratory</option>
              </select>
            </div>
            
            {formData.type === 'HOSPITAL_BASED' ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hospital *</label>
                <select 
                  required
                  value={formData.hospitalId}
                  onChange={(e) => setFormData({...formData, hospitalId: e.target.value})}
                  className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Hospital</option>
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 text-slate-400">Hospital</label>
                <input disabled value="Not Required" className="w-full border-slate-200 bg-slate-50 text-slate-500 rounded-lg shadow-sm cursor-not-allowed" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
              <input 
                type="text" 
                value={formData.contactPhone}
                onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <input 
              type="text" 
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <input 
                type="text" 
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
              <input 
                type="text" 
                value={formData.state}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
                className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">PIN Code</label>
              <input 
                type="text" 
                value={formData.pinCode}
                onChange={(e) => setFormData({...formData, pinCode: e.target.value})}
                className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={() => navigate('/admin/labs')}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={submitting || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {submitting ? 'Saving...' : 'Create Laboratory'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddLab;
