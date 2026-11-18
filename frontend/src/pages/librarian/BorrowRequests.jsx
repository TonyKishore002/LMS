import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle, BookMarked, User } from 'lucide-react';
import api from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { Modal } from '../../components/Modal';

export const BorrowRequests = () => {
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'reservations'
  const [requests, setRequests] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Rejection modal
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'requests') {
        const res = await api.get('/circulation?status=requested&limit=50');
        setRequests(res.data.transactions || []);
      } else {
        const res = await api.get('/reservations?status=pending&limit=50');
        setReservations(res.data.reservations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useRealtime((event) => {
    if (event.type === 'CIRCULATION_MUTATION' || event.type === 'RESERVATION_MUTATION') {
      fetchData();
    }
  });

  const handleApprove = async (tx) => {
    if (tx.book?.availableCopies <= 0) {
      alert('Cannot approve request: zero physical copies currently available on shelves.');
      return;
    }

    try {
      await api.post(`/circulation/${tx._id}/approve`);
      alert(`Request approved! Book issued to ${tx.student?.name}.`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingItem) return;
    setSubmitting(true);

    try {
      await api.post(`/circulation/${rejectingItem._id}/reject`, {
        reason: rejectReason,
      });
      setRejectingItem(null);
      setRejectReason('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to decline request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Requests &amp; Holds</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review pending borrow requests and manage book hold waiting queues.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('requests')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'requests'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Pending Borrow Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('reservations')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'reservations'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Active Hold Queues ({reservations.length})
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Checking queue requests..." />
      ) : activeTab === 'requests' ? (
        requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((req) => {
              const hasCopies = req.book?.availableCopies > 0;
              return (
                <div
                  key={req._id}
                  className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="badge bg-amber-50 text-amber-700 border-amber-200">
                        Pending Librarian Approval
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          hasCopies ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {req.book?.availableCopies} copies on shelf
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{req.book?.title}</h3>
                    <p className="text-xs text-slate-600">
                      Requested by: <span className="font-semibold text-slate-800">{req.student?.name}</span>{' '}
                      (ID: {req.student?.studentId || 'N/A'}) &middot; {req.student?.email}
                    </p>

                    {req.notes && (
                      <p className="text-xs text-slate-500 italic mt-1">
                        &ldquo;{req.notes}&rdquo;
                      </p>
                    )}

                    <div className="text-[11px] text-slate-400 pt-1">
                      Submitted on: {new Date(req.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleApprove(req)}
                      disabled={!hasCopies}
                      className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve &amp; Issue
                    </button>
                    <button
                      onClick={() => {
                        setRejectingItem(req);
                        setRejectReason('');
                      }}
                      className="btn-secondary text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Clock}
            title="No Pending Borrow Requests"
            description="There are currently no student requests awaiting librarian approval."
          />
        )
      ) : reservations.length > 0 ? (
        <div className="space-y-4">
          {reservations.map((res) => (
            <div
              key={res._id}
              className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="badge bg-teal-50 text-teal-700 border-teal-200 font-semibold">
                    Queue Position #{res.priorityNumber || 1}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    ISBN: {res.book?.isbn}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{res.book?.title}</h3>
                <p className="text-xs text-slate-600">
                  Student: {res.student?.name} ({res.student?.studentId || 'N/A'})
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Reserved on {new Date(res.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="text-xs text-slate-500">
                Automatic hold assignment on book check-in
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookMarked}
          title="No Active Reservations"
          description="There are currently no books in the waiting reservation queues."
        />
      )}

      {/* Decline Reason Modal */}
      <Modal
        isOpen={!!rejectingItem}
        onClose={() => setRejectingItem(null)}
        title="Decline Borrow Request"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Please provide a reason for declining{' '}
            <strong className="text-slate-800">{rejectingItem?.student?.name}&apos;s</strong> request
            for <strong className="text-slate-800">{rejectingItem?.book?.title}</strong>.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Decline Reason</label>
            <textarea
              rows="3"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Physical copy reserved for course reserve desk / student has reached loan limit"
              className="glass-input w-full"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setRejectingItem(null)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectConfirm}
              disabled={submitting}
              className="btn-danger text-xs"
            >
              {submitting ? 'Declining...' : 'Confirm Decline'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
