"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

import AIOrb from "@/components/AIOrb";

// ── Shared types ──────────────────────────────────────────────────────────────

type DashboardMode = "cafeteria" | "timetable";

// ── Cafeteria types ───────────────────────────────────────────────────────────

type BhawanName =
  | "Rajendra" | "Cautley" | "Radhakrishnan" | "Govind" | "Jawahar"
  | "Rajiv" | "Azad" | "Ravindra" | "Ganga" | "Himalaya"
  | "Arawali" | "Sarojini" | "Kasturba" | "EWS"
  | "CBRI_Canteen" | "Green_Gala_Cafe" | "CCD" | "Amul_Parlour_MAC";

type CafeteriaViewType = "mess" | "day-canteen" | "night-canteen" | "canteen";

interface CafeteriaTab {
  id:          CafeteriaViewType;
  label:       string;
  emoji:       string;
  apiViewType: "Mess" | "Day" | "Night";
}

// ── Timetable types ───────────────────────────────────────────────────────────

type Department =
  | "PI" | "CSE" | "ECE" | "EE" | "ME" | "CE" | "CH"
  | "META" | "EPH" | "MNC" | "DSAI" | "GT" | "GPT" | "ARCHI" | "BSBE";

type AcademicYear = "1st" | "2nd" | "3rd" | "4th" | "5th";

type WeekDay = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";

// ── Constants ─────────────────────────────────────────────────────────────────

const CAFETERIA_LOCATIONS: BhawanName[] = [
  "Rajendra", "Cautley", "Radhakrishnan", "Govind", "Jawahar",
  "Rajiv", "Azad", "Ravindra", "Ganga", "Himalaya",
  "Arawali", "Sarojini", "Kasturba", "EWS",
  "CBRI_Canteen", "Green_Gala_Cafe", "CCD", "Amul_Parlour_MAC",
];

/** Independent commercial outlets — single unified "Canteen Menu", no mess / Day-Night split. */
const COMMERCIAL_LOCATIONS = new Set<BhawanName>([
  "CBRI_Canteen", "Green_Gala_Cafe", "CCD", "Amul_Parlour_MAC",
]);

const CAFETERIA_TABS: CafeteriaTab[] = [
  { id: "mess",          label: "Mess Menu",     emoji: "🍱", apiViewType: "Mess"  },
  { id: "day-canteen",   label: "Day Canteen",   emoji: "☀️",  apiViewType: "Day"   },
  { id: "night-canteen", label: "Night Canteen", emoji: "🌙", apiViewType: "Night" },
  { id: "canteen",       label: "Canteen Menu",  emoji: "🏪", apiViewType: "Day"   },
];

const DEPARTMENTS: { code: Department; label: string }[] = ([
  { code: "PI",   label: "Production & Industrial Engineering (PI)" },
  { code: "CSE",  label: "Computer Science (CSE)" },
  { code: "ECE",  label: "Electronics & Communication Engineering (ECE)" },
  { code: "EE",   label: "Electrical Engineering (EE)" },
  { code: "ME",   label: "Mechanical Engineering (ME)" },
  { code: "CE",   label: "Civil Engineering (CE)" },
  { code: "CH",   label: "Chemical Engineering (CH)" },
  { code: "META", label: "Metallurgical & Materials Engineering (META)" },
  { code: "EPH",  label: "Engineering Physics (EPH)" },
  { code: "MNC",  label: "Mathematics & Computing (MNC)" },
  { code: "DSAI", label: "Data Science & AI (DSAI)" },
  { code: "GT",   label: "Geological Technology (GT)" },
  { code: "GPT",  label: "Geophysical Technology (GPT)" },
  { code: "ARCHI", label: "Architecture (ARCHI)" },
  { code: "BSBE", label: "Biotech & Biosystems (BSBE)" },
] satisfies { code: Department; label: string }[]).sort((a, b) =>
  a.label.localeCompare(b.label)
);

/** Branches that run a 5-year track; everyone else is capped at 4 years. */
const FIVE_YEAR_DEPARTMENTS = new Set<Department>(["ARCHI"]);

function yearsForDept(dept: Department): AcademicYear[] {
  return FIVE_YEAR_DEPARTMENTS.has(dept)
    ? ["1st", "2nd", "3rd", "4th", "5th"]
    : ["1st", "2nd", "3rd", "4th"];
}

const WEEK_DAYS: WeekDay[] = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function displayBhawan(name: BhawanName): string {
  return name.replace(/_/g, " ");
}

function isCommercialLocation(name: BhawanName): boolean {
  return COMMERCIAL_LOCATIONS.has(name);
}

/** Tabs a given location should expose: commercial → unified canteen; EWS → mess only; bhawans → mess + Day/Night. */
function tabsForLocation(name: BhawanName): CafeteriaTab[] {
  if (isCommercialLocation(name)) return CAFETERIA_TABS.filter((t) => t.id === "canteen");
  if (name === "EWS")             return CAFETERIA_TABS.filter((t) => t.id === "mess");
  return CAFETERIA_TABS.filter((t) => t.id !== "canteen");
}

function defaultViewForLocation(name: BhawanName): CafeteriaViewType {
  return isCommercialLocation(name) ? "canteen" : "mess";
}

function locationIcon(name: BhawanName): string {
  if (name === "CCD")              return "☕";
  if (name === "Green_Gala_Cafe")  return "🥤";
  if (name === "Amul_Parlour_MAC") return "🍦";
  if (name === "CBRI_Canteen")     return "🏪";
  if (name === "EWS")              return "🏠";
  if (name === "Sarojini" || name === "Kasturba") return "🌸";
  return "🏢";
}

function todayWeekDay(): WeekDay {
  const js = new Date().getDay(); // 0=Sun … 6=Sat
  const idx = js === 0 || js === 6 ? 0 : js - 1; // clamp weekends to Monday
  return WEEK_DAYS[idx];
}

function defaultBatch(dept: Department, year: AcademicYear): string {
  return `${dept}${year.replace(/\D/g, "")}`;
}

// ── AI navigation commands ────────────────────────────────────────────────────
//
// The Gemini assistant appends a machine-readable `[[NAVIGATE: {…}]]` block to
// its reply whenever it has resolved the user's intent to a concrete view. We
// parse that block out of the visible bubble entirely and turn it into a single
// tappable button that drives the dashboard's existing state setters — so the
// model never has to fabricate data; it just routes the user to the live panel.

type NavCommand =
  | { type: "timetable"; department: Department; year: AcademicYear; day: WeekDay }
  | { type: "cafeteria"; location: BhawanName; subView: CafeteriaViewType };

interface ParsedAssistantMessage {
  /** Visible reply with the raw NAVIGATE block stripped out. */
  text:    string;
  /** Resolved navigation target, or null if absent/malformed. */
  command: NavCommand | null;
}

// Matches `[[NAVIGATE: { …flat json… }]]`. The JSON we emit is always a flat
// object, so a non-greedy `{…}` without brace nesting is sufficient and safe.
const NAV_PATTERN = /\[\[NAVIGATE:\s*(\{[^{}]*\})\s*\]\]/i;

const DEPARTMENT_CODES = new Set<string>(DEPARTMENTS.map((d) => d.code));

const YEAR_BY_DIGIT: Record<string, AcademicYear> = {
  "1": "1st", "2": "2nd", "3": "3rd", "4": "4th", "5": "5th",
};

// "Mess Menu" / "Mess" → internal view ids; tolerant of the labels the model emits.
const SUBVIEW_BY_LABEL: Record<string, CafeteriaViewType> = {
  "mess menu": "mess",          "mess": "mess",
  "day canteen": "day-canteen", "day": "day-canteen",
  "night canteen": "night-canteen", "night": "night-canteen",
  "canteen menu": "canteen",    "canteen": "canteen",
};

function normalizeDepartment(raw: unknown): Department | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  return DEPARTMENT_CODES.has(code) ? (code as Department) : null;
}

function normalizeYear(raw: unknown): AcademicYear | null {
  if (typeof raw !== "string") return null;
  const digit = raw.match(/[1-5]/)?.[0];
  return digit ? (YEAR_BY_DIGIT[digit] ?? null) : null;
}

function normalizeDay(raw: unknown): WeekDay | null {
  if (typeof raw !== "string") return null;
  return WEEK_DAYS.find((d) => d.toLowerCase() === raw.trim().toLowerCase()) ?? null;
}

function normalizeLocation(raw: unknown): BhawanName | null {
  if (typeof raw !== "string") return null;
  // The model uses human spacing ("CBRI Canteen"); our ids use underscores.
  const id = raw.trim().replace(/\s+/g, "_");
  return (CAFETERIA_LOCATIONS as string[]).includes(id) ? (id as BhawanName) : null;
}

function normalizeSubView(raw: unknown): CafeteriaViewType | null {
  if (typeof raw !== "string") return null;
  return SUBVIEW_BY_LABEL[raw.trim().toLowerCase()] ?? null;
}

function parseAssistantMessage(raw: string): ParsedAssistantMessage {
  const match = raw.match(NAV_PATTERN);
  if (!match) return { text: raw, command: null };

  // Strip the command — plus any stray code fence the model wrapped it in — so
  // the user never sees raw JSON, then tidy up the whitespace it leaves behind.
  const text = raw
    .replace(NAV_PATTERN, "")
    .replace(/```(?:json)?\s*```/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  let command: NavCommand | null = null;
  try {
    const obj = JSON.parse(match[1]) as Record<string, unknown>;
    if (obj.type === "timetable") {
      const department = normalizeDepartment(obj.department);
      const year       = normalizeYear(obj.year);
      const day        = normalizeDay(obj.day);
      if (department && year && day) command = { type: "timetable", department, year, day };
    } else if (obj.type === "cafeteria") {
      const location = normalizeLocation(obj.location);
      const subView  = normalizeSubView(obj.subView);
      if (location && subView) command = { type: "cafeteria", location, subView };
    }
  } catch {
    command = null; // malformed JSON → fall back to a plain bubble, no button
  }

  return { text, command };
}

function navButtonContent(cmd: NavCommand): { icon: string; label: string } {
  if (cmd.type === "timetable") {
    return { icon: "📅", label: `Open ${cmd.department} ${cmd.year} Year Timetable (${cmd.day})` };
  }
  const tab = CAFETERIA_TABS.find((t) => t.id === cmd.subView);
  return {
    icon:  tab?.emoji ?? "🍽️",
    label: `Go to ${displayBhawan(cmd.location)} ${tab?.label ?? "Menu"}`,
  };
}

function NavButton(
  { command, onNavigate }: { command: NavCommand; onNavigate: (cmd: NavCommand) => void },
) {
  const { icon, label } = navButtonContent(command);
  return (
    <button
      onClick={() => onNavigate(command)}
      className="group mt-3 flex w-full items-center gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-left text-sm font-bold text-amber-300 outline-none transition hover:border-amber-400 hover:bg-amber-500/20 hover:text-amber-200 focus-visible:ring-2 focus-visible:ring-amber-500"
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="flex-1 leading-snug">{label}</span>
      <span className="text-amber-400/70 transition group-hover:translate-x-0.5">→</span>
    </button>
  );
}

// ── Inline Markdown renderer ──────────────────────────────────────────────────

function MdTable({ lines }: { lines: string[] }) {
  const parseRow = (line: string): string[] =>
    line.split("|").slice(1, -1).map((cell) => cell.trim());

  const dataRows = lines.filter((l) => !/^\|[\s\-|:]+\|$/.test(l));
  if (dataRows.length === 0) return null;

  const [headerRow, ...bodyRows] = dataRows;
  const headers = parseRow(headerRow);
  const body    = bodyRows.map(parseRow);

  return (
    <div className="my-3 overflow-x-auto rounded-lg border border-slate-700/50">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-700/60 bg-slate-800/60">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-400"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr
              key={ri}
              className="border-b border-slate-800/40 transition hover:bg-slate-800/30"
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={
                    ci === row.length - 1
                      ? "px-4 py-2 text-right font-semibold text-amber-400"
                      : "px-4 py-2 text-slate-300"
                  }
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Render inline `**bold**` spans; plain text passes through unchanged. */
function renderInline(text: string, keyBase: number): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    /^\*\*[^*]+\*\*$/.test(part) ? (
      <strong key={`${keyBase}-${i}`} className="font-semibold text-slate-200">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={`${keyBase}-${i}`}>{part}</span>
    )
  );
}

function MarkdownRenderer({ text }: { text: string }) {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let k = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      nodes.push(
        <h2 key={k++} className="mb-4 mt-1 text-xl font-bold text-white">
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      nodes.push(
        <h3
          key={k++}
          className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-amber-400"
        >
          {line.slice(4)}
        </h3>
      );
      i++;
      continue;
    }

    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      nodes.push(<MdTable key={k++} lines={tableLines} />);
      continue;
    }

    if (/^\s*- /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*- /.test(lines[i])) {
        items.push(lines[i].replace(/^\s*- /, ""));
        i++;
      }
      nodes.push(
        <ul key={k++} className="mb-3 flex flex-col gap-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-center gap-2.5 text-sm text-slate-300">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/60" />
              <span>{renderInline(item, j)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (line.trim()) {
      nodes.push(
        <p key={k++} className="mb-2 text-sm leading-relaxed text-slate-400">
          {renderInline(line, k)}
        </p>
      );
    }

    i++;
  }

  return <div className="w-full">{nodes}</div>;
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-6 w-56 rounded-lg bg-slate-800" />
      <div className="h-3 w-32 rounded bg-slate-800/70" />
      <div className="mt-5 space-y-2">
        {[100, 85, 92, 78, 88, 70].map((w, i) => (
          <div key={i} className="h-3 rounded bg-slate-800/60" style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {[95, 80, 88].map((w, i) => (
          <div key={i} className="h-3 rounded bg-slate-800/50" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

// ── Error card ────────────────────────────────────────────────────────────────

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-5">
      <div className="flex items-center gap-2">
        <span className="text-lg">⚠️</span>
        <span className="text-sm font-semibold text-red-400">Failed to load data</span>
      </div>
      <p className="font-mono text-xs text-red-400/70">{message}</p>
    </div>
  );
}

// ── Cafeteria Panel ───────────────────────────────────────────────────────────

function CafeteriaPanel(
  { location, view, onLocationChange, onViewChange }: {
    location:         BhawanName;
    view:             CafeteriaViewType;
    onLocationChange: (loc: BhawanName) => void;
    onViewChange:     (view: CafeteriaViewType) => void;
  },
) {
  const [content,        setContent]        = useState<string | null>(null);
  const [isLoading,      setIsLoading]      = useState(false);
  const [fetchError,     setFetchError]     = useState<string | null>(null);

  const availableTabs = tabsForLocation(location);
  const activeTab =
    availableTabs.find((t) => t.id === view) ?? availableTabs[0];

  // Switching location auto-selects the right default sub-tab:
  // standard bhawans → Mess Menu; commercial outlets → unified Canteen Menu.
  function handleLocationChange(loc: BhawanName): void {
    onLocationChange(loc);
    onViewChange(defaultViewForLocation(loc));
  }

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setContent(null);
    setFetchError(null);

    fetch("/api/cafeteria", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, viewType: activeTab.apiViewType }),
    })
      .then((res) => res.json())
      .then((data: { text?: string; error?: string }) => {
        if (cancelled) return;
        data.error ? setFetchError(data.error) : setContent(data.text ?? null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setFetchError(err instanceof Error ? err.message : "Failed to reach server");
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [location, view, activeTab.apiViewType]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Location sidebar + content split */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">

        {/* Sidebar */}
        <aside className="shrink-0 border-b border-slate-800 bg-slate-900 lg:w-56 lg:border-b-0 lg:border-r">
          <div className="p-4">
            <p className="mb-3 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">
              Campus Locations
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-x-visible lg:pb-0">
              {CAFETERIA_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleLocationChange(loc)}
                  className={[
                    "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-left outline-none transition",
                    "focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900",
                    location === loc
                      ? "bg-amber-500 text-slate-950"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
                  ].join(" ")}
                >
                  <span className="text-base leading-none">{locationIcon(loc)}</span>
                  <span className="leading-none">{displayBhawan(loc)}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* View tabs */}
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-900/50 px-5 py-3">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onViewChange(tab.id)}
                className={[
                  "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition",
                  "outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                  view === tab.id
                    ? "bg-amber-500 text-slate-950 shadow shadow-amber-900/40"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-100",
                ].join(" ")}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 lg:p-7">
            <div className="mb-5 flex items-center gap-1.5 text-xs text-slate-600">
              <span>IIT Roorkee</span>
              <span>›</span>
              <span className="text-slate-400">{displayBhawan(location)}</span>
              <span>›</span>
              <span className="font-medium text-amber-500">{activeTab.label}</span>
            </div>
            <div className="min-h-48 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 lg:p-6">
              {isLoading && <LoadingSkeleton />}
              {!isLoading && fetchError && <ErrorCard message={fetchError} />}
              {!isLoading && !fetchError && content && (
                activeTab.id === "mess"
                  ? <MarkdownRenderer text={content} />
                  : <CanteenMenu text={content} />
              )}
            </div>
            <p className="mt-4 text-center text-[11px] text-slate-700">
              Live data via MCP · IIT Roorkee Cafeteria Server v2.0.0
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Timetable Panel ───────────────────────────────────────────────────────────

function TimetablePanel(
  { department, academicYear, batchSection, activeDay,
    onDepartmentChange, onYearChange, onBatchChange, onDayChange }: {
    department:         Department;
    academicYear:       AcademicYear;
    batchSection:       string;
    activeDay:          WeekDay;
    onDepartmentChange: (d: Department) => void;
    onYearChange:       (y: AcademicYear) => void;
    onBatchChange:      (b: string) => void;
    onDayChange:        (d: WeekDay) => void;
  },
) {
  const [content,       setContent]       = useState<string | null>(null);
  const [isLoading,     setIsLoading]     = useState(false);
  const [fetchError,    setFetchError]    = useState<string | null>(null);

  // Keep batchSection in sync when department/year changes
  useEffect(() => {
    onBatchChange(defaultBatch(department, academicYear));
  }, [department, academicYear]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setContent(null);
    setFetchError(null);

    fetch("/api/timetable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ department, academicYear, batchSection, day: activeDay }),
    })
      .then((res) => res.json())
      .then((data: { text?: string; error?: string }) => {
        if (cancelled) return;
        data.error ? setFetchError(data.error) : setContent(data.text ?? null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setFetchError(err instanceof Error ? err.message : "Failed to reach server");
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [department, academicYear, batchSection, activeDay]);

  const deptLabel = DEPARTMENTS.find((d) => d.code === department)?.label ?? department;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">

      {/* Controls bar */}
      <div className="shrink-0 border-b border-slate-800 bg-slate-900/70 px-5 py-4">
        <div className="flex flex-wrap items-end gap-4">

          {/* Department */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => {
                const next = e.target.value as Department;
                onDepartmentChange(next);
                // Switching to a 4-year branch while sitting on 5th Year → reset gracefully.
                if (!yearsForDept(next).includes(academicYear)) {
                  onYearChange("1st");
                }
              }}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d.code} value={d.code}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Academic Year */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
              Year
            </label>
            <select
              value={academicYear}
              onChange={(e) => onYearChange(e.target.value as AcademicYear)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            >
              {yearsForDept(department).map((y) => (
                <option key={y} value={y}>{y} Year</option>
              ))}
            </select>
          </div>

          {/* Batch / Section */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
              Batch / Section
            </label>
            <input
              type="text"
              value={batchSection}
              onChange={(e) => onBatchChange(e.target.value)}
              placeholder="e.g. CSE1"
              className="w-28 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Day tabs */}
        <div className="mt-3 flex gap-1.5">
          {WEEK_DAYS.map((d) => (
            <button
              key={d}
              onClick={() => onDayChange(d)}
              className={[
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition outline-none",
                "focus-visible:ring-2 focus-visible:ring-amber-500",
                activeDay === d
                  ? "bg-amber-500 text-slate-950 shadow shadow-amber-900/40"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-100",
              ].join(" ")}
            >
              {d.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 lg:p-7">
        <div className="mb-5 flex items-center gap-1.5 text-xs text-slate-600">
          <span>IIT Roorkee</span>
          <span>›</span>
          <span className="text-slate-400">{deptLabel}</span>
          <span>›</span>
          <span className="text-slate-400">{academicYear} Year</span>
          <span>›</span>
          <span className="font-medium text-amber-500">{activeDay}</span>
        </div>

        <div className="min-h-48 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 lg:p-6">
          {isLoading && <LoadingSkeleton />}
          {!isLoading && fetchError && <ErrorCard message={fetchError} />}
          {!isLoading && !fetchError && content && <MarkdownRenderer text={content} />}
        </div>
        <p className="mt-4 text-center text-[11px] text-slate-700">
          Live data via MCP · IIT Roorkee Timetable Server v1.0.0
        </p>
      </div>
    </div>
  );
}

// ── Campus AI Assistant ───────────────────────────────────────────────────────
//
// A true conversational assistant backed by the Gemini API. The drawer holds the
// full message history and POSTs it — together with a live dashboard snapshot —
// to our /api/chat route on every turn. The model therefore has real multi-turn
// memory and can ask its own clarifying questions, replacing the old hardcoded
// client-side keyword router entirely.

interface ChatMessage {
  id:       number;
  role:     "user" | "assistant";
  text:     string;
  pending?: boolean; // true while the Gemini round-trip is in flight
}

// Live snapshot of what the user currently has selected on the dashboard. Sent
// to /api/chat with every turn so the model can ground vague questions ("my
// classes") in the view the user is actually looking at.
interface DashboardSnapshot {
  mode: DashboardMode;
  cafeteria: { location: BhawanName; view: CafeteriaViewType };
  timetable: {
    department:   Department;
    academicYear: AcademicYear;
    batchSection: string;
    day:          WeekDay;
  };
}

// ── Assistant UI ─────────────────────────────────────────────────────────────

const ASSISTANT_SUGGESTIONS: string[] = [
  "Tell me about my classes",
  "What's good to eat tonight?",
  "When is my next lab?",
  "Help me plan my day",
];

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-500/70"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

function AssistantBubble(
  { message, onNavigate }: { message: ChatMessage; onNavigate: (cmd: NavCommand) => void },
) {
  if (message.pending) {
    return (
      <div className="flex flex-col gap-2">
        <div className="rounded-2xl rounded-tl-sm border border-slate-800 bg-slate-800/40 px-4 py-3">
          <ThinkingDots />
        </div>
      </div>
    );
  }

  // Strip the AI's `[[NAVIGATE: …]]` block out of the visible text and, when one
  // is present, render a live navigation button at the bottom of this bubble.
  const { text, command } = parseAssistantMessage(message.text);

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-2xl rounded-tl-sm border border-slate-800 bg-slate-800/40 px-4 py-3">
        <MarkdownRenderer text={text} />
        {command && <NavButton command={command} onNavigate={onNavigate} />}
      </div>
    </div>
  );
}

function AssistantDrawer(
  { open, onClose, snapshot, onNavigate }: {
    open: boolean;
    onClose: () => void;
    snapshot: DashboardSnapshot;
    onNavigate: (cmd: NavCommand) => void;
  },
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input,    setInput]    = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const idRef     = useRef(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const nextId    = (): number => (idRef.current += 1);

  // Keep the latest turn in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function submitQuery(raw: string): Promise<void> {
    const text = raw.trim();
    if (!text || isThinking) return;

    setInput("");

    // Build the full history (including this new user turn) up front so we can
    // both render it and ship it to the model as multi-turn context.
    const userMsg: ChatMessage = { id: nextId(), role: "user", text };
    const history = [...messages, userMsg];
    const pendingId = nextId();

    setMessages([...history, { id: pendingId, role: "assistant", text: "", pending: true }]);
    setIsThinking(true);

    try {
      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          messages: history.map((m) => ({ role: m.role, text: m.text })),
          dashboardSnapshot: snapshot,
        }),
      });
      const data: { text?: string; error?: string } = await res.json();
      const answer = data.error
        ? `⚠️ ${data.error}`
        : (data.text ?? "_The assistant returned no response._");
      setMessages((prev) =>
        prev.map((m) => (m.id === pendingId ? { ...m, text: answer, pending: false } : m))
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? { ...m, text: `⚠️ Could not reach the assistant: ${message}`, pending: false }
            : m
        )
      );
    } finally {
      setIsThinking(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={[
          "fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        aria-hidden={!open}
      />

      {/* Drawer */}
      <aside
        className={[
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-800 bg-slate-900 shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-label="Campus AI Assistant"
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/15 text-lg">🤖</span>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">Campus AI Assistant</span>
              <span className="text-[11px] text-slate-500">Conversational · powered by Gemini</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close assistant"
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-800 hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            ✕
          </button>
        </div>

        {/* Holographic AI orb — reflects the live Gemini request lifecycle. */}
        <div className="shrink-0 border-b border-slate-800/60 bg-slate-950/40 px-5 py-3">
          <AIOrb isThinking={isThinking} />
        </div>

        {/* Conversation history */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm leading-relaxed text-slate-400">
                Hi! 👋 I&apos;m your <span className="font-semibold text-amber-400">Campus AI Assistant</span>.
                Ask me about <span className="font-semibold text-amber-400">campus food</span> or your{" "}
                <span className="font-semibold text-sky-400">class timetable</span> — I remember the
                conversation, so we can go back and forth until we get it right.
              </p>
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Try asking</p>
                {ASSISTANT_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => submitQuery(s)}
                    className="rounded-xl border border-slate-800 bg-slate-800/40 px-3.5 py-2.5 text-left text-sm text-slate-300 outline-none transition hover:border-amber-500/40 hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-amber-500 px-4 py-2.5 text-sm font-medium text-slate-950">
                    {m.text}
                  </div>
                </div>
              ) : (
                <AssistantBubble key={m.id} message={m} onNavigate={onNavigate} />
              )
            )
          )}
        </div>

        {/* Input line */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submitQuery(input);
          }}
          className="flex shrink-0 items-center gap-2 border-t border-slate-800 p-4"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about food or your classes…"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            aria-label="Send"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500 text-slate-950 outline-none transition hover:bg-amber-400 focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ➤
          </button>
        </form>
      </aside>
    </>
  );
}

function AssistantLauncher({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={open ? "Close Campus AI Assistant" : "Open Campus AI Assistant"}
      className={[
        "fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-amber-500 px-5 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-900/40 outline-none transition hover:bg-amber-400 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        open ? "pointer-events-none scale-90 opacity-0" : "scale-100 opacity-100",
      ].join(" ")}
    >
      <span className="text-lg leading-none">🤖</span>
      <span>Ask Campus AI</span>
    </button>
  );
}

// ── Canteen menu (animated item cards) ──────────────────────────────────────
//
// Day / Night / commercial canteen menus arrive from MCP as a markdown price
// table (`| Item Name | Price (₹) |`). Unlike the static mess list, every
// canteen item is rendered as its own card that smoothly pops toward the cursor
// on hover — a crisp, item-level interaction that stays buttery while scrolling.
// The mess menu deliberately does NOT use this; it keeps the plain Markdown list.

/** Tight, snappy spring so each item reacts instantly without floaty overshoot. */
const CANTEEN_ITEM_SPRING = {
  type: "spring", stiffness: 400, damping: 30, mass: 0.6,
} as const;

interface CanteenItem {
  name:  string;
  price: string;
}

/** Pull the `## Title` heading and the price-table rows out of the menu markdown. */
function parseCanteenContent(text: string): { title: string | null; items: CanteenItem[] } {
  let title: string | null = null;
  const items: CanteenItem[] = [];

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("## ")) { title = line.slice(3); continue; }
    if (!line.startsWith("|")) continue;
    if (/^\|[\s\-|:]+\|$/.test(line)) continue;            // separator row
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 2) continue;
    const [name, price] = cells;
    if (name.toLowerCase() === "item name") continue;       // header row
    items.push({ name, price });
  }

  return { title, items };
}

function CanteenMenu({ text }: { text: string }) {
  const { title, items } = parseCanteenContent(text);

  // If the payload isn't the expected price table, fall back to plain markdown
  // so we never drop content on the floor.
  if (items.length === 0) return <MarkdownRenderer text={text} />;

  return (
    <div className="w-full">
      {title && (
        <h2 className="mb-4 mt-1 text-xl font-bold text-white">{title}</h2>
      )}
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02, x: 6 }}
            transition={CANTEEN_ITEM_SPRING}
            className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 transition-colors hover:border-amber-500/40 hover:bg-amber-500/10 hover:shadow-lg hover:shadow-amber-900/20"
          >
            <span className="text-sm font-medium text-slate-200">
              {renderInline(item.name, i)}
            </span>
            <span className="shrink-0 text-sm font-bold text-amber-400">
              ₹{item.price}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Root Page ─────────────────────────────────────────────────────────────────

export default function Page() {
  const [mode, setMode] = useState<DashboardMode>("cafeteria");
  const [assistantOpen, setAssistantOpen] = useState(false);

  // Dashboard selection is lifted here so the AI assistant can read the user's
  // live choices (and so they survive switching between the two dashboards).
  const [cafLocation, setCafLocation] = useState<BhawanName>("Rajendra");
  const [cafView,     setCafView]     = useState<CafeteriaViewType>("mess");
  const [department,   setDepartment]   = useState<Department>("PI");
  const [academicYear, setAcademicYear] = useState<AcademicYear>("1st");
  const [batchSection, setBatchSection] = useState<string>("PI1");
  const [activeDay,    setActiveDay]    = useState<WeekDay>(todayWeekDay);

  const snapshot: DashboardSnapshot = {
    mode,
    cafeteria: { location: cafLocation, view: cafView },
    timetable: { department, academicYear, batchSection, day: activeDay },
  };

  // Drive the dashboard straight from an AI navigation button: flip to the right
  // panel, sync every selector, and let the panel's own effect refetch live MCP
  // data. Closing the drawer reveals the freshly-loaded view behind it.
  function handleNavigate(cmd: NavCommand): void {
    if (cmd.type === "timetable") {
      setMode("timetable");
      setDepartment(cmd.department);
      // Guard against a 4-year branch being handed a 5th-year target.
      setAcademicYear(yearsForDept(cmd.department).includes(cmd.year) ? cmd.year : "1st");
      setActiveDay(cmd.day);
      // batchSection re-syncs automatically via TimetablePanel's dept/year effect.
    } else {
      setMode("cafeteria");
      setCafLocation(cmd.location);
      setCafView(cmd.subView);
    }
    setAssistantOpen(false);
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">

      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-5">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🏛️</span>
          <span className="text-sm font-bold tracking-tight text-white">
            IITR Campus Intelligence
          </span>
          <span className="hidden text-xs text-slate-600 sm:inline">·</span>
          <span className="hidden text-xs text-slate-500 sm:inline">Unified Dashboard</span>
        </div>
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400">
          Beta
        </span>
      </header>

      {/* Dashboard toggle */}
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-800/80 bg-slate-900 px-5 py-2.5">
        <button
          onClick={() => setMode("cafeteria")}
          className={[
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition outline-none",
            "focus-visible:ring-2 focus-visible:ring-amber-500",
            mode === "cafeteria"
              ? "bg-slate-700 text-white"
              : "text-slate-500 hover:text-slate-300",
          ].join(" ")}
        >
          <span>🍴</span>
          <span>Campus Cafeteria</span>
        </button>
        <button
          onClick={() => setMode("timetable")}
          className={[
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition outline-none",
            "focus-visible:ring-2 focus-visible:ring-amber-500",
            mode === "timetable"
              ? "bg-slate-700 text-white"
              : "text-slate-500 hover:text-slate-300",
          ].join(" ")}
        >
          <span>📅</span>
          <span>Academic Timetable</span>
        </button>
      </div>

      {/* Active panel — the master layout stays perfectly flat and locked; only
          the individual content cards inside each panel tilt toward the cursor. */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {mode === "cafeteria" ? (
          <CafeteriaPanel
            location={cafLocation}
            view={cafView}
            onLocationChange={setCafLocation}
            onViewChange={setCafView}
          />
        ) : (
          <TimetablePanel
            department={department}
            academicYear={academicYear}
            batchSection={batchSection}
            activeDay={activeDay}
            onDepartmentChange={setDepartment}
            onYearChange={setAcademicYear}
            onBatchChange={setBatchSection}
            onDayChange={setActiveDay}
          />
        )}
      </div>

      {/* Campus AI Assistant — always available across both dashboards */}
      <AssistantLauncher open={assistantOpen} onClick={() => setAssistantOpen(true)} />
      <AssistantDrawer
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        snapshot={snapshot}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
