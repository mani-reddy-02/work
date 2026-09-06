import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Bot, Send, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Message = {
  id: string;
  sender: 'ai' | 'user';
  text: string;
};

const SUGGESTED_QUESTIONS = [
  "What doctor should I consult for a headache?",
  "What is diabetes?",
  "What are common symptoms of fever?",
  "How can I book an OP appointment?",
  "How does home nursing work?",
  "Where can I find my health reports?"
];

export default function MediQueeAI() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello! I am MediQuee AI, your healthcare assistant. I can help you find services, book appointments, or answer general healthcare questions.\n\nHow can I assist you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Mock AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: getMockResponse(text.trim())
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const getMockResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('headache')) {
      return "For a headache, you should typically consult a General Physician. If the headache is severe or chronic, a Neurologist might be recommended. Would you like me to help you find a doctor on MediQuee?";
    } else if (lowerQuery.includes('diabetes')) {
      return "Diabetes is a chronic condition that affects how your body turns food into energy. It is characterized by elevated blood sugar levels. You can book a 'Diabetes Screening' lab test through our Lab Tests section.";
    } else if (lowerQuery.includes('fever')) {
      return "Common symptoms of fever include sweating, chills, shivering, headache, muscle aches, and general weakness. If it persists, please book a Video Consultation with our specialists.";
    } else if (lowerQuery.includes('op appointment') || lowerQuery.includes('book')) {
      return "To book an OP appointment, go to the 'Specialties' or 'Hospitals' section on the Home screen. From there, you can select your preferred doctor and book a time slot.";
    } else if (lowerQuery.includes('home nursing')) {
      return "Home Nursing provides professional care in the comfort of your home. You can book it by selecting 'Home Nursing' on the home page, picking a date and time, and entering patient details.";
    } else if (lowerQuery.includes('report')) {
      return "Your health reports are stored securely in the MediQuee app. You can find them by navigating to the 'Services' menu and clicking on 'My Reports'.";
    }
    return "Thank you for your question. As an AI, I provide general healthcare guidance and can help you navigate MediQuee's services. For personalized medical advice, please consult one of our certified doctors via Video Consultation or an OP Booking.";
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-[#1a1f2e] pt-4 pb-4 px-4 text-white shrink-0 shadow-md z-10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center border border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.3)]">
            <Bot className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h1 className="text-[16px] font-bold leading-tight flex items-center gap-1.5">
              MediQuee AI
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            </h1>
            <p className="text-[11px] text-slate-400">Your healthcare assistant</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-3 ${msg.sender === 'user' ? 'bg-[#0055ff] text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 shadow-sm rounded-tl-sm'}`}>
              <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && !isTyping && (
        <div className="px-4 pb-2 overflow-x-auto hide-scrollbar flex gap-2">
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="shrink-0 bg-white border border-blue-100 text-blue-600 px-3 py-1.5 rounded-full text-[11px] font-medium hover:bg-blue-50 transition-colors shadow-sm"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Spacer to prevent content from hiding behind fixed input */}
      <div className="h-24"></div>

      {/* Input Area */}
      <div className="fixed bottom-[96px] md:bottom-0 left-0 md:left-64 right-0 z-40 bg-white border-t border-slate-100 shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto p-3 pb-safe">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full p-1 pl-4 pr-1"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a healthcare question..."
            className="flex-1 bg-transparent border-none focus:outline-none text-[13px] text-slate-800 placeholder-slate-400 py-2"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-10 h-10 rounded-full bg-[#0055ff] flex items-center justify-center text-white shrink-0 disabled:opacity-50 disabled:bg-slate-300 transition-colors shadow-md"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
          </form>
        </div>
      </div>
    </div>
  );
}
