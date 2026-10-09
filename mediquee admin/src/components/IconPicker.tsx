import React, { useState, useEffect } from 'react';

// Hardcoded some example paths that exist in public/icons
const ICONS = {
  specializations: ['/icons/specializations/cardiology.png', '/icons/specializations/neurology.png', '/icons/specializations/orthopedics.png', '/icons/specializations/dental.png'],
  conditions: ['/icons/conditions/heart-attack.png', '/icons/conditions/fever.png', '/icons/conditions/headache.png']
};

export default function IconPicker({ value, onChange, folderType }: { value: string, onChange: (val: string) => void, folderType: 'specializations' | 'conditions' }) {
  const [mode, setMode] = useState<'system' | 'custom'>('system');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("File too large"); return; }
    const reader = new FileReader();
    reader.onload = () => { onChange(reader.result as string); };
    reader.readAsDataURL(file);
  };

  return (
    <div className="border rounded p-4 space-y-4 bg-white">
      <div className="flex space-x-4 mb-2">
        <button type="button" className={`px-4 py-2 border font-medium rounded ${mode==='system'?'bg-blue-600 text-white border-blue-600':'bg-white text-slate-700 hover:bg-slate-50'}`} onClick={() => setMode('system')}>
          Select Icon
        </button>
        <button type="button" className={`px-4 py-2 border font-medium rounded ${mode==='custom'?'bg-blue-600 text-white border-blue-600':'bg-white text-slate-700 hover:bg-slate-50'}`} onClick={() => setMode('custom')}>
          Upload Custom Icon
        </button>
      </div>

      {mode === 'system' && (
        <div className="grid grid-cols-4 gap-4">
          {ICONS[folderType].map(ic => (
            <div key={ic} className={`border p-2 cursor-pointer flex flex-col items-center rounded ${value === ic ? 'border-blue-500 bg-blue-50' : 'hover:bg-slate-50'}`} onClick={() => onChange(ic)}>
              <img src={ic} alt="icon" className="w-8 h-8" />
            </div>
          ))}
        </div>
      )}

      {mode === 'custom' && (
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
          <input type="file" accept="image/png, image/jpeg, image/webp, image/svg+xml" onChange={handleFileUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>
      )}

      {value && (
        <div className="mt-4 border-t pt-4">
          <p className="text-sm font-medium mb-2 text-slate-700">Icon Preview</p>
          <div className="w-20 h-20 rounded-lg border flex items-center justify-center bg-slate-50 overflow-hidden">
             <img src={value} className="w-16 h-16 object-contain" alt="Preview" />
          </div>
        </div>
      )}
    </div>
  );
}
