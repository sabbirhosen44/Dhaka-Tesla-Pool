import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Dhaka Tesla Pool',
  description: 'Smart carpooling for Dhaka — Jashim\'s Bullet EV serving Banani to Mohakhali & Gulshan 1 corridors.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>
          <div className="app-shell">
            <Navbar />
            <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
