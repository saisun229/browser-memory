import { useEffect, useState } from 'react'
import { db, type SavedMemory } from '../../lib/db'
import { fetchEmbedding } from '../../lib/embeddings'

export default function SnippetList() {
  const [snippets, setSnippets] = useState<SavedMemory[]>([])
  const [retrying, setRetrying] = useState<Set<string>>(new Set())

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

  async function retryEmbedding(snippet: SavedMemory) {
    setRetrying(prev => new Set(prev).add(snippet.id))
    try {
      const { openai_api_key: apiKey } = await chrome.storage.local.get('openai_api_key')
      if (!apiKey) throw new Error('No API key set')
      const [embedding, titleEmbedding] = await Promise.all([
        fetchEmbedding(snippet.text, apiKey),
        snippet.title ? fetchEmbedding(snippet.title, apiKey) : Promise.resolve(null),
      ])
      await db.snippets.update(snippet.id, { embedding, titleEmbedding })
      await load()
    } catch (err) {
      alert('Retry failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setRetrying(prev => {
        const next = new Set(prev)
        next.delete(snippet.id)
        return next
      })
    }
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
              <span style={{ fontSize: '10px', color: '#bbb', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {new Date(s.timestamp).toLocaleDateString()}
                {s.embedding === null ? (
                  <button
                    onClick={() => retryEmbedding(s)}
                    disabled={retrying.has(s.id)}
                    style={{ fontSize: '10px', color: '#f90', background: 'none', border: '1px solid #f90', borderRadius: '3px', cursor: 'pointer', padding: '1px 5px' }}
                  >
                    {retrying.has(s.id) ? 'Retrying…' : 'No embedding — Retry'}
                  </button>
                ) : (
                  <span style={{ color: '#4CAF50' }}>indexed</span>
                )}
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
