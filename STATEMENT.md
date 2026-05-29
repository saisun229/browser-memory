# Personal Statement — Browser Memory

## The Problem

I read a lot. Documentation, blog posts, research papers, articles — I constantly accumulate insights worth keeping. But I never actually keep them. Bookmarks lose all context. Note-taking apps require a context switch that kills reading flow. And search engines only work when you remember what you're searching for.

What I actually want is simple: highlight something while reading, forget about it, and then weeks later ask *"what was that thing I read about database migrations?"* and get a direct answer with a link back to the source.

That's Browser Memory. It's a Chrome Extension that turns your browser into a queryable personal knowledge base — no cloud sync, no account, no backend. Just your reading, made searchable.

---

## Engineering Trade-offs

### Storage: Dexie (IndexedDB) vs chrome.storage.local

My first instinct was `chrome.storage.local` — zero dependencies, native API. But it caps at 10MB and has no migration story. The moment I knew I'd be storing embeddings (each snippet carries two 1536-dimensional float32 vectors ≈ 12KB per record), that limit became real. IndexedDB is effectively unbounded at prototype scale:

- 1,000 snippets ≈ 12MB
- 10,000 snippets ≈ 120MB
- Both well within what browsers allow without prompting the user

I wrapped IndexedDB with Dexie for its Promise/async-await API and versioned `db.version()` migrations. One extra dependency in exchange for readable code and a safe schema evolution path — worth it.

### Embeddings: OpenAI API vs Local Models

The alternative to `text-embedding-3-small` was running a model locally via Transformers.js or ONNX. I chose the API deliberately:

- Local models are 50–100MB downloads — not appropriate for a browser extension
- Running WASM inference in a service worker adds 2–5 seconds of latency per save, which kills the interaction feel
- OpenAI's API is ~300ms, cheap (fractions of a cent per snippet), and produces high-quality 1536-dim vectors

The trade-off: requires an internet connection and an API key. For a prototype, that's fine. For a production tool, a smaller distilled local model (e.g. nomic-embed-text at 137M params) becomes worth the complexity once the UX around loading is handled properly.

### Search: Dense Cosine Similarity vs Hybrid / Sparse

I considered BM25 or sparse embeddings alongside dense retrieval — hybrid search outperforms pure dense in benchmarks when users search with exact keywords. I decided against it for two reasons:

1. Storing a sparse matrix per snippet (potentially thousands of non-zero dimensions) would significantly increase storage cost and query complexity
2. Personal saved content has a different distribution than web search — the user knows roughly what they saved, and semantic intent usually wins over keyword matching

The more impactful decision was **embedding the page title separately** from the snippet text, then scoring with `max(textSimilarity, titleSimilarity)`. This surfaced a real failure mode: a saved quote from a "Famous Einstein Quotes" page never mentioned Einstein in the quote itself — only in the title. Cosine similarity against the text alone returned nothing. Against the title, it matched perfectly.

This was a deliberate product choice: titles carry context that body text doesn't, and treating them as independent signals rather than concatenating them into one embedding allows each to contribute its strongest match independently.

### Chrome MV3 Service Worker Constraint

Chrome's Manifest V3 mandates that background scripts run as service workers — ephemeral processes that Chrome can terminate at any time. This eliminates persistent in-memory caches. Every query re-reads all snippets from IndexedDB and recomputes cosine similarity from scratch.

For the current scale (hundreds of snippets), this is fast — IndexedDB reads are synchronous from the browser's cache and the linear scan over 1536-dim vectors is cheap.

### Privacy-First: No Backend

All snippet data lives in the user's browser. The only external calls are to OpenAI. This was a product decision as much as an architectural one — personal reading data is sensitive, and the absence of any sync infrastructure means there's nothing to breach, no account to lose, and no service to go down. The trade-off is no cross-device access, but that's a solvable problem at product maturity (end-to-end encrypted sync) rather than a prototype concern.

---

## How Far Can It Scale?

The current linear cosine scan holds up to roughly 5,000–10,000 snippets before query latency becomes user-perceptible. Beyond that, the right path is:

1. **ANN indexing** — HNSW in a Web Worker (hnswlib-wasm), keeping the UI thread free
2. **Chunking** — split long saved passages into overlapping 256-token chunks before embedding, rather than embedding the whole block as one vector
3. **Reranking** — a second-pass cross-encoder reranker (small, could run locally) over the top-20 cosine results before passing top-5 to the LLM

---

## What It Could Become

This prototype is the core of a passive reading intelligence layer. The embedding infrastructure is already in place. The interesting product surface is what gets built on top:

- **Reading habit insights** — time-on-page + saved content → what topics the user actually engages with vs skims
- **Automatic surfacing** — proactively show relevant saved snippets when you're on a page related to something you've read before


The browser is the only surface that sees everything a person reads. Most tools ask you to go somewhere else to take notes. This one stays where the reading happens.

---

## On Using an AI Coding Agent

I used Claude Code to build this. I structured the session into 8 discrete phases (scaffold → context menu → storage → API key → embeddings → popup UI → RAG pipeline → polish), each reviewed and confirmed before proceeding. The agent handled implementation; I owned the architectural decisions, the product reasoning, and caught the failures — including the title-embedding gap that only surfaced through real testing, not assumptions about the code.

The transcript of the full session is in `session-transcript.md`.
