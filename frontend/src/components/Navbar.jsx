import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Bell,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRealtimeContext } from '../context/RealtimeContext';
import api from '../services/api';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, isAuthenticated, dbStatus } = useAuth();
  const { connected: realtimeConnected } = useRealtimeContext();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      // Ignore if unauthenticated or network error
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'librarian':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-sky-50 text-sky-700 border-sky-200';
    }
  };

  return (
    <header className="glass-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Mobile Toggle */}
        <div className="flex items-center gap-3">
          {isAuthenticated && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg block leading-none">
                TK
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase block mt-0.5">
                Academic Library
              </span>
            </div>
          </Link>

          {/* Database & Real-Time Sync Pills */}
          <div className="hidden sm:flex items-center gap-2 ml-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/80 border border-slate-200/60 text-[11px] font-medium text-slate-600">
              <span
                className={`w-2 h-2 rounded-full ${
                  dbStatus === 'connected'
                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                    : 'bg-amber-500 animate-pulse'
                }`}
              />
              <span>{dbStatus === 'connected' ? 'Atlas DB Active' : 'DB Disconnected'}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/80 border border-slate-200/60 text-[11px] font-medium text-slate-600">
              <span
                className={`w-2 h-2 rounded-full ${
                  realtimeConnected
                    ? 'bg-sky-500 shadow-sm shadow-sky-500/50'
                    : 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                }`}
              />
              <span className="font-semibold text-slate-700">Live Sync</span>
            </div>
          </div>
        </div>

        {/* Right Navigation & Profile */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Notification Popover */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition border border-transparent hover:border-slate-200"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel p-4 shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-xs bg-sky-100 text-sky-700 rounded-full font-medium">
                            {unreadCount} unread
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-sky-600 hover:text-sky-700 font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="mt-2 max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div
                            key={n._id}
                            onClick={() => !n.isRead && handleMarkAsRead(n._id)}
                            className={`py-2.5 px-2 rounded-lg transition cursor-pointer text-left ${
                              n.isRead ? 'opacity-70 hover:opacity-100' : 'bg-sky-50/50 hover:bg-sky-50 font-medium'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                {new Date(n.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Identity & Role Badge */}
              <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-200/80 border border-slate-300 flex items-center justify-center text-slate-600 text-xs font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <span className="text-xs font-semibold text-slate-800 block leading-tight">
                    {user?.name}
                  </span>
                  <span className={`badge ${getRoleBadgeClass(user?.role)} mt-0.5 capitalize`}>
                    {user?.role}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition border border-slate-200/80"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-secondary text-xs sm:text-sm py-1.5 px-3">
                Sign In
              </Link>
              <Link to="/register/student" className="btn-primary text-xs sm:text-sm py-1.5 px-3.5">
                Register Student
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
