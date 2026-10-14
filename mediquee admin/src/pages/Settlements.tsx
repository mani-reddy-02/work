import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { formatCurrency } from '../utils/finance';
import { 
  Building2, 
  FlaskConical, 
  RefreshCw, 
  ArrowUpRight, 
  History, 
  Calendar,
  FileCheck2,
  ExternalLink,
  PlusCircle,
  FileText
} from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import { settlementService, SettlementFilterParams, PayoutFilterParams } from '../services/settlementService';

type ActiveTab = 'settlements' | 'payouts';

const Settlements: React.FC = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ActiveTab>('settlements');
  
  // Settlements state
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateMsg, setGenerateMsg] = useState<string | null>(null);

  // Settlement filters
  const [search, setSearch] = useState('');
  const [partnerTypeFilter, setPartnerTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalSettlements, setTotalSettlements] = useState(0);
  const [summary, setSummary] = useState({ totalGross: 0, totalCommission: 0, totalPayable: 0, totalPaid: 0 });
  const filterRef = useRef<HTMLDivElement>(null);
  const pageSize = 20;

  // Payout History state
  const [payouts, setPayouts] = useState<any[]>([]);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutSearch, setPayoutSearch] = useState('');
  const [payoutPartnerType, setPayoutPartnerType] = useState('all');
  const [payoutStartDate, setPayoutStartDate] = useState('');
  const [payoutEndDate, setPayoutEndDate] = useState('');
  const [payoutPage, setPayoutPage] = useState(1);
  const [totalPayouts, setTotalPayouts] = useState(0);
  const [showPayoutFilters, setShowPayoutFilters] = useState(false);
  const payoutFilterRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
      if (payoutFilterRef.current && !payoutFilterRef.current.contains(e.target as Node)) {
        setShowPayoutFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch settlements
  const fetchSettlements = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const params: SettlementFilterParams = {
        search: search.trim() || undefined,
        partnerType: partnerTypeFilter !== 'all' ? partnerTypeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit: pageSize
      };
      const res = await settlementService.getSettlements(token, params);
      if (res.success && Array.isArray(res.data)) {
        setSettlements(res.data);
        setTotalSettlements(res.pagination?.total || res.data.length);
        if (res.summary) setSummary(res.summary);
      }
    } catch (e) {
      console.error('Failed to fetch settlements:', e);
    } finally {
      setLoading(false);
    }
  }, [token, search, partnerTypeFilter, statusFilter, page]);

  // Fetch payout history
  const fetchPayoutHistory = useCallback(async () => {
    if (!token) return;
    try {
      setPayoutLoading(true);
      const params: PayoutFilterParams = {
        search: payoutSearch.trim() || undefined,
        partnerType: payoutPartnerType !== 'all' ? payoutPartnerType : undefined,
        startDate: payoutStartDate || undefined,
        endDate: payoutEndDate || undefined,
        page: payoutPage,
        limit: pageSize
      };
      const res = await settlementService.getPayoutHistory(token, params);
      if (res.success && Array.isArray(res.data)) {
        setPayouts(res.data);
        setTotalPayouts(res.pagination?.total || res.data.length);
      }
    } catch (e) {
      console.error('Failed to fetch payout history:', e);
    } finally {
      setPayoutLoading(false);
    }
  }, [token, payoutSearch, payoutPartnerType, payoutStartDate, payoutEndDate, payoutPage]);

  useEffect(() => {
    if (activeTab === 'settlements') {
      fetchSettlements();
    } else {
      fetchPayoutHistory();
    }
  }, [activeTab, fetchSettlements, fetchPayoutHistory]);

  // Trigger Weekly Settlement Generation
  const handleGenerateWeekly = async () => {
    if (!token || isGenerating) return;
    try {
      setIsGenerating(true);
      setGenerateMsg(null);
      const res = await settlementService.generateWeeklySettlements(token);
      if (res.success) {
        setGenerateMsg(res.message || 'Weekly settlement generation completed successfully.');
        await fetchSettlements();
      } else {
        setGenerateMsg(res.message || 'Failed to generate weekly settlements.');
      }
    } catch (err: any) {
      setGenerateMsg(err?.message || 'Error occurred during generation.');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerateMsg(null), 5000);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setPartnerTypeFilter('all');
    setStatusFilter('all');
    setPage(1);
    setShowFilters(false);
  };

  const handleClearPayoutFilters = () => {
    setPayoutSearch('');
    setPayoutPartnerType('all');
    setPayoutStartDate('');
    setPayoutEndDate('');
    setPayoutPage(1);
    setShowPayoutFilters(false);
  };

  const hasActiveFilters = search.trim().length > 0 || partnerTypeFilter !== 'all' || statusFilter !== 'all';
  const hasActivePayoutFilters = payoutSearch.trim().length > 0 || payoutPartnerType !== 'all' || payoutStartDate !== '' || payoutEndDate !== '';

  // Columns for Settlements
  const settlementColumns: Column<any>[] = [
    {
      header: 'S.No',
      accessor: (s) => <span className="font-medium text-slate-500 text-xs">{s.sNo}</span>,
      className: 'w-14 text-center'
    },
    {
      header: 'Settlement ID',
      accessor: (s) => (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/admin/settlements/${s.id}`);
          }}
          className="font-mono text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 text-left"
        >
          {s.settlementNumber || s.id}
          <ArrowUpRight size={13} className="opacity-70" />
        </button>
      ),
    },
    {
      header: 'Partner',
      accessor: (s) => (
        <div className="flex flex-col">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/hospitals/${s.partnerId}`);
            }}
            className="font-medium text-slate-900 hover:text-blue-600 text-left text-sm truncate max-w-[200px]"
          >
            {s.partnerName}
          </button>
          <span className="text-[11px] text-slate-400">ID: {s.partnerId.substring(0, 8)}</span>
        </div>
      ),
    },
    {
      header: 'Partner Type',
      accessor: (s) => {
        const isLab = s.partnerType === 'Lab' || s.rawPartnerType === 'LABORATORY';
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isLab ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {isLab ? <FlaskConical size={12} /> : <Building2 size={12} />}
            {isLab ? 'Lab' : 'Hospital'}
          </span>
        );
      }
    },
    {
      header: 'Settlement Period',
      accessor: (s) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <Calendar size={13} className="text-slate-400 flex-shrink-0" />
          <span>{s.period}</span>
        </div>
      ),
    },
    {
      header: 'Eligible Txns',
      accessor: (s) => (
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
          {s.eligibleTransactions ?? s.transactionCount}
        </span>
      ),
      className: 'text-center'
    },
    {
      header: 'Gross Revenue',
      accessor: (s) => <span className="text-slate-800 text-sm font-medium">{formatCurrency(s.grossRevenue)}</span>,
    },
    {
      header: 'Admin Comm.',
      accessor: (s) => (
        <div className="flex flex-col">
          <span className="text-slate-600 text-xs font-medium">{formatCurrency(s.adminCommission)}</span>
          <span className="text-[10px] text-slate-400">{s.adminCommissionRate}% cut</span>
        </div>
      ),
    },
    {
      header: 'Adjustments',
      accessor: (s) => <span className="text-slate-500 text-xs">{formatCurrency(s.adjustments || 0)}</span>,
    },
    {
      header: 'Payable Amount',
      accessor: (s) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-emerald-700">{formatCurrency(s.payableAmount)}</span>
          {s.status === 'PAID' && (
            <span className="text-[10px] text-emerald-600 font-medium">Paid: {formatCurrency(s.paidAmount || s.payableAmount)}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (s) => <StatusBadge status={s.status} />
    },
    {
      header: 'Actions',
      accessor: (s) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/admin/settlements/${s.id}`);
          }}
          className="px-3 py-1 bg-slate-50 hover:bg-blue-50 text-blue-600 border border-slate-200 hover:border-blue-200 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1"
        >
          View Details
          <ArrowUpRight size={12} />
        </button>
      ),
      className: 'text-right'
    }
  ];

  // Columns for Payout History
  const payoutColumns: Column<any>[] = [
    {
      header: 'S.No',
      accessor: (p) => <span className="font-medium text-slate-500 text-xs">{p.sNo}</span>,
      className: 'w-14 text-center'
    },
    {
      header: 'Payout ID',
      accessor: (p) => (
        <span className="font-mono text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
          {p.payoutId}
        </span>
      ),
    },
    {
      header: 'Settlement ID',
      accessor: (p) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/admin/settlements/${p.rawSettlementId}`);
          }}
          className="font-mono text-xs text-blue-600 hover:underline flex items-center gap-1"
        >
          {p.settlementId}
          <ExternalLink size={11} />
        </button>
      ),
    },
    {
      header: 'Partner',
      accessor: (p) => (
        <span className="font-medium text-slate-900 text-sm">{p.partner}</span>
      ),
    },
    {
      header: 'Partner Type',
      accessor: (p) => {
        const isLab = p.partnerType === 'Lab' || p.rawPartnerType === 'LABORATORY';
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isLab ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {isLab ? <FlaskConical size={12} /> : <Building2 size={12} />}
            {isLab ? 'Lab' : 'Hospital'}
          </span>
        );
      }
    },
    {
      header: 'Period',
      accessor: (p) => <span className="text-xs text-slate-600">{p.settlementPeriod}</span>,
    },
    {
      header: 'Amount Paid',
      accessor: (p) => <span className="text-sm font-bold text-emerald-700">{formatCurrency(p.amountPaid)}</span>,
    },
    {
      header: 'Payment Date/Time',
      accessor: (p) => (
        <span className="text-xs text-slate-700">
          {p.paymentDate ? new Date(p.paymentDate).toLocaleString() : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Transfer Reference (UTR)',
      accessor: (p) => (
        <span className="font-mono text-xs font-medium bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-800">
          {p.transferReference || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Proof Receipt',
      accessor: (p) => (
        p.paymentProofUrl ? (
          <a
            href={p.paymentProofUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
          >
            <FileCheck2 size={14} className="text-emerald-600" />
            View Proof
          </a>
        ) : (
          <span className="text-xs text-slate-400 italic">No file attached</span>
        )
      )
    },
    {
      header: 'Processed By',
      accessor: (p) => <span className="text-xs text-slate-600">{p.processedBy || 'Admin'}</span>,
    },
    {
      header: 'Status',
      accessor: (p) => <StatusBadge status={p.status || 'PAID'} />
    }
  ];

  return (
    <div className="space-y-6 relative">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Settlement Management & Payouts
          </h2>
          <p className="text-sm text-slate-500">
            Review weekly settlements, verify transaction breakdowns, perform external transfers, and record permanent payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateWeekly}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isGenerating ? "animate-spin" : ""} />
            {isGenerating ? "Processing Weekly Cycle..." : "Generate Weekly Settlements"}
          </button>
        </div>
      </div>

      {/* Notification banner on generate */}
      {generateMsg && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-sm flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <PlusCircle size={16} className="text-blue-600 flex-shrink-0" />
            <span>{generateMsg}</span>
          </div>
          <button onClick={() => setGenerateMsg(null)} className="text-blue-400 hover:text-blue-600 text-xs font-bold px-2">
            ✕
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Eligible Gross</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(summary.totalGross)}</p>
          <span className="text-[11px] text-slate-400">All recorded service transactions</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">MediQuee Platform Commission</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(summary.totalCommission)}</p>
          <span className="text-[11px] text-slate-400">Standard 20% platform share</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Partner Payable</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(summary.totalPayable)}</p>
          <span className="text-[11px] text-slate-400">Net hospital & lab shares</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Settled & Paid Out</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">{formatCurrency(summary.totalPaid)}</p>
          <span className="text-[11px] text-slate-400">Transferred with proof attached</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-8">
        <button
          onClick={() => setActiveTab('settlements')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'settlements'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText size={18} />
          Settlement Batches ({totalSettlements})
        </button>

        <button
          onClick={() => setActiveTab('payouts')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'payouts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History size={18} />
          Payout History ({totalPayouts})
        </button>
      </div>

      {/* Tab 1: Settlements View */}
      {activeTab === 'settlements' && (
        <div className="relative">
          {/* Popover Filter Menu */}
          {showFilters && (
            <div ref={filterRef} className="absolute right-0 top-14 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-900 text-sm">Filter Settlement Batches</h3>
                <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-600 text-xs">
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Partner Type</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                    value={partnerTypeFilter}
                    onChange={(e) => {
                      setPartnerTypeFilter(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">All Partners</option>
                    <option value="HOSPITAL">Hospital</option>
                    <option value="LABORATORY">Lab</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Settlement Status</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="APPROVED">Approved / Ready for Payout</option>
                    <option value="PENDING">Pending Review</option>
                    <option value="PAID">Paid / Completed</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-100 flex gap-2">
                  <button 
                    onClick={handleClearFilters}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                  >
                    Clear Filters
                  </button>
                  <button 
                    onClick={() => setShowFilters(false)}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          <DataTable 
            data={settlements}
            columns={settlementColumns}
            keyExtractor={(s) => s.id}
            searchPlaceholder="Search by Settlement ID, Partner, or Period..."
            searchValue={search}
            onSearch={(val) => {
              setSearch(val);
              setPage(1);
            }}
            onFilterClick={() => setShowFilters(!showFilters)}
            onRowClick={(s) => navigate(`/admin/settlements/${s.id}`)}
            pagination={{
              currentPage: page,
              totalPages: Math.max(1, Math.ceil(totalSettlements / pageSize)),
              totalResults: totalSettlements,
              pageSize,
              onPageChange: (p) => setPage(p)
            }}
            emptyMessage={
              loading ? "Loading settlements..." : (hasActiveFilters ? "No matching settlement records found." : "No settlements generated yet. Click 'Generate Weekly Settlements' to scan eligible transactions.")
            }
          />
        </div>
      )}

      {/* Tab 2: Permanent Payout History View */}
      {activeTab === 'payouts' && (
        <div className="relative">
          {showPayoutFilters && (
            <div ref={payoutFilterRef} className="absolute right-0 top-14 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-900 text-sm">Filter Payout History</h3>
                <button onClick={() => setShowPayoutFilters(false)} className="text-slate-400 hover:text-slate-600 text-xs">
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Partner Type</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2 focus:ring-blue-500"
                    value={payoutPartnerType}
                    onChange={(e) => {
                      setPayoutPartnerType(e.target.value);
                      setPayoutPage(1);
                    }}
                  >
                    <option value="all">All Partners</option>
                    <option value="HOSPITAL">Hospital</option>
                    <option value="LABORATORY">Lab</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">From Payment Date</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2"
                    value={payoutStartDate}
                    onChange={(e) => {
                      setPayoutStartDate(e.target.value);
                      setPayoutPage(1);
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">To Payment Date</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2"
                    value={payoutEndDate}
                    onChange={(e) => {
                      setPayoutEndDate(e.target.value);
                      setPayoutPage(1);
                    }}
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 flex gap-2">
                  <button 
                    onClick={handleClearPayoutFilters}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                  >
                    Clear Filters
                  </button>
                  <button 
                    onClick={() => setShowPayoutFilters(false)}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          <DataTable 
            data={payouts}
            columns={payoutColumns}
            keyExtractor={(p) => p.id}
            searchPlaceholder="Search by Payout ID, Settlement, Partner, or UTR..."
            searchValue={payoutSearch}
            onSearch={(val) => {
              setPayoutSearch(val);
              setPayoutPage(1);
            }}
            onFilterClick={() => setShowPayoutFilters(!showPayoutFilters)}
            onRowClick={(p) => navigate(`/admin/settlements/${p.rawSettlementId}`)}
            pagination={{
              currentPage: payoutPage,
              totalPages: Math.max(1, Math.ceil(totalPayouts / pageSize)),
              totalResults: totalPayouts,
              pageSize,
              onPageChange: (p) => setPayoutPage(p)
            }}
            emptyMessage={
              payoutLoading ? "Loading payout history..." : (hasActivePayoutFilters ? "No matching payout history records found." : "No payouts completed yet. Settle payable batches from the 'Settlement Batches' tab.")
            }
          />
        </div>
      )}
    </div>
  );
};

export default Settlements;
