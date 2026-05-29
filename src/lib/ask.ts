import { db } from './db'
import { fetchEmbedding } from './embeddings'
import { topN } from './similarity'
import { askLlm } from './llm'
import type { Source } from '../popup/components/ChatView'

const TOP_N = 5
const THRESHOLD = 0.5  // minimum cosine similarity to be considered relevant
const MAX_CONTEXT_CHARS = 6000  // rough token budget guard

export async function askQuestion(
  question: string
): Promise<{ answer: string; sources: Source[] }> {
  const { openai_api_key: apiKey } = await chrome.storage.local.get('openai_api_key')
  if (!apiKey) throw new Error('No API key set.')

  const all = await db.snippets.toArray()
  const withEmbeddings = all.filter(s => s.embedding !== null) as (typeof all[0] & { embedding: number[] })[]

  if (withEmbeddings.length === 0) {
    throw new Error('No indexed snippets found. Save some snippets first.')
  }

  const queryEmbedding = await fetchEmbedding(question, apiKey)
  const matches = topN(queryEmbedding, withEmbeddings, TOP_N, THRESHOLD)

  if (matches.length === 0) {
    throw new Error('No relevant snippets found for your question. Try saving more related content.')
  }

  // Guard token budget: skip snippets that would push context over the limit
  let totalChars = 0
  const selected = matches.filter(m => {
    if (totalChars + m.text.length > MAX_CONTEXT_CHARS) return false
    totalChars += m.text.length
    return true
  })

  const answer = await askLlm(question, selected.map(m => m.text), apiKey)

  const sources: Source[] = selected.map(m => ({
    url: m.url,
    title: m.title,
    text: m.text,
  }))

  return { answer, sources }
}
