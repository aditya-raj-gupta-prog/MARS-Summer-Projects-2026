/**
 * MCP stdio test harness — sends real JSON-RPC messages to the compiled server
 * and prints labelled, formatted responses for each test case.
 */

import { spawn } from "child_process";
import { createInterface } from "readline";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER = resolve(__dirname, "dist/index.js");

// ── Protocol helpers ──────────────────────────────────────────────────────────

function msg(id, method, params) {
  return JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n";
}
function notify(method, params) {
  return JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n";
}

// ── Collect exactly `n` JSON-RPC responses from a readline interface ──────────

function collectResponses(rl, n) {
  return new Promise((resolve) => {
    const results = [];
    rl.on("line", function handler(line) {
      const trimmed = line.trim();
      if (!trimmed) return;
      try {
        results.push(JSON.parse(trimmed));
      } catch {
        // stderr bleeds through on some platforms — skip non-JSON lines
        return;
      }
      if (results.length >= n) {
        rl.off("line", handler);
        resolve(results);
      }
    });
  });
}

// ── Test cases ────────────────────────────────────────────────────────────────

const TEST_CASES = [
  {
    label: "TEST 1 — get_bhawan_canteen_menu  (Radhakrishnan, Day)",
    id: 2,
    method: "tools/call",
    params: {
      name: "get_bhawan_canteen_menu",
      arguments: { bhawanName: "Radhakrishnan", canteenType: "Day" },
    },
  },
  {
    label: "TEST 2 — get_bhawan_canteen_menu  (EWS — no canteen)",
    id: 3,
    method: "tools/call",
    params: {
      name: "get_bhawan_canteen_menu",
      arguments: { bhawanName: "EWS", canteenType: "Day" },
    },
  },
  {
    label: "TEST 3 — get_bhawan_menu           (CBRI_Canteen — redirect)",
    id: 4,
    method: "tools/call",
    params: {
      name: "get_bhawan_menu",
      arguments: { bhawanName: "CBRI_Canteen", day: "Monday" },
    },
  },
];

// ── Runner ────────────────────────────────────────────────────────────────────

async function run() {
  const proc = spawn("node", [SERVER], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  // Surface server-side errors without polluting stdout parsing
  proc.stderr.on("data", (d) => {
    const line = d.toString().trim();
    if (line) process.stderr.write(`  [server stderr] ${line}\n`);
  });

  const rl = createInterface({ input: proc.stdout });

  // ── 1. Handshake: initialize ──────────────────────────────────────────────
  proc.stdin.write(
    msg(1, "initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "stdio-test-harness", version: "1.0.0" },
    })
  );

  const [initResp] = await collectResponses(rl, 1);
  if (initResp.error) {
    console.error("Initialize failed:", JSON.stringify(initResp.error, null, 2));
    proc.kill();
    process.exit(1);
  }
  console.log(`\n✓ Handshake OK — server: ${JSON.stringify(initResp.result?.serverInfo ?? {})}\n`);
  console.log("=".repeat(72));

  // ── 2. Notify initialized ─────────────────────────────────────────────────
  proc.stdin.write(notify("notifications/initialized", {}));

  // ── 3. Run each test case ─────────────────────────────────────────────────
  for (const tc of TEST_CASES) {
    proc.stdin.write(msg(tc.id, tc.method, tc.params));
    const [resp] = await collectResponses(rl, 1);

    console.log(`\n${tc.label}`);
    console.log("-".repeat(72));

    if (resp.error) {
      console.error("  PROTOCOL ERROR:", JSON.stringify(resp.error, null, 2));
      continue;
    }

    const content = resp.result?.content ?? [];
    if (content.length === 0) {
      console.log("  (empty content array — unexpected)");
    } else {
      for (const block of content) {
        if (block.type === "text") {
          // Indent each line for readability
          console.log(block.text.replace(/^/gm, "  "));
        } else {
          console.log("  [non-text block]", JSON.stringify(block));
        }
      }
    }

    console.log("-".repeat(72));
  }

  proc.stdin.end();
  proc.kill();
  console.log("\n✓ All test cases completed — protocol streams clean.\n");
}

run().catch((err) => {
  console.error("Harness error:", err);
  process.exit(1);
});
