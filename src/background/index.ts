const MENU_ITEM_ID = 'save-to-browser-memory'

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ITEM_ID,
    title: 'Save to Browser Memory',
    contexts: ['selection'],
  })
  console.log('[Browser Memory] context menu registered')
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ITEM_ID) return

  const text = info.selectionText ?? ''
  const url = tab?.url ?? ''
  const title = tab?.title ?? ''

  console.log('[Browser Memory] saving snippet', { text, url, title })
})
