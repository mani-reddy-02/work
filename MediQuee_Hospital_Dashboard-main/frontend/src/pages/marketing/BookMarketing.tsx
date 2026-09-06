import { ArrowLeft, Megaphone, TrendingUp, Target, Send, Calendar } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useState } from "react"

export function BookMarketing() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const services = [
    { id: 'social', label: 'Social Media Management', icon: Megaphone },
    { id: 'seo', label: 'Local SEO & Visibility', icon: Target },
    { id: 'ads', label: 'Digital Ads (PPC)', icon: TrendingUp }
  ];

  const toggleService = (id: string) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

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
        <h1 className="text-[18px] font-bold text-gray-900">Hospital Marketing</h1>
      </div>

      <div className="p-4 flex flex-col flex-1">
        
        {/* Banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 text-white mb-6 shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <Megaphone className="w-32 h-32 -mt-4 -mr-4" />
          </div>
          <h2 className="text-xl font-bold mb-2 relative z-10">Boost Your Footfall</h2>
          <p className="text-blue-100 text-sm leading-relaxed relative z-10">
            Specialized marketing services designed specifically for healthcare providers to increase patient reach.
          </p>
        </motion.div>

        {isSubmitted ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100 flex-1">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Request Received!</h3>
            <p className="text-gray-500 mb-6 text-sm">
              Our marketing experts will be in touch with you shortly to discuss a customized strategy for your hospital.
            </p>
            <button onClick={() => navigate(-1)} className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-xl shadow-md shadow-blue-200">
              Go Back
            </button>
          </motion.div>
        ) : (
          <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
            
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
              <h3 className="font-bold text-gray-800 border-b border-gray-50 pb-2">What services are you interested in?</h3>
              
              <div className="flex flex-col gap-3 mt-2">
                {services.map(service => {
                  const Icon = service.icon;
                  const isSelected = selectedServices.includes(service.id);
                  return (
                    <div 
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-blue-500 text-white' : 'bg-white text-gray-400 shadow-sm'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`font-semibold text-sm ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                        {service.label}
                      </span>
                      {isSelected && (
                        <div className="ml-auto w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-sm flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4 mt-2">
              <h3 className="font-bold text-gray-800 border-b border-gray-50 pb-2">Contact Details</h3>
              
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Preferred Time to Call</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <select required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm appearance-none">
                    <option value="">Select a time</option>
                    <option value="morning">Morning (9 AM - 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                    <option value="evening">Evening (4 PM - 7 PM)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6">
              <button 
                type="submit" 
                disabled={isSubmitting || selectedServices.length === 0}
                className="w-full bg-blue-600 text-white font-bold rounded-xl py-4 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100"
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
