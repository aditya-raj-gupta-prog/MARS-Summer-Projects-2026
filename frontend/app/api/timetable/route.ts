import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { createInterface } from "readline";
import fs from "fs";
import path from "path";

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Resolve the compiled MCP server entry point independently of `process.cwd()`.
 *
 * The previous implementation used `path.resolve(process.cwd(), "..", …)`, which
 * only resolved correctly when the dev server was launched from the `frontend`
 * directory. Launched from the monorepo root (or anywhere else) it pointed one
 * level too high, the child `node` crashed with MODULE_NOT_FOUND on startup, and
 * — because its stderr was never read — the route silently hung for the full 15 s
 * timeout. We instead walk up from the cwd until we find the monorepo's
 * `mcp-servers/<name>/dist/index.js`, so the path is correct regardless of cwd.
 */
function resolveMcpServerPath(serverName: string): string {
  const relative = path.join("mcp-servers", serverName, "dist", "index.js");
  let dir = process.cwd();
  for (let depth = 0; depth < 8; depth++) {
    const candidate = path.join(dir, relative);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break; // reached filesystem root
    dir = parent;
  }
  // Last-resort fallback: the original frontend-relative guess.
  return path.resolve(process.cwd(), "..", relative);
}

const MCP_SERVER: string = resolveMcpServerPath("timetable");

/**
 * Absolute working directory for the spawned MCP server: its package root
 * (`mcp-servers/timetable`), two levels up from the `dist/index.js` entry.
 * Passing an explicit `cwd` keeps the Windows process loader from resolving
 * relative paths against an unexpected directory.
 */
const MCP_SERVER_CWD: string = path.dirname(path.dirname(MCP_SERVER));

const VALID_DEPARTMENTS = new Set([
  "PI", "CSE", "ECE", "EE", "ME", "CE", "CH",
  "META", "EPH", "MNC", "DSAI", "GT", "GPT", "ARCHI", "BSBE",
]);

const VALID_ACADEMIC_YEARS = new Set(["1st", "2nd", "3rd", "4th", "5th"]);

const VALID_DAYS = new Set([
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
]);

// ── Types ─────────────────────────────────────────────────────────────────────

interface RpcResponse {
  jsonrpc: "2.0";
  id?: number;
  result?: {
    content?: Array<{ type: string; text: string }>;
  };
  error?: { code: number; message: string };
}

// ── MCP orchestration ─────────────────────────────────────────────────────────

function callMcpTool(
  toolName: string,
  toolArgs: Record<string, string>
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Pass the entry path through an opaque boundary so Turbopack's build-time
    // module tracer cannot fold it into a literal. If it can, it treats the
    // spawned script as a server-relative import and aborts the build with
    // "server relative imports are not implemented yet". The round-trip is a
    // no-op at runtime — `entry` is exactly MCP_SERVER.
    const entry: string = JSON.parse(JSON.stringify(MCP_SERVER)) as string;
    // Spawn the *exact* Node binary running the dev server (`process.execPath`)
    // rather than a bare "node" resolved via PATH. The dev server's PATH may
    // resolve a different node (nvm shim, 32-bit, IDE-injected) than the one we
    // intend, and a mismatched runtime can fail to initialize subsystem DLLs
    // (STATUS_DLL_INIT_FAILED / 0xC0000142). Pinning execPath removes that variable.
    const proc = spawn(process.execPath, [entry], {
      cwd: MCP_SERVER_CWD,
      // Forward the full parent environment. On Windows, omitting this strips
      // critical tokens (SystemRoot, WINDIR, PATH) the loader needs to init
      // subsystem DLLs (e.g. user32.dll), causing the child to exit with
      // STATUS_DLL_INIT_FAILED (0xC0000142 / 3221225794) before it runs.
      env: { ...process.env },
      // CRITICAL on Windows: the Next.js dev server has no console of its own
      // (it's launched in the background). Without `windowsHide`, the Windows
      // loader tries to allocate a new console window for the child; in a
      // console-less host that allocation fails and the child is killed at
      // DLL-init time with STATUS_DLL_INIT_FAILED (0xC0000142 / 3221225794)
      // before any JS runs. `windowsHide: true` suppresses the console-window
      // allocation, so the child starts cleanly. (No-op on POSIX.)
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });

    const { stdin, stdout, stderr } = proc;

    if (!stdin || !stdout) {
      proc.kill();
      reject(new Error("Child process stdio not available"));
      return;
    }

    let settled = false;
    function settle(fn: () => void): void {
      if (settled) return;
      settled = true;
      try { proc.kill(); } catch { /* already dead */ }
      fn();
    }

    const timer = setTimeout(() => {
      settle(() => reject(new Error("MCP server timed out after 15 s")));
    }, 15_000);

    // Capture stderr so a fatal startup crash surfaces as a real error instead
    // of a silent 15 s hang (the child writes module/load errors only to stderr).
    let stderrBuf = "";
    stderr?.on("data", (chunk: Buffer) => { stderrBuf += chunk.toString(); });

    // If the child exits non-zero before we ever parsed a response, fail fast
    // with its stderr rather than waiting for the timeout.
    proc.on("exit", (code) => {
      if (code !== null && code !== 0) {
        clearTimeout(timer);
        const detail = stderrBuf.trim().split("\n").find((l) => l.includes("Error")) ??
          stderrBuf.trim().split("\n")[0] ?? "";
        settle(() =>
          reject(new Error(`MCP server exited with code ${code} on startup. ${detail}`.trim()))
        );
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      settle(() => reject(err));
    });

    const rl = createInterface({ input: stdout, crlfDelay: Infinity });

    let phase: "init" | "tool" = "init";

    rl.on("line", (raw) => {
      const line = raw.trim();
      if (!line) return;

      let msg: RpcResponse;
      try {
        msg = JSON.parse(line) as RpcResponse;
      } catch {
        return;
      }

      if (phase === "init" && msg.id === 1) {
        if (msg.error) {
          clearTimeout(timer);
          settle(() => reject(new Error(`MCP init failed: ${msg.error!.message}`)));
          return;
        }
        stdin.write(
          JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }) + "\n"
        );
        stdin.write(
          JSON.stringify({
            jsonrpc: "2.0",
            id: 2,
            method: "tools/call",
            params: { name: toolName, arguments: toolArgs },
          }) + "\n"
        );
        phase = "tool";
        return;
      }

      if (phase === "tool" && msg.id === 2) {
        clearTimeout(timer);
        if (msg.error) {
          settle(() => reject(new Error(`MCP tool error: ${msg.error!.message}`)));
          return;
        }
        const text =
          msg.result?.content?.find((c) => c.type === "text")?.text ?? "";
        settle(() => resolve(text));
      }
    });

    rl.on("error", (err) => {
      clearTimeout(timer);
      settle(() => reject(err));
    });

    stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "iitr-dashboard", version: "1.0.0" },
        },
      }) + "\n"
    );
  });
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { department, academicYear, batchSection, day } = body as {
    department?:  unknown;
    academicYear?: unknown;
    batchSection?: unknown;
    day?:          unknown;
  };

  if (typeof department !== "string" || !VALID_DEPARTMENTS.has(department)) {
    return NextResponse.json({ error: "Invalid or missing department" }, { status: 400 });
  }
  if (typeof academicYear !== "string" || !VALID_ACADEMIC_YEARS.has(academicYear)) {
    return NextResponse.json({ error: "Invalid or missing academicYear" }, { status: 400 });
  }
  if (typeof batchSection !== "string" || batchSection.trim() === "") {
    return NextResponse.json({ error: "Invalid or missing batchSection" }, { status: 400 });
  }
  if (typeof day !== "string" || !VALID_DAYS.has(day)) {
    return NextResponse.json({ error: "Invalid or missing day" }, { status: 400 });
  }

  try {
    const text = await callMcpTool("get_academic_timetable", {
      department,
      academicYear,
      batchSection: batchSection.trim(),
      day,
    });
    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "MCP server error";
    console.error("[timetable api]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
