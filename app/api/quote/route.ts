export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET" });
}

export async function POST() {
  return NextResponse.json({
    ok: true,
    method: "POST",
    hasKey: Boolean(process.env.OPENAI_API_KEY),
    keyPrefix: process.env.OPENAI_API_KEY?.slice(0, 3) || "none"
  });
}