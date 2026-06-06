import { useState } from 'react'
import type { DeckZone as ZoneType, YGOCard } from '../types'
import { useDeckStore } from '../store/deckStore'
import { CardTile } from './CardTile'
import { CardModal } from './CardModal'
import styles from './DeckZone.module.css'

interface Props {
  zone: ZoneType
  title: string
  min: number
  max: number
  cardMap: Map<number, YGOCard>
}

export function DeckZone({ zone, title, min, max, cardMap }: Props) {
  const { deck, addCard, removeCard } = useDeckStore()
  const [openCard, setOpenCard] = useState<YGOCard | null>(null)

  const key = zone === 'main' ? 'mainDeck' : zone === 'extra' ? 'extraDeck' : 'sideDeck'
  const deckCards = deck[key]
  const totalCards = deckCards.reduce((s, c) => s + c.quantity, 0)

  const isValid = totalCards >= min && totalCards <= max
  const isEmpty = totalCards === 0

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const cardId = parseInt(e.dataTransfer.getData('cardId'), 10)
    if (!isNaN(cardId)) addCard(cardId, zone)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  return (
    <div className={styles.zone}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <span className={`${styles.count} ${isValid ? styles.valid : isEmpty ? styles.empty : styles.invalid}`}>
          {totalCards} / {max}
          {min > 0 && totalCards < min && <span className={styles.hint}> (min {min})</span>}
        </span>
      </div>

      <div
        className={`${styles.grid} ${isEmpty ? styles.dropTarget : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {deckCards.map((dc) => {
          const card = cardMap.get(dc.cardId)
          if (!card) return <PlaceholderTile key={dc.cardId} cardId={dc.cardId} quantity={dc.quantity} />
          return (
            <div
              key={dc.cardId}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('cardId', String(dc.cardId))}
            >
              <CardTile
                card={card}
                quantity={dc.quantity}
                categories={deck.categories}
                taggedCategoryIds={dc.categoryIds}
                onClick={() => setOpenCard(card)}
                onAddCopy={() => addCard(dc.cardId, zone)}
                onRemoveCopy={() => removeCard(dc.cardId, zone)}
              />
            </div>
          )
        })}
        {isEmpty && (
          <p className={styles.emptyText}>Drop cards here or search and click to add</p>
        )}
      </div>

      {openCard && (
        <CardModal card={openCard} zone={zone} onClose={() => setOpenCard(null)} />
      )}
    </div>
  )
}

function PlaceholderTile({ cardId, quantity }: { cardId: number; quantity: number }) {
  return (
    <div className={styles.placeholder} title={`Card #${cardId}`}>
      <span className={styles.placeholderQty}>{quantity}×</span>
      <span className={styles.placeholderId}>{cardId}</span>
    </div>
  )
}
