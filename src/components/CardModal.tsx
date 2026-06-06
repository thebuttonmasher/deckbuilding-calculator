import { useEffect, useRef } from 'react'
import type { YGOCard, Category, DeckZone } from '../types'
import { useDeckStore } from '../store/deckStore'
import styles from './CardModal.module.css'

interface Props {
  card: YGOCard
  zone: DeckZone
  onClose: () => void
}

export function CardModal({ card, zone, onClose }: Props) {
  const { deck, addCard, removeCard, setQuantity, tagCard, untagCard, moveCard } = useDeckStore()
  const ref = useRef<HTMLDivElement>(null)

  const zoneKey = zone === 'main' ? 'mainDeck' : zone === 'extra' ? 'extraDeck' : 'sideDeck'
  const deckCard = deck[zoneKey].find((c) => c.cardId === card.id)
  const quantity = deckCard?.quantity ?? 0
  const taggedIds = deckCard?.categoryIds ?? []

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [onClose])

  function toggleCategory(catId: string) {
    if (taggedIds.includes(catId)) untagCard(card.id, zone, catId)
    else tagCard(card.id, zone, catId)
  }

  const imgSrc = card.card_images[0]?.image_url_small
  const otherZones: DeckZone[] = (['main', 'extra', 'side'] as DeckZone[]).filter((z) => z !== zone)

  return (
    <div className={styles.overlay}>
      <div ref={ref} className={styles.modal}>
        <button className={styles.close} onClick={onClose}>×</button>
        <div className={styles.top}>
          {imgSrc && <img src={imgSrc} alt={card.name} className={styles.img} />}
          <div className={styles.info}>
            <h3 className={styles.name}>{card.name}</h3>
            <div className={styles.meta}>
              <span>{card.type}</span>
              {card.attribute && <span>{card.attribute}</span>}
              {card.level != null && <span>Level {card.level}</span>}
              {card.atk != null && <span>ATK {card.atk} / DEF {card.def ?? '?'}</span>}
            </div>
            <p className={styles.desc}>{card.desc}</p>
          </div>
        </div>

        {quantity > 0 && (
          <div className={styles.section}>
            <label>Copies in {zone} deck</label>
            <div className={styles.qtyRow}>
              <button onClick={() => removeCard(card.id, zone)} className={styles.btn}>−</button>
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setQuantity(card.id, zone, n)}
                  className={`${styles.btn} ${quantity === n ? styles.active : ''}`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => addCard(card.id, zone)}
                disabled={quantity >= 3}
                className={styles.btn}
              >+</button>
            </div>
          </div>
        )}

        {deck.categories.length > 0 && quantity > 0 && (
          <div className={styles.section}>
            <label>Categories</label>
            <div className={styles.catList}>
              {deck.categories.map((c) => (
                <button
                  key={c.id}
                  className={`${styles.catBtn} ${taggedIds.includes(c.id) ? styles.catActive : ''}`}
                  style={taggedIds.includes(c.id) ? { borderColor: c.color, background: c.color + '33' } : {}}
                  onClick={() => toggleCategory(c.id)}
                >
                  <span className={styles.catDot} style={{ background: c.color }} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {quantity > 0 && (
          <div className={styles.section}>
            <label>Move to</label>
            <div className={styles.moveRow}>
              {otherZones.map((z) => (
                <button key={z} onClick={() => { moveCard(card.id, zone, z); onClose() }} className={styles.btn}>
                  {z} deck
                </button>
              ))}
              <button onClick={() => { removeCard(card.id, zone); onClose() }} className={`${styles.btn} ${styles.danger}`}>
                Remove
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
