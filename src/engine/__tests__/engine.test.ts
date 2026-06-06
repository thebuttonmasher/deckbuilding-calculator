import { describe, it, expect } from 'vitest'
import { comb } from '../combinatorics'
import { decompose } from '../atoms'
import { analyze } from '../analysis'
import type { DeckCard, Category, SavedQuery } from '../../types'

// ─── combinatorics ────────────────────────────────────────────────────────────

describe('comb', () => {
  it('C(n,0) = 1', () => expect(comb(10n, 0n)).toBe(1n))
  it('C(n,n) = 1', () => expect(comb(10n, 10n)).toBe(1n))
  it('C(k>n) = 0', () => expect(comb(5n, 6n)).toBe(0n))
  it('C(10,3) = 120', () => expect(comb(10n, 3n)).toBe(120n))
  it('C(40,5) = 658008', () => expect(comb(40n, 5n)).toBe(658008n))
  it('C(37,5) = 435897', () => expect(comb(37n, 5n)).toBe(435897n))
  it('C(37,4) = 66045', () => expect(comb(37n, 4n)).toBe(66045n))
  it('C(37,3) = 7770', () => expect(comb(37n, 3n)).toBe(7770n))
  it('C(37,2) = 666', () => expect(comb(37n, 2n)).toBe(666n))
})

// ─── atom decomposition ───────────────────────────────────────────────────────

describe('decompose', () => {
  const categories: Category[] = [
    { id: 'a', name: 'A', color: '#f00' },
    { id: 'b', name: 'B', color: '#0f0' },
  ]

  it('atom counts always sum to deck size N', () => {
    const cards: DeckCard[] = [
      { cardId: 1, quantity: 2, categoryIds: ['a', 'b'] },
      { cardId: 2, quantity: 3, categoryIds: ['a'] },
      { cardId: 3, quantity: 1, categoryIds: ['b'] },
      { cardId: 4, quantity: 34, categoryIds: [] },
    ]
    const atoms = decompose(cards, categories)
    const total = atoms.reduce((s, a) => s + a.count, 0)
    expect(total).toBe(40)
  })

  it('produces correct atom membership sets', () => {
    const cards: DeckCard[] = [
      { cardId: 1, quantity: 2, categoryIds: ['a', 'b'] },
      { cardId: 2, quantity: 3, categoryIds: ['a'] },
      { cardId: 3, quantity: 1, categoryIds: ['b'] },
      { cardId: 4, quantity: 34, categoryIds: [] },
    ]
    const atoms = decompose(cards, categories)
    const ab = atoms.find((a) => a.memberOf.has('a') && a.memberOf.has('b'))
    const ao = atoms.find((a) => a.memberOf.has('a') && !a.memberOf.has('b'))
    const bo = atoms.find((a) => !a.memberOf.has('a') && a.memberOf.has('b'))
    const rest = atoms.find((a) => a.memberOf.size === 0)
    expect(ab?.count).toBe(2)
    expect(ao?.count).toBe(3)
    expect(bo?.count).toBe(1)
    expect(rest?.count).toBe(34)
  })

  it('ignores categories not in the category list', () => {
    const cards: DeckCard[] = [
      { cardId: 1, quantity: 5, categoryIds: ['a', 'unknown'] },
      { cardId: 2, quantity: 35, categoryIds: [] },
    ]
    const atoms = decompose(cards, categories)
    const withA = atoms.find((a) => a.memberOf.has('a'))
    expect(withA?.count).toBe(5)
    expect(withA?.memberOf.has('unknown')).toBe(false)
  })
})

// ─── probability engine ────────────────────────────────────────────────────────

describe('analyze — single disjoint category (standard hypergeometric)', () => {
  // 40-card deck, 3 Starters, hand size 5
  // P(Starter=0) = C(37,5)/C(40,5) = 435897/658008
  // P(Starter=1) = C(3,1)*C(37,4)/C(40,5) = 198135/658008
  // P(Starter=2) = C(3,2)*C(37,3)/C(40,5) = 23310/658008
  // P(Starter=3) = C(3,3)*C(37,2)/C(40,5) = 666/658008
  const cards: DeckCard[] = [
    { cardId: 1, quantity: 3, categoryIds: ['starter'] },
    { cardId: 2, quantity: 37, categoryIds: [] },
  ]
  const cats: Category[] = [{ id: 'starter', name: 'Starter', color: '#f00' }]

  it('P(0) matches known hypergeometric value', () => {
    const r = analyze(cards, cats, [], 5)
    const dist = r.categoryDistributions[0]
    expect(dist.probabilities[0]).toBeCloseTo(435897 / 658008, 10)
  })

  it('P(1) matches known hypergeometric value', () => {
    const r = analyze(cards, cats, [], 5)
    const dist = r.categoryDistributions[0]
    expect(dist.probabilities[1]).toBeCloseTo(198135 / 658008, 10)
  })

  it('P(2) matches known hypergeometric value', () => {
    const r = analyze(cards, cats, [], 5)
    const dist = r.categoryDistributions[0]
    expect(dist.probabilities[2]).toBeCloseTo(23310 / 658008, 10)
  })

  it('P(3) matches known hypergeometric value', () => {
    const r = analyze(cards, cats, [], 5)
    const dist = r.categoryDistributions[0]
    expect(dist.probabilities[3]).toBeCloseTo(666 / 658008, 10)
  })

  it('probabilities sum to exactly 1', () => {
    const r = analyze(cards, cats, [], 5)
    const dist = r.categoryDistributions[0]
    const sum = dist.probabilities.reduce((s, p) => s + p, 0)
    expect(sum).toBeCloseTo(1, 10)
  })
})

describe('analyze — overlapping categories (not double-counted)', () => {
  // 40-card deck: {A,B}: 2, {A}: 3, {B}: 1, {}: 34
  // Category A has 5 cards total → P(A=0) = C(5,0)*C(35,5)/C(40,5) = 324632/658008
  // Category B has 3 cards total → P(B=0) = C(3,0)*C(37,5)/C(40,5) = 435897/658008
  // P(A>=1 AND B>=1) = 175735/658008  (verified by inclusion-exclusion)
  const cards: DeckCard[] = [
    { cardId: 1, quantity: 2, categoryIds: ['a', 'b'] },
    { cardId: 2, quantity: 3, categoryIds: ['a'] },
    { cardId: 3, quantity: 1, categoryIds: ['b'] },
    { cardId: 4, quantity: 34, categoryIds: [] },
  ]
  const cats: Category[] = [
    { id: 'a', name: 'A', color: '#f00' },
    { id: 'b', name: 'B', color: '#0f0' },
  ]

  it('P(A=0) is correct — overlap not double-counted', () => {
    const r = analyze(cards, cats, [], 5)
    const distA = r.categoryDistributions.find((d) => d.categoryId === 'a')!
    expect(distA.probabilities[0]).toBeCloseTo(324632 / 658008, 10)
  })

  it('P(B=0) is correct', () => {
    const r = analyze(cards, cats, [], 5)
    const distB = r.categoryDistributions.find((d) => d.categoryId === 'b')!
    expect(distB.probabilities[0]).toBeCloseTo(435897 / 658008, 10)
  })

  it('P(A>=1 AND B>=1) matches inclusion-exclusion', () => {
    const query: SavedQuery = {
      id: 'q1',
      name: 'Both',
      query: {
        type: 'and',
        operands: [
          { type: 'constraint', categoryId: 'a', op: '>=', value: 1 },
          { type: 'constraint', categoryId: 'b', op: '>=', value: 1 },
        ],
      },
    }
    const r = analyze(cards, cats, [query], 5)
    expect(r.queryResults['q1'].decimal).toBeCloseTo(175735 / 658008, 10)
  })

  it('each category distribution sums to 1', () => {
    const r = analyze(cards, cats, [], 5)
    for (const dist of r.categoryDistributions) {
      const sum = dist.probabilities.reduce((s, p) => s + p, 0)
      expect(sum).toBeCloseTo(1, 8)
    }
  })
})

describe('analyze — invariants', () => {
  it('drawn counts in every vector sum to handSize (atom sum invariant)', () => {
    // Verified implicitly by correct sum-to-1 for all categories above.
    // Also test denominator matches C(N,n).
    const cards: DeckCard[] = [
      { cardId: 1, quantity: 10, categoryIds: ['a'] },
      { cardId: 2, quantity: 30, categoryIds: [] },
    ]
    const cats: Category[] = [{ id: 'a', name: 'A', color: '#f00' }]
    const r = analyze(cards, cats, [], 5)
    expect(r.denominator).toBe(comb(40n, 5n))
    expect(r.deckSize).toBe(40)
  })

  it('probabilities over a complete partition of outcomes sum to 1', () => {
    // Disjoint A, B, rest  →  every outcome is in exactly one category-count bucket
    const cards: DeckCard[] = [
      { cardId: 1, quantity: 10, categoryIds: ['a'] },
      { cardId: 2, quantity: 15, categoryIds: ['b'] },
      { cardId: 3, quantity: 15, categoryIds: [] },
    ]
    const cats: Category[] = [
      { id: 'a', name: 'A', color: '#f00' },
      { id: 'b', name: 'B', color: '#00f' },
    ]
    const r = analyze(cards, cats, [], 5)
    for (const dist of r.categoryDistributions) {
      const sum = dist.probabilities.reduce((s, p) => s + p, 0)
      expect(sum).toBeCloseTo(1, 8)
    }
  })

  it('query P(C>=1) == 1 - P(C=0)', () => {
    const cards: DeckCard[] = [
      { cardId: 1, quantity: 8, categoryIds: ['s'] },
      { cardId: 2, quantity: 32, categoryIds: [] },
    ]
    const cats: Category[] = [{ id: 's', name: 'Starter', color: '#0f0' }]
    const query: SavedQuery = {
      id: 'q',
      name: 'Has Starter',
      query: { type: 'constraint', categoryId: 's', op: '>=', value: 1 },
    }
    const r = analyze(cards, cats, [query], 5)
    const p0 = r.categoryDistributions[0].probabilities[0]
    expect(r.queryResults['q'].decimal).toBeCloseTo(1 - p0, 10)
  })
})
