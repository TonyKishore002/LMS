import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Clock, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';

export const StudentNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAll = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Retrieving your alerts..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Borrowing Activity Alerts</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Due date reminders, request approvals, and hold availability notifications.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button onClick={handleMarkAll} className="btn-secondary text-xs">
            <CheckCheck className="w-4 h-4 mr-1 text-sky-600" />
            Mark All as Read
          </button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.isRead && handleMarkAsRead(n._id)}
              className={`glass-card p-4 flex items-start justify-between gap-4 transition cursor-pointer ${
                n.isRead ? 'opacity-80' : 'bg-sky-50/40 border-sky-200 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl mt-0.5 ${
                    n.type === 'success'
                      ? 'bg-emerald-100 text-emerald-700'
                      : n.type === 'warning'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-sky-100 text-sky-700'
                  }`}
                >
                  {n.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : n.type === 'warning' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Info className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                  <span className="text-[11px] text-slate-400 mt-2 block">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {!n.isRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsRead(n._id);
                  }}
                  className="text-xs text-sky-600 hover:text-sky-700 whitespace-nowrap font-medium"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="No Alerts Received"
          description="You are all caught up with your library notices."
        />
      )}
    </div>
  );
};
