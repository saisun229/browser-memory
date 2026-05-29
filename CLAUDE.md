# Browser Memory — Chrome Extension

## Project Overview

Technical assessment prototype (not production). A Chrome Extension MV3 that lets users highlight text on any webpage, save it locally with metadata and an OpenAI embedding, then ask questions over saved snippets via a popup UI.

## Coding Rules

- Plan first — state what will change and why before touching any file.
- Touch only required files — nothing outside the current task.
- No unrelated refactors — even if something looks improvable, leave it.
- No extra features — build exactly what the phase specifies.
- Keep summaries short — one or two sentences after each change.
- Work one milestone at a time — do not jump ahead.
- Do not add dependencies unless clearly necessary.
- Keep TypeScript simple and readable — no over-engineering.
- Prefer small files and small functions.

## Milestones

1. **Scaffold** — manifest, folder structure, build tooling
2. **Context Menu** — right-click "Save to Browser Memory", capture selected text + metadata
3. **Storage** — persist snippets (text, url, title, timestamp) to `chrome.storage.local`
4. **Embeddings** — call OpenAI Embeddings API, attach vector to each snippet
5. **Popup UI** — ask a question, cosine-similarity search over stored vectors, display results
6. **Polish** — error states, empty states, loading indicators

## Architecture (TBD — pending stack decision)

```
browser-memory/
  manifest.json
  src/
    background/     # service worker: context menu, storage, OpenAI calls
    content/        # content script (minimal — only if needed)
    popup/          # React/Preact or vanilla popup UI
    lib/            # shared utilities (storage, embeddings, similarity)
  dist/             # build output, loaded as unpacked extension
```

## Key Constraints

- MV3: background must be a service worker (no persistent state in memory).
- OpenAI API key stored in `chrome.storage.local` (user-provided, not bundled).
- All snippet data stays local — nothing sent to a server except OpenAI API calls.
- No backend server.

## Confirmed Stack

| Layer | Choice |
|---|---|
| Build | Vite + `vite-plugin-web-extension` |
| UI | React 18 + TypeScript |
| Extension | Chrome MV3 (service worker background) |
| Storage | Dexie (IndexedDB wrapper) — see decision below |
| Embeddings | OpenAI `text-embedding-3-small` (1536 dims) |
| Similarity | Local cosine similarity, computed at query time |
| LLM Answer | OpenAI Chat Completions, context = top-N snippets only |

## Features

1. **Context menu** — right-click selected text → "Save to Browser Memory"
2. **Snippet storage** — saves: text, URL, page title, timestamp, embedding vector
3. **API key settings** — prompt on first open, persist in `chrome.storage.local`
4. **Chat popup** — question input + LLM response using only retrieved snippets
5. **Cosine similarity retrieval** — top-N snippets ranked by vector similarity
6. **Source links** — each answer shows the source URL + title for cited snippets

## Storage Decision: Dexie vs Raw IndexedDB

### Raw IndexedDB
**Pros**
- Zero dependency, native browser API
- Full control over schema and transactions

**Cons**
- Verbose, callback-heavy (or requires manual Promise wrapping)
- Schema migrations are manual and error-prone
- Harder to read/maintain for a prototype

### Dexie
**Pros**
- Clean Promise/async-await API — readable code
- Built-in versioned schema migrations (`db.version(2).stores(...)`)
- Works directly in MV3 service workers (no DOM dependency)
- Tiny (~23kb min+gz)

**Cons**
- One additional dependency
- Slight abstraction over raw IDB (rarely matters)

**Decision: Dexie** — the readability and migration support are worth the single dependency at prototype scale.

## Storage Schema (Dexie)

```ts
// snippets table
{
  id: string,          // auto-generated uuid
  text: string,        // highlighted text
  url: string,         // source page URL
  title: string,       // source page title
  timestamp: number,   // Date.now()
  embedding: number[], // 1536-dim float array from OpenAI
}
```

## Architecture

```
browser-memory/
  manifest.json
  src/
    background/
      index.ts          # service worker: context menu listener, OpenAI calls
    popup/
      index.tsx         # React entry point
      App.tsx           # root: settings gate + chat UI
      components/
        ApiKeySetup.tsx  # shown if no API key saved
        ChatView.tsx     # question input + answer + source links
        SnippetList.tsx  # optional: browse saved snippets
    lib/
      db.ts             # Dexie schema + typed table accessors
      embeddings.ts     # OpenAI embeddings API call
      similarity.ts     # cosine similarity + top-N retrieval
      llm.ts            # OpenAI chat completions call
  dist/                 # build output (load unpacked in Chrome)
```
