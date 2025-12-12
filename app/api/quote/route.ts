export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { description = "", requests = "" } = await req.json();

    const prompt = `
You are a florist pricing assistant.

Bouquet description:
${description}

Customer requests:
${requests}

You MUST respond with ONLY valid JSON in this exact format and nothing else:
{
  "subtotal": 0,
  "tax": 0,
  "total": 0
}
`;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Return JSON only. No text." },
          { role: "user", content: prompt }
        ],
        temperature: 0
      })
    });

    const data = await openaiRes.json();
    const text = data.choices[0].message.content;
    const result = JSON.parse(text);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Quote generation failed" },
      { status: 500 }
    );
  }
}