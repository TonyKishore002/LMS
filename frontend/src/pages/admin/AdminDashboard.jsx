import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  BookOpen,
  Layers,
  BookmarkCheck,
  AlertTriangle,
  Settings,
  FileText,
  Activity,
  ArrowRight,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { useRealtime } from '../../context/RealtimeContext';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [monthlyCirculation, setMonthlyCirculation] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAdminStats = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get('/reports/admin-dashboard');
      setStats(res.data.stats || {});
      setMonthlyCirculation(res.data.monthlyCirculation || []);
      setRecentActivity(res.data.recentActivity || []);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminStats();

    const onFocus = () => fetchAdminStats(false);
    window.addEventListener('focus', onFocus);
    const interval = setInterval(() => fetchAdminStats(false), 20000);

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [fetchAdminStats]);

  // Instantly synchronize admin metrics and recent audit logs on any live event
  useRealtime((event) => {
    fetchAdminStats(false);
  }, [fetchAdminStats]);

  if (loading) {
    return <LoadingSpinner message="Querying system telemetry and library metrics..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-purple-100">
        <div>
          <span className="badge bg-purple-100/80 text-purple-800 border-purple-200 text-xs font-semibold mb-2">
            System Administration Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Institutional Administration Overview
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Monitor system-wide circulation health, account provisioning, security events, and library policies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fetchAdminStats(true)}
            disabled={refreshing}
            className="btn-secondary text-xs"
            title="Sync latest live system telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Sync Metrics
          </button>
          <Link to="/admin/students" className="btn-primary text-xs bg-purple-600 hover:bg-purple-700 shadow-purple-600/20">
            <Users className="w-4 h-4 mr-1" />
            Manage Students
          </Link>
          <Link to="/admin/settings" className="btn-secondary text-xs">
            <Settings className="w-4 h-4 mr-1" />
            Library Policies
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Registered Students"
          value={stats?.registeredStudents}
          subtitle="Enrolled patrons"
          icon={Users}
          color="sky"
        />
        <StatCard
          title="Active Librarians"
          value={stats?.activeLibrarians}
          subtitle="Circulation staff"
          icon={ShieldCheck}
          color="purple"
        />
        <StatCard
          title="Catalog Titles"
          value={stats?.totalTitles}
          subtitle="Physical titles"
          icon={BookOpen}
          color="teal"
        />
        <StatCard
          title="Total Volumes"
          value={stats?.totalCopies}
          subtitle={`${stats?.availableCopies || 0} on shelves`}
          icon={Layers}
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Current Loans"
          value={stats?.activeIssues}
          subtitle="In student possession"
          icon={BookmarkCheck}
          color="sky"
        />
        <StatCard
          title="Overdue Loans"
          value={stats?.overdueIssues}
          subtitle="Requires attention"
          icon={AlertTriangle}
          color="rose"
        />
        <StatCard
          title="Pending Approvals"
          value={stats?.pendingRequests}
          subtitle="Awaiting desk review"
          icon={Activity}
          color="amber"
        />
        <StatCard
          title="Active Hold Queues"
          value={stats?.totalReservations}
          subtitle="Book waitlists"
          icon={UserCheck}
          color="emerald"
        />
      </div>

      {/* Two Column Layout: Recent Security Audit Trail & Policy Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-Time Security Audit Stream */}
        <div className="glass-panel p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Security &amp; Audit Trail</h3>
              <p className="text-xs text-slate-500">Live operational events recorded in MongoDB</p>
            </div>
            <Link
              to="/admin/audit-logs"
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 inline-flex items-center"
            >
              Full Audit Trail <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((log) => (
                <div
                  key={log._id}
                  className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-start justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{log.userName}</span>
                      <span className="badge bg-slate-100 text-slate-600 border-slate-200 capitalize text-[10px]">
                        {log.userRole}
                      </span>
                      <span className="font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px]">
                        {log.action}
                      </span>
                    </div>
                    {log.targetType && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        Target: {log.targetType} {log.targetId ? `(${log.targetId})` : ''}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &middot; {new Date(log.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No System Audit Events Yet"
              description="System activities such as logins and administrative changes will appear here."
            />
          )}
        </div>

        {/* Quick Administration Controls */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900">Administration Shortlinks</h3>
          <p className="text-xs text-slate-500">Quickly navigate to key administrative portals</p>

          <div className="space-y-2 pt-2">
            <Link
              to="/admin/students"
              className="block p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 transition shadow-subtle"
            >
              Student Directory &amp; Status
              <span className="text-[11px] text-slate-500 block font-normal mt-0.5">
                View enrolled accounts, search students, toggle active status.
              </span>
            </Link>

            <Link
              to="/admin/librarians"
              className="block p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 transition shadow-subtle"
            >
              Librarian Staff Management
              <span className="text-[11px] text-slate-500 block font-normal mt-0.5">
                Provision new librarians, manage credentials and permissions.
              </span>
            </Link>

            <Link
              to="/admin/settings"
              className="block p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 transition shadow-subtle"
            >
              Circulation Rules &amp; Fine Policies
              <span className="text-[11px] text-slate-500 block font-normal mt-0.5">
                Configure loan duration (days), max borrow limits, and daily overdue rates.
              </span>
            </Link>

            <Link
              to="/admin/audit-logs"
              className="block p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 transition shadow-subtle"
            >
              Full Security Event Logs
              <span className="text-[11px] text-slate-500 block font-normal mt-0.5">
                Filter and inspect security audits with IP timestamps.
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
