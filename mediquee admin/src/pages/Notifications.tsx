import React from 'react';
import { Bell, CheckCircle } from 'lucide-react';

const Notifications: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h2>
          <p className="text-sm text-slate-500">System alerts and administrative notifications.</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <CheckCircle size={16} />
          Mark all as read
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100">
        {[1, 2, 3, 4, 5].map((_, i) => (
          <div key={i} className={`p-4 flex gap-4 hover:bg-slate-50 transition-colors ${i < 2 ? 'bg-blue-50/30' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${i < 2 ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
              <Bell size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900">New Hospital Registration Pending</p>
              <p className="text-sm text-slate-500 mt-0.5">City Care Clinic has submitted registration documents for review.</p>
              <p className="text-xs text-slate-400 mt-2">2 hours ago</p>
            </div>
            {i < 2 && (
              <div className="shrink-0 flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
