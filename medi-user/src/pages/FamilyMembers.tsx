import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Plus, UserCircle2, ChevronRight } from 'lucide-react';

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  age: number;
  gender: string;
}

const initialMembers: FamilyMember[] = [
  { id: '1', name: 'John Doe', relationship: 'Father', age: 52, gender: 'Male' },
  { id: '2', name: 'Jane Doe', relationship: 'Mother', age: 48, gender: 'Female' }
];

export default function FamilyMembers() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<FamilyMember[]>(initialMembers);
  const [isAdding, setIsAdding] = useState(false);
  const [newMember, setNewMember] = useState<Partial<FamilyMember>>({ gender: 'Male' });

  const handleSave = () => {
    if (newMember.name && newMember.relationship && newMember.age) {
      setMembers([...members, { ...newMember, id: Date.now().toString() } as FamilyMember]);
      setIsAdding(false);
      setNewMember({ gender: 'Male' });
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
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex-1">Family Members</h1>
      </div>

      <div className="p-4 md:p-6 max-w-md mx-auto w-full flex-1">
        {!isAdding ? (
          <>
            <div className="space-y-3 mb-6">
              {members.map(member => (
                <div key={member.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-4 cursor-pointer hover:border-blue-100 transition-colors group">
                  <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center shrink-0 text-orange-500">
                    <UserCircle2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 mb-0.5">{member.name}</h3>
                    <p className="text-slate-500 text-sm">Relationship: {member.relationship} • Age: {member.age}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                </div>
              ))}
              
              {members.length === 0 && (
                <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 border-dashed">
                  <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-8 h-8" />
                  </div>
                  <p className="text-slate-500">No family members added</p>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsAdding(true)}
              className="w-full py-4 bg-orange-50 text-orange-600 border border-orange-100 font-bold rounded-xl hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add Family Member
            </button>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <h2 className="font-bold text-lg text-slate-900 mb-4">Add Family Member</h2>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Full Name</label>
              <input 
                type="text" 
                value={newMember.name || ''}
                onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                placeholder="e.g. John Doe"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Relationship</label>
              <input 
                type="text" 
                value={newMember.relationship || ''}
                onChange={(e) => setNewMember({...newMember, relationship: e.target.value})}
                placeholder="e.g. Father, Mother, Spouse"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Age</label>
                <input 
                  type="number" 
                  value={newMember.age || ''}
                  onChange={(e) => setNewMember({...newMember, age: parseInt(e.target.value) || 0})}
                  placeholder="e.g. 35"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Gender</label>
                <select 
                  value={newMember.gender || 'Male'}
                  onChange={(e) => setNewMember({...newMember, gender: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
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
                className="flex-1 py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20"
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
