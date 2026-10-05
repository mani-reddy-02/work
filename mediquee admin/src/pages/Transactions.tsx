import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { formatCurrency } from '../utils/finance';
import { ArrowDownRight, ArrowUpRight, TrendingUp, Filter } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import { useAdminAuth } from '../contexts/AuthContext';
import { financeService } from '../services/financeService';

const Transactions: React.FC = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await financeService.getTransactions(token);
        if (res.success && Array.isArray(res.data)) {
          setTransactions(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const filteredTransactions = transactions.filter(t => 
    t.bookingId.toLowerCase().includes(search.toLowerCase()) || 
    t.patientName.toLowerCase().includes(search.toLowerCase()) ||
    t.hospitalName.toLowerCase().includes(search.toLowerCase()) ||
    t.service.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<any>[] = [
    {
      header: 'Transaction ID',
      accessor: (t) => (
        <div className="flex flex-col">
          <button 
            onClick={() => navigate(`/admin/transactions/${t.id}`)}
            className="font-medium text-blue-600 hover:underline text-left"
          >
            TX-{t.bookingId}
          </button>
          <span className="text-xs text-slate-500 ">{new Date(t.date).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      header: 'Patient',
      accessor: (t) => <span className="text-slate-900 font-medium">{t.patientName}</span>,
    },
    {
      header: 'Hospital & Service',
      accessor: (t) => (
        <div className="flex flex-col">
          <span className="text-slate-900 font-medium">{t.hospitalName}</span>
          <span className="text-xs text-slate-500 ">{t.service}</span>
        </div>
      ),
    },
    {
      header: 'Gross Amount',
      accessor: (t) => <span className="font-medium text-slate-900 ">{formatCurrency(t.grossAmount)}</span>,
    },
    {
      header: 'Hospital Share',
      accessor: (t) => (
        <div className="flex flex-col">
          <span className="font-medium text-emerald-600 flex items-center gap-1"><ArrowDownRight size={14} />{formatCurrency(t.hospitalAmount)}</span>
          <span className="text-[10px] text-slate-400">{t.hospitalSharePercentage}% Share</span>
        </div>
      ),
    },
    {
      header: 'MediQuee Commission',
      accessor: (t) => (
        <div className="flex flex-col">
          <span className="font-medium text-blue-600 flex items-center gap-1"><ArrowUpRight size={14} />{formatCurrency(t.mediqueeAmount)}</span>
          <span className="text-[10px] text-slate-400">{t.mediqueeCommissionPercentage}% Share</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (t) => <StatusBadge status={t.status} />
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Transactions</h2>
          <p className="text-sm text-slate-500">View individual financial records for all patient bookings and services.</p>
        </div>
      </div>

      <DataTable 
        data={filteredTransactions}
        columns={columns}
        keyExtractor={(t) => t.id}
        searchPlaceholder="Search by ID, Patient, Hospital, or Service..."
        onSearch={setSearch}
      />
    </div>
  );
};

export default Transactions;
