import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookMarked, Calendar, XCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';

export const MyReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [message, setMessage] = useState('');

  const fetchReservations = async () => {
    try {
      const res = await api.get('/reservations/my-reservations');
      setReservations(res.data.reservations || []);
    } catch (err) {
      console.error('Failed to fetch reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCancelReservation = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation hold?')) return;
    setCancellingId(id);
    try {
      await api.patch(`/reservations/${id}/cancel`);
      setMessage('Reservation cancelled successfully');
      fetchReservations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel reservation');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Retrieving your reservation requests..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Book Reservations</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitor your position in waiting queues for books currently out of stock.
        </p>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-emerald-700 font-bold">
            &times;
          </button>
        </div>
      )}

      {reservations.length > 0 ? (
        <div className="space-y-4">
          {reservations.map((res) => {
            const isPending = res.status === 'pending';
            const isAvailable = res.status === 'available';

            return (
              <div
                key={res._id}
                className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`badge ${
                        isAvailable
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                          : isPending
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      } capitalize`}
                    >
                      {isAvailable ? 'Ready for Pickup' : res.status}
                    </span>
                    {isPending && (
                      <span className="text-xs font-semibold text-slate-600">
                        Queue Position: #{res.priorityNumber || 1}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{res.book?.title}</h3>
                  <p className="text-xs text-slate-500">
                    by {res.book?.author} &middot; ISBN: {res.book?.isbn}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Requested: {new Date(res.reservationDate).toLocaleDateString()}
                    </span>
                    {res.expiryDate && (
                      <span className="text-amber-600 font-medium">
                        Hold Expires: {new Date(res.expiryDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {isAvailable && (
                    <div className="text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      Copy waiting at counter
                    </div>
                  )}

                  {['pending', 'available'].includes(res.status) && (
                    <button
                      onClick={() => handleCancelReservation(res._id)}
                      disabled={cancellingId === res._id}
                      className="btn-secondary text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel Hold
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={BookMarked}
          title="No Active Reservations"
          description="You do not have any books on hold or in waiting queues."
          action={
            <Link to="/student/books" className="btn-primary text-xs">
              Browse Catalog
            </Link>
          }
        />
      )}
    </div>
  );
};
