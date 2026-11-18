import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UnauthorizedPage = () => {
  const { user } = useAuth();

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'librarian') return '/librarian/dashboard';
    return '/student/dashboard';
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="glass-panel max-w-md w-full p-8 text-center shadow-glass">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shadow-subtle mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <span className="badge bg-rose-50 text-rose-700 border-rose-200 uppercase tracking-wider text-[10px]">
          HTTP 403 Forbidden
        </span>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">Access Denied</h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
          You do not have the required role-based authorization to access this dashboard or API resource.
          {user && (
            <span className="block mt-1 font-medium text-slate-700">
              Your active role is: <span className="capitalize">{user.role}</span>.
            </span>
          )}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <Link to={getDashboardLink()} className="btn-primary text-xs py-2 px-4">
            <Home className="w-3.5 h-3.5 mr-1" />
            Go to Your Dashboard
          </Link>
          <Link to="/" className="btn-secondary text-xs py-2 px-4">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Public Home
          </Link>
        </div>
      </div>
    </div>
  );
};
