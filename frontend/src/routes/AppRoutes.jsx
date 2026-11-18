import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { AppLayout } from '../layouts/AppLayout';
import { ProtectedRoute } from '../layouts/ProtectedRoute';

// Public pages
import { LandingPage } from '../pages/public/LandingPage';
import { LoginPage } from '../pages/public/LoginPage';
import { RegisterStudentPage } from '../pages/public/RegisterStudentPage';
import { UnauthorizedPage } from '../pages/public/UnauthorizedPage';
import { NotFoundPage } from '../pages/public/NotFoundPage';

// Student pages
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { BrowseBooks } from '../pages/student/BrowseBooks';
import { MyIssuedBooks } from '../pages/student/MyIssuedBooks';
import { MyReservations } from '../pages/student/MyReservations';
import { BorrowHistory } from '../pages/student/BorrowHistory';
import { StudentNotifications } from '../pages/student/StudentNotifications';
import { StudentProfile } from '../pages/student/StudentProfile';

// Librarian pages
import { LibrarianDashboard } from '../pages/librarian/LibrarianDashboard';
import { BookCatalog } from '../pages/librarian/BookCatalog';
import { AddBook } from '../pages/librarian/AddBook';
import { EditBook } from '../pages/librarian/EditBook';
import { CirculationHub } from '../pages/librarian/CirculationHub';
import { BorrowRequests } from '../pages/librarian/BorrowRequests';
import { OverdueTracking } from '../pages/librarian/OverdueTracking';
import { FineManagement } from '../pages/librarian/FineManagement';
import { LibrarianReports } from '../pages/librarian/LibrarianReports';

// Admin pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { StudentManagement } from '../pages/admin/StudentManagement';
import { LibrarianManagement } from '../pages/admin/LibrarianManagement';
import { UserDetails } from '../pages/admin/UserDetails';
import { LibrarySettings } from '../pages/admin/LibrarySettings';
import { AuditLogs } from '../pages/admin/AuditLogs';
import { AdminReports } from '../pages/admin/AdminReports';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/:role" element={<LoginPage />} />
        <Route path="/register/student" element={<RegisterStudentPage />} />
        <Route path="/signup" element={<RegisterStudentPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>

      {/* Student Protected Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="books" element={<BrowseBooks />} />
        <Route path="issued" element={<MyIssuedBooks />} />
        <Route path="reservations" element={<MyReservations />} />
        <Route path="history" element={<BorrowHistory />} />
        <Route path="notifications" element={<StudentNotifications />} />
        <Route path="profile" element={<StudentProfile />} />
      </Route>

      {/* Librarian Protected Routes */}
      <Route
        path="/librarian"
        element={
          <ProtectedRoute allowedRoles={['librarian']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/librarian/dashboard" replace />} />
        <Route path="dashboard" element={<LibrarianDashboard />} />
        <Route path="books" element={<BookCatalog />} />
        <Route path="books/new" element={<AddBook />} />
        <Route path="books/:id/edit" element={<EditBook />} />
        <Route path="circulation" element={<CirculationHub />} />
        <Route path="requests" element={<BorrowRequests />} />
        <Route path="overdue" element={<OverdueTracking />} />
        <Route path="fines" element={<FineManagement />} />
        <Route path="reports" element={<LibrarianReports />} />
      </Route>

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<StudentManagement />} />
        <Route path="librarians" element={<LibrarianManagement />} />
        <Route path="users/:id" element={<UserDetails />} />
        <Route path="settings" element={<LibrarySettings />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      {/* 404 Route */}
      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
