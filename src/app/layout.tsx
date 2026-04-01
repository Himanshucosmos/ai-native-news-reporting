import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import ThemeToggle from '@/components/ThemeToggle';
import fs from 'fs/promises';
import path from 'path';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'THE CHRONICLE | AI-Native News',
  description: 'World-class journalism, generated autonomously.',
};

async function getCategories(): Promise<string[]> {
  try {
    const dataPath = path.join(process.cwd(), 'src/data/news.json');
    const content = await fs.readFile(dataPath, 'utf-8');
    const articles = JSON.parse(content);
    const cats = new Set<string>();
    articles.forEach((a: any) => {
       if (a.category && typeof a.category === 'string') cats.add(a.category.toUpperCase());
    });
    return Array.from(cats).slice(0, 7); // Max 7 categories in nav
  } catch(e) {
    return ['GEOPOLITICS', 'TECHNOLOGY', 'CULTURE', 'ECONOMICS', 'SOCIETY'];
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const uniqueCategories = await getCategories();

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
               <a href="/">Home</a>
               {uniqueCategories.map(cat => (
                 <a key={cat} href={`/?category=${encodeURIComponent(cat.toLowerCase())}`}>{cat}</a>
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
