import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import api from '../../services/api';

export const AddBook = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    edition: '',
    category: 'Computer Science',
    publicationYear: new Date().getFullYear(),
    shelfLocation: '',
    description: '',
    totalCopies: 3,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const addedCopies = parseInt(formData.totalCopies, 10);
      await api.post('/books', {
        ...formData,
        totalCopies: addedCopies,
        publicationYear: formData.publicationYear
          ? parseInt(formData.publicationYear, 10)
          : null,
      });

      navigate('/librarian/dashboard', {
        state: {
          successMessage: `"${formData.title}" added to catalog! Physical Copies (+${addedCopies}) and Available Stock (+${addedCopies}) updated instantly.`,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add book to catalog');
    } finally {
      setLoading(false);
    }
  };

  const standardCategories = [
    'Computer Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Economics & Finance',
    'Literature',
    'History & Philosophy',
    'Medicine & Health',
  ];

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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Add New Book to Catalog</h1>
          <p className="text-xs text-slate-500">Record a new physical acquisition in the database.</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
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
              placeholder="e.g. Introduction to Algorithms, 4th Edition"
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
              placeholder="Thomas H. Cormen, Charles E. Leiserson"
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
              placeholder="978-0262046305"
              className="glass-input w-full font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Academic Category / Subject *
            </label>
            <input
              type="text"
              list="categories-list"
              required
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="glass-input w-full"
            />
            <datalist id="categories-list">
              {standardCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Shelf Classification Location
            </label>
            <input
              type="text"
              name="shelfLocation"
              value={formData.shelfLocation}
              onChange={handleChange}
              placeholder="Shelf CS-04, Section B"
              className="glass-input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Publisher
            </label>
            <input
              type="text"
              name="publisher"
              value={formData.publisher}
              onChange={handleChange}
              placeholder="MIT Press"
              className="glass-input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Edition
            </label>
            <input
              type="text"
              name="edition"
              value={formData.edition}
              onChange={handleChange}
              placeholder="4th Edition"
              className="glass-input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Publication Year
            </label>
            <input
              type="number"
              min="1800"
              max="2099"
              name="publicationYear"
              value={formData.publicationYear}
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
              min="1"
              max="500"
              name="totalCopies"
              value={formData.totalCopies}
              onChange={handleChange}
              className="glass-input w-full"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Abstract
            </label>
            <textarea
              rows="3"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief summary or table of contents overview..."
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
            disabled={loading}
            className="btn-primary text-xs bg-teal-600 hover:bg-teal-700"
          >
            <Save className="w-4 h-4 mr-1" />
            {loading ? 'Saving to Database...' : 'Save Book to Catalog'}
          </button>
        </div>
      </form>
    </div>
  );
};
