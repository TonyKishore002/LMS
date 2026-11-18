import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { DatabaseBanner } from '../components/DatabaseBanner';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <DatabaseBanner />
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      <footer className="border-t border-slate-200/60 bg-white/50 backdrop-blur-xs py-4 text-center text-xs text-slate-500">
        TK College Library Management System &copy; {new Date().getFullYear()} &middot; Production Enterprise Edition
      </footer>
    </div>
  );
};
