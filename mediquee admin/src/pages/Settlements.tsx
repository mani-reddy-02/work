import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { formatCurrency } from '../utils/finance';
import { FileText, Filter } from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import { financeService } from '../services/financeService';

const Settlements: React.FC = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [settlements, setSettlements] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await financeService.getSettlements(token);
        if (res.success && Array.isArray(res.data)) {
          setSettlements(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const filteredSettlements = settlements.filter(s => 
    s.id.toLowerCase().includes(search.toLowerCase()) || 
    s.hospitalName.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<any>[] = [
    {
      header: 'Settlement ID',
      accessor: (s) => (
        <button 
          onClick={() => navigate(`/admin/settlements/${s.id}`)}
          className="font-medium text-blue-600 hover:underline text-left"
        >
          {s.id}
        </button>
      ),
    },
    {
      header: 'Hospital',
      accessor: (s) => (
        <button 
          onClick={() => navigate(`/admin/hospitals/${s.hospitalId}`)}
          className="font-medium text-slate-900 hover:text-blue-600"
        >
          {s.hospitalName}
        </button>
      ),
    },
    {
      header: 'Period',
      accessor: (s) => <span className="text-slate-900">{s.period}</span>,
    },
    {
      header: 'Transactions',
      accessor: (s) => <span className="text-slate-600">{s.transactionCount}</span>,
    },
    {
      header: 'Gross Revenue',
      accessor: (s) => <span className="text-slate-900">{formatCurrency(s.grossRevenue)}</span>,
    },
    {
      header: 'Settlement Amount',
      accessor: (s) => <span className="font-medium text-emerald-600">{formatCurrency(s.hospitalAmount)}</span>,
    },
    {
      header: 'Status',
      accessor: (s) => <StatusBadge status={s.status} />
    }
  ];

  if (loading) return <div className="p-6">Loading settlements...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Settlements</h2>
          <p className="text-sm text-slate-500">Manage money payable and paid to hospitals for their services.</p>
        </div>
      </div>

      {settlements.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <p className="text-slate-500">No settlements found.</p>
        </div>
      ) : (
        <DataTable 
          data={filteredSettlements}
          columns={columns}
          keyExtractor={(s) => s.id}
          searchPlaceholder="Search by ID or Hospital..."
          onSearch={setSearch}
        />
      )}
    </div>
  );
};

export default Settlements;
