import { useEffect, useState } from 'react'
import { db, type SavedMemory } from '../lib/db'
import ApiKeySetup from './components/ApiKeySetup'

type View = 'loading' | 'setup' | 'main'

export default function App() {
  const [view, setView] = useState<View>('loading')
  const [count, setCount] = useState<number>(0)
  const [latest, setLatest] = useState<SavedMemory | null>(null)

  useEffect(() => {
    async function init() {
      const result = await chrome.storage.local.get('openai_api_key')
      setView(result.openai_api_key ? 'main' : 'setup')
    }
    init()
  }, [])

  useEffect(() => {
    if (view !== 'main') return
    async function loadSnippets() {
      const total = await db.snippets.count()
      const last = await db.snippets.orderBy('timestamp').last()
      setCount(total)
      setLatest(last ?? null)
    }
    loadSnippets()
  }, [view])

  async function handleChangeKey() {
    await chrome.storage.local.remove('openai_api_key')
    setView('setup')
  }

  if (view === 'loading') return null

  if (view === 'setup') {
    return <ApiKeySetup onSave={() => setView('main')} />
  }

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ margin: '0 0 12px' }}>Browser Memory</h2>
      <p style={{ margin: '0 0 8px' }}>Saved snippets: <strong>{count}</strong></p>
      {latest ? (
        <div style={{ borderTop: '1px solid #eee', paddingTop: '8px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#999' }}>Latest</p>
          <p style={{ margin: '0 0 4px', fontSize: '13px' }}>
            {latest.text.length > 100 ? latest.text.slice(0, 100) + '…' : latest.text}
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>{latest.url}</p>
        </div>
      ) : (
        <p style={{ fontSize: '13px', color: '#999' }}>No snippets saved yet.</p>
      )}
      <button
        onClick={handleChangeKey}
        style={{ marginTop: '16px', fontSize: '11px', color: '#999', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        Change API key
      </button>
    </div>
  )
}
