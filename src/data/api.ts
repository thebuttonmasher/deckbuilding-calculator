import type { YGOCard } from '../types'
import {
  getCachedCard,
  getCachedSearch,
  putCachedCards,
  putCachedSearch,
} from './db'

const BASE = 'https://db.ygoprodeck.com/api/v7/cardinfo.php'
// Stay well under the 20 req/s hard limit
const MIN_REQUEST_INTERVAL_MS = 100

let lastRequestAt = 0

async function rateLimit(): Promise<void> {
  const now = Date.now()
  const elapsed = now - lastRequestAt
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_REQUEST_INTERVAL_MS - elapsed))
  }
  lastRequestAt = Date.now()
}

async function fetchCards(params: Record<string, string>): Promise<YGOCard[]> {
  await rateLimit()
  const url = new URL(BASE)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString())
  if (!res.ok) {
    if (res.status === 400) return [] // no results
    throw new Error(`YGOPRODeck API error: ${res.status}`)
  }
  const json = await res.json()
  return (json.data ?? []) as YGOCard[]
}

/** Fuzzy name search. Returns up to 30 results. */
export async function searchCardsByName(query: string): Promise<YGOCard[]> {
  const key = `fname:${query.trim().toLowerCase()}`
  const cachedIds = await getCachedSearch(key)
  if (cachedIds !== null) {
    const cards = await Promise.all(cachedIds.map(getCachedCard))
    const valid = cards.filter(Boolean) as YGOCard[]
    if (valid.length === cachedIds.length) return valid
    // Some individual cards expired — re-fetch
  }

  const cards = await fetchCards({ fname: query.trim(), num: '30', offset: '0' })
  if (cards.length > 0) {
    await putCachedCards(cards)
    await putCachedSearch(key, cards.map((c) => c.id))
  }
  return cards
}

/** Exact passcode lookup — used for .ydk import. Batches into groups of 10. */
export async function fetchCardsByIds(ids: number[]): Promise<YGOCard[]> {
  const result: YGOCard[] = []
  const missing: number[] = []

  for (const id of ids) {
    const cached = await getCachedCard(id)
    if (cached) result.push(cached)
    else missing.push(id)
  }

  // Fetch missing in batches of 10 (one request per batch)
  for (let i = 0; i < missing.length; i += 10) {
    const batch = missing.slice(i, i + 10)
    try {
      const cards = await fetchCards({ id: batch.join(',') })
      if (cards.length > 0) {
        await putCachedCards(cards)
        result.push(...cards)
      }
    } catch {
      // Ignore fetch errors for individual batches
    }
  }

  return result
}
