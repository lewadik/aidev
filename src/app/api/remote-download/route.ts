import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { remoteUrl, filename } = await request.json();

    if (!remoteUrl) {
      return NextResponse.json({ error: "Remote URL is required" }, { status: 400 });
    }

    // Validate URL
    let url: URL;
    try {
      url = new URL(remoteUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL provided" }, { status: 400 });
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Download the file
    const response = await fetch(remoteUrl, {
      headers: {
        'User-Agent': 'File-Sharing-App/1.0'
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to download file: ${response.status} ${response.statusText}` },
        { status: 400 }
      );
    }

    // Get file buffer
    const buffer = Buffer.from(await response.arrayBuffer());

    // Determine filename
    let finalFilename = filename;
    if (!finalFilename) {
      // Try to get filename from URL or Content-Disposition header
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          finalFilename = match[1].replace(/['"]/g, '');
        }
      }
      
      if (!finalFilename) {
        // Extract from URL path
        const urlPath = url.pathname;
        finalFilename = path.basename(urlPath) || 'downloaded_file';
      }
    }

    // Create safe filename
    finalFilename = finalFilename.replace(/[^a-zA-Z0-9.-]/g, "_");
    if (!finalFilename.includes('.')) {
      // Try to determine extension from content-type
      const contentType = response.headers.get('content-type');
      if (contentType) {
        if (contentType.includes('pdf')) finalFilename += '.pdf';
        else if (contentType.includes('image/jpeg')) finalFilename += '.jpg';
        else if (contentType.includes('image/png')) finalFilename += '.png';
        else if (contentType.includes('text/plain')) finalFilename += '.txt';
        else if (contentType.includes('application/json')) finalFilename += '.json';
      }
    }

    const filepath = path.join(uploadsDir, finalFilename);

    // Write file
    await writeFile(filepath, buffer);

    return NextResponse.json({ 
      success: true, 
      filename: finalFilename,
      size: buffer.length,
      originalUrl: remoteUrl
    });

  } catch (error) {
    console.error("Remote download error:", error);
    return NextResponse.json(
      { error: "Remote download failed" },
      { status: 500 }
    );
  }
}
