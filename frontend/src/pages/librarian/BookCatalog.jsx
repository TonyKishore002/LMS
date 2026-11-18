import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  PlusCircle,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import api from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { Pagination } from '../../components/Pagination';

export const BookCatalog = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [actionMessage, setActionMessage] = useState(null);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (selectedCategory) params.append('category', selectedCategory);
      params.append('page', page);
      params.append('limit', '15');

      const res = await api.get(`/books?${params.toString()}`);
      setBooks(res.data.books || []);
      setCategories(res.data.categories || []);
      setTotalPages(res.data.pages || 1);
      setTotalBooks(res.data.total || 0);
    } catch (err) {
      console.error(err);
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
  }, [page, selectedCategory]);

  // Real-time synchronization
  useRealtime((event) => {
    if (event.type === 'BOOK_MUTATION' || event.type === 'CIRCULATION_MUTATION') {
      fetchBooks();
    }
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBooks();
  };

  const handleDeleteBook = async (book) => {
    const confirmed = window.confirm(
      `Are you sure you want to archive "${book.title}" (ISBN: ${book.isbn})? Historical loan transactions will be preserved.`
    );
    if (!confirmed) return;

    try {
      const res = await api.delete(`/books/${book._id}`);
      setActionMessage({
        type: 'success',
        text: res.data.message || 'Book archived successfully.',
      });
      fetchBooks();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete book. Please check active loans.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Library Catalog Inventory</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage institutional book records, physical volumes, shelf classifications, and metadata.
          </p>
        </div>

        <Link
          to="/librarian/books/new"
          className="btn-primary text-xs bg-teal-600 hover:bg-teal-700 shadow-teal-600/20 whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4 mr-1" />
          Add New Book Record
        </Link>
      </div>

      {actionMessage && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="font-bold text-sm">
            &times;
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by title, author, ISBN, publisher, or shelf..."
              className="glass-input pl-10 w-full"
            />
          </div>
          <button type="submit" className="btn-secondary text-xs px-4">
            Filter
          </button>
        </form>

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
      </div>

      {/* Books Table */}
      {loading ? (
        <LoadingSpinner message="Loading catalog records..." />
      ) : books.length > 0 ? (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 text-left text-xs">
              <thead className="bg-slate-50/50">
                <tr className="text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Book Details</th>
                  <th className="py-3 px-4">ISBN</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Shelf Location</th>
                  <th className="py-3 px-4">Copies (Avail / Total)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {books.map((book) => {
                  const isAvailable = book.availableCopies > 0;
                  return (
                    <tr key={book._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{book.title}</div>
                        <div className="text-xs text-slate-500">
                          by {book.author}{' '}
                          {book.publicationYear ? `(${book.publicationYear})` : ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {book.isbn}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="badge bg-slate-100 text-slate-700 border-slate-200">
                          {book.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {book.shelfLocation || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold ${
                            isAvailable ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {book.availableCopies}
                        </span>{' '}
                        / <span className="text-slate-600 font-medium">{book.totalCopies}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <Link
                          to={`/librarian/books/${book._id}/edit`}
                          className="inline-flex items-center p-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-teal-50 border border-slate-200/80"
                          title="Edit Book Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteBook(book)}
                          className="inline-flex items-center p-1.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200/80"
                          title="Archive Book"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
          icon={BookOpen}
          title="Catalog Is Empty"
          description="No book records found matching your filters. Add catalog items using the button above."
          action={
            <Link to="/librarian/books/new" className="btn-primary text-xs">
              <PlusCircle className="w-4 h-4 mr-1" />
              Add First Book
            </Link>
          }
        />
      )}
    </div>
  );
};
