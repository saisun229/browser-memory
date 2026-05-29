import { db } from '../lib/db'
import { fetchEmbedding } from '../lib/embeddings'

const MENU_ITEM_ID = 'save-to-browser-memory'

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ITEM_ID,
    title: 'Save to Browser Memory',
    contexts: ['selection'],
  })
  console.log('[Browser Memory] context menu registered')
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ITEM_ID) return

  const text = info.selectionText ?? ''
  const url = tab?.url ?? ''
  const title = tab?.title ?? ''

  const { openai_api_key: apiKey } = await chrome.storage.local.get('openai_api_key')

  let embedding: number[] | null = null

  if (apiKey) {
    try {
      embedding = await fetchEmbedding(text, apiKey)
      console.log('[Browser Memory] embedding fetched, dims:', embedding.length)
    } catch (err) {
      console.error('[Browser Memory] embedding failed, saving without vector:', err)
    }
  } else {
    console.warn('[Browser Memory] no API key set, saving without embedding')
  }

  await db.snippets.add({
    id: crypto.randomUUID(),
    text,
    url,
    title,
    timestamp: Date.now(),
    embedding,
  })

  console.log('[Browser Memory] saved snippet', { url, title, hasEmbedding: embedding !== null })
})
