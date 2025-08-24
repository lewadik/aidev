import WebSocket, { WebSocketServer } from "ws";
import * as pty from "node-pty";
import { Client } from "ssh2";

const WS_PORT = parseInt(process.env.WS_PORT || "3001");
const SSH_REMOTE_MODE = process.env.SSH_REMOTE_MODE === "true";

interface TerminalSession {
  pty?: pty.IPty;
  ssh?: Client;
  ws: WebSocket;
}

class SSHTerminalServer {
  private wss: WebSocketServer;
  private sessions: Map<WebSocket, TerminalSession> = new Map();

  constructor() {
    this.wss = new WebSocketServer({ port: WS_PORT });
    this.setupWebSocketServer();
    console.log(`SSH Terminal WebSocket server running on port ${WS_PORT}`);
  }

  private setupWebSocketServer() {
    this.wss.on("connection", (ws: WebSocket) => {
      console.log("New WebSocket connection established");
      
      if (SSH_REMOTE_MODE) {
        this.setupRemoteSSH(ws);
      } else {
        this.setupLocalTerminal(ws);
      }

      ws.on("close", () => {
        this.cleanupSession(ws);
      });

      ws.on("error", (error: Error) => {
        console.error("WebSocket error:", error);
        this.cleanupSession(ws);
      });
    });
  }

  private setupLocalTerminal(ws: WebSocket) {
    try {
      // Determine shell based on platform
      const shell = process.platform === "win32" ? "cmd.exe" : "bash";
      const args = process.platform === "win32" ? [] : [];

      const ptyProcess = pty.spawn(shell, args, {
        name: "xterm-color",
        cols: 80,
        rows: 24,
        cwd: process.cwd(),
        env: process.env as { [key: string]: string },
      });

      const session: TerminalSession = {
        pty: ptyProcess,
        ws: ws,
      };

      this.sessions.set(ws, session);

      // Send initial prompt
      ws.send("Local terminal connected. Type 'help' for available commands.\r\n");

      ptyProcess.onData((data: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });

      ptyProcess.onExit(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send("\r\nTerminal session ended.\r\n");
        }
        this.cleanupSession(ws);
      });

      ws.on("message", (message: Buffer) => {
        const command = message.toString();
        
        // Handle special commands
        if (command.trim() === "help") {
          ws.send(`\r\nAvailable commands:
  help          - Show this help message
  ls            - List directory contents  
  pwd           - Show current directory
  whoami        - Show current user
  date          - Show current date and time
  echo <text>   - Echo text
  cat <file>    - Display file contents
  clear         - Clear terminal
  exit          - Close terminal session
  
You can also run most standard shell commands.\r\n`);
          return;
        }

        if (command.trim() === "clear") {
          ws.send("\x1b[2J\x1b[H"); // ANSI clear screen
          return;
        }

        if (command.trim() === "exit") {
          ws.send("Goodbye!\r\n");
          ws.close();
          return;
        }

        // Send command to pty
        ptyProcess.write(command);
      });

    } catch (error) {
      console.error("Error setting up local terminal:", error);
      ws.send("Error: Failed to initialize local terminal\r\n");
      ws.close();
    }
  }

  private setupRemoteSSH(ws: WebSocket) {
    const sshClient = new Client();
    const session: TerminalSession = {
      ssh: sshClient,
      ws: ws,
    };

    this.sessions.set(ws, session);

    sshClient.on("ready", () => {
      ws.send("SSH connection established\r\n");

      sshClient.shell((err: Error | undefined, stream: any) => {
        if (err) {
          ws.send(`SSH shell error: ${err.message}\r\n`);
          ws.close();
          return;
        }

        stream.on("close", () => {
          ws.send("SSH session closed\r\n");
          sshClient.end();
          ws.close();
        });

        stream.on("data", (data: Buffer) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(data.toString());
          }
        });

        ws.on("message", (message: Buffer) => {
          stream.write(message.toString());
        });
      });
    });

    sshClient.on("error", (err: Error) => {
      ws.send(`SSH connection error: ${err.message}\r\n`);
      ws.close();
    });

    // Connect to SSH server
    try {
      sshClient.connect({
        host: process.env.SSH_HOST || "localhost",
        port: parseInt(process.env.SSH_PORT || "22"),
        username: process.env.SSH_USERNAME || "user",
        password: process.env.SSH_PASSWORD,
        // You can also use privateKey for key-based authentication
      });
    } catch (error) {
      ws.send(`SSH connection failed: ${error}\r\n`);
      ws.close();
    }
  }

  private cleanupSession(ws: WebSocket) {
    const session = this.sessions.get(ws);
    if (session) {
      if (session.pty) {
        session.pty.kill();
      }
      if (session.ssh) {
        session.ssh.end();
      }
      this.sessions.delete(ws);
    }
    console.log("Session cleaned up");
  }

  public close() {
    this.sessions.forEach((session, ws) => {
      this.cleanupSession(ws);
    });
    this.wss.close();
  }
}

// Export singleton instance
let terminalServer: SSHTerminalServer | null = null;

export function startTerminalServer() {
  if (!terminalServer) {
    terminalServer = new SSHTerminalServer();
  }
  return terminalServer;
}

export function stopTerminalServer() {
  if (terminalServer) {
    terminalServer.close();
    terminalServer = null;
  }
}

// In Next.js, this module is imported by API routes; no direct auto-start required.
