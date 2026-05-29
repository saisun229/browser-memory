const CHAT_URL = 'https://api.openai.com/v1/chat/completions'

export async function askLlm(
  question: string,
  snippets: string[],
  apiKey: string
): Promise<string> {
  const context = snippets.map((s, i) => `[${i + 1}] ${s}`).join('\n\n')

  const response = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Answer the user's question using ONLY the context snippets below. If the context does not contain the answer, say so clearly. Do not make up information.\n\nContext:\n${context}`,
        },
        { role: 'user', content: question },
      ],
      max_tokens: 512,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`OpenAI ${response.status}: ${body}`)
  }

  const data = await response.json()
  return data.choices[0].message.content as string
}
