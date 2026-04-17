import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ 
        error: "Storage not configured",
        url: null 
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    
    const fileName = `${projectId || 'general'}/${Date.now()}_${file.name}`;
    
    const { error } = await supabase.storage
      .from("receipts")
      .upload(fileName, file);

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from("receipts")
      .getPublicUrl(fileName);

    return NextResponse.json({ 
      data: { 
        url: urlData.publicUrl,
        path: fileName 
      } 
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Failed to upload" }, { status: 500 });
  }
}