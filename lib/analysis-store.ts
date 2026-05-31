import type { AnalysisRecord } from "./types";
import { getOptionalRedis } from "./upstash";

const INDEX_KEY = "analyses:index";
const RECORD_PREFIX = "analyses:record:";

function recordKey(url: string): string {
  return `${RECORD_PREFIX}${encodeURIComponent(url)}`;
}

function isAnalysisRecord(value: unknown): value is AnalysisRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<AnalysisRecord>;
  return (
    typeof record.url === "string" &&
    typeof record.title === "string" &&
    typeof record.summary === "string" &&
    typeof record.sentiment === "string" &&
    typeof record.score === "number" &&
    typeof record.analyzedAt === "string"
  );
}

export async function getCachedAnalysis(
  url: string,
): Promise<AnalysisRecord | null> {
  const redis = getOptionalRedis();
  if (!redis) return null;

  const record = await redis.get<AnalysisRecord>(recordKey(url));
  return isAnalysisRecord(record) ? record : null;
}

export async function saveCachedAnalysis(record: AnalysisRecord): Promise<void> {
  const redis = getOptionalRedis();
  if (!redis) return;

  const score = Date.parse(record.analyzedAt) || Date.now();
  await Promise.all([
    redis.set(recordKey(record.url), record),
    redis.zadd(INDEX_KEY, { score, member: record.url }),
  ]);
}

export async function listCachedAnalyses(limit = 100): Promise<AnalysisRecord[]> {
  const redis = getOptionalRedis();
  if (!redis) return [];

  const urls = await redis.zrange<string[]>(INDEX_KEY, 0, limit - 1, {
    rev: true,
  });
  const records = await Promise.all(
    urls.map((url) => redis.get<AnalysisRecord>(recordKey(url))),
  );
  return records.filter(isAnalysisRecord);
}

