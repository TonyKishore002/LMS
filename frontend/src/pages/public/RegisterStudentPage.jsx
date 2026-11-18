import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  User,
  Mail,
  Lock,
  Hash,
  Building,
  Phone,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const RegisterStudentPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    department: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { registerStudent } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim().toLowerCase().endsWith('@college.edu')) {
      return setError('Access restricted: Only official @college.edu email addresses are permitted for library registration.');
    }

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }

    setLoading(true);

    try {
      await registerStudent({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        studentId: formData.studentId.trim(),
        department: formData.department.trim(),
        phone: formData.phone.trim(),
      });

      // Redirect student to sign-in page with pre-filled email and success message
      navigate('/login/student', {
        state: {
          registeredEmail: formData.email.trim().toLowerCase(),
          successMessage: '🎉 Account created successfully! Please sign in with your credentials to enter the Student Portal.',
        },
      });
    } catch (err) {
      const message =
        err.response?.data?.message || 'Registration failed. Please check your details.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-6">
        <div className="glass-panel p-8 shadow-glass">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-100 border border-sky-200 text-sky-600 flex items-center justify-center shadow-subtle mb-3">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-600">
              New Student Registration
            </span>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 tracking-tight">
              Create Student Account
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Register with your institutional student identity to access library services.
            </p>
          </div>

          {error && (
            <div className="mt-5 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                    className="glass-input pl-9 w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student ID Number *
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    placeholder="STU-2026-042"
                    className="glass-input pl-9 w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                College Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@college.edu"
                  className="glass-input pl-9 w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department / Major
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Computer Science"
                    className="glass-input pl-9 w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 555-0199"
                    className="glass-input pl-9 w-full"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="glass-input pl-9 w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="glass-input pl-9 w-full"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 text-sm font-semibold mt-4"
            >
              {loading ? 'Creating Student Account...' : 'Complete Registration'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200/80 text-center text-xs text-slate-600">
            <span>Already have an account? </span>
            <Link
              to="/login/student"
              className="font-semibold text-sky-600 hover:text-sky-700 hover:underline"
            >
              Sign in to Student Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
