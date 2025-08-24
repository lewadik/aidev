"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const SshTerminal = () => {
  const [logs, setLogs] = useState<string[]>([
    "Terminal initialized. Connecting to server...",
    "Type 'help' for available commands.",
    "",
  ]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const connectWebSocket = () => {
      try {
        wsRef.current = new WebSocket(`ws://localhost:3001`);
        
        wsRef.current.onopen = () => {
          setConnected(true);
          setLogs(prev => [...prev, "✓ Connected to terminal server"]);
        };

        wsRef.current.onmessage = (event) => {
          const data = event.data.toString();
          setLogs(prev => [...prev, data]);
        };

        wsRef.current.onerror = (error) => {
          setLogs(prev => [...prev, "✗ Connection error. Using local terminal mode."]);
          setConnected(false);
        };

        wsRef.current.onclose = () => {
          setConnected(false);
          setLogs(prev => [...prev, "✗ Connection closed"]);
        };
      } catch (error) {
        setLogs(prev => [...prev, "✗ Failed to connect to WebSocket server"]);
        setConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const sendCommand = async () => {
    if (!input.trim()) return;

    const command = input.trim();
    setLogs(prev => [...prev, `$ ${command}`]);
    setInput("");

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Send to WebSocket server
      wsRef.current.send(command);
    } else {
      // Fallback: send to API endpoint
      try {
        const response = await fetch("/api/terminal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ command }),
        });

        if (response.ok) {
          const data = await response.json();
          setLogs(prev => [...prev, data.output || "Command executed"]);
        } else {
          setLogs(prev => [...prev, "Error: Failed to execute command"]);
        }
      } catch (error) {
        setLogs(prev => [...prev, "Error: Network error"]);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendCommand();
    }
  };

  const clearTerminal = () => {
    setLogs(["Terminal cleared.", ""]);
  };

  const reconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    setTimeout(() => {
      const connectWebSocket = () => {
        try {
          wsRef.current = new WebSocket(`ws://localhost:3001`);
          
          wsRef.current.onopen = () => {
            setConnected(true);
            setLogs(prev => [...prev, "✓ Reconnected to terminal server"]);
          };

          wsRef.current.onmessage = (event) => {
            const data = event.data.toString();
            setLogs(prev => [...prev, data]);
          };

          wsRef.current.onerror = () => {
            setLogs(prev => [...prev, "✗ Reconnection failed"]);
            setConnected(false);
          };

          wsRef.current.onclose = () => {
            setConnected(false);
          };
        } catch (error) {
          setLogs(prev => [...prev, "✗ Failed to reconnect"]);
          setConnected(false);
        }
      };

      connectWebSocket();
    }, 1000);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-black">SSH Terminal</CardTitle>
            <CardDescription className="text-gray-600">
              Interactive terminal interface
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          ref={terminalRef}
          className="bg-black text-green-400 font-mono text-sm p-4 rounded-lg h-96 overflow-y-auto whitespace-pre-wrap"
        >
          {logs.map((log, i) => (
            <div key={i} className="leading-relaxed">
              {log}
            </div>
          ))}
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1 flex items-center bg-black text-green-400 font-mono text-sm rounded-lg">
            <span className="px-3 py-2 text-green-400">$</span>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter command..."
              className="flex-1 bg-transparent border-none text-green-400 placeholder-green-600 focus:ring-0 font-mono"
            />
          </div>
          <Button
            onClick={sendCommand}
            disabled={!input.trim()}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            Send
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={clearTerminal}
            variant="outline"
            size="sm"
            className="text-black border-gray-300 hover:bg-gray-100"
          >
            Clear
          </Button>
          <Button
            onClick={reconnect}
            variant="outline"
            size="sm"
            className="text-black border-gray-300 hover:bg-gray-100"
          >
            Reconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SshTerminal;
