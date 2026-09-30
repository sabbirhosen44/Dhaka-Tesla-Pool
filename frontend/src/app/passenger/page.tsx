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
  getAllVehicles,
  RideRequest,
  Vehicle,
  VehicleManifest,
} from '@/lib/api';
import SeatMeter from '@/components/SeatMeter';
import LiveFeed from '@/components/LiveFeed';

const ROUTES = [
  { pickup: 'BANANI', dropoff: 'MOHAKHALI', label: 'Banani → Mohakhali', corridor: 'CENTRAL_CONNECT', estFare: '97.50' },
  { pickup: 'BANANI', dropoff: 'GULSHAN_1', label: 'Banani → Gulshan 1', corridor: 'CENTRAL_CONNECT', estFare: '90.00' },
  { pickup: 'BANANI', dropoff: 'GULSHAN_2', label: 'Banani → Gulshan 2', corridor: 'CENTRAL_NORTH', estFare: '75.00' },
  { pickup: 'BANANI', dropoff: 'UTTARA', label: 'Banani → Uttara', corridor: 'NORTH_SUBURB', estFare: '215.62' },
  { pickup: 'BANANI', dropoff: 'FARMGATE', label: 'Banani → Farmgate', corridor: 'CENTRAL_SOUTH', estFare: '140.62' },
  { pickup: 'BANANI', dropoff: 'DHANMONDI', label: 'Banani → Dhanmondi', corridor: 'WEST_SOUTH', estFare: '187.50' },
  { pickup: 'BANANI', dropoff: 'MIRPUR', label: 'Banani → Mirpur', corridor: 'WEST_NORTH', estFare: '172.50' },
];

const CORRIDOR_COLORS: Record<string, string> = {
  CENTRAL_CONNECT: 'var(--accent-primary)',
  CENTRAL_NORTH: 'var(--accent-secondary)',
  NORTH_SUBURB: 'var(--accent-green)',
  CENTRAL_SOUTH: 'var(--accent-orange)',
  WEST_SOUTH: '#a78bfa',
  WEST_NORTH: '#f472b6',
};

// Status sets used by lifecycle checks
const AFTER_MATCH = ['MATCHED', 'DRIVER_ARRIVED', 'STARTED', 'ACTIVE', 'COMPLETED'];
const AFTER_ARRIVE = ['STARTED', 'ACTIVE', 'COMPLETED'];
const IN_PROGRESS = ['STARTED', 'ACTIVE'];

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function PassengerPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [selectedRoute, setSelectedRoute] = useState(ROUTES[0]);
  const [selectedSeats, setSelectedSeats] = useState(1);
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('auto');
  const [activeRequest, setActiveRequest] = useState<RideRequest | null>(null);
  const [manifest, setManifest] = useState<VehicleManifest | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const history = await getMyHistory();
      const current = history.find((r) =>
        ['REQUESTED', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED', 'ACTIVE'].includes(r.status)
      );
      setActiveRequest(current ?? null);

      const [bullet, vehicles] = await Promise.all([
        getBullet().catch(() => null),
        getAllVehicles(true).catch(() => []),
      ]);

      if (vehicles.length > 0) setFleet(vehicles);
      if (bullet?.id) setManifest(await getManifest(bullet.id).catch(() => undefined));
    } catch { /* silent */ }
  }, []);

  const selectedVehicle = fleet.find((v) => v.id === selectedVehicleId);
  const fleetMaxAvailable = fleet.reduce(
    (max, v) => Math.max(max, v.availableSeats ?? v.capacity),
    0
  );
  const availableSeats =
    selectedVehicleId === 'auto'
      ? fleetMaxAvailable
      : selectedVehicle
        ? (selectedVehicle.availableSeats ?? selectedVehicle.capacity)
        : 0;

  useEffect(() => {
    if (availableSeats > 0 && selectedSeats > availableSeats) {
      setSelectedSeats(availableSeats);
    }
  }, [availableSeats, selectedSeats]);

  useEffect(() => {
    if (!isLoading && !user) { router.push('/login'); return; }
    if (user?.role === 'DRIVER') { router.push('/driver'); return; }
    if (user) {
      fetchStatus();
      const t = setInterval(fetchStatus, 3000);
      return () => clearInterval(t);
    }
  }, [user, isLoading, router, fetchStatus]);

  const handleBook = async () => {
    try {
      setSubmitting(true); setError(null);
      const req = await createRideRequest({
        pickupZone: selectedRoute.pickup,
        dropoffZone: selectedRoute.dropoff,
        seatsRequested: selectedSeats,
        preferredVehicleId: selectedVehicleId !== 'auto' ? selectedVehicleId : undefined,
      });
      setActiveRequest(req);
      await fetchStatus();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ride request failed');
    } finally { setSubmitting(false); }
  };

  const handleCancel = async () => {
    if (!activeRequest) return;
    try {
      setCancelling(true); setError(null);
      await cancelRideRequest(activeRequest.id);
      setActiveRequest(null);
      await fetchStatus();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Cancellation failed');
    } finally { setCancelling(false); }
  };

  if (isLoading || !user) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner" /></div>;
  }

  const pool = activeRequest?.pool as unknown as Record<string, unknown> | null;
  const poolVehicle = pool?.vehicle as { model?: string } | undefined;
  const poolDriver = pool?.driver as { name?: string; phone?: string } | undefined;
  const vehicleName = poolVehicle?.model || 'Bullet';
  const driverName = poolDriver?.name || 'Jashim';

  const rawFarePoysha = activeRequest?.fareInPoysha || (pool?.myFarePoysha as number) || 0;
  const displayFareBDT = rawFarePoysha > 0
    ? (rawFarePoysha / 100).toFixed(2)
    : (parseFloat(selectedRoute.estFare) * selectedSeats).toFixed(2);
  const displayCorridor =
    (activeRequest as Record<string, string> | null)?.corridor ||
    activeRequest?.pool?.corridor ||
    selectedRoute.corridor;
  const estimatedFareTotal = (parseFloat(selectedRoute.estFare) * selectedSeats).toFixed(2);
  const isUnmatched = activeRequest?.status === 'REQUESTED';
  const corridorColor = CORRIDOR_COLORS[selectedRoute.corridor] ?? 'var(--accent-primary)';
  const status = activeRequest?.status ?? '';

  return (
    <div className="page-container section animate-fade-in">

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, padding: '4px 10px', borderRadius: 100, background: 'rgba(129,140,248,0.15)', color: 'var(--accent-secondary)' }}>
            Passenger Portal
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Signed in as <strong style={{ color: 'var(--text-primary)' }}>{user.name}</strong> ({user.phone})
          </span>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px' }}>Reserve Electric Commute</h1>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 'var(--radius-md)', padding: '14px 20px', color: 'var(--accent-red)', fontSize: 14, marginBottom: 24 }}>
          {error}
        </div>
      )}

      {/* Unmatched / no-vehicle warning */}
      {isUnmatched && (
        <div style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.35)', borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-orange)', marginBottom: 4 }}>No vehicle available right now</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Your seat request is queued ({activeRequest?.pickupZone} &rarr; {activeRequest?.dropoffZone},{' '}
              {activeRequest?.seatsRequested} seat{(activeRequest?.seatsRequested ?? 1) > 1 ? 's' : ''}).
              All Bullet EVs are at full capacity or offline or your route are not match for pool.
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <button id="btn-cancel-queued" onClick={handleCancel} disabled={cancelling} className="btn btn-danger btn-sm">
                {cancelling ? 'Cancelling...' : 'Cancel Request'}
              </button>
              <button onClick={fetchStatus} className="btn btn-secondary btn-sm">Check Again</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── ACTIVE TRIP CARD ── */}
          {activeRequest && !isUnmatched && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  Trip Status
                </div>
                <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>
              </div>
              <div className="card-body">

                {/* Route + stats */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Route</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                    {activeRequest.pickupZone} &rarr; {activeRequest.dropoffZone.replace('_', ' ')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
                  <div className="stat-block">
                    <div className="stat-label">Isolated Fare</div>
                    <div className="stat-value primary">BDT {displayFareBDT}</div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-label">Seats</div>
                    <div className="stat-value primary">{activeRequest.seatsRequested ?? 1}</div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-label">Corridor</div>
                    <span style={{
                      fontSize: 12, fontWeight: 700, marginTop: 6, display: 'inline-block',
                      padding: '3px 10px', borderRadius: 100,
                      background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
                      color: CORRIDOR_COLORS[displayCorridor] ?? 'var(--accent-primary)',
                    }}>
                      {displayCorridor}
                    </span>
                  </div>
                </div>

                {/* 4-step lifecycle stepper */}
                <div className="stepper" style={{ marginBottom: 24 }}>

                  <div className="step done">
                    <div className="step-dot"><CheckIcon /></div>
                    <div className="step-content">
                      <div className="step-title">Request Submitted</div>
                      <div className="step-detail">Seat lock initiated</div>
                    </div>
                  </div>

                  <div className={`step ${AFTER_MATCH.includes(status) ? 'done' : ''}`}>
                    <div className="step-dot">{AFTER_MATCH.includes(status) ? <CheckIcon /> : <span style={{ fontSize: 11 }}>2</span>}</div>
                    <div className="step-content">
                      <div className="step-title">Matched to {vehicleName} EV</div>
                      <div className="step-detail">Driver {driverName} · Seat(s) locked</div>
                    </div>
                  </div>

                  <div className={`step ${status === 'DRIVER_ARRIVED' ? 'active' : AFTER_ARRIVE.includes(status) ? 'done' : ''}`}>
                    <div className="step-dot">{AFTER_ARRIVE.includes(status) ? <CheckIcon /> : <span style={{ fontSize: 11 }}>3</span>}</div>
                    <div className="step-content">
                      <div className="step-title">Driver En Route</div>
                      <div className="step-detail">
                        {status === 'DRIVER_ARRIVED' ? `${vehicleName} EV at pickup — board now` : `${driverName} heading to pickup`}
                      </div>
                    </div>
                  </div>

                  <div className={`step ${IN_PROGRESS.includes(status) ? 'active' : status === 'COMPLETED' ? 'done' : ''}`}>
                    <div className="step-dot">{status === 'COMPLETED' ? <CheckIcon /> : <span style={{ fontSize: 11 }}>4</span>}</div>
                    <div className="step-content">
                      <div className="step-title">Trip Complete</div>
                      <div className="step-detail">{status === 'COMPLETED' ? 'Arrived at destination' : 'Dropoff pending'}</div>
                    </div>
                  </div>
                </div>

                {/* Driver & Vehicle info card when matched */}
                {AFTER_MATCH.includes(status) && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(56, 189, 248, 0.05)',
                    border: '1px solid rgba(56, 189, 248, 0.15)',
                    marginBottom: 20,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent-primary), #0284c7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        color: '#fff',
                        fontSize: 16,
                      }}>
                        {driverName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          Driver: {driverName}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {vehicleName} EV · {poolDriver?.phone || 'Fleet Verified'}
                        </div>
                      </div>
                    </div>
                    <span className="badge badge-matched" style={{ fontSize: 11 }}>
                      Verified EV
                    </span>
                  </div>
                )}

                {/* ── Per-status action area ── */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>

                  {/* MATCHED: can still cancel before driver departs */}
                  {status === 'MATCHED' && (
                    <button
                      id="btn-cancel-reservation"
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="btn btn-danger"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      {cancelling ? 'Cancelling...' : 'Cancel Reservation'}
                    </button>
                  )}

                  {/* DRIVER_ARRIVED: board prompt */}
                  {status === 'DRIVER_ARRIVED' && (
                    <div style={{ padding: '13px 16px', background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--accent-primary)', fontWeight: 600 }}>
                      Bullet EV has arrived at Banani Road 11. Please board the vehicle.
                    </div>
                  )}

                  {/* STARTED / ACTIVE: trip live */}
                  {IN_PROGRESS.includes(status) && (
                    <div style={{ padding: '13px 16px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--accent-green)', fontWeight: 600 }}>
                      Trip in progress — sit back and enjoy the ride.
                    </div>
                  )}

                  {/* COMPLETED */}
                  {status === 'COMPLETED' && (
                    <button
                      id="btn-book-again"
                      onClick={() => setActiveRequest(null)}
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      Book Another Ride
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── BOOKING FORM (no active request) ── */}
          {!activeRequest && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Select Corridor Route
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ROUTES.length} routes</span>
              </div>
              <div className="card-body">

                {/* Route list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {ROUTES.map((route, i) => {
                    const isSel = selectedRoute.pickup === route.pickup && selectedRoute.dropoff === route.dropoff;
                    const color = CORRIDOR_COLORS[route.corridor] ?? 'var(--accent-primary)';
                    return (
                      <div
                        key={i}
                        className={`route-pill ${isSel ? 'selected' : ''}`}
                        onClick={() => setSelectedRoute(route)}
                        style={{ borderColor: isSel ? color : undefined }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="route-from">{route.pickup}</span>
                            <span className="route-arrow">&rarr;</span>
                            <span className="route-to">{route.dropoff.replace('_', ' ')}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, letterSpacing: 0.5,
                              background: `${color}1a`, color, border: `1px solid ${color}4d`,
                            }}>
                              {route.corridor.replace(/_/g, ' ')}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· 3 seat capacity</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>
                            BDT {route.estFare}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>est. / seat</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Driver / EV Selector */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>
                      Select Driver &amp; Tesla EV
                    </label>
                    <span style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 600 }}>
                      {fleet.length} EVs Online
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Option 1: Auto-Assign */}
                    <div
                      className={`route-pill ${selectedVehicleId === 'auto' ? 'selected' : ''}`}
                      onClick={() => setSelectedVehicleId('auto')}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderColor: selectedVehicleId === 'auto' ? 'var(--accent-primary)' : undefined,
                        background: selectedVehicleId === 'auto' ? 'rgba(56, 189, 248, 0.08)' : undefined,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'rgba(56, 189, 248, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 16,
                          flexShrink: 0,
                        }}>
                          ⚡
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                            Auto-Assign (Fastest Corridor Match)
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            System picks optimal Tesla EV along your corridor
                          </div>
                        </div>
                        <span className="badge badge-matched" style={{ fontSize: 10 }}>
                          Recommended
                        </span>
                      </div>
                    </div>

                    {/* Fleet vehicles */}
                    {fleet.map((v) => {
                      const isSel = selectedVehicleId === v.id;
                      const driverName = v.driver?.name || 'Driver';
                      const occ = v.occupiedSeats ?? 0;
                      const avail = v.availableSeats ?? Math.max(0, v.capacity - occ);
                      const isFull = avail === 0;

                      return (
                        <div
                          key={v.id}
                          className={`route-pill ${isSel ? 'selected' : ''}`}
                          onClick={() => setSelectedVehicleId(v.id)}
                          style={{
                            padding: '10px 14px',
                            cursor: 'pointer',
                            borderColor: isSel ? 'var(--accent-secondary)' : undefined,
                            background: isSel ? 'rgba(129, 140, 248, 0.08)' : undefined,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, var(--accent-secondary), #6366f1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              color: '#fff',
                              fontSize: 14,
                              flexShrink: 0,
                            }}>
                              {driverName.charAt(0)}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {driverName}
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                  · {v.model} EV
                                </span>
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {v.activePool?.corridor
                                  ? `Corridor: ${v.activePool.corridor.replace('_', ' ')}`
                                  : 'Idle / Ready for any corridor'}
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                              <span style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: isFull ? 'var(--accent-red)' : occ > 0 ? 'var(--accent-orange)' : 'var(--accent-green)',
                                background: isFull ? 'rgba(239, 68, 68, 0.1)' : occ > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                padding: '2px 8px',
                                borderRadius: 100,
                              }}>
                                {isFull ? '🔴 FULL (3/3)' : occ > 0 ? `🟡 ${avail} Seat${avail !== 1 ? 's' : ''} Left` : `🟢 ${avail} Seats Free`}
                              </span>
                              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                {occ}/{v.capacity} Seats Occupied
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Seat selector */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>
                      Seats to Reserve
                    </label>
                    <span style={{ fontSize: 12, color: availableSeats === 0 || selectedSeats > availableSeats ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                      {selectedVehicleId === 'auto'
                        ? availableSeats > 0
                          ? `${availableSeats} max seat${availableSeats !== 1 ? 's' : ''} available in fleet`
                          : 'Fleet at full capacity'
                        : availableSeats > 0
                          ? `${availableSeats} seat${availableSeats !== 1 ? 's' : ''} available on ${selectedVehicle?.model || 'EV'} (${selectedVehicle?.driver?.name || 'Driver'})`
                          : `${selectedVehicle?.model || 'EV'} (${selectedVehicle?.driver?.name || 'Driver'}) is full`}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {[1, 2, 3].map((num) => {
                      const isSel = selectedSeats === num;
                      const exceeded = availableSeats > 0 ? num > availableSeats : true;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSelectedSeats(num)}
                          disabled={exceeded}
                          style={{
                            padding: '12px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border: isSel ? `1px solid ${corridorColor}` : '1px solid var(--border)',
                            background: isSel ? `${corridorColor}1a` : 'var(--bg-base)',
                            color: isSel ? corridorColor : exceeded ? 'var(--text-muted)' : 'var(--text-primary)',
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: exceeded ? 'not-allowed' : 'pointer',
                            opacity: exceeded ? 0.35 : 1,
                            transition: 'all 0.2s',
                          }}
                        >
                          {num} {num === 1 ? 'Seat' : 'Seats'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fare isolation note */}
                <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Fare Isolation Guarantee
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Your fare is calculated strictly on your personal distance. Adding fellow passengers never increases your rate.
                  </div>
                </div>

                {/* Corridor Matching Rule Explainer */}
                <div style={{
                  background: 'rgba(56, 189, 248, 0.04)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: 14,
                  marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 13 }}>🧭</span>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--accent-primary)' }}>
                      Strict Corridor Matching Engine
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    Pools only combine riders along the <strong>same directional corridor</strong> (e.g., Mohakhali &amp; Gulshan 1).
                    Divergent trips (like <strong>Mirpur</strong> vs <strong>Uttara</strong>) are <u>never combined</u> into the same vehicle to eliminate cross-town detours.
                  </div>
                </div>

                <button
                  id="book-ride-btn"
                  onClick={handleBook}
                  disabled={submitting || (availableSeats > 0 && selectedSeats > availableSeats)}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {submitting ? 'Reserving...' : `Confirm Booking — BDT ${estimatedFareTotal} (${selectedSeats} Seat${selectedSeats > 1 ? 's' : ''})`}
                </button>
              </div>
            </div>
          )}

          {/* Fleet Seat Occupancy — all EVs in fleet */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                Fleet Seat Occupancy ({fleet.length} EVs Online)
              </div>
            </div>
            <div className="card-body">
              {fleet.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: 13 }}>
                  No online vehicles detected.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {fleet.map((v) => {
                    const occ = v.occupiedSeats ?? 0;
                    const avail = v.availableSeats ?? Math.max(0, v.capacity - occ);
                    const isFull = avail === 0;
                    const driverName = v.driver?.name || 'Driver';

                    return (
                      <div
                        key={v.id}
                        style={{
                          background: 'var(--bg-base)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: 14,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--accent-secondary), #6366f1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                color: '#fff',
                                fontSize: 12,
                              }}
                            >
                              {driverName.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                                {v.model} EV — {driverName}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {v.activePool?.corridor
                                  ? `Active Corridor: ${v.activePool.corridor.replace('_', ' ')}`
                                  : 'Idle / Ready for any corridor'}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`badge ${isFull ? 'badge-danger' : occ > 0 ? 'badge-matched' : 'badge-completed'}`}
                            style={{ fontSize: 10 }}
                          >
                            {isFull ? '🔴 Full (3/3)' : occ > 0 ? `🟡 ${avail} Seat${avail !== 1 ? 's' : ''} Left` : '🟢 Empty (3/3 Free)'}
                          </span>
                        </div>

                        {/* Seat Visual Blocks */}
                        <div style={{ display: 'flex', gap: 8 }}>
                          {Array.from({ length: v.capacity }).map((_, i) => {
                            const pass = v.activePool?.passengers?.[i];
                            const isOccupied = i < occ;
                            return (
                              <div
                                key={i}
                                className={`seat-block ${isOccupied ? 'occupied' : 'empty'}`}
                                style={{ flex: 1, padding: '10px 8px' }}
                                title={pass ? `${pass.passengerName} (${pass.pickupZone} → ${pass.dropoffZone})` : `Seat ${i + 1} Available`}
                              >
                                <span style={{ fontSize: 13, fontWeight: 700, color: isOccupied ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                                  {isOccupied ? (pass?.passengerName ? pass.passengerName.charAt(0) : 'P') : `S${i + 1}`}
                                </span>
                                <span className="seat-label" style={{ fontSize: 10 }}>
                                  {isOccupied ? (pass?.passengerName?.split(' ')[0] || 'Occupied') : 'Available'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Live Feed */}
        <div><LiveFeed /></div>
      </div>
    </div>
  );
}
