import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  BookmarkCheck,
  AlertTriangle,
  Clock,
  DollarSign,
  ArrowRight,
  Sparkles,
  BookMarked,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import api from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentLoans, setRecentLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get('/reports/student-dashboard');
      setStats(res.data.stats || {});
      setRecentLoans(res.data.recentLoans || []);
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    const onFocus = () => fetchDashboardData(false);
    window.addEventListener('focus', onFocus);
    const interval = setInterval(() => fetchDashboardData(false), 20000);

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [fetchDashboardData]);

  // Instantly synchronize student counts and recent loans whenever librarian or system mutates books/loans
  useRealtime((event) => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  if (loading) {
    return <LoadingSpinner message="Retrieving your student borrowing records..." />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-sky-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-100/80 text-sky-800 text-xs font-semibold mb-2">
            <Sparkles className="w-3 h-3 text-sky-600" />
            <span>Student Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Student ID: <span className="font-mono font-semibold text-slate-800">{user?.studentId || 'N/A'}</span> &middot; Department: {user?.department || 'General Academic'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="btn-secondary text-xs"
            title="Sync your borrowing records and loan status"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Sync Records
          </button>
          <Link to="/student/books" className="btn-primary text-xs sm:text-sm whitespace-nowrap">
            <BookOpen className="w-4 h-4 mr-1" />
            Browse Library Catalog
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Active Loans"
          value={stats?.currentIssued}
          subtitle="Currently checked out"
          icon={BookmarkCheck}
          color="sky"
        />
        <StatCard
          title="Due Soon"
          value={stats?.dueSoon}
          subtitle="Within 3 days"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Overdue"
          value={stats?.overdue}
          subtitle="Return immediately"
          icon={AlertTriangle}
          color="rose"
        />
        <StatCard
          title="Hold Queue"
          value={stats?.activeReservations}
          subtitle="Active reservations"
          icon={BookMarked}
          color="teal"
        />
      </div>

      {/* Outstanding Fines Notification Banner */}
      {stats?.totalUnpaidFine > 0 && (
        <div className="glass-card p-4 bg-rose-50/70 border-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900">
                Outstanding Overdue Fines: ${stats.totalUnpaidFine.toFixed(2)}
              </h4>
              <p className="text-xs text-rose-700">
                Please settle late return charges at the library counter to maintain borrowing privileges.
              </p>
            </div>
          </div>
          <Link to="/student/history" className="btn-secondary text-xs">
            Review Details
          </Link>
        </div>
      )}

      {/* Recent Borrowing Activity */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Circulation Activity</h3>
            <p className="text-xs text-slate-500">Your latest book checkouts and return receipts</p>
          </div>
          <Link
            to="/student/history"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center"
          >
            Full History <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {recentLoans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 text-left text-xs">
              <thead>
                <tr className="text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentLoans.map((loan) => (
                  <tr key={loan._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {loan.book?.title || 'Unknown Title'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{loan.book?.author || '—'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`badge ${
                          loan.status === 'issued'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : loan.status === 'returned'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : loan.status === 'requested'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        } capitalize`}
                      >
                        {loan.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No Recent Loans"
            description="You do not have any recent circulation activity. Browse our catalog to request your first book!"
            action={
              <Link to="/student/books" className="btn-primary text-xs">
                Explore Books Catalog
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
};
