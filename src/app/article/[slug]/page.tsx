import fs from 'fs/promises';
import path from 'path';
import { Article } from '@/types';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const revalidate = 0;

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const dataPath = path.join(process.cwd(), 'src/data/news.json');
    const content = await fs.readFile(dataPath, 'utf-8');
    const articles = JSON.parse(content) as Article[];
    return articles.find((a) => a.slug === slug) || null;
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const article = await getArticle(resolvedParams.slug);
  
  if (!article) return { title: 'Story Not Found | The Chronicle' };

  return {
    title: `${article.title} | The Chronicle`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [article.imageUrl],
      type: 'article',
      publishedTime: article.publishedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [article.imageUrl],
    }
  };
}

// Next.js 15 requirement: params are a Promise
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const article = await getArticle(resolvedParams.slug);

  if (!article) {
    notFound();
  }

  // Calculate Read Time (assume ~200 words per minute)
  const plainText = article.contentHtml.replace(/<[^>]*>?/gm, '');
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <article className="article-container animate-fade-up">
      <header className="article-header">
        <div className="story-meta" style={{ justifyContent: 'center', marginBottom: '2rem' }}>
          <span>{article.category}</span>
          <span className="story-meta-divider"></span>
          <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
          {article.sourceTrend && (
            <>
              <span className="story-meta-divider"></span>
              <span>Based on: {article.sourceTrend}</span>
            </>
          )}
          <span className="story-meta-divider"></span>
          <span>{readTime} Min Read</span>
        </div>
        
        <h1 className="article-title">{article.title}</h1>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-color)', letterSpacing: '0.05em' }}>
           BY THE CHRONICLE ALGORITHM <span style={{ color: 'var(--text-secondary)', fontWeight: 400, display: 'inline-block', marginLeft: '0.5rem' }}>| SYNTHESIZED BY GEMINI 1.5 PRO</span>
        </div>

        <p className="article-lead" dangerouslySetInnerHTML={{ __html: article.lead }} />
      </header>

      <img 
        src={article.imageUrl} 
        alt={article.title} 
        className="article-featured-image" 
      />

      <div 
        className="article-content delay-100"
        dangerouslySetInnerHTML={{ __html: article.contentHtml }} 
      />

      {article.pullquote && (
        <blockquote className="article-pullquote delay-200">
          "{article.pullquote}"
        </blockquote>
      )}

    </article>
  );
}
