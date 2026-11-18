import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const LibrarySettings = () => {
  const [settings, setSettings] = useState({
    maxBorrowLimit: 3,
    loanPeriodDays: 14,
    finePerDay: 2,
    isFineEnabled: true,
    maxReservationLimit: 2,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data.settings) {
          setSettings(res.data.settings);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : Number(value),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);
    setSaving(true);

    try {
      const res = await api.put('/settings', settings);
      setFeedback({
        type: 'success',
        text: res.data.message || 'Library system configuration updated successfully!',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update configuration',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Retrieving institutional policy configuration..." />;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional Circulation Policies</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure library-wide borrowing thresholds, maximum holding limits, and late fee assessment rates.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
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

      <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 space-y-6">
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Maximum Concurrent Loans per Student
            </label>
            <input
              type="number"
              min="1"
              max="20"
              required
              name="maxBorrowLimit"
              value={settings.maxBorrowLimit}
              onChange={handleChange}
              className="glass-input w-full"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Limits how many physical books an active student may borrow simultaneously.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Standard Loan Period (Days)
            </label>
            <input
              type="number"
              min="1"
              max="120"
              required
              name="loanPeriodDays"
              value={settings.loanPeriodDays}
              onChange={handleChange}
              className="glass-input w-full"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Number of days between checkout and due date automatically calculated on issue.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Maximum Reservations per Student
            </label>
            <input
              type="number"
              min="1"
              max="10"
              required
              name="maxReservationLimit"
              value={settings.maxReservationLimit}
              onChange={handleChange}
              className="glass-input w-full"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Max active waitlist holds allowed per student for books currently out of stock.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isFineEnabled"
                checked={settings.isFineEnabled}
                onChange={handleChange}
                className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="font-semibold text-slate-800">
                Enable Automatic Overdue Fines
              </span>
            </label>
            <p className="text-[11px] text-slate-500 mt-1 ml-6">
              When checked, books returned after their due date automatically accrue late penalties.
            </p>
          </div>

          {settings.isFineEnabled && (
            <div className="pl-6 space-y-1">
              <label className="block font-semibold text-slate-800">
                Daily Overdue Fine Rate ($ per Day)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                name="finePerDay"
                value={settings.finePerDay}
                onChange={handleChange}
                className="glass-input w-full max-w-xs font-mono"
              />
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-xs bg-purple-600 hover:bg-purple-700 shadow-purple-600/20 py-2.5 px-6"
          >
            <Save className="w-4 h-4 mr-1" />
            {saving ? 'Updating Rules...' : 'Save Configuration Rules'}
          </button>
        </div>
      </form>
    </div>
  );
};
