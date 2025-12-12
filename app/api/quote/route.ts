import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { description = "", requests = "" } = body || {};

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: `
You are a florist pricing assistant.

Bouquet description:
${description}

Customer requests:
${requests}

Return ONLY valid JSON in this format:
{
  "subtotal": number,
  "tax": number,
  "total": number
}
`
      })
    });

    const data = await response.json();
    const text = data.output[0].content[0].text;
    const result = JSON.parse(text);

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: "Quote generation failed" }, { status: 500 });
  }
}