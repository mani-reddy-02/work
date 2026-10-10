import { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Bot, Send, PhoneCall, RotateCw 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../lib/apiConfig';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  isEmergency?: boolean;
  suggestedFollowUps?: string[];
  timestamp: string;
}

const SUGGESTED_QUESTIONS_EN = [
  "What are common causes of sudden fever?",
  "How can I maintain healthy blood pressure?",
  "What is HbA1c and why is it tested?",
  "Tips for healthy digestion and acidity relief",
  "What lifestyle habits support heart health?"
];

const SUGGESTED_QUESTIONS_TE = [
  "జ్వరం వచ్చినప్పుడు తీసుకోవాల్సిన సాధారణ జాగ్రత్తలు ఏమిటి?",
  "మధుమేహం (షుగర్) నియంత్రణకు జీవనశైలి మార్పులు ఏమిటి?",
  "రక్తపోటు (బీపీ) సాధారణ స్థాయిలు ఎంత ఉండాలి?",
  "గుండె ఆరోగ్యానికి ఎలాంటి ఆహారం మంచిది?",
  "సరైన శరీర హైడ్రేషన్ (నీరు తాగడం) ప్రాముఖ్యత ఏమిటి?"
];

export default function MediQueeAI() {
  const navigate = useNavigate();

  // Language State
  const [language, setLanguage] = useState<'en' | 'te'>('en');

  // Chat Messages State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello! I am Mediquee AI.\n\nI can help answer your questions about health symptoms, healthy living, medical terms, nutrition, and preventive wellness. How can I assist you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [, setProviderConfigured] = useState<boolean>(true);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  // Check backend provider status on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/health-ai/status`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setProviderConfigured(data.data.configured);
        }
      })
      .catch(() => setProviderConfigured(false));
  }, []);

  // Handle Chat Submit
  const handleSendMessage = async (textToSend: string) => {
    const query = textToSend.trim();
    if (!query || isChatLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Build sanitized conversation history (excluding initial disclaimer)
      const historyPayload = messages
        .filter(m => m.id !== 'welcome')
        .slice(-6)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }));

      const activeLang = /[\u0C00-\u0C7F]/.test(query) ? 'te' : language;
      if (activeLang !== language) setLanguage(activeLang);

      const res = await fetch(`${API_BASE_URL}/health-ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          language: activeLang,
          history: historyPayload
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: json.data.answer,
          isEmergency: json.data.isEmergencyAlert,
          suggestedFollowUps: json.data.suggestedFollowUps,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
        setProviderConfigured(json.data.providerConfigured);
      } else {
        throw new Error(json.error?.message || 'Unable to retrieve answer');
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: language === 'te' 
          ? "క్షమించండి, సర్వర్ కనెక్ట్ కావడంలో సమస్య ఏర్పడింది. దయచేసి కాసేపటి తర్వాత ప్రయత్నించండి లేదా డాక్టర్ కన్సల్టేషన్ బుక్ చేయండి."
          : "I apologize, but I encountered a temporary connection issue. Please try again in a moment or proceed to book a doctor consultation directly.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 relative pb-16 md:pb-4">
      
      {/* Top Header Bar */}
      <div className="bg-white sticky top-0 z-20 px-4 py-3.5 border-b border-slate-200/80 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="p-1.5 -ml-1 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">MediQuee AI</h1>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">24/7 Verified Health & Wellness Education</p>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                language === 'en' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('te')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                language === 'te' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              తెలుగు
            </button>
          </div>
        </div>
      </div>

      {/* Main Conversational Area */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-4 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-xs shadow-sm font-medium' 
                      : msg.isEmergency
                      ? 'bg-red-50 border-2 border-red-300 text-red-950 rounded-tl-xs shadow-sm'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-xs shadow-sm'
                  }`}
                >
                  {msg.sender === 'ai' && (
                    <div className="flex items-center justify-between gap-2 mb-1.5 pb-1.5 border-b border-slate-200/60 text-[11px] font-bold text-slate-500">
                      <span className="flex items-center gap-1.5 text-blue-700 font-semibold">
                        <Bot className="w-3.5 h-3.5" /> Mediquee AI
                      </span>
                      <span className="text-[10px] font-normal text-slate-400">{msg.timestamp}</span>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* Emergency Call Button if Emergency Triggered */}
                  {msg.isEmergency && (
                    <div className="mt-3 pt-2.5 border-t border-red-200 flex flex-wrap gap-2">
                      <a 
                        href="tel:108" 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
                      >
                        <PhoneCall className="w-3.5 h-3.5" /> Call 108 Emergency Ambulance
                      </a>
                      <button
                        onClick={() => navigate('/ambulance')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-300 text-red-700 hover:bg-red-50 font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
                        Hospital Emergency Ward
                      </button>
                    </div>
                  )}

                  {/* Follow Up Suggestions */}
                  {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-200/80 space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested Questions</p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestedFollowUps.map((fu, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(fu)}
                            className="text-[11px] text-blue-700 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 px-2.5 py-1 rounded-full transition-colors cursor-pointer text-left"
                          >
                            {fu}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 shadow-sm flex items-center gap-2 text-slate-500 text-xs font-medium">
                  <RotateCw className="w-4 h-4 text-blue-600 animate-spin" />
                  <span>Consulting health education knowledge base...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Suggested Initial Topics Bar */}
          {messages.length === 1 && !isChatLoading && (
            <div className="p-3 bg-slate-50/70 border-t border-slate-100 overflow-x-auto hide-scrollbar flex gap-2">
              {(language === 'te' ? SUGGESTED_QUESTIONS_TE : SUGGESTED_QUESTIONS_EN).map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="shrink-0 bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600 px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-2xs cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Form Bar */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(chatInput); }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={
                  language === 'te' 
                    ? "ఆరోగ్య సమాచారం లేదా వైద్య పదాల గురించి అడగండి..." 
                    : "Ask about medical terms, wellness, or preventive care..."
                }
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isChatLoading}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all cursor-pointer shrink-0"
                aria-label="Send health question"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>Personal details are automatically redacted</span>
              <span>Powered by MediQuee Health Intelligence</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
