import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const EditBook = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await api.get(`/books/${id}`);
        const book = res.data.book;
        setFormData({
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          publisher: book.publisher || '',
          edition: book.edition || '',
          category: book.category,
          publicationYear: book.publicationYear || '',
          shelfLocation: book.shelfLocation || '',
          description: book.description || '',
          totalCopies: book.totalCopies,
          availableCopies: book.availableCopies,
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load book record');
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await api.put(`/books/${id}`, {
        ...formData,
        totalCopies: parseInt(formData.totalCopies, 10),
        availableCopies: parseInt(formData.availableCopies, 10),
        publicationYear: formData.publicationYear
          ? parseInt(formData.publicationYear, 10)
          : null,
      });

      setSuccess(res.data.message || 'Book updated successfully!');
      setTimeout(() => navigate('/librarian/books'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update book');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Fetching book details..." />;
  }

  if (!formData) {
    return (
      <div className="p-6 text-center text-slate-500">
        Book not found or deleted.{' '}
        <Link to="/librarian/books" className="text-sky-600 underline">
          Return to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          to="/librarian/books"
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Book Details</h1>
          <p className="text-xs text-slate-500">Modify metadata or adjust inventory quantities.</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Book Title *
            </label>
            <input
              type="text"
              required
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="glass-input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Author(s) *
            </label>
            <input
              type="text"
              required
              name="author"
              value={formData.author}
              onChange={handleChange}
              className="glass-input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ISBN Identifier *
            </label>
            <input
              type="text"
              required
              name="isbn"
              value={formData.isbn}
              onChange={handleChange}
              className="glass-input w-full font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Academic Category *
            </label>
            <input
              type="text"
              required
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="glass-input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Shelf Location
            </label>
            <input
              type="text"
              name="shelfLocation"
              value={formData.shelfLocation}
              onChange={handleChange}
              className="glass-input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Total Physical Copies *
            </label>
            <input
              type="number"
              required
              min="0"
              name="totalCopies"
              value={formData.totalCopies}
              onChange={handleChange}
              className="glass-input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Available Copies On Hand *
            </label>
            <input
              type="number"
              required
              min="0"
              name="availableCopies"
              value={formData.availableCopies}
              onChange={handleChange}
              className="glass-input w-full"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows="3"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="glass-input w-full text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Link to="/librarian/books" className="btn-secondary text-xs">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-xs bg-teal-600 hover:bg-teal-700"
          >
            <Save className="w-4 h-4 mr-1" />
            {saving ? 'Updating...' : 'Save Modifications'}
          </button>
        </div>
      </form>
    </div>
  );
};
