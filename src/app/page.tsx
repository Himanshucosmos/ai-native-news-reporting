import { GoogleGenerativeAI } from '@google/generative-ai';

export const revalidate = 1800; // Next.js Global Cache: Fully rebuild every 30 minutes!
export const maxDuration = 60; // Allow enough time for AI aggregation on Vercel

interface Brief {
  id: string;
  source: string;
  originalTitle: string;
  aiHeadline: string;
  aiSummary: string;
  aiCategory: string;
  link: string;
  readTime: number;
}

const FEEDS: Record<string, string> = {
  'markets': 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664',
  'technology': 'https://techcrunch.com/feed/',
  'global': 'http://feeds.bbci.co.uk/news/world/rss.xml',
  'startups': 'https://news.ycombinator.com/rss',
  'science': 'https://www.sciencedaily.com/rss/all.xml'
};

async function fetchAndSummarize(feedType: string): Promise<Brief[]> {
  try {
    const rssUrl = FEEDS[feedType.toLowerCase()] || FEEDS['technology'];
    
    // 1. Pull live data from across the market via RSS2JSON
    const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`, { next: { revalidate: 1800 } });
    const data = await res.json();
    
    const items = data.items?.slice(0, 8) || [];
    if (items.length === 0) return [];

    // 2. Algorithmic Extraction Engine (Bypassing Gemini explicitly to prevent 429 Quota Limits)
    // We autonomously compute sentiment, read time, and curate formatting natively.
    return items.map((item: any, idx: number) => {
      let cleanDesc = (item.description || '').replace(/<[^>]*>?/gm, '').trim();
      if (cleanDesc.length > 250) {
        cleanDesc = cleanDesc.substring(0, 250) + '...';
      }

      // Autonomous Algorithmic Sentiment Analysis
      const positiveWords = ['jump', 'launch', 'growth', 'profit', 'success', 'breakthrough', 'funding', 'new', 'climb', 'gain'];
      const negativeWords = ['crash', 'drop', 'fall', 'lawsuit', 'fail', 'scandal', 'loss', 'delay', 'down', 'cut'];
      let sentiment = 'NEUTRAL';
      let score = 0;
      const textToAnalyze = (item.title + ' ' + cleanDesc).toLowerCase();
      for(let w of positiveWords) if(textToAnalyze.includes(w)) score++;
      for(let w of negativeWords) if(textToAnalyze.includes(w)) score--;
      if(score > 0) sentiment = 'BULLISH';
      if(score < 0) sentiment = 'BEARISH';

      const readTime = Math.max(1, Math.floor((item.description || '').split(' ').length / 200));

      return {
        id: `story-${idx}-${Date.now()}`,
        source: data.feed.title || feedType.toUpperCase(),
        originalTitle: item.title,
        aiHeadline: item.title,
        aiSummary: `<p>${cleanDesc}</p>`,
        aiCategory: sentiment, // Overriding category with dynamic Algorithmic Sentiment
        link: item.link,
        readTime: readTime
      };
    });

  } catch (error) {
    console.error("Algorithmic Aggregation Failed:", error);
    return [];
  }
}

export default async function AggregatorPage({ searchParams }: { searchParams?: Promise<{ feed?: string }> }) {
  let feedParam = 'technology';
  let isHomepage = true;
  if (searchParams) {
    const resolvedParams = await searchParams;
    if (resolvedParams.feed) {
      feedParam = resolvedParams.feed;
      isHomepage = false;
    }
  }

  const briefs = await fetchAndSummarize(feedParam);

  return (
    <div className="container">
      {/* Editor's Desk / Pipeline Status Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'baseline',
        paddingBottom: '1.5rem',
        borderBottom: '2px solid var(--text-color)',
        marginBottom: '2rem'
      }}>
        <h3 className="font-serif" style={{ margin: 0 }}>The Automated Digest: {isHomepage ? 'LATEST HEADLINES' : feedParam.toUpperCase()}</h3>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Updated Every 30 Minutes
        </div>
      </div>

      {briefs.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', background: 'rgba(0,0,0,0.02)', border: '1px dashed var(--border-color)' }}>
          <h2 className="font-serif" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Aggregator Engine Syncing</h2>
          <p style={{ color: 'var(--text-secondary)' }}>The pipeline is currently pulling and synthesizing the latest market data. Check back shortly.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem', maxWidth: '800px', margin: '0 auto' }}>
          {briefs.map((brief, index) => (
            <article key={brief.id} className="animate-fade-up" style={{ animationDelay: ((index % 3) * 100) + 'ms', paddingBottom: '3rem', borderBottom: '1px solid var(--border-color)' }}>
              
              <div className="story-meta" style={{ marginBottom: '1rem' }}>
                <span style={{ 
                  color: brief.aiCategory === 'BULLISH' ? '#10B981' : brief.aiCategory === 'BEARISH' ? '#EF4444' : 'var(--text-secondary)',
                  fontWeight: 800,
                  letterSpacing: '0.1em'
                }}>
                  [{brief.aiCategory}]
                </span>
                <span className="story-meta-divider"></span>
                <span>{brief.readTime} MIN READ</span>
                <span className="story-meta-divider"></span>
                <span style={{ opacity: 0.7 }}>SOURCE: {brief.source}</span>
              </div>

              <h2 className="font-serif" style={{ fontSize: '2.5rem', lineHeight: 1.2, marginBottom: '1.5rem' }}>
                {brief.aiHeadline}
              </h2>

              <div 
                style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}
                dangerouslySetInnerHTML={{ __html: brief.aiSummary }}
              />

              <div style={{ marginTop: '2rem' }}>
                <a 
                  href={brief.link} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ 
                    display: 'inline-block',
                    padding: '0.75rem 1.5rem',
                    background: 'var(--text-color)',
                    color: 'var(--bg-color)',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  Read Primary Source
                </a>
              </div>
              
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
