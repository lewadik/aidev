"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  useEffect(() => {
    // Start the terminal server when the app loads
    fetch("/api/start-terminal-server", { method: "POST" })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-black">
            File Sharing & SSH Terminal
          </h1>
          <p className="text-xl text-gray-600">
            A modern web application for file management and remote terminal access
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-black mb-3">File Sharing</h3>
            <p className="text-gray-600 mb-4">
              Upload files, download from remote URLs, and manage your file storage with support for local, S3, SFTP, FTP, and WebDAV.
            </p>
            <ul className="text-sm text-gray-500 space-y-1 mb-4">
              <li>• File upload and download</li>
              <li>• Remote URL downloading</li>
              <li>• Multiple storage backends</li>
              <li>• File management interface</li>
            </ul>
          </div>

          <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-black mb-3">SSH Terminal</h3>
            <p className="text-gray-600 mb-4">
              Access a web-based terminal interface with support for both local and remote SSH connections.
            </p>
            <ul className="text-sm text-gray-500 space-y-1 mb-4">
              <li>• Web-based terminal</li>
              <li>• Local shell access</li>
              <li>• Remote SSH support</li>
              <li>• Real-time command execution</li>
            </ul>
          </div>
        </div>

        <div className="pt-8">
          <Link href="/file-sharing">
            <Button className="bg-black text-white hover:bg-gray-800 px-8 py-3 text-lg">
              Launch Application
            </Button>
          </Link>
        </div>

        <div className="pt-8 text-sm text-gray-500">
          <p>
            Built with Next.js, TypeScript, and Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  );
}
