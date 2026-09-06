import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  subtitle?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ 
  title, 
  value, 
  trend, 
  trendLabel = 'vs last month', 
  icon: Icon,
  iconColor = 'text-blue-600 dark:text-blue-400',
  iconBg = 'bg-blue-50 dark:bg-blue-900/20',
  subtitle
}) => {
  const renderTrend = () => {
    if (trend === undefined) return null;
    
    const isPositive = trend > 0;
    const isNegative = trend < 0;

    let trendColor = 'text-slate-500 dark:text-slate-400';
    let TrendIcon = Minus;

    if (isPositive) {
      trendColor = 'text-emerald-600 dark:text-emerald-400';
      TrendIcon = TrendingUp;
    } else if (isNegative) {
      trendColor = 'text-rose-600 dark:text-rose-400';
      TrendIcon = TrendingDown;
    }

    return (
      <div className="flex items-center gap-1.5 mt-3">
        <div className={`flex items-center gap-0.5 text-xs font-medium ${trendColor}`}>
          <TrendIcon size={14} />
          <span>{Math.abs(trend)}%</span>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500">{trendLabel}</span>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md cursor-pointer">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg} ${iconColor}`}>
          <Icon size={20} />
        </div>
      </div>
      
      <div>
        <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {subtitle && (
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">
            {subtitle}
          </div>
        )}
        {renderTrend()}
      </div>
    </div>
  );
};

export default KpiCard;
