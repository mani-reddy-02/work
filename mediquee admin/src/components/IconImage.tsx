import React, { useState } from 'react';
import { resolveIconUrl } from '../utils/iconUtils';
import { Activity } from 'lucide-react';

interface IconImageProps {
  icon?: string | null;
  name?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  rounded?: string;
}

export const IconImage: React.FC<IconImageProps> = ({
  icon,
  name,
  className = '',
  size = 'md',
  rounded = 'rounded-xl'
}) => {
  const [hasError, setHasError] = useState(false);
  const resolvedUrl = resolveIconUrl(icon, name);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14'
  }[size];

  const initial = name ? name.trim().charAt(0).toUpperCase() : '+';

  if (hasError) {
    return (
      <div
        className={`${sizeClasses} ${rounded} bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0 ${className}`}
        title={name || 'Icon'}
      >
        {initial !== '+' ? initial : <Activity className="w-5 h-5" />}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} ${rounded} bg-white border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0 p-1.5 ${className}`}
    >
      <img
        src={resolvedUrl}
        alt={name || 'Department / Disease Icon'}
        className="w-full h-full object-contain"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </div>
  );
};
