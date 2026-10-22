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
    <div className="max-w-4xl mx-auto w-full flex flex-col min-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white sticky top-0 z-20 px-4 sm:px-6 py-4 border border-slate-100 flex items-center shadow-sm rounded-t-2xl">
        <button
          onClick={() => navigate(-1)}
          className="p-1 -ml-1 mr-3 text-slate-600 hover:text-primary transition-colors rounded-full hover:bg-slate-50 cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Ambulance</h1>
      </div>

      <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-white border-x border-b border-slate-100 rounded-b-2xl">
        <div className="mb-8 flex flex-col items-center text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <PhoneCall className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Emergency Ambulance</h2>
          <p className="text-slate-600 text-xs sm:text-sm">Get immediate emergency assistance dispatched to your location.</p>
          <a href="tel:8331045500" className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs sm:text-sm font-bold hover:bg-red-100 transition-colors cursor-pointer">
            <PhoneCall className="w-4 h-4" /> Call 24/7 Helpline: 8331045500
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
          {/* Option 1 */}
          <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">Basic Ambulance</h3>
                <ul className="text-xs sm:text-sm text-slate-500 mt-2 list-disc list-inside space-y-1">
                  <li>Emergency transport</li>
                  <li>Available nearby</li>
                  <li>Estimated arrival: 10 min</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => setRequested(true)}
              className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm cursor-pointer text-sm sm:text-base"
            >
              Request Ambulance
            </button>
          </div>

          {/* Option 2 */}
          <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">Advanced Ambulance</h3>
                <ul className="text-xs sm:text-sm text-slate-500 mt-2 list-disc list-inside space-y-1">
                  <li>Emergency ICU equipment</li>
                  <li>Paramedic medical support</li>
                  <li>Estimated arrival: 15 min</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => setRequested(true)}
              className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-sm cursor-pointer text-sm sm:text-base"
            >
              Request Ambulance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
