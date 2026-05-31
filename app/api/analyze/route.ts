import { NextResponse, type NextRequest } from "next/server";
import { streamArticleAnalysis } from "@/lib/ai";
import { getCachedAnalysis, saveCachedAnalysis } from "@/lib/analysis-store";
import { getAnalysesCollection } from "@/lib/mongodb";
import { checkRateLimit } from "@/lib/ratelimit";
import type { Analysis, AnalysisRecord, NewsArticle } from "@/lib/types";

export const runtime = "nodejs";

// Defend the paid OpenAI endpoint: cap how much text we accept and analyze.
const MAX_BODY_BYTES = 16_000;
const MAX_TITLE_CHARS = 500;
const MAX_DESCRIPTION_CHARS = 4_000;

export async function POST(req: NextRequest) {
  // Rate limit per IP first (cheapest rejection) — see lib/ratelimit.ts.
  const rl = await checkRateLimit("analyze", req);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please slow down and try again shortly." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  // Reject oversized payloads before reading the body.
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "Request body too large." },
      { status: 413 },
    );
  }

  let body: Partial<NewsArticle>;
  try {
    body = await req.json();
  } catch (err) {
    console.error("[analyze] invalid JSON body", err);
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body?.url || !body?.title) {
    return NextResponse.json(
      { error: "Article must include a title and url." },
      { status: 400 },
    );
  }

  let collection: Awaited<ReturnType<typeof getAnalysesCollection>> | null = null;
  try {
    collection = await getAnalysesCollection();
  } catch (err) {
    console.warn("[analyze] MongoDB unavailable; using fallback store", err);
  }

  // Dedupe: if this article was already analyzed, return the stored analysis
  // as a single JSON chunk WITHOUT calling the LLM. If MongoDB is temporarily
  // unavailable, the Upstash fallback store still avoids repeated paid calls.
  try {
    const existing =
      (collection
        ? await collection.findOne(
            { url: body.url },
            { projection: { _id: 0 } },
          )
        : null) ?? (await getCachedAnalysis(body.url));

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
  } catch (err) {
    console.error("[analyze] dedupe lookup failed", err);
  }

  const article: NewsArticle = {
    title: body.title.slice(0, MAX_TITLE_CHARS),
    description: (body.description ?? "").slice(0, MAX_DESCRIPTION_CHARS),
    url: body.url,
    image: body.image ?? null,
    source: (body.source ?? "Unknown").slice(0, 200),
    publishedAt: body.publishedAt ?? new Date().toISOString(),
  };

  // Fresh analysis: stream partial objects to the client, and persist the final
  // result to MongoDB once the stream finishes.
  //
  // The write runs in onFinish — i.e. AFTER the 200 stream has begun — so we can
  // no longer turn a write failure into an error status. We therefore guard and
  // log it here (never let it reject into the SDK), and the client treats a
  // refetch of /api/analyses as the source of truth for the ledger: a failed
  // write means the row simply won't appear, never a phantom "saved" row.
  const result = streamArticleAnalysis(article, async (analysis) => {
    try {
      const record: AnalysisRecord = {
        ...article,
        ...analysis,
        analyzedAt: new Date().toISOString(),
      };
      const writes: Promise<unknown>[] = [saveCachedAnalysis(record)];
      if (collection) {
        writes.push(
          collection.updateOne(
            { url: record.url },
            { $set: record },
            { upsert: true },
          ),
        );
      }

      const results = await Promise.allSettled(writes);
      for (const write of results) {
        if (write.status === "rejected") throw write.reason;
      }
    } catch (err) {
      console.error("[analyze] failed to persist analysis", {
        url: article.url,
        err,
      });
    }
  });

  return result.toTextStreamResponse();
}
