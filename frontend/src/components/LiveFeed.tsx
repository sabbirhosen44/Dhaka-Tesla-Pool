'use client';

import { useEffect, useRef, useState } from 'react';
import { SSE_URL } from '@/lib/api';

interface FeedEvent {
  id: string;
  time: string;
  event: string;
  data: Record<string, unknown>;
}

export default function LiveFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const es = new EventSource(SSE_URL);

    es.onopen = () => setConnected(true);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const feedEvent: FeedEvent = {
          id: crypto.randomUUID(),
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          event: data.event || 'update',
          data,
        };
        setEvents((prev) => [feedEvent, ...prev].slice(0, 50));
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => setConnected(false);

    return () => es.close();
  }, []);

  const getEventBadge = (event: string) => {
    switch (event) {
      case 'RIDE_REQUESTED':
        return { label: 'REQUEST', color: 'var(--accent-orange)' };
      case 'PASSENGER_MATCHED':
        return { label: 'MATCHED', color: 'var(--accent-primary)' };
      case 'POOL_FULL':
        return { label: 'FULL', color: 'var(--accent-red)' };
      case 'TRIP_STARTED':
        return { label: 'STARTED', color: 'var(--accent-green)' };
      case 'TRIP_COMPLETED':
        return { label: 'COMPLETED', color: 'var(--text-secondary)' };
      case 'RIDE_CANCELLED':
        return { label: 'CANCELLED', color: 'var(--accent-red)' };
      default:
        return { label: 'SYSTEM', color: 'var(--accent-secondary)' };
    }
  };

  const formatMessage = (ev: FeedEvent): string => {
    const d = ev.data;
    switch (ev.event) {
      case 'RIDE_REQUESTED':
        return `${d.passengerName} requested ${d.pickupZone} -> ${d.dropoffZone}`;
      case 'PASSENGER_MATCHED':
        return `${d.passengerName} matched to pool corridor ${d.corridor}`;
      case 'POOL_FULL':
        return `Corridor ${d.corridor} capacity reached (3/3 seats filled)`;
      case 'TRIP_STARTED':
        return `Vehicle dispatched on corridor ${d.corridor}`;
      case 'TRIP_COMPLETED':
        return `Pool completed all passenger dropoffs`;
      case 'RIDE_CANCELLED':
        return `${d.passengerName} cancelled ride request`;
      default:
        return JSON.stringify(d).slice(0, 80);
    }
  };

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="card-header">
        <div className="card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 11a9 9 0 0 1 9 9" />
            <path d="M4 4a16 16 0 0 1 16 16" />
            <circle cx="5" cy="19" r="1" />
          </svg>
          Live Telemetry Feed
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: connected ? 'var(--accent-green)' : 'var(--accent-red)',
              animation: connected ? 'pulse-glow 2s infinite' : 'none',
            }}
          />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
            {connected ? 'STREAM ACTIVE' : 'DISCONNECTED'}
          </span>
        </div>
      </div>
      <div className="card-body" style={{ padding: '16px' }}>
        {events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-text">
              {connected
                ? 'Listening for corridor events...'
                : 'SSE stream offline. Check backend status.'}
            </div>
          </div>
        ) : (
          <div className="live-feed" ref={containerRef}>
            {events.map((ev) => {
              const badge = getEventBadge(ev.event);
              return (
                <div key={ev.id} className="feed-item">
                  <span className="feed-time">{ev.time}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.06)',
                      color: badge.color,
                      border: `1px solid ${badge.color}`,
                      letterSpacing: 0.5,
                    }}
                  >
                    {badge.label}
                  </span>
                  <span className="feed-text">{formatMessage(ev)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
