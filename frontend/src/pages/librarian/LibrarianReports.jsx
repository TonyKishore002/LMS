import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Layers, BookOpen, Clock, ArrowLeftRight } from 'lucide-react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const LibrarianReports = () => {
  const [reportType, setReportType] = useState('inventory'); // 'inventory' or 'circulation'
  const [inventoryData, setInventoryData] = useState(null);
  const [circulationData, setCirculationData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      if (reportType === 'inventory') {
        const res = await api.get('/reports/inventory');
        setInventoryData(res.data);
      } else {
        const res = await api.get('/reports/circulation');
        setCirculationData(res.data.transactions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (reportType === 'inventory' && inventoryData?.books) {
      csvContent += 'Title,Author,ISBN,Category,Total Copies,Available Copies,Shelf\n';
      inventoryData.books.forEach((b) => {
        csvContent += `"${b.title}","${b.author}","${b.isbn}","${b.category}",${b.totalCopies},${b.availableCopies},"${b.shelfLocation || ''}"\n`;
      });
    } else {
      csvContent += 'Book,Student,Student ID,Status,Issue Date,Due Date,Return Date\n';
      circulationData.forEach((t) => {
        csvContent += `"${t.book?.title || ''}","${t.student?.name || ''}","${t.student?.studentId || ''}","${t.status}","${t.issueDate || ''}","${t.dueDate || ''}","${t.returnDate || ''}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Circulation &amp; Catalog Reports</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Generate and export verified inventory reports and circulation transaction logs.
          </p>
        </div>

        <button onClick={handleExportCSV} className="btn-secondary text-xs">
          <Download className="w-3.5 h-3.5 mr-1" />
          Export to CSV
        </button>
      </div>

      {/* Report Selector */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setReportType('inventory')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-all ${
            reportType === 'inventory'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Catalog Inventory Audit
        </button>
        <button
          onClick={() => setReportType('circulation')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-all ${
            reportType === 'circulation'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Circulation History Log
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Querying MongoDB report records..." />
      ) : reportType === 'inventory' ? (
        <div className="space-y-6">
          {/* Summary Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-4">
              <span className="text-xs text-slate-500">Catalog Titles</span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {inventoryData?.summary?.totalTitles || 0}
              </div>
            </div>
            <div className="glass-card p-4">
              <span className="text-xs text-slate-500">Total Volumes</span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {inventoryData?.summary?.totalCopies || 0}
              </div>
            </div>
            <div className="glass-card p-4">
              <span className="text-xs text-slate-500">Available on Shelves</span>
              <div className="text-xl font-bold text-emerald-600 mt-1">
                {inventoryData?.summary?.availableCopies || 0}
              </div>
            </div>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200/80 text-left text-xs">
                <thead className="bg-slate-50/50">
                  <tr className="text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Author</th>
                    <th className="py-3 px-4">ISBN</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Shelf</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Available</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventoryData?.books?.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{b.title}</td>
                      <td className="py-2.5 px-4 text-slate-600">{b.author}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">{b.isbn}</td>
                      <td className="py-2.5 px-4">{b.category}</td>
                      <td className="py-2.5 px-4">{b.shelfLocation || '—'}</td>
                      <td className="py-2.5 px-4 font-semibold">{b.totalCopies}</td>
                      <td className="py-2.5 px-4 font-semibold text-emerald-600">
                        {b.availableCopies}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 text-left text-xs">
              <thead className="bg-slate-50/50">
                <tr className="text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Book</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Return Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {circulationData.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      {t.book?.title}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {t.student?.name} ({t.student?.studentId || 'N/A'})
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="badge bg-slate-100 text-slate-700 capitalize">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {t.issueDate ? new Date(t.issueDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {t.returnDate ? new Date(t.returnDate).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
