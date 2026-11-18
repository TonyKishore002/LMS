import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  BookOpen,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Search,
  Check,
} from 'lucide-react';
import api from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { Pagination } from '../../components/Pagination';

export const CirculationHub = () => {
  const [activeTab, setActiveTab] = useState('issued'); // 'issue', 'issued', 'history'
  const [issuedLoans, setIssuedLoans] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  // Direct checkout state
  const [checkoutData, setCheckoutData] = useState({
    bookId: '',
    studentIdentifier: '',
    notes: '',
  });
  const [availableBooks, setAvailableBooks] = useState([]);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Fetch active issued loans for check-in
  const fetchIssuedLoans = async () => {
    setLoadingLoans(true);
    try {
      const params = new URLSearchParams();
      if (activeTab === 'issued') params.append('status', 'issued');
      params.append('page', page);
      params.append('limit', '15');

      const res = await api.get(`/circulation?${params.toString()}`);
      setIssuedLoans(res.data.transactions || []);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error(err);
      setIssuedLoans([]);
    } finally {
      setLoadingLoans(false);
    }
  };

  // Fetch available books for checkout dropdown
  const fetchAvailableBooks = async () => {
    try {
      const res = await api.get('/books?availableOnly=true&limit=50');
      setAvailableBooks(res.data.books || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'issue') {
      fetchAvailableBooks();
    } else {
      fetchIssuedLoans();
    }
  }, [activeTab, page]);

  useRealtime((event) => {
    if (event.type === 'CIRCULATION_MUTATION' || event.type === 'BOOK_MUTATION') {
      if (activeTab === 'issue') {
        fetchAvailableBooks();
      } else {
        fetchIssuedLoans();
      }
    }
  });

  const handleDirectCheckout = async (e) => {
    e.preventDefault();
    setFeedback(null);
    setCheckoutSubmitting(true);

    try {
      const res = await api.post('/circulation/issue-direct', checkoutData);
      setFeedback({
        type: 'success',
        text: `Book successfully issued! Due date: ${new Date(
          res.data.transaction.dueDate
        ).toLocaleDateString()}`,
      });
      setCheckoutData({ bookId: '', studentIdentifier: '', notes: '' });
      fetchAvailableBooks();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to complete checkout',
      });
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const handleReturnBook = async (transaction) => {
    const confirmed = window.confirm(
      `Confirm check-in and return of "${transaction.book?.title}" from ${transaction.student?.name}?`
    );
    if (!confirmed) return;

    try {
      const res = await api.post(`/circulation/${transaction._id}/return`);
      const fineMsg =
        res.data.fineAmount > 0
          ? ` Overdue fine assessed: $${res.data.fineAmount.toFixed(2)}.`
          : '';
      alert(`Book returned successfully!${fineMsg}`);
      fetchIssuedLoans();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to return book');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Circulation Desk Operations</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Issue books to students, check in returns, calculate late fines, and track custody.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab('issued');
            setPage(1);
          }}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'issued'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Active Loans / Returns
        </button>

        <button
          onClick={() => {
            setActiveTab('issue');
            setFeedback(null);
          }}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'issue'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Direct Counter Checkout
        </button>

        <button
          onClick={() => {
            setActiveTab('all');
            setPage(1);
          }}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'all'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          All Circulation Logs
        </button>
      </div>

      {/* Tab: Direct Checkout */}
      {activeTab === 'issue' && (
        <div className="max-w-2xl glass-panel p-6 sm:p-8 space-y-5">
          <h3 className="text-base font-bold text-slate-900">Direct Student Checkout</h3>
          <p className="text-xs text-slate-500">
            Issue a physical book on the spot to an active enrolled student.
          </p>

          {feedback && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          <form onSubmit={handleDirectCheckout} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select Available Book *
              </label>
              <select
                required
                value={checkoutData.bookId}
                onChange={(e) =>
                  setCheckoutData({ ...checkoutData, bookId: e.target.value })
                }
                className="glass-input w-full"
              >
                <option value="">-- Choose a book in stock --</option>
                {availableBooks.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.title} (ISBN: {b.isbn}) — {b.availableCopies} available
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Student ID or College Email *
              </label>
              <input
                type="text"
                required
                value={checkoutData.studentIdentifier}
                onChange={(e) =>
                  setCheckoutData({ ...checkoutData, studentIdentifier: e.target.value })
                }
                placeholder="e.g. STU-2026-042 or student@college.edu"
                className="glass-input w-full font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Checkout Notes (Optional)
              </label>
              <textarea
                rows="2"
                value={checkoutData.notes}
                onChange={(e) =>
                  setCheckoutData({ ...checkoutData, notes: e.target.value })
                }
                placeholder="Course reference or condition notes..."
                className="glass-input w-full"
              />
            </div>

            <button
              type="submit"
              disabled={checkoutSubmitting}
              className="btn-primary text-xs bg-teal-600 hover:bg-teal-700 py-2.5 px-6"
            >
              <Check className="w-4 h-4 mr-1" />
              {checkoutSubmitting ? 'Checking Out...' : 'Confirm Book Checkout'}
            </button>
          </form>
        </div>
      )}

      {/* Tab: Active Loans (Check-in / Returns) or All Circulation */}
      {(activeTab === 'issued' || activeTab === 'all') && (
        <div>
          {loadingLoans ? (
            <LoadingSpinner message="Loading circulation records..." />
          ) : issuedLoans.length > 0 ? (
            <div className="glass-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200/80 text-left text-xs">
                  <thead className="bg-slate-50/50">
                    <tr className="text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Book Title</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Issue Date</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {issuedLoans.map((tx) => {
                      const isOverdue =
                        tx.status === 'issued' &&
                        tx.dueDate &&
                        new Date(tx.dueDate) < new Date();

                      return (
                        <tr key={tx._id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800">{tx.book?.title}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              ISBN: {tx.book?.isbn}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">
                              {tx.student?.name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {tx.student?.studentId || tx.student?.email}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`badge ${
                                isOverdue
                                  ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold'
                                  : tx.status === 'issued'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : tx.status === 'returned'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              } capitalize`}
                            >
                              {isOverdue ? 'OVERDUE' : tx.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {tx.issueDate
                              ? new Date(tx.issueDate).toLocaleDateString()
                              : '—'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`font-medium ${
                                isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'
                              }`}
                            >
                              {tx.dueDate ? new Date(tx.dueDate).toLocaleDateString() : '—'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {tx.status === 'issued' && (
                              <button
                                onClick={() => handleReturnBook(tx)}
                                className="btn-secondary text-xs text-teal-700 hover:bg-teal-50 border-teal-200 py-1.5 px-3"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
                                Check In Return
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
              icon={ArrowLeftRight}
              title="No Loans Found"
              description="There are currently no active circulation records in this category."
            />
          )}
        </div>
      )}
    </div>
  );
};
