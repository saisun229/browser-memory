import type { SavedMemory } from './db'

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

type SnippetWithEmbedding = SavedMemory & { embedding: number[] }

export function topN(
  query: number[],
  snippets: SnippetWithEmbedding[],
  n: number,
  threshold: number
): (SnippetWithEmbedding & { score: number })[] {
  return snippets
    .map(s => {
      const textSim = cosineSimilarity(query, s.embedding)
      const titleSim = s.titleEmbedding ? cosineSimilarity(query, s.titleEmbedding) : 0
      return { ...s, score: Math.max(textSim, titleSim) }
    })
    .filter(s => s.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
}
