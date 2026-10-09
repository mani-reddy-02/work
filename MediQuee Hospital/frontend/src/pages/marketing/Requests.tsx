import React, { useState, useEffect, useCallback } from 'react';
import { HeartPulse, Megaphone, Clock, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/services/adminApi';
import type { MarketingRequestRecord, MedicalCampRecord } from '@/services/adminApi';
import { useToast } from '@/context/ToastContext';

export function Requests() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { toast } = useToast();
  const [camps, setCamps] = useState<MedicalCampRecord[]>([]);
  const [marketing, setMarketing] = useState<MarketingRequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getHospitalRequests();
      setCamps(data.campRequests || []);
      setMarketing(data.marketingRequests || []);
    } catch (err: any) {
      toast(err.message || 'Failed to load requests', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'REVIEWING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'APPROVED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      case 'COMPLETED': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-3.5 h-3.5" />;
      case 'REVIEWING': return <Clock className="w-3.5 h-3.5" />;
      case 'APPROVED': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'REJECTED': return <XCircle className="w-3.5 h-3.5" />;
      case 'COMPLETED': return <CheckCircle2 className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col bg-[#F7F8FA] min-h-[calc(100vh-80px)] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border shadow-xs px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-[17px] font-bold text-foreground">My Requests</h1>
            <p className="text-[12px] text-muted-foreground">Track marketing and camp requests</p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto w-full space-y-6 mt-2">
        {isLoading ? (
          <div className="flex justify-center p-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : camps.length === 0 && marketing.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-700">No requests yet</h3>
            <p className="text-sm text-slate-500 mt-2">You haven't submitted any marketing or medical camp requests yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {marketing.map(req => (
              <div key={req.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-[15px]">Hospital Marketing</h3>
                    <p className="text-[13px] text-slate-500 mt-0.5">{req.campaignType}</p>
                    <div className="text-[12px] text-slate-400 mt-2 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      Submitted: {formatDateTime(req.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium border flex items-center gap-1.5 ${getStatusColor(req.status)}`}>
                    {getStatusIcon(req.status)}
                    {req.status}
                  </span>
                </div>
              </div>
            ))}

            {camps.map(req => (
              <div key={req.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-[15px]">Medical Camp: {req.campTitle}</h3>
                    <p className="text-[13px] text-slate-500 mt-0.5">Location: {req.location} • Date: {formatDateTime(req.expectedDate)}</p>
                    <div className="text-[12px] text-slate-400 mt-2 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      Submitted: {formatDateTime(req.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium border flex items-center gap-1.5 ${getStatusColor(req.status)}`}>
                    {getStatusIcon(req.status)}
                    {req.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
