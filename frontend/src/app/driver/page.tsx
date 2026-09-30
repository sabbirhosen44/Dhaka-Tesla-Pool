'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  getActivePool,
  poolAction,
  getBullet,
  getManifest,
  Pool,
  Vehicle,
  VehicleManifest,
  TripAction,
} from '@/lib/api';
import SeatMeter from '@/components/SeatMeter';
import LiveFeed from '@/components/LiveFeed';

// Pool status lifecycle: OPEN → FULL → ACTIVE → COMPLETED
// TripAction:  ARRIVE (marks ACTIVE), START (marks ACTIVE + STARTED rides), COMPLETE (ends trip)

function PoolStatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    OPEN:      { cls: 'badge-matched',   label: 'OPEN — Accepting Riders' },
    FULL:      { cls: 'badge-pending',   label: 'FULL — Ready to Depart' },
    ACTIVE:    { cls: 'badge-active',    label: 'ACTIVE — En Route' },
    COMPLETED: { cls: 'badge-completed', label: 'COMPLETED' },
    STANDBY:   { cls: 'badge-completed', label: 'STANDBY' },
  };
  const { cls, label } = map[status] ?? { cls: 'badge-completed', label: status };
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function DriverPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [pool, setPool] = useState<Pool | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [manifest, setManifest] = useState<VehicleManifest | undefined>();
  const [actionLoading, setActionLoading] = useState<TripAction | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDriverState = useCallback(async () => {
    try {
      const bullet = await getBullet();
      setVehicle(bullet);
      if (bullet?.id) {
        const m = await getManifest(bullet.id);
        setManifest(m);
      }
      const active = await getActivePool().catch(() => null);
      setPool(active);
    } catch (err: unknown) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !user) { router.push('/login'); return; }
    if (user && user.role !== 'DRIVER') { router.push('/passenger'); return; }
    if (user) {
      fetchDriverState();
      const interval = setInterval(fetchDriverState, 3000);
      return () => clearInterval(interval);
    }
  }, [user, isLoading, router, fetchDriverState]);

  const handleAction = async (action: TripAction) => {
    if (!pool) return;
    try {
      setActionLoading(action);
      setError(null);
      setSuccess(null);
      await poolAction(pool.id, action);
      const labels: Record<TripAction, string> = {
        ARRIVE:   'Driver arrived at pickup point.',
        START:    'Corridor trip started — en route to dropoffs.',
        COMPLETE: 'Trip completed. All passengers offloaded.',
      };
      setSuccess(labels[action]);
      await fetchDriverState();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const members = (pool?.members ?? []) as Array<{
    id: string;
    passenger?: { name?: string; phone?: string };
    fareInPoysha?: number;
    fareBDT?: string;
    pickupZone?: string;
    dropoffZone?: string;
    seatsAllocated?: number;
  }>;

  const totalEarningBDT = members.reduce((sum, m) => {
    const fare = m.fareInPoysha ?? 0;
    return sum + fare / 100;
  }, 0).toFixed(2);

  return (
    <div className="page-container section animate-fade-in">

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
            padding: '4px 10px', borderRadius: 100,
            background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-primary)',
          }}>
            Driver Cockpit
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Operating Vehicle:{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {vehicle?.name ?? 'Bullet'} ({vehicle?.plate ?? 'DHAKA-EV-001'})
            </strong>
          </span>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px' }}>
          {user.name} Dispatch Console
        </h1>
      </div>

      {/* Error / Success banners */}
      {error && (
        <div style={{
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)',
          borderRadius: 'var(--radius-md)', padding: '14px 20px',
          color: 'var(--accent-red)', fontSize: 14, marginBottom: 24,
        }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{
          background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)',
          borderRadius: 'var(--radius-md)', padding: '14px 20px',
          color: 'var(--accent-green)', fontSize: 14, marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {success}
        </div>
      )}

      <div className="grid-2">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Pool Overview Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13" rx="1" />
                  <path d="M16 8h4l3 3v5h-7V8z" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                Current Corridor Pool
              </div>
              <PoolStatusBadge status={pool?.status ?? 'STANDBY'} />
            </div>

            <div className="card-body">
              {pool ? (
                <>
                  {/* Corridor + stats row */}
                  <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
                    <div className="stat-block">
                      <div className="stat-label">Corridor</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-primary)', marginTop: 4 }}>
                        {pool.corridor}
                      </div>
                    </div>
                    <div className="stat-block">
                      <div className="stat-label">Riders</div>
                      <div className="stat-value primary">{members.length} / 3</div>
                    </div>
                    <div className="stat-block">
                      <div className="stat-label">Total Fare</div>
                      <div className="stat-value green">BDT {totalEarningBDT}</div>
                    </div>
                  </div>

                  {/* Manifest table */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
                      color: 'var(--text-muted)', letterSpacing: 0.5, marginBottom: 10,
                    }}>
                      Passenger Manifest
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {members.length === 0 ? (
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>
                          No passengers matched yet.
                        </div>
                      ) : members.map((m, idx) => {
                        const name = m.passenger?.name ?? 'Passenger';
                        const phone = m.passenger?.phone ?? '';
                        const fareBDT = m.fareBDT ?? ((m.fareInPoysha ?? 0) / 100).toFixed(2);
                        const seats = m.seatsAllocated ?? 1;
                        return (
                          <div key={m.id ?? idx} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 14px',
                            background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{
                                width: 28, height: 28, borderRadius: '50%',
                                background: 'rgba(56,189,248,0.1)', color: 'var(--accent-primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, fontWeight: 700, flexShrink: 0,
                              }}>
                                {name.charAt(0)}
                              </span>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {name}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                  {phone} · {seats} seat{seats > 1 ? 's' : ''}
                                  {m.pickupZone && m.dropoffZone && (
                                    <> · {m.pickupZone} &rarr; {m.dropoffZone.replace('_', ' ')}</>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{
                                fontSize: 13, fontWeight: 700,
                                color: 'var(--accent-green)', fontFamily: 'var(--font-mono)',
                              }}>
                                BDT {fareBDT}
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                Isolated fare
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Trip Lifecycle Controls ── */}
                  <div style={{
                    borderTop: '1px solid var(--border)', paddingTop: 20,
                  }}>
                    <div style={{
                      fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
                      color: 'var(--text-muted)', letterSpacing: 0.5, marginBottom: 12,
                    }}>
                      Trip Controls
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                      {/* OPEN or FULL → driver can ARRIVE at pickup */}
                      {(pool.status === 'OPEN' || pool.status === 'FULL') && (
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            id="btn-arrive"
                            onClick={() => handleAction('ARRIVE')}
                            disabled={actionLoading !== null}
                            className="btn btn-secondary"
                            style={{ flex: 1, justifyContent: 'center' }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                              <circle cx="12" cy="9" r="2.5" />
                            </svg>
                            {actionLoading === 'ARRIVE' ? 'Updating...' : 'Arrive at Pickup Point'}
                          </button>
                          <button
                            id="btn-start"
                            onClick={() => handleAction('START')}
                            disabled={actionLoading !== null}
                            className="btn btn-primary"
                            style={{ flex: 1, justifyContent: 'center' }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                            {actionLoading === 'START' ? 'Starting...' : 'Start Corridor Trip'}
                          </button>
                        </div>
                      )}

                      {/* ACTIVE → driver can COMPLETE the trip */}
                      {pool.status === 'ACTIVE' && (
                        <button
                          id="btn-complete"
                          onClick={() => handleAction('COMPLETE')}
                          disabled={actionLoading !== null}
                          className="btn btn-success"
                          style={{ width: '100%', justifyContent: 'center' }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {actionLoading === 'COMPLETE' ? 'Finalizing...' : 'Complete Trip & Offload Passengers'}
                        </button>
                      )}

                      {/* COMPLETED */}
                      {pool.status === 'COMPLETED' && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '14px 16px',
                          background: 'rgba(52,211,153,0.06)',
                          border: '1px solid rgba(52,211,153,0.2)',
                          borderRadius: 'var(--radius-sm)',
                        }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span style={{ fontSize: 13, color: 'var(--accent-green)', fontWeight: 600 }}>
                            Trip completed. Waiting for next corridor match.
                          </span>
                        </div>
                      )}

                      {/* What each button does — contextual hint */}
                      <div style={{
                        fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 4,
                      }}>
                        {pool.status === 'OPEN' && 'Pool is open — more passengers can still join before departure.'}
                        {pool.status === 'FULL' && 'All seats filled. Proceed to pickup point, then start the trip.'}
                        {pool.status === 'ACTIVE' && 'Trip is live. Complete once all passengers have been dropped off.'}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ opacity: 0.4 }}>
                    <rect x="1" y="3" width="15" height="13" rx="1" />
                    <path d="M16 8h4l3 3v5h-7V8z" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                  <div className="empty-state-text">
                    No active pool. Waiting for passenger corridor match.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Seat Visualizer */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                Vehicle Manifest & Seats
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
