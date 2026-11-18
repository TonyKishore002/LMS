import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Mail,
} from 'lucide-react';
import api from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { Pagination } from '../../components/Pagination';
import { Modal } from '../../components/Modal';

export const LibrarianManagement = () => {
  const [librarians, setLibrarians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  // Create Librarian Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    staffId: '',
    department: 'Library Services',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchLibrarians = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('role', 'librarian');
      if (search.trim()) params.append('search', search.trim());
      params.append('page', page);
      params.append('limit', '15');

      const res = await api.get(`/users?${params.toString()}`);
      setLibrarians(res.data.users || []);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error(err);
      setLibrarians([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrarians();
  }, [page]);

  useRealtime((event) => {
    if (event.type === 'USER_MUTATION') {
      fetchLibrarians();
    }
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLibrarians();
  };

  const handleToggleStatus = async (user) => {
    const action = user.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${user.name}'s librarian account?`)) {
      return;
    }

    try {
      await api.patch(`/users/${user._id}/status`);
      fetchLibrarians();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update account status');
    }
  };

  const handleCreateLibrarian = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim().toLowerCase().endsWith('@college.edu')) {
      return setError('Only @college.edu email addresses are permitted.');
    }

    setSubmitting(true);

    try {
      await api.post('/users', {
        ...formData,
        role: 'librarian',
      });
      setShowModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        staffId: '',
        department: 'Library Services',
        phone: '',
      });
      fetchLibrarians();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to provision librarian');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Librarian Staff Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Provision circulation staff accounts, grant catalogue permissions, and monitor active status.
          </p>
        </div>

        <button
          onClick={() => {
            setShowModal(true);
            setError('');
          }}
          className="btn-primary text-xs bg-purple-600 hover:bg-purple-700 shadow-purple-600/20 whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4 mr-1" />
          Provision New Librarian
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 flex gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by librarian name, staff ID, or email..."
              className="glass-input pl-10 w-full"
            />
          </div>
          <button type="submit" className="btn-secondary text-xs px-4">
            Filter
          </button>
        </form>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner message="Querying librarian directory..." />
      ) : librarians.length > 0 ? (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 text-left text-xs">
              <thead className="bg-slate-50/50">
                <tr className="text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Librarian Staff</th>
                  <th className="py-3 px-4">Staff ID</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Appointed Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {librarians.map((lib) => (
                  <tr key={lib._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{lib.name}</div>
                      <div className="text-[11px] text-slate-500">{lib.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {lib.staffId || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {lib.department || 'Library Services'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`badge ${
                          lib.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {lib.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(lib.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(lib)}
                        className={`inline-flex items-center p-1.5 rounded-lg border border-slate-200/80 ${
                          lib.isActive
                            ? 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                            : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title={lib.isActive ? 'Deactivate Librarian' : 'Activate Librarian'}
                      >
                        {lib.isActive ? (
                          <XCircle className="w-3.5 h-3.5" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                      </button>
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
          icon={ShieldCheck}
          title="No Librarians Provisioned"
          description="Provision librarian staff to delegate catalog and circulation responsibilities."
          action={
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary text-xs bg-purple-600 hover:bg-purple-700"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Provision First Librarian
            </button>
          }
        />
      )}

      {/* Provision Librarian Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Provision Librarian Staff Account"
      >
        <form onSubmit={handleCreateLibrarian} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Staff Member Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Dr. Robert Vance"
              className="glass-input w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Institutional Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="librarian@college.edu"
                className="glass-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Staff ID *</label>
              <input
                type="text"
                required
                value={formData.staffId}
                onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                placeholder="LIB-2026-001"
                className="glass-input w-full font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Library Technical Services"
                className="glass-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial Password *</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="glass-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Desk Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Ext. 4022"
              className="glass-input w-full"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs bg-purple-600 hover:bg-purple-700"
            >
              {submitting ? 'Provisioning...' : 'Appoint Librarian'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
