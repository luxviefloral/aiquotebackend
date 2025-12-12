export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { description = "", requests = "" } = await req.json();

  const roseCountMatch = description.match(/\d+/);
  const roseCount = roseCountMatch ? Number(roseCountMatch[0]) : 25;

  const rosePrice = 1.6;
  const supplyFee = 5;
  const subtotal = roseCount * rosePrice + supplyFee;
  const tax = Number((subtotal * 0.0735).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  return NextResponse.json({
    subtotal,
    tax,
    total
  });
}