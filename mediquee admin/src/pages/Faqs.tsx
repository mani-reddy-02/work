import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../contexts/AuthContext';
import { 
  HelpCircle, Plus, Edit2, Trash2, AlertCircle, CheckCircle2, 
  ChevronUp, ChevronDown, Eye, EyeOff, Save, X, Sparkles
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
const MAX_FAQS = 5;

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const Faqs: React.FC = () => {
  const { token } = useAdminAuth();
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    isActive: true
  });
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/faqs/admin`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setFaqs(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch FAQs');
      }
    } catch (err: any) {
      console.error(err);
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFaqs();
    }
  }, [token]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleOpenAddModal = () => {
    if (faqs.length >= MAX_FAQS) {
      setError(`Maximum limit of ${MAX_FAQS} FAQs reached. Delete or edit an existing FAQ to add a new one.`);
      return;
    }
    setFormData({ question: '', answer: '', isActive: true });
    setIsEditing(false);
    setCurrentId(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (faq: FaqItem) => {
    setFormData({
      question: faq.question,
      answer: faq.answer,
      isActive: faq.isActive
    });
    setIsEditing(true);
    setCurrentId(faq.id);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question.trim()) {
      setModalError('Question is required');
      return;
    }
    if (!formData.answer.trim()) {
      setModalError('Answer is required');
      return;
    }

    try {
      setModalSubmitting(true);
      setModalError(null);

      if (isEditing && currentId) {
        const res = await fetch(`${API_BASE_URL}/faqs/admin/${currentId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (data.success) {
          showSuccess('FAQ updated successfully');
          setIsModalOpen(false);
          fetchFaqs();
        } else {
          setModalError(data.message || 'Failed to update FAQ');
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/faqs/admin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (data.success) {
          showSuccess('FAQ created successfully');
          setIsModalOpen(false);
          fetchFaqs();
        } else {
          setModalError(data.message || 'Failed to create FAQ');
        }
      }
    } catch (err: any) {
      console.error(err);
      setModalError('Server error while saving FAQ');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleToggleStatus = async (faq: FaqItem) => {
    try {
      const res = await fetch(`${API_BASE_URL}/faqs/admin/${faq.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !faq.isActive })
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(`FAQ set to ${!faq.isActive ? 'Active' : 'Inactive'}`);
        fetchFaqs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (faq: FaqItem) => {
    if (!window.confirm(`Are you sure you want to delete this FAQ?\n\n"${faq.question}"`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/faqs/admin/${faq.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('FAQ deleted successfully');
        fetchFaqs();
      } else {
        setError(data.message || 'Failed to delete FAQ');
      }
    } catch (err) {
      console.error(err);
      setError('Server error while deleting FAQ');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= faqs.length) return;

    const newFaqs = [...faqs];
    const [moved] = newFaqs.splice(index, 1);
    newFaqs.splice(targetIdx, 0, moved);

    const reordered = newFaqs.map((item, idx) => ({
      id: item.id,
      order: idx
    }));

    setFaqs(newFaqs);

    try {
      await fetch(`${API_BASE_URL}/faqs/admin/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ items: reordered })
      });
      showSuccess('Order updated');
    } catch (err) {
      console.error(err);
      fetchFaqs();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">FAQ Management</h1>
              <p className="text-sm text-slate-500">
                Manage the dynamic FAQ items displayed on the User Portal Home Page.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Capacity pill */}
          <div className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border ${
            faqs.length >= MAX_FAQS 
              ? 'bg-amber-50 text-amber-700 border-amber-200' 
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${faqs.length >= MAX_FAQS ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            <span>{faqs.length} / {MAX_FAQS} FAQs Configured</span>
          </div>

          {/* Add Button */}
          <button
            onClick={handleOpenAddModal}
            disabled={faqs.length >= MAX_FAQS}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${
              faqs.length >= MAX_FAQS
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95 shadow-blue-500/20'
            }`}
            title={faqs.length >= MAX_FAQS ? 'Maximum 5 FAQs limit reached' : 'Add new FAQ'}
          >
            <Plus className="w-4 h-4" />
            <span>Add FAQ</span>
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Info Banner when 5 FAQs limit is reached */}
      {faqs.length >= MAX_FAQS && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Maximum 5 FAQs limit reached:</strong> The user home page will display these {MAX_FAQS} FAQs in order. To add a different FAQ, please edit or remove one of the existing items.
          </span>
        </div>
      )}

      {/* FAQs List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            FAQ Items ({faqs.length} of {MAX_FAQS})
          </span>
          <span className="text-xs text-slate-400">
            Drag or use arrows to change display order
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-slate-400">Loading FAQs...</p>
          </div>
        ) : faqs.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">No FAQs Configured</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Add up to 5 frequently asked questions to help users learn about video consultation, lab tests, insurance, and bookings.
              </p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium inline-flex items-center gap-1.5 hover:bg-blue-700 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add First FAQ
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {faqs.map((faq, idx) => (
              <div 
                key={faq.id} 
                className={`p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 transition-colors hover:bg-slate-50/80 ${
                  !faq.isActive ? 'opacity-60 bg-slate-50/40' : ''
                }`}
              >
                {/* Left: Position & Content */}
                <div className="flex items-start gap-4 flex-1">
                  {/* Position Badge & Order Controls */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center border border-slate-200">
                      {idx + 1}
                    </span>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <button
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0}
                        className={`p-1 rounded hover:bg-slate-200 text-slate-500 transition-colors ${
                          idx === 0 ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === faqs.length - 1}
                        className={`p-1 rounded hover:bg-slate-200 text-slate-500 transition-colors ${
                          idx === faqs.length - 1 ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Question and Answer */}
                  <div className="space-y-1.5 flex-1 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {faq.question}
                      </h3>
                      {faq.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Eye className="w-2.5 h-2.5" /> Live on Portal
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                          <EyeOff className="w-2.5 h-2.5" /> Inactive / Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleToggleStatus(faq)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      faq.isActive
                        ? 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}
                    title={faq.isActive ? 'Hide FAQ from portal' : 'Make FAQ visible on portal'}
                  >
                    {faq.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{faq.isActive ? 'Hide' : 'Activate'}</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(faq)}
                    className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                    title="Edit FAQ"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(faq)}
                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                    title="Delete FAQ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  {isEditing ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  {isEditing ? 'Edit Frequently Asked Question' : 'Add New FAQ (Max 5)'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Question <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., How do I book an OP consultation?"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Answer <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide a clear, helpful explanation for patients..."
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-medium text-slate-700 cursor-pointer select-none">
                  Make this FAQ visible on the User Home Page immediately
                </label>
              </div>

              {/* Live Preview Inside Modal */}
              {formData.question && (
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Portal Preview
                  </span>
                  <p className="text-xs font-bold text-slate-800">{formData.question}</p>
                  {formData.answer && (
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed border-t border-slate-200/60 pt-1">
                      {formData.answer}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{modalSubmitting ? 'Saving...' : isEditing ? 'Update FAQ' : 'Add FAQ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Faqs;
