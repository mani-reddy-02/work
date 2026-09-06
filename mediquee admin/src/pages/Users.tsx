import React, { useState } from 'react';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { User } from '../types';
import { mockUsers } from '../mock/data';
import { UserPlus, UserCheck, UserX, ShieldAlert } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(search.toLowerCase()) || 
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<User>[] = [
    {
      header: 'User',
      accessor: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">{user.name}</span>
            <span className="text-xs text-slate-500">{user.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: (user) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          {user.role.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (user) => <StatusBadge status={user.status} />,
    },
    {
      header: 'Joined',
      accessor: (user) => new Date(user.createdAt).toLocaleDateString(),
    },
    {
      header: 'Actions',
      accessor: (user) => (
        <div className="flex items-center gap-2">
          <button 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            onClick={(e) => {
              e.stopPropagation();
              // Open details mock
              alert(`Viewing details for ${user.name}`);
            }}
          >
            View
          </button>
        </div>
      ),
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h2>
          <p className="text-sm text-slate-500">Manage platform users, roles, and account status.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <UserPlus size={16} />
          Add User
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Users" value={users.length} icon={UserPlus} />
        <KpiCard title="Active Users" value={users.filter(u => u.status === 'ACTIVE').length} icon={UserCheck} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <KpiCard title="Inactive Users" value={users.filter(u => u.status === 'INACTIVE').length} icon={UserX} iconColor="text-rose-600" iconBg="bg-rose-50" />
        <KpiCard title="Admin Roles" value={users.filter(u => u.role.includes('ADMIN')).length} icon={ShieldAlert} iconColor="text-amber-600" iconBg="bg-amber-50" />
      </div>

      <DataTable 
        data={filteredUsers}
        columns={columns}
        keyExtractor={(user) => user.id}
        searchPlaceholder="Search users by name or email..."
        onSearch={setSearch}
        onRowClick={(user) => console.log('Row clicked', user)}
      />
    </div>
  );
};

export default Users;
