import { NextRequest, NextResponse } from "next/server";
import { getStorageConfig, resetStorageProvider } from "@/lib/storage/factory";

export async function GET() {
  try {
    const config = getStorageConfig();
    
    // Return config without sensitive data
    const safeConfig = {
      mode: config.mode,
      s3: config.s3 ? {
        region: config.s3.region,
        bucket: config.s3.bucket,
        endpoint: config.s3.endpoint,
        // Don't expose keys
      } : undefined,
      sftp: config.sftp ? {
        host: config.sftp.host,
        port: config.sftp.port,
        username: config.sftp.username,
        remotePath: config.sftp.remotePath,
        // Don't expose password/keys
      } : undefined,
      ftp: config.ftp ? {
        host: config.ftp.host,
        port: config.ftp.port,
        username: config.ftp.username,
        secure: config.ftp.secure,
        remotePath: config.ftp.remotePath,
        // Don't expose password
      } : undefined,
      webdav: config.webdav ? {
        url: config.webdav.url,
        username: config.webdav.username,
        remotePath: config.webdav.remotePath,
        // Don't expose password
      } : undefined,
      local: config.local,
    };

    return NextResponse.json({ config: safeConfig });
  } catch (error) {
    console.error("Error getting storage config:", error);
    return NextResponse.json(
      { error: "Failed to get storage configuration" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Reset storage provider to pick up new environment variables
    resetStorageProvider();
    
    return NextResponse.json({ 
      success: true, 
      message: "Storage configuration reloaded" 
    });
  } catch (error) {
    console.error("Error reloading storage config:", error);
    return NextResponse.json(
      { error: "Failed to reload storage configuration" },
      { status: 500 }
    );
  }
}