import { useState } from 'react'

export interface Source {
  url: string
  title: string
  text: string
}

interface Props {
  onAsk: (question: string) => Promise<{ answer: string; sources: Source[] }>
}

export default function ChatView({ onAsk }: Props) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!question.trim() || loading) return
    setLoading(true)
    setError(null)
    setAnswer(null)
    setSources([])
    try {
      const result = await onAsk(question.trim())
      setAnswer(result.answer)
      setSources(result.sources)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
  }

  return (
    <div>
      <textarea
        value={question}
        onChange={e => setQuestion(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a question about your saved snippets…"
        rows={3}
        style={{ width: '100%', boxSizing: 'border-box', padding: '8px', fontSize: '13px', resize: 'vertical', borderRadius: '4px', border: '1px solid #ccc' }}
      />
      <button
        onClick={handleSubmit}
        disabled={!question.trim() || loading}
        style={{ marginTop: '8px', width: '100%', padding: '8px', fontSize: '13px', cursor: question.trim() && !loading ? 'pointer' : 'default' }}
      >
        {loading ? 'Thinking…' : 'Ask'}
      </button>

      {error && (
        <div style={{ marginTop: '12px', padding: '8px', background: '#fff0f0', borderRadius: '4px', fontSize: '13px', color: '#c00' }}>
          <p style={{ margin: '0 0 6px' }}>{error}</p>
          <button onClick={handleSubmit} style={{ fontSize: '12px', cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {answer && (
        <div style={{ marginTop: '12px' }}>
          <p style={{ margin: '0 0 10px', fontSize: '13px', lineHeight: 1.5 }}>{answer}</p>
          {sources.length > 0 && (
            <div>
              <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sources</p>
              {sources.map((s, i) => (
                <div key={i} style={{ marginBottom: '6px', paddingLeft: '8px', borderLeft: '2px solid #eee' }}>
                  <a href={s.url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#0066cc', display: 'block', marginBottom: '2px' }}>
                    {s.title || s.url}
                  </a>
                  <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>
                    {s.text.length > 80 ? s.text.slice(0, 80) + '…' : s.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
