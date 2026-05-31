import { NextResponse } from "next/server";
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
  } catch {
    return NextResponse.json(
      { error: "Failed to load analyses." },
      { status: 500 },
    );
  }
}
