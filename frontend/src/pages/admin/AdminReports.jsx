import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Layers, Users, BookOpen, Clock } from 'lucide-react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const AdminReports = () => {
  const [stats, setStats] = useState(null);
  const [circulationData, setCirculationData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminReports = async () => {
      try {
        const [dashRes, circRes] = await Promise.all([
          api.get('/reports/admin-dashboard'),
          api.get('/reports/circulation'),
        ]);
        setStats(dashRes.data.stats || {});
        setCirculationData(circRes.data.transactions || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminReports();
  }, []);

  const handleExportCSV = () => {
    let csv = 'Book Title,ISBN,Borrower Student,Student ID,Issue Date,Due Date,Return Status\n';
    circulationData.forEach((t) => {
      csv += `"${t.book?.title || ''}","${t.book?.isbn || ''}","${t.student?.name || ''}","${t.student?.studentId || ''}","${t.issueDate || ''}","${t.dueDate || ''}","${t.status}"\n`;
    });

    const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csv}`);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `system_circulation_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <LoadingSpinner message="Aggregating system-wide administrative reports..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional System Reports</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            System-wide circulation metrics, patron enrollment counts, and compliance exports.
          </p>
        </div>

        <button onClick={handleExportCSV} className="btn-secondary text-xs">
          <Download className="w-3.5 h-3.5 mr-1" />
          Export Circulation Dataset
        </button>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <span className="text-xs text-slate-500">Student Enrolled Population</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats?.registeredStudents || 0}</div>
        </div>
        <div className="glass-card p-4">
          <span className="text-xs text-slate-500">Circulation Staff Active</span>
          <div className="text-2xl font-bold text-purple-600 mt-1">{stats?.activeLibrarians || 0}</div>
        </div>
        <div className="glass-card p-4">
          <span className="text-xs text-slate-500">Total Volumes in Catalog</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalCopies || 0}</div>
        </div>
        <div className="glass-card p-4">
          <span className="text-xs text-slate-500">Active Book Loans</span>
          <div className="text-2xl font-bold text-sky-600 mt-1">{stats?.activeIssues || 0}</div>
        </div>
      </div>

      {/* Circulation Log Table */}
      <div className="glass-panel overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80">
          <h3 className="text-base font-bold text-slate-900">Comprehensive Circulation Activity Ledger</h3>
          <p className="text-xs text-slate-500">Real transaction records from MongoDB Atlas</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/80 text-left text-xs">
            <thead className="bg-slate-50/50">
              <tr className="text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Book Title</th>
                <th className="py-3 px-4">Student Patron</th>
                <th className="py-3 px-4">Circulation Status</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Return Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {circulationData.map((tx) => (
                <tr key={tx._id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-semibold text-slate-800">
                    {tx.book?.title}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {tx.student?.name} ({tx.student?.studentId || 'N/A'})
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="badge bg-slate-100 text-slate-700 capitalize">
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {tx.issueDate ? new Date(tx.issueDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {tx.dueDate ? new Date(tx.dueDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {tx.returnDate ? new Date(tx.returnDate).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
