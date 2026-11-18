import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DatabaseBanner = () => {
  const { dbStatus, dbMessage, checkHealth } = useAuth();

  if (dbStatus === 'connected' || dbStatus === 'checking') {
    return null;
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs sm:text-sm text-amber-900">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            {dbStatus === 'disconnected' ? (
              <>
                <strong className="font-semibold">MongoDB Atlas Disconnected:</strong>{' '}
                {dbMessage ? (
                  <span>{dbMessage}</span>
                ) : (
                  <>
                    Cannot query database. Please verify your <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-800 font-mono">MONGODB_URI</code> in <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-800 font-mono">backend/.env</code> and ensure your current IP address is added to the MongoDB Atlas Network Access IP Access List.
                  </>
                )}
              </>
            ) : (
              <>
                <strong className="font-semibold">Backend Unreachable:</strong> Cannot reach the API server at <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-800 font-mono">http://localhost:5000</code>. Ensure the backend server is running.
              </>
            )}
          </span>
        </div>
        <button
          onClick={checkHealth}
          className="ml-3 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-medium transition"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      </div>
    </div>
  );
};
