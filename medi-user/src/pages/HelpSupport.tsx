import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Phone, MessageSquare, ChevronDown, ChevronUp, Mail } from 'lucide-react';

const faqs = [
  {
    question: 'How do I book an appointment?',
    answer: 'You can book an appointment by navigating to the "Hospitals" or "Doctors" section, selecting your preferred doctor or facility, choosing an available time slot, and confirming your booking.'
  },
  {
    question: 'How do I cancel an appointment?',
    answer: 'To cancel an appointment, go to the "My Bookings" section, find the appointment you wish to cancel, and click the "Cancel Booking" button. Note that cancellation policies may apply depending on the hospital or doctor.'
  },
  {
    question: 'How do I book a lab test?',
    answer: 'Go to the "Lab Tests" section from the Home screen. Browse the available tests, add them to your cart, and proceed to checkout to schedule a home sample collection or a visit to the lab.'
  },
  {
    question: 'How does Home Nursing work?',
    answer: 'The Home Nursing service allows you to request professional nurses for at-home care. Select "Home Nursing" from the Home screen, choose the type of care required, and a nurse will be assigned to you based on availability.'
  },
  {
    question: 'How do I access my health reports?',
    answer: 'You can access all your digital health records and test results by visiting the "Health Records" section in your Profile, or by clicking "Reports" under the Quick Services menu.'
  }
];

export default function HelpSupport() {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [showToast, setShowToast] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="bg-white sticky top-0 z-20 px-4 py-4 border-b border-slate-100 flex items-center shadow-sm">
        <button 
          onClick={() => navigate('/profile')} 
          className="p-1 -ml-1 mr-3 text-slate-600 hover:text-blue-600 transition-colors rounded-full hover:bg-slate-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex-1">Help & Support</h1>
      </div>

      <div className="p-4 md:p-6 max-w-md mx-auto w-full flex-1">
        {showToast && (
          <div className="mb-4 bg-emerald-50 text-emerald-600 p-3 rounded-xl flex items-center justify-center gap-2 border border-emerald-100 animate-in fade-in slide-in-from-top-4">
            <p className="text-sm font-medium">Request submitted successfully!</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={triggerToast} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:border-blue-200 transition-colors">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 text-sm">Contact Support</span>
          </button>
          
          <button onClick={triggerToast} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:border-orange-200 transition-colors">
            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 text-sm">Report a Problem</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-500" />
            <h2 className="font-bold text-lg text-slate-900">Frequently Asked Questions</h2>
          </div>
          
          <div className="divide-y divide-slate-100">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white">
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors focus:outline-none"
                >
                  <span className="font-semibold text-slate-900 text-sm leading-tight">{faq.question}</span>
                  {openFaqIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaqIndex === index && (
                  <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed bg-slate-50/50">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center gap-2 text-center text-slate-500 pb-4">
          <Mail className="w-5 h-5 text-slate-400" />
          <p className="text-xs font-medium">Still need help?<br/>Email us at <a href="mailto:support@mediquee.com" className="text-blue-500 hover:underline">support@mediquee.com</a></p>
        </div>
      </div>
    </div>
  );
}
