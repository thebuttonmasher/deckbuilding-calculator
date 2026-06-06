import { useState, useEffect } from 'react'
import { useDeckStore } from '../store/deckStore'
import { DeckZone } from './DeckZone'
import { fetchCardsByIds } from '../data/api'
import type { YGOCard } from '../types'
import styles from './DeckEditor.module.css'

export function DeckEditor() {
  const { deck } = useDeckStore()
  const [cardMap, setCardMap] = useState<Map<number, YGOCard>>(new Map())

  // Fetch card data for all cards in the deck
  useEffect(() => {
    const allIds = [
      ...deck.mainDeck,
      ...deck.extraDeck,
      ...deck.sideDeck,
    ].map((c) => c.cardId)
    const unique = [...new Set(allIds)]
    const missing = unique.filter((id) => !cardMap.has(id))
    if (missing.length === 0) return

    fetchCardsByIds(missing).then((cards) => {
      setCardMap((prev) => {
        const next = new Map(prev)
        for (const c of cards) next.set(c.id, c)
        return next
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.mainDeck, deck.extraDeck, deck.sideDeck])

  return (
    <div className={styles.editor}>
      <DeckZone
        zone="main"
        title="Main Deck"
        min={40}
        max={60}
        cardMap={cardMap}
      />
      <DeckZone
        zone="extra"
        title="Extra Deck"
        min={0}
        max={15}
        cardMap={cardMap}
      />
      <DeckZone
        zone="side"
        title="Side Deck"
        min={0}
        max={15}
        cardMap={cardMap}
      />
    </div>
  )
}
