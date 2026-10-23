import React, { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';

export type DatePreset = 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom';
export type DateRangePreset = DatePreset;

export interface DateFilterValue {
  preset: DatePreset;
  startDate: string; // 'YYYY-MM-DD' or ''
  endDate: string;   // 'YYYY-MM-DD' or ''
}

export interface DateRangeFilterProps {
  value?: DateFilterValue;
  preset?: DatePreset;
  startDate?: string;
  endDate?: string;
  onChange: (value: DateFilterValue) => void;
  className?: string;
  showAllOption?: boolean;
  label?: string;
}

const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getPresetDates = (preset: DatePreset): { startDate: string; endDate: string } => {
  const now = new Date();

  if (preset === 'today') {
    const todayStr = formatLocalDate(now);
    return { startDate: todayStr, endDate: todayStr };
  }

  if (preset === 'yesterday') {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const yStr = formatLocalDate(y);
    return { startDate: yStr, endDate: yStr };
  }

  if (preset === 'this_week') {
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      startDate: formatLocalDate(monday),
      endDate: formatLocalDate(sunday),
    };
  }

  if (preset === 'this_month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: formatLocalDate(firstDay),
      endDate: formatLocalDate(lastDay),
    };
  }

  return { startDate: '', endDate: '' };
};

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  value,
  preset: propPreset,
  startDate: propStartDate,
  endDate: propEndDate,
  onChange,
  className = '',
  showAllOption = true,
  label = 'Date Filter:',
}) => {
  const effectiveValue: DateFilterValue = value || {
    preset: propPreset || 'all',
    startDate: propStartDate || '',
    endDate: propEndDate || ''
  };
  const currentPreset = effectiveValue.preset || 'all';
  const [customStart, setCustomStart] = useState<string>(effectiveValue.startDate || '');
  const [customEnd, setCustomEnd] = useState<string>(effectiveValue.endDate || '');

  useEffect(() => {
    if (effectiveValue.preset === 'custom') {
      setCustomStart(effectiveValue.startDate || '');
      setCustomEnd(effectiveValue.endDate || '');
    }
  }, [effectiveValue.preset, effectiveValue.startDate, effectiveValue.endDate]);

  const handleSelectPreset = (p: DatePreset) => {
    if (p === 'custom') {
      onChange({
        preset: 'custom',
        startDate: customStart,
        endDate: customEnd,
      });
      return;
    }

    const { startDate, endDate } = getPresetDates(p);
    onChange({
      preset: p,
      startDate,
      endDate,
    });
  };

  const handleApplyCustom = () => {
    if (!customStart && !customEnd) return;
    onChange({
      preset: 'custom',
      startDate: customStart,
      endDate: customEnd || customStart,
    });
  };

  const handleClear = () => {
    setCustomStart('');
    setCustomEnd('');
    onChange({
      preset: 'all',
      startDate: '',
      endDate: '',
    });
  };

  const activeBtnClass = 'bg-white text-blue-600 shadow-sm font-semibold';
  const inactiveBtnClass = 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50';

  const isFiltered = currentPreset !== 'all' && (value?.startDate || value?.endDate);

  return (
    <div className={`bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3 ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Preset Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {label && (
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <Calendar size={15} className="text-blue-600 shrink-0" />
              {label}
            </span>
          )}

          <div className="inline-flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {showAllOption && (
              <button
                type="button"
                onClick={() => handleSelectPreset('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  currentPreset === 'all' ? activeBtnClass : inactiveBtnClass
                }`}
              >
                All
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSelectPreset('today')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                currentPreset === 'today' ? activeBtnClass : inactiveBtnClass
              }`}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('yesterday')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                currentPreset === 'yesterday' ? activeBtnClass : inactiveBtnClass
              }`}
            >
              Yesterday
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('this_week')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                currentPreset === 'this_week' ? activeBtnClass : inactiveBtnClass
              }`}
            >
              This Week
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('this_month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                currentPreset === 'this_month' ? activeBtnClass : inactiveBtnClass
              }`}
            >
              This Month
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('custom')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                currentPreset === 'custom' ? activeBtnClass : inactiveBtnClass
              }`}
            >
              <Calendar size={13} />
              Custom Range
            </button>
          </div>
        </div>

        {/* Status / Active Info & Reset */}
        {isFiltered && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Filtered by:</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              {currentPreset === 'today' && 'Today'}
              {currentPreset === 'yesterday' && 'Yesterday'}
              {currentPreset === 'this_week' && 'This Week'}
              {currentPreset === 'this_month' && 'This Month'}
              {currentPreset === 'custom' && 'Custom'}
              <span className="text-blue-500 font-normal">
                ({value?.startDate === value?.endDate ? value?.startDate : `${value?.startDate} to ${value?.endDate}`})
              </span>
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 transition p-1 hover:bg-slate-100 rounded-md"
              title="Clear date filter"
            >
              <X size={14} />
              <span className="text-[11px] font-medium">Reset</span>
            </button>
          </div>
        )}
      </div>

      {/* Custom Date Range Picker Container */}
      {currentPreset === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-slate-700 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600">From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCustom(); }}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs font-medium"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600">To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCustom(); }}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs font-medium"
            />
          </div>
          <button
            type="button"
            onClick={handleApplyCustom}
            disabled={!customStart && !customEnd}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            Apply Filter
          </button>
          {(customStart || customEnd) && (
            <button
              type="button"
              onClick={handleClear}
              className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg font-medium transition"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
