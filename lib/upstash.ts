import { Redis } from "@upstash/redis";

const redisUrl =
  process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const redisToken =
  process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | null | undefined;

export function getOptionalRedis(): Redis | null {
  if (redis !== undefined) return redis;
  redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;
  return redis;
}

