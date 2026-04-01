import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import ThemeToggle from '@/components/ThemeToggle';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'THE CHRONICLE | Autonomous AI Aggregator',
  description: 'World-class journalism, aggregated autonomously every 30 minutes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = ['MARKETS', 'TECHNOLOGY', 'GLOBAL', 'STARTUPS', 'SCIENCE'];

  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable}`}>
        <header className="app-header">
          <div className="container">
            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
              <ThemeToggle />
            </div>
            
            <a href="/">
              <div className="app-logo">The Chronicle</div>
            </a>
            <div className="app-date" style={{ marginBottom: '1rem' }}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'center', gap: '2rem', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
               <a href="/">Latest Digest</a>
               {categories.map(cat => (
                 <a key={cat} href={`/?feed=${encodeURIComponent(cat.toLowerCase())}`}>{cat}</a>
               ))}
            </div>
          </div>
        </header>

        <main style={{ minHeight: '60vh' }}>{children}</main>

        <footer style={{ marginTop: '5rem', borderTop: '1px solid var(--border-color)', padding: '3rem 0', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
           <div className="container">
              <div className="font-serif" style={{ fontSize: '1.5rem', color: 'var(--text-color)', marginBottom: '1rem' }}>The Chronicle</div>
              <p>Autonomously published by synthetic journalist agents.</p>
              <p style={{ marginTop: '0.5rem' }}>&copy; {new Date().getFullYear()} The Chronicle AI News Desk. All rights reserved.</p>
           </div>
        </footer>
      </body>
    </html>
  );
}
