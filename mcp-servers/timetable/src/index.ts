import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ── Enums (runtime arrays drive both Zod and the type system) ────────────────

const DEPARTMENTS = [
  "PI", "CSE", "ECE", "EE", "ME", "CE", "CH",
  "META", "EPH", "MNC", "DSAI", "GT", "GPT", "ARCHI", "BSBE",
] as const;

const ACADEMIC_YEARS = ["1st", "2nd", "3rd", "4th", "5th"] as const;

const DAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
] as const;

type Department   = (typeof DEPARTMENTS)[number];
type AcademicYear = (typeof ACADEMIC_YEARS)[number];
type Day          = (typeof DAYS)[number];

// ── Core data types ───────────────────────────────────────────────────────────

interface ClassEntry {
  timeSlot:    string;
  courseCode:  string;
  courseTitle: string;
  venue:       string;
}

type DaySchedule  = ClassEntry[];
type WeekSchedule = Record<Day, DaySchedule>;

// ── Timetable store — keyed by "DEPT_YEAR" ────────────────────────────────────
//
//  Keys: "CSE_1st", "ME_2nd", etc.
//  Lookup falls back from "DEPT_YEAR_BATCH" → "DEPT_YEAR" → not-found message.

const TIMETABLE: Record<string, WeekSchedule> = {

  // ── CSE — 1st Year ────────────────────────────────────────────────────────
  CSE_1st: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "10:30 – 11:25", courseCode: "CS-101",  courseTitle: "Fundamentals of Programming",      venue: "LHC-101" },
      { timeSlot: "11:30 – 12:25", courseCode: "HSN-101", courseTitle: "Technical Communication",          venue: "LHC-201" },
      { timeSlot: "14:00 – 14:55", courseCode: "CYN-001", courseTitle: "Chemistry I",                      venue: "LHC-302" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CYN-001", courseTitle: "Chemistry I",                      venue: "LHC-401" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "MEN-101", courseTitle: "Engineering Drawing",              venue: "Drawing Hall-1" },
      { timeSlot: "14:00 – 15:55", courseCode: "PHN-Lab", courseTitle: "Physics Lab I",                    venue: "PHN Lab Block-I" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "09:30 – 10:25", courseCode: "CS-101",  courseTitle: "Fundamentals of Programming",      venue: "LHC-101" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "11:30 – 12:25", courseCode: "HSN-101", courseTitle: "Technical Communication",          venue: "LHC-201" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "CYN-001", courseTitle: "Chemistry I",                      venue: "LHC-401" },
      { timeSlot: "10:30 – 11:25", courseCode: "CS-101",  courseTitle: "Fundamentals of Programming",      venue: "LHC-101" },
      { timeSlot: "14:00 – 15:55", courseCode: "CS-Lab1", courseTitle: "Programming Lab",                  venue: "CS Lab-I" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "MEN-101", courseTitle: "Engineering Drawing",              venue: "Drawing Hall-1" },
      { timeSlot: "14:00 – 15:55", courseCode: "INN-101", courseTitle: "Engineering Workshop",             venue: "Central Workshop" },
    ],
  },

  // ── CSE — 2nd Year ────────────────────────────────────────────────────────
  CSE_2nd: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "CS-201",  courseTitle: "Data Structures & Algorithms",    venue: "CSE-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "CS-202",  courseTitle: "Discrete Mathematics",             venue: "LHC-201" },
      { timeSlot: "11:30 – 12:25", courseCode: "EE-201",  courseTitle: "Basic Electrical Engineering",    venue: "LHC-101" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CS-201",  courseTitle: "Data Structures & Algorithms",    venue: "CSE-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "CS-203",  courseTitle: "Computer Organisation",            venue: "CSE-LT2" },
      { timeSlot: "14:00 – 15:55", courseCode: "CS-Lab2", courseTitle: "Data Structures Lab",              venue: "CS Lab-II" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "EE-201",  courseTitle: "Basic Electrical Engineering",    venue: "LHC-101" },
      { timeSlot: "09:30 – 10:25", courseCode: "CS-202",  courseTitle: "Discrete Mathematics",             venue: "LHC-201" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "11:30 – 12:25", courseCode: "CS-203",  courseTitle: "Computer Organisation",            venue: "CSE-LT2" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CS-201",  courseTitle: "Data Structures & Algorithms",    venue: "CSE-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "EE-201",  courseTitle: "Basic Electrical Engineering",    venue: "LHC-101" },
      { timeSlot: "14:00 – 15:55", courseCode: "EE-Lab1", courseTitle: "Electrical Engineering Lab",       venue: "EE Lab-I" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CS-202",  courseTitle: "Discrete Mathematics",             venue: "LHC-201" },
      { timeSlot: "09:30 – 10:25", courseCode: "CS-203",  courseTitle: "Computer Organisation",            venue: "CSE-LT2" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "11:30 – 12:25", courseCode: "EE-201",  courseTitle: "Basic Electrical Engineering",    venue: "LHC-101" },
    ],
  },

  // ── CSE — 3rd Year ────────────────────────────────────────────────────────
  CSE_3rd: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CS-301",  courseTitle: "Design & Analysis of Algorithms", venue: "CSE-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "CS-302",  courseTitle: "Operating Systems",                venue: "CSE-LT2" },
      { timeSlot: "10:30 – 11:25", courseCode: "CS-303",  courseTitle: "Database Management Systems",      venue: "LHC-201" },
      { timeSlot: "11:30 – 12:25", courseCode: "CS-304",  courseTitle: "Computer Networks",                venue: "CSE-LT1" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CS-305",  courseTitle: "Theory of Computation",            venue: "LHC-201" },
      { timeSlot: "09:30 – 10:25", courseCode: "CS-301",  courseTitle: "Design & Analysis of Algorithms", venue: "CSE-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "CS-302",  courseTitle: "Operating Systems",                venue: "CSE-LT2" },
      { timeSlot: "14:00 – 15:55", courseCode: "CS-Lab3", courseTitle: "OS & Networks Lab",                venue: "CS Lab-III" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CS-303",  courseTitle: "Database Management Systems",      venue: "LHC-201" },
      { timeSlot: "09:30 – 10:25", courseCode: "CS-304",  courseTitle: "Computer Networks",                venue: "CSE-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "CS-305",  courseTitle: "Theory of Computation",            venue: "LHC-201" },
      { timeSlot: "11:30 – 12:25", courseCode: "CS-301",  courseTitle: "Design & Analysis of Algorithms", venue: "CSE-LT1" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CS-302",  courseTitle: "Operating Systems",                venue: "CSE-LT2" },
      { timeSlot: "09:30 – 10:25", courseCode: "CS-303",  courseTitle: "Database Management Systems",      venue: "LHC-201" },
      { timeSlot: "14:00 – 15:55", courseCode: "CS-Lab4", courseTitle: "DBMS Lab",                         venue: "CS Lab-II" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CS-304",  courseTitle: "Computer Networks",                venue: "CSE-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "CS-305",  courseTitle: "Theory of Computation",            venue: "LHC-201" },
      { timeSlot: "10:30 – 11:25", courseCode: "CS-301",  courseTitle: "Design & Analysis of Algorithms", venue: "CSE-LT1" },
      { timeSlot: "11:30 – 12:25", courseCode: "CS-302",  courseTitle: "Operating Systems",                venue: "CSE-LT2" },
    ],
  },

  // ── CSE — 4th Year ────────────────────────────────────────────────────────
  CSE_4th: {
    Monday: [
      { timeSlot: "09:30 – 10:25", courseCode: "CS-401",  courseTitle: "Machine Learning",                 venue: "CSE-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "CS-402",  courseTitle: "Compiler Design",                  venue: "CSE-LT2" },
      { timeSlot: "11:30 – 12:25", courseCode: "CS-403",  courseTitle: "Software Engineering",             venue: "LHC-201" },
    ],
    Tuesday: [
      { timeSlot: "09:30 – 10:25", courseCode: "CS-404",  courseTitle: "Distributed Systems",              venue: "CSE-SH" },
      { timeSlot: "10:30 – 11:25", courseCode: "CS-401",  courseTitle: "Machine Learning",                 venue: "CSE-LT1" },
      { timeSlot: "14:00 – 15:55", courseCode: "CS-Lab5", courseTitle: "ML & AI Lab",                      venue: "CS Lab-IV" },
    ],
    Wednesday: [
      { timeSlot: "09:30 – 10:25", courseCode: "CS-402",  courseTitle: "Compiler Design",                  venue: "CSE-LT2" },
      { timeSlot: "10:30 – 11:25", courseCode: "CS-403",  courseTitle: "Software Engineering",             venue: "LHC-201" },
      { timeSlot: "11:30 – 12:25", courseCode: "CS-404",  courseTitle: "Distributed Systems",              venue: "CSE-SH" },
    ],
    Thursday: [
      { timeSlot: "09:30 – 10:25", courseCode: "CS-401",  courseTitle: "Machine Learning",                 venue: "CSE-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "CS-402",  courseTitle: "Compiler Design",                  venue: "CSE-LT2" },
      { timeSlot: "14:00 – 16:55", courseCode: "BTP",     courseTitle: "B.Tech Project Work",              venue: "CSE Dept (Supervisor)" },
    ],
    Friday: [
      { timeSlot: "09:30 – 10:25", courseCode: "CS-403",  courseTitle: "Software Engineering",             venue: "LHC-201" },
      { timeSlot: "10:30 – 11:25", courseCode: "CS-404",  courseTitle: "Distributed Systems",              venue: "CSE-SH" },
      { timeSlot: "11:30 – 12:25", courseCode: "CS-401",  courseTitle: "Machine Learning",                 venue: "CSE-LT1" },
    ],
  },

  // ── ECE — 1st Year ───────────────────────────────────────────────────────
  ECE_1st: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-401" },
      { timeSlot: "09:30 – 10:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "10:30 – 11:25", courseCode: "EC-101",  courseTitle: "Basic Electronics",                venue: "ECE-LT1" },
      { timeSlot: "11:30 – 12:25", courseCode: "HSN-101", courseTitle: "Technical Communication",          venue: "LHC-202" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CYN-001", courseTitle: "Chemistry I",                      venue: "LHC-401" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-401" },
      { timeSlot: "10:30 – 11:25", courseCode: "MEN-101", courseTitle: "Engineering Drawing",              venue: "Drawing Hall-2" },
      { timeSlot: "14:00 – 15:55", courseCode: "PHN-Lab", courseTitle: "Physics Lab I",                    venue: "PHN Lab Block-I" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "EC-101",  courseTitle: "Basic Electronics",                venue: "ECE-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-401" },
      { timeSlot: "10:30 – 11:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "11:30 – 12:25", courseCode: "HSN-101", courseTitle: "Technical Communication",          venue: "LHC-202" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-401" },
      { timeSlot: "09:30 – 10:25", courseCode: "CYN-001", courseTitle: "Chemistry I",                      venue: "LHC-401" },
      { timeSlot: "10:30 – 11:25", courseCode: "EC-101",  courseTitle: "Basic Electronics",                venue: "ECE-LT1" },
      { timeSlot: "14:00 – 15:55", courseCode: "CYN-Lab", courseTitle: "Chemistry Lab I",                  venue: "CYN Lab Block" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-401" },
      { timeSlot: "10:30 – 11:25", courseCode: "MEN-101", courseTitle: "Engineering Drawing",              venue: "Drawing Hall-2" },
      { timeSlot: "14:00 – 15:55", courseCode: "INN-101", courseTitle: "Engineering Workshop",             venue: "Central Workshop" },
    ],
  },

  // ── ECE — 2nd Year ───────────────────────────────────────────────────────
  ECE_2nd: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-401" },
      { timeSlot: "09:30 – 10:25", courseCode: "EC-201",  courseTitle: "Signals & Systems",                venue: "ECE-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "EC-202",  courseTitle: "Analog Circuits & Devices",        venue: "ECE-LT2" },
      { timeSlot: "11:30 – 12:25", courseCode: "EC-203",  courseTitle: "Digital Electronics",              venue: "ECE-LT1" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "EC-204",  courseTitle: "Electromagnetic Field Theory",     venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-401" },
      { timeSlot: "10:30 – 11:25", courseCode: "EC-201",  courseTitle: "Signals & Systems",                venue: "ECE-LT1" },
      { timeSlot: "14:00 – 15:55", courseCode: "EC-Lab1", courseTitle: "Analog Electronics Lab",           venue: "Electronics Lab-I" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "EC-202",  courseTitle: "Analog Circuits & Devices",        venue: "ECE-LT2" },
      { timeSlot: "09:30 – 10:25", courseCode: "EC-203",  courseTitle: "Digital Electronics",              venue: "ECE-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-401" },
      { timeSlot: "11:30 – 12:25", courseCode: "EC-204",  courseTitle: "Electromagnetic Field Theory",     venue: "LHC-301" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "EC-201",  courseTitle: "Signals & Systems",                venue: "ECE-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "EC-202",  courseTitle: "Analog Circuits & Devices",        venue: "ECE-LT2" },
      { timeSlot: "14:00 – 15:55", courseCode: "EC-Lab2", courseTitle: "Digital Electronics Lab",          venue: "Electronics Lab-II" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "EC-203",  courseTitle: "Digital Electronics",              venue: "ECE-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "EC-204",  courseTitle: "Electromagnetic Field Theory",     venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-401" },
      { timeSlot: "11:30 – 12:25", courseCode: "EC-201",  courseTitle: "Signals & Systems",                venue: "ECE-LT1" },
    ],
  },

  // ── EE — 1st Year ────────────────────────────────────────────────────────
  EE_1st: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "10:30 – 11:25", courseCode: "EE-101",  courseTitle: "Electrical Circuits",              venue: "EE-LT1" },
      { timeSlot: "11:30 – 12:25", courseCode: "HSN-101", courseTitle: "Technical Communication",          venue: "LHC-202" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CYN-001", courseTitle: "Chemistry I",                      venue: "LHC-401" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "MEN-101", courseTitle: "Engineering Drawing",              venue: "Drawing Hall-1" },
      { timeSlot: "14:00 – 15:55", courseCode: "PHN-Lab", courseTitle: "Physics Lab I",                    venue: "PHN Lab Block-I" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "EE-101",  courseTitle: "Electrical Circuits",              venue: "EE-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "11:30 – 12:25", courseCode: "CYN-001", courseTitle: "Chemistry I",                      venue: "LHC-401" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "EE-101",  courseTitle: "Electrical Circuits",              venue: "EE-LT1" },
      { timeSlot: "14:00 – 15:55", courseCode: "EE-Lab0", courseTitle: "Basic Electrical Lab",             venue: "EE Lab-I" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "MEN-101", courseTitle: "Engineering Drawing",              venue: "Drawing Hall-1" },
      { timeSlot: "14:00 – 15:55", courseCode: "INN-101", courseTitle: "Engineering Workshop",             venue: "Central Workshop" },
    ],
  },

  // ── EE — 2nd Year ────────────────────────────────────────────────────────
  EE_2nd: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "EE-201",  courseTitle: "Circuit Theory",                   venue: "EE-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "EE-202",  courseTitle: "Electromagnetic Theory",           venue: "LHC-301" },
      { timeSlot: "11:30 – 12:25", courseCode: "EE-203",  courseTitle: "Signals & Systems",                venue: "EE-LT1" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "EE-204",  courseTitle: "Electronic Devices & Circuits",   venue: "ECE-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "EE-201",  courseTitle: "Circuit Theory",                   venue: "EE-LT1" },
      { timeSlot: "14:00 – 15:55", courseCode: "EE-Lab1", courseTitle: "Circuits & Devices Lab",           venue: "EE Lab-II" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "EE-202",  courseTitle: "Electromagnetic Theory",           venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "EE-203",  courseTitle: "Signals & Systems",                venue: "EE-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "11:30 – 12:25", courseCode: "EE-204",  courseTitle: "Electronic Devices & Circuits",   venue: "ECE-LT1" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "EE-201",  courseTitle: "Circuit Theory",                   venue: "EE-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "EE-202",  courseTitle: "Electromagnetic Theory",           venue: "LHC-301" },
      { timeSlot: "14:00 – 15:55", courseCode: "EE-Lab2", courseTitle: "Signals & Systems Lab",            venue: "EE Lab-III" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "EE-203",  courseTitle: "Signals & Systems",                venue: "EE-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "EE-204",  courseTitle: "Electronic Devices & Circuits",   venue: "ECE-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "11:30 – 12:25", courseCode: "EE-201",  courseTitle: "Circuit Theory",                   venue: "EE-LT1" },
    ],
  },

  // ── ME — 1st Year ────────────────────────────────────────────────────────
  ME_1st: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-401" },
      { timeSlot: "09:30 – 10:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "10:30 – 11:25", courseCode: "ME-101",  courseTitle: "Engineering Mechanics",            venue: "ME-LT1" },
      { timeSlot: "11:30 – 12:25", courseCode: "HSN-101", courseTitle: "Technical Communication",          venue: "LHC-202" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CYN-001", courseTitle: "Chemistry I",                      venue: "LHC-401" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-401" },
      { timeSlot: "10:30 – 11:25", courseCode: "MEN-101", courseTitle: "Engineering Drawing",              venue: "Drawing Hall-2" },
      { timeSlot: "14:00 – 15:55", courseCode: "PHN-Lab", courseTitle: "Physics Lab I",                    venue: "PHN Lab Block-II" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "ME-101",  courseTitle: "Engineering Mechanics",            venue: "ME-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-401" },
      { timeSlot: "10:30 – 11:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "11:30 – 12:25", courseCode: "CYN-001", courseTitle: "Chemistry I",                      venue: "LHC-401" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-401" },
      { timeSlot: "09:30 – 10:25", courseCode: "ME-101",  courseTitle: "Engineering Mechanics",            venue: "ME-LT1" },
      { timeSlot: "14:00 – 15:55", courseCode: "INN-101", courseTitle: "Engineering Workshop",             venue: "Central Workshop" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-401" },
      { timeSlot: "10:30 – 11:25", courseCode: "MEN-101", courseTitle: "Engineering Drawing",              venue: "Drawing Hall-2" },
      { timeSlot: "14:00 – 15:55", courseCode: "CYN-Lab", courseTitle: "Chemistry Lab I",                  venue: "CYN Lab Block" },
    ],
  },

  // ── ME — 2nd Year ────────────────────────────────────────────────────────
  ME_2nd: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-401" },
      { timeSlot: "09:30 – 10:25", courseCode: "ME-201",  courseTitle: "Thermodynamics",                   venue: "ME-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "ME-202",  courseTitle: "Manufacturing Technology I",       venue: "ME-LT2" },
      { timeSlot: "11:30 – 12:25", courseCode: "ME-203",  courseTitle: "Mechanics of Materials",           venue: "ME-LT1" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "ME-204",  courseTitle: "Fluid Mechanics I",                venue: "ME-LT2" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-401" },
      { timeSlot: "10:30 – 11:25", courseCode: "ME-201",  courseTitle: "Thermodynamics",                   venue: "ME-LT1" },
      { timeSlot: "14:00 – 15:55", courseCode: "ME-Lab1", courseTitle: "Manufacturing Processes Lab",      venue: "ME Lab-I" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "ME-202",  courseTitle: "Manufacturing Technology I",       venue: "ME-LT2" },
      { timeSlot: "09:30 – 10:25", courseCode: "ME-203",  courseTitle: "Mechanics of Materials",           venue: "ME-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-401" },
      { timeSlot: "11:30 – 12:25", courseCode: "ME-204",  courseTitle: "Fluid Mechanics I",                venue: "ME-LT2" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "ME-201",  courseTitle: "Thermodynamics",                   venue: "ME-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "ME-202",  courseTitle: "Manufacturing Technology I",       venue: "ME-LT2" },
      { timeSlot: "14:00 – 15:55", courseCode: "ME-Lab2", courseTitle: "Fluid & Thermal Lab",              venue: "ME Lab-II" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "ME-203",  courseTitle: "Mechanics of Materials",           venue: "ME-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "ME-204",  courseTitle: "Fluid Mechanics I",                venue: "ME-LT2" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-401" },
      { timeSlot: "11:30 – 12:25", courseCode: "ME-201",  courseTitle: "Thermodynamics",                   venue: "ME-LT1" },
    ],
  },

  // ── CE — 1st Year ────────────────────────────────────────────────────────
  CE_1st: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "10:30 – 11:25", courseCode: "CE-101",  courseTitle: "Engineering Geology",              venue: "CE-LT1" },
      { timeSlot: "11:30 – 12:25", courseCode: "HSN-101", courseTitle: "Technical Communication",          venue: "LHC-202" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CYN-001", courseTitle: "Chemistry I",                      venue: "LHC-401" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "MEN-101", courseTitle: "Engineering Drawing",              venue: "Drawing Hall-1" },
      { timeSlot: "14:00 – 15:55", courseCode: "CE-Lab0", courseTitle: "Geology Lab",                      venue: "CE Lab Block" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CE-101",  courseTitle: "Engineering Geology",              venue: "CE-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "11:30 – 12:25", courseCode: "CYN-001", courseTitle: "Chemistry I",                      venue: "LHC-401" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "CE-101",  courseTitle: "Engineering Geology",              venue: "CE-LT1" },
      { timeSlot: "14:00 – 15:55", courseCode: "PHN-Lab", courseTitle: "Physics Lab I",                    venue: "PHN Lab Block-I" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "MEN-101", courseTitle: "Engineering Drawing",              venue: "Drawing Hall-1" },
      { timeSlot: "14:00 – 15:55", courseCode: "INN-101", courseTitle: "Engineering Workshop",             venue: "Central Workshop" },
    ],
  },

  // ── CE — 2nd Year ────────────────────────────────────────────────────────
  CE_2nd: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "CE-201",  courseTitle: "Structural Analysis I",            venue: "CE-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "CE-202",  courseTitle: "Fluid Mechanics",                  venue: "CE-LT2" },
      { timeSlot: "11:30 – 12:25", courseCode: "CE-203",  courseTitle: "Geotechnical Engineering I",       venue: "CE-LT1" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CE-204",  courseTitle: "Surveying",                        venue: "CE-LT2" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "CE-201",  courseTitle: "Structural Analysis I",            venue: "CE-LT1" },
      { timeSlot: "14:00 – 15:55", courseCode: "CE-Lab1", courseTitle: "Concrete & Materials Lab",         venue: "CE Structures Lab" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CE-202",  courseTitle: "Fluid Mechanics",                  venue: "CE-LT2" },
      { timeSlot: "09:30 – 10:25", courseCode: "CE-203",  courseTitle: "Geotechnical Engineering I",       venue: "CE-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "11:30 – 12:25", courseCode: "CE-204",  courseTitle: "Surveying",                        venue: "CE-LT2" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CE-201",  courseTitle: "Structural Analysis I",            venue: "CE-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "CE-202",  courseTitle: "Fluid Mechanics",                  venue: "CE-LT2" },
      { timeSlot: "14:00 – 15:55", courseCode: "CE-Lab2", courseTitle: "Fluid Mechanics Lab",              venue: "CE Hydraulics Lab" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CE-203",  courseTitle: "Geotechnical Engineering I",       venue: "CE-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "CE-204",  courseTitle: "Surveying",                        venue: "CE-LT2" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "11:30 – 12:25", courseCode: "CE-201",  courseTitle: "Structural Analysis I",            venue: "CE-LT1" },
    ],
  },

  // ── CH — 1st Year ────────────────────────────────────────────────────────
  CH_1st: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-401" },
      { timeSlot: "09:30 – 10:25", courseCode: "CYN-001", courseTitle: "Chemistry I",                      venue: "LHC-401" },
      { timeSlot: "10:30 – 11:25", courseCode: "CH-101",  courseTitle: "Intro to Chemical Engineering",   venue: "CH-LT1" },
      { timeSlot: "11:30 – 12:25", courseCode: "HSN-101", courseTitle: "Technical Communication",          venue: "LHC-202" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-401" },
      { timeSlot: "10:30 – 11:25", courseCode: "MEN-101", courseTitle: "Engineering Drawing",              venue: "Drawing Hall-2" },
      { timeSlot: "14:00 – 15:55", courseCode: "CYN-Lab", courseTitle: "Chemistry Lab I",                  venue: "CYN Lab Block" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CH-101",  courseTitle: "Intro to Chemical Engineering",   venue: "CH-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "CYN-001", courseTitle: "Chemistry I",                      venue: "LHC-401" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-401" },
      { timeSlot: "11:30 – 12:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-401" },
      { timeSlot: "09:30 – 10:25", courseCode: "CH-101",  courseTitle: "Intro to Chemical Engineering",   venue: "CH-LT1" },
      { timeSlot: "14:00 – 15:55", courseCode: "PHN-Lab", courseTitle: "Physics Lab I",                    venue: "PHN Lab Block-II" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-401" },
      { timeSlot: "10:30 – 11:25", courseCode: "CYN-001", courseTitle: "Chemistry I",                      venue: "LHC-401" },
      { timeSlot: "14:00 – 15:55", courseCode: "INN-101", courseTitle: "Engineering Workshop",             venue: "Central Workshop" },
    ],
  },

  // ── CH — 2nd Year ────────────────────────────────────────────────────────
  CH_2nd: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-401" },
      { timeSlot: "09:30 – 10:25", courseCode: "CH-201",  courseTitle: "Chemical Engineering Thermodynamics", venue: "CH-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "CH-202",  courseTitle: "Fluid Mechanics & Mass Transfer",  venue: "CH-LT2" },
      { timeSlot: "11:30 – 12:25", courseCode: "CH-203",  courseTitle: "Chemical Reaction Engineering I",  venue: "CH-LT1" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CYN-002", courseTitle: "Chemistry II",                     venue: "LHC-401" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-401" },
      { timeSlot: "10:30 – 11:25", courseCode: "CH-201",  courseTitle: "Chemical Engineering Thermodynamics", venue: "CH-LT1" },
      { timeSlot: "14:00 – 15:55", courseCode: "CH-Lab1", courseTitle: "Chemical Engineering Lab I",       venue: "CH Lab Block" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CH-202",  courseTitle: "Fluid Mechanics & Mass Transfer",  venue: "CH-LT2" },
      { timeSlot: "09:30 – 10:25", courseCode: "CH-203",  courseTitle: "Chemical Reaction Engineering I",  venue: "CH-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-401" },
      { timeSlot: "11:30 – 12:25", courseCode: "CYN-002", courseTitle: "Chemistry II",                     venue: "LHC-401" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CH-201",  courseTitle: "Chemical Engineering Thermodynamics", venue: "CH-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "CH-202",  courseTitle: "Fluid Mechanics & Mass Transfer",  venue: "CH-LT2" },
      { timeSlot: "14:00 – 15:55", courseCode: "CH-Lab2", courseTitle: "Mass Transfer Lab",                venue: "CH Pilot Plant" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CH-203",  courseTitle: "Chemical Reaction Engineering I",  venue: "CH-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "CYN-002", courseTitle: "Chemistry II",                     venue: "LHC-401" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-401" },
      { timeSlot: "11:30 – 12:25", courseCode: "CH-201",  courseTitle: "Chemical Engineering Thermodynamics", venue: "CH-LT1" },
    ],
  },

  // ── PI — 1st Year ────────────────────────────────────────────────────────
  PI_1st: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "10:30 – 11:25", courseCode: "PI-101",  courseTitle: "Intro to Manufacturing Systems",  venue: "PI-LT1" },
      { timeSlot: "11:30 – 12:25", courseCode: "HSN-101", courseTitle: "Technical Communication",          venue: "LHC-202" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CYN-001", courseTitle: "Chemistry I",                      venue: "LHC-401" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "MEN-101", courseTitle: "Engineering Drawing",              venue: "Drawing Hall-1" },
      { timeSlot: "14:00 – 15:55", courseCode: "PHN-Lab", courseTitle: "Physics Lab I",                    venue: "PHN Lab Block-I" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "PI-101",  courseTitle: "Intro to Manufacturing Systems",  venue: "PI-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "11:30 – 12:25", courseCode: "CYN-001", courseTitle: "Chemistry I",                      venue: "LHC-401" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "PI-101",  courseTitle: "Intro to Manufacturing Systems",  venue: "PI-LT1" },
      { timeSlot: "14:00 – 15:55", courseCode: "INN-101", courseTitle: "Engineering Workshop",             venue: "PI Workshop" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "MEN-101", courseTitle: "Engineering Drawing",              venue: "Drawing Hall-1" },
      { timeSlot: "14:00 – 15:55", courseCode: "CYN-Lab", courseTitle: "Chemistry Lab I",                  venue: "CYN Lab Block" },
    ],
  },

  // ── PI — 2nd Year ────────────────────────────────────────────────────────
  PI_2nd: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "PI-201",  courseTitle: "Industrial Engineering",           venue: "PI-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "PI-202",  courseTitle: "Production Technology I",          venue: "PI-LT2" },
      { timeSlot: "11:30 – 12:25", courseCode: "ME-201",  courseTitle: "Thermodynamics",                   venue: "ME-LT1" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "PI-203",  courseTitle: "Metrology & Quality Control",      venue: "PI-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "PI-201",  courseTitle: "Industrial Engineering",           venue: "PI-LT1" },
      { timeSlot: "14:00 – 15:55", courseCode: "PI-Lab1", courseTitle: "Manufacturing Processes Lab",      venue: "PI Mfg Lab" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "PI-202",  courseTitle: "Production Technology I",          venue: "PI-LT2" },
      { timeSlot: "09:30 – 10:25", courseCode: "ME-201",  courseTitle: "Thermodynamics",                   venue: "ME-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "11:30 – 12:25", courseCode: "PI-203",  courseTitle: "Metrology & Quality Control",      venue: "PI-LT1" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "PI-201",  courseTitle: "Industrial Engineering",           venue: "PI-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "PI-202",  courseTitle: "Production Technology I",          venue: "PI-LT2" },
      { timeSlot: "14:00 – 15:55", courseCode: "PI-Lab2", courseTitle: "Metrology Lab",                    venue: "PI Metrology Lab" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "ME-201",  courseTitle: "Thermodynamics",                   venue: "ME-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "PI-203",  courseTitle: "Metrology & Quality Control",      venue: "PI-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "11:30 – 12:25", courseCode: "PI-201",  courseTitle: "Industrial Engineering",           venue: "PI-LT1" },
    ],
  },

  // ── META — 1st Year ──────────────────────────────────────────────────────
  META_1st: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "10:30 – 11:25", courseCode: "META-101",courseTitle: "Introduction to Metallurgy",       venue: "META-LT1" },
      { timeSlot: "11:30 – 12:25", courseCode: "HSN-101", courseTitle: "Technical Communication",          venue: "LHC-202" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CYN-001", courseTitle: "Chemistry I",                      venue: "LHC-401" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "MEN-101", courseTitle: "Engineering Drawing",              venue: "Drawing Hall-1" },
      { timeSlot: "14:00 – 15:55", courseCode: "CYN-Lab", courseTitle: "Chemistry Lab I",                  venue: "CYN Lab Block" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "META-101",courseTitle: "Introduction to Metallurgy",       venue: "META-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "11:30 – 12:25", courseCode: "CYN-001", courseTitle: "Chemistry I",                      venue: "LHC-401" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "META-101",courseTitle: "Introduction to Metallurgy",       venue: "META-LT1" },
      { timeSlot: "14:00 – 15:55", courseCode: "PHN-Lab", courseTitle: "Physics Lab I",                    venue: "PHN Lab Block-I" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "MEN-101", courseTitle: "Engineering Drawing",              venue: "Drawing Hall-1" },
      { timeSlot: "14:00 – 15:55", courseCode: "INN-101", courseTitle: "Engineering Workshop",             venue: "Central Workshop" },
    ],
  },

  // ── META — 2nd Year ──────────────────────────────────────────────────────
  META_2nd: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "META-201",courseTitle: "Physical Metallurgy",              venue: "META-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "META-202",courseTitle: "Mechanical Metallurgy",            venue: "META-LT2" },
      { timeSlot: "11:30 – 12:25", courseCode: "META-203",courseTitle: "Materials Characterisation",       venue: "META-LT1" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "META-204",courseTitle: "Extractive Metallurgy I",          venue: "META-LT2" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "META-201",courseTitle: "Physical Metallurgy",              venue: "META-LT1" },
      { timeSlot: "14:00 – 15:55", courseCode: "META-L1", courseTitle: "Metallography Lab",                venue: "META Lab-I" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "META-202",courseTitle: "Mechanical Metallurgy",            venue: "META-LT2" },
      { timeSlot: "09:30 – 10:25", courseCode: "META-203",courseTitle: "Materials Characterisation",       venue: "META-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "11:30 – 12:25", courseCode: "META-204",courseTitle: "Extractive Metallurgy I",          venue: "META-LT2" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "META-201",courseTitle: "Physical Metallurgy",              venue: "META-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "META-202",courseTitle: "Mechanical Metallurgy",            venue: "META-LT2" },
      { timeSlot: "14:00 – 15:55", courseCode: "META-L2", courseTitle: "Materials Testing Lab",            venue: "META Lab-II" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "META-203",courseTitle: "Materials Characterisation",       venue: "META-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "META-204",courseTitle: "Extractive Metallurgy I",          venue: "META-LT2" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "11:30 – 12:25", courseCode: "META-201",courseTitle: "Physical Metallurgy",              venue: "META-LT1" },
    ],
  },

  // ── EPH — 1st Year ───────────────────────────────────────────────────────
  EPH_1st: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "10:30 – 11:25", courseCode: "EP-101",  courseTitle: "Modern Physics",                   venue: "PHN-LT1" },
      { timeSlot: "11:30 – 12:25", courseCode: "HSN-101", courseTitle: "Technical Communication",          venue: "LHC-202" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CYN-001", courseTitle: "Chemistry I",                      venue: "LHC-401" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "PHN-002", courseTitle: "Physics II",                       venue: "LHC-302" },
      { timeSlot: "14:00 – 15:55", courseCode: "PHN-Lab", courseTitle: "Physics Lab I",                    venue: "PHN Lab Block-I" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "EP-101",  courseTitle: "Modern Physics",                   venue: "PHN-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "11:30 – 12:25", courseCode: "PHN-002", courseTitle: "Physics II",                       venue: "LHC-302" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "EP-101",  courseTitle: "Modern Physics",                   venue: "PHN-LT1" },
      { timeSlot: "14:00 – 15:55", courseCode: "CYN-Lab", courseTitle: "Chemistry Lab I",                  venue: "CYN Lab Block" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "PHN-002", courseTitle: "Physics II",                       venue: "LHC-302" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "EP-101",  courseTitle: "Modern Physics",                   venue: "PHN-LT1" },
      { timeSlot: "14:00 – 15:55", courseCode: "PHN-Lab2",courseTitle: "Physics Lab II",                   venue: "PHN Lab Block-II" },
    ],
  },

  // ── MNC — 1st Year ───────────────────────────────────────────────────────
  MNC_1st: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-002", courseTitle: "Linear Algebra",                   venue: "MA-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "CS-101",  courseTitle: "Fundamentals of Programming",      venue: "LHC-101" },
      { timeSlot: "11:30 – 12:25", courseCode: "HSN-101", courseTitle: "Technical Communication",          venue: "LHC-202" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-002", courseTitle: "Linear Algebra",                   venue: "MA-LT1" },
      { timeSlot: "14:00 – 15:55", courseCode: "CS-Lab1", courseTitle: "Programming Lab",                  venue: "CS Lab-I" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CS-101",  courseTitle: "Fundamentals of Programming",      venue: "LHC-101" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "11:30 – 12:25", courseCode: "MAN-002", courseTitle: "Linear Algebra",                   venue: "MA-LT1" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "CS-101",  courseTitle: "Fundamentals of Programming",      venue: "LHC-101" },
      { timeSlot: "14:00 – 15:55", courseCode: "PHN-Lab", courseTitle: "Physics Lab I",                    venue: "PHN Lab Block-I" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-002", courseTitle: "Linear Algebra",                   venue: "MA-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "11:30 – 12:25", courseCode: "CS-101",  courseTitle: "Fundamentals of Programming",      venue: "LHC-101" },
    ],
  },

  // ── MNC — 2nd Year ───────────────────────────────────────────────────────
  MNC_2nd: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-102", courseTitle: "Real Analysis",                    venue: "MA-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "CS-201",  courseTitle: "Data Structures & Algorithms",    venue: "CSE-LT1" },
      { timeSlot: "11:30 – 12:25", courseCode: "MAN-201", courseTitle: "Abstract Algebra",                 venue: "MA-LT2" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CS-202",  courseTitle: "Discrete Mathematics",             venue: "LHC-201" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-102", courseTitle: "Real Analysis",                    venue: "MA-LT1" },
      { timeSlot: "14:00 – 15:55", courseCode: "CS-Lab2", courseTitle: "Data Structures Lab",              venue: "CS Lab-II" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CS-201",  courseTitle: "Data Structures & Algorithms",    venue: "CSE-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-201", courseTitle: "Abstract Algebra",                 venue: "MA-LT2" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "11:30 – 12:25", courseCode: "CS-202",  courseTitle: "Discrete Mathematics",             venue: "LHC-201" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-102", courseTitle: "Real Analysis",                    venue: "MA-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "CS-201",  courseTitle: "Data Structures & Algorithms",    venue: "CSE-LT1" },
      { timeSlot: "14:00 – 14:55", courseCode: "MAN-201", courseTitle: "Abstract Algebra",                 venue: "MA-LT2" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-201", courseTitle: "Abstract Algebra",                 venue: "MA-LT2" },
      { timeSlot: "09:30 – 10:25", courseCode: "CS-202",  courseTitle: "Discrete Mathematics",             venue: "LHC-201" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "11:30 – 12:25", courseCode: "MAN-102", courseTitle: "Real Analysis",                    venue: "MA-LT1" },
    ],
  },

  // ── DSAI — 1st Year ──────────────────────────────────────────────────────
  DSAI_1st: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "CS-101",  courseTitle: "Fundamentals of Programming",      venue: "LHC-101" },
      { timeSlot: "10:30 – 11:25", courseCode: "DSAI-101",courseTitle: "Introduction to Data Science",     venue: "CSE-LT1" },
      { timeSlot: "11:30 – 12:25", courseCode: "HSN-101", courseTitle: "Technical Communication",          venue: "LHC-202" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "CS-101",  courseTitle: "Fundamentals of Programming",      venue: "LHC-101" },
      { timeSlot: "14:00 – 15:55", courseCode: "CS-Lab1", courseTitle: "Python Programming Lab",           venue: "CS Lab-I" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "DSAI-101",courseTitle: "Introduction to Data Science",     venue: "CSE-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "11:30 – 12:25", courseCode: "CS-101",  courseTitle: "Fundamentals of Programming",      venue: "LHC-101" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "DSAI-101",courseTitle: "Introduction to Data Science",     venue: "CSE-LT1" },
      { timeSlot: "14:00 – 15:55", courseCode: "PHN-Lab", courseTitle: "Physics Lab I",                    venue: "PHN Lab Block-I" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "DSAI-101",courseTitle: "Introduction to Data Science",     venue: "CSE-LT1" },
      { timeSlot: "11:30 – 12:25", courseCode: "CS-101",  courseTitle: "Fundamentals of Programming",      venue: "LHC-101" },
    ],
  },

  // ── DSAI — 2nd Year ──────────────────────────────────────────────────────
  DSAI_2nd: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "DSAI-201",courseTitle: "Machine Learning Fundamentals",    venue: "CSE-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "DSAI-202",courseTitle: "Statistical Inference",            venue: "LHC-201" },
      { timeSlot: "11:30 – 12:25", courseCode: "CS-201",  courseTitle: "Data Structures & Algorithms",    venue: "CSE-LT2" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "DSAI-203",courseTitle: "Database Systems",                 venue: "CSE-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "DSAI-201",courseTitle: "Machine Learning Fundamentals",    venue: "CSE-LT1" },
      { timeSlot: "14:00 – 15:55", courseCode: "DS-Lab1", courseTitle: "ML & Statistics Lab",              venue: "CS Lab-III" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "DSAI-202",courseTitle: "Statistical Inference",            venue: "LHC-201" },
      { timeSlot: "09:30 – 10:25", courseCode: "CS-201",  courseTitle: "Data Structures & Algorithms",    venue: "CSE-LT2" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "11:30 – 12:25", courseCode: "DSAI-203",courseTitle: "Database Systems",                 venue: "CSE-LT1" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "DSAI-201",courseTitle: "Machine Learning Fundamentals",    venue: "CSE-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "DSAI-202",courseTitle: "Statistical Inference",            venue: "LHC-201" },
      { timeSlot: "14:00 – 15:55", courseCode: "DS-Lab2", courseTitle: "Database Lab",                     venue: "CS Lab-II" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CS-201",  courseTitle: "Data Structures & Algorithms",    venue: "CSE-LT2" },
      { timeSlot: "09:30 – 10:25", courseCode: "DSAI-203",courseTitle: "Database Systems",                 venue: "CSE-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "11:30 – 12:25", courseCode: "DSAI-201",courseTitle: "Machine Learning Fundamentals",    venue: "CSE-LT1" },
    ],
  },

  // ── GT — 1st Year ────────────────────────────────────────────────────────
  GT_1st: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "10:30 – 11:25", courseCode: "GT-101",  courseTitle: "Engineering Geology",              venue: "ERTH-LT1" },
      { timeSlot: "11:30 – 12:25", courseCode: "HSN-101", courseTitle: "Technical Communication",          venue: "LHC-202" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CYN-001", courseTitle: "Chemistry I",                      venue: "LHC-401" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "MEN-101", courseTitle: "Engineering Drawing",              venue: "Drawing Hall-1" },
      { timeSlot: "14:00 – 15:55", courseCode: "GT-Lab1", courseTitle: "Geology Field Lab",                venue: "Geological Survey Shed" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "GT-101",  courseTitle: "Engineering Geology",              venue: "ERTH-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "11:30 – 12:25", courseCode: "CYN-001", courseTitle: "Chemistry I",                      venue: "LHC-401" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "GT-101",  courseTitle: "Engineering Geology",              venue: "ERTH-LT1" },
      { timeSlot: "14:00 – 15:55", courseCode: "PHN-Lab", courseTitle: "Physics Lab I",                    venue: "PHN Lab Block-I" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "MEN-101", courseTitle: "Engineering Drawing",              venue: "Drawing Hall-1" },
      { timeSlot: "14:00 – 15:55", courseCode: "INN-101", courseTitle: "Engineering Workshop",             venue: "Central Workshop" },
    ],
  },

  // ── GPT — 1st Year ───────────────────────────────────────────────────────
  GPT_1st: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "10:30 – 11:25", courseCode: "GPT-101", courseTitle: "Introduction to Geophysics",       venue: "ERTH-LT2" },
      { timeSlot: "11:30 – 12:25", courseCode: "GPT-102", courseTitle: "Physical Geology",                 venue: "ERTH-LT1" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CYN-001", courseTitle: "Chemistry I",                      venue: "LHC-401" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "MEN-101", courseTitle: "Engineering Drawing",              venue: "Drawing Hall-2" },
      { timeSlot: "14:00 – 15:55", courseCode: "GPT-Lab1",courseTitle: "Geophysics Lab I",                 venue: "Geophysics Instrument Lab" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "GPT-101", courseTitle: "Introduction to Geophysics",       venue: "ERTH-LT2" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "11:30 – 12:25", courseCode: "GPT-102", courseTitle: "Physical Geology",                 venue: "ERTH-LT1" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "GPT-102", courseTitle: "Physical Geology",                 venue: "ERTH-LT1" },
      { timeSlot: "14:00 – 15:55", courseCode: "PHN-Lab", courseTitle: "Physics Lab I",                    venue: "PHN Lab Block-I" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "09:30 – 10:25", courseCode: "GPT-101", courseTitle: "Introduction to Geophysics",       venue: "ERTH-LT2" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "14:00 – 15:55", courseCode: "INN-101", courseTitle: "Engineering Workshop",             venue: "Central Workshop" },
    ],
  },

  // ── ARCHI — 1st Year ─────────────────────────────────────────────────────
  ARCHI_1st: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "ACHI-101",courseTitle: "Architectural Design I",           venue: "ACHI Design Studio-1" },
      { timeSlot: "09:30 – 10:25", courseCode: "ACHI-102",courseTitle: "History of Architecture",          venue: "ACHI-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-201" },
      { timeSlot: "11:30 – 12:25", courseCode: "HSN-101", courseTitle: "Technical Communication",          venue: "LHC-202" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 10:25", courseCode: "ACHI-101",courseTitle: "Architectural Design I (Studio)", venue: "ACHI Design Studio-1" },
      { timeSlot: "10:30 – 11:25", courseCode: "ACHI-103",courseTitle: "Building Construction I",          venue: "ACHI-LT1" },
      { timeSlot: "14:00 – 15:55", courseCode: "ACHI-L1", courseTitle: "Visual Arts & Drawing Studio",    venue: "ACHI Drawing Hall" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "ACHI-102",courseTitle: "History of Architecture",          venue: "ACHI-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-201" },
      { timeSlot: "10:30 – 11:25", courseCode: "ACHI-103",courseTitle: "Building Construction I",          venue: "ACHI-LT1" },
      { timeSlot: "11:30 – 12:25", courseCode: "ACHI-101",courseTitle: "Architectural Design I",           venue: "ACHI Design Studio-1" },
    ],
    Thursday: [
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-201" },
      { timeSlot: "10:30 – 11:25", courseCode: "ACHI-102",courseTitle: "History of Architecture",          venue: "ACHI-LT1" },
      { timeSlot: "14:00 – 16:55", courseCode: "ACHI-101",courseTitle: "Architectural Design I (Studio)", venue: "ACHI Design Studio-2" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "ACHI-103",courseTitle: "Building Construction I",          venue: "ACHI-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "ACHI-102",courseTitle: "History of Architecture",          venue: "ACHI-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-201" },
    ],
  },

  // ── BSBE — 1st Year ──────────────────────────────────────────────────────
  BSBE_1st: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "BIO-101", courseTitle: "Cell Biology",                     venue: "BSBE-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "BSBE-101",courseTitle: "Introduction to Biotechnology",   venue: "BSBE-LT2" },
      { timeSlot: "11:30 – 12:25", courseCode: "HSN-101", courseTitle: "Technical Communication",          venue: "LHC-202" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "CYN-001", courseTitle: "Chemistry I",                      venue: "LHC-401" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "14:00 – 15:55", courseCode: "BIO-Lab1",courseTitle: "Cell Biology Lab",                 venue: "BSBE Biology Lab-I" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "BIO-101", courseTitle: "Cell Biology",                     venue: "BSBE-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "CYN-001", courseTitle: "Chemistry I",                      venue: "LHC-401" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "11:30 – 12:25", courseCode: "BSBE-101",courseTitle: "Introduction to Biotechnology",   venue: "BSBE-LT2" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "14:00 – 15:55", courseCode: "CYN-Lab", courseTitle: "Chemistry Lab I",                  venue: "CYN Lab Block" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "PHN-001", courseTitle: "Physics I",                        venue: "LHC-302" },
      { timeSlot: "09:30 – 10:25", courseCode: "BIO-101", courseTitle: "Cell Biology",                     venue: "BSBE-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "BSBE-101",courseTitle: "Introduction to Biotechnology",   venue: "BSBE-LT2" },
      { timeSlot: "11:30 – 12:25", courseCode: "MAN-001", courseTitle: "Mathematics I",                    venue: "LHC-301" },
    ],
  },

  // ── EPH — 2nd Year ───────────────────────────────────────────────────────
  EPH_2nd: {
    Monday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "EP-201",  courseTitle: "Quantum Mechanics I",              venue: "PHN-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "EP-202",  courseTitle: "Statistical Mechanics",            venue: "PHN-LT2" },
      { timeSlot: "11:30 – 12:25", courseCode: "EP-203",  courseTitle: "Electrodynamics",                  venue: "PHN-LT1" },
    ],
    Tuesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "MAN-201", courseTitle: "Mathematics III",                  venue: "LHC-301" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "EP-201",  courseTitle: "Quantum Mechanics I",              venue: "PHN-LT1" },
      { timeSlot: "14:00 – 15:55", courseCode: "EP-Lab1", courseTitle: "Advanced Physics Lab",             venue: "PHN Lab Block-II" },
    ],
    Wednesday: [
      { timeSlot: "08:30 – 09:25", courseCode: "EP-202",  courseTitle: "Statistical Mechanics",            venue: "PHN-LT2" },
      { timeSlot: "09:30 – 10:25", courseCode: "EP-203",  courseTitle: "Electrodynamics",                  venue: "PHN-LT1" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "11:30 – 12:25", courseCode: "MAN-201", courseTitle: "Mathematics III",                  venue: "LHC-301" },
    ],
    Thursday: [
      { timeSlot: "08:30 – 09:25", courseCode: "EP-201",  courseTitle: "Quantum Mechanics I",              venue: "PHN-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "EP-202",  courseTitle: "Statistical Mechanics",            venue: "PHN-LT2" },
      { timeSlot: "14:00 – 15:55", courseCode: "EP-Lab2", courseTitle: "Computational Physics Lab",        venue: "CS Lab-I" },
    ],
    Friday: [
      { timeSlot: "08:30 – 09:25", courseCode: "EP-203",  courseTitle: "Electrodynamics",                  venue: "PHN-LT1" },
      { timeSlot: "09:30 – 10:25", courseCode: "MAN-201", courseTitle: "Mathematics III",                  venue: "LHC-301" },
      { timeSlot: "10:30 – 11:25", courseCode: "MAN-101", courseTitle: "Mathematics II",                   venue: "LHC-301" },
      { timeSlot: "11:30 – 12:25", courseCode: "EP-201",  courseTitle: "Quantum Mechanics I",              venue: "PHN-LT1" },
    ],
  },
};

// ── Timetable department full names ───────────────────────────────────────────

const DEPT_FULL_NAME: Record<Department, string> = {
  PI:   "Production & Industrial Engineering",
  CSE:  "Computer Science & Engineering",
  ECE:  "Electronics & Communication Engineering",
  EE:   "Electrical Engineering",
  ME:   "Mechanical Engineering",
  CE:   "Civil Engineering",
  CH:   "Chemical Engineering",
  META: "Metallurgical & Materials Engineering",
  EPH:  "Engineering Physics",
  MNC:  "Mathematics & Computing",
  DSAI: "Data Science & Artificial Intelligence",
  GT:   "Geological Technology",
  GPT:  "Geophysical Technology",
  ARCHI: "Architecture & Planning",
  BSBE: "Biotechnology & Bio-Sciences",
};

// ── Format helper ─────────────────────────────────────────────────────────────

function formatTimetable(
  department: Department,
  academicYear: AcademicYear,
  batchSection: string,
  day: Day,
  slots: ClassEntry[]
): string {
  const header = `## ${DEPT_FULL_NAME[department]} — ${academicYear} Year | Batch: ${batchSection} | ${day}`;

  if (slots.length === 0) {
    return `${header}\n\n_No classes scheduled for this day._`;
  }

  const rows = slots
    .map(
      ({ timeSlot, courseCode, courseTitle, venue }) =>
        `| ${timeSlot} | ${courseCode} | ${courseTitle} | ${venue} |`
    )
    .join("\n");

  return [
    header,
    "",
    "| Time Slot | Course Code | Course Title | Venue |",
    "|-----------|-------------|--------------|-------|",
    rows,
  ].join("\n");
}

// ── MCP Server ────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: "iitr-timetable",
  version: "1.0.0",
});

server.registerTool(
  "get_academic_timetable",
  {
    description:
      "Fetches the daily lecture schedule, room allocations, and course timing details for a specified student department, year, and batch section.",
    inputSchema: {
      department:   z.enum(DEPARTMENTS),
      academicYear: z.enum(ACADEMIC_YEARS),
      batchSection: z.string().describe(
        "The explicit departmental sub-batch identifier like 'PI1', 'ME1', 'CE2', 'CHE-6', 'CS1'"
      ),
      day: z.enum(DAYS),
    },
  },
  async ({ department, academicYear, batchSection, day }) => {
    // Lookup order: batch-specific → dept+year → not found
    const specific = `${department}_${academicYear}_${batchSection}`;
    const general  = `${department}_${academicYear}`;
    const schedule = TIMETABLE[specific] ?? TIMETABLE[general];

    if (!schedule) {
      const text = [
        `## ${DEPT_FULL_NAME[department]} — ${academicYear} Year | Batch: ${batchSection} | ${day}`,
        "",
        `> Timetable data for **${department} ${academicYear} Year** is not yet available in this mock dataset.`,
        `> Please refer to the official IITR Academic Section portal or your department notice board.`,
      ].join("\n");
      return { content: [{ type: "text" as const, text }] };
    }

    const slots: ClassEntry[] = schedule[day];
    const text = formatTimetable(department, academicYear, batchSection, day, slots);
    return { content: [{ type: "text" as const, text }] };
  }
);

// ── Startup ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Timetable MCP Server running on stdio");
}

main().catch((err: unknown) => {
  console.error("Fatal error starting Timetable MCP Server:", err);
  process.exit(1);
});
