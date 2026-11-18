import React, { useState, useEffect } from 'react';
import { FileText, Search, Shield, Filter, Clock } from 'lucide-react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { Pagination } from '../../components/Pagination';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [actionTypes, setActionTypes] = useState([]);
  const [selectedAction, setSelectedAction] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedAction) params.append('action', selectedAction);
      if (search.trim()) params.append('search', search.trim());
      params.append('page', page);
      params.append('limit', '20');

      const res = await api.get(`/audit-logs?${params.toString()}`);
      setLogs(res.data.logs || []);
      setActionTypes(res.data.actionTypes || []);
      setTotalPages(res.data.pages || 1);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      console.error(err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, selectedAction]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security &amp; Operational Audit Trail</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Immutable logging of system authentication, catalog mutations, and administrative policy changes.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user name, action, or target ID..."
              className="glass-input pl-10 w-full"
            />
          </div>
          <button type="submit" className="btn-secondary text-xs px-4">
            Filter
          </button>
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setPage(1);
            }}
            className="glass-input text-xs"
          >
            <option value="">All Action Types</option>
            {actionTypes.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <LoadingSpinner message="Querying security audit logs from MongoDB..." />
      ) : logs.length > 0 ? (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 text-left text-xs">
              <thead className="bg-slate-50/50">
                <tr className="text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Target Type &amp; Details</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-semibold text-slate-800">{log.userName}</td>
                    <td className="py-3 px-4">
                      <span className="badge bg-slate-100 text-slate-700 capitalize text-[10px]">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-purple-700">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {log.targetType ? `${log.targetType} ` : ''}
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {log.ipAddress || 'Internal'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No Audit Logs Recorded"
          description="Operational actions and logins will appear here as they are performed in the system."
        />
      )}
    </div>
  );
};
