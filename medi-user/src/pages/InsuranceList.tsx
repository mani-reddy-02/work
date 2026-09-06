import { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, Shield, ChevronRight, Search, Activity, Users, HeartPulse, Building, FileText, CheckCircle, X, AlertCircle, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const insuranceData = [
   {
      id: 1,
      companyName: "Star Health",
      planName: "Comprehensive Health Plan",
      category: "Family",
      coverage: "₹10 Lakhs",
      claimSettlementRatio: "92%",
      networkHospitals: "14,000+",
      benefits: [
         "Cashless Hospitalization",
         "Day-care Procedures",
         "Pre/Post Hospitalization",
         "Ambulance coverage"
      ],
      popularity: "Popular",
      requiredDocuments: [
         { name: "Identity Proof", required: true },
         { name: "Address Proof", required: true },
         { name: "Age Proof", required: true },
         { name: "Income Proof", required: false }
      ]
   },
   {
      id: 2,
      companyName: "HDFC ERGO",
      planName: "Optima Restore",
      category: "Individual",
      coverage: "₹15 Lakhs",
      claimSettlementRatio: "97%",
      networkHospitals: "10,000+",
      benefits: [
         "Multiplier Benefit",
         "No Room Rent Capping",
         "Preventive Health Checkup"
      ],
      popularity: "High",
      requiredDocuments: [
         { name: "Identity Proof", required: true },
         { name: "Address Proof", required: true },
         { name: "Age Proof", required: true },
         { name: "Medical Documents", required: true }
      ]
   },
   {
      id: 3,
      companyName: "Niva Bupa",
      planName: "ReAssure 2.0",
      category: "Family",
      coverage: "₹25 Lakhs+",
      claimSettlementRatio: "91%",
      networkHospitals: "8,500+",
      benefits: [
         "Lock the clock",
         "ReAssure benefit unlimited times",
         "Live Healthy benefit"
      ],
      popularity: "Popular",
      requiredDocuments: [
         { name: "Identity Proof", required: true },
         { name: "Address Proof", required: true },
         { name: "Age Proof", required: true }
      ]
   },
   {
      id: 4,
      companyName: "Care Health",
      planName: "Care Advantage",
      category: "Senior Citizen",
      coverage: "₹5 Lakhs",
      claimSettlementRatio: "90%",
      networkHospitals: "9,000+",
      benefits: [
         "Annual Health Check-up",
         "Alternative Treatments (AYUSH)",
         "Automatic Recharge"
      ],
      popularity: "High",
      requiredDocuments: [
         { name: "Identity Proof", required: true },
         { name: "Address Proof", required: true },
         { name: "Age Proof", required: true },
         { name: "Medical Documents", required: true },
         { name: "Previous Insurance Documents", required: false }
      ]
   },
   {
      id: 5,
      companyName: "ICICI Lombard",
      planName: "Health AdvantEdge",
      category: "Individual",
      coverage: "₹10 Lakhs",
      claimSettlementRatio: "94%",
      networkHospitals: "7,500+",
      benefits: [
         "Worldwide Cover",
         "Bariatric Surgery Cover",
         "Wellness Program"
      ],
      popularity: "High",
      requiredDocuments: [
         { name: "Identity Proof", required: true },
         { name: "Address Proof", required: true },
         { name: "Age Proof", required: true },
         { name: "Medical Documents", required: true }
      ]
   }
];

const InsuranceList = () => {
   const navigate = useNavigate();
   const [searchQuery, setSearchQuery] = useState('');
   const [selectedInsurance, setSelectedInsurance] = useState<any>(null);
   const [viewState, setViewState] = useState<'PLAN_DETAILS' | 'DOCUMENTS' | 'APPLICANT' | 'REVIEW' | 'SUBMITTED'>('PLAN_DETAILS');
   
   const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({});
   const [docError, setDocError] = useState('');
   const [applicant, setApplicant] = useState({
      fullName: '',
      dob: '',
      gender: 'Male',
      mobile: '',
      email: '',
      address: '',
      nominee: ''
   });

   const handleDocumentUpload = (docName: string, fileName: string) => {
      setUploadedDocs(prev => ({ ...prev, [docName]: fileName }));
      setDocError('');
   };

   const handleContinueFromDocs = () => {
      const requiredDocs = selectedInsurance.requiredDocuments.filter((d: any) => d.required);
      const missing = requiredDocs.find((d: any) => !uploadedDocs[d.name]);
      if (missing) {
         setDocError('Please upload all required documents.');
         return;
      }
      setViewState('APPLICANT');
   };

   const handleApplicantSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setViewState('REVIEW');
   };

   const handleSubmitApplication = () => {
      setViewState('SUBMITTED');
   };


   const scrollRef = useRef<HTMLDivElement>(null);
   const [isPaused, setIsPaused] = useState(false);

   useEffect(() => {
      if (isPaused || !scrollRef.current) return;
      const interval = setInterval(() => {
         if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            if (scrollLeft + clientWidth >= scrollWidth - 1) {
               scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
               scrollRef.current.scrollBy({ left: 260, behavior: 'smooth' });
            }
         }
      }, 3000);
      return () => clearInterval(interval);
   }, [isPaused]);

   const filteredInsurance = useMemo(() => {
      const q = searchQuery.toLowerCase().trim();
      return insuranceData.filter(insurance =>
         insurance.companyName.toLowerCase().includes(q) ||
         insurance.planName.toLowerCase().includes(q) ||
         insurance.category.toLowerCase().includes(q)
      );
   }, [searchQuery]);

   if (selectedInsurance && viewState !== 'PLAN_DETAILS') {
      return (
         <div className="min-h-screen bg-slate-50 animate-in fade-in slide-in-from-right-8 duration-300 pb-20">
            {/* Header */}
            <div className="bg-white px-4 py-3 sticky top-0 z-50 shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-center gap-3">
               <button onClick={() => {
                  if (viewState === 'SUBMITTED') {
                     setSelectedInsurance(null);
                     setViewState('PLAN_DETAILS');
                  } else {
                     setViewState('PLAN_DETAILS');
                  }
               }} className="p-2 -ml-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <ArrowLeft className="w-5 h-5 text-slate-700" />
               </button>
               <h1 className="text-[16px] font-bold text-slate-800">Apply for Insurance</h1>
            </div>

            <div className="p-4 space-y-6">
               <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                     <Building className="w-6 h-6" />
                  </div>
                  <div>
                     <p className="text-[11px] text-slate-500 font-medium mb-0.5">Applying for:</p>
                     <h3 className="font-bold text-slate-800 text-[14px] leading-tight">{selectedInsurance.companyName} - {selectedInsurance.planName}</h3>
                  </div>
               </div>

               {viewState !== 'SUBMITTED' && (
                  <div>
                     <h2 className="text-[16px] font-bold text-slate-900 mb-1">Complete Your Insurance Application</h2>
                     <p className="text-[12px] text-slate-500 leading-relaxed mb-4">
                        Please provide the required information and upload the necessary documents to apply for this insurance plan.
                     </p>
                     
                     <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100/50">
                        <h4 className="text-[12px] font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                           <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                           Why do we need these documents?
                        </h4>
                        <p className="text-[11px] text-blue-800/80 leading-relaxed">
                           These documents help verify your identity, eligibility, and application details. Please make sure the uploaded documents are clear and valid.
                        </p>
                     </div>
                  </div>
               )}

               {viewState !== 'SUBMITTED' && (
                  <div className="flex items-center justify-between px-1 mb-2">
                     {['Documents', 'Applicant Details', 'Review', 'Submit'].map((step, index) => {
                        const stateMap = ['DOCUMENTS', 'APPLICANT', 'REVIEW', 'SUBMITTED'];
                        const isActive = viewState === stateMap[index];
                        const isPast = stateMap.indexOf(viewState) > index;
                        
                        return (
                           <div key={step} className="flex items-center flex-1 last:flex-none">
                              <div className="flex flex-col items-center gap-1.5 relative z-10 bg-slate-50">
                                 <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isActive ? 'bg-[#0055ff] text-white shadow-md shadow-blue-500/30' : isPast ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                    {isPast ? <CheckCircle className="w-3.5 h-3.5" /> : `0${index + 1}`}
                                 </div>
                                 <span className={`text-[9px] font-bold absolute top-7 w-20 text-center whitespace-nowrap left-1/2 -translate-x-1/2 ${isActive ? 'text-[#0055ff]' : isPast ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {step}
                                 </span>
                              </div>
                              {index < 3 && (
                                 <div className={`flex-1 h-[2px] -ml-2 -mr-2 rounded-full ${isPast ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                              )}
                           </div>
                        );
                     })}
                  </div>
               )}

               <div className={viewState !== 'SUBMITTED' ? "pt-6" : ""}>
                  {viewState === 'DOCUMENTS' && (
                     <div className="animate-in fade-in duration-300">
                        <h3 className="text-[16px] font-bold text-slate-900 mb-1">Documents Required</h3>
                        <p className="text-[12px] text-slate-500 mb-5">Upload the documents required for your selected insurance plan.</p>

                        {docError && (
                           <div className="mb-4 p-3 bg-red-50 text-red-600 text-[12px] font-bold rounded-xl border border-red-100 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              {docError}
                           </div>
                        )}

                        <div className="space-y-4 mb-8">
                           {selectedInsurance.requiredDocuments.map((doc: any, i: number) => (
                              <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
                                 <div className="mb-3">
                                    <h4 className="text-[14px] font-bold text-slate-800">{doc.name}</h4>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                       {doc.required ? (
                                          <>
                                             <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                             <span className="text-[11px] font-bold text-red-500">Required</span>
                                          </>
                                       ) : (
                                          <span className="text-[11px] font-bold text-slate-400">Optional</span>
                                       )}
                                    </div>
                                 </div>
                                 
                                 {!uploadedDocs[doc.name] ? (
                                    <label className="w-full py-2.5 bg-slate-50 text-[#0055ff] border border-slate-200 rounded-lg text-[13px] font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                                       <Upload className="w-4 h-4" />
                                       Upload Document
                                       <input 
                                          type="file" 
                                          accept=".pdf,.jpg,.jpeg,.png"
                                          className="hidden"
                                          onChange={(e) => {
                                             if (e.target.files && e.target.files[0]) {
                                                handleDocumentUpload(doc.name, e.target.files[0].name);
                                             }
                                          }}
                                       />
                                    </label>
                                 ) : (
                                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3">
                                       <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-1.5 text-emerald-600">
                                             <CheckCircle className="w-4 h-4" />
                                             <span className="text-[12px] font-bold">Uploaded</span>
                                          </div>
                                          <button onClick={() => {
                                             setUploadedDocs(prev => {
                                                const next = {...prev};
                                                delete next[doc.name];
                                                return next;
                                             });
                                          }} className="text-[11px] text-red-500 font-bold hover:underline">
                                             Remove
                                          </button>
                                       </div>
                                       <div className="flex items-center justify-between gap-2">
                                          <p className="text-[11px] text-slate-600 font-medium truncate flex-1">{uploadedDocs[doc.name]}</p>
                                          <label className="text-[11px] text-[#0055ff] font-bold cursor-pointer hover:underline">
                                             Replace
                                             <input 
                                                type="file" 
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                className="hidden"
                                                onChange={(e) => {
                                                   if (e.target.files && e.target.files[0]) {
                                                      handleDocumentUpload(doc.name, e.target.files[0].name);
                                                   }
                                                }}
                                             />
                                          </label>
                                       </div>
                                    </div>
                                 )}
                              </div>
                           ))}
                        </div>

                        <button onClick={handleContinueFromDocs} className="w-full py-3.5 rounded-xl bg-[#0055ff] text-white font-bold text-[14px] hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30">
                           Continue to Applicant Details
                        </button>
                     </div>
                  )}

                  {viewState === 'APPLICANT' && (
                     <div className="animate-in fade-in duration-300">
                        <form id="applicantForm" onSubmit={handleApplicantSubmit} className="space-y-4 mb-8">
                           <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Full Name</label>
                              <input type="text" required value={applicant.fullName} onChange={(e) => setApplicant({...applicant, fullName: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                              <div>
                                 <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Date of Birth</label>
                                 <input type="date" required value={applicant.dob} onChange={(e) => setApplicant({...applicant, dob: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                              </div>
                              <div>
                                 <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Gender</label>
                                 <select value={applicant.gender} onChange={(e) => setApplicant({...applicant, gender: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                 </select>
                              </div>
                           </div>
                           <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Mobile Number</label>
                              <input type="tel" required value={applicant.mobile} onChange={(e) => setApplicant({...applicant, mobile: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                           </div>
                           <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Email</label>
                              <input type="email" required value={applicant.email} onChange={(e) => setApplicant({...applicant, email: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                           </div>
                           <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Address</label>
                              <textarea required rows={2} value={applicant.address} onChange={(e) => setApplicant({...applicant, address: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"></textarea>
                           </div>
                           <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Nominee Details</label>
                              <input type="text" required value={applicant.nominee} onChange={(e) => setApplicant({...applicant, nominee: e.target.value})} placeholder="Name & Relationship" className="w-full border border-slate-200 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                           </div>
                        </form>
                        <div className="flex gap-3">
                           <button onClick={() => setViewState('DOCUMENTS')} className="flex-1 py-3.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-[14px] hover:bg-slate-50 transition-colors">
                              Back
                           </button>
                           <button type="submit" form="applicantForm" className="flex-[2] py-3.5 rounded-xl bg-[#0055ff] text-white font-bold text-[14px] hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30">
                              Review Application
                           </button>
                        </div>
                     </div>
                  )}

                  {viewState === 'REVIEW' && (
                     <div className="animate-in fade-in duration-300">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.04)] mb-4">
                           <h4 className="text-[14px] font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">Applicant Details</h4>
                           <div className="space-y-2.5">
                              <div className="flex justify-between">
                                 <span className="text-[12px] text-slate-500">Name</span>
                                 <span className="text-[12px] font-bold text-slate-800">{applicant.fullName}</span>
                              </div>
                              <div className="flex justify-between">
                                 <span className="text-[12px] text-slate-500">DOB & Gender</span>
                                 <span className="text-[12px] font-bold text-slate-800">{applicant.dob}, {applicant.gender}</span>
                              </div>
                              <div className="flex justify-between">
                                 <span className="text-[12px] text-slate-500">Contact</span>
                                 <span className="text-[12px] font-bold text-slate-800">{applicant.mobile}</span>
                              </div>
                           </div>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.04)] mb-8">
                           <h4 className="text-[14px] font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">Uploaded Documents</h4>
                           <div className="space-y-3">
                              {selectedInsurance.requiredDocuments.map((doc: any, i: number) => (
                                 <div key={i} className="flex justify-between items-center">
                                    <span className="text-[13px] font-medium text-slate-700">{doc.name}</span>
                                    {uploadedDocs[doc.name] ? (
                                       <div className="flex items-center gap-1 text-emerald-600">
                                          <CheckCircle className="w-4 h-4" />
                                          <span className="text-[11px] font-bold">Uploaded</span>
                                       </div>
                                    ) : (
                                       <span className="text-[11px] text-slate-400 font-bold">Not Uploaded</span>
                                    )}
                                 </div>
                              ))}
                           </div>
                        </div>

                        <div className="flex gap-3">
                           <button onClick={() => setViewState('APPLICANT')} className="flex-1 py-3.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-[14px] hover:bg-slate-50 transition-colors">
                              Back
                           </button>
                           <button onClick={handleSubmitApplication} className="flex-[2] py-3.5 rounded-xl bg-[#0055ff] text-white font-bold text-[14px] hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30">
                              Submit Application
                           </button>
                        </div>
                     </div>
                  )}

                  {viewState === 'SUBMITTED' && (
                     <div className="animate-in fade-in duration-300 flex flex-col items-center justify-center text-center pt-8">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                           <CheckCircle className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h2 className="text-[20px] font-black text-slate-900 mb-2">Application Submitted</h2>
                        <p className="text-[13px] text-slate-500 mb-6 px-4">Your insurance application has been submitted successfully.</p>
                        
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 w-full max-w-sm mb-8">
                           <div className="flex justify-between items-center mb-3">
                              <span className="text-[12px] text-slate-500">Application ID:</span>
                              <span className="text-[13px] font-bold text-slate-800">MQ-INS-001</span>
                           </div>
                           <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                              <span className="text-[12px] text-slate-500">Status:</span>
                              <span className="text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Documents Submitted</span>
                           </div>
                           
                           <div className="text-left">
                              <p className="text-[11px] font-bold text-slate-700 mb-3">Document Status:</p>
                              <div className="space-y-3">
                                 {Object.entries(uploadedDocs).map(([docName, fileName]) => (
                                    <div key={docName} className="flex justify-between items-center">
                                       <div className="flex flex-col">
                                          <span className="text-[12px] text-slate-800 font-medium">{docName}</span>
                                          <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{fileName}</span>
                                       </div>
                                       <div className="flex flex-col items-end">
                                          <div className="flex items-center gap-1 text-emerald-600 mb-0.5">
                                             <CheckCircle className="w-3 h-3" />
                                             <span className="text-[10px] font-bold">Uploaded</span>
                                          </div>
                                          <span className="text-[10px] font-bold text-amber-600">⏳ Under Verification</span>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                        
                        <p className="text-[11px] text-slate-500 px-4 leading-relaxed mb-6">
                           The "Verified & Assured" badge is a UI trust indicator for the listed insurance/provider and must not be presented as proof of regulatory approval or actual policy issuance.
                        </p>

                        <button onClick={() => { setSelectedInsurance(null); setViewState('PLAN_DETAILS'); }} className="w-full py-3.5 rounded-xl bg-[#0055ff] text-white font-bold text-[14px] hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30">
                           Done
                        </button>
                     </div>
                  )}
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="flex flex-col h-full bg-slate-50 relative">      {/* Header */}
         <div className="bg-gradient-to-r from-[#0055ff] to-[#06b6d4] pt-4 pb-6 px-4 text-white rounded-b-3xl shrink-0">
            <div className="flex items-center gap-3 mb-6">
               <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                  <ArrowLeft className="w-6 h-6" />
               </button>
               <div className="flex-1">
                  <h1 className="text-xl font-bold">Health Insurance</h1>
                  <p className="text-[11px] text-blue-100 mt-1">Protect yourself and your family from unexpected healthcare expenses.</p>
               </div>
            </div>

            <div className="relative max-w-md mx-auto">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
               </div>
               <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 border-0 rounded-2xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-white/50 shadow-lg text-[13px]"
                  placeholder="Search by insurance company or plan name..."
               />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto pb-24 px-4 pt-6">
            <div className="max-w-7xl mx-auto space-y-8">

               {/* Why Health Insurance Matters */}
               {!searchQuery && (
                  <section>
                     <h2 className="text-[16px] font-bold text-slate-900 mb-4">Why Health Insurance Matters</h2>
                     <div 
                        ref={scrollRef}
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                        onTouchStart={() => setIsPaused(true)}
                        onTouchEnd={() => setIsPaused(false)}
                        className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 -mx-4 px-4 snap-x"
                     >
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center shrink-0 snap-center min-w-[240px] max-w-[260px]">
                           <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                              <Shield className="w-6 h-6 text-blue-600" />
                           </div>
                           <h3 className="font-bold text-slate-800 text-[13px] mb-1.5">Financial Protection</h3>
                           <p className="text-[11px] text-slate-500 leading-relaxed">Reduce the financial burden of unexpected hospitalization and medical treatment.</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center shrink-0 snap-center min-w-[240px] max-w-[260px]">
                           <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                              <Activity className="w-6 h-6 text-emerald-600" />
                           </div>
                           <h3 className="font-bold text-slate-800 text-[13px] mb-1.5">Cashless Treatment</h3>
                           <p className="text-[11px] text-slate-500 leading-relaxed">Access cashless treatment at eligible network hospitals according to policy terms.</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center shrink-0 snap-center min-w-[240px] max-w-[260px]">
                           <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mb-3">
                              <Users className="w-6 h-6 text-purple-600" />
                           </div>
                           <h3 className="font-bold text-slate-800 text-[13px] mb-1.5">Family Protection</h3>
                           <p className="text-[11px] text-slate-500 leading-relaxed">Choose plans that can provide healthcare coverage for you and your family.</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center shrink-0 snap-center min-w-[240px] max-w-[260px]">
                           <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-3">
                              <HeartPulse className="w-6 h-6 text-rose-600" />
                           </div>
                           <h3 className="font-bold text-slate-800 text-[13px] mb-1.5">Better Healthcare Access</h3>
                           <p className="text-[11px] text-slate-500 leading-relaxed">Insurance can make planned and emergency healthcare expenses easier to manage.</p>
                        </div>
                     </div>
                  </section>
               )}

               {/* Insurance at a Glance */}
               {!searchQuery && (
                  <section>
                     <h2 className="text-[16px] font-bold text-slate-900 mb-4 flex items-center gap-2">
                        Insurance at a Glance
                        <span className="bg-blue-100 text-blue-700 text-[9px] px-2 py-0.5 rounded-full font-bold">Demo Data</span>
                     </h2>
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                           <p className="text-[10px] text-slate-500 font-medium mb-1">Avg. Settlement Ratio</p>
                           <p className="text-[18px] font-black text-slate-800">92%</p>
                        </div>
                        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                           <p className="text-[10px] text-slate-500 font-medium mb-1">Most Popular</p>
                           <p className="text-[16px] font-black text-slate-800">Star Health</p>
                        </div>
                        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                           <p className="text-[10px] text-slate-500 font-medium mb-1">Network Hospitals</p>
                           <p className="text-[18px] font-black text-slate-800">10,000+</p>
                        </div>
                        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                           <p className="text-[10px] text-slate-500 font-medium mb-1">Plans Available</p>
                           <p className="text-[18px] font-black text-slate-800">15+</p>
                        </div>
                     </div>
                  </section>
               )}

               {/* Explore Health Insurance */}
               <section>
                  <div className="flex items-center justify-between mb-4">
                     <h2 className="text-[16px] font-bold text-slate-900">
                        {searchQuery ? 'Search Results' : 'Explore Health Insurance'}
                     </h2>
                     {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="text-[11px] font-bold text-blue-600">
                           Clear Search
                        </button>
                     )}
                  </div>

                  {filteredInsurance.length === 0 ? (
                     <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm">
                        <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-[15px] font-bold text-slate-800 mb-1">No insurance plans found</h3>
                        <p className="text-[12px] text-slate-500">Try searching for another insurance company or plan.</p>
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredInsurance.map((item) => (
                           <div key={item.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col h-full relative">
                              <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 shadow-sm">
                                 <CheckCircle className="w-3 h-3" />
                                 <span className="text-[9px] font-bold">Verified & Assured</span>
                              </div>
                              <div className="flex items-start gap-3 mb-4">
                                 <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                    <Building className="w-6 h-6" />
                                 </div>
                                 <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                       <h3 className="font-bold text-slate-800 text-[14px] leading-tight">{item.companyName}</h3>
                                       <span className="bg-slate-100 text-slate-600 text-[9px] px-2 py-0.5 rounded-full font-bold">{item.category}</span>
                                    </div>
                                    <p className="text-[12px] text-slate-500 mt-0.5 font-medium">{item.planName}</p>
                                 </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 mb-4">
                                 <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                                    <p className="text-[10px] text-slate-500 font-medium mb-0.5">Coverage</p>
                                    <p className="text-[13px] font-bold text-slate-800">{item.coverage}</p>
                                 </div>
                                 <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                                    <p className="text-[10px] text-slate-500 font-medium mb-0.5">Settlement Ratio</p>
                                    <p className="text-[13px] font-bold text-emerald-600">{item.claimSettlementRatio || 'Not available'}</p>
                                 </div>
                              </div>

                              <div className="mb-5 flex-1">
                                 <p className="text-[11px] font-bold text-slate-800 mb-2">Key Benefits:</p>
                                 <ul className="space-y-1.5">
                                    {item.benefits.map((benefit, i) => (
                                       <li key={i} className="flex items-start gap-1.5">
                                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                          <span className="text-[11px] text-slate-600 leading-snug">{benefit}</span>
                                       </li>
                                    ))}
                                 </ul>
                              </div>

                              <div className="mt-auto flex items-center justify-between gap-2">
                                 <button
                                    onClick={() => {
                                       setSelectedInsurance(item);
                                       setViewState('PLAN_DETAILS');
                                       setUploadedDocs({});
                                       setDocError('');
                                       setApplicant({
                                          fullName: '', dob: '', gender: 'Male', mobile: '', email: '', address: '', nominee: ''
                                       });
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 bg-white text-[#0055ff] border-[1.5px] border-[#0055ff]/20 py-2.5 rounded-xl text-[12px] font-bold hover:bg-blue-50 transition-colors"
                                 >
                                    View Details
                                 </button>
                                 <button
                                    onClick={() => {
                                       setSelectedInsurance(item);
                                       setViewState('DOCUMENTS');
                                       setUploadedDocs({});
                                       setDocError('');
                                       setApplicant({
                                          fullName: '', dob: '', gender: 'Male', mobile: '', email: '', address: '', nominee: ''
                                       });
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 bg-[#0055ff] text-white py-2.5 rounded-xl text-[12px] font-bold hover:bg-blue-600 transition-colors shadow-md shadow-blue-500/20"
                                 >
                                    Apply Now
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </section>

            </div>
         </div>

         {/* Insurance Details Modal */}
         {selectedInsurance && viewState === 'PLAN_DETAILS' && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center">
               <div className="bg-white relative w-full sm:w-[500px] h-[85vh] sm:h-[80vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 shadow-2xl">
                  <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white z-10 shrink-0">
                     <h2 className="font-bold text-[15px] text-slate-800">Insurance Details</h2>
                     <button onClick={() => { setSelectedInsurance(null); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                        <X className="w-4 h-4" />
                     </button>
                  </div>

                  <div className="p-5 overflow-y-auto flex-1 pb-32">
                     <div className="animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-4 mb-6">
                           <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                              <Building className="w-8 h-8" />
                           </div>
                           <div>
                              <h3 className="font-black text-slate-900 text-[18px]">{selectedInsurance.companyName}</h3>
                              <p className="text-[13px] text-slate-500 font-medium">{selectedInsurance.planName}</p>
                           </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6">
                           <h4 className="text-[13px] font-bold text-slate-900 mb-3 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              Insurance Overview
                           </h4>
                           <div className="space-y-3">
                              <div className="flex justify-between">
                                 <span className="text-[12px] text-slate-500">Category</span>
                                 <span className="text-[12px] font-bold text-slate-800">{selectedInsurance.category}</span>
                              </div>
                              <div className="flex justify-between">
                                 <span className="text-[12px] text-slate-500">Coverage</span>
                                 <span className="text-[12px] font-bold text-slate-800">{selectedInsurance.coverage}</span>
                              </div>
                           </div>
                        </div>

                        <div className="mb-6">
                           <h4 className="text-[14px] font-bold text-slate-900 mb-3">Key Benefits</h4>
                           <ul className="space-y-2.5">
                              {selectedInsurance.benefits.map((benefit: string, i: number) => (
                                 <li key={i} className="flex items-start gap-2 bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span className="text-[12px] text-slate-700 font-medium">{benefit}</span>
                                 </li>
                              ))}
                           </ul>
                        </div>

                        <div className="bg-[#fffbeb] rounded-2xl p-4 border border-[#fde68a] mb-6">
                           <h4 className="text-[13px] font-bold text-amber-900 mb-2 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-600" />
                              Claim Information
                           </h4>
                           <div className="grid grid-cols-2 gap-4 mt-3">
                              <div>
                                 <p className="text-[11px] text-amber-700/80 mb-0.5 font-medium">Settlement Ratio</p>
                                 <p className="text-[14px] font-bold text-amber-900">{selectedInsurance.claimSettlementRatio || 'N/A'}</p>
                              </div>
                              <div>
                                 <p className="text-[11px] text-amber-700/80 mb-0.5 font-medium">Network Hospitals</p>
                                 <p className="text-[14px] font-bold text-amber-900">{selectedInsurance.networkHospitals || 'N/A'}</p>
                              </div>
                           </div>
                        </div>

                        <div className="mb-4">
                           <h4 className="text-[14px] font-bold text-slate-900 mb-2">Important Information</h4>
                           <p className="text-[11px] text-slate-500 leading-relaxed">
                              Coverage details, eligibility, waiting periods, and exclusions are subject to the specific policy terms and conditions. Please refer to the official policy document for full details before purchasing.
                           </p>
                        </div>
                     </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 flex gap-3 pb-safe z-20">
                     <button className="flex-1 py-3.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-[13px] hover:bg-slate-50 transition-colors">
                        Check Eligibility
                     </button>
                     <button onClick={() => setViewState('DOCUMENTS')} className="flex-1 py-3.5 rounded-xl bg-[#0055ff] text-white font-bold text-[13px] hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30">
                        Apply Now
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default InsuranceList;

