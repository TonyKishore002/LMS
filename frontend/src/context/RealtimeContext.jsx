import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

const RealtimeContext = createContext(null);

const CHANNEL_NAME = 'lms_realtime_sync';

export const RealtimeProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [liveNotification, setLiveNotification] = useState(null);
  const channelRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Cross-tab broadcast channel
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channelRef.current = channel;

        channel.onmessage = (messageEvent) => {
          const event = messageEvent.data;
          handleIncomingEvent(event, 'tab-broadcast');
        };
      }
    } catch (err) {
      console.warn('BroadcastChannel not supported in this environment:', err);
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, []);

  // Server-Sent Events (SSE) Stream
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    // Remove trailing /api to reach /api/realtime/stream
    const streamUrl = apiUrl.replace(/\/api\/?$/, '') + '/api/realtime/stream';

    let eventSource;
    let reconnectTimer;

    const connectSSE = () => {
      try {
        eventSource = new EventSource(streamUrl);
        eventSourceRef.current = eventSource;

        eventSource.addEventListener('connected', () => {
          setConnected(true);
        });

        eventSource.addEventListener('lms_update', (e) => {
          try {
            const eventData = JSON.parse(e.data);
            handleIncomingEvent(eventData, 'sse-server');
          } catch (parseErr) {
            console.error('Failed to parse SSE update:', parseErr);
          }
        });

        eventSource.onopen = () => {
          setConnected(true);
        };

        eventSource.onerror = () => {
          setConnected(false);
          eventSource.close();
          // Attempt reconnection after 5 seconds
          reconnectTimer = setTimeout(connectSSE, 5000);
        };
      } catch (err) {
        setConnected(false);
        reconnectTimer = setTimeout(connectSSE, 5000);
      }
    };

    connectSSE();

    return () => {
      clearTimeout(reconnectTimer);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const handleIncomingEvent = (event, source) => {
    setLastEvent(event);

    // Show temporary live synchronization banner
    if (event.message) {
      setLiveNotification({
        id: Date.now(),
        message: event.message,
        type: event.type,
      });

      setTimeout(() => {
        setLiveNotification((prev) => (prev?.message === event.message ? null : prev));
      }, 4000);
    }

    // Dispatch global custom event for non-react hooks or independent components
    window.dispatchEvent(
      new CustomEvent('lms_realtime_event', {
        detail: { ...event, source },
      })
    );
  };

  /**
   * Broadcast an event immediately to other open tabs
   */
  const broadcastLocalEvent = useCallback((event) => {
    const payload = {
      ...event,
      timestamp: Date.now(),
    };

    // Broadcast across tabs
    if (channelRef.current) {
      try {
        channelRef.current.postMessage(payload);
      } catch (err) {
        console.error('Failed to post to BroadcastChannel:', err);
      }
    }

    // Trigger local listeners too
    handleIncomingEvent(payload, 'local');
  }, []);

  return (
    <RealtimeContext.Provider
      value={{
        connected,
        lastEvent,
        broadcastLocalEvent,
        liveNotification,
        dismissNotification: () => setLiveNotification(null),
      }}
    >
      {children}

      {/* Floating live sync indicator pill */}
      {liveNotification && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700/60 flex items-center gap-3 text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col">
              <span className="font-semibold text-slate-200">Live Library Sync</span>
              <span className="text-slate-300 text-[11px]">{liveNotification.message}</span>
            </div>
            <button
              onClick={() => setLiveNotification(null)}
              className="ml-2 text-slate-400 hover:text-white font-bold text-sm"
              aria-label="Dismiss notification"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </RealtimeContext.Provider>
  );
};

/**
 * Custom hook to subscribe to real-time events in any component/page
 * @param {Function} callback - Function called with (event) when an update arrives
 * @param {Array} deps - Dependency array for the callback
 */
export const useRealtime = (callback, deps = []) => {
  const context = useContext(RealtimeContext);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler = (e) => {
      if (callbackRef.current) {
        callbackRef.current(e.detail);
      }
    };

    window.addEventListener('lms_realtime_event', handler);
    return () => window.removeEventListener('lms_realtime_event', handler);
  }, deps);

  return context;
};

export const useRealtimeContext = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtimeContext must be used within a RealtimeProvider');
  }
  return context;
};

