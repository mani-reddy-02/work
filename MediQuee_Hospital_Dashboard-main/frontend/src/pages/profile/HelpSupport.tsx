import { ArrowLeft, Search, HelpCircle, FileText, MessageCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function HelpSupport() {
  const navigate = useNavigate();

  const faqs = [
    "How to reset my password?",
    "How to add a new doctor?",
    "Where can I view daily revenue?",
    "How to schedule a home collection?",
  ];

  return (
    <div className="flex flex-col bg-gray-50 min-h-[calc(100vh-80px)]">
      <div className="sticky top-0 z-30 bg-white pt-4 pb-3 px-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Help & Support</h1>
      </div>

      <div className="p-4 flex flex-col gap-6">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search for help..." 
            className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-gray-50">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Documentation</span>
          </button>
          <button className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-gray-50">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Community</span>
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-gray-900 px-1">Frequently Asked Questions</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            {faqs.map((faq, i) => (
              <button key={i} className="p-4 text-left border-b border-gray-50 last:border-0 hover:bg-gray-50 text-sm font-medium text-gray-700 flex items-center gap-3">
                <HelpCircle className="w-4 h-4 text-gray-400 shrink-0" />
                {faq}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
