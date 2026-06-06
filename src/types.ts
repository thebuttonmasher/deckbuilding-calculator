import type { QueryNode } from './engine/query'

export interface DeckCard {
  cardId: number
  quantity: number
  categoryIds: string[]
}

export interface Category {
  id: string
  name: string
  color: string
}

export interface SavedQuery {
  id: string
  name: string
  query: QueryNode
}

export interface Deck {
  id: string
  name: string
  mainDeck: DeckCard[]
  extraDeck: DeckCard[]
  sideDeck: DeckCard[]
  categories: Category[]
  savedQueries: SavedQuery[]
  createdAt: number
  updatedAt: number
}

export type DeckZone = 'main' | 'extra' | 'side'

export interface YGOCardImage {
  id: number
  image_url: string
  image_url_small: string
  image_url_cropped: string
}

export interface YGOCard {
  id: number
  name: string
  type: string
  frameType: string
  desc: string
  atk?: number
  def?: number
  level?: number
  race: string
  attribute?: string
  archetype?: string
  card_images: YGOCardImage[]
}

export function isExtraDeckType(type: string): boolean {
  return (
    type.includes('Fusion') ||
    type.includes('Synchro') ||
    type.includes('XYZ') ||
    type.includes('Link')
  )
}
