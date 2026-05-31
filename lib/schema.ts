import { z } from "zod";

// Shared between the server (generate/stream) and the client (useObject).
// Pure zod — safe to import into a client bundle (no provider/secrets here).
export const analysisSchema = z.object({
  summary: z
    .string()
    .describe("A concise, neutral 2-3 sentence summary of the article."),
  sentiment: z
    .enum(["positive", "neutral", "negative"])
    .describe("The overall sentiment/tone of the article's subject matter."),
  score: z
    .number()
    .min(-1)
    .max(1)
    .describe("Sentiment score from -1 (very negative) to 1 (very positive)."),
  keyPoints: z
    .array(z.string())
    .max(3)
    .describe("Up to three short key takeaways from the article."),
});
