import { useEffect, useState } from 'react'
import ApiKeySetup from './components/ApiKeySetup'
import ChatView from './components/ChatView'
import SnippetList from './components/SnippetList'
import { askQuestion } from '../lib/ask'

type View = 'loading' | 'setup' | 'main'
type Tab = 'ask' | 'saved'

export default function App() {
  const [view, setView] = useState<View>('loading')
  const [tab, setTab] = useState<Tab>('ask')

  useEffect(() => {
    chrome.storage.local.get('openai_api_key').then(result => {
      setView(result.openai_api_key ? 'main' : 'setup')
    })
  }, [])

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ margin: 0, fontSize: '16px' }}>Browser Memory</h2>
        <button
          onClick={handleChangeKey}
          style={{ fontSize: '11px', color: '#999', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          API key
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #eee', marginBottom: '12px' }}>
        {(['ask', 'saved'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '4px 0 8px',
              fontSize: '13px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid #000' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: tab === t ? 600 : 400,
            }}
          >
            {t === 'ask' ? 'Ask' : 'Saved'}
          </button>
        ))}
      </div>

      {tab === 'ask' && <ChatView onAsk={askQuestion} />}
      {tab === 'saved' && <SnippetList />}
    </div>
  )
}
