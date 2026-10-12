import React, { useState, useMemo } from 'react';
import { PRESET_ICONS, IconPreset } from '../utils/iconUtils';
import { Search, Upload, Check, Image as ImageIcon } from 'lucide-react';
import { IconImage } from './IconImage';

interface IconPickerProps {
  value: string;
  onChange: (val: string) => void;
  folderType?: 'specializations' | 'conditions' | 'tests' | 'lab-departments';
}

export default function IconPicker({ value, onChange, folderType }: IconPickerProps) {
  const [mode, setMode] = useState<'system' | 'custom'>('system');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    folderType === 'specializations'
      ? 'Specializations'
      : folderType === 'tests' || folderType === 'lab-departments'
      ? 'Tests & Scans'
      : folderType === 'conditions'
      ? 'Conditions'
      : 'All'
  );

  const categories = ['All', 'Tests & Scans', 'Specializations', 'Conditions'];

  const filteredIcons = useMemo(() => {
    return PRESET_ICONS.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        !search.trim() ||
        item.name.toLowerCase().includes(search.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, search]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('File size exceeds 2MB limit');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="border border-slate-200/90 rounded-xl p-3.5 space-y-3 bg-slate-50/60">
      {/* Mode Switch Tabs & Selected Badge */}
      <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
        <div className="flex space-x-1.5">
          <button
            type="button"
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              mode === 'system'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
            onClick={() => setMode('system')}
          >
            System Icons ({PRESET_ICONS.length})
          </button>
          <button
            type="button"
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              mode === 'custom'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
            onClick={() => setMode('custom')}
          >
            <Upload className="w-3.5 h-3.5 inline mr-1" />
            Upload Custom
          </button>
        </div>

        {/* Selected badge */}
        {value && (
          <div className="flex items-center space-x-1.5 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Selected:</span>
            <IconImage icon={value} size="sm" rounded="rounded-md" />
          </div>
        )}
      </div>

      {mode === 'system' && (
        <div className="space-y-2.5">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search icons (e.g. Blood, Urine, X-Ray, Scan, Heart)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Icons Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1.5 bg-white rounded-xl border border-slate-200 shadow-inner">
            {filteredIcons.map((ic) => {
              const isSelected = value === ic.url;
              return (
                <button
                  type="button"
                  key={ic.url}
                  onClick={() => onChange(ic.url)}
                  title={ic.name}
                  className={`group relative flex flex-col items-center p-1.5 rounded-xl border transition-all text-center ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/90 ring-2 ring-blue-500/30'
                      : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-8 h-8 flex items-center justify-center p-0.5 mb-1">
                    <img
                      src={ic.url}
                      alt={ic.name}
                      className="w-full h-full object-contain transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-[10px] text-slate-700 font-medium truncate w-full">
                    {ic.name}
                  </span>
                  {isSelected && (
                    <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </button>
              );
            })}
            {filteredIcons.length === 0 && (
              <div className="col-span-full py-6 text-center text-xs text-slate-400">
                No icons found matching "{search}"
              </div>
            )}
          </div>
        </div>
      )}

      {mode === 'custom' && (
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-white hover:border-blue-400 transition-colors">
          <Upload className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
          <p className="text-xs font-semibold text-slate-700 mb-0.5">
            Upload custom diagnostic icon
          </p>
          <p className="text-[11px] text-slate-500 mb-2.5">
            PNG, JPG, SVG, or WEBP up to 2MB
          </p>
          <label className="inline-block cursor-pointer px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-2xs transition-colors">
            Browse File
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp, image/svg+xml"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Selected Preview Bar */}
      {value && (
        <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          <div className="flex items-center space-x-2 min-w-0">
            <IconImage icon={value} size="sm" rounded="rounded-md" />
            <span className="text-xs font-medium text-slate-800 truncate">
              {value.startsWith('data:')
                ? 'Custom Uploaded Icon'
                : value.split('/').pop()?.replace(/\.[^/.]+$/, '')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[11px] text-red-500 hover:text-red-700 font-medium px-1.5 py-0.5 rounded transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
