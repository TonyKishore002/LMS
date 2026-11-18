import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ message = 'Loading catalog data...' }) => {
  return (
    <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
      <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      <span className="text-xs sm:text-sm font-medium">{message}</span>
    </div>
  );
};
