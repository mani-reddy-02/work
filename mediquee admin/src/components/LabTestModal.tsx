import React, { useState } from 'react';
import { useAdminAuth } from '../contexts/AuthContext';
import IconPicker from './IconPicker';
import { X } from 'lucide-react';

interface LabTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existing?: any;
  departmentId: string;
  departmentName: string;
}

const SPECIMEN_TYPES = [
  { value: 'SERUM', label: 'Serum (Blood Centrifuged)' },
  { value: 'WHOLE_BLOOD', label: 'Whole Blood (EDTA / Heparin)' },
  { value: 'PLASMA', label: 'Plasma (Citrate / Fluoride)' },
  { value: 'URINE', label: 'Urine' },
  { value: 'STOOL', label: 'Stool' },
  { value: 'SPUTUM', label: 'Sputum' },
  { value: 'SWAB', label: 'Swab (Nasal / Throat)' },
  { value: 'CSF_FLUID', label: 'CSF Fluid' },
  { value: 'TISSUE_BIOPSY', label: 'Tissue Biopsy' },
  { value: 'IMAGE_SCAN', label: 'Imaging / Scan' }
];

export default function LabTestModal({
  isOpen,
  onClose,
  onSuccess,
  existing,
  departmentId,
  departmentName
}: LabTestModalProps) {
  const { token } = useAdminAuth();
  const [name, setName] = useState(existing?.name || '');
  const [code, setCode] = useState(existing?.code || '');
  const [specimenType, setSpecimenType] = useState(existing?.specimenType || 'SERUM');
  const [fastingRequired, setFastingRequired] = useState(existing?.fastingRequired ?? false);
  const [fastingDurationHours, setFastingDurationHours] = useState(existing?.fastingDurationHours || '');
  const [canBeCollectedAtHome, setCanBeCollectedAtHome] = useState(existing?.canBeCollectedAtHome ?? true);
  const [defaultTatHours, setDefaultTatHours] = useState(existing?.defaultTatHours || 24);
  const [description, setDescription] = useState(existing?.description || '');
  const [icon, setIcon] = useState(existing?.icon || '/optimized/Blood Test.webp');
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!existing && !code) {
      const words = val.trim().split(/\s+/);
      if (words.length === 1 && words[0].length >= 3) {
        setCode(words[0].substring(0, 5).toUpperCase());
      } else if (words.length > 1) {
        setCode(words.map(w => w[0]).join('').substring(0, 6).toUpperCase());
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Test name is required');
      return;
    }
    if (!icon) {
      setError('Test icon is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
      const method = existing ? 'PATCH' : 'POST';
      const url = existing
        ? `${API_URL}/admin/lab-tests/${existing.id}`
        : `${API_URL}/admin/lab-departments/${departmentId}/tests`;

      const payload: any = {
        name: name.trim(),
        code: code.trim() || undefined,
        specimenType,
        fastingRequired,
        fastingDurationHours: fastingRequired && fastingDurationHours ? Number(fastingDurationHours) : null,
        canBeCollectedAtHome,
        defaultTatHours: Number(defaultTatHours) || 24,
        description: description.trim() || null,
        icon,
        isActive
      };

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error?.message || 'Error saving test');
      }
    } catch (err) {
      setError('Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex min-h-full items-center justify-center p-3 sm:p-4">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {existing ? 'Edit Lab Test' : 'Add New Lab Test'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Department: <span className="font-semibold text-blue-600">{departmentName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 space-y-4.5">
            {error && (
              <div className="text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Test Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Complete Blood Count (CBC) with ESR"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Test Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. CBC"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm uppercase font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Specimen / Sample Type *
                </label>
                <select
                  value={specimenType}
                  onChange={e => setSpecimenType(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                >
                  {SPECIMEN_TYPES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Default TAT (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 6, 12, 24"
                  value={defaultTatHours}
                  onChange={e => setDefaultTatHours(e.target.value ? parseInt(e.target.value) : 24)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                />
              </div>
            </div>

            {/* Test Conditions & Checkboxes */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="flex items-center space-x-2.5 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fastingRequired}
                    onChange={e => setFastingRequired(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="font-medium">Fasting Required Prior to Test</span>
                </label>

                {fastingRequired && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500 font-medium">Duration:</span>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      placeholder="Hours"
                      value={fastingDurationHours}
                      onChange={e => setFastingDurationHours(e.target.value)}
                      className="w-20 border border-slate-200 rounded-lg p-1.5 text-xs text-center focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                    <span className="text-xs text-slate-500">hrs</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2.5">
                <label className="flex items-center space-x-2.5 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canBeCollectedAtHome}
                    onChange={e => setCanBeCollectedAtHome(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="font-medium">Can be collected via Home Sample Collection (HSC)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Description & Clinical Significance
              </label>
              <textarea
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                rows={2}
                placeholder="Clinical purpose, normal parameters or instructions"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Test Icon *
              </label>
              <IconPicker value={icon} onChange={setIcon} folderType="tests" />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-medium text-slate-700">Test Status</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-xs font-semibold text-slate-600">
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </label>
            </div>
          </div>

          {/* Fixed Sticky Footer */}
          <div className="flex justify-end space-x-3 px-6 py-4 border-t border-slate-100 bg-slate-50/70 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 font-medium text-sm text-slate-700 rounded-xl hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 font-semibold text-sm text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
            >
              {loading ? 'Saving...' : (existing ? 'Save Changes' : 'Create Lab Test')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
