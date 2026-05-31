import { NextResponse, type NextRequest } from "next/server";
import { streamArticleAnalysis } from "@/lib/ai";
import { getAnalysesCollection } from "@/lib/mongodb";
import type { Analysis, AnalysisRecord, NewsArticle } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: Partial<NewsArticle>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body?.url || !body?.title) {
    return NextResponse.json(
      { error: "Article must include a title and url." },
      { status: 400 },
    );
  }

  let collection;
  try {
    collection = await getAnalysesCollection();
  } catch {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 500 },
    );
  }

  // Dedupe: if this article was already analyzed, return the stored analysis
  // as a single JSON chunk WITHOUT calling the LLM. `useObject` on the client
  // parses a one-shot body just like a stream. This is the call-minimising step.
  try {
    const existing = await collection.findOne(
      { url: body.url },
      { projection: { _id: 0 } },
    );
    if (existing) {
      const analysis: Analysis = {
        summary: existing.summary,
        sentiment: existing.sentiment,
        score: existing.score,
        keyPoints: existing.keyPoints,
      };
      return new Response(JSON.stringify(analysis), {
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }
  } catch {
    return NextResponse.json({ error: "Database lookup failed." }, { status: 500 });
  }

  const article: NewsArticle = {
    title: body.title,
    description: body.description ?? "",
    url: body.url,
    image: body.image ?? null,
    source: body.source ?? "Unknown",
    publishedAt: body.publishedAt ?? new Date().toISOString(),
  };

  // Fresh analysis: stream partial objects to the client, and persist the final
  // result to MongoDB once the stream finishes.
  const result = streamArticleAnalysis(article, async (analysis) => {
    const record: AnalysisRecord = {
      ...article,
      ...analysis,
      analyzedAt: new Date().toISOString(),
    };
    await collection.updateOne(
      { url: record.url },
      { $set: record },
      { upsert: true },
    );
  });

  return result.toTextStreamResponse();
}
