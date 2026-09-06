import { ArrowLeft, Send, Mail, PhoneCall } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

export function ContactSupport() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col bg-gray-50 min-h-[calc(100vh-80px)]">
      <div className="sticky top-0 z-30 bg-white pt-4 pb-3 px-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Contact Support</h1>
      </div>

      <div className="p-4 flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Call Us</span>
            <span className="text-xs text-gray-500">1800-123-456</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Email Us</span>
            <span className="text-xs text-gray-500">support@mediquee.com</span>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-4">
          <h2 className="font-bold text-gray-900">Send us a message</h2>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Subject</label>
            <input type="text" placeholder="How can we help?" className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Message</label>
            <textarea rows={4} placeholder="Describe your issue..." className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" />
          </div>

          <button className="bg-blue-600 text-white font-bold rounded-lg py-3 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors mt-2">
            <Send className="w-4 h-4" /> Send Message
          </button>
        </motion.div>
      </div>
    </div>
  )
}
