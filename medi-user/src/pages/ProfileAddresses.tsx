import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Plus, Trash2, Edit2, Home, Briefcase, Map } from 'lucide-react';

interface Address {
  id: string;
  type: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

const initialAddresses: Address[] = [
  {
    id: '1',
    type: 'Home',
    street: '123 Health Avenue, Block B',
    city: 'Tirupati',
    state: 'Andhra Pradesh',
    pincode: '517501'
  },
  {
    id: '2',
    type: 'Work',
    street: 'Tech Park, Floor 4',
    city: 'Tirupati',
    state: 'Andhra Pradesh',
    pincode: '517502'
  }
];

export default function ProfileAddresses() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [isAdding, setIsAdding] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({ type: 'Home' });

  const handleDelete = (id: string) => {
    setAddresses(addresses.filter(a => a.id !== id));
  };

  const handleSave = () => {
    if (newAddress.street && newAddress.city) {
      setAddresses([...addresses, { ...newAddress, id: Date.now().toString() } as Address]);
      setIsAdding(false);
      setNewAddress({ type: 'Home' });
    }
  };

  const getIcon = (type: string) => {
    if (type === 'Home') return <Home className="w-5 h-5 text-blue-500" />;
    if (type === 'Work') return <Briefcase className="w-5 h-5 text-purple-500" />;
    return <Map className="w-5 h-5 text-emerald-500" />;
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
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex-1">My Addresses</h1>
      </div>

      <div className="p-4 md:p-6 max-w-md mx-auto w-full flex-1">
        {!isAdding ? (
          <>
            <div className="space-y-4 mb-6">
              {addresses.map(address => (
                <div key={address.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${address.type === 'Home' ? 'bg-blue-50' : address.type === 'Work' ? 'bg-purple-50' : 'bg-emerald-50'}`}>
                    {getIcon(address.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 mb-1">{address.type}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-3">
                      {address.street}<br/>
                      {address.city}, {address.state} {address.pincode}
                    </p>
                    <div className="flex items-center gap-4">
                      <button className="text-sm font-semibold text-blue-600 flex items-center gap-1 hover:text-blue-700">
                        <Edit2 className="w-4 h-4" /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(address.id)}
                        className="text-sm font-semibold text-red-500 flex items-center gap-1 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {addresses.length === 0 && (
                <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 border-dashed">
                  <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MapPin className="w-8 h-8" />
                  </div>
                  <p className="text-slate-500">No saved addresses</p>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsAdding(true)}
              className="w-full py-4 bg-blue-50 text-blue-600 border border-blue-100 font-bold rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add New Address
            </button>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <h2 className="font-bold text-lg text-slate-900 mb-2">Add New Address</h2>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Address Type</label>
              <div className="flex gap-2">
                {['Home', 'Work', 'Other'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setNewAddress({...newAddress, type: t})}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors border ${newAddress.type === t ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">House / Street</label>
              <input 
                type="text" 
                value={newAddress.street || ''}
                onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                placeholder="Flat No, Building Name, Street"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">City</label>
                <input 
                  type="text" 
                  value={newAddress.city || ''}
                  onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Pincode</label>
                <input 
                  type="text" 
                  value={newAddress.pincode || ''}
                  onChange={(e) => setNewAddress({...newAddress, pincode: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">State</label>
              <input 
                type="text" 
                value={newAddress.state || ''}
                onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

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
                Save Address
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
