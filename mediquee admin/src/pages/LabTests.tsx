import React, { useState } from 'react';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { Transaction } from '../types';
import { mockTransactions } from '../mock/data';
import { formatCurrency } from '../utils/finance';
import { TestTube, CheckCircle, XCircle, Clock, IndianRupee } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const LabTests: React.FC = () => {
  const labTransactions = mockTransactions.filter(t => t.serviceType === 'LAB_TEST');
  const [search, setSearch] = useState('');

  const filteredTransactions = labTransactions.filter(t => 
    t.transactionId.toLowerCase().includes(search.toLowerCase()) || 
    t.customerName.toLowerCase().includes(search.toLowerCase()) ||
    t.providerName.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Transaction>[] = [
    {
      header: 'Order ID',
      accessor: (t) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900 dark:text-white">{t.relatedOrderId}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(t.date).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      header: 'Patient',
      accessor: (t) => <span className="text-slate-900 dark:text-slate-300">{t.customerName}</span>,
    },
    {
      header: 'Lab',
      accessor: (t) => <span className="text-slate-900 dark:text-slate-300 font-medium">{t.providerName}</span>,
    },
    {
      header: 'Gross Revenue',
      accessor: (t) => <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(t.grossAmount)}</span>,
    },
    {
      header: 'Lab Share (80%)',
      accessor: (t) => <span className="font-medium text-blue-600 dark:text-blue-400">{formatCurrency(t.providerShare)}</span>,
    },
    {
      header: 'Status',
      accessor: (t) => <StatusBadge status={t.paymentStatus} />,
    },
  ];

  const totalGross = labTransactions.reduce((acc, curr) => acc + curr.grossAmount, 0);
  const totalAdmin = labTransactions.reduce((acc, curr) => acc + curr.adminCommission, 0);
  const totalProvider = labTransactions.reduce((acc, curr) => acc + curr.providerShare, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Lab Tests Analytics</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Monitor diagnostic test orders and lab revenue.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Test Orders" value={labTransactions.length} icon={TestTube} />
        <KpiCard title="Gross Lab Revenue" value={formatCurrency(totalGross)} icon={IndianRupee} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-500/10" />
        <KpiCard title="Admin Commission" value={formatCurrency(totalAdmin)} icon={IndianRupee} iconColor="text-blue-600" iconBg="bg-blue-50 dark:bg-blue-500/10" />
        <KpiCard title="Lab Share" value={formatCurrency(totalProvider)} icon={IndianRupee} iconColor="text-purple-600" iconBg="bg-purple-50 dark:bg-purple-500/10" />
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Tests by Category</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { name: 'Blood', tests: 450 },
              { name: 'Urine', tests: 320 },
              { name: 'Imaging', tests: 180 },
              { name: 'Diabetes', tests: 290 },
              { name: 'Thyroid', tests: 150 },
            ]} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc' }}
              />
              <Bar dataKey="tests" name="Total Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <DataTable 
        data={filteredTransactions}
        columns={columns}
        keyExtractor={(t) => t.id}
        searchPlaceholder="Search by Order ID, Patient, or Lab..."
        onSearch={setSearch}
      />
    </div>
  );
};

export default LabTests;
