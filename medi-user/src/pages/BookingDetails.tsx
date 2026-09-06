import { ArrowLeft, Calendar, Clock, MapPin, UserSquare, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BookingDetails = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-slate-50">      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary pt-4 pb-20 px-4 text-white rounded-b-3xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Booking Details</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 -mt-14 flex-1 pb-8">
        <div className="max-w-md mx-auto space-y-4">
          
          {/* Doctor Profile Card */}
          <div className="bg-white p-5 rounded-2xl shadow-soft border border-slate-100 flex items-start gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
               <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150" alt="Dr. Ananya Reddy" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg">Dr. Ananya Reddy</h2>
              <p className="text-sm text-slate-500 font-medium">Gynecologist</p>
              <p className="text-xs text-slate-400 mt-0.5">MBBS, DGO, Fellowship</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-yellow-500 text-sm">★</span>
                <span className="text-sm font-medium text-slate-700">4.8</span>
                <span className="text-xs text-slate-400">(320 reviews)</span>
              </div>
            </div>
          </div>

          {/* Booking Info Card */}
          <div className="bg-white p-5 rounded-2xl shadow-soft border border-slate-100 space-y-5">
             <div className="flex gap-4 items-start">
               <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-primary">
                  <Calendar className="w-5 h-5" />
               </div>
               <div>
                 <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Date</p>
                 <p className="font-medium text-slate-800">20 May 2024</p>
               </div>
             </div>
             
             <div className="flex gap-4 items-start">
               <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-primary">
                  <Clock className="w-5 h-5" />
               </div>
               <div>
                 <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Time</p>
                 <p className="font-medium text-slate-800">11:00 AM</p>
               </div>
             </div>
             
             <div className="flex gap-4 items-start">
               <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-primary">
                  <MapPin className="w-5 h-5" />
               </div>
               <div>
                 <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Hospital</p>
                 <p className="font-medium text-slate-800">Sunshine Hospitals</p>
                 <p className="text-sm text-slate-500">Banjara Hills, Hyderabad</p>
               </div>
             </div>
             
             <div className="flex gap-4 items-start">
               <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-primary">
                  <UserSquare className="w-5 h-5" />
               </div>
               <div>
                 <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Consultation Type</p>
                 <p className="font-medium text-slate-800">In-Hospital Visit</p>
               </div>
             </div>
             
             <div className="flex gap-4 items-start">
               <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-primary">
                  <IndianRupee className="w-5 h-5" />
               </div>
               <div>
                 <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Fees</p>
                 <p className="font-bold text-slate-800">₹600</p>
               </div>
             </div>
          </div>

          <div className="pt-4 pb-2">
             <button className="w-full bg-primary text-white font-semibold py-4 rounded-full shadow-lg shadow-primary/30 hover:bg-blue-700 transition-colors">
               Confirm Booking
             </button>
             <p className="text-center text-xs text-slate-400 mt-4 font-medium">You will receive a confirmation SMS</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
