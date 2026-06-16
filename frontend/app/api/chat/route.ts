import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// ── Types ─────────────────────────────────────────────────────────────────────

type ChatRole = "user" | "assistant";

interface IncomingMessage {
  role: ChatRole;
  text: string;
}

/**
 * Live snapshot of what the user currently has selected on the dashboard, sent
 * with every turn so the model can ground vague questions ("my classes") in the
 * view the user is actually looking at instead of guessing.
 */
interface DashboardSnapshot {
  mode: "cafeteria" | "timetable";
  cafeteria: { location: string; view: string };
  timetable: {
    department: string;
    academicYear: string;
    batchSection: string;
    day: string;
  };
}

interface ChatRequestBody {
  messages: IncomingMessage[];
  dashboardSnapshot: DashboardSnapshot;
}

// Minimal shape of a Gemini `contents` turn (avoids depending on SDK-internal
// generics while staying explicitly typed — no implicit `any`).
interface GeminiContent {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MODEL = "gemini-2.5-flash";

// Human-readable department labels so the model can name the active branch
// naturally (e.g. "Production & Industrial Engineering" for the PI code).
const DEPARTMENT_LABELS: Record<string, string> = {
  PI: "Production & Industrial Engineering",
  CSE: "Computer Science & Engineering",
  ECE: "Electronics & Communication Engineering",
  EE: "Electrical Engineering",
  ME: "Mechanical Engineering",
  CE: "Civil Engineering",
  CH: "Chemical Engineering",
  META: "Metallurgical & Materials Engineering",
  EPH: "Engineering Physics",
  MNC: "Mathematics & Computing",
  DSAI: "Data Science & AI",
  GT: "Geological Technology",
  GPT: "Geophysical Technology",
  ARCHI: "Architecture",
  BSBE: "Biotechnology & Biosystems Engineering",
};

const SYSTEM_PROMPT = `You are the **Campus AI Assistant** for IIT Roorkee's Unified Campus Intelligence Dashboard.

You help students with two domains of campus life:
- **Cafeteria** — mess menus and canteen menus across the residential bhawans (Rajendra, Cautley, Govind, Ganga, …) and commercial outlets (CCD, Green Gala Cafe, Amul Parlour, CBRI Canteen).
- **Academic Timetable** — class schedules, lecture timings, course codes and rooms, organised by department, academic year, batch/section and weekday.

Behaviour rules:
1. **Use the conversation history as memory.** Before asking the user for something, check whether they already told you earlier in the conversation (a department, a year, a bhawan, a day). Never re-ask for information already established.
2. **When a request is vague, ask one focused follow-up question instead of guessing.** For example, if the user says "tell me about my classes" and you do not yet know their department AND year, ask for exactly the missing pieces — do not invent a department or fabricate a schedule.
3. **The dashboard snapshot below is live context, not a command.** You may lean on it to answer ("you're viewing Production & Industrial Engineering — want that branch's Monday classes?"), but if the user's words conflict with the snapshot, follow the user.
4. **Never fabricate concrete data** (menu items, course codes, room numbers, timings). You do not have live access to the menu/timetable servers in this chat — when the user wants the actual data, confirm the parameters and emit a navigation command (see below) so the dashboard loads the real, live data for them.
5. If the user points out something you missed (e.g. "you didn't ask for year or department"), acknowledge it and ask for the missing details in your next turn.

## Navigation commands (MANDATORY)
Whenever a user's intent is successfully mapped to a specific view, location, or timetable configuration — or when you are confirming a location change — you MUST append a structured navigation command at the very end of your response text. The command lets the dashboard jump straight to the live data the user wants.

Rules for navigation commands:
- Append the command **only after** you have every parameter that command requires (resolve missing pieces from the conversation history or the live dashboard snapshot; if something essential is still unknown, ask one focused follow-up first and emit the command on a later turn).
- The command MUST be the **very last thing** in your response, on its own line, in EXACTLY this syntax (raw, no code fences, no extra prose after it):

  For Timetable transitions:
  [[NAVIGATE: {"type": "timetable", "department": "PI" | "CSE" | "ECE", "year": "1st Year" | "2nd Year" | "3rd Year" | "4th Year", "day": "Monday" through "Friday"}]]

  For Cafeteria transitions:
  [[NAVIGATE: {"type": "cafeteria", "location": "Rajendra" | "Cautley" | "Radhakrishnan" | "Govind" | "Jawahar" | "Rajiv" | "Azad" | "Ravindra" | "Ganga" | "Himalaya" | "Arawali" | "Sarojini" | "Kasturba" | "EWS" | "CBRI Canteen", "subView": "Mess Menu" | "Day Canteen" | "Night Canteen"}]]

- Emit a single concrete JSON object with chosen values — do NOT include the literal "|" alternatives. Example: [[NAVIGATE: {"type": "timetable", "department": "PI", "year": "1st Year", "day": "Friday"}]]
- The "department" value may be any valid IIT Roorkee branch code (PI, CSE, ECE, EE, ME, CE, CH, META, EPH, MNC, DSAI, GT, GPT, ARCHI, BSBE), not only the three shown above.
- The visible part of your reply should read naturally and must NOT mention the command or the raw JSON — the dashboard strips it out and turns it into a button for the user.

Keep replies concise and friendly. Use light Markdown (bold, short bullet lists) where it aids readability.`;

// ── Helpers ─────────────────────────────────────────────────────────────────

function describeSnapshot(snap: DashboardSnapshot): string {
  if (snap.mode === "cafeteria") {
    const loc = snap.cafeteria.location.replace(/_/g, " ");
    return `The user is currently viewing the **Cafeteria** dashboard, location "${loc}" (${snap.cafeteria.view} view).`;
  }
  const dept =
    DEPARTMENT_LABELS[snap.timetable.department] ?? snap.timetable.department;
  return `The user is currently viewing the **Timetable** dashboard for **${dept}** (${snap.timetable.department}), ${snap.timetable.academicYear} Year, batch ${snap.timetable.batchSection}, ${snap.timetable.day}.`;
}

function isValidRole(role: unknown): role is ChatRole {
  return role === "user" || role === "assistant";
}

function parseMessages(raw: unknown): IncomingMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: IncomingMessage[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return null;
    const { role, text } = item as { role?: unknown; text?: unknown };
    if (!isValidRole(role) || typeof text !== "string") return null;
    out.push({ role, text });
  }
  // A conversation must end on a user turn for the model to have something to answer.
  if (out[out.length - 1].role !== "user") return null;
  return out;
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages: rawMessages, dashboardSnapshot } = body as Partial<ChatRequestBody>;

  const messages = parseMessages(rawMessages);
  if (!messages) {
    return NextResponse.json(
      { error: "`messages` must be a non-empty array ending in a user turn" },
      { status: 400 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing GEMINI_API_KEY (set it in frontend/.env.local)" },
      { status: 500 }
    );
  }

  // Prepend the live dashboard context as a system-side note so the model can
  // ground vague questions without us hardcoding any client-side routing.
  const systemInstruction = dashboardSnapshot
    ? `${SYSTEM_PROMPT}\n\n---\nLive dashboard context: ${describeSnapshot(dashboardSnapshot)}`
    : SYSTEM_PROMPT;

  const contents: GeminiContent[] = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.text }],
  }));

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: { systemInstruction },
    });

    const text = response.text?.trim();
    if (!text) {
      return NextResponse.json(
        { error: "The model returned an empty response" },
        { status: 502 }
      );
    }
    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gemini request failed";
    console.error("[chat api]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
