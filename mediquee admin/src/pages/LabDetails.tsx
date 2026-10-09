import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, Phone, Mail, FileText, Settings as SettingsIcon } from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const LabDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAdminAuth();
  
  const [lab, setLab] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [savingComm, setSavingComm] = useState(false);
  const [adminComm, setAdminComm] = useState<string>('');
  const [labShare, setLabShare] = useState<string>('');

  const fetchLab = async () => {
    if (!token || !id) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/laboratories/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        const labData = {
          ...result.data,
          type: result.data.businessType === 'LABORATORY' ? 'STANDALONE' : 'HOSPITAL_BASED',
          address: result.data.addressLine1,
          hospital: result.data.businessType !== 'LABORATORY' ? {
            id: result.data.id,
            name: result.data.name,
            city: result.data.city,
            state: result.data.state
          } : null
        };
        setLab(labData);
        if (labData.hospitalShare !== undefined) {
          setLabShare(labData.hospitalShare.toString());
          setAdminComm((100 - labData.hospitalShare).toString());
        }
      }
      else setError(result.message || 'Lab not found');
    } catch (err) {
      setError('Error fetching lab details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLab();
  }, [id, token]);

  const handleAdminCommChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAdminComm(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setLabShare((100 - num).toString());
    }
  };

  const handleLabShareChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLabShare(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setAdminComm((100 - num).toString());
    }
  };

  const handleSaveCommission = async () => {
    const lShare = parseFloat(labShare);
    const aComm = parseFloat(adminComm);
    if (isNaN(lShare) || isNaN(aComm) || lShare + aComm !== 100 || lShare < 0 || aComm < 0) {
      alert("Invalid commission configuration. Total must equal 100%.");
      return;
    }

    try {
      setSavingComm(true);
      const res = await fetch(`${API_URL}/admin/hospitals/${id}/revenue-share`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ hospitalSharePercentage: lShare })
      });
      const result = await res.json();
      if (result.success) {
        alert("Configuration saved successfully!");
        fetchLab();
      } else {
        alert(result.message || "Failed to update commission configuration.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setSavingComm(false);
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>;
  if (error || !lab) return (
    <div className="p-12 text-center bg-white rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-xl font-bold text-slate-900 mb-2">Laboratory Not Found</h3>
      <p className="text-slate-500 mb-4">{error || 'The selected laboratory could not be found.'}</p>
      <button onClick={() => navigate('/admin/labs')} className="px-4 py-2 bg-blue-600 text-white rounded-lg">← Back to Labs</button>
    </div>
  );

  const isStandalone = lab.type === 'STANDALONE';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/labs')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-sm text-slate-500 mb-1">Admin / Labs / Laboratory Details</p>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Laboratory Details
            </h2>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${lab.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
              {lab.status || 'Active'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Laboratory Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-slate-500">Laboratory Name</p><p className="font-medium text-slate-900">{lab.name}</p></div>
            <div><p className="text-slate-500">Laboratory ID</p><p className="font-medium text-slate-900">{lab.id}</p></div>
            <div><p className="text-slate-500">Lab Type</p><p className="font-medium text-slate-900">{isStandalone ? 'Standalone Laboratory' : 'Hospital-Based Laboratory'}</p></div>
            <div><p className="text-slate-500">License Number</p><p className="font-medium text-slate-900">{lab.labLicenseNumber || '—'}</p></div>
            <div><p className="text-slate-500">Created Date</p><p className="font-medium text-slate-900">{new Date(lab.createdAt).toLocaleDateString()}</p></div>
            <div><p className="text-slate-500">Updated Date</p><p className="font-medium text-slate-900">{new Date(lab.updatedAt).toLocaleDateString()}</p></div>
          </div>
          
          <div className="space-y-3 pt-4 border-t border-slate-100">
             <div className="flex items-start gap-3">
               <Phone size={18} className="text-slate-400 mt-0.5" />
               <div><p className="text-sm font-medium text-slate-900">{lab.contactPhone || '—'}</p><p className="text-xs text-slate-500">Contact Number</p></div>
             </div>
             <div className="flex items-start gap-3">
               <Mail size={18} className="text-slate-400 mt-0.5" />
               <div><p className="text-sm font-medium text-slate-900">{lab.email || '—'}</p><p className="text-xs text-slate-500">Email Address</p></div>
             </div>
          </div>
        </div>

        {/* Location & Hospital */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">Laboratory Location</h3>
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900">{lab.address || '—'}</p>
                <p className="text-sm text-slate-600">{lab.city || '—'}, {lab.state || '—'} {lab.pinCode}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">Associated Hospital</h3>
            {isStandalone ? (
              <p className="text-sm text-slate-500">Not applicable (Standalone Laboratory)</p>
            ) : lab.hospital ? (
              <div className="flex items-start gap-3">
                <Building2 size={20} className="text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">{lab.hospital.name}</p>
                  <p className="text-sm text-slate-600">{lab.hospital.city || '—'}, {lab.hospital.state || '—'}</p>
                  <p className="text-xs text-slate-500 mt-1">ID: {lab.hospital.id}</p>
                  <button onClick={() => navigate(`/admin/hospitals/${lab.hospital.id}`)} className="mt-2 text-sm text-blue-600 hover:underline">View Hospital</button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Hospital information missing or deleted.</p>
            )}
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-2">
               <SettingsIcon size={20} className="text-slate-600" />
               <h3 className="text-lg font-bold text-slate-900">Financial Configuration</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Admin Commission %</label>
                <input 
                  type="number" 
                  value={adminComm} 
                  onChange={handleAdminCommChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lab Share %</label>
                <input 
                  type="number" 
                  value={labShare} 
                  onChange={handleLabShareChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  min="0"
                  max="100"
                />
              </div>
            </div>
            
            <button 
              onClick={handleSaveCommission} 
              disabled={savingComm}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50"
            >
              {savingComm ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabDetails;
