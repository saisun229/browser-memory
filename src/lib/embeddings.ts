const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDINGS_URL = 'https://api.openai.com/v1/embeddings'

async function callEmbeddingApi(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch(EMBEDDINGS_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: text, model: EMBEDDING_MODEL }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`OpenAI ${response.status}: ${body}`)
  }

  const data = await response.json()
  return data.data[0].embedding as number[]
}

export async function fetchEmbedding(text: string, apiKey: string): Promise<number[]> {
  try {
    return await callEmbeddingApi(text, apiKey)
  } catch (err) {
    // Retry once on network failures only (TypeError), not on API errors
    if (err instanceof TypeError) {
      return await callEmbeddingApi(text, apiKey)
    }
    throw err
  }
}
