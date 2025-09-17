import { NextRequest, NextResponse } from "next/server";
import { getStorageProvider } from "@/lib/storage/factory";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = decodeURIComponent(params.filename);
    const storage = getStorageProvider();

    // Check if file exists
    const exists = await storage.exists(filename);
    if (!exists) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fileBuffer = await storage.download(filename);
    
    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = "application/octet-stream";
    
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.zip': 'application/zip',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    if (mimeTypes[ext]) {
      contentType = mimeTypes[ext];
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading file:", error);
    
    if (error instanceof Error && error.message.includes('File not found')) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = decodeURIComponent(params.filename);
    const storage = getStorageProvider();

    // Check if file exists
    const exists = await storage.exists(filename);
    if (!exists) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    await storage.delete(filename);

    return NextResponse.json({ 
      success: true, 
      message: "File deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    
    if (error instanceof Error && error.message.includes('File not found')) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
