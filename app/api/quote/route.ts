export const runtime = "nodejs";

import { NextResponse } from "next/server";

const TAX_RATE = 0.0735;

// Stem pricing tiers
function getStemPrice(stemCount: number): number {
  if (stemCount <= 25) return 2.5;
  if (stemCount <= 50) return 2.25;
  if (stemCount <= 75) return 2.1;
  if (stemCount <= 100) return 1.95;
  return 1.85;
}

const roundTo25 = (n: number) => Math.round(n / 25) * 25;
const roundTo10 = (n: number) => Math.round(n / 10) * 10;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const image = body.image;

    if (!image) {
      return NextResponse.json({ error: "Image required" }, { status: 400 });
    }

    const prompt = `
From the bouquet image, estimate stem counts.

Return ONLY valid JSON:
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
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: image },
            ],
          },
        ],
      }),
    });

    const aiData = await aiRes.json();
    const rawText = aiData?.output?.[0]?.content?.[0]?.text;

    if (!rawText) {
      throw new Error("AI returned no output");
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new Error("AI returned invalid JSON");
    }

    let roseCount = Number(parsed.roseCount);
    let addonStems = Number(parsed.addonStemCount);
    const isFlat = Boolean(parsed.flatBouquet);

    if (!Number.isFinite(roseCount)) roseCount = 25;
    if (!Number.isFinite(addonStems)) addonStems = 0;

    if (!(isFlat && roseCount === 12)) {
      roseCount = roundTo25(roseCount);
    }

    addonStems = roundTo10(addonStems);

    const totalStems = roseCount + addonStems;
    const stemPrice = getStemPrice(totalStems);

    const subtotal = totalStems * stemPrice + totalStems;
    const tax = Number((subtotal * TAX_RATE).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    return NextResponse.json({ subtotal, tax, total }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Quote generation failed" },
      { status: 500 }
    );
  }
}