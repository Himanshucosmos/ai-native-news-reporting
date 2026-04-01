import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { Article } from '@/types';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const FALLBACK_TRENDS = ['#GlobalEconomicShift', '#AIGovernance', '#SpaceExploration2026', '#ClimateTech', '#FutureOfWork'];

export async function POST(req: Request) {
  try {
    // 0. Parse potential Human Editorial Directive
    let directive = '';
    try {
      const body = await req.json();
      directive = body.directive || '';
    } catch(e) {}

    // 1. Determine Source Topic
    let trend = '';
    let sourceTrend = '';

    if (directive.trim() !== '') {
       trend = directive.trim();
       sourceTrend = 'Human Editorial Directive';
    } else {
       // Automatic Virlo or Fallback mode
       trend = FALLBACK_TRENDS[Math.floor(Math.random() * FALLBACK_TRENDS.length)];
       sourceTrend = 'Editorial Choice (Fallback)';

       if (process.env.VIRLO_API_KEY && process.env.VIRLO_API_KEY !== 'your_virlo_api_key_here') {
         try {
           const virloRes = await fetch('https://api.virlo.ai/v1/hashtags?limit=50&order_by=views&sort=desc', {
             headers: { 'Authorization': `Bearer ${process.env.VIRLO_API_KEY}` }
           });
           if (virloRes.ok) {
             const virloData = await virloRes.json();
             if (virloData?.data?.hashtags?.length > 0) {
                const randomTrend = virloData.data.hashtags[Math.floor(Math.random() * virloData.data.hashtags.length)];
                trend = randomTrend.hashtag;
                sourceTrend = `Virlo Trend: ${trend}`;
             }
           }
         } catch (e) {
           console.warn('Virlo API fetch failed, using fallback trend');
         }
       }
    }

    // 2. Synthesize Article with Gemini
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const contextPrefix = directive 
      ? `The human Publisher has issued a specific Editorial Directive for your ongoing coverage: investigate and report on "${trend}".` 
      : `A new viral digital trend has emerged: ${trend}.`;

    const prompt = `You are the Editor in Chief of 'The Chronicle', the world's most prestigious AI-native newsroom (like The New York Times meets The Economist). 
${contextPrefix}

Write a deeply researched, profound, and objective long-form journalistic article exploring the broader sociocultural, economic, or global implications of this topic. Treat it seriously.

Format your response strictly as a RAW JSON object WITHOUT markdown blocks (do not wrap in \`\`\`json) matching this schema:
{
  "title": "A captivating, serious editorial headline (no hashtags)",
  "excerpt": "A two-sentence summary for the front page.",
  "lead": "A profound, poetic opening statement (italicized in spirit).",
  "contentHtml": "The full article body in raw HTML. Use <p> tags. Add the class 'article-dropcap' to the FIRST <p> tag ONLY. Do not use <h1> or <h2>, just paragraphs and strong/em where needed. Add depth and rigorous analysis.",
  "pullquote": "A sensational, thought-provoking quote pulled from the text to highlight.",
  "category": "One word category (e.g., TECHNOLOGY, CULTURE, MARKETS, GEOPOLITICS)."
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let articleData;
    try {
      articleData = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON:', text);
       return NextResponse.json({ error: 'Failed to generate coherent article format.' }, { status: 500 });
    }

    // 3. Construct and Save Article
    const newArticle: Article = {
      id: uuidv4(),
      slug: articleData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.floor(Math.random() * 1000),
      title: articleData.title,
      excerpt: articleData.excerpt,
      lead: articleData.lead,
      contentHtml: articleData.contentHtml,
      pullquote: articleData.pullquote,
      category: articleData.category.toUpperCase(),
      publishedAt: new Date().toISOString(),
      sourceTrend: sourceTrend,
      // Premium editorial imagery via Picsum (grayscale)
      imageUrl: `https://picsum.photos/seed/${Math.random()}/1600/900?grayscale`
    };

    const dataPath = path.join(process.cwd(), 'src/data/news.json');
    let existingData = [];
    try {
      const fileData = await fs.readFile(dataPath, 'utf-8');
      existingData = JSON.parse(fileData);
    } catch(e) {} // fine if it doesn't exist yet

    existingData.unshift(newArticle);

    try {
      await fs.writeFile(dataPath, JSON.stringify(existingData, null, 2));
    } catch (fsError: any) {
      // Vercel Serverless throws EROFS on write. 
      // We swallow this so the article returns to the frontend and lives in ephemeral memory for the demo!
      console.warn('Vercel Ephemeral Write Skipped:', fsError.message);
    }

    return NextResponse.json({ success: true, article: newArticle });

  } catch (error: any) {
    console.error('Generation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
