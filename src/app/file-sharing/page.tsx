"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from "@/components/fileSharing/FileUpload";
import RemoteDownload from "@/components/fileSharing/RemoteDownload";
import FileList from "@/components/fileSharing/FileList";
import SshTerminal from "@/components/SshTerminal";

const FileSharingPage = () => {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-8">File Sharing & SSH Terminal</h1>
        
        <Tabs defaultValue="files" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="files" className="text-lg py-3">
              File Sharing
            </TabsTrigger>
            <TabsTrigger value="ssh" className="text-lg py-3">
              SSH Terminal
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="files" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <FileUpload />
                <RemoteDownload />
              </div>
              <div>
                <FileList />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="ssh">
            <SshTerminal />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FileSharingPage;
