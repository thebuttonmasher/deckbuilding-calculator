import type { DeckCard, Category } from '../types'

export interface Atom {
  memberOf: ReadonlySet<string>
  count: number
  key: string
}

function membershipKey(categoryIds: string[]): string {
  return [...categoryIds].sort().join('\x00')
}

/**
 * Partition deck cards into atoms — groups sharing the exact same
 * set of category memberships. Atoms are disjoint and their counts sum to N.
 */
export function decompose(cards: DeckCard[], categories: Category[]): Atom[] {
  const validIds = new Set(categories.map((c) => c.id))
  const map = new Map<string, { memberOf: Set<string>; count: number }>()

  for (const dc of cards) {
    const relevant = dc.categoryIds.filter((id) => validIds.has(id))
    const key = membershipKey(relevant)
    if (!map.has(key)) {
      map.set(key, { memberOf: new Set(relevant), count: 0 })
    }
    map.get(key)!.count += dc.quantity
  }

  return Array.from(map.entries()).map(([key, { memberOf, count }]) => ({
    memberOf,
    count,
    key,
  }))
}
