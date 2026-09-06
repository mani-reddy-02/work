import React from 'react';

type StatusType = 'success' | 'warning' | 'error' | 'neutral' | 'info';

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
}

const getStatusConfig = (status: string): { type: StatusType; label: string } => {
  const normalized = status.toUpperCase();
  
  switch (normalized) {
    case 'ACTIVE':
    case 'VERIFIED':
    case 'COMPLETED':
    case 'SUCCESS':
    case 'APPROVED':
      return { type: 'success', label: status };
    case 'PENDING':
    case 'WARNING':
      return { type: 'warning', label: status };
    case 'INACTIVE':
    case 'REJECTED':
    case 'CANCELLED':
    case 'FAILED':
    case 'ERROR':
      return { type: 'error', label: status };
    case 'CONFIRMED':
      return { type: 'info', label: status };
    case 'UNVERIFIED':
    case 'NO_SHOW':
    default:
      return { type: 'neutral', label: status };
  }
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type: overrideType }) => {
  const config = getStatusConfig(status);
  const type = overrideType || config.type;
  
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border";
  
  const typeClasses = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200"
  };

  return (
    <span className={`${baseClasses} ${typeClasses[type]}`}>
      {config.label.replace('_', ' ')}
    </span>
  );
};

export default StatusBadge;
