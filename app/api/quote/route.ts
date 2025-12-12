import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      description = "",
      requests = "",
    } = body || {};

    if (!description && !requests) {
      return NextResponse.json(
        { error: "Missing request details" },
        { status: 400 }
      );
    }

    const prompt = `
You are a florist pricing assistant.

Customer description:
${description}

Special requests:
${requests}

Return ONLY valid JSON in this format:
{
  "subtotal": number,
  "tax": number,
  "total": number
}
`;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
    });

    const data = await openaiRes.json();

    const text = data.choices[0].message.content;
    const json = JSON.parse(text);

    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json(
      { error: "Quote generation failed" },
      { status: 500 }
    );
  }
}