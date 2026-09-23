"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface FileItem {
  name: string;
  size: number;
  lastModified: string;
}

const FileList = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = async () => {
    try {
      const response = await fetch("/api/files");
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      } else {
        toast.error("Failed to fetch files");
      }
    } catch (error) {
      toast.error(`Failed to fetch files: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (filename: string) => {
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(filename)}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("File downloaded successfully!");
      } else {
        toast.error("Failed to download file");
      }
    } catch (error) {
      toast.error(`Failed to download file: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const deleteFile = async (filename: string) => {
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(filename)}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("File deleted successfully!");
        fetchFiles(); // Refresh the list
      } else {
        toast.error("Failed to delete file");
      }
    } catch (error) {
      toast.error(`Failed to delete file: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-black">Uploaded Files</CardTitle>
        <CardDescription className="text-gray-600">
          Manage your uploaded files
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No files uploaded yet</div>
        ) : (
          <div className="space-y-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="font-medium text-black truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(file.size)} • {new Date(file.lastModified).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadFile(file.name)}
                    className="text-black border-gray-300 hover:bg-gray-100"
                  >
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteFile(file.name)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4">
          <Button
            onClick={fetchFiles}
            variant="outline"
            className="w-full text-black border-gray-300 hover:bg-gray-100"
          >
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileList;
