import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: "Command is required" }, { status: 400 });
    }

    // Basic security: block dangerous commands
    const dangerousCommands = [
      'rm -rf',
      'sudo',
      'su',
      'passwd',
      'shutdown',
      'reboot',
      'halt',
      'init',
      'mkfs',
      'fdisk',
      'dd',
      'format',
      'del /f',
      'rmdir /s'
    ];

    const lowerCommand = command.toLowerCase();
    const isDangerous = dangerousCommands.some(dangerous => 
      lowerCommand.includes(dangerous.toLowerCase())
    );

    if (isDangerous) {
      return NextResponse.json({ 
        output: "Error: Command blocked for security reasons",
        error: true 
      });
    }

    // Handle built-in commands
    if (command.trim() === 'help') {
      return NextResponse.json({
        output: `Available commands:
  help          - Show this help message
  ls            - List directory contents
  pwd           - Show current directory
  whoami        - Show current user
  date          - Show current date and time
  echo <text>   - Echo text
  cat <file>    - Display file contents
  clear         - Clear terminal (client-side)
  
Note: Some commands may be restricted for security.`
      });
    }

    if (command.trim() === 'clear') {
      return NextResponse.json({
        output: "",
        clear: true
      });
    }

    // Execute the command with timeout
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 10000, // 10 second timeout
        cwd: process.cwd(),
        env: { ...process.env, PATH: process.env.PATH }
      });

      let output = '';
      if (stdout) output += stdout;
      if (stderr) output += stderr;

      return NextResponse.json({
        output: output || 'Command executed successfully (no output)',
        error: !!stderr
      });

    } catch (error: any) {
      return NextResponse.json({
        output: `Error: ${error.message || 'Command execution failed'}`,
        error: true
      });
    }

  } catch (error) {
    console.error("Terminal API error:", error);
    return NextResponse.json(
      { error: "Terminal request failed" },
      { status: 500 }
    );
  }
}
