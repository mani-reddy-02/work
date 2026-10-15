import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, Shield, Search, Activity, Users, HeartPulse, ExternalLink, RefreshCw, AlertCircle, Percent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export interface InsurancePlan {
  id: string;
  title: string;
  icon?: string | null;
  description: string;
  successRate: number;
  applicationUrl: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const InsuranceList: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [insurances, setInsurances] = useState<InsurancePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Horizontal scroll for "Why Health Insurance Matters"
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

  // Fetch Insurances from shared backend API
  const fetchInsurances = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/insurance`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setInsurances(json.data);
      } else {
        setError(json.message || 'Failed to fetch insurance options');
      }
    } catch (err) {
      console.error('Error fetching insurances:', err);
      setError('Unable to load insurance offerings. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsurances();
  }, []);

  // Filtered plans based on user search
  const filteredInsurance = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return insurances;
    return insurances.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  }, [searchQuery, insurances]);

  // Safe external URL handler for Apply button
  const handleApply = (item: InsurancePlan) => {
    const rawUrl = item.applicationUrl?.trim();
    if (!rawUrl) return;

    let targetUrl = rawUrl;
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    try {
      const parsed = new URL(targetUrl);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        window.open(parsed.href, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      console.error('Invalid insurance application URL:', e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0055ff] to-[#06b6d4] pt-4 pb-6 px-4 text-white rounded-b-3xl shrink-0">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Health Insurance</h1>
            <p className="text-[11px] text-blue-100 mt-1">
              Protect yourself and your family with top health insurance plans and cashless coverage.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md md:max-w-xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-12 pr-4 py-3 border-0 rounded-2xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-white/50 shadow-lg text-[13px]"
            placeholder="Search by insurance title or coverage details..."
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-6">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Why Health Insurance Matters (Educational Carousel) */}
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
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col items-center text-center shrink-0 snap-center min-w-[240px] max-w-[260px]">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-[13px] mb-1.5">Financial Protection</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Reduce the financial burden of unexpected hospitalization and medical treatments.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col items-center text-center shrink-0 snap-center min-w-[240px] max-w-[260px]">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                    <Activity className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-[13px] mb-1.5">Cashless Treatment</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Access cashless hospitalization at eligible network hospitals across India.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col items-center text-center shrink-0 snap-center min-w-[240px] max-w-[260px]">
                  <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mb-3">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-[13px] mb-1.5">Family Protection</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Comprehensive family floater policies to safeguard your parents, spouse, and children.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col items-center text-center shrink-0 snap-center min-w-[240px] max-w-[260px]">
                  <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-3">
                    <HeartPulse className="w-6 h-6 text-rose-600" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-[13px] mb-1.5">Better Healthcare Access</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Get pre and post-hospitalization care, day-care procedures, and annual health checkups.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Explore Health Insurance Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold text-slate-900">
                {searchQuery ? 'Search Results' : 'Explore Health Insurance Plans'}
              </h2>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
                >
                  Clear Search
                </button>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-xs">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                <h3 className="text-[14px] font-bold text-slate-800">Loading insurance options...</h3>
                <p className="text-[12px] text-slate-500 mt-1">Connecting to authoritative insurance records</p>
              </div>
            )}

            {/* Error State with Retry */}
            {!loading && error && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center shadow-xs">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2.5" />
                <h3 className="text-[15px] font-bold text-rose-900 mb-1">Failed to load insurance plans</h3>
                <p className="text-[12px] text-rose-700 max-w-sm mx-auto mb-4">{error}</p>
                <button
                  onClick={fetchInsurances}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredInsurance.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-7 h-7" />
                </div>
                <h3 className="text-[15px] font-bold text-slate-800 mb-1">
                  {searchQuery ? 'No matching insurance plans found' : 'No insurance plans available'}
                </h3>
                <p className="text-[12px] text-slate-500 max-w-xs mx-auto">
                  {searchQuery
                    ? `No plans matching "${searchQuery}". Please try another search term.`
                    : 'Check back soon. MediQuee is actively partnering with leading insurance providers.'}
                </p>
              </div>
            )}

            {/* Insurance Cards Grid */}
            {!loading && !error && filteredInsurance.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInsurance.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-200 transition-all"
                  >
                    <div>
                      {/* 1. Insurance Title */}
                      <h3 className="font-bold text-slate-900 text-[16px] leading-snug">
                        {item.title}
                      </h3>

                      {/* 2. Icon (only rendered if an icon was provided) */}
                      {item.icon ? (
                        <div className="mt-3 w-12 h-12 rounded-xl bg-blue-50/80 border border-blue-100/60 flex items-center justify-center p-2 overflow-hidden shadow-2xs">
                          <img
                            src={item.icon}
                            alt={item.title}
                            className="w-full h-full object-contain rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : null}

                      {/* 3. Success Rate formatted as a percentage */}
                      <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/80 shadow-2xs">
                        <Percent className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold tracking-tight">
                          Success Rate: {item.successRate}%
                        </span>
                      </div>

                      {/* 4. Description displayed below the success rate */}
                      <p className="mt-3 text-xs text-slate-600 leading-relaxed font-normal">
                        {item.description}
                      </p>
                    </div>

                    {/* 5. Apply button at the bottom */}
                    <div className="mt-5 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleApply(item)}
                        className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 transition-all"
                        aria-label={`Apply for ${item.title}`}
                      >
                        <span>Apply</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
};

export default InsuranceList;
