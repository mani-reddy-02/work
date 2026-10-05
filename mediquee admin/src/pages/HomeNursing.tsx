import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { Activity, Clock, CheckCircle, XCircle, HeartPulse } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import { useAdminAuth } from '../contexts/AuthContext';
import { nursingService } from '../services/nursingService';

const HomeNursing: React.FC = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return;
      try {
        const res = await nursingService.getHomeNursingBookings(token);
        if (res.success && Array.isArray(res.data)) {
          setOrders(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch home nursing orders:', err);
      }
    };
    fetchOrders();
  }, [token]);

  const kpis = {
    totalRequests: orders.length,
    pending: orders.filter(o => ['CONFIRMED'].includes(o.status)).length,
    assigned: orders.filter(o => o.status === 'ASSIGNED').length,
    inProgress: orders.filter(o => o.status === 'IN_PROGRESS').length,
    completed: orders.filter(o => o.status === 'COMPLETED').length,
  };

  const filteredOrders = orders.filter(o => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      o.id.toLowerCase().includes(searchLower) || 
      o.patientName.toLowerCase().includes(searchLower) ||
      o.serviceName.toLowerCase().includes(searchLower) ||
      o.nurseName.toLowerCase().includes(searchLower);
      
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const columns: Column<any>[] = [
    {
      header: 'Request ID',
      accessor: (o) => <span className="font-medium text-slate-900">{o.id}</span>,
    },
    {
      header: 'Patient',
      accessor: 'patientName',
    },
    {
      header: 'Service / Hospital',
      accessor: (o) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{o.serviceName}</span>
          <span className="text-xs text-slate-500">{o.hospitalName}</span>
        </div>
      ),
    },
    {
      header: 'Provider',
      accessor: (o) => <span className="text-sm text-slate-700">{o.nurseName}</span>,
    },
    {
      header: 'Schedule',
      accessor: (o) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-900">{o.date}</span>
          <span className="text-xs text-slate-500">{o.time} • {o.duration}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (o) => <StatusBadge status={o.status} />,
    },
    {
      header: 'Actions',
      accessor: (o) => (
        <button 
          onClick={() => navigate(`/admin/home-nursing/${o.rawId}`)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Manage Request
        </button>
      ),
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Home Nursing</h2>
          <p className="text-sm text-slate-500">Manage home nursing requests and provider assignments.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="Total Requests" value={kpis.totalRequests} icon={HeartPulse} />
        <KpiCard title="Pending" value={kpis.pending} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <KpiCard title="Assigned" value={kpis.assigned} icon={Activity} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <KpiCard title="In Progress" value={kpis.inProgress} icon={Activity} iconColor="text-indigo-600" iconBg="bg-indigo-50" />
        <KpiCard title="Completed" value={kpis.completed} icon={CheckCircle} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <select 
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="CONFIRMED">Confirmed / Pending</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <DataTable 
        data={filteredOrders}
        columns={columns}
        keyExtractor={(o) => o.id}
        searchPlaceholder="Search by ID, Patient, Service, or Nurse..."
        onSearch={setSearch}
      />
    </div>
  );
};

export default HomeNursing;
