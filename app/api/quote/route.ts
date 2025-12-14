export const runtime = "nodejs";

import { NextResponse } from "next/server";

/**
 * PRICING RULES (FINAL)
 *
 * • Roses are rounded to nearest 25 (exception: flat bouquets may be 12)
 * • Total stems = rose stems + add-on stems
 * • Add-on stems are rounded to nearest 10
 * • Subtotal = stem_price × total_stems + total_stems
 * • Tax = Missouri 7.35%
 */

const TAX_RATE = 0.0735;

// Base stem pricing
function getStemPrice(stemCount: number): number {
  if (stemCount <= 25) return 2.5;
  if (stemCount <= 50) return 2.25;
  if (stemCount <= 75) return 2.1;
  if (stemCount <= 100) return 1.95;
  return 1.85;
}

// Round helpers
const roundTo25 = (n: number) => Math.round(n / 25) * 25;
const roundTo10 = (n: number) => Math.round(n / 10) * 10;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, notes = "" } = body;

    if (!image) {
      return NextResponse.json({ error: "Image required" }, { status: 400 });
    }

    /**
     * We are NOT letting the AI decide price.
     * AI ONLY estimates stem counts.
     */

    const analysisPrompt = `
You are a florist assistant.
From the bouquet image, estimate ONLY numeric values.

Return JSON ONLY in this format:
{
  "roseCount": number,
  "addonStemCount": number,
  "flatBouquet": boolean
}
`;

    const aiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: analysisPrompt },
              { type: "input_image", image_url: image },
            ],
          },
        ],
      }),
    });

    const aiData = await aiRes.json();
    const text = aiData?.output?.[0]?.content?.[0]?.text;
    if (!text) throw new Error("No AI output");

    const parsed = JSON.parse(text);

    let roseCount = Number(parsed.roseCount || 0);
    let addonStems = Number(parsed.addonStemCount || 0);
    const isFlat = Boolean(parsed.flatBouquet);

    // Apply rounding rules
    if (roseCount === 12 && isFlat) {
      // allowed
    } else {
      roseCount = roundTo25(roseCount);
    }

    addonStems = roundTo10(addonStems);

    const totalStems = roseCount + addonStems;
    const stemPrice = getStemPrice(totalStems);

    const subtotal = totalStems * stemPrice + totalStems;
    const tax = +(subtotal * TAX_RATE).toFixed(2);
    const total = +(subtotal + tax).toFixed(2);

    return NextResponse.json(
      { subtotal, tax, total },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Quote generation failed" },
      { status: 500 }
    );
  }
}