'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  createRideRequest,
  getMyHistory,
  cancelRideRequest,
  getBullet,
  getManifest,
  RideRequest,
  VehicleManifest,
} from '@/lib/api';
import SeatMeter from '@/components/SeatMeter';
import LiveFeed from '@/components/LiveFeed';

// All valid corridor routes in the Dhaka Tesla Pool network
const ROUTES = [
  { pickup: 'BANANI', dropoff: 'MOHAKHALI',  label: 'Banani → Mohakhali',  corridor: 'CENTRAL_CONNECT', estFare: '97.50'  },
  { pickup: 'BANANI', dropoff: 'GULSHAN_1',  label: 'Banani → Gulshan 1',  corridor: 'CENTRAL_CONNECT', estFare: '90.00'  },
  { pickup: 'BANANI', dropoff: 'GULSHAN_2',  label: 'Banani → Gulshan 2',  corridor: 'CENTRAL_NORTH',   estFare: '75.00'  },
  { pickup: 'BANANI', dropoff: 'UTTARA',     label: 'Banani → Uttara',     corridor: 'NORTH_SUBURB',    estFare: '215.62' },
  { pickup: 'BANANI', dropoff: 'FARMGATE',   label: 'Banani → Farmgate',   corridor: 'CENTRAL_SOUTH',   estFare: '140.62' },
  { pickup: 'BANANI', dropoff: 'DHANMONDI',  label: 'Banani → Dhanmondi',  corridor: 'WEST_SOUTH',      estFare: '187.50' },
  { pickup: 'BANANI', dropoff: 'MIRPUR',     label: 'Banani → Mirpur',     corridor: 'WEST_NORTH',      estFare: '172.50' },
];

const CORRIDOR_COLORS: Record<string, string> = {
  CENTRAL_CONNECT: 'var(--accent-primary)',
  CENTRAL_NORTH:   'var(--accent-secondary)',
  NORTH_SUBURB:    'var(--accent-green)',
  CENTRAL_SOUTH:   'var(--accent-orange)',
  WEST_SOUTH:      '#a78bfa',
  WEST_NORTH:      '#f472b6',
};

export default function PassengerPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [selectedRoute, setSelectedRoute] = useState(ROUTES[0]);
  const [selectedSeats, setSelectedSeats] = useState(1);
  const [activeRequest, setActiveRequest] = useState<RideRequest | null>(null);
  const [manifest, setManifest] = useState<VehicleManifest | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const history = await getMyHistory();
      const current = history.find(
        (r) =>
          r.status === 'REQUESTED' ||
          r.status === 'MATCHED' ||
          r.status === 'STARTED' ||
          r.status === 'ACTIVE'
      );
      setActiveRequest(current || null);

      const bullet = await getBullet();
      if (bullet?.id) {
        const m = await getManifest(bullet.id);
        setManifest(m);
      }
    } catch (err: unknown) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && user.role === 'DRIVER') {
      router.push('/driver');
      return;
    }
    if (user) {
      fetchStatus();
      const timer = setInterval(fetchStatus, 3000);
      return () => clearInterval(timer);
    }
  }, [user, isLoading, router, fetchStatus]);

  const handleBook = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const req = await createRideRequest({
        pickupZone: selectedRoute.pickup,
        dropoffZone: selectedRoute.dropoff,
        seatsRequested: selectedSeats,
      });
      setActiveRequest(req);
      await fetchStatus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ride request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!activeRequest) return;
    try {
      setCancelling(true);
      setError(null);
      await cancelRideRequest(activeRequest.id);
      setActiveRequest(null);
      await fetchStatus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Cancellation failed');
    } finally {
      setCancelling(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const rawFarePoysha =
    activeRequest?.fareInPoysha ||
    (activeRequest?.pool as unknown as Record<string, number> | null)?.myFarePoysha ||
    0;

  const displayFareBDT =
    rawFarePoysha > 0
      ? (rawFarePoysha / 100).toFixed(2)
      : (parseFloat(selectedRoute.estFare) * selectedSeats).toFixed(2);

  const displayCorridor =
    (activeRequest as Record<string, string> | null)?.corridor ||
    activeRequest?.pool?.corridor ||
    selectedRoute.corridor;

  const availableSeats =
    manifest?.availableSeats ??
    manifest?.seatsRemaining ??
    Math.max(0, (manifest?.capacity ?? 3) - (manifest?.occupiedSeats ?? 0));

  const estimatedFareTotal = (parseFloat(selectedRoute.estFare) * selectedSeats).toFixed(2);

  // True when request exists but wasn't matched to a pool
  const isUnmatched = activeRequest?.status === 'REQUESTED';

  const corridorColor = CORRIDOR_COLORS[selectedRoute.corridor] ?? 'var(--accent-primary)';

  return (
    <div className="page-container section animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1,
              padding: '4px 10px',
              borderRadius: 100,
              background: 'rgba(129, 140, 248, 0.15)',
              color: 'var(--accent-secondary)',
            }}
          >
            Passenger Portal
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Signed in as{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{user.name}</strong>{' '}
            ({user.phone})
          </span>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px' }}>
          Reserve Electric Commute
        </h1>
      </div>

      {/* Global error banner */}
      {error && (
        <div
          style={{
            background: 'rgba(248, 113, 113, 0.08)',
            border: '1px solid rgba(248, 113, 113, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 20px',
            color: 'var(--accent-red)',
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          {error}
        </div>
      )}

      {/* Unmatched warning — shown when booking succeeded but no pool was available */}
      {isUnmatched && (
        <div
          style={{
            background: 'rgba(251, 146, 60, 0.08)',
            border: '1px solid rgba(251, 146, 60, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
          }}
        >
          {/* Warning icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent-orange)"
            strokeWidth="2"
            style={{ flexShrink: 0, marginTop: 2 }}
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--accent-orange)',
                marginBottom: 4,
              }}
            >
              No vehicle available right now
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Your seat request is queued ({activeRequest?.pickupZone} &rarr; {activeRequest?.dropoffZone},{' '}
              {activeRequest?.seatsRequested} seat{(activeRequest?.seatsRequested ?? 1) > 1 ? 's' : ''}).
              All Bullet EVs are currently at full capacity or offline. You can wait for a slot to open, or cancel and try a different route.
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="btn btn-danger btn-sm"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Request'}
              </button>
              <button
                onClick={fetchStatus}
                className="btn btn-secondary btn-sm"
              >
                Check Again
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {activeRequest && !isUnmatched ? (
            /* Active Trip Status Card */
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Trip Status
                </div>
                <span className={`badge badge-${activeRequest.status.toLowerCase()}`}>
                  {activeRequest.status}
                </span>
              </div>
              <div className="card-body">
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Route Corridor
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                    {activeRequest.pickupZone} &rarr; {activeRequest.dropoffZone}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
                  <div className="stat-block">
                    <div className="stat-label">Isolated Fare</div>
                    <div className="stat-value primary">BDT {displayFareBDT}</div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-label">Seats Reserved</div>
                    <div className="stat-value primary">{activeRequest.seatsRequested || 1}</div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-label">Corridor</div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: CORRIDOR_COLORS[displayCorridor] ?? 'var(--accent-primary)',
                        marginTop: 4,
                        padding: '4px 10px',
                        borderRadius: 100,
                        background: 'rgba(56,189,248,0.08)',
                        border: '1px solid rgba(56,189,248,0.2)',
                        display: 'inline-block',
                      }}
                    >
                      {displayCorridor}
                    </div>
                  </div>
                </div>

                <div className="stepper" style={{ marginBottom: 24 }}>
                  <div className={`step ${activeRequest.status !== 'CANCELLED' ? 'done' : ''}`}>
                    <div className="step-dot">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div className="step-content">
                      <div className="step-title">Request Submitted</div>
                      <div className="step-detail">Seat lock initiated</div>
                    </div>
                  </div>

                  <div
                    className={`step ${
                      activeRequest.status === 'MATCHED' || activeRequest.status === 'STARTED' || activeRequest.status === 'ACTIVE' || activeRequest.status === 'COMPLETED'
                        ? 'done'
                        : 'active'
                    }`}
                  >
                    <div className="step-dot">
                      {activeRequest.status === 'MATCHED' || activeRequest.status === 'STARTED' || activeRequest.status === 'ACTIVE' || activeRequest.status === 'COMPLETED' ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <span style={{ fontSize: 11 }}>2</span>
                      )}
                    </div>
                    <div className="step-content">
                      <div className="step-title">Matched to Bullet EV</div>
                      <div className="step-detail">Assigned to driver Jashim</div>
                    </div>
                  </div>

                  <div
                    className={`step ${
                      activeRequest.status === 'STARTED' || activeRequest.status === 'ACTIVE'
                        ? 'active'
                        : activeRequest.status === 'COMPLETED'
                        ? 'done'
                        : ''
                    }`}
                  >
                    <div className="step-dot">
                      {activeRequest.status === 'COMPLETED' ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <span style={{ fontSize: 11 }}>3</span>
                      )}
                    </div>
                    <div className="step-content">
                      <div className="step-title">En Route</div>
                      <div className="step-detail">
                        {activeRequest.status === 'COMPLETED' ? 'Arrived at destination' : 'Dispatched to dropoff'}
                      </div>
                    </div>
                  </div>
                </div>

                {(activeRequest.status === 'MATCHED') && (
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="btn btn-danger"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {cancelling ? 'Cancelling...' : 'Cancel Reservation'}
                  </button>
                )}

                {activeRequest.status === 'COMPLETED' && (
                  <button
                    onClick={() => setActiveRequest(null)}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Book Another Ride
                  </button>
                )}
              </div>
            </div>
          ) : !activeRequest ? (
            /* Booking Form — only shown when no active/pending request exists */
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Select Corridor Route
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {ROUTES.length} routes
                </span>
              </div>
              <div className="card-body">

                {/* Route list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {ROUTES.map((route, i) => {
                    const isSelected =
                      selectedRoute.pickup === route.pickup &&
                      selectedRoute.dropoff === route.dropoff;
                    const color = CORRIDOR_COLORS[route.corridor] ?? 'var(--accent-primary)';
                    return (
                      <div
                        key={i}
                        className={`route-pill ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedRoute(route)}
                        style={{
                          borderColor: isSelected ? color : undefined,
                          background: isSelected
                            ? `color-mix(in srgb, ${color} 8%, var(--bg-base))`
                            : undefined,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="route-from">{route.pickup}</span>
                            <span className="route-arrow">&rarr;</span>
                            <span className="route-to">{route.dropoff.replace('_', ' ')}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: 4,
                                background: `color-mix(in srgb, ${color} 12%, transparent)`,
                                color,
                                letterSpacing: 0.5,
                                border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
                              }}
                            >
                              {route.corridor.replace(/_/g, ' ')}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              · 3 seat capacity
                            </span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              color,
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            BDT {route.estFare}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            est. / seat
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Seat selector */}
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        color: 'var(--text-muted)',
                      }}
                    >
                      Seats to Reserve
                    </label>
                    <span
                      style={{
                        fontSize: 12,
                        color:
                          availableSeats > 0 && availableSeats < selectedSeats
                            ? 'var(--accent-red)'
                            : 'var(--text-secondary)',
                      }}
                    >
                      {availableSeats > 0
                        ? `${availableSeats} seat${availableSeats !== 1 ? 's' : ''} available on Bullet`
                        : 'Bullet at full capacity'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {[1, 2, 3].map((num) => {
                      const isSelected = selectedSeats === num;
                      const isExceeded = availableSeats > 0 && num > availableSeats;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSelectedSeats(num)}
                          disabled={isExceeded}
                          style={{
                            padding: '12px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border: isSelected
                              ? `1px solid ${corridorColor}`
                              : '1px solid var(--border)',
                            background: isSelected
                              ? `color-mix(in srgb, ${corridorColor} 12%, var(--bg-base))`
                              : 'var(--bg-base)',
                            color: isSelected
                              ? corridorColor
                              : isExceeded
                              ? 'var(--text-muted)'
                              : 'var(--text-primary)',
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: isExceeded ? 'not-allowed' : 'pointer',
                            opacity: isExceeded ? 0.35 : 1,
                            transition: 'all 0.2s',
                          }}
                        >
                          {num} {num === 1 ? 'Seat' : 'Seats'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fare isolation guarantee */}
                <div
                  style={{
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      color: 'var(--text-muted)',
                      marginBottom: 8,
                    }}
                  >
                    Fare Isolation Guarantee
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Your fare is calculated strictly on your personal distance. Adding fellow passengers never increases your rate.
                  </div>
                </div>

                <button
                  id="book-ride-btn"
                  onClick={handleBook}
                  disabled={submitting || (availableSeats > 0 && selectedSeats > availableSeats)}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {submitting
                    ? 'Reserving...'
                    : `Confirm Booking — BDT ${estimatedFareTotal} (${selectedSeats} Seat${selectedSeats > 1 ? 's' : ''})`}
                </button>
              </div>
            </div>
          ) : null}

          {/* Seat Occupancy Card — always visible */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                Fleet Seat Occupancy
              </div>
            </div>
            <div className="card-body">
              <SeatMeter manifest={manifest} />
            </div>
          </div>
        </div>

        {/* Right Column: Live Feed */}
        <div>
          <LiveFeed />
        </div>
      </div>
    </div>
  );
}
