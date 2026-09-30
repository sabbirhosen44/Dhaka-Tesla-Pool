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

export default function DriverPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [pool, setPool] = useState<Pool | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [manifest, setManifest] = useState<VehicleManifest | undefined>();
  const [actionLoading, setActionLoading] = useState(false);
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
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'DRIVER') {
      router.push('/passenger');
      return;
    }
    if (user) {
      fetchDriverState();
      const interval = setInterval(fetchDriverState, 3000);
      return () => clearInterval(interval);
    }
  }, [user, isLoading, router, fetchDriverState]);

  const handleAction = async (action: TripAction) => {
    if (!pool) return;
    try {
      setActionLoading(true);
      setError(null);
      await poolAction(pool.id, action);
      await fetchDriverState();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
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
              background: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--accent-primary)',
            }}
          >
            Driver Cockpit
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Operating Vehicle:{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {vehicle?.name || 'Bullet'} ({vehicle?.plate || 'DHAKA-EV-001'})
            </strong>
          </span>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px' }}>
          Jashim Dispatch Console
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
        {/* Left Column: Pool & Manifest Control */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Active Pool Overview */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                Current Corridor Pool
              </div>
              <span className={`badge ${pool ? 'badge-active' : 'badge-completed'}`}>
                {pool ? pool.status : 'STANDBY'}
              </span>
            </div>
            <div className="card-body">
              {pool ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Assigned Corridor
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                        {pool.corridor}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Total Manifest
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-primary)', marginTop: 2 }}>
                        {pool.members.length} / 3 Riders
                      </div>
                    </div>
                  </div>

                  {/* Passenger Manifest Table */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                      Manifest Details
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {pool.members.map((member, idx) => (
                        <div
                          key={member.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            background: 'var(--bg-base)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: 'rgba(56, 189, 248, 0.1)',
                                color: 'var(--accent-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              {idx + 1}
                            </span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                                {member.passenger.name}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {member.passenger.phone}
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
                              BDT {(member.fareInPoysha / 100).toFixed(2)}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                              Isolated
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trip Control Buttons */}
                  <div style={{ display: 'flex', gap: 12 }}>
                    {pool.status === 'MATCHED' && (
                      <button
                        onClick={() => handleAction('START')}
                        disabled={actionLoading}
                        className="btn btn-primary"
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        {actionLoading ? 'Updating...' : 'Start Corridor Trip'}
                      </button>
                    )}

                    {pool.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleAction('COMPLETE')}
                        disabled={actionLoading}
                        className="btn btn-success"
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        {actionLoading ? 'Finalizing...' : 'Complete Trip & Offload'}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-text">
                    No active pool currently in progress. Waiting for corridor match.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Seat Visualizer Card */}
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
