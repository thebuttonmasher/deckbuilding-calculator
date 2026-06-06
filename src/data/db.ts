import { openDB, type IDBPDatabase } from 'idb'
import type { Deck, YGOCard } from '../types'

export interface CachedCard {
  id: number
  data: YGOCard
  cachedAt: number
}

export interface CachedSearch {
  query: string
  ids: number[]
  cachedAt: number
}

const DB_NAME = 'ygo-deck-calc'
const DB_VERSION = 1
const CARD_TTL_MS = 2 * 24 * 60 * 60 * 1000 // 2 days

let _db: IDBPDatabase | null = null

export async function getDb(): Promise<IDBPDatabase> {
  if (_db) return _db
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore('cards', { keyPath: 'id' })
      db.createObjectStore('searches', { keyPath: 'query' })
      db.createObjectStore('decks', { keyPath: 'id' })
      db.createObjectStore('meta', { keyPath: 'key' })
    },
  })
  return _db
}

export async function getCachedCard(id: number): Promise<YGOCard | null> {
  const db = await getDb()
  const entry: CachedCard | undefined = await db.get('cards', id)
  if (!entry) return null
  if (Date.now() - entry.cachedAt > CARD_TTL_MS) return null
  return entry.data
}

export async function putCachedCards(cards: YGOCard[]): Promise<void> {
  const db = await getDb()
  const tx = db.transaction('cards', 'readwrite')
  const now = Date.now()
  await Promise.all(cards.map((card) => tx.store.put({ id: card.id, data: card, cachedAt: now })))
  await tx.done
}

export async function getCachedSearch(query: string): Promise<number[] | null> {
  const db = await getDb()
  const entry: CachedSearch | undefined = await db.get('searches', query)
  if (!entry) return null
  if (Date.now() - entry.cachedAt > CARD_TTL_MS) return null
  return entry.ids
}

export async function putCachedSearch(query: string, ids: number[]): Promise<void> {
  const db = await getDb()
  await db.put('searches', { query, ids, cachedAt: Date.now() })
}

export async function saveDeck(deck: Deck): Promise<void> {
  const db = await getDb()
  await db.put('decks', deck)
}

export async function loadDeck(id: string): Promise<Deck | null> {
  const db = await getDb()
  return (await db.get('decks', id)) ?? null
}

export async function deleteDeck(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('decks', id)
}

export async function listDecks(): Promise<Array<{ id: string; name: string; updatedAt: number }>> {
  const db = await getDb()
  const all: Deck[] = await db.getAll('decks')
  return all.map((d) => ({ id: d.id, name: d.name, updatedAt: d.updatedAt }))
}

export async function getMeta(key: string): Promise<unknown> {
  const db = await getDb()
  const entry = await db.get('meta', key)
  return entry?.value ?? null
}

export async function putMeta(key: string, value: unknown): Promise<void> {
  const db = await getDb()
  await db.put('meta', { key, value })
}
