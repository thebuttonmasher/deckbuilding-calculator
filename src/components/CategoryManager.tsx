import { useState } from 'react'
import { useDeckStore } from '../store/deckStore'
import styles from './CategoryManager.module.css'

const PRESET_COLORS = [
  '#ef5350', '#ff9800', '#ffeb3b', '#66bb6a',
  '#26c6da', '#42a5f5', '#7e57c2', '#ec407a',
  '#8d6e63', '#78909c',
]

interface Props {
  onClose: () => void
}

export function CategoryManager({ onClose }: Props) {
  const { deck, addCategory, removeCategory, updateCategory } = useDeckStore()
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  function handleAdd() {
    const name = newName.trim()
    if (!name) return
    addCategory(name, newColor)
    setNewName('')
    setNewColor(PRESET_COLORS[(PRESET_COLORS.indexOf(newColor) + 1) % PRESET_COLORS.length])
  }

  function startEdit(id: string, name: string, color: string) {
    setEditingId(id)
    setEditName(name)
    setEditColor(color)
  }

  function commitEdit() {
    if (!editingId) return
    const name = editName.trim()
    if (name) updateCategory(editingId, { name, color: editColor })
    setEditingId(null)
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Categories</h3>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      <div className={styles.list}>
        {deck.categories.length === 0 && (
          <p className={styles.empty}>No categories yet. Add one below.</p>
        )}
        {deck.categories.map((c) => (
          <div key={c.id} className={styles.item}>
            {editingId === c.id ? (
              <div className={styles.editRow}>
                <ColorPicker value={editColor} onChange={setEditColor} />
                <input
                  className={styles.input}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitEdit() }}
                  autoFocus
                />
                <button className={styles.saveBtn} onClick={commitEdit}>Save</button>
                <button className={styles.cancelBtn} onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            ) : (
              <div className={styles.viewRow}>
                <span className={styles.dot} style={{ background: c.color }} />
                <span className={styles.name}>{c.name}</span>
                <button
                  className={styles.editBtn}
                  onClick={() => startEdit(c.id, c.name, c.color)}
                >Edit</button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => removeCategory(c.id)}
                  title="Delete category"
                >×</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.addRow}>
        <ColorPicker value={newColor} onChange={setNewColor} />
        <input
          className={styles.input}
          placeholder="New category name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
        />
        <button
          className={styles.addBtn}
          onClick={handleAdd}
          disabled={!newName.trim()}
        >Add</button>
      </div>
    </div>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className={styles.colorPicker}>
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          className={`${styles.colorSwatch} ${value === c ? styles.selected : ''}`}
          style={{ background: c }}
          onClick={() => onChange(c)}
          title={c}
        />
      ))}
    </div>
  )
}
