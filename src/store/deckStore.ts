import { create } from 'zustand'
import { analyze } from '../engine/analysis'
import type { AnalysisResult } from '../engine/analysis'
import type { QueryNode } from '../engine/query'
import type { Deck, DeckCard, DeckZone, Category, SavedQuery } from '../types'
import { saveDeck, loadDeck, deleteDeck, listDecks } from '../data/db'
import { fetchCardsByIds } from '../data/api'
import { parseYdk, serializeYdk } from '../data/ydk'

function uuid(): string {
  return crypto.randomUUID()
}

function emptyDeck(): Deck {
  return {
    id: uuid(),
    name: 'New Deck',
    mainDeck: [],
    extraDeck: [],
    sideDeck: [],
    categories: [],
    savedQueries: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

function cloneCards(cards: DeckCard[]): DeckCard[] {
  return cards.map((c) => ({ ...c, categoryIds: [...c.categoryIds] }))
}

function deckZoneKey(zone: DeckZone): 'mainDeck' | 'extraDeck' | 'sideDeck' {
  return zone === 'main' ? 'mainDeck' : zone === 'extra' ? 'extraDeck' : 'sideDeck'
}

function recompute(deck: Deck, handSize: 5 | 6): AnalysisResult {
  return analyze(deck.mainDeck, deck.categories, deck.savedQueries, handSize)
}

export interface DeckStore {
  deck: Deck
  handSize: 5 | 6
  analysis: AnalysisResult
  savedDecks: Array<{ id: string; name: string; updatedAt: number }>
  selectedCardId: number | null
  selectedZone: DeckZone | null

  // Deck card mutations
  addCard: (cardId: number, zone: DeckZone) => void
  removeCard: (cardId: number, zone: DeckZone) => void
  setQuantity: (cardId: number, zone: DeckZone, quantity: number) => void
  moveCard: (cardId: number, fromZone: DeckZone, toZone: DeckZone) => void

  // Category mutations
  addCategory: (name: string, color: string) => void
  removeCategory: (categoryId: string) => void
  updateCategory: (categoryId: string, updates: { name?: string; color?: string }) => void

  // Tagging
  tagCard: (cardId: number, zone: DeckZone, categoryId: string) => void
  untagCard: (cardId: number, zone: DeckZone, categoryId: string) => void

  // Query mutations
  addQuery: (name: string, query: QueryNode) => void
  removeQuery: (queryId: string) => void
  updateQuery: (queryId: string, updates: { name?: string; query?: QueryNode }) => void

  // Hand size
  setHandSize: (size: 5 | 6) => void

  // Selection
  selectCard: (cardId: number | null, zone: DeckZone | null) => void

  // Persistence
  newDeck: () => void
  renameDeck: (name: string) => void
  persistDeck: () => Promise<void>
  loadDeckById: (id: string) => Promise<void>
  deleteDeckById: (id: string) => Promise<void>
  refreshSavedDecks: () => Promise<void>

  // Import / Export
  importYdk: (content: string) => Promise<void>
  exportYdk: () => string
}

const initialDeck = emptyDeck()

export const useDeckStore = create<DeckStore>((set, get) => ({
  deck: initialDeck,
  handSize: 5,
  analysis: recompute(initialDeck, 5),
  savedDecks: [],
  selectedCardId: null,
  selectedZone: null,

  addCard(cardId, zone) {
    set((s) => {
      const key = deckZoneKey(zone)
      const cards = cloneCards(s.deck[key])
      const existing = cards.find((c) => c.cardId === cardId)
      if (existing) {
        if (existing.quantity >= 3) return s
        existing.quantity++
      } else {
        cards.push({ cardId, quantity: 1, categoryIds: [] })
      }
      const deck = { ...s.deck, [key]: cards, updatedAt: Date.now() }
      return { deck, analysis: recompute(deck, s.handSize) }
    })
  },

  removeCard(cardId, zone) {
    set((s) => {
      const key = deckZoneKey(zone)
      let cards = cloneCards(s.deck[key])
      const idx = cards.findIndex((c) => c.cardId === cardId)
      if (idx === -1) return s
      if (cards[idx].quantity > 1) {
        cards[idx].quantity--
      } else {
        cards.splice(idx, 1)
      }
      const deck = { ...s.deck, [key]: cards, updatedAt: Date.now() }
      return { deck, analysis: recompute(deck, s.handSize) }
    })
  },

  setQuantity(cardId, zone, quantity) {
    if (quantity < 1 || quantity > 3) return
    set((s) => {
      const key = deckZoneKey(zone)
      const cards = cloneCards(s.deck[key])
      const card = cards.find((c) => c.cardId === cardId)
      if (!card) return s
      card.quantity = quantity
      const deck = { ...s.deck, [key]: cards, updatedAt: Date.now() }
      return { deck, analysis: recompute(deck, s.handSize) }
    })
  },

  moveCard(cardId, fromZone, toZone) {
    if (fromZone === toZone) return
    set((s) => {
      const fromKey = deckZoneKey(fromZone)
      const toKey = deckZoneKey(toZone)
      const fromCards = cloneCards(s.deck[fromKey])
      const toCards = cloneCards(s.deck[toKey])
      const idx = fromCards.findIndex((c) => c.cardId === cardId)
      if (idx === -1) return s
      const [moved] = fromCards.splice(idx, 1)
      const existing = toCards.find((c) => c.cardId === cardId)
      if (existing) {
        existing.quantity = Math.min(3, existing.quantity + moved.quantity)
      } else {
        toCards.push(moved)
      }
      const deck = {
        ...s.deck,
        [fromKey]: fromCards,
        [toKey]: toCards,
        updatedAt: Date.now(),
      }
      return { deck, analysis: recompute(deck, s.handSize) }
    })
  },

  addCategory(name, color) {
    set((s) => {
      const categories = [...s.deck.categories, { id: uuid(), name, color }]
      const deck = { ...s.deck, categories, updatedAt: Date.now() }
      return { deck, analysis: recompute(deck, s.handSize) }
    })
  },

  removeCategory(categoryId) {
    set((s) => {
      const categories = s.deck.categories.filter((c) => c.id !== categoryId)
      const strip = (cards: DeckCard[]) =>
        cards.map((c) => ({
          ...c,
          categoryIds: c.categoryIds.filter((id) => id !== categoryId),
        }))
      const deck = {
        ...s.deck,
        categories,
        mainDeck: strip(s.deck.mainDeck),
        extraDeck: strip(s.deck.extraDeck),
        sideDeck: strip(s.deck.sideDeck),
        savedQueries: s.deck.savedQueries.filter((q) => {
          // Remove queries that reference this category (simplistic)
          return !JSON.stringify(q.query).includes(`"${categoryId}"`)
        }),
        updatedAt: Date.now(),
      }
      return { deck, analysis: recompute(deck, s.handSize) }
    })
  },

  updateCategory(categoryId, updates) {
    set((s) => {
      const categories = s.deck.categories.map((c) =>
        c.id === categoryId ? { ...c, ...updates } : c,
      )
      const deck = { ...s.deck, categories, updatedAt: Date.now() }
      return { deck, analysis: recompute(deck, s.handSize) }
    })
  },

  tagCard(cardId, zone, categoryId) {
    set((s) => {
      const key = deckZoneKey(zone)
      const cards = cloneCards(s.deck[key])
      const card = cards.find((c) => c.cardId === cardId)
      if (!card || card.categoryIds.includes(categoryId)) return s
      card.categoryIds.push(categoryId)
      const deck = { ...s.deck, [key]: cards, updatedAt: Date.now() }
      return { deck, analysis: recompute(deck, s.handSize) }
    })
  },

  untagCard(cardId, zone, categoryId) {
    set((s) => {
      const key = deckZoneKey(zone)
      const cards = cloneCards(s.deck[key])
      const card = cards.find((c) => c.cardId === cardId)
      if (!card) return s
      card.categoryIds = card.categoryIds.filter((id) => id !== categoryId)
      const deck = { ...s.deck, [key]: cards, updatedAt: Date.now() }
      return { deck, analysis: recompute(deck, s.handSize) }
    })
  },

  addQuery(name, query) {
    set((s) => {
      const savedQueries = [...s.deck.savedQueries, { id: uuid(), name, query }]
      const deck = { ...s.deck, savedQueries, updatedAt: Date.now() }
      return { deck, analysis: recompute(deck, s.handSize) }
    })
  },

  removeQuery(queryId) {
    set((s) => {
      const savedQueries = s.deck.savedQueries.filter((q) => q.id !== queryId)
      const deck = { ...s.deck, savedQueries, updatedAt: Date.now() }
      return { deck, analysis: recompute(deck, s.handSize) }
    })
  },

  updateQuery(queryId, updates) {
    set((s) => {
      const savedQueries = s.deck.savedQueries.map((q) =>
        q.id === queryId ? { ...q, ...updates } : q,
      )
      const deck = { ...s.deck, savedQueries, updatedAt: Date.now() }
      return { deck, analysis: recompute(deck, s.handSize) }
    })
  },

  setHandSize(size) {
    set((s) => ({ handSize: size, analysis: recompute(s.deck, size) }))
  },

  selectCard(cardId, zone) {
    set({ selectedCardId: cardId, selectedZone: zone })
  },

  newDeck() {
    const deck = emptyDeck()
    set({ deck, analysis: recompute(deck, get().handSize), selectedCardId: null })
  },

  renameDeck(name) {
    set((s) => {
      const deck = { ...s.deck, name, updatedAt: Date.now() }
      return { deck }
    })
  },

  async persistDeck() {
    const { deck } = get()
    await saveDeck({ ...deck, updatedAt: Date.now() })
    await get().refreshSavedDecks()
  },

  async loadDeckById(id) {
    const deck = await loadDeck(id)
    if (!deck) return
    set((s) => ({ deck, analysis: recompute(deck, s.handSize), selectedCardId: null }))
  },

  async deleteDeckById(id) {
    await deleteDeck(id)
    await get().refreshSavedDecks()
  },

  async refreshSavedDecks() {
    const savedDecks = await listDecks()
    set({ savedDecks })
  },

  async importYdk(content) {
    const { main, extra, side } = parseYdk(content)
    const allIds = [...new Set([...main, ...extra, ...side])]
    const cards = await fetchCardsByIds(allIds)
    const cardMap = new Map(cards.map((c) => [c.id, c]))

    function toDeckCards(ids: number[]): DeckCard[] {
      const counts = new Map<number, number>()
      for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1)
      const result: DeckCard[] = []
      for (const [id, qty] of counts) {
        if (cardMap.has(id)) result.push({ cardId: id, quantity: qty, categoryIds: [] })
      }
      return result
    }

    const deck: Deck = {
      ...emptyDeck(),
      mainDeck: toDeckCards(main),
      extraDeck: toDeckCards(extra),
      sideDeck: toDeckCards(side),
    }
    set((s) => ({ deck, analysis: recompute(deck, s.handSize), selectedCardId: null }))
  },

  exportYdk() {
    const { deck } = get()
    function expand(cards: DeckCard[]): number[] {
      return cards.flatMap((c) => Array(c.quantity).fill(c.cardId))
    }
    return serializeYdk(expand(deck.mainDeck), expand(deck.extraDeck), expand(deck.sideDeck))
  },
}))
