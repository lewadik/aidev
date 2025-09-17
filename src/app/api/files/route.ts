import { NextResponse } from "next/server";
import { getStorageProvider } from "@/lib/storage/factory";

export async function GET() {
  try {
    const storage = getStorageProvider();
    const files = await storage.list();

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
