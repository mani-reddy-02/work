import { ArrowLeft, Calendar, MapPin, Users, HeartPulse, Send } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useState } from "react"

export function BookMedicalCamp() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-[calc(100vh-80px)] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-[18px] font-bold text-gray-900">Book Medical Camp</h1>
      </div>

      <div className="p-4 flex flex-col flex-1">
        
        {/* Banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white mb-6 shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <HeartPulse className="w-32 h-32 -mt-4 -mr-4" />
          </div>
          <h2 className="text-xl font-bold mb-2 relative z-10">Host a Community Camp</h2>
          <p className="text-indigo-100 text-sm leading-relaxed relative z-10">
            Let MediQuee handle the logistics while you focus on providing care to those who need it most.
          </p>
        </motion.div>

        {isSubmitted ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100 flex-1">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Request Received!</h3>
            <p className="text-gray-500 mb-6 text-sm">
              Our team will contact you shortly to confirm the dates and logistical details for your medical camp.
            </p>
            <button onClick={() => navigate(-1)} className="bg-indigo-600 text-white font-semibold py-3 px-8 rounded-xl shadow-md shadow-indigo-200">
              Go Back
            </button>
          </motion.div>
        ) : (
          <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
            
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
              <h3 className="font-bold text-gray-800 border-b border-gray-50 pb-2">Camp Details</h3>
              
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Location / Village / Area</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <input type="text" required placeholder="e.g. Community Hall, Andheri East" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Expected Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <input type="date" required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Expected Footfall</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <select required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none">
                    <option value="">Select expected crowd</option>
                    <option value="50-100">50 - 100 people</option>
                    <option value="100-300">100 - 300 people</option>
                    <option value="300-500">300 - 500 people</option>
                    <option value="500+">500+ people</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Target Speciality (Optional)</label>
                <input type="text" placeholder="e.g. Eye Camp, Cardiac checkup" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" />
              </div>
            </div>

            <div className="mt-auto pt-6">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white font-bold rounded-xl py-4 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 active:scale-[0.98] transition-all disabled:opacity-70"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Submit Request <Send className="w-5 h-5" /></>
                )}
              </button>
            </div>
            
          </motion.form>
        )}
      </div>
    </div>
  )
}
