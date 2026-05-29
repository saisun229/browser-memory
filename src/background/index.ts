import { db } from '../lib/db'
import { fetchEmbedding } from '../lib/embeddings'

const MENU_ITEM_ID = 'save-to-browser-memory'

async function updateBadge() {
  const count = await db.snippets.count()
  chrome.action.setBadgeText({ text: count > 0 ? count.toString() : '' })
  chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' })
}

chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.create({
    id: MENU_ITEM_ID,
    title: 'Save to Browser Memory',
    contexts: ['selection'],
  })
  await updateBadge()
})

chrome.runtime.onStartup.addListener(updateBadge)

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

  chrome.action.setBadgeText({ text: '✓' })
  chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' })
  setTimeout(updateBadge, 1500)
})
