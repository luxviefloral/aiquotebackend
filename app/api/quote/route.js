import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { imageBase64, notes } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "Missing imageBase64" }, { status: 400 });
    }

    const pricingRules = `
You are a pricing assistant for custom floral bouquets.
You MUST follow these exact pricing rules and only calculate the price BEFORE TAX.
Do NOT include sales tax in your answer.

General rules:
- You will be given: 1) a bouquet photo, 2) customer notes (text).
- You must estimate stem counts and decorations from the image and notes.
- If the name of an add-on stem has "#" in front of it, round its stem count to the nearest 10.
- If the name of an add-on stem has "&" in front of it, round its stem count to the nearest 25.
- Apply rounding to the stem COUNT, not the price.
- For bouquets with any add-on stems, the bouquet type is "Mixed".
- Bouquets with only roses are "Regular".

Base stem prices:
Roses $1.60 per stem
Vivid Colors add $15

Add-on stems:
Babies Breath Rim: 25ct $25, 50ct $35, 75ct $45, 100ct $65
Babies Breath throughout: $25
&Carnations: $1 (round 25)
Sunflower: $2
#Stock: $1 (round 10)
Lilies: $2
#Alstroemeria: $1 (round 10)
#Ranunculus: $2 (round 10)
#Eucalyptus: $1.05 (round 10)
#Cocculus: $1 (round 10)
#Ruscus: $0.60 (round 10)
#Spray roses: $1.20 (round 10)
#Craspedia Pop: $0.75 (round 10)

Basket arrangements fixed:
25 stems $65
50 stems $150
100 stems $250

Decoration prices:
Banner 2
Banner with Message 3
Stuffed Animal 12
Crown 12
Tissue Paper 4
Bow 2
Bow With Message 3
Babies Breath Letter/Number 15
Babies Breath Heart 5
Cherries/Strawberries 3
Photo Topper 5
Butterflies 3
Mini Bows 1

Formula:
subtotal = stem total + $5 supply charge + decorations
(no $5 charge for basket arrangements)

Output:
{
  "pre_tax_total": 123.45
}
`;

    const userPrompt = `
Customer notes:
${notes || "(none provided)"}

Calculate subtotal_before_tax only.
Return JSON with "pre_tax_total".
`;

    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.OPENAI_API_KEY,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: pricingRules },
              { type: "input_text", text: userPrompt },
              {
                type: "input_image",
                image_url: `data:image/jpeg;base64,${imageBase64}`,
              },
            ],
          },
        ],
      }),
    });

    const result = await aiResponse.json();
    const raw = result?.output?.[0]?.content?.[0]?.text || "";
    let parsed = JSON.parse(raw);

    const preTax = Number(parsed.pre_tax_total || 0);
    const salesTax = Number((preTax * 0.0735).toFixed(2));
    const grandTotal = Number((preTax + salesTax).toFixed(2));

    return NextResponse.json({ preTax, salesTax, grandTotal });

  } catch (err) {
    return new NextResponse(JSON.stringify({ error: err.message }), { status: 500 });
  }
}