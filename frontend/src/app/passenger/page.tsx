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

const ROUTES = [
  { pickup: 'BANANI', dropoff: 'MOHAKHALI', label: 'Banani to Mohakhali', estFare: '85.00' },
  { pickup: 'BANANI', dropoff: 'GULSHAN_1', label: 'Banani to Gulshan 1', estFare: '95.00' },
];

export default function PassengerPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [selectedRoute, setSelectedRoute] = useState(ROUTES[0]);
  const [activeRequest, setActiveRequest] = useState<RideRequest | null>(null);
  const [manifest, setManifest] = useState<VehicleManifest | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const history = await getMyHistory();
      const current = history.find(
        (r) => r.status === 'PENDING' || r.status === 'MATCHED' || r.status === 'ACTIVE'
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

  return (
    <div className="page-container section animate-fade-in">
      {/* Header bar */}
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
            Signed in as <strong style={{ color: 'var(--text-primary)' }}>{user.name}</strong> ({user.phone})
          </span>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px' }}>
          Reserve Electric Commute
        </h1>
      </div>

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

      <div className="grid-2">
        {/* Left Column: Booking Form or Active Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {activeRequest ? (
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

                <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
                  <div className="stat-block">
                    <div className="stat-label">Isolated Fare</div>
                    <div className="stat-value primary">
                      BDT {(activeRequest.fareInPoysha / 100).toFixed(2)}
                    </div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-label">Corridor Code</div>
                    <div className="stat-value" style={{ fontSize: 18, alignSelf: 'center' }}>
                      {activeRequest.pool?.corridor || 'PENDING'}
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

                  <div className={`step ${activeRequest.status === 'MATCHED' || activeRequest.status === 'ACTIVE' ? 'done' : 'active'}`}>
                    <div className="step-dot">
                      {activeRequest.status === 'MATCHED' || activeRequest.status === 'ACTIVE' ? (
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

                  <div className={`step ${activeRequest.status === 'ACTIVE' ? 'active' : ''}`}>
                    <div className="step-dot">
                      <span style={{ fontSize: 11 }}>3</span>
                    </div>
                    <div className="step-content">
                      <div className="step-title">En Route</div>
                      <div className="step-detail">Dispatched to dropoff</div>
                    </div>
                  </div>
                </div>

                {activeRequest.status === 'PENDING' && (
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="btn btn-danger"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {cancelling ? 'Cancelling...' : 'Cancel Reservation'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Booking Form */
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Select Corridor Route
                </div>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {ROUTES.map((route, i) => {
                    const isSelected =
                      selectedRoute.pickup === route.pickup && selectedRoute.dropoff === route.dropoff;
                    return (
                      <div
                        key={i}
                        className={`route-pill ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedRoute(route)}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="route-from">{route.pickup}</span>
                            <span className="route-arrow">&rarr;</span>
                            <span className="route-to">{route.dropoff}</span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                            Direct corridor · 3 passenger capacity
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                            BDT {route.estFare}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Standard
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 8 }}>
                    Fare Isolation Guarantee
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Your fare is calculated strictly on your personal distance. Adding fellow passengers never increases your rate.
                  </div>
                </div>

                <button
                  id="book-ride-btn"
                  onClick={handleBook}
                  disabled={submitting}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {submitting ? 'Reserving...' : `Confirm Booking — BDT ${selectedRoute.estFare}`}
                </button>
              </div>
            </div>
          )}

          {/* Seat Status Card */}
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
