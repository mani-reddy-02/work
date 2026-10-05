import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Calendar, DollarSign, Activity } from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import { financeService } from '../services/financeService';
import StatusBadge from '../components/ui/StatusBadge';
import { formatCurrency } from '../utils/finance';

const SettlementDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAdminAuth();
  const [settlement, setSettlement] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await financeService.getSettlements(token);
        if (res.success && Array.isArray(res.data)) {
          const found = res.data.find(s => s.id === id);
          setSettlement(found);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, token]);

  if (loading) return <div className="p-6">Loading settlement details...</div>;
  if (!settlement) return <div className="p-6 text-red-500">Settlement not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/admin/settlements')}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Settlement {settlement.id}
            </h2>
            <StatusBadge status={settlement.status} />
          </div>
          <p className="text-sm text-slate-500">
            Generated on {new Date(settlement.createdDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <DollarSign className="text-emerald-600" size={20} />
              Settlement Value
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-sm font-medium text-slate-500 mb-1">Gross Revenue</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(settlement.grossRevenue)}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-sm font-medium text-emerald-700 mb-1">Settlement Amount (Hospital Share)</p>
                <p className="text-2xl font-bold text-emerald-900">{formatCurrency(settlement.hospitalAmount)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Included Transactions</h3>
            <p className="text-sm text-slate-600">
              This settlement includes {settlement.transactionCount} transactions. 
            </p>
            <button 
              onClick={() => navigate('/admin/transactions')}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
            >
              View All Transactions
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Hospital</h3>
              <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                <Building2 size={20} />
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="font-medium text-slate-900">{settlement.hospitalName}</p>
              <button 
                onClick={() => navigate(`/admin/hospitals/${settlement.hospitalId}`)}
                className="text-sm text-blue-600 hover:underline inline-block"
              >
                View Hospital Account
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Period</h3>
              <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                <Calendar size={20} />
              </div>
            </div>
            
            <p className="font-medium text-slate-900">{settlement.period}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettlementDetails;
