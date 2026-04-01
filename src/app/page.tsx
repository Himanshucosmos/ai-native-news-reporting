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
    
    const items = data.items?.slice(0, 4) || [];
    if (items.length === 0) return [];

    // 2. Synthesize using Gemini 1.5 Flash (Super fast for bulk text processing)
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Strip HTML and only send concise descriptions, NOT massive full contents, to guarantee <5s generation times
    const rawDigests = items.map((item: any, i: number) => {
      const cleanDesc = (item.description || '').replace(/<[^>]*>?/gm, '').substring(0, 300);
      return `STORY ${i+1}: 
Title: ${item.title}
Source: ${data.feed.title || feedType}
Content Snippet: ${cleanDesc}
URL: ${item.link}`;
    }).join('\n\n');

    const prompt = `You are the Editor in Chief of 'The Chronicle', an autonomous news aggregator. 
I am providing you with 5 raw stories pulled from global feeds. 
For each story, synthesize the raw text into a profound, sophisticated 'news brief' summarizing what happened and why it matters globally.

Format strictly as a RAW JSON ARRAY of objects, like this (no markdown blocks like \`\`\`json):
[
  {
    "aiHeadline": "A sophisticated, editorial headline",
    "aiSummary": "A 2 paragraph insightful synthesis of the story. Use HTML <p> tags for structure.",
    "aiCategory": "One word upper case tag (e.g. ECONOMICS)",
    "readTime": 2
  }
]

Raw Stories:
${rawDigests}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(text);

    return aiData.map((aiObj: any, idx: number) => ({
      ...aiObj,
      id: `story-${idx}-${Date.now()}`,
      source: data.feed.title || feedType.toUpperCase(),
      originalTitle: items[idx].title,
      link: items[idx].link
    }));

  } catch (error) {
    console.error("Aggregation Failed:", error);
    return [];
  }
}

export default async function AggregatorPage({ searchParams }: { searchParams?: Promise<{ feed?: string }> }) {
  let feedParam = 'technology';
  if (searchParams) {
    const resolvedParams = await searchParams;
    feedParam = resolvedParams.feed || 'technology';
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
        <h3 className="font-serif" style={{ margin: 0 }}>The Automated Digest: {feedParam.toUpperCase()}</h3>
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
                <span style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{brief.aiCategory}</span>
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
