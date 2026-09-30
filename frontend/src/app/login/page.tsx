'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getActors, Actor, API_BASE } from '@/lib/api';

const ACTOR_BIOS: Record<string, string> = {
  Jashim: 'Tesla Model 3 "Bullet" driver — Banani corridors',
  Kabir: 'Tesla Model Y "Thunder" driver — Fleet EV driver',
  Nusrat: 'Daily commuter — Banani to Mohakhali route',
  Rafiq: 'Shares corridor pool with Nusrat when available',
  Shirin: 'Active rider on the Gulshan 1 corridor',
  Tanvir: 'Long-distance commuter — Banani to Uttara / Mirpur',
  Anika: 'Tech worker commuting to Farmgate corridor',
};

export default function LoginPage() {
  const { login } = useAuth();
  const [actors, setActors] = useState<Actor[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    getActors()
      .then(setActors)
      .catch((err) => setError(`Backend offline (${API_BASE}): ${err?.message || 'Please check backend URL or CORS'}`))
      .finally(() => setFetching(false));
  }, []);

  const handleLogin = async (actorName: string) => {
    try {
      setLoading(actorName);
      setError(null);
      await login(actorName);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(null);
    }
  };

  return (
    <div className="page-container section animate-fade-in">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
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
            marginBottom: 20,
          }}
        >
          Single-Click Actor Switcher
        </div>
        <h1
          style={{
            fontSize: 'clamp(28px, 5vw, 44px)',
            fontWeight: 800,
            letterSpacing: '-1px',
            lineHeight: 1.1,
            marginBottom: 16,
            background: 'linear-gradient(135deg, var(--text-primary), var(--accent-primary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Select Story Profile
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto' }}>
          Select an actor to instantly authenticate with a pre-configured JWT session.
        </p>
      </div>

      {/* Error Banner */}
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
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      {/* Actor Grid */}
      {fetching ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <div className="spinner" />
        </div>
      ) : (
        <div className="actor-grid" style={{ maxWidth: 880, margin: '0 auto' }}>
          {actors.map((actor) => (
            <button
              key={actor.id}
              id={`actor-btn-${actor.name.toLowerCase()}`}
              className={`actor-card ${actor.role === 'DRIVER' ? 'driver' : 'passenger'}`}
              onClick={() => handleLogin(actor.name)}
              disabled={loading !== null}
              style={{
                opacity: loading && loading !== actor.name ? 0.5 : 1,
              }}
            >
              {/* Loading overlay */}
              {loading === actor.name && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(8, 11, 20, 0.7)',
                    borderRadius: 'inherit',
                    zIndex: 1,
                  }}
                >
                  <div className="spinner" style={{ width: 28, height: 28, borderWidth: 2 }} />
                </div>
              )}

              <div className="actor-avatar">
                <span style={{ fontSize: 24, fontWeight: 700 }}>
                  {actor.name.charAt(0)}
                </span>
              </div>

              <div>
                <div className="actor-name">{actor.name}</div>
                <div className="actor-role">{actor.role}</div>
                <div className="actor-phone">{actor.phone}</div>
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  lineHeight: 1.4,
                  marginTop: 4,
                  minHeight: 34,
                }}
              >
                {ACTOR_BIOS[actor.name] || 'Carpool participant'}
              </div>

              <div className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                {actor.role === 'DRIVER' ? 'Enter Driver Console' : `Continue as ${actor.name}`}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Footer hint */}
      <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--text-muted)', fontSize: 13 }}>
        Backend API Target:{' '}
        <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
          http://localhost:4000/api
        </code>
      </div>
    </div>
  );
}
