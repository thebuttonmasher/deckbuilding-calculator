import { useMemo } from 'react'
import type { YGOCard, Category } from '../types'
import styles from './CardTile.module.css'

interface Props {
  card: YGOCard
  quantity: number
  categories: Category[]
  taggedCategoryIds: string[]
  onClick?: () => void
  onAddCopy?: () => void
  onRemoveCopy?: () => void
  compact?: boolean
}

export function CardTile({
  card,
  quantity,
  categories,
  taggedCategoryIds,
  onClick,
  onAddCopy,
  onRemoveCopy,
  compact = false,
}: Props) {
  const taggedCategories = useMemo(
    () => categories.filter((c) => taggedCategoryIds.includes(c.id)),
    [categories, taggedCategoryIds],
  )

  const imgSrc = card.card_images[0]?.image_url_small

  return (
    <div
      className={`${styles.tile} ${compact ? styles.compact : ''}`}
      title={card.name}
      onClick={onClick}
    >
      <div className={styles.imgWrapper}>
        {imgSrc && (
          <img
            src={imgSrc}
            alt={card.name}
            className={styles.img}
            loading="lazy"
          />
        )}
        <span className={styles.qty}>{quantity}</span>
        {onAddCopy && (
          <div className={styles.qtyControls}>
            <button
              className={styles.qtyBtn}
              onClick={(e) => { e.stopPropagation(); onAddCopy() }}
              disabled={quantity >= 3}
              title="Add copy"
            >+</button>
            <button
              className={styles.qtyBtn}
              onClick={(e) => { e.stopPropagation(); onRemoveCopy?.() }}
              title="Remove copy"
            >−</button>
          </div>
        )}
      </div>
      {taggedCategories.length > 0 && (
        <div className={styles.dots}>
          {taggedCategories.map((c) => (
            <span
              key={c.id}
              className={styles.dot}
              style={{ background: c.color }}
              title={c.name}
            />
          ))}
        </div>
      )}
    </div>
  )
}
