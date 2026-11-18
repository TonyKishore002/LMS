import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { DatabaseBanner } from '../components/DatabaseBanner';

export const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <DatabaseBanner />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200/60 bg-white/50 backdrop-blur-xs py-6 text-center text-xs text-slate-500">
        TK College Library Management System &middot; Institutional Academic Portal &middot; Secured via Supabase PostgreSQL
      </footer>
    </div>
  );
};
