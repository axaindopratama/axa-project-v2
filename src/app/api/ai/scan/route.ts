import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        data: {
          vendor: "Toko Bangunan Maju Jaya",
          date: new Date().toISOString().split("T")[0],
          items: [
            { description: "Semen 50kg", qty: 5, unitPrice: 65000, totalPrice: 325000 },
            { description: "Pasir 1 Colt", qty: 2, unitPrice: 150000, totalPrice: 300000 },
            { description: "Batu Split", qty: 1, unitPrice: 250000, totalPrice: 250000 },
          ],
          total: 875000,
          rawText: "Demo: AI scan not configured. Set GOOGLE_API_KEY environment variable.",
        }
      });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type;

    const model = "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const prompt = `You are a receipt parser. Analyze this receipt image and extract:
1. Vendor/Store name
2. Date
3. List of items with: description, quantity, unit price, total price
4. Total amount

Return a JSON object with this exact structure:
{
  "vendor": "store name",
  "date": "YYYY-MM-DD",
  "items": [{"description": "item name", "qty": 1, "unitPrice": 1000, "totalPrice": 1000}],
  "total": 1000,
  "rawText": "any additional text found"
}

If you cannot extract certain fields, use reasonable defaults. All monetary values should be in Indonesian Rupiah (numbers only, no commas).`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64 } }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse receipt data");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ data: parsed });
  } catch (error) {
    console.error("Error scanning receipt:", error);
    return NextResponse.json(
      { error: "Failed to scan receipt. Please try again." },
      { status: 500 }
    );
  }
}