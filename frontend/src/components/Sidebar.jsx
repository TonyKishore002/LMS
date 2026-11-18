import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  BookmarkCheck,
  History,
  Bell,
  User,
  Users,
  ShieldCheck,
  Settings,
  FileText,
  PlusCircle,
  ArrowLeftRight,
  Clock,
  DollarSign,
  BarChart3,
  BookMarked,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  if (!user) return null;

  const studentLinks = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Browse Books', path: '/student/books', icon: BookOpen },
    { name: 'My Issued Books', path: '/student/issued', icon: BookmarkCheck },
    { name: 'My Reservations', path: '/student/reservations', icon: BookMarked },
    { name: 'Borrow History', path: '/student/history', icon: History },
    { name: 'Notifications', path: '/student/notifications', icon: Bell },
    { name: 'Profile & Security', path: '/student/profile', icon: User },
  ];

  const adminLinks = [
    { name: 'Admin Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Students Directory', path: '/admin/students', icon: Users },
    { name: 'Librarians Staff', path: '/admin/librarians', icon: ShieldCheck },
    { name: 'Library Settings', path: '/admin/settings', icon: Settings },
    { name: 'Security Audit Logs', path: '/admin/audit-logs', icon: FileText },
    { name: 'Analytics & Reports', path: '/admin/reports', icon: BarChart3 },
  ];

  const librarianLinks = [
    { name: 'Circulation Hub', path: '/librarian/dashboard', icon: LayoutDashboard },
    { name: 'Book Catalog', path: '/librarian/books', icon: BookOpen },
    { name: 'Add New Book', path: '/librarian/books/new', icon: PlusCircle },
    { name: 'Issue & Returns', path: '/librarian/circulation', icon: ArrowLeftRight },
    { name: 'Borrow Requests', path: '/librarian/requests', icon: Clock },
    { name: 'Overdue Tracking', path: '/librarian/overdue', icon: BookmarkCheck },
    { name: 'Fine Management', path: '/librarian/fines', icon: DollarSign },
    { name: 'Catalog Reports', path: '/librarian/reports', icon: BarChart3 },
  ];

  let currentLinks = [];
  if (user.role === 'admin') currentLinks = adminLinks;
  else if (user.role === 'librarian') currentLinks = librarianLinks;
  else currentLinks = studentLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 z-50 lg:z-10 h-screen lg:h-[calc(100vh-4rem)] w-64 glass-panel border-r border-slate-200/80 p-4 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between pb-4 mb-2 lg:hidden border-b border-slate-200/80">
          <span className="font-bold text-slate-800 text-sm tracking-tight">Portal Menu</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Identity Mini Card */}
        <div className="p-3 mb-4 rounded-xl bg-slate-100/70 border border-slate-200/70">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Active Portal
          </div>
          <div className="text-sm font-bold text-slate-800 capitalize mt-0.5">
            {user.role} Workspace
          </div>
          <div className="text-xs text-slate-500 truncate mt-0.5">{user.email}</div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {currentLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{link.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
