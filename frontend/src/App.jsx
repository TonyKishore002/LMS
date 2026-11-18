import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RealtimeProvider } from './context/RealtimeContext';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RealtimeProvider>
          <AppRoutes />
        </RealtimeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
