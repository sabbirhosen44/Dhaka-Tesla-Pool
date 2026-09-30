'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isLoginPage = pathname === '/login';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link href="/" className="navbar-brand">
          <div className="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div>
            <div className="brand-name">Dhaka Tesla Pool</div>
            <div className="brand-sub">Smart EV Carpooling</div>
          </div>
        </Link>

        {/* Actions */}
        <div className="navbar-actions">
          {user ? (
            <>
              {/* Current user chip */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 14px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 100,
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: user.role === 'DRIVER' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(129, 140, 248, 0.2)',
                    color: user.role === 'DRIVER' ? 'var(--accent-primary)' : 'var(--accent-secondary)',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {user.name.charAt(0)}
                </span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user.name}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    color: user.role === 'DRIVER' ? 'var(--accent-primary)' : 'var(--accent-secondary)',
                  }}
                >
                  {user.role}
                </span>
              </div>

              {/* Nav link */}
              <Link
                href={user.role === 'DRIVER' ? '/driver' : '/passenger'}
                className="btn btn-secondary btn-sm"
              >
                {user.role === 'DRIVER' ? 'Console' : 'Book Ride'}
              </Link>

              {/* Logout / Switch actor */}
              <button onClick={logout} className="btn btn-secondary btn-sm">
                Switch Role
              </button>
            </>
          ) : !isLoginPage ? (
            <Link href="/login" className="btn btn-primary btn-sm">
              Select Profile
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
