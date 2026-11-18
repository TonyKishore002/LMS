import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Mail, Phone, DollarSign, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';

export const OverdueTracking = () => {
  const [overdueLoans, setOverdueLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverdue = async () => {
      try {
        const res = await api.get('/circulation/overdue');
        setOverdueLoans(res.data.overdueTransactions || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverdue();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Scanning database for overdue loans..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overdue Loan Tracking</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Identifies books past their due date, tracks student borrower contact points, and evaluates accrued fines.
        </p>
      </div>

      {overdueLoans.length > 0 ? (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 text-left text-xs">
              <thead className="bg-slate-50/50">
                <tr className="text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Book Details</th>
                  <th className="py-3 px-4">Student Borrower</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Days Overdue</th>
                  <th className="py-3 px-4">Calculated Fine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueLoans.map((loan) => (
                  <tr key={loan._id} className="hover:bg-rose-50/20 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{loan.book?.title}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        ISBN: {loan.book?.isbn}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{loan.student?.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        ID: {loan.student?.studentId || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 space-y-0.5">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{loan.student?.email}</span>
                      </div>
                      {loan.student?.phone && (
                        <div className="flex items-center gap-1 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{loan.student.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-rose-600">
                      {new Date(loan.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="badge bg-rose-50 text-rose-700 border-rose-200 font-bold">
                        {loan.daysOverdue} days late
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ${loan.estimatedFine?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={CheckCircle2}
          title="Zero Overdue Loans"
          description="All active library book loans are currently within their authorized due dates."
        />
      )}
    </div>
  );
};
