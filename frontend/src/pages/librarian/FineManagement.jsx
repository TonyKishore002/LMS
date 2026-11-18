import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle2, ShieldOff, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { Pagination } from '../../components/Pagination';

export const FineManagement = () => {
  const [fines, setFines] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchFines = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', page);
      params.append('limit', '15');

      const res = await api.get(`/fines?${params.toString()}`);
      setFines(res.data.fines || []);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error(err);
      setFines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, [statusFilter, page]);

  const handlePay = async (id) => {
    if (!window.confirm('Confirm payment receipt for this fine?')) return;
    try {
      await api.patch(`/fines/${id}/pay`);
      fetchFines();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleWaive = async (id) => {
    if (!window.confirm('Are you sure you want to officially waive this fine penalty?')) return;
    try {
      await api.patch(`/fines/${id}/waive`);
      fetchFines();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to waive fine');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fine &amp; Penalty Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track assessed late return penalties, record desk payments, and authorize waivers.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="glass-input text-xs"
        >
          <option value="">All Payment Statuses</option>
          <option value="unpaid">Unpaid Only</option>
          <option value="paid">Paid Only</option>
          <option value="waived">Waived Only</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading fine ledgers..." />
      ) : fines.length > 0 ? (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 text-left text-xs">
              <thead className="bg-slate-50/50">
                <tr className="text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Associated Book</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fines.map((f) => (
                  <tr key={f._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{f.student?.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {f.student?.studentId || f.student?.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {f.transaction?.book?.title || 'Catalog Item'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ${f.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{f.reason}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`badge ${
                          f.paidStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : f.paidStatus === 'waived'
                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
                        } capitalize`}
                      >
                        {f.paidStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      {f.paidStatus === 'unpaid' && (
                        <>
                          <button
                            onClick={() => handlePay(f._id)}
                            className="btn-secondary text-xs text-emerald-700 hover:bg-emerald-50 border-emerald-200 py-1 px-2.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark Paid
                          </button>
                          <button
                            onClick={() => handleWaive(f._id)}
                            className="btn-secondary text-xs text-slate-600 hover:bg-slate-100 py-1 px-2"
                          >
                            Waive
                          </button>
                        </>
                      )}
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
          icon={DollarSign}
          title="No Fine Records"
          description="There are currently no overdue fines matching the selected filter."
        />
      )}
    </div>
  );
};
