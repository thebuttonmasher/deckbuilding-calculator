import { useRef, useState, useEffect } from 'react'
import { useDeckStore } from '../store/deckStore'
import { CategoryManager } from './CategoryManager'
import { useIsMobile } from '../hooks/useIsMobile'
import styles from './Toolbar.module.css'

interface ToolbarProps {
  onOpenTutorial: () => void
}

export function Toolbar({ onOpenTutorial }: ToolbarProps) {
  const {
    deck, savedDecks,
    newDeck, renameDeck, persistDeck, loadDeckById, deleteDeckById,
    refreshSavedDecks, importYdk, exportYdk,
  } = useDeckStore()

  const [showDecks, setShowDecks] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [showOverflow, setShowOverflow] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal] = useState(deck.name)
  const fileRef = useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()

  useEffect(() => { refreshSavedDecks() }, [refreshSavedDecks])
  useEffect(() => { setNameVal(deck.name) }, [deck.name])

  function commitName() {
    setEditingName(false)
    if (nameVal.trim()) renameDeck(nameVal.trim())
    else setNameVal(deck.name)
  }

  function handleExport() {
    const content = exportYdk()
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${deck.name.replace(/\s+/g, '_')}.ydk`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    file.text().then(importYdk)
    e.target.value = ''
  }

  return (
    <header className={styles.toolbar}>
      <div className={styles.left}>
        <span className={styles.logo}>YGO Deck Calc</span>
        {editingName ? (
          <input
            className={styles.nameInput}
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => { if (e.key === 'Enter') commitName() }}
            autoFocus
          />
        ) : (
          <span className={styles.deckName} onClick={() => setEditingName(true)} title="Click to rename">
            {deck.name}
          </span>
        )}
      </div>

      <div className={styles.right}>
        {isMobile ? (
          <>
            <button className={styles.btn} onClick={persistDeck}>Save</button>

            <div className={styles.relative}>
              <button className={styles.btn} onClick={() => setShowDecks((v) => !v)}>
                Load ▾
              </button>
              {showDecks && (
                <div className={styles.dropdown}>
                  {savedDecks.length === 0 && (
                    <span className={styles.dropEmpty}>No saved decks</span>
                  )}
                  {savedDecks.map((d) => (
                    <div key={d.id} className={styles.dropItem}>
                      <span
                        className={styles.dropName}
                        onClick={() => { loadDeckById(d.id); setShowDecks(false) }}
                      >{d.name}</span>
                      <button
                        className={styles.dropDelete}
                        onClick={() => deleteDeckById(d.id)}
                        title="Delete"
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.relative}>
              <button data-tutorial="categories-btn" className={styles.btn} onClick={() => setShowOverflow((v) => !v)}>•••</button>
              {showOverflow && (
                <div className={styles.dropdown}>
                  <button
                    className={styles.dropAction}
                    onClick={() => { newDeck(); setShowOverflow(false) }}
                  >New Deck</button>
                  <button
                    className={styles.dropAction}
                    onClick={() => { setShowCategories((v) => !v); setShowOverflow(false) }}
                  >Categories</button>
                  <button
                    className={styles.dropAction}
                    onClick={() => { fileRef.current?.click(); setShowOverflow(false) }}
                  >Import .ydk</button>
                  <button
                    className={styles.dropAction}
                    onClick={() => { handleExport(); setShowOverflow(false) }}
                  >Export .ydk</button>
                </div>
              )}
            </div>

            <input ref={fileRef} type="file" accept=".ydk" style={{ display: 'none' }} onChange={handleImport} />
          </>
        ) : (
          <>
            <button
              data-tutorial="categories-btn"
              className={styles.btn}
              onClick={() => setShowCategories((v) => !v)}
            >
              Categories
            </button>

            <button className={styles.btn} onClick={newDeck}>New</button>
            <button className={styles.btn} onClick={persistDeck}>Save</button>

            <div className={styles.relative}>
              <button className={styles.btn} onClick={() => setShowDecks((v) => !v)}>
                Load ▾
              </button>
              {showDecks && (
                <div className={styles.dropdown}>
                  {savedDecks.length === 0 && (
                    <span className={styles.dropEmpty}>No saved decks</span>
                  )}
                  {savedDecks.map((d) => (
                    <div key={d.id} className={styles.dropItem}>
                      <span
                        className={styles.dropName}
                        onClick={() => { loadDeckById(d.id); setShowDecks(false) }}
                      >{d.name}</span>
                      <button
                        className={styles.dropDelete}
                        onClick={() => deleteDeckById(d.id)}
                        title="Delete"
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className={styles.btn} onClick={() => fileRef.current?.click()}>Import .ydk</button>
            <input ref={fileRef} type="file" accept=".ydk" style={{ display: 'none' }} onChange={handleImport} />

            <button className={styles.btn} onClick={handleExport}>Export .ydk</button>
          </>
        )}

        <button className={styles.helpBtn} onClick={onOpenTutorial} title="Open tutorial">?</button>
      </div>

      {showCategories && (
        <div className={styles.categoryOverlay}>
          <CategoryManager onClose={() => setShowCategories(false)} />
        </div>
      )}
    </header>
  )
}
