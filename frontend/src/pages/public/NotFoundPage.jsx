import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="glass-panel max-w-md w-full p-8 text-center shadow-glass">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center shadow-subtle mb-4">
          <HelpCircle className="w-8 h-8" />
        </div>
        <span className="badge bg-slate-100 text-slate-700 border-slate-200 uppercase tracking-wider text-[10px]">
          HTTP 404
        </span>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">Page Not Found</h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
          The academic catalog resource or library portal page you requested does not exist or has been moved.
        </p>

        <div className="mt-6 flex justify-center">
          <Link to="/" className="btn-primary text-xs py-2 px-4">
            <Home className="w-3.5 h-3.5 mr-1" />
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};
