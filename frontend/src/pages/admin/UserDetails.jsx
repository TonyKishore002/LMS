import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Shield, CheckCircle2, XCircle, BookmarkCheck, Clock, BookMarked } from 'lucide-react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const UserDetails = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [borrowingOverview, setBorrowingOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`/users/${id}`);
        setUser(res.data.user);
        setBorrowingOverview(res.data.borrowingOverview);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Retrieving account dossier..." />;
  }

  if (!user) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        User account not found.{' '}
        <Link to="/admin/students" className="text-purple-600 underline">
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          to="/admin/students"
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Account Profile</h1>
          <p className="text-xs text-slate-500">Institutional record and circulation metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="glass-panel p-6 space-y-4 md:col-span-1">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl shadow-subtle">
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">{user.name}</h3>
            <span className="badge bg-purple-50 text-purple-700 border-purple-200 capitalize mt-1 text-[11px]">
              {user.role}
            </span>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Email</span>
              <span className="font-medium text-slate-800">{user.email}</span>
            </div>
            {user.studentId && (
              <div>
                <span className="text-slate-400 block text-[11px]">Student ID</span>
                <span className="font-mono font-medium text-slate-800">{user.studentId}</span>
              </div>
            )}
            {user.staffId && (
              <div>
                <span className="text-slate-400 block text-[11px]">Staff ID</span>
                <span className="font-mono font-medium text-slate-800">{user.staffId}</span>
              </div>
            )}
            <div>
              <span className="text-slate-400 block text-[11px]">Department</span>
              <span className="font-medium text-slate-800">{user.department || 'General'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Status</span>
              <span className={user.isActive ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                {user.isActive ? 'Active' : 'Deactivated'}
              </span>
            </div>
          </div>
        </div>

        {/* Borrowing Overview */}
        <div className="glass-panel p-6 md:col-span-2 space-y-5">
          <h3 className="text-base font-bold text-slate-900">Borrowing Ledger &amp; Circulation History</h3>

          {borrowingOverview ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-4">
                <span className="text-xs text-slate-500">Total Lifetime Loans</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {borrowingOverview.totalBorrowed}
                </div>
              </div>
              <div className="glass-card p-4">
                <span className="text-xs text-slate-500">Currently Checked Out</span>
                <div className="text-2xl font-bold text-sky-600 mt-1">
                  {borrowingOverview.currentIssued}
                </div>
              </div>
              <div className="glass-card p-4">
                <span className="text-xs text-slate-500">Overdue Unreturned</span>
                <div className="text-2xl font-bold text-rose-600 mt-1">
                  {borrowingOverview.overdue}
                </div>
              </div>
              <div className="glass-card p-4">
                <span className="text-xs text-slate-500">Active Reservations</span>
                <div className="text-2xl font-bold text-teal-600 mt-1">
                  {borrowingOverview.reservations}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 p-6 text-center">
              This account has staff or administrator privileges and does not participate in student circulation loans.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
