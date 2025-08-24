```markdown
# Detailed Implementation Plan for File Sharing Application with Remote Download and SSH Terminal

This plan outlines all changes and file additions required to implement a modern file sharing application with remote download capability and an integrated SSH terminal. The application will support local filesystem storage as well as S3, SFTP, FTP, and WebDav options, and it will be built using our existing Next.js/TypeScript setup.

---

## 1. Dependency & Environment Setup

- **Update package.json**  
  - Add new dependencies:
    - "node-pty" (for pseudo terminal creation)
    - "ws" (to handle WebSocket connections)
    - "ssh2" (for remote SSH connections, if remote SSH is required)
    - "aws-sdk" or "@aws-sdk/client-s3" (for S3 storage support)  
  - Example addition in `package.json`:
    ```json
    {
      "dependencies": {
        "node-pty": "^0.10.1",
        "ws": "^8.12.0",
        "ssh2": "^1.11.0",
        "@aws-sdk/client-s3": "^3.300.0"
      }
    }
    ```

- **Create .env.local File**  
  - Define storage mode and credentials:
    ```
    STORAGE_MODE=local   # Options: local, s3, sftp, ftp, webdav
    S3_ACCESS_KEY=your_access_key
    S3_SECRET_KEY=your_secret_key
    S3_BUCKET=your_bucket_name
    SFTP_HOST=your_sftp_host
    SFTP_USER=your_sftp_username
    SFTP_PASSWORD=your_sftp_password
    SSH_REMOTE_MODE=false  # Set to true if you want remote SSH with provided credentials
    SSH_HOST=your_ssh_host
    SSH_USERNAME=your_ssh_username
    SSH_PASSWORD=your_ssh_password
    ```

---

## 2. UI Components & Pages

### A. File Sharing & Remote Download Page
- **File:** `src/app/file-sharing/page.tsx`  
  - Create a new Next.js page with a modern, clean layout.
  - Layout features two main panels (tabs or segmented control):
    - **File Sharing Panel:** Contains file upload, remote download input, and file list display.
    - **SSH Terminal Panel:** Embeds the SSH terminal component.
  - Use minimal styling, clear typography, ample spacing, and a simple color scheme.
  - Example structure:
    ```tsx
    import React, { useState } from "react";
    import FileUpload from "@/components/fileSharing/FileUpload";
    import RemoteDownload from "@/components/fileSharing/RemoteDownload";
    import FileList from "@/components/fileSharing/FileList";
    import SshTerminal from "@/components/SshTerminal";

    const FileSharingPage = () => {
      const [activeTab, setActiveTab] = useState<"files" | "ssh">("files");

      return (
        <div className="p-8">
          <div className="mb-4 flex gap-4">
            <button onClick={() => setActiveTab("files")} className="px-4 py-2 font-medium border rounded">
              File Sharing
            </button>
            <button onClick={() => setActiveTab("ssh")} className="px-4 py-2 font-medium border rounded">
              SSH Terminal
            </button>
          </div>
          {activeTab === "files" ? (
            <div>
              <FileUpload />
              <RemoteDownload />
              <FileList />
            </div>
          ) : (
            <SshTerminal />
          )}
        </div>
      );
    };

    export default FileSharingPage;
    ```

### B. File Sharing Components
- **File:** `src/components/fileSharing/FileUpload.tsx`  
  - Component for selecting and uploading files.
  - Uses an `<input type="file" />` and a submit button.
  - Handles errors (e.g., file too large, unsupported format) and displays messages.
- **File:** `src/components/fileSharing/RemoteDownload.tsx`  
  - Component with an input field for a remote URL and a button to trigger the download.
  - Validates URL input and shows success/error notifications based on response.
- **File:** `src/components/fileSharing/FileList.tsx`  
  - Component to display the list of files currently stored.
  - Retrieves data from a dedicated API endpoint or state management.

### C. SSH Terminal Component
- **File:** `src/components/SshTerminal.tsx`  
  - A component that establishes a WebSocket connection to a backend SSH server.
  - The UI includes a scrollable text area (monospaced font) for shell output and an input field for user commands.
  - Example snippet:
    ```tsx
    import React, { useEffect, useRef, useState } from "react";

    const SshTerminal = () => {
      const [logs, setLogs] = useState<string[]>([]);
      const [input, setInput] = useState("");
      const wsRef = useRef<WebSocket | null>(null);

      useEffect(() => {
        wsRef.current = new WebSocket("ws://localhost:3001");
        wsRef.current.onmessage = (event) => {
          setLogs((prev) => [...prev, event.data]);
        };
        wsRef.current.onerror = () => {
          setLogs((prev) => [...prev, "Connection error."]);
        };
        return () => wsRef.current?.close();
      }, []);

      const sendCommand = () => {
        if (wsRef.current && input.trim() !== "") {
          wsRef.current.send(input);
          setInput("");
        }
      };

      return (
        <div className="border p-4 rounded bg-gray-900 text-green-400 font-mono">
          <div className="h-64 overflow-y-auto mb-2">
            {logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
          <div className="flex">
            <input
              className="flex-1 p-2 bg-gray-800 border rounded-l text-white"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendCommand()}
              placeholder="Enter command..."
            />
            <button onClick={sendCommand} className="px-4 py-2 bg-blue-600 text-white rounded-r">
              Send
            </button>
          </div>
        </div>
      );
    };

    export default SshTerminal;
    ```

---

## 3. API Endpoints

### A. File Upload API
- **File:** `src/app/api/upload/route.ts`
  - Accepts POST requests with multipart/form-data.
  - Uses Node.js built-in modules or third-party libraries (e.g., formidable) for parsing.
  - Depending on the STORAGE_MODE (from .env.local):
    - If `local`, save file to a designated folder.
    - If `s3`, use AWS SDK to upload to the specified bucket.
  - Example pseudocode structure:
    ```tsx
    import { NextResponse } from "next/server";
    import formidable from "formidable";
    import fs from "fs";
    // If using S3:
    import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

    export const config = {
      api: { bodyParser: false },
    };

    export default async function handler(req: Request) {
      if (req.method !== "POST") {
        return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
      }
      try {
        const form = formidable({ multiples: false });
        const { fields, files } = await new Promise((resolve, reject) => {
          form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            else resolve({ fields, files });
          });
        });

        // Process file based on STORAGE_MODE (local/s3/...)
        // For local storage:
        const file = files.file;
        const data = fs.readFileSync(file.filepath);
        fs.writeFileSync(`./uploads/${file.originalFilename}`, data);

        // (If using S3, implement upload via PutObjectCommand)
        return NextResponse.json({ success: true });
      } catch (error) {
        return NextResponse.json({ error: "File upload failed." }, { status: 500 });
      }
    }
    ```

### B. Remote Download API
- **File:** `src/app/api/remote-download/route.ts`
  - Accepts a POST request containing a JSON payload with `remoteUrl` and optionally a target filename.
  - Downloads the remote file using fetch or axios, then saves it following the active storage mode.
  - Include error handling for invalid URLs and network timeouts.
  - Example structure:
    ```tsx
    import { NextResponse } from "next/server";
    import fs from "fs";
    import fetch from "node-fetch";
    
    export default async function handler(req: Request) {
      if (req.method !== "POST") {
        return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
      }
      try {
        const { remoteUrl, filename } = await req.json();
        if (!remoteUrl) {
          return NextResponse.json({ error: "Remote URL is required." }, { status: 400 });
        }
        const response = await fetch(remoteUrl);
        if (!response.ok) throw new Error("Failed to download file.");
        const buffer = Buffer.from(await response.arrayBuffer());
        // For local storage demonstration:
        fs.writeFileSync(`./uploads/${filename || "downloaded_file"}`, buffer);
        return NextResponse.json({ success: true });
      } catch (error) {
        return NextResponse.json({ error: "Remote download failed." }, { status: 500 });
      }
    }
    ```

### C. SSH Terminal (WebSocket) API & Server
- **File:** `src/lib/sshTerminalServer.ts`  
  - Create a custom Node.js module that instantiates a WebSocket server using the `ws` library.
  - Use `node-pty` to spawn a pseudo terminal:
    - If `SSH_REMOTE_MODE` is `false`, spawn a local shell (e.g., bash or cmd).
    - If set to `true`, use the `ssh2` library to connect to the remote SSH host using credentials from the environment.
  - Manage connections:
    - Upon WebSocket connection, create a pty session.
    - On receiving messages (commands), send them to the pty/SSH shell.
    - Stream output from the pty and emit back to the WebSocket client.
  - Sample snippet:
    ```ts
    import WebSocket, { WebSocketServer } from "ws";
    import pty from "node-pty";
    // Optionally import ssh2 for remote ssh connections
    const wss = new WebSocketServer({ port: 3001 });

    wss.on("connection", (ws) => {
      // Spawn a pty session (for local shell)
      const shell = process.platform === "win32" ? "cmd.exe" : "bash";
      const ptyProcess = pty.spawn(shell, [], {
        name: "xterm-color",
        cols: 80,
        rows: 24,
        cwd: process.env.HOME,
        env: process.env,
      });

      ptyProcess.on("data", (data) => {
        ws.send(data);
      });

      ws.on("message", (msg) => {
        ptyProcess.write(msg.toString());
      });

      ws.on("close", () => {
        ptyProcess.kill();
      });
    });
    ```
  - **Note:** To integrate the SSH terminal endpoint with Next.js, run this module as a separate process or attach it to the Next.js custom server.

---

## 4. Error Handling and Best Practices

- Validate request methods and inputs in all API endpoints.
- Wrap asynchronous operations in try/catch blocks and return appropriate HTTP status codes.
- For file uploads/downloads, check file sizes, type restrictions, and sanitize file names.
- In the SSH terminal, gracefully handle WebSocket disconnects and errors during pty or SSH connections.
- Use environment variables for sensitive credentials and configurable storage options.
- Log errors server-side while avoiding detailed error exposure to clients.

---

## 5. UI/UX Considerations

- **Modern File Sharing Interface:**  
  - Clean layout with clearly separated panels for file operations and terminal access.
  - Use built-in UI components (buttons, inputs, alerts) for consistency.
  - Provide user feedback via notifications for successful uploads/downloads and error scenarios.
  
- **SSH Terminal Interface:**  
  - Monospaced font, dark theme background, and clear separation between output area and input field.
  - Responsiveness and keyboard-focused interactions for a realistic terminal experience.

---

## 6. Testing & Integration

- **API Testing:**  
  - Validate file upload via curl using multipart form data.
  - Test remote download by POSTing JSON with a remote URL.
  - Test the SSH terminal by connecting via a WebSocket client (e.g., wscat).
  - Example curl command for remote download:
    ```bash
    curl -X POST http://localhost:3000/api/remote-download \
         -H "Content-Type: application/json" \
         -d '{"remoteUrl": "https://example.com/file.txt", "filename": "downloaded.txt"}'
    ```

- **UI Testing:**  
  - Verify tab switching between file sharing and SSH terminal.
  - Check that error messages render correctly when API calls fail.

---

## Summary

- Added new dependencies ("node-pty", "ws", "ssh2", "@aws-sdk/client-s3") and environment variables for flexible storage modes.
- Created a modern file sharing page with two tabs: one for file upload/remote download (including FileUpload, RemoteDownload, FileList components) and one for an SSH terminal (SshTerminal component).
- Developed API endpoints for file upload and remote download with proper error handling and support for local and S3 storage.
- Implemented a custom WebSocket server using node-pty (and optionally ssh2) for the SSH terminal functionality.
- Ensured UI/UX consistency, robust error handling, and proper test instructions using curl commands and WebSocket testing.
