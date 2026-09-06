import React, { useState } from 'react';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { Transaction } from '../types';
import { mockTransactions } from '../mock/data';
import { formatCurrency } from '../utils/finance';
import { ArrowDownRight, ArrowUpRight, TrendingUp, Filter } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';

const Transactions: React.FC = () => {
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [search, setSearch] = useState('');

  const filteredTransactions = transactions.filter(t => 
    t.transactionId.toLowerCase().includes(search.toLowerCase()) || 
    t.customerName.toLowerCase().includes(search.toLowerCase()) ||
    t.providerName.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Transaction>[] = [
    {
      header: 'Transaction ID',
      accessor: (t) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900 dark:text-white">{t.transactionId}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(t.date).toLocaleString()}</span>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: (t) => <span className="text-slate-900 dark:text-slate-300">{t.customerName}</span>,
    },
    {
      header: 'Provider',
      accessor: (t) => (
        <div className="flex flex-col">
          <span className="text-slate-900 dark:text-slate-300">{t.providerName}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{t.serviceType.replace('_', ' ')}</span>
        </div>
      ),
    },
    {
      header: 'Gross Revenue',
      accessor: (t) => <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(t.grossAmount)}</span>,
    },
    {
      header: 'Admin (20%)',
      accessor: (t) => <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><ArrowUpRight size={14} />{formatCurrency(t.adminCommission)}</span>,
    },
    {
      header: 'Provider (80%)',
      accessor: (t) => <span className="font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1"><ArrowDownRight size={14} />{formatCurrency(t.providerShare)}</span>,
    },
    {
      header: 'Status',
      accessor: (t) => (
        <div className="flex flex-col gap-1">
          <StatusBadge status={t.paymentStatus} />
          <StatusBadge status={t.settlementStatus} />
        </div>
      ),
    }
  ];

  const totalGross = transactions.reduce((acc, curr) => acc + curr.grossAmount, 0);
  const totalAdmin = transactions.reduce((acc, curr) => acc + curr.adminCommission, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Master Financial Ledger</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track all platform transactions, commissions, and settlements.</p>
        </div>
        <button className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Filter size={16} />
          Advanced Filters
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Total Filtered Gross" value={formatCurrency(totalGross)} icon={TrendingUp} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-500/10" />
        <KpiCard title="Total Admin Commission" value={formatCurrency(totalAdmin)} icon={TrendingUp} iconColor="text-blue-600" iconBg="bg-blue-50 dark:bg-blue-500/10" />
        <KpiCard title="Transaction Count" value={filteredTransactions.length} icon={TrendingUp} iconColor="text-purple-600" iconBg="bg-purple-50 dark:bg-purple-500/10" />
      </div>

      <DataTable 
        data={filteredTransactions}
        columns={columns}
        keyExtractor={(t) => t.id}
        searchPlaceholder="Search by ID, Customer, or Provider..."
        onSearch={setSearch}
      />
    </div>
  );
};

export default Transactions;
