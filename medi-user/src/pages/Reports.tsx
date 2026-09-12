import { 
  Search, Download, CloudUpload, ShieldCheck, ChevronDown, ChevronRight, 
  FileText, FlaskConical, Microscope, Activity, BadgeCheck, Calendar, 
  Scan, ArrowLeft, Trash2, X, CheckCircle2, AlertTriangle 
} from 'lucide-react';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

interface ReportItem {
  id: string;
  title: string;
  hospital: string;
  doctor?: string;
  date: string;
  pages: string;
  status: string;
  statusColor: string;
  iconName?: string;
  icon?: any;
  iconColor: string;
  bg: string;
  summary?: string;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  FlaskConical,
  Scan,
  Activity,
  Microscope,
  FileText,
};

// Robust, safe icon component resolver that never returns invalid objects
const getIconComponent = (iconSource: any): React.ComponentType<any> => {
  if (typeof iconSource === 'function') {
    return iconSource;
  }
  if (typeof iconSource === 'object' && iconSource !== null && ('$$typeof' in iconSource || 'render' in iconSource)) {
    return iconSource;
  }
  if (typeof iconSource === 'string' && ICON_MAP[iconSource]) {
    return ICON_MAP[iconSource];
  }
  return FileText;
};


import { reportsApi } from '../lib/reportsApi';
import type { ReportRecord } from '../lib/reportsApi';

const Reports = () => {
  const [activeTab, setActiveTab] = useState<'received' | 'upload'>('received');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [reports, setReports] = useState<ReportItem[]>([]);
  
  const [showAllReports, setShowAllReports] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      const res = await reportsApi.getReports();
      if (res.success && res.data) {
        // Map backend ReportRecord to frontend ReportItem
        const formatted = res.data.map(r => ({
          ...r,
          iconName: r.iconName || 'FileText',
          iconColor: r.iconColor || 'text-blue-500',
          bg: r.bg || 'bg-blue-50',
          statusColor: r.statusColor || 'text-emerald-600 bg-emerald-100/60',
          pages: r.pages || '1 page',
        }));
        setReports(formatted as any);
      }
      setIsLoading(false);
    };
    fetchReports();
  }, []);

  // Filtered reports based on search query
  const filteredReports = useMemo(() => {
    const query = (searchQuery || '').toLowerCase().trim();
    if (!query) return reports;
    return reports.filter(r => 
      (r.title && r.title.toLowerCase().includes(query)) ||
      (r.hospital && r.hospital.toLowerCase().includes(query)) ||
      (r.doctor && r.doctor.toLowerCase().includes(query)) ||
      (r.date && r.date.toLowerCase().includes(query)) ||
      (r.status && r.status.toLowerCase().includes(query))
    );
  }, [reports, searchQuery]);

  const displayedReports = showAllReports ? filteredReports : filteredReports.slice(0, 3);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert('Unsupported file type. Please upload PDF, JPG, or PNG.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB
      alert('File is too large. Maximum size is 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const res = await reportsApi.uploadReport({
        title: file.name,
        hospital: 'Uploaded by You',
        doctor: 'Self-Uploaded Document',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        fileData: base64String,
        fileName: file.name,
        pages: '1 page',
        status: 'Uploaded',
        summary: `Uploaded document: ${file.name} (${(file.size / 1024).toFixed(1)} KB). Verified and safely saved in your personal health records vault.`
      });

      if (res.success && res.data) {
        setReports(prev => [{
          ...res.data!,
          iconName: res.data!.iconName || 'FileText',
          iconColor: res.data!.iconColor || 'text-blue-500',
          bg: res.data!.bg || 'bg-blue-50',
          statusColor: res.data!.statusColor || 'text-blue-600 bg-blue-100/60',
          pages: res.data!.pages || '1 page',
        } as any, ...prev]);
        setActiveTab('received');
      } else {
        alert(res.error || 'Failed to upload report');
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this report?')) {
      const res = await reportsApi.deleteReport(id);
      if (res.success) {
        setReports(prev => prev.filter(r => r.id !== id));
        if (selectedReport?.id === id) {
          setSelectedReport(null);
        }
      } else {
        alert(res.error || 'Failed to delete report');
      }
    }
  };

  const handleDownload = async (report: ReportItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Download real file if it has fileUrl
    if ((report as any).fileUrl) {
      const res = await reportsApi.downloadReport(report.id, report.title.replace(/[^a-zA-Z0-9_-]/g, '_'));
      if (!res.success) {
        alert(res.error || 'Failed to download report');
      }
      return;
    }

    // Fallback for mocked/legacy records
    const content = `======================================================
MEDIQUEE HEALTHCARE NETWORK - OFFICIAL MEDICAL REPORT
======================================================

Report ID: ${report.id}
Test Name: ${report.title}
Diagnostic Facility: ${report.hospital}
Doctor: ${report.doctor || 'Verified Healthcare Provider'}
Date of Issue: ${report.date}
Clinical Status: ${report.status}
Document Pages: ${report.pages}

CLINICAL FINDINGS & SUMMARY:
${report.summary || 'Official medical test findings recorded and verified by accredited laboratory specialists.'}

======================================================
Verified Digital Health Record • MediQuee Healthcare Network
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-x-hidden">
      {/* Header */}
      <div className="bg-[#0055ff] pt-6 pb-14 px-4 text-white rounded-b-3xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-20 pointer-events-none">
           <FileText className="w-32 h-32 -mr-6 -mt-4" strokeWidth={1} />
        </div>
        <div className="flex items-center gap-3 mb-1 relative z-10">
          <button 
            onClick={() => navigate(-1)} 
            className="p-1 hover:bg-white/20 rounded-full transition-colors -ml-1"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[22px] font-bold">My Reports</h1>
        </div>
        <p className="text-[13px] text-white/90 mb-5 relative z-10">All your medical reports in one place</p>
        
        <div className="relative max-w-md mx-auto z-10">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
             <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input 
             type="text" 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="block w-full pl-12 pr-10 py-3.5 border-0 rounded-full bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-white/50 shadow-md text-[13px] font-medium" 
             placeholder="Search reports by test, hospital or date..." 
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 pb-24 px-4 -mt-6 relative z-20">
        
        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex mb-6 max-w-md mx-auto overflow-hidden">
            <button 
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-[13px] font-bold border-b-[2.5px] transition-colors ${activeTab === 'received' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('received')}
            >
              <Download className="w-4 h-4" />
              Received Reports
            </button>
            <button 
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-[13px] font-bold border-b-[2.5px] transition-colors ${activeTab === 'upload' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('upload')}
            >
              <CloudUpload className="w-4 h-4" />
              Upload Reports
            </button>
        </div>

        {/* Received Reports Section */}
        {activeTab === 'received' && (
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold text-slate-900">Received Reports</h2>
              <span className="text-[11px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                {filteredReports.length}
              </span>
            </div>
            {filteredReports.length > 3 && (
              <button 
                onClick={() => setShowAllReports(!showAllReports)} 
                className="flex items-center text-blue-600 cursor-pointer hover:text-blue-700 transition-colors"
              >
                <span className="text-[11px] font-bold">{showAllReports ? 'Show less' : 'View all'}</span>
                <ChevronRight className={`w-4 h-4 transition-transform ${showAllReports ? '-rotate-90' : ''}`} />
              </button>
            )}
          </div>

          <div className="space-y-3">
            {displayedReports.map((report) => {
              const IconComponent = getIconComponent(report.iconName || report.icon);
              return (
              <div 
                key={report.id} 
                onClick={() => setSelectedReport(report)}
                className="bg-white rounded-2xl p-4 flex items-center border border-slate-100 shadow-sm relative group cursor-pointer hover:border-blue-200 hover:shadow-md transition-all"
              >
                <div className={`w-14 h-14 rounded-full ${report.bg || 'bg-blue-50'} flex items-center justify-center shrink-0 mr-3`}>
                  <IconComponent className={`w-6 h-6 ${report.iconColor || 'text-blue-500'}`} strokeWidth={1.5} />
                </div>
                
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="font-bold text-slate-900 text-[13px] truncate mb-1 group-hover:text-blue-600 transition-colors">
                    {report.title}
                  </h3>
                  <div className="flex items-center text-[10px] text-slate-500 font-medium mb-1.5">
                    <span className="truncate">{report.hospital}</span>
                    <BadgeCheck className="w-3.5 h-3.5 text-blue-600 ml-1.5 shrink-0" />
                  </div>
                  <div className="flex items-center text-[10px] text-slate-500 font-medium gap-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>{report.date}</span>
                    </div>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>{report.pages}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between shrink-0 ml-2 h-[56px]">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${report.statusColor}`}>
                      {report.status}
                    </span>
                    <button 
                      onClick={(e) => handleDelete(report.id, e)} 
                      title="Delete report"
                      className="text-red-400 hover:text-red-600 p-1 rounded transition-colors bg-red-50/50 hover:bg-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-auto">
                    <button 
                      onClick={(e) => handleDownload(report, e)}
                      title="Download report"
                      className="flex flex-col items-center justify-center cursor-pointer hover:text-blue-700 text-blue-600 active:scale-95 transition-transform"
                    >
                      <Download className="w-4 h-4 mb-0.5" strokeWidth={2} />
                      <span className="text-[9px] font-medium text-slate-500">Download</span>
                    </button>
                  </div>
                </div>
              </div>
            )})}
          </div>

          {filteredReports.length > 3 && !showAllReports && (
            <button 
              onClick={() => setShowAllReports(true)}
              className="w-full flex items-center justify-center gap-1 py-4 text-blue-600 font-bold text-[13px] hover:text-blue-700 transition-colors"
            >
              Load More ({filteredReports.length - 3} more) <ChevronDown className="w-4 h-4" />
            </button>
          )}

          {filteredReports.length === 0 && (
            <div className="text-center py-10 px-4 bg-white rounded-2xl border border-slate-100 mt-2 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-slate-800 font-bold text-[14px]">No reports found</p>
              <p className="text-slate-500 text-[11px] mt-1 max-w-xs mx-auto">
                {searchQuery 
                  ? `No records matching "${searchQuery}". Try a different search term.` 
                  : 'You have no saved or uploaded medical reports yet.'}
              </p>
              {searchQuery ? (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-[11px] font-bold text-blue-600 hover:underline"
                >
                  Clear search
                </button>
              ) : (
                <button 
                  onClick={() => setActiveTab('upload')}
                  className="mt-4 inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-[11px] font-bold hover:bg-blue-700 transition-colors shadow-xs"
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  <span>Upload a Report</span>
                </button>
              )}
            </div>
          )}
        </div>
        )}

        {/* Upload Reports Section */}
        {activeTab === 'upload' && (
        <div className="max-w-md mx-auto mt-2">
          <h2 className="text-[15px] font-bold text-slate-900 mb-4">Upload Reports</h2>
          
          <div className="border-[1.5px] border-dashed border-blue-300 bg-blue-50/50 rounded-2xl p-5 flex items-center justify-between mb-4">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-blue-100 shrink-0">
                   <CloudUpload className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                   <h3 className="text-[13px] font-bold text-slate-900 mb-1">Upload your reports</h3>
                   <p className="text-[10px] text-slate-500 font-medium">JPG, PNG, PDF up to 10MB each</p>
                </div>
             </div>
             <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".pdf,.jpg,.jpeg,.png" 
              />
             <button onClick={() => fileInputRef.current?.click()} className="border-[1.5px] border-blue-600 text-blue-600 bg-white px-4 py-2 rounded-xl text-[12px] font-bold shrink-0 shadow-sm hover:bg-blue-50 transition-colors cursor-pointer">
                Choose Files
             </button>
          </div>
          
          <div className="flex items-start gap-2 text-[10px] text-slate-500 font-medium px-1">
             <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
             <p>Your reports are private and secure. We do not share your data with anyone.</p>
          </div>
        </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (() => {
        const ModalIcon = getIconComponent(selectedReport.iconName || selectedReport.icon);
        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl relative border border-slate-100">
              {/* Close Button */}
              <button 
                onClick={() => setSelectedReport(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-start gap-3.5 mb-4 pr-8">
                <div className={`w-12 h-12 rounded-2xl ${selectedReport.bg || 'bg-blue-50'} flex items-center justify-center shrink-0`}>
                  <ModalIcon className={`w-6 h-6 ${selectedReport.iconColor || 'text-blue-500'}`} />
                </div>
                <div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${selectedReport.statusColor}`}>
                    {selectedReport.status}
                  </span>
                  <h3 className="font-bold text-slate-900 text-[16px] mt-1 leading-snug">
                    {selectedReport.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{selectedReport.hospital}</p>
                </div>
              </div>

              {/* Meta Info Grid */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-2xl p-3 mb-4 text-[11px]">
                <div>
                  <span className="text-slate-400 font-medium block">Prescribing Doctor</span>
                  <span className="font-bold text-slate-800">{selectedReport.doctor || 'Healthcare Specialist'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Date of Issue</span>
                  <span className="font-bold text-slate-800">{selectedReport.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Report Status</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    {selectedReport.status === 'Normal' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 inline" />
                    )}
                    {selectedReport.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Pages</span>
                  <span className="font-bold text-slate-800">{selectedReport.pages}</span>
                </div>
              </div>

              {/* Findings / Summary */}
              <div className="mb-5">
                <h4 className="text-[12px] font-bold text-slate-800 mb-1.5">Clinical Findings & Summary</h4>
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/70 text-[11.5px] text-slate-700 leading-relaxed font-medium">
                  {selectedReport.summary || 'Official report verified and archived in your MediQuee health records.'}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-2.5">
                <button 
                  onClick={() => handleDownload(selectedReport)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors active:scale-98 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Report</span>
                </button>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="py-2.5 px-4 rounded-xl text-[12px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Reports;
