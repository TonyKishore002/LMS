import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  ArrowLeftRight,
  Clock,
  AlertTriangle,
  PlusCircle,
  CheckCircle2,
  BookmarkCheck,
  Layers,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { useRealtime } from '../../context/RealtimeContext';

export const LibrarianDashboard = () => {
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [recentCirculation, setRecentCirculation] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bannerMessage, setBannerMessage] = useState(location.state?.successMessage || '');

  const fetchStats = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get('/reports/librarian-dashboard');
      setStats(res.data.stats || {});
      setRecentCirculation(res.data.recentCirculation || []);
      setCategoryBreakdown(res.data.categoryBreakdown || []);
    } catch (err) {
      console.error('Failed to load librarian stats:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Auto-sync when tab gains focus or on interval
    const onFocus = () => fetchStats(false);
    window.addEventListener('focus', onFocus);
    const interval = setInterval(() => fetchStats(false), 20000);

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [fetchStats]);

  // Instantly synchronize librarian dashboard metrics on any live library event
  useRealtime((event) => {
    fetchStats(false);
  }, [fetchStats]);

  if (loading) {
    return <LoadingSpinner message="Aggregating circulation data and book inventory..." />;
  }

  return (
    <div className="space-y-6">
      {/* Success Notification Banner (e.g. after adding book) */}
      {bannerMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between shadow-subtle animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{bannerMessage}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/librarian/books" className="underline text-emerald-700 hover:text-emerald-900 font-medium">
              View Catalog &rarr;
            </Link>
            <button
              onClick={() => setBannerMessage('')}
              className="text-emerald-600 hover:text-emerald-900 font-bold text-sm px-1"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-teal-100">
        <div>
          <span className="badge bg-teal-100/80 text-teal-800 border-teal-200 text-xs font-semibold mb-2">
            Circulation Operations Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Librarian Workspace
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Real-time catalog inventory, circulation desk operations, student loan requests, and due date monitoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="btn-secondary text-xs"
            title="Refresh latest stock and loan counts"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Sync Stock
          </button>
          <Link to="/librarian/books/new" className="btn-primary text-xs bg-teal-600 hover:bg-teal-700 shadow-teal-600/20">
            <PlusCircle className="w-4 h-4 mr-1" />
            Add New Book
          </Link>
          <Link to="/librarian/circulation" className="btn-secondary text-xs">
            <ArrowLeftRight className="w-4 h-4 mr-1" />
            Checkout / Checkin
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          title="Catalog Titles"
          value={stats?.totalTitles}
          subtitle="Distinct books"
          icon={BookOpen}
          color="teal"
        />
        <StatCard
          title="Physical Copies"
          value={stats?.totalCopies}
          subtitle="Total volumes"
          icon={Layers}
          color="sky"
        />
        <StatCard
          title="Available Stock"
          value={stats?.availableCopies}
          subtitle="On shelves"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Active Loans"
          value={stats?.issuedCopies}
          subtitle="With students"
          icon={BookmarkCheck}
          color="indigo"
        />
        <StatCard
          title="Pending Requests"
          value={stats?.pendingRequests}
          subtitle="Awaiting review"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Overdue Loans"
          value={stats?.overdueBooks}
          subtitle="Past due date"
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* Action shortcuts if pending requests */}
      {stats?.pendingRequests > 0 && (
        <div className="glass-card p-4 bg-amber-50/70 border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                {stats.pendingRequests} Student Borrow Request(s) Pending
              </h4>
              <p className="text-xs text-amber-700">
                Review and approve student borrowing requests to dispatch physical copies.
              </p>
            </div>
          </div>
          <Link to="/librarian/requests" className="btn-primary text-xs bg-amber-600 hover:bg-amber-700">
            Review Requests
          </Link>
        </div>
      )}

      {/* 2-Column Section: Category Distribution & Recent Circulation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution */}
        <div className="glass-panel p-6 lg:col-span-1">
          <h3 className="text-base font-bold text-slate-900 mb-1">Catalog Breakdown</h3>
          <p className="text-xs text-slate-500 mb-4">Inventory representation by category</p>

          {categoryBreakdown.length > 0 ? (
            <div className="space-y-3">
              {categoryBreakdown.map((cat) => (
                <div key={cat._id} className="text-xs">
                  <div className="flex justify-between font-medium text-slate-700 mb-1">
                    <span>{cat._id || 'Uncategorized'}</span>
                    <span>
                      {cat.count} titles &middot; {cat.copies} copies
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-teal-500 h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (cat.copies / (stats?.totalCopies || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-6 text-center">
              No categories populated yet.
            </div>
          )}
        </div>

        {/* Recent Circulation Feed */}
        <div className="glass-panel p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Live Circulation Stream</h3>
              <p className="text-xs text-slate-500">Real transactions executed across the system</p>
            </div>
            <Link
              to="/librarian/circulation"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center"
            >
              Circulation Desk <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {recentCirculation.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200/80 text-left text-xs">
                <thead>
                  <tr className="text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Book</th>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentCirculation.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {tx.book?.title || 'Unknown Item'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {tx.student?.name} ({tx.student?.studentId || 'ID N/A'})
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`badge ${
                            tx.status === 'issued'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : tx.status === 'returned'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : tx.status === 'requested'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          } capitalize`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No Circulation Transactions Yet"
              description="Check out a book or approve pending student requests to record circulation transactions."
            />
          )}
        </div>
      </div>
    </div>
  );
};
