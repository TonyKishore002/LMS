import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  ShieldCheck,
  BookMarked,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage = () => {
  const { role: routeRole } = useParams();
  const location = useLocation();
  const [selectedRole, setSelectedRole] = useState('student');
  const [email, setEmail] = useState(location.state?.registeredEmail || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (routeRole && ['student', 'librarian', 'admin'].includes(routeRole)) {
      setSelectedRole(routeRole);
    }
  }, [routeRole]);

  useEffect(() => {
    if (location.state?.registeredEmail) {
      setEmail(location.state.registeredEmail);
    }
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email.trim().toLowerCase().endsWith('@college.edu')) {
      return setError('Access restricted: Only official @college.edu email addresses are permitted.');
    }

    setLoading(true);

    try {
      const loggedInUser = await login(email, password, selectedRole);
      // Redirect based on actual user role
      if (loggedInUser.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (loggedInUser.role === 'librarian') {
        navigate('/librarian/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Authentication failed. Please verify your credentials and network connection.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getPortalInfo = () => {
    switch (selectedRole) {
      case 'admin':
        return {
          title: 'Administrator Sign In',
          description: 'Access institutional user management, library settings, and security audits.',
          icon: ShieldCheck,
          themeColor: 'purple',
          badgeText: 'System Administration',
        };
      case 'librarian':
        return {
          title: 'Librarian Sign In',
          description: 'Manage book inventory, circulation desk, issue requests, and loan returns.',
          icon: BookMarked,
          themeColor: 'teal',
          badgeText: 'Circulation Desk',
        };
      default:
        return {
          title: 'Student Sign In',
          description: 'Access academic book discovery, loan tracking, hold queues, and due reminders.',
          icon: GraduationCap,
          themeColor: 'sky',
          badgeText: 'Student Access',
        };
    }
  };

  const portal = getPortalInfo();
  const PortalIcon = portal.icon;

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Role Portal Selector Tabs */}
        <div className="glass-card p-1.5 flex gap-1 shadow-subtle">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('student');
              navigate('/login/student', { replace: true });
              setError('');
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              selectedRole === 'student'
                ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('librarian');
              navigate('/login/librarian', { replace: true });
              setError('');
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              selectedRole === 'librarian'
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span>Librarian</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('admin');
              navigate('/login/admin', { replace: true });
              setError('');
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              selectedRole === 'admin'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Main Login Card */}
        <div className="glass-panel p-8 shadow-glass">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-subtle mb-3">
              <PortalIcon className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {portal.badgeText}
            </span>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 tracking-tight">
              {portal.title}
            </h2>
            <p className="mt-1 text-xs text-slate-500">{portal.description}</p>
          </div>

          {successMessage && (
            <div className="mt-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="mt-5 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                College Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@college.edu"
                  className="glass-input pl-9 w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input pl-9 w-full"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 text-sm font-semibold mt-2"
            >
              {loading ? 'Authenticating...' : `Sign in to ${selectedRole} Portal`}
            </button>
          </form>

          {selectedRole === 'student' && (
            <div className="mt-6 pt-5 border-t border-slate-200/80 text-center text-xs text-slate-600">
              <span>New student? </span>
              <Link
                to="/register/student"
                className="font-semibold text-sky-600 hover:text-sky-700 hover:underline"
              >
                Register an account
              </Link>
            </div>
          )}

          {selectedRole === 'admin' && (
            <div className="mt-6 pt-4 border-t border-slate-200/80 text-center text-[11px] text-slate-500">
              First-time administrator? Run{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">
                npm run setup-admin
              </code>{' '}
              in the backend to provision the master account.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
