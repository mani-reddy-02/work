import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, Phone, Mail, FileText, Settings as SettingsIcon, Percent, CheckCircle2, XCircle, Save } from 'lucide-react';
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
  const [adminComm, setAdminComm] = useState<string>('20');
  const [labShare, setLabShare] = useState<string>('80');
  const [commFeedback, setCommFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
        if (labData.hospitalShare !== undefined && labData.hospitalShare !== null) {
          setLabShare(labData.hospitalShare.toString());
          setAdminComm((100 - Number(labData.hospitalShare)).toString());
        } else {
          setLabShare('80');
          setAdminComm('20');
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
      setCommFeedback(null);
    } else {
      setCommFeedback({ message: 'Percentages must be between 0 and 100', type: 'error' });
    }
  };

  const handleLabShareChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLabShare(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setAdminComm((100 - num).toString());
      setCommFeedback(null);
    } else {
      setCommFeedback({ message: 'Percentages must be between 0 and 100', type: 'error' });
    }
  };

  const handleSaveCommission = async () => {
    const lShare = parseFloat(labShare);
    const aComm = parseFloat(adminComm);
    if (isNaN(lShare) || isNaN(aComm) || Math.round(lShare + aComm) !== 100 || lShare < 0 || aComm < 0) {
      setCommFeedback({ message: 'Admin commission and lab share must total exactly 100%.', type: 'error' });
      return;
    }

    try {
      setSavingComm(true);
      setCommFeedback(null);
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
        setCommFeedback({ message: 'Commission configuration saved successfully!', type: 'success' });
        fetchLab();
      } else {
        setCommFeedback({ message: result.message || 'Failed to update commission configuration.', type: 'error' });
      }
    } catch (err) {
      setCommFeedback({ message: 'Network error occurred while saving.', type: 'error' });
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
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Percent size={20} className="text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Commission & Revenue Sharing</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                lab.hospitalShare !== null && lab.hospitalShare !== undefined
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {lab.hospitalShare !== null && lab.hospitalShare !== undefined ? 'Configured' : 'Not configured'}
              </span>
            </div>

            {/* Current Applied Status Info */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-100 text-xs mb-5">
              <div>
                <span className="text-slate-500 block">Applied Admin Commission</span>
                <span className="font-bold text-slate-900 text-sm">
                  {lab.hospitalShare !== null && lab.hospitalShare !== undefined ? `${100 - Number(lab.hospitalShare)}%` : 'Not configured'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Applied Lab Share</span>
                <span className="font-bold text-slate-900 text-sm">
                  {lab.hospitalShare !== null && lab.hospitalShare !== undefined ? `${Number(lab.hospitalShare)}%` : 'Not configured'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Revenue Basis</span>
                <span className="font-medium text-slate-700">Net Eligible Order Value</span>
              </div>
              <div>
                <span className="text-slate-500 block">Effective Date</span>
                <span className="font-medium text-slate-700">{new Date(lab.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Update Arrangement</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Admin Commission (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={adminComm} 
                    onChange={handleAdminCommChange}
                    className="w-full px-3 py-2 pr-7 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="100"
                    step="0.5"
                    placeholder="20"
                  />
                  <span className="absolute right-2.5 top-2 text-slate-400 text-xs font-bold">%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Lab Share (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={labShare} 
                    onChange={handleLabShareChange}
                    className="w-full px-3 py-2 pr-7 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="100"
                    step="0.5"
                    placeholder="80"
                  />
                  <span className="absolute right-2.5 top-2 text-slate-400 text-xs font-bold">%</span>
                </div>
              </div>
            </div>

            {commFeedback && (
              <div className={`p-3 rounded-lg text-xs font-medium mb-3 flex items-center ${
                commFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {commFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0" /> : <XCircle className="w-4 h-4 mr-2 text-red-600 shrink-0" />}
                <span>{commFeedback.message}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Sum: <span className={`font-bold ${(parseFloat(adminComm) + parseFloat(labShare)) === 100 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {(parseFloat(adminComm) || 0) + (parseFloat(labShare) || 0)}%
                </span>
              </span>
              <button 
                onClick={handleSaveCommission} 
                disabled={savingComm || (parseFloat(adminComm) + parseFloat(labShare)) !== 100}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center shadow-sm"
              >
                {savingComm ? (
                  <>
                    <span className="animate-spin mr-1.5">⏳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Save Commission Arrangement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabDetails;
