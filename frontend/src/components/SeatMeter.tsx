'use client';

import { VehicleManifest } from '@/lib/api';

interface SeatMeterProps {
  manifest?: VehicleManifest;
  loading?: boolean;
}

export default function SeatMeter({ manifest, loading }: SeatMeterProps) {
  if (loading) {
    return (
      <div style={{ display: 'flex', gap: 10 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="seat-block empty" style={{ opacity: 0.4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>S{i}</span>
            <span className="seat-label">EMPTY</span>
          </div>
        ))}
      </div>
    );
  }

  const totalCapacity = manifest?.totalCapacity ?? 3;
  const passengers = manifest?.passengers ?? [];
  const seatsOccupied = manifest?.seatsOccupied ?? 0;
  const seatsRemaining = manifest?.seatsRemaining ?? totalCapacity;

  return (
    <div>
      {/* Bullet EV header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <path d="M9 17h6" />
            <circle cx="17" cy="17" r="2" />
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
            {manifest?.vehicle.name ?? 'Bullet'} — {manifest?.vehicle.plate ?? 'DHAKA-EV-001'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Tesla Model 3 · Electric Fleet · Capacity: {totalCapacity} Seats
          </div>
        </div>
      </div>

      {/* Seat visual */}
      <div className="seat-meter" style={{ marginBottom: 16 }}>
        {Array.from({ length: totalCapacity }).map((_, i) => {
          const passenger = passengers[i];
          const occupied = i < seatsOccupied;
          return (
            <div
              key={i}
              className={`seat-block ${occupied ? 'occupied' : 'empty'} animate-fade-in`}
              title={passenger ? passenger.name : `Seat ${i + 1} — Available`}
            >
              {occupied ? (
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-primary)' }}>
                  {passenger ? passenger.name.charAt(0) : 'P'}
                </span>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                  <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
                  <path d="M3 13v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
                  <line x1="8" y1="21" x2="8" y2="17" />
                  <line x1="16" y1="21" x2="16" y2="17" />
                </svg>
              )}
              <span className="seat-label">
                {occupied && passenger ? passenger.name.split(' ')[0] : `S${i + 1}`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Capacity stats */}
      <div style={{ display: 'flex', gap: 24 }}>
        <div className="stat-block">
          <div className="stat-label">Occupied</div>
          <div className="stat-value primary">{seatsOccupied}</div>
        </div>
        <div className="stat-block">
          <div className="stat-label">Available</div>
          <div className="stat-value green">{seatsRemaining}</div>
        </div>
        <div className="stat-block">
          <div className="stat-label">Capacity</div>
          <div className="stat-value">{totalCapacity}</div>
        </div>
      </div>

      {/* Fill bar */}
      <div
        style={{
          marginTop: 14,
          height: 6,
          background: 'var(--border)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${(seatsOccupied / totalCapacity) * 100}%`,
            background:
              seatsOccupied === totalCapacity
                ? 'var(--accent-red)'
                : 'linear-gradient(90deg, var(--accent-primary), var(--accent-green))',
            borderRadius: 4,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
        {seatsOccupied === totalCapacity
          ? 'Pool full — Maximum capacity reached'
          : `${seatsRemaining} seat${seatsRemaining !== 1 ? 's' : ''} remaining`}
      </div>
    </div>
  );
}
