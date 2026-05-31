# Smart Reviewer

A single-page app that fetches **real-time news**, uses **GenAI** to generate a
**summary** and **sentiment analysis** for a selected article, and stores the
results in **MongoDB**. All analyzed articles are displayed in a table.

Built for the Aries Global "Smart Reviewer" case study.

## What it does

1. **Search** recent news articles via a public News API (GNews.io).
2. **Select** an article and click **Analyze** to generate:
   - a concise summary, and
   - a sentiment label (positive / neutral / negative) + a score from -1 to 1.
3. **Store** the result in MongoDB.
4. **Display** every analyzed article in a clear, persistent table.

It handles the full request lifecycle — **loading**, **error** (with retry), and
**success / empty** states — for both search and analysis.

## Tech stack

- **Next.js (App Router, TypeScript)** — React frontend + API routes in one app,
  so API keys never reach the browser.
- **OpenAI** via the **Vercel AI SDK** (`generateObject` + a Zod schema) for
  structured GenAI output.
- **MongoDB** (Atlas) via the official `mongodb` driver.
- **Upstash Redis** (optional) for per-IP rate limiting on paid/external API
  routes.
- **Tailwind CSS** for a clean, responsive UI.

## Architecture

```
Browser (app/page.tsx, client SPA)
   │  fetch
   ▼
Next.js API routes (server — hold the secrets)
   ├─ optional Upstash rate limit on /api/news and /api/analyze
   ├─ GET  /api/news?q=…   → proxies GNews.io, returns trimmed articles
   ├─ POST /api/analyze    → dedupe → OpenAI (1 call) → upsert into MongoDB
   └─ GET  /api/analyses   → list stored analyses for the table
```

Key files:

| Path | Responsibility |
| --- | --- |
| `app/page.tsx` | SPA: search, results grid, analyze, table, all lifecycle states |
| `app/api/news/route.ts` | GNews proxy + error/empty handling |
| `app/api/analyze/route.ts` | Dedupe, GenAI call, MongoDB upsert |
| `app/api/analyses/route.ts` | Read stored analyses |
| `lib/ai.ts` | One structured LLM call → `{ summary, sentiment, score, keyPoints }` |
| `lib/mongodb.ts` | Serverless-safe client singleton + unique index on `url` |
| `components/*` | `SearchBar`, `ArticleCard`, `ResultsTable`, state helpers |

## Sentiment strategy (minimising API calls)

The brief asks to **minimise the calls** made for sentiment. Two deliberate
choices:

1. **One call, not two.** Summary, sentiment label, score, and key points are
   produced by a **single** structured `generateObject` call (Zod schema in
   `lib/ai.ts`) — not a separate summary call and a separate sentiment call.
2. **Dedupe before calling.** `POST /api/analyze` first looks the article up by
   its `url` in MongoDB. If it was analyzed before, the stored record is
   returned immediately and **no LLM call is made**. A unique index on `url`
   enforces this at the storage layer too.

## Getting started (local)

### Prerequisites
- Node.js 18+
- A free **GNews.io** API key — https://gnews.io/
- An **OpenAI** API key — https://platform.openai.com/api-keys
- A **MongoDB** connection string — e.g. a free MongoDB Atlas M0 cluster

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# then edit .env.local and fill in GNEWS_API_KEY, OPENAI_API_KEY, MONGODB_URI
# optional: fill KV_REST_API_URL/KV_REST_API_TOKEN or
# UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN to enable rate limiting

# 3. Run the dev server
npm run dev
```

Open http://localhost:3000, search for a topic (e.g. "artificial
intelligence"), and click **Analyze** on an article.

> **MongoDB Atlas note:** under *Network Access*, allow your IP (or
> `0.0.0.0/0` for a quick demo). The `analyses` collection and its unique index
> on `url` are created automatically on first use.

## Deployment (Vercel)

1. Push this repo to GitHub and import it into Vercel (framework is detected
   automatically).
2. Add the environment variables (`GNEWS_API_KEY`, `OPENAI_API_KEY`,
   `MONGODB_URI`, optionally `OPENAI_MODEL` / `MONGODB_DB`) for the Production
   and Preview environments.
3. Ensure MongoDB Atlas *Network Access* allows Vercel egress (`0.0.0.0/0` for
   the demo).
4. Optional but recommended: install **Upstash for Redis** from the Vercel
   Marketplace. The app reads the generated `KV_REST_API_URL` and
   `KV_REST_API_TOKEN` variables. Direct Upstash projects can use
   `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` instead.
5. Deploy.

**Live demo:** _add the Vercel URL here after deploying._

## Notes / what I'd add with more time

- Debounced search input and pagination / infinite scroll over results.
- Auth + per-user analysis history.
- Batch analysis (multiple articles in one structured call) to push
  call-minimisation further.
- Caching of news responses to stay under the GNews free-tier daily limit.
- Unit/integration tests for the three API routes.
