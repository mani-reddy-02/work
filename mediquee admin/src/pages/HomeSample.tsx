import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { Activity, Clock, CheckCircle, XCircle, Home, MapPin } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import { useAdminAuth } from '../contexts/AuthContext';
import { labService } from '../services/labService';

const HomeSample: React.FC = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return;
      try {
        const res = await labService.getLabBookings(token);
        if (res.success && Array.isArray(res.data)) {
          // Filter only home collection orders
          const homeOrders = res.data.filter((b: any) => b.bookingType === 'HOME_COLLECTION');
          setOrders(homeOrders);
        }
      } catch (err) {
        console.error('Failed to fetch home sample orders:', err);
      }
    };
    fetchOrders();
  }, [token]);

  const kpis = {
    totalOrders: orders.length,
    pending: orders.filter(o => ['REQUESTED', 'ASSIGNED'].includes(o.status)).length,
    inProgress: orders.filter(o => ['SAMPLE_COLLECTED', 'IN_LAB_PROCESSING'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'REPORT_READY').length,
    cancelled: orders.filter(o => o.status === 'CANCELLED').length,
  };

  const filteredOrders = orders.filter(o => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      o.id.toLowerCase().includes(searchLower) || 
      o.patientName.toLowerCase().includes(searchLower) ||
      o.hospitalName.toLowerCase().includes(searchLower) ||
      (o.testNames && o.testNames.toLowerCase().includes(searchLower));
      
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const columns: Column<any>[] = [
    {
      header: 'Order ID',
      accessor: (o) => <span className="font-medium text-slate-900">{o.id}</span>,
    },
    {
      header: 'Tests',
      accessor: (o) => (
        <div className="flex flex-col max-w-xs">
          <span className="font-medium text-slate-900 truncate" title={o.testNames}>{o.testNames || 'N/A'}</span>
          <span className="text-xs text-slate-500">{o.testCount} tests</span>
        </div>
      ),
    },
    {
      header: 'Patient',
      accessor: 'patientName',
    },
    {
      header: 'Lab Details',
      accessor: (o) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{o.hospitalName}</span>
          <span className="text-xs text-blue-600 flex items-center gap-1">
            <MapPin size={12} />
            Home Collection
          </span>
        </div>
      ),
    },
    {
      header: 'Price',
      accessor: (o) => <span className="text-sm font-medium text-slate-900">₹{o.totalAmount}</span>,
    },
    {
      header: 'Date',
      accessor: (o) => <span className="text-sm text-slate-700">{o.date}</span>,
    },
    {
      header: 'Status',
      accessor: (o) => <StatusBadge status={o.status} />,
    },
    {
      header: 'Actions',
      accessor: (o) => (
        <button 
          onClick={() => navigate(`/admin/lab-bookings/${o.rawId}`)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View Order
        </button>
      ),
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Home Sample Collection</h2>
          <p className="text-sm text-slate-500">Manage lab test bookings that require home sample pickup.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="Total Orders" value={kpis.totalOrders} icon={Home} />
        <KpiCard title="Pending Pickup" value={kpis.pending} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <KpiCard title="In Progress" value={kpis.inProgress} icon={Activity} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <KpiCard title="Completed" value={kpis.completed} icon={CheckCircle} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <KpiCard title="Cancelled" value={kpis.cancelled} icon={XCircle} iconColor="text-rose-600" iconBg="bg-rose-50" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <select 
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="REQUESTED">Requested</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="SAMPLE_COLLECTED">Sample Collected</option>
          <option value="IN_LAB_PROCESSING">In Lab Processing</option>
          <option value="REPORT_READY">Report Ready</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <DataTable 
        data={filteredOrders}
        columns={columns}
        keyExtractor={(o) => o.id}
        searchPlaceholder="Search by ID, Test, Patient, or Lab..."
        onSearch={setSearch}
      />
    </div>
  );
};

export default HomeSample;
