import fs from 'fs/promises';
import path from 'path';
import { Article } from '@/types';
import Link from 'next/link';
import GenerateButton from '@/components/GenerateButton';

export const revalidate = 0; // Disable static rendering for this demo

async function getNews(): Promise<Article[]> {
  try {
    const dataPath = path.join(process.cwd(), 'src/data/news.json');
    const content = await fs.readFile(dataPath, 'utf-8');
    const articles = JSON.parse(content) as Article[];
    return articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  } catch (error) {
    return [];
  }
}

export default async function Home(props: { searchParams?: Promise<{ category?: string }> }) {
  let articles = await getNews();

  let filterCat = '';
  if (props.searchParams) {
    const resolvedParams = await props.searchParams;
    filterCat = resolvedParams.category || '';
  }

  // Filter articles based on exact matching category from our dynamic navigation
  if (filterCat) {
    articles = articles.filter(a => a.category.toUpperCase() === filterCat.toUpperCase());
  }

  // The rich Empty State
  if (!articles || articles.length === 0) {
    return (
      <div className="container" style={{ margin: '4rem auto', maxWidth: '1000px' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 className="font-serif" style={{ fontSize: '3rem', marginBottom: '1rem' }}>The Future of Global Reporting</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
            Welcome to the world's first AI-native news surface. Our autonomous digital pipeline monitors global trends, verifies facts, and synthesizes profound
            long-form journalism—all with zero human editorial intervention.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '3rem',
          padding: '3rem',
          background: 'rgba(0,0,0,0.02)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px'
        }}>
          <div>
            <h3 className="font-serif" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>How it works</h3>
            <ul style={{ color: 'var(--text-secondary)', lineHeight: '2', paddingLeft: '1.5rem' }}>
              <li><strong>Scans</strong> the Virlo API for live cultural realities and rising hashtags.</li>
              <li><strong>Synthesizes</strong> context using Gemini 1.5 Pro acting as an Editor-in-Chief.</li>
              <li><strong>Publishes</strong> perfectly formatted, deeply analytical long-form reports.</li>
            </ul>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <h3 className="font-serif" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>The newsroom is empty.</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Engage the pipeline to broadcast the first story.</p>
            <GenerateButton />
          </div>
        </div>
      </div>
    );
  }

  const [heroStory, ...otherStories] = articles;

  return (
    <div className="container">
      {/* Editor's Desk / Pipeline Status Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '1.5rem',
        borderBottom: '2px solid var(--text-color)',
        marginBottom: '2rem'
      }}>
        <h3 className="font-serif" style={{ margin: 0 }}>Latest Dispatches</h3>
        <div>
          <GenerateButton />
        </div>
      </div>

      <div className="story-grid">
        {/* Main Content Column */}
        <div style={{ gridColumn: 'span 9', display: 'flex', flexDirection: 'column', gap: '4rem' }}>
          {heroStory && (
            <div className="story-hero animate-fade-up">
              <Link href={`/article/${heroStory.slug}`} className="story-card">
                <div className="image-wrapper">
                  {/* Since image generation takes time, simulate high end aesthetic with grayscale placeholders */}
                  <img
                    src={heroStory.imageUrl}
                    alt={heroStory.title}
                    className="story-card-image"
                  />
                </div>
                <div className="story-meta" style={{ marginTop: '1rem' }}>
                  <span>{heroStory.category}</span>
                  <span className="story-meta-divider"></span>
                  <span>{new Date(heroStory.publishedAt).toLocaleDateString()}</span>
                  {heroStory.sourceTrend && (
                    <>
                      <span className="story-meta-divider"></span>
                      <span>Trending: {heroStory.sourceTrend}</span>
                    </>
                  )}
                </div>
                <h2 className="story-card-title">{heroStory.title}</h2>
                <p className="story-card-excerpt" style={{ fontSize: '1.25rem', maxWidth: '80%' }}>{heroStory.excerpt}</p>
              </Link>
            </div>
          )}

          {otherStories.length > 0 && (
            <div className="animate-fade-up delay-100" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '2rem'
            }}>
              {otherStories.slice(0, 4).map((story) => (
                <Link href={`/article/${story.slug}`} key={story.id} className="story-card">
                  <div className="image-wrapper" style={{ aspectRatio: '16/9' }}>
                    <img
                      src={story.imageUrl}
                      alt={story.title}
                      className="story-card-image"
                    />
                  </div>
                  <div className="story-meta" style={{ marginTop: '0.75rem' }}>
                    <span>{story.category}</span>
                    <span className="story-meta-divider"></span>
                    <span>{new Date(story.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="story-card-title" style={{ fontSize: '1.4rem' }}>{story.title}</h3>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Side Widget Column */}
        <div className="animate-fade-up delay-200" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: '3rem' }}>

          <div style={{ padding: '2rem', background: 'var(--text-color)', color: 'var(--bg-color)' }}>
            <h4 className="font-serif" style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.5rem' }}>About The Chronicle</h4>
            <p style={{ opacity: 0.8, fontSize: '0.875rem', lineHeight: '1.8' }}>
              A paradigm shift in journalism. This surface curates, drafts, and immortalizes global context entirely autonomously. Not a newsletter—a full-scale algorithmic publication.
            </p>
          </div>

          <div>
            <h4 className="font-serif" style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Trending Topics</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['#GlobalEconomics', '#FutureOfAI', '#SpaceRace2026', '#ClimatePolicy', '#DigitalSovereignty'].map((topic, i) => (
                <li key={i} style={{
                  color: 'var(--text-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}>
                  <span style={{ color: 'var(--accent-color)' }}>{i + 1}.</span> {topic}
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}
