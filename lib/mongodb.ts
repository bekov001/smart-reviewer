import { MongoClient, type Collection } from "mongodb";
import type { AnalysisRecord } from "./types";

const dbName = process.env.MONGODB_DB || "smart_reviewer";

// Cache the connection promise across hot reloads in dev and across warm
// invocations in serverless, so we don't open a new pool on every request.
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri).connect();
  }
  return global._mongoClientPromise;
}

let indexEnsured = false;

export async function getAnalysesCollection(): Promise<Collection<AnalysisRecord>> {
  const client = await getClientPromise();
  const collection = client.db(dbName).collection<AnalysisRecord>("analyses");
  // Unique index on `url` enforces dedupe at the storage layer.
  if (!indexEnsured) {
    await collection.createIndex({ url: 1 }, { unique: true });
    indexEnsured = true;
  }
  return collection;
}
