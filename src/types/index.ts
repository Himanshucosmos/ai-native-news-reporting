export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  lead: string;
  contentHtml: string;
  pullquote?: string;
  imageUrl: string;
  category: string;
  publishedAt: string;
  sourceTrend?: string;
}
