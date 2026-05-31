import { NextResponse, type NextRequest } from "next/server";
import type { NewsArticle } from "@/lib/types";

export const runtime = "nodejs";

interface GNewsArticle {
  title: string;
  description: string | null;
  url: string;
  image: string | null;
  publishedAt: string;
  source?: { name?: string };
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing search query." }, { status: 400 });
  }

  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "News API key is not configured on the server." },
      { status: 500 },
    );
  }

  const url =
    `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}` +
    `&lang=en&max=10&apikey=${apiKey}`;

  try {
    // Cache identical searches for 10 min (Next Data Cache, keyed on URL) to
    // stay well under the GNews free-tier daily request limit.
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) {
      const message =
        res.status === 429
          ? "News API rate limit reached. Please try again later."
          : `News API returned an error (${res.status}).`;
      return NextResponse.json({ error: message }, { status: 502 });
    }
    const data: { articles?: GNewsArticle[] } = await res.json();
    const articles: NewsArticle[] = (data.articles ?? []).map((a) => ({
      title: a.title,
      description: a.description ?? "",
      url: a.url,
      image: a.image ?? null,
      source: a.source?.name ?? "Unknown",
      publishedAt: a.publishedAt,
    }));
    return NextResponse.json({ articles });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach the News API." },
      { status: 502 },
    );
  }
}
