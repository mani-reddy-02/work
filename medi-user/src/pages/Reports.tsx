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

const defaultReports: ReportItem[] = [
  { 
    id: '1', 
    title: 'Complete Blood Count (CBC)', 
    hospital: 'Apollo Diagnostics', 
    doctor: 'Dr. Ramesh Sharma',
    date: '12 May 2024', 
    pages: '2 pages', 
    status: 'Normal', 
    statusColor: 'text-emerald-600 bg-emerald-100/60', 
    iconName: 'FlaskConical',
    iconColor: 'text-red-500', 
    bg: 'bg-red-50',
    summary: 'Hemoglobin: 14.2 g/dL (Normal), RBC: 4.8 mil/uL, WBC: 6,800 /mcL, Platelets: 240,000 /mcL. All hematology parameters are within standard clinical reference ranges.'
  },
  { 
    id: '2', 
    title: 'Chest X-Ray', 
    hospital: 'Manipal Hospital', 
    doctor: 'Dr. Priya Nair',
    date: '08 May 2024', 
    pages: '1 page', 
    status: 'Review', 
    statusColor: 'text-orange-600 bg-orange-100/60', 
    iconName: 'Scan',
    iconColor: 'text-blue-500', 
    bg: 'bg-blue-50',
    summary: 'Bilateral lung fields show no consolidation, effusion, or active lesions. Heart size is normal. Mild bronchovascular prominence; routine clinical correlation advised.'
  },
  { 
    id: '3', 
    title: 'Lipid Profile', 
    hospital: 'Narayana Health', 
    doctor: 'Dr. Arvind Rao',
    date: '02 May 2024', 
    pages: '1 page', 
    status: 'Normal', 
    statusColor: 'text-emerald-600 bg-emerald-100/60', 
    iconName: 'Activity',
    iconColor: 'text-purple-500', 
    bg: 'bg-purple-50',
    summary: 'Total Cholesterol: 182 mg/dL (<200 Desirable), HDL: 52 mg/dL (Normal), LDL: 104 mg/dL (Optimal), Triglycerides: 130 mg/dL (Normal). Optimal lipid profile.'
  },
  { 
    id: '4', 
    title: 'Urine Routine & Microscopy', 
    hospital: 'Thyrocare', 
    doctor: 'Dr. Sneha Patil',
    date: '25 Apr 2024', 
    pages: '2 pages', 
    status: 'Normal', 
    statusColor: 'text-emerald-600 bg-emerald-100/60', 
    iconName: 'Microscope',
    iconColor: 'text-teal-500', 
    bg: 'bg-teal-50',
    summary: 'Color: Pale yellow, Appearance: Clear, pH: 6.0, Specific Gravity: 1.018. Protein: Nil, Glucose: Nil. Pus cells: 1-2 /hpf. Normal physiological urinalysis.'
  },
  { 
    id: '5', 
    title: 'ECG Report', 
    hospital: 'Fortis Hospital', 
    doctor: 'Dr. Rajesh Khanna',
    date: '20 Apr 2024', 
    pages: '1 page', 
    status: 'Review', 
    statusColor: 'text-orange-600 bg-orange-100/60', 
    iconName: 'FileText',
    iconColor: 'text-orange-500', 
    bg: 'bg-orange-50',
    summary: '12-lead ECG shows Normal Sinus Rhythm, rate 74 bpm. Normal PR interval (150ms) and QRS duration (88ms). No acute ST segment elevation or ischemic changes.'
  },
];

const Reports = () => {
  const [activeTab, setActiveTab] = useState<'received' | 'upload'>('received');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Safe state initialization that handles corrupted or missing localStorage data
  const [reports, setReports] = useState<ReportItem[]>(() => {
    try {
      const saved = localStorage.getItem('mediquee_reports');
      if (!saved) return defaultReports;
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return defaultReports;
      
      const sanitized = parsed.map((item: any, idx: number): ReportItem => {
        if (!item || typeof item !== 'object') {
          return defaultReports[idx % defaultReports.length];
        }
        return {
          id: String(item.id || `report-${Date.now()}-${idx}`),
          title: String(item.title || 'Medical Report'),
          hospital: String(item.hospital || 'Diagnostic Lab'),
          doctor: item.doctor ? String(item.doctor) : 'Verified Healthcare Provider',
          date: String(item.date || 'Recent'),
          pages: String(item.pages || '1 page'),
          status: String(item.status || 'Normal'),
          statusColor: String(item.statusColor || 'text-emerald-600 bg-emerald-100/60'),
          iconName: typeof item.iconName === 'string' ? item.iconName : (typeof item.icon === 'string' ? item.icon : 'FileText'),
          iconColor: String(item.iconColor || 'text-blue-500'),
          bg: String(item.bg || 'bg-blue-50'),
          summary: item.summary ? String(item.summary) : 'Official medical report document.'
        };
      });

      return sanitized.length > 0 ? sanitized : defaultReports;
    } catch (e) {
      console.error('Safe fallback: unable to parse stored reports', e);
      return defaultReports;
    }
  });
  
  const [showAllReports, setShowAllReports] = useState(false);

  // Safe localStorage persistence with serializable string names for icons
  useEffect(() => {
    try {
      const cleanToSave = reports.map(r => ({
        id: r.id,
        title: r.title,
        hospital: r.hospital,
        doctor: r.doctor,
        date: r.date,
        pages: r.pages,
        status: r.status,
        statusColor: r.statusColor,
        iconName: r.iconName || (typeof r.icon === 'string' ? r.icon : 'FileText'),
        iconColor: r.iconColor,
        bg: r.bg,
        summary: r.summary
      }));
      localStorage.setItem('mediquee_reports', JSON.stringify(cleanToSave));
    } catch (e) {
      console.error('Error saving reports to localStorage:', e);
    }
  }, [reports]);

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

    const newReport: ReportItem = {
      id: Date.now().toString(),
      title: file.name,
      hospital: 'Uploaded by You',
      doctor: 'Self-Uploaded Document',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      pages: '1 page',
      status: 'Uploaded',
      statusColor: 'text-blue-600 bg-blue-100/60',
      iconName: 'FileText',
      iconColor: 'text-blue-500',
      bg: 'bg-blue-50',
      summary: `Uploaded document: ${file.name} (${(file.size / 1024).toFixed(1)} KB). Verified and safely saved in your personal health records vault.`
    };

    setReports(prev => [newReport, ...prev]);
    setActiveTab('received');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this report?')) {
      setReports(prev => prev.filter(r => r.id !== id));
      if (selectedReport?.id === id) {
        setSelectedReport(null);
      }
    }
  };

  const handleDownload = (report: ReportItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
