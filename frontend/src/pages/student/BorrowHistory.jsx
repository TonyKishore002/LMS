import React, { useState, useEffect } from 'react';
import { History, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';

export const BorrowHistory = () => {
  const [history, setHistory] = useState([]);
  const [fines, setFines] = useState([]);
  const [activeTab, setActiveTab] = useState('loans');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistoryData = async () => {
      try {
        const [histRes, fineRes] = await Promise.all([
          api.get('/circulation/my-history'),
          api.get('/fines/my-fines'),
        ]);
        setHistory(histRes.data.transactions || []);
        setFines(fineRes.data.fines || []);
      } catch (err) {
        console.error('Failed to fetch borrowing history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistoryData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Retrieving borrowing history logs..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Circulation History &amp; Fines</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Complete historical audit log of your academic borrowing activity and fee ledger.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('loans')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'loans'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Borrowing Records ({history.length})
        </button>
        <button
          onClick={() => setActiveTab('fines')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'fines'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Overdue Fines &amp; Receipts ({fines.length})
        </button>
      </div>

      {activeTab === 'loans' ? (
        history.length > 0 ? (
          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200/80 text-left text-xs">
                <thead className="bg-slate-50/50">
                  <tr className="text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Book Title</th>
                    <th className="py-3 px-4">ISBN</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Issued On</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Returned On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{item.book?.title}</div>
                        <div className="text-[11px] text-slate-400">by {item.book?.author}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{item.book?.isbn}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`badge ${
                            item.status === 'returned'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : item.status === 'issued'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : item.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          } capitalize`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {item.issueDate ? new Date(item.issueDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {item.returnDate ? new Date(item.returnDate).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={History}
            title="No Borrowing History Found"
            description="You have not borrowed or returned any library books yet."
          />
        )
      ) : fines.length > 0 ? (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 text-left text-xs">
              <thead className="bg-slate-50/50">
                <tr className="text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Assessed Date</th>
                  <th className="py-3 px-4">Payment Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fines.map((f) => (
                  <tr key={f._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {f.transaction?.book?.title || 'Library Item'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">${f.amount.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`badge ${
                          f.paidStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : f.paidStatus === 'waived'
                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        } capitalize`}
                      >
                        {f.paidStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{f.reason}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(f.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {f.paidAt ? new Date(f.paidAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={DollarSign}
          title="No Fines on Record"
          description="You do not have any overdue fines or penalties on your account."
        />
      )}
    </div>
  );
};
