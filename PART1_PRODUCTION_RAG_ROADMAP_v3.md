# Legal Assist RAG: Part 1 Roadmap v3 (Clean Slate, Production-Style, Local)

> Living document. Work through the phases in order, tick the boxes as you go, and let your workspace agent expand any part into a detailed spec (see Section 0.3).
> This file contains **tasks and agent prompts, not code**. RAG systems need short, targeted code; the hard part is making the right decisions and measuring them.

---

## 0. How to use this file

### 0.1 The working loop (repeat for every part)
1. Paste the **Global Agent Preamble** (Section 5) at the start of each agent session.
2. Paste the **Agent prompt** of the part you are working on.
3. Review the agent's plan before it edits anything; approve, then let it implement.
4. Review the diff. Run the "Done when" checks yourself.
5. Tick the checkbox, commit with a clear message, and (for retrieval or generation changes) log the result in the **Experiment Log** (Section 14).

### 0.2 Golden rules
- **One change at a time, then re-run the eval.** Never stack three upgrades and then wonder which one helped.
- **Measure before and after.** No number, no claim.
- **Never commit secrets, vector DBs, logs, or model weights.**
- **Keep the simple pipeline working at all times.** It is your fallback and your baseline.
- **Do not build what the evals don't justify.** Saying "I tried X, it didn't help, so I dropped it" is a strength.

### 0.3 Prompt for expanding any part into a detailed spec
```text
Read docs/roadmap/PART1_PRODUCTION_RAG_ROADMAP_v3.md. Expand Part <X.Y> into a
detailed implementation spec: exact files to create or change, function/module
responsibilities, data formats, edge cases, test cases, and acceptance checks.
Do NOT implement yet. Save the spec as docs/specs/<X.Y>-<short-name>.md and show me
a summary of the open questions you need me to decide.
```

---

## 1. Goal and scope

**Goal of Part 1:** Build a **production-style RAG system, running locally**, with measured quality, clean architecture, tests, observability, and containerized packaging. (Part 2 = agentic layer. Part 3 = deployment.)

**What "production-style" means here**
- Curated, versioned corpus (~100 PDFs) with rich metadata and an incremental ingestion pipeline.
- Structure-aware chunking, hybrid retrieval, reranking, metadata filtering.
- Grounded answers with passage-level citations and abstention.
- A golden evaluation set, automated metrics, and an ablation table with real numbers.
- Hardened API (config, auth, rate limits, injection defenses), tests, tracing, Docker, CI.

**Approach: clean slate.** Everything in the old project directory is deleted (after one full backup copy outside the repo) and the project is rebuilt from scratch in the same repository. Problems found in the old system are treated as design requirements for the new code. After Part 1 comes Part 2 (agentic RAG), then Part 3 (deployment); see Section 15.

**Non-goals for Part 1**
- Scraping pipelines, fine-tuning, Kubernetes, queues, multi-tenant accounts, Graph RAG, agents (agents are Part 2).
- Cloud deployment (Part 3).

**Honest framing for the resume:** "production-grade architecture and practices at portfolio scale", not "production-proven".

---

## 2. Status tracker

| Phase | Name | Rough effort* | Status |
|---|---|---|---|
| 0 | Clean slate and foundation (delete old, build skeleton) | 2-3 days | [ ] |
| 1 | Corpus and metadata | 3-5 days | [ ] |
| 2 | Ingestion pipeline | 4-6 days | [ ] |
| 3 | Evaluation framework and baseline | 3-5 days | [ ] |
| 4 | Retrieval upgrades (measured) | 5-8 days | [ ] |
| 5 | Generation and trust | 3-5 days | [ ] |
| 6 | API, security, frontend | 4-6 days | [ ] |
| 7 | Observability and testing | 3-4 days | [ ] |
| 8 | Packaging and CI | 2-4 days | [ ] |
| 9 | Documentation and resume artifacts | 2-3 days | [ ] |

\*Rough working days of focused effort, with agent assistance. Your real pace will vary. Phase 3 (golden set authoring) starts as soon as Phase 1 finishes and can overlap Phase 2.

---

## 3. Target architecture (text diagram)

```text
INGESTION PATH (batch, offline)
  data/raw PDFs + manifest
      -> validate manifest
      -> parse (text, structure, page numbers; OCR fallback)
      -> clean (headers/footers/page numbers)
      -> normalized JSON per document (data/processed)
      -> chunk (strategy per doc type) + attach metadata
      -> embed (dense) + sparse index (BM25)
      -> upsert to vector store (idempotent, hash-based)

QUERY PATH (online)
  user question (+ conversation history)
      -> query understanding (rewrite to standalone, detect section/article refs,
         expand abbreviations, old->new law mapping)
      -> metadata filters (domain, status=in_force, doc_type)
      -> hybrid retrieval (dense + sparse, fused)
      -> rerank (cross-encoder) -> top 5-8 passages
      -> confidence check (abstain if weak)
      -> generation (grounded prompt, numbered passages)
      -> citation validation -> structured streaming response
      -> trace + logs

EVAL PATH (offline + CI)
  golden set -> run pipeline under a config -> metrics + per-category report
      -> experiment log -> regression gate in CI
```

---

## 4. Target repository layout

```text
.
├── README.md
├── DESIGN.md                    # architecture decisions and rejected alternatives
├── EVAL.md                      # eval methodology and results
├── docs/roadmap/                # this roadmap
├── .env.example
├── docker-compose.yml
├── Makefile (or task runner)
├── data/
│   ├── raw/{legal,banking}/     # source PDFs (tracked or backed up; not the index)
│   ├── processed/               # normalized parsed JSON (gitignored)
│   └── manifest.yaml            # source of truth for the corpus
├── eval/
│   ├── golden/                  # dev.jsonl, test.jsonl (versioned)
│   ├── runs/                    # result JSON + markdown reports
│   └── experiment_log.md
├── src/legal_rag/
│   ├── config/                  # settings, prompts (versioned files)
│   ├── ingestion/               # parsers, cleaners, chunkers, indexer, CLI
│   ├── retrieval/               # vector store interface, hybrid, rerank, query understanding
│   ├── generation/              # prompt building, citations, abstention
│   ├── api/                     # FastAPI app, schemas, routes, middleware
│   ├── observability/           # logging, tracing
│   └── eval/                    # runner, metrics, judges
├── tests/
├── frontend/
├── notebooks/                   # optional: throwaway experiments only
└── docs/specs/                  # detailed per-part specs generated by the agent
```

---

## 5. Global conventions and Global Agent Preamble

**Conventions**
- Python package under `src/legal_rag/`; one responsibility per module.
- All tunables (model names, k, thresholds, paths, chunk settings) live in config/env, never hardcoded.
- Prompts live in versioned files, not inline strings.
- Retrieval returns **structured results** (text, doc_id, title, section, page, score, metadata), never pre-joined strings. This keeps the door open for Part 2 (agentic tools).
- Every index records the **config fingerprint** (embedding model, chunk strategy version, parser version).
- Branch per phase (`phase-2-ingestion`); small, descriptive commits.

**Global Agent Preamble (paste at the start of every session)**
```text
You are helping me upgrade a Legal/Banking RAG project into a production-style RAG
system. Context file: docs/roadmap/PART1_PRODUCTION_RAG_ROADMAP_v3.md (the plan). This is a
new project built from a clean slate. Rules:
1. First produce a short plan and list the files you will touch. Wait for my approval
   before editing.
2. Change one thing at a time. Keep changes small and reviewable.
3. Never print, log, or commit secrets. Never commit data/processed, vector DB files,
   logs, or model weights.
4. All tunables go through config/env. Prompts go in versioned prompt files.
5. Retrieval functions return structured results, not formatted strings.
6. Add or update tests for what you change, and run them. Report results honestly,
   including anything that failed or that you could not verify.
7. If something is unknown, say UNKNOWN instead of guessing. Do not invent library
   APIs or model IDs; check the installed version or docs first.
8. At the end, summarize: what changed, how to verify, what is left.
```

---

# PHASE 0: Clean Slate and Foundation

**Goal:** Wipe the old project and build the new foundation correctly from the first commit. Core design requirements from day one: heavy components loaded once at startup, thread-safe streaming, non-blocking request handling, bounded sessions, all configuration in env/settings, and no artifacts or secrets in git.
**Resume signal:** Clean engineering basics, a professional repo from commit one.

**Approach (clean slate)**
- Same GitHub repo (the link is already on your resume), but **everything in the working directory is deleted** and the project is rebuilt from scratch.
- **One backup only:** a full copy of the old project folder outside the repo. No backup branches, no tags.
- Git history is kept by default (the wipe is just a new commit on top). An optional history reset is described at the end of 0.1.
- The old project is reference material only. It is not a spec to preserve.

**What you copy back from the backup, and when (nothing is kept in the repo now)**
- Phase 1: the PDFs you still want (old IPC/CrPC/IEA files come back marked as superseded).
- Phase 6: the frontend, as a starting point.
- Ideas worth re-implementing cleanly (never copy old code): the voice feature, the RAG-vs-base comparison, the two domains (legal, banking).

## 0.1 Backup, total wipe, key rotation
**Do (you)**
1. **Rotate the Groq API key** in the Groq console and update your local `.env`.
2. **Copy the entire project folder** to a location outside the repo (e.g. `Legal-Assist-OLD`). Open it and confirm the PDFs, frontend, and notebooks are inside.
3. **Copy this roadmap file somewhere outside the repo.** The wipe deletes it from the repo; you will put it back right after.

**Do (agent)**
4. Discard uncommitted changes, create the working branch `rebuild`, remove **all tracked files** (`git rm -r`), and leave only `.git`.
5. Add only a minimal `README.md` and a correct `.gitignore`.
6. Check history for a committed full-length key, then make one commit.

**Do (you, after the agent's commit)**
7. Create `docs/roadmap/`, place the roadmap file there, and commit.

**Agent prompt**
```text
Step 0.1, total wipe. Scope: only this step. Do not start 0.2.
I have already copied the whole project folder outside the repo as a backup, so do
not create backup branches or tags.
1. Discard any uncommitted changes. Create and switch to a branch named `rebuild`
   from the current HEAD. Do not delete other branches; ignore them.
2. Remove ALL tracked files with git rm -r (code, notebooks, data, frontend, docs,
   logs, chroma folders, everything). Leave only .git. Confirm the working directory
   contains nothing else (also delete untracked leftovers such as vector DB folders
   after listing them to me).
3. Add only a minimal README.md (project name and "rebuild in progress") and a
   correct .gitignore (env files, vector DBs, logs, data/processed, caches, model
   weights, node_modules, venvs).
4. Run `git log -S "gsk_" --oneline` and report whether any full-length key appears
   in history (matches only; never print the key). If one does, stop and tell me.
5. Show git status, make one commit, and wait for my approval.
```
**Done when:** the repo contains only `README.md`, `.gitignore`, and `.git`; you have placed the roadmap file in `docs/roadmap/`; the backup folder is verified.

**Optional: reset history (only if you want a spotless repo; destructive and irreversible)**
Do this only after the backup is verified, and read it before running. It replaces all history with a single commit and force-pushes over the remote.
```text
git checkout --orphan clean-main
git rm -rf .
(add the new README.md, .gitignore, docs/roadmap/)
git commit -m "Initial commit"
git branch -D main
git branch -m main
git push -f origin main
```
Old commits can remain reachable on GitHub for a while (forks, cached views), so rotating any exposed key matters either way.

## 0.2 New skeleton and tooling
**Do**
- Create the Section 4 layout (empty packages with short README stubs, `tests/`, `eval/`, `docs/specs/`).
- Correct `.gitignore` (vector DBs, logs, processed data, caches, env files, model weights).
- `.env.example` (names only), `Makefile` stub (setup, run, test, lint), pre-commit with formatting, linting, and **secret scanning**.
- Dependency management with a lock file; runtime vs dev dependencies; one documented way to run everything from the repo root.

**Agent prompt**
```text
Step 0.2. Scope: only this step. Create the repo skeleton from roadmap Section 4,
a correct .gitignore, .env.example (names only), a Makefile stub (setup, run, test,
lint), and a pre-commit config with formatting, linting, and secret scanning. Set up
dependency management with a lock file, split runtime and dev dependencies, and
verify a fresh virtual environment install works. Add a minimal "hello" test and
confirm `make test` and `make lint` pass. Show the plan first.
```
**Done when:** fresh clone -> `make setup` -> `make test` works; pre-commit blocks a fake secret.

## 0.3 Configuration and LLM client foundation
**Do**
- One typed settings module (env-driven): LLM provider and model, embedding model, k values, thresholds, paths, CORS origins, limits.
- A thin **LLM client interface** so provider and model are config, not code. **Verify the model ID actually exists** on the provider before using it.
- Secrets only from env; never logged.

**Agent prompt**
```text
Step 0.3. Scope: only this step. Create a typed settings module (env-driven) covering
LLM provider/model, embedding model, retrieval parameters, paths, CORS origins and
limits, with validation and safe defaults. Create an LLM client interface with one
provider implementation. Before choosing a default model name, verify it against the
provider's current model list or a minimal API call and report what you found; do not
guess model IDs. Ensure settings never expose secrets in logs or repr. Add tests for
settings validation and secret masking.
```
**Done when:** changing the model is a one-line env change; invalid settings fail fast with a clear message.

## 0.4 Application skeleton built right
**Do**
- FastAPI app with **startup-time loading** (lifespan) of heavy components: embedding model, vector store client, LLM client. Nothing heavy is created per request.
- `/health` (liveness) and `/ready` (readiness: models loaded, store reachable).
- Consistent error model and correct HTTP status codes from the start.
- Request IDs and basic structured logging.

**Agent prompt**
```text
Step 0.4. Scope: only this step. Create the FastAPI app skeleton with a lifespan
handler that initializes shared components once (placeholders where components do not
exist yet, behind interfaces), /health and /ready endpoints, a consistent error
response model, request-ID middleware, and structured JSON logging. Add tests
verifying that components are initialized once (not per request) and that /ready
reflects dependency state.
```
**Done when:** app starts, readiness reflects reality, tests prove once-only initialization.

## 0.5 Streaming and concurrency built right
**Do**
- Thread-safe token streaming (SSE) with structured events: `token`, `done`, `error`.
- Background work is awaited; errors propagate to the client; client disconnects are handled.
- LLM calls have timeouts and retries with backoff.
- Session store interface with **TTL and a max-size cap** from day one (in-memory implementation).
- Heavy or blocking work never runs on the event loop.

**Agent prompt**
```text
Step 0.5. Scope: only this step. Implement the streaming layer and LLM-call
resilience: thread-safe SSE streaming with token/done/error events, awaited background
tasks, error propagation, client-disconnect handling, timeouts and retries with
backoff for the LLM client, and a SessionStore interface with an in-memory
implementation that has TTL and a size cap. Use a fake LLM for tests. Add tests for:
an error mid-stream reaches the client, two concurrent requests do not block each
other, sessions expire, and the cap evicts or rejects as designed.
```
**Done when:** the concurrency and error-path tests pass.

## 0.6 Walking skeleton (thin end-to-end path)
**Do**
- Wire the thinnest possible path: load one or two PDFs, simple chunking, embed, store, retrieve, generate, stream. Everything sits behind the interfaces defined above.
- Purpose: prove the plumbing and give the frontend something to call. It is **deliberately basic**; Phase 2 and Phase 4 replace its internals.
- Test the path with a fake or mocked LLM and a tiny embedder.

**Agent prompt**
```text
Step 0.6. Scope: only this step. Build a minimal end-to-end walking skeleton:
ingest 1-2 sample PDFs with the simplest parser and fixed-size chunking, embed with a
small model, store in the vector store behind its interface, and expose POST
/v1/ask that retrieves and streams an answer with source references. Keep every
component behind an interface so later phases can replace it. Add an integration test
using a tiny fixture and a fake LLM. Do not add hybrid search, reranking, or
evaluation yet.
```
**Done when:** `curl` to `/v1/ask` streams an answer with sources; integration test passes. Phase 0 is complete.

---

# PHASE 1: Corpus and Metadata

**Goal:** A curated, well-described corpus of ~100 PDFs with a manifest as the source of truth.
**Resume signal:** Data curation, versioning, and legal-currency awareness.

## 1.1 Corpus plan (~100 documents)
Suggested composition (adjust to your interest; quality over quantity):

| Category | Target count | Notes |
|---|---|---|
| Core criminal law (BNS, BNSS, BSA) | 3 | Current law; in force since 1 July 2024 |
| IPC to BNS / CrPC to BNSS / IEA to BSA mapping tables | 3-5 | Official or authoritative comparison tables |
| Older criminal statutes (IPC, CrPC, IEA) | 3 | Keep, but mark `superseded` with `superseded_by` |
| Constitution of India | 1 | |
| Other key statutes (RTI, DV Act, Consumer Protection, IT Act, Contract Act, etc.) | 10-15 | Choose by the questions you want the system to answer |
| Landmark Supreme Court judgments (full text) | 30-40 | Full judgments only, no 1-page stubs |
| RBI master directions and circulars | 8-12 | KYC, fair practices, ombudsman, etc. |
| Banking statutes and schemes (BR Act, PMJDY, MUDRA, etc.) | 8-12 | |
| FAQs / explainers (official) | 5-8 | Useful for plain-language retrieval |

**Do**
- Prefer **official sources** (India Code, e-Gazette, Supreme Court, RBI). Record the source URL for every file.
- Collect judgments as **PDFs** from official court sites. If an Indian Kanoon API key is approved later, it can be an optional extra source (`source_type: api_text`, which skips the parsing step). The pipeline never depends on it. Do not commit API-fetched text; check their terms.
- Drop or replace the 1-4 page High Court stubs.
- Decide whether each document is "in force", "superseded", or "amended".

**Agent prompt**
```text
Create docs/corpus_plan.md from the table in roadmap section 1.1: list each target
document (title, type, domain, year, likely official source site) as a checklist I can
tick when I download it. Do not download anything. Propose any important documents I
might be missing for common legal and banking questions, marked as suggestions.
```
**Done when:** a checklist of ~100 documents exists and you have downloaded them into `data/raw/...`.

## 1.2 Metadata schema
**Document-level fields:** `doc_id` (stable slug), `title`, `doc_type` (statute, constitution, judgment, rule, circular, master_direction, scheme, faq, mapping_table), `domain` (legal/banking), `jurisdiction`, `authority_or_court`, `year`, `date`, `case_citation` (for judgments), `act_name`, `status` (in_force/amended/superseded/repealed), `effective_from`, `superseded_by`, `version`, `language`, `source_url`, `source_type` (pdf or api_text), `file_hash`, `page_count`, `text_quality`.
**Chunk-level fields:** `doc_id`, `chunk_id`, `section_or_article_no`, `heading_path`, `page_start`, `page_end`, `paragraph_no` (judgments), `chunk_type`, `parent_id`, `config_fingerprint`.

**Agent prompt**
```text
Define the metadata schema in roadmap section 1.2 as typed models (pydantic) in
src/legal_rag/ingestion/schema.py, with validation rules (required fields, allowed
enums, date formats). Write docs/metadata_schema.md explaining every field and why it
exists. No ingestion logic yet.
```
**Done when:** schema models and documentation exist; enums are agreed.

## 1.3 Manifest and folder conventions
**Do**
- `data/manifest.yaml` has one record per document using the schema. It is the **source of truth**; the vector DB is derived and rebuildable.
- Naming convention: `data/raw/<domain>/<doc_type>/<doc_id>.pdf`.
- A `validate` command checks: unique IDs, file exists, hash matches, required fields present, enums valid, superseded links resolve.

**Agent prompt**
```text
Implement manifest loading and a `validate` command (no parsing/indexing yet). It must
check unique doc_ids, file existence, SHA-256 hash match, required fields, valid
enums, and that every superseded_by reference points to an existing doc_id. Provide a
helper that scans data/raw and drafts manifest entries (title guessed from filename,
hash computed, other fields blank) so I can fill them in. Add tests with tiny fixture
files.
```
**Done when:** `validate` passes on the real manifest; the helper drafted initial entries and you completed them.

## 1.4 Old-to-new law mapping
**Do**
- Source the official IPC to BNS (and CrPC to BNSS, IEA to BSA) mapping tables.
- Keep them in two forms: indexed as documents (so retrieval can find them) **and** as a structured lookup file (e.g., `data/mappings/ipc_to_bns.json`) for deterministic lookup in query understanding.

**Agent prompt**
```text
Design the structured format for old-to-new section mappings (old act, old section,
new act, new section, notes on changes) and write a loader plus a lookup function with
tests. Include a script that drafts the JSON from a mapping-table PDF's extracted
text; I will manually verify entries. Do not guess mappings; mark unverified entries
clearly.
```
**Done when:** lookup works for a verified sample; unverified entries are flagged.

## 1.5 Corpus quality report
**Do**
- For each PDF, measure extractable text per page and flag scanned or low-text files for OCR.
- Spot-check 10 documents manually for extraction quality (tables, columns, headers/footers).

**Agent prompt**
```text
Write a corpus QA script that, for every PDF in the manifest, reports page count,
average characters per page, fraction of near-empty pages, and a text_quality rating.
Flag files needing OCR. Output docs/corpus_report.md with a table. Do not modify
files.
```
**Done when:** report exists; OCR-needed files are listed; manifest `text_quality` filled.

---

# PHASE 2: Ingestion Pipeline

**Goal:** An idempotent, versioned, config-fingerprinted ingestion pipeline with pluggable chunking.
**Resume signal:** Data engineering for RAG, idempotency, designing for change.

## 2.1 Vector store abstraction and choice
**Do**
- Define a thin interface: `upsert(chunks)`, `delete_by_doc_id`, `search(dense, sparse, filters, k)`, `count`, `list_docs`.
- Default choice: **Qdrant** (local via Docker) for payload filtering and hybrid support; optionally keep a Chroma adapter for comparison.
- Single collection with `domain`, `doc_type`, `status` payload filters (recommended) rather than one collection per domain.
- Store the index config fingerprint in collection metadata; refuse to mix fingerprints.

**Agent prompt**
```text
Introduce a VectorStore interface in src/legal_rag/retrieval/store.py and implement a
Qdrant adapter (local Docker instance, docker-compose service) supporting upsert,
delete by doc_id, filtered search, count, and listing doc_ids. Include payload
indexes for domain, doc_type, status, and doc_id. Store a config fingerprint and
raise a clear error on mismatch. A Chroma adapter is optional and can be added later
for comparison. Add integration tests using a
test collection.
```
**Done when:** store interface and Qdrant adapter pass tests; fingerprint check works.

## 2.2 Parsing and cleaning layer
**Do**
- Parser interface with a default implementation (candidates: Docling or PyMuPDF; pick by testing on your worst PDFs).
- OCR fallback for low-text pages.
- Cleaning: remove repeated headers/footers and page numbers, fix hyphenation and whitespace; **preserve page numbers and structural cues** (section headings, numbered paragraphs).
- Save a **normalized JSON per document** in `data/processed/` so re-chunking never needs re-parsing.

**Agent prompt**
```text
Implement a parser interface and a default PDF parser that outputs a normalized JSON
per document: pages -> blocks (text, type guess such as heading/paragraph/table,
page number). Add header/footer removal by detecting repeated lines across pages,
page-number removal, and de-hyphenation. Add an OCR fallback for pages with very low
text yield. Compare two candidate parsers (e.g., Docling vs PyMuPDF) on 5 of my
hardest PDFs (a statute, a long judgment, a RBI circular with tables, a scanned file)
and write docs/parser_comparison.md with observations. Recommend one; do not decide
for me.
```
**Done when:** parser comparison done; chosen parser produces clean normalized JSON for the whole corpus.

## 2.3 Chunking strategies (pluggable, versioned)
**Do**
- Strategy interface so the eval can compare strategies:
  - **S0 baseline:** fixed recursive splitting (e.g. 800/150).
  - **S1 statutes:** split by Section/Article; keep heading path; keep sub-clauses and provisos together; split overly long sections with small overlap.
  - **S2 judgments:** split by numbered paragraphs and, where detectable, structural parts (facts, issues, reasoning, holding); respect token limits.
  - **S3 circulars/master directions:** heading-based splitting.
- **Contextual prefix:** embed text prefixed with a short context line (document title + heading path); store the raw text separately for display and generation.
- **Parent-child:** small chunks for matching, larger parent text for context (optional, test it).
- Size chunks by **tokens**, within the embedding model's max length.

**Agent prompt**
```text
Implement a Chunker interface and strategies S0 (fixed recursive baseline), S1
(statute section/article-aware), S2 (judgment paragraph-aware), and S3 (heading-based
for circulars). Each chunk must carry the metadata in roadmap section 1.2, including
section_or_article_no, heading_path, page_start/page_end. Support an optional
contextual prefix used only for embedding. Add a strategy_version string that feeds
the config fingerprint. Write unit tests using small fixture texts that verify chunk
boundaries (e.g., a section with provisos stays together; a numbered paragraph is not
split mid-sentence). Add a command that prints chunk statistics per document
(count, size distribution) for review.
```
**Done when:** all strategies produce valid chunks for the corpus; stats reviewed; you spot-checked chunks from each document type.

## 2.4 Embedding and indexing
**Do**
- Configurable embedding model; batched, normalized embeddings; cache by chunk content hash.
- Build the **sparse (BM25-style)** index alongside dense vectors.
- Upsert chunks with full payload; record config fingerprint (embedding model + chunk strategy version + parser version).

**Agent prompt**
```text
Implement the indexing step: for each document, chunk using the configured strategy,
compute dense embeddings in batches with a content-hash cache, build sparse
representations for hybrid search, and upsert to the VectorStore with full metadata
payload. Record the config fingerprint (embedding model name, chunk strategy and
version, parser version). Provide progress logging and a final summary (docs, chunks,
time, skipped-by-cache).
```
**Done when:** the full corpus is indexed; counts match expectations; re-running without changes does nothing.

## 2.5 Ingestion CLI and idempotency
**Do**
- Commands: `validate`, `add <pdf>`, `update <doc_id>`, `remove <doc_id>`, `list`, `reindex --all`, `verify` (manifest vs index consistency), `--dry-run`.
- Hash-based change detection: only new/changed docs are processed; `update` deletes the old chunks by `doc_id` first.
- Changing embedding model or chunk strategy changes the fingerprint and requires `reindex --all`.

**Agent prompt**
```text
Build the ingestion CLI with commands validate, add, update, remove, list, reindex
--all, verify, and a --dry-run flag. Behavior: hash-based change detection against the
manifest and index; update replaces all chunks for a doc_id atomically-as-possible;
remove deletes chunks and marks the manifest; verify reports docs in manifest but not
in the index and vice versa. Running the same command twice must produce no changes.
Print a clear summary table at the end of each command.
```
**Done when:** add/update/remove cycle works; idempotency demonstrated; `verify` passes.

## 2.6 Ingestion tests
**Agent prompt**
```text
Write tests for the ingestion pipeline using tiny fixture PDFs/texts: metadata
completeness on every chunk, idempotency (second run no-op), update replaces old
chunks, remove deletes them, fingerprint mismatch is rejected, and a low-text page
triggers the OCR/flag path. Keep tests fast (no large models; use a tiny or mocked
embedder).
```
**Done when:** tests pass in under a couple of minutes.

---

# PHASE 3: Evaluation Framework and Baseline

**Goal:** Build the measuring stick before upgrading anything.
**Resume signal:** This is your biggest differentiator.

## 3.1 Golden set design (~100 questions)

| Category | Count | Purpose |
|---|---|---|
| Exact section/article lookup | 15 | Tests keyword/identifier retrieval ("What does Section X say?") |
| Conceptual statute questions | 15 | Tests semantic retrieval |
| Case-law principles | 15 | Tests judgment retrieval and long-doc handling |
| Old-vs-new law | 10 | IPC/BNS etc.; tests currency handling |
| Multi-document / multi-hop | 10 | Needs two or more sources |
| Banking procedural | 15 | KYC, complaints, schemes |
| Definitions / numbers / thresholds | 5 | Tests precision |
| Out-of-scope / unanswerable | 10 | Tests abstention |
| Ambiguous or adversarial (including prompt-injection attempts) | 5 | Tests robustness |

Optional: a small Hindi set (about 10) if you decide multilingual retrieval is in scope.

**Record fields per question:** `id`, `question`, `category`, `reference_answer` (short), `gold_doc_ids`, `gold_locations` (section/article/page), `answerable` (true/false), `difficulty`, `split` (dev/test).

**Agent prompt**
```text
Define the golden set schema (JSONL) per roadmap section 3.1 as typed models with a
validator, and create eval/golden/README.md describing categories, fields, and the
dev/test split policy (about 70/30; the test split is frozen and never used for
tuning). Do not generate questions yet.
```
**Done when:** schema and policy documented.

## 3.2 Authoring workflow
**Do**
- Use an LLM to **draft** candidate questions from sampled chunks per category; **you verify every question and gold reference against the actual PDF**.
- Stratify across documents so a few big judgments don't dominate.
- Freeze the test split once finalized; add new questions only as new versions.
- Include real unanswerable questions (topics not in the corpus).

**Agent prompt**
```text
Create a script that samples chunks from the indexed corpus per category and asks an
LLM to draft candidate question/reference-answer pairs with gold doc_id and location.
Output drafts to eval/golden/drafts/ for my manual review; never write directly to
dev.jsonl or test.jsonl. Include a small review helper that shows each draft beside
the source passage so I can accept, edit, or reject quickly.
```
**Done when:** ~100 verified questions committed (dev + frozen test).

## 3.3 Metrics and tooling
**Retrieval metrics:** hit@k, recall@k, MRR, nDCG (computed against gold doc/section IDs).
**Generation metrics:** faithfulness, answer relevance, context precision/recall (via Ragas or DeepEval, or a thin custom judge).
**System metrics:** abstention accuracy (answerable vs unanswerable), citation accuracy (does the cited passage support the claim), latency p50/p95, tokens and estimated cost per query.
**Judge rules:** judge model pinned, temperature 0, preferably different from (or stronger than) the generator; manually audit ~20 judged items to confirm the judge is reliable.

**Agent prompt**
```text
Implement the eval metrics module: retrieval metrics computed from gold IDs (hit@k,
recall@k, MRR, nDCG), generation metrics via an LLM judge (faithfulness, answer
relevance), abstention accuracy, citation accuracy, latency percentiles, and
token/cost tracking. Evaluate Ragas vs DeepEval vs a minimal custom judge on 10
questions and recommend one with reasons (cost, stability, ease of CI). Judge model,
temperature, and prompts must come from config and be recorded in each run's output.
```
**Done when:** metrics run end to end on a handful of questions; chosen framework documented.

## 3.4 Eval runner and reports
**Do**
- One command: run a named pipeline config over dev (or test) set and write `eval/runs/<timestamp>_<config>.json` plus a markdown report with **per-category breakdown**.
- A compare command that diffs two runs.
- Every run records the config fingerprint, prompt version, models, and git commit.

**Agent prompt**
```text
Build `eval run --config <name> --split dev|test` and `eval compare <runA> <runB>`.
Each run saves raw per-question results (retrieved passages, answer, citations,
scores, latency) as JSON and a markdown summary with per-category tables and the
worst 10 failing questions. Record git commit, config fingerprint, prompt version,
and model names in the output. Add an append-to-experiment-log helper.
```
**Done when:** run and compare work; reports are readable.

## 3.5 Baseline run (B0)
**Do**
- Index the new corpus with the **S0 baseline chunking + dense MiniLM + plain top-k + a simple first prompt**.
- Run on dev, record as **B0**. Do **not** touch the test split yet.

**Agent prompt**
```text
Create the pipeline config "B0_baseline": S0 chunking, all-MiniLM-L6-v2 dense
embedding, plain similarity top-k, no hybrid, no rerank, simple first prompt (v1). Run eval on
the dev split and add the result to eval/experiment_log.md as row B0. Summarize the
per-category weaknesses you observe.
```
**Done when:** B0 results are logged; weakest categories identified.

---

# PHASE 4: Retrieval Upgrades (each one measured)

**Goal:** Improve retrieval step by step, proving each step with numbers.
**Method for every part:** change one thing, re-run eval on dev, log the row, keep it only if it helps (or if it helps a category you care about at acceptable cost).

## 4.1 Chunking experiment
**Do:** Compare S0 vs S1/S2/S3, then add the contextual prefix, then test parent-child.
**Agent prompt**
```text
Create pipeline configs B1 (structure-aware chunking S1/S2/S3), B1b (B1 + contextual
prefix), and B1c (B1b + parent-child) differing only in chunking. Re-index into
separate collections or fingerprints, run dev evals, and log results. Report
per-category deltas versus B0, especially section-lookup and case-law categories.
```
**Done when:** the best chunking config is identified with evidence.

## 4.2 Embedding model bake-off
**Do:** Compare the baseline MiniLM against at least two stronger options (e.g., a multilingual BGE model and a multilingual E5 model; optionally one hosted embedding API). Judge on retrieval metrics, latency, memory, and multilingual ability.
**Agent prompt**
```text
Run a retrieval-only bake-off of 3 embedding models (baseline MiniLM plus two
candidates I approve) using the best chunking from 4.1. Report hit@k, recall@k, MRR,
nDCG, indexing time, query latency, and memory footprint in a table. Do not change
the generation step. Recommend one with reasoning.
```
**Done when:** embedding model chosen; full re-index done with the new fingerprint.

## 4.3 Hybrid search (dense + sparse)
**Do:** Add BM25/sparse retrieval, fuse with reciprocal rank fusion, tune candidate counts and weights. Expect gains on exact identifier queries ("Section 66A", "Article 21").
**Agent prompt**
```text
Add hybrid retrieval: dense + sparse candidates fused with reciprocal rank fusion,
with configurable candidate counts and weights. Create config B3 and evaluate versus
the previous best. Show per-category results, highlighting exact-section lookups, and
include 5 concrete example queries where hybrid fixed a miss and any where it hurt.
```
**Done when:** hybrid kept or rejected with data.

## 4.4 Metadata filtering and balancing
**Do**
- Default filter `status=in_force` (with an explicit way to include superseded law).
- Optional domain routing (legal vs banking) via a lightweight classifier or heuristics; only keep if it helps.
- Prevent one long judgment from dominating: per-document chunk cap or MMR-style diversification.

**Agent prompt**
```text
Add metadata filtering (default status=in_force, domain filter when determined) and a
per-document diversity cap on retrieved candidates. Add an optional lightweight
domain router; evaluate with and without it. Create config B4, run eval, and report
effects on old-vs-new and multi-document categories, plus any questions that got
worse.
```
**Done when:** filters and diversity settings decided with data.

## 4.5 Reranking
**Do:** Retrieve 30-50 candidates, rerank with a cross-encoder (local multilingual reranker and/or a hosted reranker), keep the top 5-8. Track the added latency.
**Agent prompt**
```text
Add a reranking stage behind an interface (candidates in, reordered scored passages
out). Implement one local cross-encoder reranker and, if I provide an API key, one
hosted reranker. Create config B5, tune candidate count and final k, and report
quality gain versus added latency (p50/p95). Recommend a setting within a latency
budget of about <your budget> seconds end to end.
```
**Done when:** reranker kept or rejected; latency budget documented.

## 4.6 Query understanding
**Do**
- **Conversation-aware rewriting** into a standalone question.
- **Reference detection:** regex-detect "Section N / Article N / Act name" and route to exact filters.
- **Abbreviation/synonym expansion** (IPC, BNS, CrPC, RBI, KYC, etc.).
- **Old-to-new mapping injection:** if a query references an old section, look up the new one and retrieve both.
- Multi-query or decomposition **only if** evals show a gain on multi-hop questions.

**Agent prompt**
```text
Implement a query understanding module with: (1) conversation-aware rewriting to a
standalone question, (2) detection of statute/section/article references used for
exact filtering, (3) abbreviation expansion, (4) old-to-new section mapping lookup
that adds the new-law section to the retrieval query/filter. Evaluate each component
separately (configs B6a, B6b, B6c) and report per-category results. Keep components
that help; list those that don't with the numbers.
```
**Done when:** useful components kept, others documented as tried-and-dropped.

## 4.7 Optional: multilingual retrieval check
**Do:** If Hindi or other languages matter, evaluate a small non-English question set with the multilingual embedding; consider translating queries to English as a fallback and compare.
**Agent prompt**
```text
Evaluate multilingual behavior: run my 10 Hindi dev questions against the current best
config, then against a variant that translates the query to English first. Report
retrieval and answer quality and latency for both. Recommend whether to include
translation.
```
**Done when:** a decision on multilingual scope is documented (it is fine to declare it out of scope).

## 4.8 Freeze the retrieval config
**Agent prompt**
```text
Assemble the best configuration from the experiments into config "R_final". Run it on
the dev split and then ONCE on the frozen test split. Build the ablation table
(B0 -> B1 -> ... -> R_final) in eval/experiment_log.md and EVAL.md, with per-category
numbers. Do not tune on the test split after seeing its results.
```
**Done when:** `R_final` exists; ablation table complete; test split used once.

---

# PHASE 5: Generation and Trust

**Goal:** Faithful, well-cited answers that abstain when evidence is weak.

## 5.1 Prompt redesign and versioning
**Do**
- System prompt with grounding rules, answer structure, citation format (cite passage numbers), abstention rule, and tone for non-lawyers.
- Passages presented as numbered blocks with title, section/article, page.
- Prompts are files with a version string; evals record the prompt version.
- Legal disclaimer lives in the **UI and response metadata**, not inside the model answer body.

**Agent prompt**
```text
Move all prompts into versioned prompt files. Redesign the answer prompt: numbered
context passages (with title, section/article, page), strict grounding, required
inline citations like [1][3], an abstention instruction, and concise structured
output. Keep the B0 prompt as v1 for comparison. Create config G1 with the new
prompt, run dev eval, and compare faithfulness, answer relevance, and abstention
against R_final with the v1 prompt.
```
**Done when:** new prompt version beats or matches the old on faithfulness without hurting relevance.

## 5.2 Passage-level citations
**Do**
- The model cites passage numbers; the system **validates** that cited numbers exist in the provided context.
- Map citations to human-readable references (document title, section/article, page) and, if possible, a link/anchor to the PDF page.
- Return citations as structured data in the API response (not just text).

**Agent prompt**
```text
Implement citation handling: parse inline citation markers from the model output,
validate they reference provided passages, drop or flag invalid ones, and map valid
ones to structured citation objects (doc_id, title, section_or_article, page,
snippet). Return them as a separate structured field in the response/stream. Add
tests including a model output that cites a non-existent passage. Add citation
accuracy to the eval (does the cited passage actually support the sentence).
```
**Done when:** citation accuracy is measured and reasonable; invalid citations never reach the user silently.

## 5.3 Abstention and confidence
**Do**
- Use a reranker/retrieval score threshold to decide "not enough evidence", tuned on the **dev** split using the unanswerable questions.
- Provide a helpful abstention message (what was searched, suggest rephrasing) instead of a bare refusal.

**Agent prompt**
```text
Add a confidence gate: if top reranked passage scores fall below a configurable
threshold, return an abstention response without calling the generator. Tune the
threshold on the dev split to balance abstention on unanswerable questions against
wrongly refusing answerable ones; show the precision/recall trade-off as a small
table. Record the chosen threshold in config.
```
**Done when:** abstention accuracy reported; threshold justified by a table.

## 5.4 Context budget and ordering
**Do:** Decide final number of passages, token budget, deduplication of overlapping chunks, and ordering (most relevant first/last to reduce "lost in the middle" effects). Test on the dev set.
**Agent prompt**
```text
Evaluate context assembly variants: number of passages (3, 5, 8), deduplication of
near-identical chunks, and ordering strategies. Run dev evals per variant and report
faithfulness, relevance, latency, and token cost. Recommend a setting.
```
**Done when:** context settings frozen.

## 5.5 Legal currency handling
**Do:** When a retrieved passage belongs to a superseded law, the answer notes it and points to the current equivalent (via the mapping). Citations show the status of each source.
**Agent prompt**
```text
Add status-aware answer behavior: if retrieved or user-referenced law is superseded,
include a short note naming the current equivalent (use the mapping lookup) and show
the source status in each citation object. Test with questions about IPC sections and
CrPC provisions. Add these cases to the old-vs-new category in the dev set if missing
(for my review).
```
**Done when:** old-vs-new category improves and answers mention the current law.

## 5.6 Optional faithfulness guard
**Do:** Test a post-generation claim-support check. Keep it online only if latency and quality trade-offs justify it; otherwise keep it as an offline eval-only metric.
**Agent prompt**
```text
Prototype an optional post-generation faithfulness check that flags sentences not
supported by cited passages. Measure its effect on faithfulness and the added latency.
Recommend whether it should run online, offline only, or be dropped.
```
**Done when:** decision recorded with numbers.

## 5.7 Freeze generation config
**Agent prompt**
```text
Create config "P_final" (R_final + final prompt, citations, abstention, context
settings). Run dev, then the frozen test split once, and update the ablation table and
EVAL.md. Summarize remaining failure categories.
```
**Done when:** `P_final` frozen; test results recorded.

---

# PHASE 6: API, Security, Frontend

**Goal:** A hardened, well-designed service and an honest, polished UI.

## 6.1 API contract redesign
**Do**
- Versioned endpoints (`/v1/...`) with a single `ask` endpoint taking `domain` and optional `conversation_id`.
- Streaming (SSE) with **structured events**: `token`, `citations`, `abstained`, `done`, `error`.
- Typed request/response schemas, a consistent error model, correct HTTP status codes (no errors returned as HTTP 200).
- `/health` (liveness), `/ready` (readiness), `/stats` (document and chunk counts for the UI).

**Agent prompt**
```text
Redesign the API under /v1 with typed schemas: POST /v1/ask (domain, question,
conversation_id optional) streaming SSE with structured event types (token,
citations, abstained, done, error); POST /v1/documents/upload and DELETE of an
uploaded-session; GET /health, /ready, /stats. Use proper HTTP status codes and a
consistent error body. Keep OpenAPI docs accurate. Update tests and note any
frontend changes needed.
```
**Done when:** OpenAPI docs reflect the contract; tests pass.

## 6.2 Conversation memory
**Do:** Server-side sessions with TTL and a bounded history window; integrate with query rewriting. Abstract the store so Redis can replace in-memory storage later.
**Agent prompt**
```text
Add conversation memory behind a SessionStore interface (in-memory with TTL and size
caps). Pass the last N turns into the query-rewrite step. Add tests for follow-up
questions ("what about its punishment?") resolving correctly with history, and for
session expiry.
```
**Done when:** follow-ups work; sessions expire.

## 6.3 Security and abuse controls
**Do**
- CORS limited to configured origins (not `*` with credentials).
- Simple API-key auth for admin/maintenance endpoints (and optionally for public access).
- Rate limiting per IP; request size limits; input length validation.
- Logs scrub secrets and avoid storing raw sensitive user documents.

**Agent prompt**
```text
Harden the API: restrict CORS to configured origins, add API-key auth for any
admin/maintenance endpoints, add per-IP rate limiting, enforce request size and
question length limits, and ensure logs never include secrets or full uploaded
document text. Add tests for rate limiting, oversized requests, and missing/invalid
API keys.
```
**Done when:** security tests pass.

## 6.4 Prompt-injection and upload safety
**Do**
- Treat retrieved and uploaded text as **untrusted data**: delimit it clearly in the prompt and instruct the model never to follow instructions found inside it.
- Validate uploads (type, size, page limit); sanitize filenames; clean up temp files.
- Isolate each upload session; enforce TTL and deletion.
- Build a small **injection test set** (PDFs containing hostile instructions) and measure resistance.

**Agent prompt**
```text
Implement prompt-injection defenses: wrap retrieved/uploaded context in clearly
delimited data blocks and add system instructions to ignore instructions inside
them. Add upload validation (MIME/extension, size, page cap), safe temp-file
handling, and per-session isolation. Create 5 test PDFs/texts containing injection
attempts (e.g., "ignore previous instructions and ..."), add them to the adversarial
eval category, and report how often the defenses hold.
```
**Done when:** injection tests documented with pass rate and known gaps.

## 6.4b Document-upload chat
**Do:** Reuse the same parser, cleaner, and chunker as ingestion in an ephemeral mode (in-memory index with TTL); non-blocking processing; session deletion endpoint; clear limits shown in the UI.
**Agent prompt**
```text
Build the document-upload chat to reuse the ingestion parser/cleaner/chunker and
the same retrieval and generation components, with an ephemeral per-session index
(TTL, max sessions, max size). Processing must not block the event loop. Add a
session delete endpoint and tests for TTL expiry and isolation between two sessions.
```
**Done when:** uploads use shared components; isolation tests pass.

## 6.5 Frontend fixes and honesty pass
**Do**
- Read API URL from env (remove hardcoded localhost URLs); fix the "Get Started" button; show errors in compare mode.
- Render citations with titles, section/article, page, and status.
- Show a clear disclaimer ("informational, not legal advice").
- Replace hardcoded stats with `/stats`; remove unsupported claims such as "zero hallucinations".
- Make compare mode fair (same generation settings) or clearly label what it demonstrates.
- Handle the new structured stream events.

**Agent prompt**
```text
Update the frontend to the new /v1 API and structured SSE events. Replace hardcoded
backend URLs with the env variable, fix the broken Get Started button, surface errors
in compare mode, render structured citations (title, section/article, page, status),
add a visible disclaimer, pull document/vector counts from /stats, and remove claims
of "zero hallucinations". Make compare mode use identical generation settings for
both sides or label the difference. Keep the voice feature working. List UI changes
with screenshots descriptions.
```
**Done when:** frontend works end to end with citations and honest messaging.

---

# PHASE 7: Observability and Testing

**Goal:** You can see what the system does and trust changes.

## 7.1 Structured logging
**Agent prompt**
```text
Replace print statements with structured JSON logging. Add request IDs propagated
through the pipeline and per-stage timing (query rewrite, retrieval, rerank,
generation, total). Never log secrets or full user documents. Provide log level
config.
```
**Done when:** a single request produces a coherent, timed log trail.

## 7.2 Tracing
**Do:** Self-host Langfuse (via Docker) or equivalent. Trace each request: query, rewritten query, retrieved candidates, rerank scores, final prompt, response, tokens, cost, latency. Link traces to eval runs where possible.
**Agent prompt**
```text
Integrate Langfuse (self-hosted through docker-compose) tracing for the query path:
spans for query understanding, retrieval, rerank, generation, with token usage and
cost. Make tracing optional via config so tests and CI work without it. Document how
to open the dashboard and find a trace for a given request ID.
```
**Done when:** traces visible locally for every request.

## 7.3 Minimal metrics view
**Do:** Track latency p50/p95 per stage, error rate, abstention rate, and token cost. A `/metrics` endpoint or Langfuse dashboards are enough.
**Agent prompt**
```text
Expose basic operational metrics (latency percentiles per stage, error rate,
abstention rate, tokens per request) either via a /metrics endpoint or documented
Langfuse dashboards. Keep it simple and document how to read it.
```
**Done when:** you can state p50/p95 latency and abstention rate for a test session.

## 7.4 Automated tests
**Do**
- **Unit:** chunkers, metadata, query parsing, citation validation, mapping lookup, confidence gate.
- **Integration:** ingest fixture corpus -> retrieve -> answer with a mocked LLM.
- **API:** streaming events, errors, rate limits, auth, upload limits.
- **Security:** injection cases, oversized files.
- Fixtures small and fast; the LLM mocked by default.

**Agent prompt**
```text
Audit test coverage against roadmap section 7.4. Add missing unit, integration, API,
and security tests, with the LLM and heavy models mocked by default and an opt-in
marker for slow real-model tests. Report coverage and untested risk areas honestly.
```
**Done when:** the test suite runs quickly and covers the listed areas.

## 7.5 Feedback capture and resilience
**Do:** Thumbs up/down stored with the request ID (feeds future dev-set candidates). Retries with backoff, timeouts, and an optional fallback model for LLM provider errors.
**Agent prompt**
```text
Add a feedback endpoint (thumbs up/down + optional comment tied to request_id),
stored locally and visible in traces. Add LLM-call resilience: timeouts, exponential
backoff retries, and an optional configurable fallback model. Test with simulated
provider failures.
```
**Done when:** feedback is stored; provider failures degrade gracefully.

---

# PHASE 8: Packaging and CI

**Goal:** One-command local run, and automated quality gates.

## 8.1 Docker and compose
**Do:** Multi-stage images for API and frontend; `docker-compose.yml` with API, frontend, Qdrant, and Langfuse (plus its database); volumes for data and model cache; health checks; env handling through `.env`.
**Agent prompt**
```text
Create Dockerfiles for the API and frontend (multi-stage, non-root user, small
images) and a docker-compose.yml with api, frontend, qdrant, and langfuse (with its
database). Add volumes for the vector DB and model cache, health checks, and env
configuration through .env. Verify a clean `docker compose up` brings up a working
system after running ingestion.
```
**Done when:** clean machine -> compose up -> ingest -> working app.

## 8.2 Developer experience
**Agent prompt**
```text
Add a Makefile (or task runner) with targets: setup, ingest, reindex, eval-dev,
eval-test, test, lint, run, up, down. Document each in the README quickstart.
```
**Done when:** common tasks are single commands.

## 8.3 CI pipeline
**Do:** GitHub Actions: lint, type-check, unit/integration tests, image build, and an **eval smoke test** on a tiny fixture set (mocked or small model) that fails if key metrics regress below thresholds. A manual/nightly job can run the full eval.
**Agent prompt**
```text
Create GitHub Actions workflows: (1) on push/PR: lint, type-check, tests, docker build;
(2) eval smoke test using a tiny fixture corpus and golden subset with mocked or
cheap models that fails on metric regression versus stored thresholds; (3) a
manually-triggered full eval workflow that uploads the report as an artifact. Secrets
are read from repository secrets, never from files.
```
**Done when:** CI is green; a deliberately broken change fails the smoke eval.

## 8.4 Repo safety
**Agent prompt**
```text
Add pre-commit hooks (formatting, lint, secret scanning), dependency vulnerability
scanning in CI, and a check that fails if files in data/processed, vector DB folders,
logs, or .env are staged.
```
**Done when:** a staged secret or artifact is blocked.

## 8.5 Local production rehearsal
**Do:** Follow only the README on a clean checkout; run a small concurrent load test and record p50/p95 latency and error rate; kill dependencies to see error handling.
**Agent prompt**
```text
Run a small load test (e.g., 10-20 concurrent requests over 5 minutes) against the
composed stack and report p50/p95 latency, error rate, and resource use. Then
simulate failures (vector DB down, LLM key invalid, slow LLM) and report how the API
responds. List the issues found and fix the top ones.
```
**Done when:** numbers recorded; failure behaviors are graceful.

---

# PHASE 9: Documentation and Resume Artifacts

**Goal:** Make the work legible and defensible.

## 9.1 README
**Contents:** what it is, why it's built this way, architecture diagram, quickstart (3 commands), results (ablation table summary), screenshots or GIF, limitations, roadmap (Part 2: agentic, Part 3: deployment).
**Agent prompt**
```text
Rewrite README.md for a technical reviewer: one-paragraph pitch, architecture diagram
(mermaid), quickstart via make/compose, key results table from the final eval run,
screenshots section, honest limitations, and roadmap. Remove unsupported claims. Keep
it scannable.
```

## 9.2 DESIGN.md (decision records)
**Suggested decisions to document:** vector store choice, parser choice, chunking per doc type, embedding model, hybrid search, reranker, abstention threshold, citation approach, why no scraping, why no Graph RAG/fine-tuning yet, session store, auth approach.
**Agent prompt**
```text
Write DESIGN.md as short ADRs: for each major decision state context, options
considered, decision, evidence (link to experiment rows), and consequences. Include
explicit "rejected or deferred" entries with reasons.
```

## 9.3 EVAL.md and error analysis
**Agent prompt**
```text
Write EVAL.md: golden set composition, split policy, metrics definitions, judge
setup and audit results, the ablation table, per-category results, and a failure
analysis of the 15 worst questions classified by root cause (parsing, chunking,
retrieval miss, reranking, generation, ambiguity, missing data). Include
"what I would do next".
```

## 9.4 Demo assets
**Do:** 2-3 minute screen recording or GIFs; a scripted demo covering an exact-section lookup, an old-vs-new law question, a multi-source answer with citations, an abstention case, and an injection attempt being resisted.
**Agent prompt**
```text
Write a demo script (docs/demo_script.md) with 6 questions that showcase strengths and
honest limits, the expected behavior for each, and what to point out in the UI/traces.
```

## 9.5 Resume and interview kit
**Do**
- 3-4 resume bullets with **only measured** numbers (placeholders until you have them).
- 6-8 interview stories (a bug you found, an experiment that failed, a trade-off you made).
- A list of likely interview questions with your answers written in your own words.

**Agent prompt**
```text
Using EVAL.md and the experiment log, draft 4 resume bullets with placeholders for
metrics I must fill from real results, and a list of 25 likely interview questions
about this project (retrieval, chunking, evaluation, security, trade-offs, failure
cases) with bullet-point answer outlines grounded in my actual results. Mark any
claim that lacks supporting data.
```
**Done when:** you can explain every decision and number without notes.

---

# 10. Design constraints to keep for Part 2 (agentic)

Keep these true throughout Part 1 so the agent layer slots in cleanly:
- Retrieval exposed as **typed functions with filters** returning **structured results**.
- Query understanding, retrieval, rerank, and generation are **separate callable stages**.
- The pipeline is **stateless**; conversation state is injected.
- Every stage emits **traces** (agents are hard to debug without them).
- The eval runner accepts **any callable pipeline**, so the agent can be evaluated on the same golden set.
- The simple pipeline remains available as a **fallback and comparison baseline**.

---

# 11. Open decisions (with recommended defaults)

| # | Decision | Default recommendation | Decide in |
|---|---|---|---|
| D1 | Vector store | Qdrant (local Docker) | 2.1 |
| D2 | PDF parser | Pick by test: Docling vs PyMuPDF | 2.2 |
| D3 | Embedding model | Bake-off vs MiniLM baseline | 4.2 |
| D4 | Reranker | Local cross-encoder; optionally hosted | 4.5 |
| D5 | Generator LLM | Provider-configurable; verify model ID first | 0.2 |
| D6 | Judge LLM | Pinned, temperature 0, different from generator | 3.3 |
| D7 | Eval framework | Ragas vs DeepEval vs custom, by trial | 3.3 |
| D8 | Multilingual scope | Decide from the small Hindi test | 4.7 |
| D9 | Session store | In-memory with TTL (Redis later) | 6.2 |
| D10 | Domain routing | Keep only if it measurably helps | 4.4 |

---

# 12. Out of scope for Part 1 (do not drift)

Web scraping, fine-tuning, Graph RAG, agent loops, multi-tenant accounts, admin web UI, cloud deployment, Kubernetes, message queues. If a Phase 4/5 experiment tempts you toward these, log it as a Part 2/3 idea instead.

---

# 13. Part 1 Definition of Done

- [ ] Old prototype removed; repo is free of secrets, logs, and vector DB artifacts
- [ ] ~100 curated PDFs with validated manifest and metadata
- [ ] Idempotent ingestion CLI (add/update/remove/verify/reindex) with config fingerprinting
- [ ] Structure-aware chunking with section/article/page metadata
- [ ] ~100-question golden set (dev + frozen test) with metrics and automated runner
- [ ] Ablation table from B0 to final config with per-category numbers
- [ ] Hybrid retrieval, reranking, metadata filtering, query understanding (each kept only with evidence)
- [ ] Passage-level validated citations; abstention tuned on dev data
- [ ] Legal-currency handling (old-to-new mapping) working
- [ ] Hardened API: typed contract, auth for admin, rate limits, CORS, injection defenses
- [ ] Structured logging, tracing, minimal metrics, feedback capture
- [ ] Unit, integration, API, and security tests passing
- [ ] Docker compose one-command run; CI with eval regression gate
- [ ] README, DESIGN.md, EVAL.md, demo script, resume/interview kit
- [ ] Every claim in the README backed by a logged experiment

---

# 14. Experiment log template (copy into eval/experiment_log.md)

| Run | Date | Config summary | Hit@5 | Recall@8 | MRR | Faithfulness | Answer rel. | Abstention acc. | Citation acc. | p50 / p95 latency | Cost/query | Keep? | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| B0 | | S0 + MiniLM + dense top-k + prompt v1 | | | | | | | | | | baseline | |
| B1 | | + structure-aware chunking | | | | | | | | | | | |
| B1b | | + contextual prefix | | | | | | | | | | | |
| B2 | | + embedding model change | | | | | | | | | | | |
| B3 | | + hybrid (dense + sparse, RRF) | | | | | | | | | | | |
| B4 | | + filters / diversity | | | | | | | | | | | |
| B5 | | + reranker | | | | | | | | | | | |
| B6 | | + query understanding | | | | | | | | | | | |
| G1 | | + new prompt + citations | | | | | | | | | | | |
| P_final | | + abstention + context settings | | | | | | | | | | | |

**Per-category table (repeat per key run):** one row per golden-set category with the same metrics, so you can show exactly where each upgrade helped.

**Rules:** log failures too; never tune on the test split; note the git commit for every row.

---

# 15. After Part 1: Part 2 and Part 3

**Part 2: Agentic RAG (local)** starts only after Part 1's Definition of Done. Outline:
1. Expose retrieval as typed tools (statute search, case-law search, banking search, old-to-new mapping lookup).
2. Add routing (classify the question type and pick sources).
3. Add a bounded agent loop (plan, retrieve, grade evidence, retry or answer) with hard step limits and fallback to the Part 1 pipeline.
4. Extend the golden set with multi-hop questions, trace-level checks, and evaluate **agent vs pipeline** on quality, latency, and cost.
The design constraints in Section 10 exist so this slots in without rewrites.

**Part 3: Deployment** follows Part 2 (or Part 1 as an optional first milestone):
1. Choose hosting (free tier, small VPS, or similar) based on budget.
2. Deploy the Docker images, set up CI/CD, secrets management, and a public demo.
3. Add monitoring and alerts, a README demo section, and a live-demo script.

A separate roadmap file will be written for each of these when Part 1 is done.
