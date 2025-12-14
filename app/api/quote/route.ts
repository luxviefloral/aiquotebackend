export const runtime = "nodejs";

import { NextResponse } from "next/server";

const TAX_RATE = 0.0735;

// PRICES
const ROSE_PRICE = 1.6;
const SUPPLY_CHARGE = 5;

// ROUNDING HELPERS
function roundToNearest(value: number, step: number) {
  return Math.round(value / step) * step;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { notes = "" } = body;

    // TEMP: assume rose-only bouquet until mixed logic added
    // We DO NOT let AI decide pricing
    // We only extract counts conceptually later

    // DEFAULT ASSUMPTION (until image parsing is added):
    // Client submitted a rose bouquet
    // If they typed a number in notes, use it
    let roseCount = 25;

    const match = notes.match(/(\d+)\s*rose/i);
    if (match) {
      roseCount = parseInt(match[1], 10);
    }

    // ROUND ROSES TO NEAREST 25
    roseCount = roundToNearest(roseCount, 25);

    // PRICE CALCULATION
    const roseCost = roseCount * ROSE_PRICE;
    const stemCountCharge = roseCount; // your rule
    const subtotal = roseCost + stemCountCharge + SUPPLY_CHARGE;

    const tax = Number((subtotal * TAX_RATE).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    return NextResponse.json({
      subtotal,
      tax,
      total
    });

  } catch (err) {
    return NextResponse.json(
      { error: "Quote generation failed" },
      { status: 500 }
    );
  }
}