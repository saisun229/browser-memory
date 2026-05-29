import { useState } from 'react'

interface Props {
  onSave: () => void
}

export default function ApiKeySetup({ onSave }: Props) {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')

  async function handleSave() {
    const trimmed = key.trim()
    if (!trimmed.startsWith('sk-')) {
      setError('Key must start with sk-')
      return
    }
    await chrome.storage.local.set({ openai_api_key: trimmed })
    onSave()
  }

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ margin: '0 0 8px' }}>Browser Memory</h2>
      <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#555' }}>
        Enter your OpenAI API key to get started.
      </p>
      <input
        type="password"
        placeholder="sk-..."
        value={key}
        onChange={e => { setKey(e.target.value); setError('') }}
        style={{ width: '100%', padding: '8px', boxSizing: 'border-box', fontSize: '13px' }}
      />
      {error && (
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#c00' }}>{error}</p>
      )}
      <button
        onClick={handleSave}
        style={{ marginTop: '10px', width: '100%', padding: '8px', fontSize: '13px', cursor: 'pointer' }}
      >
        Save API Key
      </button>
    </div>
  )
}
