import { generateObject, streamObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { analysisSchema } from "./schema";
import type { Analysis, NewsArticle } from "./types";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// One schema -> one structured LLM call returns the summary AND the sentiment
// AND the score together. This is the deliberate "minimise the calls" strategy.
function buildPrompt(article: NewsArticle): string {
  return [
    "Analyze the following news article.",
    "Return a short summary, the overall sentiment, a sentiment score, and up to 3 key points.",
    "",
    `Title: ${article.title}`,
    `Source: ${article.source}`,
    `Content: ${article.description || "(no description provided)"}`,
  ].join("\n");
}

export async function analyzeArticle(article: NewsArticle): Promise<Analysis> {
  const { object } = await generateObject({
    model: openai(MODEL),
    schema: analysisSchema,
    prompt: buildPrompt(article),
  });
  return object;
}

// Streaming variant: the route streams partial objects to the client so the
// summary appears live; `onFinish` lets the caller persist the final object.
export function streamArticleAnalysis(
  article: NewsArticle,
  onFinish?: (analysis: Analysis) => void | Promise<void>,
) {
  return streamObject({
    model: openai(MODEL),
    schema: analysisSchema,
    prompt: buildPrompt(article),
    // Model/stream failures otherwise vanish (the HTTP stream has already
    // started, so they can't become an error status) — log them at least.
    onError: ({ error }) => {
      console.error("[ai] streamObject failed", { url: article.url, error });
    },
    onFinish: async ({ object }) => {
      if (object && onFinish) await onFinish(object);
    },
  });
}
