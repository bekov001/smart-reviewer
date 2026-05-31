import { NextResponse } from "next/server";
import { listCachedAnalyses } from "@/lib/analysis-store";
import { getAnalysesCollection } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const collection = await getAnalysesCollection();
    const records = await collection
      .find({}, { projection: { _id: 0 } })
      .sort({ analyzedAt: -1 })
      .toArray();
    return NextResponse.json({ records });
  } catch (err) {
    console.warn("[analyses] MongoDB unavailable; using fallback store", err);
    try {
      const records = await listCachedAnalyses();
      return NextResponse.json({ records, degraded: true });
    } catch (fallbackErr) {
      console.error("[analyses] failed to load fallback store", fallbackErr);
      return NextResponse.json(
        { error: "Failed to load analyses." },
        { status: 500 },
      );
    }
  }
}
