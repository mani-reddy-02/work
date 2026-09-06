import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Wallet, Plus, Trash2, Smartphone } from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'UPI' | 'Card' | 'Wallet';
  name: string;
  detail: string;
  icon: any;
  colorClass: string;
}

const initialMethods: PaymentMethod[] = [
  {
    id: '1',
    type: 'UPI',
    name: 'Google Pay',
    detail: 'user@okaxis',
    icon: Smartphone,
    colorClass: 'text-blue-500 bg-blue-50'
  },
  {
    id: '2',
    type: 'Card',
    name: 'HDFC Debit Card',
    detail: '**** **** **** 4589',
    icon: CreditCard,
    colorClass: 'text-indigo-500 bg-indigo-50'
  },
  {
    id: '3',
    type: 'Wallet',
    name: 'Paytm Wallet',
    detail: 'Linked to 98765 43210',
    icon: Wallet,
    colorClass: 'text-sky-500 bg-sky-50'
  }
];

export default function ProfilePayment() {
  const navigate = useNavigate();
  const [methods, setMethods] = useState<PaymentMethod[]>(initialMethods);
  const [isAdding, setIsAdding] = useState(false);
  const [newMethodType, setNewMethodType] = useState<'UPI' | 'Card'>('UPI');
  const [newDetail, setNewDetail] = useState('');

  const handleDelete = (id: string) => {
    setMethods(methods.filter(m => m.id !== id));
  };

  const handleSave = () => {
    if (newDetail) {
      const newMethod: PaymentMethod = {
        id: Date.now().toString(),
        type: newMethodType,
        name: newMethodType === 'UPI' ? 'New UPI ID' : 'New Card',
        detail: newDetail,
        icon: newMethodType === 'UPI' ? Smartphone : CreditCard,
        colorClass: newMethodType === 'UPI' ? 'text-blue-500 bg-blue-50' : 'text-indigo-500 bg-indigo-50'
      };
      setMethods([...methods, newMethod]);
      setIsAdding(false);
      setNewDetail('');
    }
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
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex-1">Payment Methods</h1>
      </div>

      <div className="p-4 md:p-6 max-w-md mx-auto w-full flex-1">
        {!isAdding ? (
          <>
            <div className="space-y-3 mb-6">
              {methods.map(method => (
                <div key={method.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${method.colorClass}`}>
                    <method.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 mb-0.5">{method.name}</h3>
                    <p className="text-slate-500 text-sm truncate">{method.detail}</p>
                  </div>
                  <button 
                    onClick={() => handleDelete(method.id)}
                    className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              
              {methods.length === 0 && (
                <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 border-dashed">
                  <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="w-8 h-8" />
                  </div>
                  <p className="text-slate-500">No payment methods saved</p>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsAdding(true)}
              className="w-full py-4 bg-blue-50 text-blue-600 border border-blue-100 font-bold rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add Payment Method
            </button>
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-400 font-medium">Your payment details are secure. This is a demo view.</p>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <h2 className="font-bold text-lg text-slate-900 mb-4">Add Payment Method</h2>
            
            <div className="flex gap-2 mb-6">
              <button 
                onClick={() => setNewMethodType('UPI')}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition-colors border ${newMethodType === 'UPI' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}
              >
                <Smartphone className="w-5 h-5" /> UPI
              </button>
              <button 
                onClick={() => setNewMethodType('Card')}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition-colors border ${newMethodType === 'Card' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}
              >
                <CreditCard className="w-5 h-5" /> Card
              </button>
            </div>

            {newMethodType === 'UPI' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Enter UPI ID</label>
                <input 
                  type="text" 
                  value={newDetail}
                  onChange={(e) => setNewDetail(e.target.value)}
                  placeholder="e.g. yourname@upi"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Card Number (Demo)</label>
                  <input 
                    type="text" 
                    value={newDetail}
                    onChange={(e) => setNewDetail(e.target.value)}
                    placeholder="**** **** **** 1234"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Expiry Date</label>
                    <input 
                      type="text" 
                      placeholder="MM/YY"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">CVV</label>
                    <input 
                      type="password" 
                      placeholder="***"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setIsAdding(false)}
                className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
