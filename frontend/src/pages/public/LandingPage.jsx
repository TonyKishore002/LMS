import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Library,
  BookMarked,
  CheckCircle,
} from 'lucide-react';
import api from '../../services/api';

export const LandingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [popularBooks, setPopularBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCatalogPreview = async () => {
      try {
        const res = await api.get('/books?limit=4&sortBy=availableCopies&sortOrder=desc');
        setPopularBooks(res.data.books || []);
      } catch {
        setPopularBooks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalogPreview();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/student/books?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/student/books');
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-12 px-4 sm:px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200/80 text-sky-700 text-xs font-semibold mb-6 shadow-subtle">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Academic Library System</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Empowering Academic Discovery &amp; Digital Circulation
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          TK connects students, librarians, and campus administrators through a unified,
          real-time institutional catalog with automated reservations, loan tracking, and security auditing.
        </p>

        {/* Global Catalog Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="mt-8 max-w-2xl mx-auto flex items-center glass-card p-2 shadow-glass border-slate-200"
        >
          <div className="pl-3 text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search catalog by title, author, ISBN, or subject..."
            className="w-full bg-transparent px-3 py-2 text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <button type="submit" className="btn-primary text-sm whitespace-nowrap px-5 py-2.5">
            Search
          </button>
        </form>

        {/* Portals Quick Selector Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
          {/* Student Portal */}
          <Link
            to="/login/student"
            className="glass-card p-6 glass-card-hover group border-sky-100 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-100 border border-sky-200 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                Student Portal
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Browse catalog, request book loans, monitor due dates, queue reservations, and check fines.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold text-sky-600 group-hover:translate-x-1 transition-transform">
              <span>Enter Student Login</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          {/* Librarian Portal */}
          <Link
            to="/login/librarian"
            className="glass-card p-6 glass-card-hover group border-teal-100 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-100 border border-teal-200 text-teal-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <BookMarked className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                Librarian Portal
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Manage books catalog, checkouts, returns, student loan requests, holds, and circulation reports.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold text-teal-600 group-hover:translate-x-1 transition-transform">
              <span>Enter Librarian Login</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          {/* Admin Portal */}
          <Link
            to="/login/admin"
            className="glass-card p-6 glass-card-hover group border-purple-100 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 border border-purple-200 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                Admin Portal
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Account lifecycle, role assignment, policy rules, loan parameters, security logs, and audit trails.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold text-purple-600 group-hover:translate-x-1 transition-transform">
              <span>Enter Admin Login</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Catalog Preview from Live Database */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Current Catalog Highlights</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real book inventory from MongoDB Atlas</p>
          </div>
          <Link to="/student/books" className="btn-secondary text-xs">
            View All Books
          </Link>
        </div>

        {popularBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {popularBooks.map((book) => (
              <div key={book._id} className="glass-card p-5 glass-card-hover flex flex-col justify-between">
                <div>
                  <span className="badge bg-slate-100 text-slate-700 border-slate-200">
                    {book.category}
                  </span>
                  <h4 className="mt-3 font-semibold text-slate-900 text-sm line-clamp-2">
                    {book.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">by {book.author}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">ISBN: {book.isbn}</span>
                  <span
                    className={`font-semibold ${
                      book.availableCopies > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {book.availableCopies > 0
                      ? `${book.availableCopies} available`
                      : 'Checked out'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-8 text-center text-xs text-slate-500">
            No books in catalog yet. Librarians can add catalog entries through the Librarian Portal.
          </div>
        )}
      </section>

      {/* Institutional Compliance & Architecture Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="glass-panel p-8 sm:p-12 border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Strict Role-Based Control</h4>
                <p className="mt-1 text-xs text-slate-600">
                  Separated authorization layers guarantee students and admins cannot tamper with book stock, while librarian operations are strictly audited.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0">
                <Library className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Atomic Inventory Guarantee</h4>
                <p className="mt-1 text-xs text-slate-600">
                  Concurrency-safe checkouts and return check-ins prevent duplicate loans, over-issuing, and negative stock numbers.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Audited Security &amp; Compliance</h4>
                <p className="mt-1 text-xs text-slate-600">
                  JWT authentication, bcrypt password hashing, login rate limiting, and persistent audit logs track every sensitive operation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
