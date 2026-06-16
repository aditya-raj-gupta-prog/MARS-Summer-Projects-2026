import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { createInterface } from "readline";
import fs from "fs";
import path from "path";

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Resolve the compiled MCP server entry point independently of `process.cwd()`.
 *
 * `path.resolve(process.cwd(), "..", …)` only worked when the dev server was
 * launched from `frontend`; from the monorepo root it pointed one level too high,
 * the child `node` crashed with MODULE_NOT_FOUND, and — since its stderr was never
 * read — the route silently hung for the full 15 s timeout. We walk up from the
 * cwd until we locate `mcp-servers/<name>/dist/index.js`, so the path is correct
 * regardless of where the server process was started. Building the path from
 * string parts (not a literal) keeps Turbopack's static tracer from treating it
 * as a module import.
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

const MCP_SERVER: string = resolveMcpServerPath("cafeteria");

/**
 * Absolute working directory for the spawned MCP server: its package root
 * (`mcp-servers/cafeteria`), two levels up from the `dist/index.js` entry.
 * Passing an explicit `cwd` keeps the Windows process loader from resolving
 * relative paths against an unexpected directory.
 */
const MCP_SERVER_CWD: string = path.dirname(path.dirname(MCP_SERVER));

const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
] as const;

const VALID_DAYS = new Set<string>(DAY_NAMES);

const VALID_LOCATIONS = new Set([
  "Rajendra", "Cautley", "Radhakrishnan", "Govind", "Jawahar",
  "Rajiv", "Azad", "Ravindra", "Ganga", "Himalaya",
  "Arawali", "Sarojini", "Kasturba", "EWS",
  "CBRI_Canteen", "Green_Gala_Cafe", "CCD", "Amul_Parlour_MAC",
]);

const VALID_VIEW_TYPES = new Set(["Mess", "Day", "Night"]);

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

    // Single-flight settle: kills process and fires exactly once
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

    // Simple two-step state machine: wait for initialize ACK, then tool result
    let phase: "init" | "tool" = "init";

    rl.on("line", (raw) => {
      const line = raw.trim();
      if (!line) return;

      let msg: RpcResponse;
      try {
        msg = JSON.parse(line) as RpcResponse;
      } catch {
        return; // not JSON — skip (e.g. spurious debug output)
      }

      if (phase === "init" && msg.id === 1) {
        if (msg.error) {
          clearTimeout(timer);
          settle(() => reject(new Error(`MCP init failed: ${msg.error!.message}`)));
          return;
        }
        // Handshake complete — notify + issue tool call
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

    // Kick off the MCP handshake
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
  // Parse + validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { location, viewType, day } = body as {
    location?: unknown;
    viewType?: unknown;
    day?:      unknown;
  };

  if (typeof location !== "string" || !VALID_LOCATIONS.has(location)) {
    return NextResponse.json({ error: "Invalid or missing location" }, { status: 400 });
  }
  if (typeof viewType !== "string" || !VALID_VIEW_TYPES.has(viewType)) {
    return NextResponse.json({ error: "Invalid or missing viewType" }, { status: 400 });
  }
  // `day` is optional: the dashboard panel omits it (server defaults to today),
  // while the AI assistant may request a specific weekday's mess menu.
  if (day !== undefined && (typeof day !== "string" || !VALID_DAYS.has(day))) {
    return NextResponse.json({ error: "Invalid day" }, { status: 400 });
  }

  // Use the requested day when supplied, else derive today server-side.
  const targetDay: string = typeof day === "string" ? day : DAY_NAMES[new Date().getDay()];

  const toolName =
    viewType === "Mess" ? "get_bhawan_menu" : "get_bhawan_canteen_menu";

  const toolArgs: Record<string, string> =
    viewType === "Mess"
      ? { bhawanName: location, day: targetDay }
      : { bhawanName: location, canteenType: viewType };

  try {
    const text = await callMcpTool(toolName, toolArgs);
    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "MCP server error";
    console.error("[cafeteria api]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
