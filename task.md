# Browser Memory — Build Phases

After each phase: review completion, discuss adjustments, then proceed.

---

## Phase 1: Setup
- [ ] Scaffold Vite + React + TypeScript app
- [ ] Configure Vite for multi-entry points: `popup`, `background` (service worker)
- [ ] Write `manifest.json` (MV3: `manifest_version: 3`, service worker, popup, permissions)
- [ ] Confirm `npm run build` outputs a valid `dist/` folder
- [ ] Load unpacked extension in `chrome://extensions` — popup opens without errors

---

## Phase 2: Context Menu

> Note: `chrome.contextMenus.onClicked` provides `selectionText` natively in the background service worker — no content script required.

- [ ] Register background service worker in manifest
- [ ] Create context menu item "Save to Browser Memory" on `selection` context
- [ ] On click: log `selectionText`, `pageUrl`, `title` to console (via `chrome.tabs.get`)
- [ ] Confirm menu only appears when text is selected
- [ ] Confirm logs appear in the service worker DevTools

---

## Phase 3: Storage

- [ ] Add Dexie as a dependency
- [ ] Define `SavedMemory` type and Dexie schema:
  ```ts
  {
    id: string         // uuid
    text: string       // selected text
    url: string        // source page URL
    title: string      // source page title
    timestamp: number  // Date.now()
    embedding: number[] | null  // null until Phase 5
  }
  ```
- [ ] Save snippet to IndexedDB on context menu click
- [ ] Add a minimal popup debug view: list saved snippet count and most recent entry
- [ ] Confirm data persists after closing and reopening the browser

---

## Phase 4: API Key Management

> API key stored in `chrome.storage.local` (not Dexie — it is a single scalar value, not a record).

- [ ] On popup open: check `chrome.storage.local` for existing key
- [ ] If no key found: show `ApiKeySetup` screen (text input + save button)
- [ ] On save: write key to `chrome.storage.local`, transition to main view
- [ ] Add a "Change API key" option (small link/button) visible from the main view
- [ ] Never log or expose the key in console output

---

## Phase 5: Embeddings

- [ ] Create `lib/embeddings.ts`: call `text-embedding-3-small` via OpenAI REST API
- [ ] Call embedding from background service worker (avoids CORS)
- [ ] On context menu save: fetch embedding, attach to snippet before writing to Dexie
- [ ] Handle errors: invalid key, rate limit, network failure — log to service worker console, save snippet with `embedding: null` so data is not lost
- [ ] Add basic retry (1 retry on network error)

---

## Phase 6: Popup UI

- [ ] `App.tsx`: gate on API key — show `ApiKeySetup` or `ChatView`
- [ ] `ApiKeySetup.tsx`: key input, save button, validation feedback
- [ ] `ChatView.tsx`: question input, submit button, answer area, source links
- [ ] `SnippetList.tsx`: list of saved snippets (text truncated, URL, timestamp) with delete button per snippet
- [ ] "Clear all" button with confirmation
- [ ] Loading state while waiting for LLM response
- [ ] Empty state when no snippets are saved
- [ ] Error state for API failures (show message, allow retry)

---

## Phase 7: Ask (RAG)

- [ ] `lib/similarity.ts`: cosine similarity function + top-N retrieval
- [ ] `lib/llm.ts`: OpenAI chat completions call; context = concatenated top-N snippets only
- [ ] On question submit:
  1. Embed the question (call `text-embedding-3-small`)
  2. Load all snippets from Dexie that have a non-null embedding
  3. Compute cosine similarity against each snippet
  4. Filter by minimum similarity threshold (e.g. `>= 0.75`) to avoid hallucination on irrelevant context
  5. Take top 5 (or fewer if below threshold)
  6. Build LLM prompt: system instruction + snippets as numbered context blocks + question
  7. Return answer + source list (URL, title, snippet preview)
- [ ] Display answer in `ChatView`, source links below
- [ ] Handle: no snippets saved, no snippets above threshold, OpenAI error
- [ ] Guard token budget: truncate snippets if combined context exceeds ~6000 tokens

---

## Phase 8: Polish & Cleanup

- [ ] Show extension badge count (number of saved snippets) on the icon
- [ ] Popup remembers last question within the session
- [ ] Snippet save confirmation: brief visual feedback when "Save to Browser Memory" succeeds
- [ ] Handle snippets saved with `embedding: null` — label them in the list, exclude from search, offer to retry embedding
- [ ] Final review: remove all console.log debug statements
- [ ] Test edge cases: empty selection, very long text, special characters, duplicate URLs

---

## Milestones Summary

| Phase | Goal | Done |
|---|---|---|
| 1 | Extension builds and loads | [ ] |
| 2 | Context menu captures text | [ ] |
| 3 | Snippets persist in IndexedDB | [ ] |
| 4 | API key stored and gated | [ ] |
| 5 | Embeddings saved with snippets | [ ] |
| 6 | Full popup UI | [ ] |
| 7 | RAG: question → answer + sources | [ ] |
| 8 | Polish and edge cases | [ ] |
