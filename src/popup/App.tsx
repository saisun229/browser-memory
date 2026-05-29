import { useEffect, useState } from 'react'
import { db, type SavedMemory } from '../lib/db'

export default function App() {
  const [count, setCount] = useState<number>(0)
  const [latest, setLatest] = useState<SavedMemory | null>(null)

  useEffect(() => {
    async function load() {
      const total = await db.snippets.count()
      const last = await db.snippets.orderBy('timestamp').last()
      setCount(total)
      setLatest(last ?? null)
    }
    load()
  }, [])

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
    </div>
  )
}
