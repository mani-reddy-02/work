import React from 'react';

import { Video, Construction } from 'lucide-react';

const VideoConsultations = () => (
  <div className="p-12 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
      <Video size={32} />
    </div>
    <h2 className="text-2xl font-bold text-slate-900 mb-3">Video Consultations</h2>
    <p className="text-slate-500 max-w-md mb-8">
      The Video Consultations module is currently pending backend integration (SRS V2). Once the database models and video streaming infrastructure are configured, this dashboard will allow you to manage virtual appointments.
    </p>
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium border border-slate-200">
      <Construction size={16} />
      Module Under Development
    </div>
  </div>
);

const Transactions = () => <div className="p-6 bg-white  rounded-xl shadow-sm border border-slate-200 "><h2 className="text-xl font-bold ">Transactions Placeholder</h2></div>;
const Settlements = () => <div className="p-6 bg-white  rounded-xl shadow-sm border border-slate-200 "><h2 className="text-xl font-bold ">Settlements Placeholder</h2></div>;
const ActivityLog = () => <div className="p-6 bg-white  rounded-xl shadow-sm border border-slate-200 "><h2 className="text-xl font-bold ">Activity Log Placeholder</h2></div>;

export {
  VideoConsultations,
  Transactions,
  Settlements,
  ActivityLog
};
