import { comb } from './combinatorics'
import { decompose, type Atom } from './atoms'
import { evaluateQuery } from './query'
import type { DeckCard, Category, SavedQuery } from '../types'

export interface CategoryDistribution {
  categoryId: string
  /** probabilities[k] = P(draw exactly k cards from this category) */
  probabilities: number[]
}

export interface QueryResult {
  numerator: bigint
  decimal: number
}

export interface AnalysisResult {
  deckSize: number
  handSize: number
  denominator: bigint
  atoms: Atom[]
  queryResults: Record<string, QueryResult>
  categoryDistributions: CategoryDistribution[]
}

/**
 * Recursively enumerate all draw-vectors (k_0…k_{m-1}) where
 * 0 ≤ k_i ≤ atom_i.count and Σk_i = remaining.
 * Calls onVector with the weight = Π C(K_i, k_i).
 */
function enumerate(
  atoms: Atom[],
  idx: number,
  remaining: number,
  current: number[],
  weight: bigint,
  onVector: (vec: number[], weight: bigint) => void,
): void {
  if (idx === atoms.length) {
    if (remaining === 0) onVector(current, weight)
    return
  }
  if (idx === atoms.length - 1) {
    if (remaining >= 0 && remaining <= atoms[idx].count) {
      current[idx] = remaining
      const w = weight * comb(BigInt(atoms[idx].count), BigInt(remaining))
      onVector(current, w)
    }
    return
  }
  const maxDraw = Math.min(atoms[idx].count, remaining)
  for (let k = 0; k <= maxDraw; k++) {
    current[idx] = k
    const w = weight * comb(BigInt(atoms[idx].count), BigInt(k))
    if (w > 0n) {
      enumerate(atoms, idx + 1, remaining - k, current, w, onVector)
    }
  }
}

export function analyze(
  mainDeckCards: DeckCard[],
  categories: Category[],
  savedQueries: SavedQuery[],
  handSize: number,
): AnalysisResult {
  const atoms = decompose(mainDeckCards, categories)
  const N = atoms.reduce((s, a) => s + a.count, 0)

  if (N === 0 || handSize > N) {
    return {
      deckSize: N,
      handSize,
      denominator: 1n,
      atoms,
      queryResults: Object.fromEntries(savedQueries.map((q) => [q.id, { numerator: 0n, decimal: 0 }])),
      categoryDistributions: categories.map((c) => ({ categoryId: c.id, probabilities: [1] })),
    }
  }

  const denominator = comb(BigInt(N), BigInt(handSize))

  // Per-category max draw counts
  const categoryMax = new Map<string, number>()
  for (const c of categories) {
    const total = atoms.filter((a) => a.memberOf.has(c.id)).reduce((s, a) => s + a.count, 0)
    categoryMax.set(c.id, Math.min(total, handSize))
  }

  // Accumulators: query numerators and per-category distribution buckets
  const queryNumerators = new Map<string, bigint>(savedQueries.map((q) => [q.id, 0n]))
  const distBuckets = new Map<string, bigint[]>(
    categories.map((c) => [c.id, new Array<bigint>((categoryMax.get(c.id) ?? 0) + 1).fill(0n)]),
  )

  const vec = new Array<number>(atoms.length).fill(0)
  const counts = new Map<string, number>()

  enumerate(atoms, 0, handSize, vec, 1n, (drawVec, weight) => {
    // Compute category counts for this draw vector
    for (const c of categories) {
      let total = 0
      for (let i = 0; i < atoms.length; i++) {
        if (atoms[i].memberOf.has(c.id)) total += drawVec[i]
      }
      counts.set(c.id, total)
    }

    // Accumulate query results
    for (const q of savedQueries) {
      if (evaluateQuery(q.query, counts)) {
        queryNumerators.set(q.id, queryNumerators.get(q.id)! + weight)
      }
    }

    // Accumulate per-category distributions
    for (const c of categories) {
      const k = counts.get(c.id)!
      const buckets = distBuckets.get(c.id)!
      if (k < buckets.length) buckets[k] += weight
    }
  })

  const denomF = Number(denominator)

  return {
    deckSize: N,
    handSize,
    denominator,
    atoms,
    queryResults: Object.fromEntries(
      [...queryNumerators.entries()].map(([id, num]) => [
        id,
        { numerator: num, decimal: Number(num) / denomF },
      ]),
    ),
    categoryDistributions: categories.map((c) => ({
      categoryId: c.id,
      probabilities: (distBuckets.get(c.id) ?? [0n]).map((n) => Number(n) / denomF),
    })),
  }
}
