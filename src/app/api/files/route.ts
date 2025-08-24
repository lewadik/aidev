import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function GET() {
  try {
    const uploadsDir = path.join(process.cwd(), "uploads");
    
    if (!existsSync(uploadsDir)) {
      return NextResponse.json({ files: [] });
    }

    const files = await readdir(uploadsDir);
    const fileDetails = await Promise.all(
      files.map(async (filename) => {
        const filepath = path.join(uploadsDir, filename);
        const stats = await stat(filepath);
        
        return {
          name: filename,
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
        };
      })
    );

    // Sort by last modified (newest first)
    fileDetails.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

    return NextResponse.json({ files: fileDetails });
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
