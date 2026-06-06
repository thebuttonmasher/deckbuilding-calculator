import { useState, useCallback, useRef } from 'react'
import type { YGOCard } from '../types'
import { searchCardsByName } from '../data/api'
import { useDeckStore } from '../store/deckStore'
import { isExtraDeckType } from '../types'
import styles from './CardSearch.module.css'

function useDebounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number): T {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  return useCallback(
    ((...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => fn(...args), delay)
    }) as T,
    [fn, delay],
  )
}

export function CardSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<YGOCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addCard } = useDeckStore()

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return }
    setLoading(true)
    setError(null)
    try {
      const cards = await searchCardsByName(q)
      setResults(cards.slice(0, 30))
    } catch {
      setError('Search failed. Check your internet connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  const debouncedSearch = useDebounce(doSearch, 350)

  function handleInput(v: string) {
    setQuery(v)
    debouncedSearch(v)
  }

  function handleAdd(card: YGOCard) {
    const zone = isExtraDeckType(card.type) ? 'extra' : 'main'
    addCard(card.id, zone)
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.searchRow}>
        <input
          className={styles.input}
          type="text"
          placeholder="Search cards…"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          spellCheck={false}
        />
        {loading && <span className={styles.spinner} />}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.results}>
        {results.map((card) => (
          <SearchResult key={card.id} card={card} onAdd={handleAdd} />
        ))}
        {!loading && !error && query.trim().length >= 2 && results.length === 0 && (
          <p className={styles.empty}>No cards found</p>
        )}
      </div>
    </aside>
  )
}

function SearchResult({ card, onAdd }: { card: YGOCard; onAdd: (c: YGOCard) => void }) {
  const img = card.card_images[0]?.image_url_small
  const zone = isExtraDeckType(card.type) ? 'extra' : 'main'

  return (
    <div className={styles.result} onClick={() => onAdd(card)} title={`Add to ${zone} deck`}>
      {img && <img src={img} alt={card.name} className={styles.thumb} loading="lazy" />}
      <div className={styles.resultInfo}>
        <span className={styles.resultName}>{card.name}</span>
        <span className={styles.resultType}>{card.race} {card.attribute ?? ''}</span>
      </div>
      <span className={`${styles.zoneBadge} ${styles[zone]}`}>{zone}</span>
    </div>
  )
}
