import { useEffect, useState } from 'react'
import { db, type SavedMemory } from '../../lib/db'

export default function SnippetList() {
  const [snippets, setSnippets] = useState<SavedMemory[]>([])

  async function load() {
    const all = await db.snippets.orderBy('timestamp').reverse().toArray()
    setSnippets(all)
  }

  useEffect(() => { load() }, [])

  async function deleteSnippet(id: string) {
    await db.snippets.delete(id)
    load()
  }

  async function clearAll() {
    if (!confirm('Delete all saved snippets? This cannot be undone.')) return
    await db.snippets.clear()
    setSnippets([])
  }

  if (snippets.length === 0) {
    return (
      <p style={{ fontSize: '13px', color: '#999', lineHeight: 1.5 }}>
        No snippets saved yet. Highlight text on any page and right-click to save.
      </p>
    )
  }

  return (
    <div>
      <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
        {snippets.map(s => (
          <div key={s.id} style={{ borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '8px' }}>
            <p style={{ margin: '0 0 2px', fontSize: '13px', lineHeight: 1.4 }}>
              {s.text.length > 100 ? s.text.slice(0, 100) + '…' : s.text}
            </p>
            <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#666' }}>
              {s.title || s.url}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#bbb' }}>
                {new Date(s.timestamp).toLocaleDateString()} · {s.embedding ? 'indexed' : 'no embedding'}
              </span>
              <button
                onClick={() => deleteSnippet(s.id)}
                style={{ fontSize: '11px', color: '#c00', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={clearAll}
        style={{ marginTop: '4px', fontSize: '11px', color: '#999', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        Clear all
      </button>
    </div>
  )
}
