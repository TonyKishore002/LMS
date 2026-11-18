import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookmarkCheck,
  Clock,
  AlertTriangle,
  Calendar,
  BookOpen,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import api from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';

export const MyIssuedBooks = () => {
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchIssued = async () => {
    try {
      const res = await api.get('/circulation/my-issued');
      setIssuedBooks(res.data.transactions || []);
    } catch (err) {
      console.error('Failed to fetch issued books:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssued();
  }, []);

  useRealtime((event) => {
    if (event.type === 'CIRCULATION_MUTATION') {
      fetchIssued();
    }
  });

  if (loading) {
    return <LoadingSpinner message="Retrieving your issued books..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Currently Issued Books</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review your active physical library loans, loan periods, and upcoming return deadlines.
        </p>
      </div>

      {issuedBooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {issuedBooks.map((item) => {
            const isOverdue = item.isOverdue;
            const daysLeft = item.daysRemaining;

            return (
              <div
                key={item._id}
                className={`glass-card p-6 flex flex-col justify-between border-l-4 ${
                  isOverdue ? 'border-l-rose-500 bg-rose-50/30' : 'border-l-sky-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="badge bg-slate-100 text-slate-700 border-slate-200">
                      {item.book?.category || 'General'}
                    </span>
                    <span
                      className={`badge ${
                        isOverdue
                          ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse'
                          : daysLeft <= 3
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {isOverdue
                        ? 'OVERDUE'
                        : daysLeft === 0
                        ? 'Due Today'
                        : `${daysLeft} days remaining`}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-slate-900">
                    {item.book?.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">by {item.book?.author}</p>

                  <div className="mt-4 p-3 rounded-lg bg-white/80 border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Issued On:
                      </span>
                      <span className="font-semibold text-slate-800">
                        {item.issueDate ? new Date(item.issueDate).toLocaleDateString() : '—'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Due Date:
                      </span>
                      <span
                        className={`font-semibold ${
                          isOverdue ? 'text-rose-600' : 'text-slate-800'
                        }`}
                      >
                        {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '—'}
                      </span>
                    </div>

                    {item.book?.shelfLocation && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          Shelf Return Point:
                        </span>
                        <span className="font-semibold text-slate-800">
                          {item.book.shelfLocation}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                  <span>ISBN: {item.book?.isbn}</span>
                  <span className="text-[11px] text-slate-400">
                    Return to circulation desk by due date
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={BookmarkCheck}
          title="No Books Currently Issued"
          description="You currently have no books checked out from the library."
          action={
            <Link to="/student/books" className="btn-primary text-xs">
              <BookOpen className="w-3.5 h-3.5 mr-1" />
              Browse Books to Borrow
            </Link>
          }
        />
      )}
    </div>
  );
};
