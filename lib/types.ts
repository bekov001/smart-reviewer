export type Sentiment = "positive" | "neutral" | "negative";

/** A news article as returned to the client (trimmed GNews shape). */
export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  image: string | null;
  source: string;
  publishedAt: string;
}

/** The GenAI analysis produced for an article (one combined LLM call). */
export interface Analysis {
  summary: string;
  sentiment: Sentiment;
  score: number;
  keyPoints: string[];
}

/** What we persist in MongoDB and render in the results table. */
export interface AnalysisRecord extends NewsArticle, Analysis {
  analyzedAt: string;
}
