import { NextResponse } from "next/server";
import { startTerminalServer } from "@/lib/sshTerminalServer";

export async function POST() {
  try {
    // Start the terminal server
    startTerminalServer();
    
    return NextResponse.json({ 
      success: true, 
      message: "Terminal server started successfully" 
    });
  } catch (error) {
    console.error("Failed to start terminal server:", error);
    return NextResponse.json(
      { error: "Failed to start terminal server" },
      { status: 500 }
    );
  }
}
