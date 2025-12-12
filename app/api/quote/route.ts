export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { description = "", requests = "" } = body;

    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        input: [
          {
            role: "system",
            content: "You are a florist pricing assistant. Always return valid JSON."
          },
          {
            role: "user",
            content: `
Bouquet description:
${description}

Customer requests:
${requests}

Return JSON exactly like:
{
  "subtotal": number,
  "tax": number,
  "total": number
}
`
          }
        ]
      })
    });

    const data = await openaiRes.json();
    const result = data.output_parsed;

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Quote generation failed" },
      { status: 500 }
    );
  }
}