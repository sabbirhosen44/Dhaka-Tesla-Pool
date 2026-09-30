'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="page-container section animate-fade-in" style={{ padding: '64px 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
        {/* Top Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid var(--border-glow)',
            borderRadius: 100,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
            marginBottom: 24,
          }}
        >
          High-Density Urban Carpool Architecture
        </div>

        {/* Hero Title */}
        <h1
          style={{
            fontSize: 'clamp(36px, 6vw, 60px)',
            fontWeight: 800,
            letterSpacing: '-1.5px',
            lineHeight: 1.05,
            marginBottom: 20,
            background: 'linear-gradient(135deg, #ffffff 40%, var(--accent-primary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Dhaka Tesla Pool
        </h1>

        {/* Hero Subtitle */}
        <p
          style={{
            fontSize: 18,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: 36,
            maxWidth: 620,
            margin: '0 auto 36px',
          }}
        >
          High-density corridor carpooling engineered for Banani, Mohakhali, and Gulshan 1.
          Deterministic seat locking, fair poysha calculation, and real-time SSE vehicle telemetry.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {user ? (
            <Link
              href={user.role === 'DRIVER' ? '/driver' : '/passenger'}
              className="btn btn-primary btn-lg"
            >
              Open {user.role === 'DRIVER' ? 'Driver Cockpit' : 'Booking Portal'}
            </Link>
          ) : (
            <Link href="/login" className="btn btn-primary btn-lg">
              Launch Story Switcher
            </Link>
          )}

          <a
            href="http://localhost:4000/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-lg"
          >
            Swagger API Docs
          </a>
        </div>

        {/* Architecture Spec Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginTop: 64,
            textAlign: 'left',
          }}
        >
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 6 }}>
              CORRIDOR MATCHING
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Strict directional alignment preventing zigzag detours through chaotic city traffic.
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-green)', marginBottom: 6 }}>
              ATOMIC SEAT LOCKS
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Database row-level locks prevent over-subscription beyond Bullet’s 3 passenger seats.
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-secondary)', marginBottom: 6 }}>
              ISOLATED FARE ENGINE
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Integer-based poysha precision ensuring rider pricing remains fair and completely isolated.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
