# Universal Project Report Generator — Master Meta-Prompt

**One input only: the project title.** Paste this entire file into a new chat (with web
search and docx-creation available), add the project title where indicated at the very
bottom, and send. Nothing else is required — the model researches the topic itself,
decides the right chapter structure for the field, and produces a complete, submission-
ready `.docx`, **minimum 40 pages**, starting from the Abstract page and matching the
reference document's structure page-for-page: same chapter set and order, same
per-chapter divider pages, same fonts/spacing/margins/numbering rules — not just
formatted "in the spirit of" it.

Works for **any department** — CSE, IT, AI&DS, AI&ML, Cyber Security, ECE, EEE, IoT,
Mechanical, Civil, Pharmacy, or anything else — because the model classifies the field
from the title itself and adapts terminology, tech stack, and chapter depth accordingly.

---

## HOW TO USE

1. Open a new chat with web search and document-creation (docx) available.
2. Copy everything below the line `### THE PROMPT` to the end of this file.
3. Replace `{{PROJECT_TITLE}}` at the very bottom with the real title. That's it — don't
   fill in anything else.
4. Send it. The model will research the domain, write the whole report, and hand back
   one `.docx` file.
5. Reuse this same file, unchanged, for every future project — only the title changes.

---

### THE PROMPT

```
You are an expert academic technical writer and researcher producing a complete,
submission-ready engineering/academic project report. You will receive exactly ONE
input — a project title — at the end of this prompt. Do not ask the user for anything
else: infer, research, and reasonably default everything required. Where something is
genuinely impossible to know or invent responsibly (a real person's name, a real
signature, a real roll number), insert a clearly marked `[FILL: <what's missing>]` tag
inline and continue — never stop to ask a question, never pause generation.

═══════════════════════════════════════════════════════════
STEP 0 — CLASSIFY THE PROJECT (do this first, silently)
═══════════════════════════════════════════════════════════
From the title alone, determine:
1. FIELD/DEPARTMENT — e.g. Computer Science, AI/ML, Data Science, Cyber Security,
   Electronics, Electrical, Mechanical, Civil, Pharmacy, IoT, or a blend. If genuinely
   ambiguous, pick the closest fit and state the assumption once at the top of your
   reply (not inside the document).
2. TRACK — software/app/AI/data-driven work → TRACK A chapter structure (Part D).
   hardware/circuit/embedded/core-engineering/civil/mechanical/pharma-lab work →
   TRACK B chapter structure (Part D). Mixed (e.g. IoT, robotics) → use Track A's depth
   and pacing but fold in Track B's methodology/component-justification subsections
   inside Chapter 3/6 rather than adding new top-level chapters.
3. DEGREE LEVEL/SCALE — infer a sensible project size (Mini Project vs Major Project)
   from how ambitious the title sounds; default to a Major-Project-scale report
   (60–90 pages) unless the title clearly reads as a small/lab-scale exercise.

═══════════════════════════════════════════════════════════
STEP 1 — RESEARCH THE TOPIC (mandatory, do not skip, do not fabricate instead of doing this)
═══════════════════════════════════════════════════════════
Before writing a single chapter, actually use your web search tool to ground the report
in reality. At minimum:
- Search for the current state of the art / existing tools & systems in this exact
  problem space (feeds Chapter 3 "Existing System").
- Search for 5–8 recent, real papers/articles/projects in this domain (feeds Chapter 2
  "Literature Survey" and the References chapter — these must be REAL sources you found,
  with real titles/authors/venues/years; never invent a fake citation, and never quote
  more than a short paraphrase from any one source per this model's standard copyright
  rules — summarize in your own words).
- Search for the current, realistic technology stack / tools / standards used for this
  kind of project today (feeds Chapter 5 requirements and the Implementation chapter) —
  don't default to a generic stack; pick what practitioners in this specific field
  actually use in {{current year}}.
- If the title implies hardware/components, search for real component names/specs/
  standards relevant to it.
Do all of this silently as tool calls; only the finished report content should show up
in the document, not a research log.

═══════════════════════════════════════════════════════════
PART A — NON-NEGOTIABLE FORMATTING RULES (apply to the whole document)
═══════════════════════════════════════════════════════════
FONT
- Body text: Times New Roman (or nearest equivalent), 12 pt, left-justified.
- Chapter headings ("CHAPTER 1", "INTRODUCTION" etc.): 14 pt, bold, ALL CAPS, centered.
- Section headings (e.g. "1.1 PROBLEM DEFINITION"): 12 pt, bold, ALL CAPS.
- Sub-section headings (e.g. "1.1.1 xyz"): 12 pt, bold, Sentence case.

SPACING
- Line spacing: 1.5 throughout body text.
- Space between paragraphs: double (2.0).
- Double space between a chapter title and the first sentence of that chapter, and
  between the last line of a section and the heading of the next section.
- Single space between a table/figure caption and the table/figure itself.
- Two-line space between a table/figure and the paragraph that follows it.

MARGINS & PAPER
- A4 (210 × 297 mm). Binding edge (left): 3.75 cm (1½ inch). Top, bottom, right: 2.5 cm
  (1 inch). Printed on one side only.

TABLES, FIGURES, EQUATIONS
- Numbered sequentially and chapter-wise using Arabic numerals: Table 5.3, Figure 3.11,
  Equation (4.16), captions centered. Referenced in text with the word capitalized
  ("as shown in Figure 3.11").

PAGE NUMBERING — mirrors the real reference document, NOT the older "roman-numeral
front matter" convention some written guidelines describe. Use ONE continuous Arabic
sequence for the entire generated document, starting at "1" on the Abstract page and
running unbroken through the Table of Contents, every chapter, References, and the
closing Declaration page. Centered at the bottom of every page.

CHAPTER DIVIDER PAGES — mirror the reference document exactly: every chapter starts
with its own dedicated divider page containing ONLY the chapter label, roughly
centered vertically, in the form:
  CHAPTER <N>
  <CHAPTER TITLE>
(bold, all caps, larger/emphasized — e.g. "CHAPTER 1 – INTRODUCTION"). The numbered
content of that chapter (e.g. "1. INTRODUCTION" followed by body text) then begins on
the NEXT page, not the divider page itself. Do this for every chapter and for
References. Sections/sub-sections within a chapter do NOT get their own divider pages
or page breaks — they simply flow on.

MINIMUM LENGTH — the finished document (Abstract through Declaration) must be AT LEAST
40 pages. Treat this as a hard floor, not a target to approach: if a first draft of any
chapter would land short of the per-chapter minimums in Part D, expand that chapter with
more depth (more literature sources, more sub-points, more detailed explanation) rather
than shipping a thin chapter — never pad with repetition, filler sentences, or
whitespace to hit the count.

═══════════════════════════════════════════════════════════
PART B — DOCUMENT ORDER (this generator's scope starts at Abstract, not at Title Page)
═══════════════════════════════════════════════════════════
This tool deliberately does NOT generate the Title Page, Certificate, or a front-loaded
Acknowledgement page — those carry real institutional signatures, seals, and named
approvals that shouldn't be auto-generated. The student/trainer prepends those manually
using their own college's letterhead template. This generator's output is exactly the
portion that can be honestly authored from a title alone:

1. ABSTRACT — page 1
2. TABLE OF CONTENTS — page 2 (lists every chapter/section with real page numbers,
   computed after the chapters are drafted)
3. LIST OF FIGURES — only include if the finished report actually contains ≥2 figures
4. LIST OF TABLES — only include if the finished report actually contains ≥2 tables
5. LIST OF ABBREVIATIONS — only include if ≥3 acronyms are used in the body
6. CHAPTER 1 onward — each preceded by its own divider page (see the "CHAPTER DIVIDER
   PAGES" rule in Part A) — see Part D for the chapter set (Track A or B)
7. REFERENCES — real sources found in Step 1, IEEE-style numbering, preceded by its
   own divider page like a chapter
8. DECLARATION — final page of the document (see Part C), a self-declaration by the
   student(s) affirming originality, NOT a faculty-signed certificate

This exact sequence, the divider-page pattern, and the chapter set in Part D (Track A)
are copied structurally from the reference document this tool was built from — match
that visual shape as closely as possible, not just the formatting rules in isolation.

═══════════════════════════════════════════════════════════
PART C — TEMPLATES FOR THE PAGES THIS GENERATOR DOES OWN
═══════════════════════════════════════════════════════════

--- ABSTRACT ---
ABSTRACT  [bold, centered heading]
4–6 paragraphs, ~300–450 words total, no citations, no headings inside it. Structure:
(1) the real-world problem this title addresses, (2) what the proposed system/study
does about it, (3) the core technique/method/technology used, (4) the expected outcome
and who benefits. Written entirely in your own words from the research in Step 1 — this
is the single most-read page, it must read as genuinely specific to this exact title,
not generic filler.

--- TABLE OF CONTENTS ---
Two-column table, left = title, right = page number, built AFTER the chapters exist so
numbers are real:
  Abstract ................................................ 1
  Table of Contents ....................................... 2
  [List of Figures — if present] .......................... n
  [List of Tables — if present] ........................... n
  [List of Abbreviations — if present] .................... n
  CHAPTER 1: <TITLE> .................................... n-n
      1.1 <section> ......................................  n
      ...
  CHAPTER <last>: <TITLE> ............................... n-n
  REFERENCES .............................................. n
  DECLARATION .............................................. n

--- DECLARATION (last page of the document) ---
DECLARATION  [bold, centered]
We hereby declare that the project report titled "{{PROJECT_TITLE}}" submitted in
partial fulfilment of the requirements for the award of our degree is a record of
original work carried out by us. This work has not been submitted for the award of any
other degree or diploma at any other institute or university. In accordance with
ethical practices in academic reporting, proper acknowledgments have been made wherever
the work or findings of others have been cited.
BY
[table: Name | Roll No | Sign — one row; use `[FILL: student name]` / `[FILL: roll no]`
as literal placeholder text since these cannot be known from a title alone]
Guide: [FILL: guide name]                    Head of the Department: [FILL: HOD name]
Department of [FIELD/DEPARTMENT inferred in Step 0]

═══════════════════════════════════════════════════════════
PART D — CHAPTER STRUCTURE: AUTO-SELECT TRACK A OR B FROM STEP 0
═══════════════════════════════════════════════════════════

──────── TRACK A — Software / AI / Data-driven Projects (11 chapters) ────────
This is the DEFAULT track and the exact skeleton of the reference document — use these
chapter titles verbatim unless Track B genuinely fits better. Per-chapter page counts
below are MINIMUMS (floors, not caps) and are sized so the full document clears 40+
pages even before counting the Abstract/TOC/Declaration; go longer where the topic
warrants it, never shorter.

CHAPTER 1: INTRODUCTION (minimum 4 pages)
  1.1 Problem Definition — grounded in Step 1 research, 4–5 paragraphs.
  1.2 Objective of the Project — 3–4 paragraphs.
  1.3 Scope of the Project — boundaries + a numbered "Scope Points" list (4–6 items).
  1.4 Motivation — 5–6 paragraphs.

CHAPTER 2: LITERATURE SURVEY (minimum 3 pages)
  6–8 numbered subsections, each a bolded real source title/finding as heading followed
  by one dense paragraph summarizing it in your own words (from Step 1 research —
  no invented papers).

CHAPTER 3: EXISTING SYSTEM (minimum 5 pages)
  Narrative of how this problem is solved today (6–7 numbered real approaches, one
  full paragraph each, from Step 1 research), ending in a short conclusion paragraph.
  3.1 Drawbacks of Existing System — 8–9 numbered drawbacks, one full paragraph each.

CHAPTER 4: PROPOSED SYSTEM (minimum 3 pages)
  Overview (2–3 paragraphs), then "Features" (5–6 numbered items with a full paragraph
  each), "Benefits" (bulleted, 6+ items), "User Flow" (numbered steps, 6+ steps).

CHAPTER 5: HARDWARE AND SOFTWARE REQUIREMENTS (minimum 2 pages)
  5.1 Hardware Requirements, 5.2 Software Requirements — a real, current, domain-
  appropriate stack from Step 1 research, not a generic default; list generously
  (8–12 bullets total across both) rather than the bare minimum.

CHAPTER 6: SYSTEM DESIGN (minimum 5 pages)
  6.1 System Design — architecture/workflow described in enough detail that a diagram
  could be drawn from the text; generate the actual diagram if diagramming tools are
  available in this chat.
  6.2 UML/Use-Case narrative — actor(s), system boundary, every use case as its own
  bolded sub-heading with a one-paragraph description, ending in a conclusion.

CHAPTER 7: IMPLEMENTATION (minimum 12 pages — the largest chapter, ~25–35% of body)
  Ten narrative subsections mirroring: Planning & Requirements Gathering, Architecture
  Design, Backend Development, Data/Database Management, Frontend Development,
  Integration & Testing, domain-specific core-technique integration, Deployment &
  Hosting, Launch & Usage, Maintenance & Future Enhancements — one full, substantial
  paragraph each, specific to this title's real tech stack from Step 1.
  7.1 Source Code — since no real code is supplied with a title-only input, do NOT
  fabricate a fake codebase. Instead write a clear, realistic architectural code
  outline/pseudocode structure (file/module list with one-line purpose each, covering
  every layer — data/model, backend, frontend, config) and insert
  `[FILL: paste actual source code here, organized by file]` — this keeps the report
  honest while still showing exactly what belongs here and still fills real pages.

CHAPTER 8: RESULTS (minimum 6 pages)
  For each major expected screen/output/experimental result (aim for 6–10 of them): a
  short heading, one explanatory paragraph, and `[FIGURE: <what this screenshot/result
  would show>]`.

CHAPTER 9: CONCLUSION (minimum 2 pages) — 4–5 substantial paragraphs.
CHAPTER 10: FUTURE SCOPE (minimum 2 pages) — 5–6 substantial paragraphs + a bulleted
  "FUTURE ENHANCEMENT" recap list (6–8 items).
CHAPTER 11: REFERENCES (minimum 1–2 pages) — see Part E.

──────── TRACK B — Hardware / Core-Engineering Projects (5-chapter skeleton,
expand depth via subsections, not extra top-level chapters) ────────
Page counts below are MINIMUMS, sized so the full document clears 40+ pages.

CHAPTER 1: INTRODUCTION (minimum 6 pages) — area of work, present-day scenario (from
  Step 1 research), motivation, shortcomings in prior work, objective (main +
  secondary), target specifications, project schedule, report organization — each as
  its own fleshed-out subsection, not a one-line bullet.
CHAPTER 2: LITERATURE REVIEW (minimum 6 pages) — specific discussion of the title, 6–8
  real cited works (from Step 1, one substantial paragraph each), summarized outcome,
  brief background theory, conclusions.
CHAPTER 3: PROJECT DESCRIPTION / METHODOLOGY (minimum 12 pages — the largest chapter) —
  detailed methodology, assumptions, block/circuit/one-line diagrams (describe in
  detail; generate if tools allow), component specifications and justification (from
  Step 1 research on real components/standards), tools used, preliminary analysis,
  conclusions — go deep on each subsection rather than adding new top-level sections.
CHAPTER 4: RESULTS AND DISCUSSION (minimum 8 pages) — graphical/tabular results with
  explanation, significance, deviations and justification, conclusions.
CHAPTER 5: CONCLUSION AND FUTURE SCOPE (minimum 4 pages) — summary, problem/methodology
  recap, general conclusions, significance, future scope (≥4 paragraphs, one per
  suggested extension).
REFERENCES (minimum 2 pages) — see Part E. ANNEXURES (optional) — datasheets, drawings,
  standard diagrams.

═══════════════════════════════════════════════════════════
PART E — REFERENCES
═══════════════════════════════════════════════════════════
Numbered [1], [2], [3]... in citation order. Every entry must be a REAL source
discovered in Step 1 — never invent a plausible-sounding fake citation. Format by type:

Journal/Conference: [n] Author1, Author2, "Paper Title," Journal/Conference, vol. X,
  pp. Y-Z, Year.
Book: [n] Author, "Book Title," Publisher, Edition, ISBN (only if genuinely known).
Website: [n] Topic/Page title, Site name (no long URLs).

Aim for 8–15 references. If Step 1 turns up fewer strong sources than that, include
what's real rather than padding with invented ones.

═══════════════════════════════════════════════════════════
PART F — WHAT MAKES THIS "UNIVERSAL"
═══════════════════════════════════════════════════════════
1. Field, track, terminology, tech stack, and component choices all come from Step 0's
   classification of the title plus Step 1's live research — never a hardcoded default.
2. Department name wherever it appears in the document body/Declaration reflects the
   Step 0 classification, not a fixed value.
3. If the title implies a team project, use plural "we/our" language throughout,
   otherwise singular.
4. Keep the Declaration's integrity-statement wording fixed — only the bracketed
   placeholders change; don't paraphrase it.

═══════════════════════════════════════════════════════════
PART G — GENERATION ORDER & OUTPUT
═══════════════════════════════════════════════════════════
1. Run Step 0 (classify) and Step 1 (research) as tool calls — don't skip either.
2. Draft Chapter 1 onward first (this produces the real page count and real citations).
3. Write the Abstract last-but-placed-first, referencing the finished chapters.
4. Build the Table of Contents (+ optional Lists) using real page numbers from step 2.
5. Append the Declaration page.
6. Render the assembled .docx and check the actual page count. If it is under 40 pages,
   go back and deepen the shortest chapters against their minimums in Part D (more
   literature entries, more existing-system approaches, more implementation subsections,
   more results walkthroughs) — do not proceed to step 7 until the real rendered count
   is 40+.
7. Assemble/finalize ONE .docx applying every Part A formatting rule exactly (including
   chapter divider pages), titled "{{PROJECT_TITLE}} - Project Report.docx", and present
   it as a download.
8. In your chat reply (not inside the document) give: the inferred field/track/size,
   total page count, how many real references were found, and a one-line list of every
   `[FILL: ...]` tag left in the document for the student to complete.

═══════════════════════════════════════════════════════════
INPUT
═══════════════════════════════════════════════════════════
Project Title: {{PROJECT_TITLE}}
```
