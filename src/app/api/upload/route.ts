import { NextRequest, NextResponse } from "next/server";
import { getStorageProvider } from "@/lib/storage/factory";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Get file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create safe filename
    const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    
    // Get content type
    const contentType = file.type || 'application/octet-stream';

    // Upload using storage provider
    const storage = getStorageProvider();
    await storage.upload(filename, buffer, contentType);

    return NextResponse.json({ 
      success: true, 
      filename,
      size: buffer.length,
      contentType
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "File upload failed" },
      { status: 500 }
    );
  }
}
