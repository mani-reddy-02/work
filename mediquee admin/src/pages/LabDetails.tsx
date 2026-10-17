import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Building2, MapPin, Phone, Mail, FileText, Percent, 
  CheckCircle2, XCircle, Save, FlaskConical, Globe, Clock, ShieldCheck, 
  ExternalLink, Calendar, AlertCircle, FileCheck, TestTube, Check, Info, User
} from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import StatusBadge from '../components/ui/StatusBadge';

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
      if (result.success && result.data) {
        const labData = result.data;
        setLab(labData);

        if (labData.hospitalShare !== undefined && labData.hospitalShare !== null) {
          setLabShare(labData.hospitalShare.toString());
          setAdminComm((100 - Number(labData.hospitalShare)).toString());
        } else {
          setLabShare('80');
          setAdminComm('20');
        }
      } else {
        setError(result.message || result.error?.message || 'Laboratory not found');
      }
    } catch (err) {
      setError('Error fetching laboratory details from server');
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
      const targetHospitalId = lab.hospital?.id || lab.hospitalId || id;
      const res = await fetch(`${API_URL}/admin/hospitals/${targetHospitalId}/revenue-share`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ hospitalSharePercentage: lShare })
      });
      const result = await res.json();
      if (result.success) {
        setCommFeedback({ message: 'Commission arrangement saved successfully!', type: 'success' });
        fetchLab();
      } else {
        setCommFeedback({ message: result.message || 'Failed to update commission arrangement.', type: 'error' });
      }
    } catch (err) {
      setCommFeedback({ message: 'Network error occurred while saving.', type: 'error' });
    } finally {
      setSavingComm(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold text-slate-600">Loading laboratory details...</p>
      </div>
    );
  }

  if (error || !lab) {
    return (
      <div className="p-12 text-center bg-white rounded-xl shadow-xs border border-slate-200 max-w-xl mx-auto my-8">
        <AlertCircle size={40} className="mx-auto text-rose-500 mb-3" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">Laboratory Not Found</h3>
        <p className="text-slate-500 text-sm mb-6">{error || 'The requested laboratory could not be loaded.'}</p>
        <button 
          onClick={() => navigate('/admin/labs')} 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
        >
          ← Back to Labs
        </button>
      </div>
    );
  }

  const isStandalone = lab.type === 'STANDALONE';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* =========================================================================
          TOP BREADCRUMBS & NAVIGATION
      ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/admin/labs')} 
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Back to Laboratories"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Healthcare Network / Labs / Laboratory Details
            </p>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {lab.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
            isStandalone 
              ? 'bg-purple-100 text-purple-700 border border-purple-200' 
              : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
          }`}>
            {isStandalone ? 'Standalone Laboratory' : 'Hospital-Based Laboratory'}
          </span>
          <StatusBadge status={lab.verificationStatus || 'APPROVED'} />
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            lab.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
          }`}>
            {lab.status || 'Active'}
          </span>
        </div>
      </div>

      {/* Cancellation Notice if applicable */}
      {lab.cancellationReason && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-800 text-xs">
          <AlertCircle size={18} className="shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-bold">Laboratory Status Notice</p>
            <p className="mt-0.5">{lab.cancellationReason}</p>
            {lab.cancelledAt && (
              <p className="text-rose-600 mt-1">Cancelled on: {new Date(lab.cancelledAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Sections A through G */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* =========================================================================
            SECTION A — LABORATORY OVERVIEW
        ========================================================================= */}
        <section className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FlaskConical size={20} className="text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Section A — Laboratory Overview
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-400">Profile & Identification</span>
          </div>

          <div className="flex items-center gap-4 py-2">
            {lab.logoUrl ? (
              <img 
                src={lab.logoUrl} 
                alt={lab.name} 
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-2xs" 
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                {lab.name ? lab.name.substring(0, 2).toUpperCase() : 'LB'}
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">{lab.name}</h3>
              <p className="text-xs font-mono text-slate-500 mt-0.5">ID: {lab.id}</p>
              <p className="text-xs font-medium text-blue-600 mt-1">
                {lab.facilityType || (isStandalone ? 'Independent Diagnostic Centre' : 'Hospital Laboratory Department')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs pt-3 border-t border-slate-100">
            <div>
              <span className="text-slate-400 block font-medium">Laboratory Type</span>
              <span className="text-slate-800 font-semibold text-sm">
                {isStandalone ? 'Standalone Facility' : 'Hospital-Based Facility'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Verification State</span>
              <div className="mt-0.5">
                <StatusBadge status={lab.verificationStatus || 'APPROVED'} />
              </div>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Account Status</span>
              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-semibold ${
                lab.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {lab.status || 'Active'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Registered Date</span>
              <span className="text-slate-800 font-semibold">
                {lab.createdAt ? new Date(lab.createdAt).toLocaleDateString() : '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Last Updated</span>
              <span className="text-slate-800 font-semibold">
                {lab.updatedAt ? new Date(lab.updatedAt).toLocaleDateString() : '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Rating</span>
              <span className="text-slate-800 font-semibold">
                ★ {lab.rating || '4.8'} / 5.0
              </span>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION B — CONTACT DETAILS
        ========================================================================= */}
        <section className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Phone size={20} className="text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Section B — Contact Details
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-400">Communication Channels</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <User size={18} className="text-blue-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-400 block font-medium">Contact Person</span>
                <span className="text-slate-900 font-bold text-sm">
                  {lab.contactPerson || lab.contactName || lab.representative || 'Laboratory Administrator'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <Phone size={18} className="text-blue-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-400 block font-medium">Primary Contact Number</span>
                <span className="text-slate-900 font-bold text-sm">
                  {lab.contactPhone || '—'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <Mail size={18} className="text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-400 block font-medium">Official Email Address</span>
                <span className="text-slate-900 font-bold text-sm">
                  {lab.contactEmail || lab.email || '—'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <Globe size={18} className="text-emerald-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <span className="text-slate-400 block font-medium">Official Website</span>
                {lab.website ? (
                  <a 
                    href={lab.website.startsWith('http') ? lab.website : `https://${lab.website}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    <span>{lab.website}</span>
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="text-slate-400 italic">No website configured</span>
                )}
              </div>
            </div>

            {lab.emergencyContact && (
              <div className="flex items-start gap-3 p-3 bg-amber-50/70 rounded-xl border border-amber-100">
                <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-amber-800 block font-medium">Emergency / 24x7 Contact</span>
                  <span className="text-slate-900 font-bold text-sm">
                    {lab.emergencyContact}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* =========================================================================
            SECTION C — ADDRESS AND LOCATION
        ========================================================================= */}
        <section className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <MapPin size={20} className="text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Section C — Address and Location
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-400">Physical Facility</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Address Line</span>
              <p className="text-slate-900 font-semibold text-sm mt-0.5">
                {lab.addressLine1 || lab.address || '—'}
              </p>
              {lab.addressLine2 && (
                <p className="text-slate-600 mt-0.5">{lab.addressLine2}</p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div>
                <span className="text-slate-400 block font-medium">Area / Landmark</span>
                <span className="text-slate-800 font-semibold">{lab.area || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">City</span>
                <span className="text-slate-800 font-semibold">{lab.city || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">State</span>
                <span className="text-slate-800 font-semibold">{lab.state || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Postal / PIN Code</span>
                <span className="text-slate-800 font-semibold">{lab.pincode || lab.pinCode || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Country</span>
                <span className="text-slate-800 font-semibold">{lab.country || 'India'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION D — LABORATORY INFORMATION
        ========================================================================= */}
        <section className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Section D — Laboratory Information
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-400">Licensing & Timings</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Registration Number</span>
              <span className="text-slate-900 font-bold">{lab.registrationNumber || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Lab License Number</span>
              <span className="text-slate-900 font-bold">{lab.labLicenseNumber || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">License Valid Until</span>
              <span className="text-slate-800 font-semibold">
                {lab.licenseValidUntil ? new Date(lab.licenseValidUntil).toLocaleDateString() : '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Home Sample Collection</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                <Check size={14} /> Available
              </span>
            </div>
          </div>

          {/* Operating Hours / Schedules */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-slate-500 font-bold text-xs uppercase tracking-wider block mb-2">
              Weekly Operating Schedule
            </span>
            {lab.schedules && lab.schedules.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {lab.schedules.map((s: any, idx: number) => (
                  <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="font-bold text-slate-800">{s.dayOfWeek}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {s.isAvailable 
                        ? `${s.openingTime || '08:00'} – ${s.closingTime || '20:00'}` 
                        : 'Closed'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>Standard Diagnostic Operating Hours: <strong>08:00 AM – 08:00 PM (Monday to Saturday)</strong></span>
                <span className="text-emerald-600 font-semibold">Active</span>
              </div>
            )}
          </div>
        </section>

        {/* =========================================================================
            SECTION E — HOSPITAL ASSOCIATION
        ========================================================================= */}
        <section className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 size={20} className="text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Section E — Hospital Association
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-400">Institutional Linkage</span>
          </div>

          {isStandalone ? (
            <div className="p-5 bg-gradient-to-br from-slate-50 to-purple-50/40 rounded-xl border border-purple-100 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                <h4 className="font-bold text-slate-900 text-sm">Standalone Laboratory Facility</h4>
              </div>
              <p className="text-slate-600 leading-relaxed">
                This diagnostic center operates autonomously as an independent diagnostic partner without direct hospital association. Patient bookings and home sample collections are processed directly by this facility.
              </p>
            </div>
          ) : lab.hospital ? (
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-indigo-600 font-bold block uppercase tracking-wider text-[10px]">
                    Associated Parent Hospital
                  </span>
                  <h4 className="font-bold text-slate-900 text-base mt-0.5">{lab.hospital.name}</h4>
                  <p className="font-mono text-slate-400 text-[11px]">Hospital ID: {lab.hospital.id}</p>
                </div>
                <button
                  onClick={() => navigate(`/admin/hospitals/${lab.hospital.id}`)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                >
                  View Hospital Profile
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-100/60">
                <div>
                  <span className="text-slate-400 block font-medium">Location</span>
                  <span className="text-slate-800 font-semibold">{lab.hospital.city || '—'}, {lab.hospital.state || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Hospital Share</span>
                  <span className="text-slate-800 font-semibold">
                    {lab.hospital.hospitalShare !== undefined && lab.hospital.hospitalShare !== null 
                      ? `${lab.hospital.hospitalShare}%` 
                      : '80%'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500">
              No hospital record linked to this laboratory profile.
            </div>
          )}
        </section>

        {/* =========================================================================
            SECTION F — VERIFICATION DOCUMENTS
        ========================================================================= */}
        <section className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Section F — Verification Documents
              </h2>
            </div>
            <StatusBadge status={lab.verificationStatus || 'APPROVED'} />
          </div>

          <div className="space-y-3 text-xs">
            {lab.labLicenseDocumentUrl && (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <FileText size={18} className="text-blue-600 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900">Laboratory Operating License Document</p>
                    <p className="text-[11px] text-slate-400">Official medical regulatory certificate</p>
                  </div>
                </div>
                <a 
                  href={lab.labLicenseDocumentUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-3 py-1 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold inline-flex items-center gap-1 shadow-2xs"
                >
                  <span>View</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}

            {lab.verifications && lab.verifications.length > 0 ? (
              lab.verifications.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <FileCheck size={18} className="text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900 capitalize">{v.documentType || 'Verification Document'}</p>
                      <p className="text-[11px] text-slate-400">
                        Submitted: {new Date(v.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {v.fileUrl ? (
                    <a 
                      href={v.fileUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="px-3 py-1 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold inline-flex items-center gap-1 shadow-2xs"
                    >
                      <span>View</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">No URL</span>
                  )}
                </div>
              ))
            ) : !lab.labLicenseDocumentUrl && (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                <FileText size={24} className="mx-auto mb-1 text-slate-300" />
                <p className="font-semibold text-slate-600">No verification documents attached</p>
                <p className="text-[11px] mt-0.5">Documents uploaded during partner onboarding will appear here.</p>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* =========================================================================
          SECTION G — LABORATORY SERVICES
      ========================================================================= */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <TestTube size={22} className="text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Section G — Laboratory Services
              </h2>
              <p className="text-xs text-slate-500">
                Active service offerings, test catalog summaries, and commission split configuration.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-200">
              {lab.availableTestsCount || (lab.tests ? lab.tests.length : 0)} Available Tests
            </span>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
              Starts {lab.price || '₹149'}
            </span>
          </div>
        </div>

        {/* Services Badges */}
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Service Capabilities
          </span>
          <div className="flex flex-wrap gap-2">
            {(lab.services || ['lab_tests', 'diagnostics', 'home_collection']).map((srv: string, i: number) => (
              <span key={i} className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 capitalize border border-slate-200">
                {srv.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Test Catalogue Summary Table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Diagnostic Test Catalogue Offerings
            </span>
            <span className="text-xs text-slate-400">
              Authoritative live database catalog
            </span>
          </div>

          {lab.tests && lab.tests.length > 0 ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                    <th className="px-4 py-3">Test Name</th>
                    <th className="px-4 py-3">Sample Type</th>
                    <th className="px-4 py-3">Turnaround Time</th>
                    <th className="px-4 py-3">Home Collection</th>
                    <th className="px-4 py-3 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lab.tests.map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">{t.name}</td>
                      <td className="px-4 py-3 text-slate-600">{t.sampleType || 'Blood'}</td>
                      <td className="px-4 py-3 text-slate-600">{t.time || '12 Hours'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          t.homeCollectionAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {t.homeCollectionAvailable ? 'Available' : 'Lab Visit Only'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">{t.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
              <p className="font-semibold text-slate-700">Test catalogue offerings not configured yet.</p>
              <p className="text-slate-400 mt-1">Diagnostic tests will appear here once mapped to this laboratory partner.</p>
            </div>
          )}
        </div>

        {/* Commercial Arrangement: Commission and Revenue Share */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Percent size={20} className="text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">Commercial & Revenue Share Arrangement</h3>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              lab.hospitalShare !== null && lab.hospitalShare !== undefined
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-600'
            }`}>
              {lab.hospitalShare !== null && lab.hospitalShare !== undefined ? 'Configured' : 'Not configured'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs mb-5">
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
              <span className="font-semibold text-slate-700">Net Eligible Order Value</span>
            </div>
            <div>
              <span className="text-slate-500 block">Effective Date</span>
              <span className="font-semibold text-slate-700">
                {lab.createdAt ? new Date(lab.createdAt).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>

          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Update Commercial Arrangement
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
              Total: <span className={`font-bold ${(parseFloat(adminComm) + parseFloat(labShare)) === 100 ? 'text-emerald-600' : 'text-red-500'}`}>
                {(parseFloat(adminComm) || 0) + (parseFloat(labShare) || 0)}%
              </span>
            </span>
            <button 
              onClick={handleSaveCommission} 
              disabled={savingComm || (parseFloat(adminComm) + parseFloat(labShare)) !== 100}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {savingComm ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Saving Arrangement...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Save Commercial Arrangement
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LabDetails;
