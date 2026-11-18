import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  BookOpen,
  BookmarkPlus,
  BookMarked,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import api from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { Pagination } from '../../components/Pagination';
import { Modal } from '../../components/Modal';

export const BrowseBooks = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);

  // Filters state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  // Action Modals State
  const [selectedBook, setSelectedBook] = useState(null);
  const [actionType, setActionType] = useState(null); // 'request' or 'reserve'
  const [actionNotes, setActionNotes] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (selectedCategory) params.append('category', selectedCategory);
      if (availableOnly) params.append('availableOnly', 'true');
      params.append('page', page);
      params.append('limit', '12');

      const res = await api.get(`/books?${params.toString()}`);
      setBooks(res.data.books || []);
      setCategories(res.data.categories || []);
      setTotalPages(res.data.pages || 1);
      setTotalBooks(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch books:', err);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
    const onFocus = () => fetchBooks();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [page, selectedCategory, availableOnly]);

  // Instantly refresh book catalog when librarian uploads/edits/archives a book or inventory changes
  useRealtime((event) => {
    if (event.type === 'BOOK_MUTATION' || event.type === 'CIRCULATION_MUTATION') {
      fetchBooks();
    }
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBooks();
  };

  const handleOpenAction = (book, type) => {
    setSelectedBook(book);
    setActionType(type);
    setActionNotes('');
    setFeedback(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedBook) return;
    setActionSubmitting(true);
    setFeedback(null);

    try {
      if (actionType === 'request') {
        const res = await api.post('/circulation/request', {
          bookId: selectedBook._id,
          notes: actionNotes,
        });
        setFeedback({
          type: 'success',
          message: res.data.message || 'Issue request submitted to librarian for approval.',
        });
      } else {
        const res = await api.post('/reservations', {
          bookId: selectedBook._id,
          notes: actionNotes,
        });
        setFeedback({
          type: 'success',
          message: res.data.message || 'Book reservation placed successfully.',
        });
      }
      // Re-fetch books to reflect updated numbers
      fetchBooks();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Operation failed. Please try again.',
      });
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Library Catalog</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Explore books, check physical stock availability, and submit circulation requests.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, ISBN, publisher..."
              className="glass-input pl-10 w-full"
            />
          </div>
          <button type="submit" className="btn-primary text-xs px-4">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="glass-input text-xs py-2 pr-8"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => {
                setAvailableOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span>Available In Stock Only</span>
          </label>
        </div>
      </div>

      {/* Books Grid */}
      {loading ? (
        <LoadingSpinner message="Searching catalog collections..." />
      ) : books.length > 0 ? (
        <div className="space-y-6">
          <div className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{books.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{totalBooks}</span> catalog items
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {books.map((book) => {
              const isAvailable = book.availableCopies > 0;
              return (
                <div
                  key={book._id}
                  className="glass-card p-5 glass-card-hover flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="badge bg-slate-100 text-slate-700 border-slate-200">
                        {book.category}
                      </span>
                      <span
                        className={`badge ${
                          isAvailable
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {isAvailable ? `${book.availableCopies} in stock` : 'Out of Stock'}
                      </span>
                    </div>

                    <h3 className="mt-3 text-base font-bold text-slate-900 line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">by {book.author}</p>

                    {book.description && (
                      <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                        {book.description}
                      </p>
                    )}

                    <div className="mt-4 pt-3 border-t border-slate-100/80 space-y-1 text-[11px] text-slate-500">
                      <div className="flex justify-between">
                        <span>ISBN:</span>
                        <span className="font-mono text-slate-700 font-medium">{book.isbn}</span>
                      </div>
                      {book.shelfLocation && (
                        <div className="flex justify-between">
                          <span>Shelf Location:</span>
                          <span className="text-slate-700 font-medium">{book.shelfLocation}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Total Copies:</span>
                        <span className="text-slate-700 font-medium">{book.totalCopies}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex gap-2">
                    {isAvailable ? (
                      <button
                        onClick={() => handleOpenAction(book, 'request')}
                        className="flex-1 btn-primary text-xs py-2"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        Request Issue
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenAction(book, 'reserve')}
                        className="flex-1 btn-secondary text-xs py-2 text-teal-700 border-teal-200 hover:bg-teal-50"
                      >
                        <BookMarked className="w-3.5 h-3.5 text-teal-600" />
                        Place Reservation
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No Books Match Your Criteria"
          description="Try adjusting your keywords, selecting a different category, or clearing the availability filter."
          action={
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('');
                setAvailableOnly(false);
                setPage(1);
              }}
              className="btn-secondary text-xs"
            >
              Reset All Filters
            </button>
          }
        />
      )}

      {/* Confirmation & Request Modal */}
      <Modal
        isOpen={!!selectedBook}
        onClose={() => {
          setSelectedBook(null);
          setFeedback(null);
        }}
        title={actionType === 'request' ? 'Request Book Issue' : 'Place Book Hold / Reservation'}
      >
        {selectedBook && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <h4 className="font-bold text-slate-800">{selectedBook.title}</h4>
              <p className="text-xs text-slate-500">by {selectedBook.author}</p>
              <div className="mt-2 flex gap-4 text-xs text-slate-600 font-mono">
                <span>ISBN: {selectedBook.isbn}</span>
                <span>Available: {selectedBook.availableCopies} of {selectedBook.totalCopies}</span>
              </div>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {!feedback?.type === 'success' || !feedback ? (
              <>
                <p className="text-xs text-slate-600">
                  {actionType === 'request'
                    ? 'Submit a request to borrow this physical book. Once approved by the librarian, you can collect it from the circulation counter.'
                    : 'All physical copies are currently loaned out. Placing a reservation places you in the queue, and you will be notified when a copy is returned.'}
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notes or Reason (Optional)
                  </label>
                  <textarea
                    rows="3"
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="e.g. Needed for CS302 coursework project"
                    className="glass-input w-full"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBook(null)}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={actionSubmitting}
                    onClick={handleConfirmAction}
                    className="btn-primary text-xs"
                  >
                    {actionSubmitting
                      ? 'Submitting...'
                      : actionType === 'request'
                      ? 'Submit Borrow Request'
                      : 'Confirm Reservation'}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBook(null)}
                  className="btn-primary text-xs"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
