import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  Hash,
} from 'lucide-react';
import api from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { Pagination } from '../../components/Pagination';
import { Modal } from '../../components/Modal';

export const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create Student Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    department: '',
    phone: '',
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('role', 'student');
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', page);
      params.append('limit', '15');

      const res = await api.get(`/users?${params.toString()}`);
      setStudents(res.data.users || []);
      setTotalPages(res.data.pages || 1);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      console.error(err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, statusFilter]);

  useRealtime((event) => {
    if (event.type === 'USER_MUTATION') {
      fetchStudents();
    }
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleToggleStatus = async (user) => {
    const action = user.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${user.name}'s student account?`)) {
      return;
    }

    try {
      await api.patch(`/users/${user._id}/status`);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update account status');
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!createData.email.trim().toLowerCase().endsWith('@college.edu')) {
      return setCreateError('Only @college.edu email addresses are permitted.');
    }

    setCreateSubmitting(true);

    try {
      await api.post('/users', {
        ...createData,
        role: 'student',
      });
      setShowCreateModal(false);
      setCreateData({
        name: '',
        email: '',
        password: '',
        studentId: '',
        department: '',
        phone: '',
      });
      fetchStudents();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create student account');
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Accounts Directory</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage student registrations, activate or suspend accounts, and inspect borrowing limits.
          </p>
        </div>

        <button
          onClick={() => {
            setShowCreateModal(true);
            setCreateError('');
          }}
          className="btn-primary text-xs bg-purple-600 hover:bg-purple-700 shadow-purple-600/20 whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4 mr-1" />
          Provision New Student
        </button>
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
              placeholder="Search by student name, ID number, or college email..."
              className="glass-input pl-10 w-full"
            />
          </div>
          <button type="submit" className="btn-secondary text-xs px-4">
            Filter
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="glass-input text-xs"
        >
          <option value="">All Account Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Suspended / Deactivated</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner message="Querying student directory..." />
      ) : students.length > 0 ? (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 text-left text-xs">
              <thead className="bg-slate-50/50">
                <tr className="text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Enrolled Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{student.name}</div>
                      <div className="text-[11px] text-slate-500">{student.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {student.studentId || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {student.department || 'General'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`badge ${
                          student.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {student.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <Link
                        to={`/admin/users/${student._id}`}
                        className="inline-flex items-center p-1.5 rounded-lg text-slate-600 hover:text-purple-700 hover:bg-purple-50 border border-slate-200/80"
                        title="View Full Profile & Borrowing Stats"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleToggleStatus(student)}
                        className={`inline-flex items-center p-1.5 rounded-lg border border-slate-200/80 ${
                          student.isActive
                            ? 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                            : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title={student.isActive ? 'Deactivate Student' : 'Activate Student'}
                      >
                        {student.isActive ? (
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
          icon={Users}
          title="No Students Found"
          description="There are currently no student accounts matching your filter."
        />
      )}

      {/* Provision Student Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Provision Student Account"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
          {createError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={createData.name}
              onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
              placeholder="Full legal student name"
              className="glass-input w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">College Email *</label>
              <input
                type="email"
                required
                value={createData.email}
                onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                placeholder="student@college.edu"
                className="glass-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Student ID *</label>
              <input
                type="text"
                required
                value={createData.studentId}
                onChange={(e) => setCreateData({ ...createData, studentId: e.target.value })}
                placeholder="STU-2026-001"
                className="glass-input w-full font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={createData.department}
                onChange={(e) => setCreateData({ ...createData, department: e.target.value })}
                placeholder="e.g. Physics"
                className="glass-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial Password *</label>
              <input
                type="password"
                required
                value={createData.password}
                onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
                placeholder="••••••••"
                className="glass-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
            <input
              type="tel"
              value={createData.phone}
              onChange={(e) => setCreateData({ ...createData, phone: e.target.value })}
              placeholder="+1 555-0123"
              className="glass-input w-full"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSubmitting}
              className="btn-primary text-xs bg-purple-600 hover:bg-purple-700"
            >
              {createSubmitting ? 'Creating...' : 'Provision Student'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
