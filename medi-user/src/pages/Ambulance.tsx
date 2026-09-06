import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PhoneCall, Truck, Activity, CheckCircle2 } from 'lucide-react';


export default function Ambulance() {
  const navigate = useNavigate();
  const [requested, setRequested] = useState(false);

  if (requested) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-6 bg-slate-50 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Ambulance Requested</h2>
        <p className="text-slate-600 mb-6 max-w-sm">
          Your ambulance request has been submitted.
        </p>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm w-full max-w-sm mb-8 text-left">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-slate-500">Request ID</span>
            <span className="text-sm font-semibold text-slate-900">MQ-AMB-001</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Status</span>
            <span className="text-sm font-semibold text-green-600">Request Submitted</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
            View Request
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3.5 bg-slate-200 text-slate-800 font-semibold rounded-xl hover:bg-slate-300 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col min-h-[calc(100vh-64px)] md:px-4 md:py-6 bg-slate-50 md:bg-transparent">
      {/* Header */}
      <div className="bg-white sticky top-0 z-20 px-4 py-4 border-b border-slate-100 flex items-center shadow-sm md:rounded-t-2xl md:border">
        <button
          onClick={() => navigate(-1)}
          className="p-1 -ml-1 mr-3 text-slate-600 hover:text-primary transition-colors rounded-full hover:bg-slate-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Ambulance</h1>
      </div>

      <div className="flex-1 p-4 md:p-6 bg-slate-50 md:bg-white md:border-x md:border-b md:rounded-b-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
            <PhoneCall className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Emergency Ambulance</h2>
          <p className="text-slate-600 text-sm">Get emergency assistance quickly.</p>
        </div>

        <div className="space-y-4 max-w-md mx-auto">
          {/* Option 1 */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Basic Ambulance</h3>
                <ul className="text-sm text-slate-500 mt-1 list-disc list-inside space-y-0.5">
                  <li>Emergency transport</li>
                  <li>Available nearby</li>
                  <li>Estimated arrival: 10 min</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => setRequested(true)}
              className="w-full py-2.5 bg-primary/10 text-primary font-semibold rounded-xl hover:bg-primary hover:text-white transition-colors"
            >
              Request Ambulance
            </button>
          </div>

          {/* Option 2 */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Advanced Ambulance</h3>
                <ul className="text-sm text-slate-500 mt-1 list-disc list-inside space-y-0.5">
                  <li>Emergency equipment</li>
                  <li>Medical support</li>
                  <li>Estimated arrival: 15 min</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => setRequested(true)}
              className="w-full py-2.5 bg-red-100 text-red-600 font-semibold rounded-xl hover:bg-red-500 hover:text-white transition-colors"
            >
              Request Ambulance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
