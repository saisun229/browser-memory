# Browser Memory

A Chrome Extension that lets you highlight text on any webpage, save it with an AI embedding, then ask questions over everything you've saved — right from the browser toolbar.

Built with React, Vite, Dexie (IndexedDB), and OpenAI.

---

## What it does

- Right-click any highlighted text → **Save to Browser Memory**
- The extension saves the text, page title, and URL locally on your machine
- Open the popup → **Ask** tab → ask a question in plain English
- The extension finds the most relevant saved snippets using cosine similarity and returns an answer with source links

Everything stays on your device. The only external calls are to the OpenAI API (embeddings + chat).

---

## Tech Stack

| Layer | Choice |
|---|---|
| Extension | Chrome Manifest V3 |
| Build | Vite + vite-plugin-web-extension |
| UI | React 18 + TypeScript |
| Storage | Dexie (IndexedDB wrapper) |
| Embeddings | OpenAI `text-embedding-3-small` |
| Search | Local cosine similarity |
| Answers | OpenAI `gpt-4o-mini` |

---

## Try it in your browser (no build needed)

The `dist/` folder is included in this repo — you can load it directly into Chrome.

### Step 1 — Get an OpenAI API key

1. Go to [https://platform.openai.com](https://platform.openai.com) and sign up or log in
2. Click your profile → **API keys** → **Create new secret key**
3. Copy the key (starts with `sk-...`) — you won't be able to see it again
4. Add $5 credit under **Billing** — that's more than enough for testing

### Step 2 — Load the extension into Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `dist/` folder from this repository
5. The Browser Memory icon will appear in your toolbar — click the **Extensions** puzzle-piece icon and then the **pin** icon next to Browser Memory to keep it visible at all times

### Step 3 — Add your API key

1. Click the Browser Memory icon in the toolbar
2. Enter your OpenAI API key (`sk-...`) and click **Save API Key**

### Step 4 — Save some snippets

1. Go to any webpage and highlight some text
2. Right-click → **Save to Browser Memory**
3. The icon badge will flash ✓ and update with your snippet count

### Step 5 — Ask a question

1. Click the Browser Memory icon → **Ask** tab
2. Type a question about content you've saved
3. Hit **Ask** (or Cmd/Ctrl + Enter)
4. The answer appears with source links to the original pages

---

## Build from source

```bash
# 1. Install dependencies
npm install

# 2. Build the extension
npm run build

# 3. Load dist/ as an unpacked extension in chrome://extensions
```

For development with auto-rebuild on file changes:

```bash
npm run dev
```

Then reload the extension in `chrome://extensions` after each rebuild.

---

## Project structure

```
src/
  background/
    index.ts          # Service worker: context menu, save snippets, fetch embeddings
  popup/
    index.tsx         # React entry point
    App.tsx           # Root: API key gate + tab navigation
    components/
      ApiKeySetup.tsx # First-run API key input screen
      ChatView.tsx    # Question input, answer display, source links
      SnippetList.tsx # Saved snippets with delete and retry embedding
  lib/
    db.ts             # Dexie schema (SavedMemory type + table)
    embeddings.ts     # OpenAI text-embedding-3-small API call
    similarity.ts     # Cosine similarity + top-N retrieval
    llm.ts            # OpenAI gpt-4o-mini chat completions
    ask.ts            # RAG pipeline: embed → retrieve → answer
dist/                 # Pre-built extension, ready to load in Chrome
```

---

## Privacy

- All snippet data is stored locally in your browser's IndexedDB
- No data is sent to any server except OpenAI (for embeddings and answers)
- Your API key is stored locally in `chrome.storage.local` and never leaves your browser
