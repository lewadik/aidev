import { NextResponse } from "next/server";
import { getStorageProvider } from "@/lib/storage/factory";

export async function POST() {
  try {
    const storage = getStorageProvider();
    
    // Test with a small file
    const testFilename = `test-${Date.now()}.txt`;
    const testContent = Buffer.from('Storage test file');
    
    // Test upload
    await storage.upload(testFilename, testContent, 'text/plain');
    
    // Test exists
    const exists = await storage.exists(testFilename);
    if (!exists) {
      throw new Error('File was uploaded but not found');
    }
    
    // Test download
    const downloaded = await storage.download(testFilename);
    if (!downloaded.equals(testContent)) {
      throw new Error('Downloaded content does not match uploaded content');
    }
    
    // Test list (should include our test file)
    const files = await storage.list();
    const testFile = files.find(f => f.name === testFilename);
    if (!testFile) {
      throw new Error('Test file not found in file list');
    }
    
    // Clean up - delete test file
    await storage.delete(testFilename);
    
    // Verify deletion
    const existsAfterDelete = await storage.exists(testFilename);
    if (existsAfterDelete) {
      throw new Error('Test file still exists after deletion');
    }

    return NextResponse.json({ 
      success: true, 
      message: "Storage provider test completed successfully",
      testResults: {
        upload: true,
        download: true,
        exists: true,
        list: true,
        delete: true,
      }
    });
  } catch (error) {
    console.error("Storage test error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Storage test failed",
        testResults: {
          upload: false,
          download: false,
          exists: false,
          list: false,
          delete: false,
        }
      },
      { status: 500 }
    );
  }
}