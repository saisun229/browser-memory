import Dexie, { type Table } from 'dexie'

export interface SavedMemory {
  id: string
  text: string
  url: string
  title: string
  timestamp: number
  embedding: number[] | null
}

class BrowserMemoryDb extends Dexie {
  snippets!: Table<SavedMemory>

  constructor() {
    super('browser-memory')
    this.version(1).stores({
      snippets: 'id, timestamp',
    })
  }
}

export const db = new BrowserMemoryDb()
