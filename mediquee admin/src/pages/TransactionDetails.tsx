import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User, Receipt, CheckCircle, Clock } from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import { financeService } from '../services/financeService';
import StatusBadge from '../components/ui/StatusBadge';
import { formatCurrency } from '../utils/finance';

const TransactionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAdminAuth();
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTx = async () => {
      if (!token || !id) return;
      try {
        setLoading(true);
        const res = await financeService.getTransactionById(id, token);
        if (res.success) {
          setTransaction(res.data);
        } else {
          setError(res.message || 'Transaction not found');
        }
      } catch (err) {
        setError('Error loading transaction');
      } finally {
        setLoading(false);
      }
    };
    fetchTx();
  }, [id, token]);

  if (loading) return <div className="p-6">Loading transaction...</div>;
  if (error || !transaction) return <div className="p-6 text-red-500">{error || 'Not found'}</div>;

  const grossAmount = transaction.fee || transaction.totalAmount || 0;
  const hospitalSharePercentage = transaction.hospitalSharePercentage || 80;
  const mediqueeCommissionPercentage = transaction.mediqueeCommissionPercentage || 20;
  const hospitalAmount = transaction.hospitalAmount || (grossAmount * 0.8);
  const mediqueeAmount = transaction.mediqueeAmount || (grossAmount * 0.2);
  const bookingId = transaction.bookingId || transaction.bookingNumber || transaction.id.substring(0, 8).toUpperCase();
  const patient = transaction.patient || transaction.user;
  const hospitalName = transaction.hospital?.name || 'Unknown Hospital';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/admin/transactions')}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Transaction TX-{bookingId}
            </h2>
            <StatusBadge status={transaction.status} />
          </div>
          <p className="text-sm text-slate-500">
            Recorded on {new Date(transaction.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Receipt className="text-blue-600" size={20} />
              Financial Split
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-sm font-medium text-slate-500 mb-1">Gross Amount</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(grossAmount)}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-sm font-medium text-emerald-700 mb-1">Hospital Share ({hospitalSharePercentage}%)</p>
                <p className="text-2xl font-bold text-emerald-900">{formatCurrency(hospitalAmount)}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-sm font-medium text-blue-700 mb-1">MediQuee ({mediqueeCommissionPercentage}%)</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(mediqueeAmount)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <Clock size={16} className="text-slate-400" />
              The financial split is permanently locked for this transaction. Future changes to {hospitalName}'s share will not affect this record.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Hospital Details</h3>
                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                  <Building2 size={20} />
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="font-medium text-slate-900">{hospitalName}</p>
                {transaction.hospital?.city && <p className="text-sm text-slate-600">{transaction.hospital.city}</p>}
                
                {transaction.hospital && (
                  <button 
                    onClick={() => navigate(`/admin/hospitals/${transaction.hospital.id}`)}
                    className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                  >
                    View Hospital Account
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Patient Details</h3>
                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                  <User size={20} />
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="font-medium text-slate-900">{transaction.patientName || patient?.name || 'Unknown Patient'}</p>
                
                {patient && (
                  <button 
                    onClick={() => navigate(`/admin/patients/${patient.id}`)}
                    className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                  >
                    View Patient Account
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Service Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Service Type</p>
                <p className="font-medium text-slate-900">{transaction.type}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Booking ID</p>
                <p className="font-medium text-slate-900">{bookingId}</p>
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                <button 
                  onClick={() => {
                    if (transaction.type === 'OP Booking') navigate(`/admin/appointments/${transaction.id}`);
                    else if (transaction.type === 'Home Nursing') navigate(`/admin/home-nursing/${transaction.id}`);
                    else navigate(`/admin/lab-bookings/${transaction.id}`);
                  }}
                  className="w-full py-2 bg-blue-50 text-blue-600 font-medium text-sm rounded-lg hover:bg-blue-100 transition-colors"
                >
                  View Booking Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetails;
