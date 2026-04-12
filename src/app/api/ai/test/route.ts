import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GOOGLE_API_KEY;
  const model = process.env.AI_MODEL_VISION_PRIMARY || "gemini-2.5-flash";
  
  return NextResponse.json({
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey?.substring(0, 10) || "none",
    model,
    envVars: Object.keys(process.env).filter(k => k.includes("GOOGLE") || k.includes("AI_"))
  });
}