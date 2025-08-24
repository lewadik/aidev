import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Get file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create safe filename
    const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filepath = path.join(uploadsDir, filename);

    // Write file
    await writeFile(filepath, buffer);

    return NextResponse.json({ 
      success: true, 
      filename,
      size: buffer.length 
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "File upload failed" },
      { status: 500 }
    );
  }
}
