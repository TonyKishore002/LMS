import React, { useState } from 'react';
import { User, Lock, Mail, Hash, Building, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export const StudentProfile = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      return setMessage({ type: 'error', text: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
    }

    setLoading(true);

    try {
      const res = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setMessage({ type: 'success', text: res.data.message || 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update password',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Profile &amp; Security</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review your enrolled institutional account information and manage credential security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Details Card */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{user?.name}</h3>
              <span className="badge bg-sky-50 text-sky-700 border-sky-200 uppercase text-[10px]">
                Enrolled Student
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block">Student ID Number</span>
              <span className="font-mono font-semibold text-slate-800 text-sm">
                {user?.studentId || 'Not Assigned'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block">College Email</span>
              <span className="font-medium text-slate-800">{user?.email}</span>
            </div>

            <div>
              <span className="text-slate-400 block">Academic Department</span>
              <span className="font-medium text-slate-800">{user?.department || 'General'}</span>
            </div>

            <div>
              <span className="text-slate-400 block">Contact Phone</span>
              <span className="font-medium text-slate-800">{user?.phone || 'Not Provided'}</span>
            </div>

            <div>
              <span className="text-slate-400 block">Account Status</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active &amp; Good Standing
              </span>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="glass-panel p-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200/80 mb-4">
            <Lock className="w-4 h-4 text-slate-500" />
            <h3 className="text-base font-bold text-slate-900">Security Credentials</h3>
          </div>

          {message && (
            <div
              className={`mb-4 p-3 rounded-lg border text-xs flex items-start gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="glass-input w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="glass-input w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="glass-input w-full text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-xs py-2 mt-2"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
