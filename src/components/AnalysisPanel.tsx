import { useState } from 'react'
import { useDeckStore } from '../store/deckStore'
import { QueryBuilder } from './QueryBuilder'
import type { QueryNode } from '../engine/query'
import styles from './AnalysisPanel.module.css'

function pct(p: number): string {
  return (p * 100).toFixed(1) + '%'
}

export function AnalysisPanel() {
  const { deck, analysis, handSize, setHandSize, addQuery, removeQuery, updateQuery } = useDeckStore()
  const [buildingQuery, setBuildingQuery] = useState(false)
  const [editingQueryId, setEditingQueryId] = useState<string | null>(null)

  const mainSize = deck.mainDeck.reduce((s, c) => s + c.quantity, 0)

  function handleSaveQuery(name: string, query: QueryNode) {
    if (editingQueryId) {
      updateQuery(editingQueryId, { name, query })
      setEditingQueryId(null)
    } else {
      addQuery(name, query)
    }
    setBuildingQuery(false)
  }

  return (
    <aside className={styles.panel}>
      <h2 className={styles.heading}>Analysis</h2>

      {/* Hand size toggle */}
      <div className={styles.section}>
        <div className={styles.handToggle}>
          <span className={styles.label}>Going</span>
          <button
            className={`${styles.toggleBtn} ${handSize === 5 ? styles.active : ''}`}
            onClick={() => setHandSize(5)}
          >1st (5 cards)</button>
          <button
            className={`${styles.toggleBtn} ${handSize === 6 ? styles.active : ''}`}
            onClick={() => setHandSize(6)}
          >2nd (6 cards)</button>
        </div>
      </div>

      {/* Deck stats */}
      <div className={styles.section}>
        <div className={styles.stat}>
          <span>Main deck</span>
          <span className={`${styles.statVal} ${mainSize >= 40 && mainSize <= 60 ? styles.ok : styles.warn}`}>
            {mainSize} cards
          </span>
        </div>
        {analysis.deckSize > 0 && (
          <div className={styles.stat}>
            <span>Atoms</span>
            <span className={styles.statVal}>{analysis.atoms.length}</span>
          </div>
        )}
      </div>

      {/* Category distributions */}
      {deck.categories.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.subheading}>Draw Distributions</h3>
          {deck.categories.map((cat) => {
            const dist = analysis.categoryDistributions.find((d) => d.categoryId === cat.id)
            if (!dist) return null
            const catTotal = deck.mainDeck
              .filter((c) => c.categoryIds.includes(cat.id))
              .reduce((s, c) => s + c.quantity, 0)
            return (
              <div key={cat.id} className={styles.distBlock}>
                <div className={styles.distHeader}>
                  <span className={styles.catDot} style={{ background: cat.color }} />
                  <span className={styles.catName}>{cat.name}</span>
                  <span className={styles.catCount}>{catTotal} copies</span>
                </div>
                {dist.probabilities.map((p, k) => (
                  <div key={k} className={styles.distRow}>
                    <span className={styles.distK}>
                      {k < dist.probabilities.length - 1 ? `=${k}` : `≥${k}`}
                    </span>
                    <div className={styles.barWrap}>
                      <div
                        className={styles.bar}
                        style={{ width: `${Math.min(100, p * 100)}%`, background: cat.color }}
                      />
                    </div>
                    <span className={styles.distP}>{pct(p)}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* Saved queries */}
      <div className={styles.section}>
        <div className={styles.queryHeader}>
          <h3 className={styles.subheading}>Queries</h3>
          {!buildingQuery && (
            <button
              className={styles.addBtn}
              onClick={() => { setBuildingQuery(true); setEditingQueryId(null) }}
              disabled={deck.categories.length === 0}
              title={deck.categories.length === 0 ? 'Add categories first' : 'New query'}
            >+ New</button>
          )}
        </div>

        {(buildingQuery || editingQueryId !== null) && (
          <div className={styles.builderBox}>
            <QueryBuilder
              categories={deck.categories}
              initial={editingQueryId ? deck.savedQueries.find((q) => q.id === editingQueryId)?.query : undefined}
              onSave={handleSaveQuery}
              onCancel={() => { setBuildingQuery(false); setEditingQueryId(null) }}
            />
          </div>
        )}

        {deck.savedQueries.length === 0 && !buildingQuery && (
          <p className={styles.empty}>No queries yet.</p>
        )}

        {deck.savedQueries.map((q) => {
          const result = analysis.queryResults[q.id]
          const p = result?.decimal ?? 0
          const brickP = 1 - p
          return (
            <div key={q.id} className={styles.queryCard}>
              <div className={styles.queryTop}>
                <span className={styles.queryName}>{q.name}</span>
                <div className={styles.queryActions}>
                  <button
                    className={styles.iconBtn}
                    onClick={() => { setEditingQueryId(q.id); setBuildingQuery(false) }}
                    title="Edit"
                  >✎</button>
                  <button
                    className={`${styles.iconBtn} ${styles.danger}`}
                    onClick={() => removeQuery(q.id)}
                    title="Delete"
                  >×</button>
                </div>
              </div>
              <div className={styles.queryResult}>
                <span className={styles.queryProb} style={{ color: p > 0.7 ? '#66bb6a' : p > 0.4 ? '#ff9800' : '#ef5350' }}>
                  {pct(p)}
                </span>
                <span className={styles.queryBrick}>brick {pct(brickP)}</span>
              </div>
              <div className={styles.barWrap} style={{ marginTop: 4 }}>
                <div className={styles.bar} style={{ width: `${p * 100}%`, background: 'var(--accent)' }} />
              </div>
            </div>
          )
        })}
      </div>

      {analysis.deckSize === 0 && (
        <p className={styles.hint}>Add cards to your main deck to see probabilities.</p>
      )}
    </aside>
  )
}
