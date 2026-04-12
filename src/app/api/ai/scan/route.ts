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
      console.log("No GOOGLE_API_KEY found in env");
      return NextResponse.json({ 
        error: "GOOGLE_API_KEY not configured on server",
        envCheck: "failed"
      }, { status: 500 });
    }

    console.log("API key found, prefix:", apiKey.substring(0, 8));

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type;

    const model = process.env.AI_MODEL_VISION_PRIMARY || "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    console.log("Using model:", model);

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

    let response;
    try {
      response = await fetch(url, {
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
            maxOutputTokens: 4096,
          }
        })
      });
    } catch (fetchError: any) {
      console.error("Fetch error:", fetchError.message);
      throw new Error(`Network error: ${fetchError.message}`);
    }

    console.log("Gemini response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const data = await response.json();
    console.log("Gemini response keys:", Object.keys(data));

    let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Handle thinking blocks in Gemini 2.5
    if (!generatedText && data.candidates?.[0]?.content?.parts?.length > 1) {
      // Get the last part which is the actual response after thinking
      generatedText = data.candidates[0].content.parts[data.candidates[0].content.parts.length - 1].text || "";
    }

    console.log("Generated text length:", generatedText.length);

    if (!generatedText) {
      throw new Error("Empty response from AI model");
    }

    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse receipt data");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log("Parsed data:", JSON.stringify(parsed));
    return NextResponse.json({ data: parsed });
  } catch (error: any) {
    console.error("=== Full error details ===");
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    console.error("Error toString:", error?.toString());
    console.error("Full error:", error);
    console.error("===========================");
    
    const errorMessage = error?.message || error?.toString() || "Unknown error";
    return NextResponse.json(
      { error: `Failed to scan receipt: ${errorMessage}` },
      { status: 500 }
    );
  }
}