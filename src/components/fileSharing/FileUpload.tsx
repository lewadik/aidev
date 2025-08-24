"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const FileUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("File uploaded successfully!");
        setSelectedFile(null);
        // Reset the input
        const fileInput = document.getElementById("file-input") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        const error = await response.json();
        toast.error(error.error || "Upload failed");
      }
    } catch (error) {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-black">Upload File</CardTitle>
        <CardDescription className="text-gray-600">
          Select and upload files to the server
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            id="file-input"
            type="file"
            onChange={handleFileSelect}
            className="cursor-pointer"
          />
          {selectedFile && (
            <p className="text-sm text-gray-600">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full bg-black text-white hover:bg-gray-800"
        >
          {uploading ? "Uploading..." : "Upload File"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default FileUpload;
