"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const RemoteDownload = () => {
  const [remoteUrl, setRemoteUrl] = useState("");
  const [filename, setFilename] = useState("");
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!remoteUrl.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(remoteUrl);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setDownloading(true);

    try {
      const response = await fetch("/api/remote-download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          remoteUrl,
          filename: filename.trim() || undefined,
        }),
      });

      if (response.ok) {
        toast.success("File downloaded successfully!");
        setRemoteUrl("");
        setFilename("");
      } else {
        const error = await response.json();
        toast.error(error.error || "Download failed");
      }
    } catch (error) {
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-black">Remote Download</CardTitle>
        <CardDescription className="text-gray-600">
          Download files from remote URLs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            type="url"
            placeholder="https://example.com/file.pdf"
            value={remoteUrl}
            onChange={(e) => setRemoteUrl(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Custom filename (optional)"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="w-full"
          />
        </div>
        <Button
          onClick={handleDownload}
          disabled={!remoteUrl.trim() || downloading}
          className="w-full bg-black text-white hover:bg-gray-800"
        >
          {downloading ? "Downloading..." : "Download File"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default RemoteDownload;
