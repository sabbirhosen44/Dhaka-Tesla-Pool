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
        const raw = JSON.parse(e.data);
        const eventType: string = raw.type || raw.event || 'SYSTEM';
        const payload =
          raw.payload && typeof raw.payload === 'object' ? raw.payload : raw;
        const feedEvent: FeedEvent = {
          id: crypto.randomUUID(),
          time: new Date(raw.timestamp || Date.now()).toLocaleTimeString(
            'en-US',
            { hour12: false }
          ),
          event: eventType,
          data: payload as Record<string, unknown>,
        };
        setEvents((prev) => [feedEvent, ...prev].slice(0, 50));
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => setConnected(false);

    return () => es.close();
  }, []);

  // Auto-scroll to top when new events arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [events.length]);

  const EVENT_META: Record<
    string,
    { label: string; color: string; bg: string }
  > = {
    RIDE_REQUESTED: {
      label: 'REQUEST',
      color: 'var(--accent-orange)',
      bg: 'rgba(251,146,60,0.12)',
    },
    POOL_MATCHED: {
      label: 'MATCHED',
      color: 'var(--accent-primary)',
      bg: 'rgba(56,189,248,0.12)',
    },
    PASSENGER_MATCHED: {
      label: 'MATCHED',
      color: 'var(--accent-primary)',
      bg: 'rgba(56,189,248,0.12)',
    },
    CAPACITY_FULL: {
      label: 'FULL',
      color: 'var(--accent-red)',
      bg: 'rgba(248,113,113,0.12)',
    },
    POOL_FULL: {
      label: 'FULL',
      color: 'var(--accent-red)',
      bg: 'rgba(248,113,113,0.12)',
    },
    DRIVER_ARRIVED: {
      label: 'ARRIVED',
      color: 'var(--accent-primary)',
      bg: 'rgba(56,189,248,0.12)',
    },
    TRIP_STARTED: {
      label: 'STARTED',
      color: 'var(--accent-green)',
      bg: 'rgba(52,211,153,0.12)',
    },
    TRIP_COMPLETED: {
      label: 'DONE',
      color: 'var(--text-secondary)',
      bg: 'rgba(148,163,184,0.08)',
    },
    RIDE_CANCELLED: {
      label: 'CANCELLED',
      color: 'var(--accent-red)',
      bg: 'rgba(248,113,113,0.12)',
    },
  };

  const getEventMeta = (event: string) =>
    EVENT_META[event] ?? {
      label: 'FLEET',
      color: 'var(--accent-secondary)',
      bg: 'rgba(129,140,248,0.08)',
    };

  const formatMessage = (ev: FeedEvent): React.ReactNode => {
    const d = ev.data as Record<string, string | number | undefined>;
    const actor =
      d.passengerName ||
      d.name ||
      (d.actorName as string) ||
      'Passenger';
    const seats = Number(d.seats ?? d.seatsRequested ?? 1);
    const seatText = seats > 1 ? `${seats} seats` : '1 seat';
    const pickup = (d.pickupZone as string) ?? 'Banani';
    const dropoff = (d.dropoffZone as string) ?? 'Dropoff';

    switch (ev.event) {
      case 'RIDE_REQUESTED':
        return (
          <>
            <strong style={{ color: 'var(--text-primary)' }}>{actor}</strong>{' '}
            requested{' '}
            <strong style={{ color: 'var(--accent-primary)' }}>
              {seatText}
            </strong>{' '}
            — {pickup} to {dropoff}
          </>
        );
      case 'POOL_MATCHED':
      case 'PASSENGER_MATCHED':
        return (
          <>
            <strong style={{ color: 'var(--text-primary)' }}>{actor}</strong>{' '}
            matched to Bullet EV corridor for{' '}
            <strong style={{ color: 'var(--accent-green)' }}>{seatText}</strong>
          </>
        );
      case 'CAPACITY_FULL':
      case 'POOL_FULL':
        return (
          <>
            Bullet EV reached{' '}
            <strong style={{ color: 'var(--accent-red)' }}>
              full capacity
            </strong>{' '}
            (3 / 3 seats occupied)
          </>
        );
      case 'DRIVER_ARRIVED':
        return (
          <>
            Bullet EV{' '}
            <strong style={{ color: 'var(--accent-primary)' }}>arrived</strong>{' '}
            at Banani Road 11 pickup point
          </>
        );
      case 'TRIP_STARTED':
        return (
          <>
            Bullet EV{' '}
            <strong style={{ color: 'var(--accent-green)' }}>departed</strong>{' '}
            Banani corridor — en route to dropoffs
          </>
        );
      case 'TRIP_COMPLETED':
        return (
          <>
            Corridor trip{' '}
            <strong style={{ color: 'var(--accent-green)' }}>completed</strong>{' '}
            — all passengers safely offloaded
          </>
        );
      case 'RIDE_CANCELLED':
        return (
          <>
            <strong style={{ color: 'var(--text-primary)' }}>{actor}</strong>{' '}
            cancelled their{' '}
            <strong style={{ color: 'var(--accent-red)' }}>reservation</strong>
          </>
        );
      default: {
        const msg =
          (d.message as string) ||
          (d.note as string) ||
          `${ev.event.replace(/_/g, ' ')} — corridor update received`;
        return <>{msg}</>;
      }
    }
  };

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Card header */}
      <div className="card-header">
        <div className="card-title">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
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
              background: connected
                ? 'var(--accent-green)'
                : 'var(--accent-red)',
              animation: connected ? 'pulse-glow 2s infinite' : 'none',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 11,
              color: connected ? 'var(--accent-green)' : 'var(--accent-red)',
              fontWeight: 600,
            }}
          >
            {connected ? 'STREAM ACTIVE' : 'DISCONNECTED'}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="card-body" style={{ padding: '16px' }}>
        {events.length === 0 ? (
          <div className="empty-state">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="1.5"
              style={{ opacity: 0.5 }}
            >
              <path d="M4 11a9 9 0 0 1 9 9" />
              <path d="M4 4a16 16 0 0 1 16 16" />
              <circle cx="5" cy="19" r="1" />
            </svg>
            <div className="empty-state-text">
              {connected
                ? 'Listening for corridor events...'
                : 'SSE stream offline. Check backend status.'}
            </div>
          </div>
        ) : (
          <div className="live-feed" ref={containerRef}>
            {events.map((ev) => {
              const meta = getEventMeta(ev.event);
              return (
                <div key={ev.id} className="feed-item">
                  {/* Timestamp */}
                  <span className="feed-time">{ev.time}</span>

                  {/* Coloured badge */}
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 4,
                      background: meta.bg,
                      color: meta.color,
                      border: `1px solid ${meta.color}`,
                      letterSpacing: 0.6,
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {meta.label}
                  </span>

                  {/* Human-readable message */}
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
