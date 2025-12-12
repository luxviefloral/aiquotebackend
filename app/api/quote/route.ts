export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { description = "", requests = "" } = await req.json();

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a florist pricing assistant. Respond ONLY with valid JSON."
          },
          {
            role: "user",
            content: `
Bouquet description:
${description}

Customer requests:
${requests}

Return ONLY JSON like:
{
  "subtotal": 0,
  "tax": 0,
  "total": 0
}
`
          }
        ],
        temperature: 0
      })
    });

    const data = await openaiRes.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      return NextResponse.json(
        { error: "OpenAI response invalid", raw: data },
        { status: 500 }
      );
    }

    const result = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(result);

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}