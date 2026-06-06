import { useState } from 'react'
import type { QueryNode, Comparator } from '../engine/query'
import type { Category } from '../types'

interface Props {
  categories: Category[]
  initial?: QueryNode
  onSave: (name: string, query: QueryNode) => void
  onCancel: () => void
}

interface Condition {
  id: string
  categoryId: string
  op: Comparator
  value: number
}

function makeId() {
  return Math.random().toString(36).slice(2)
}

function conditionsToQuery(conditions: Condition[], combinator: 'and' | 'or'): QueryNode | null {
  if (conditions.length === 0) return null
  const leaves = conditions.map((c): QueryNode => ({
    type: 'constraint',
    categoryId: c.categoryId,
    op: c.op,
    value: c.value,
  }))
  if (leaves.length === 1) return leaves[0]
  return { type: combinator, operands: leaves }
}

function queryToConditions(q: QueryNode): { conditions: Condition[]; combinator: 'and' | 'or' } {
  if (q.type === 'constraint') {
    return {
      conditions: [{ id: makeId(), categoryId: q.categoryId, op: q.op, value: q.value }],
      combinator: 'and',
    }
  }
  if (q.type === 'and' || q.type === 'or') {
    const conditions: Condition[] = []
    for (const op of q.operands) {
      if (op.type === 'constraint') {
        conditions.push({ id: makeId(), categoryId: op.categoryId, op: op.op, value: op.value })
      }
    }
    return { conditions, combinator: q.type }
  }
  return { conditions: [], combinator: 'and' }
}

const OPS: Comparator[] = ['>=', '>', '==', '<', '<=']

export function QueryBuilder({ categories, initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial ? '' : 'New Query')
  const init = initial ? queryToConditions(initial) : { conditions: [], combinator: 'and' as const }
  const [conditions, setConditions] = useState<Condition[]>(init.conditions)
  const [combinator, setCombinator] = useState<'and' | 'or'>(init.combinator)

  function addCondition() {
    if (categories.length === 0) return
    setConditions((prev) => [
      ...prev,
      { id: makeId(), categoryId: categories[0].id, op: '>=', value: 1 },
    ])
  }

  function updateCondition(id: string, updates: Partial<Condition>) {
    setConditions((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }

  function removeCondition(id: string) {
    setConditions((prev) => prev.filter((c) => c.id !== id))
  }

  function handleSave() {
    const q = conditionsToQuery(conditions, combinator)
    if (!q) return
    onSave(name.trim() || 'Query', q)
  }

  const isValid = conditions.length > 0 && conditions.every((c) => c.categoryId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input
        style={{
          padding: '6px 8px',
          background: 'var(--surface-3)',
          border: '1px solid var(--border)',
          borderRadius: 4,
          color: 'var(--text)',
          fontSize: 13,
        }}
        placeholder="Query name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {conditions.length > 1 && (
        <div style={{ display: 'flex', gap: 6 }}>
          {(['and', 'or'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCombinator(c)}
              style={{
                padding: '3px 10px',
                background: combinator === c ? 'var(--accent)' : 'var(--surface-3)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                color: combinator === c ? '#fff' : 'var(--text)',
                fontSize: 12,
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >{c}</button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {conditions.map((cond) => (
          <div key={cond.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <select
              value={cond.categoryId}
              onChange={(e) => updateCondition(cond.id, { categoryId: e.target.value })}
              style={{ flex: 1, padding: '4px 6px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)', fontSize: 12 }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={cond.op}
              onChange={(e) => updateCondition(cond.id, { op: e.target.value as Comparator })}
              style={{ width: 44, padding: '4px 4px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)', fontSize: 12 }}
            >
              {OPS.map((op) => <option key={op} value={op}>{op}</option>)}
            </select>
            <input
              type="number"
              min={0}
              max={3}
              value={cond.value}
              onChange={(e) => updateCondition(cond.id, { value: parseInt(e.target.value, 10) || 0 })}
              style={{ width: 44, padding: '4px 6px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)', fontSize: 12 }}
            />
            <button
              onClick={() => removeCondition(cond.id)}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}
            >×</button>
          </div>
        ))}
      </div>

      <button
        onClick={addCondition}
        disabled={categories.length === 0}
        style={{ alignSelf: 'flex-start', padding: '4px 10px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--muted)', fontSize: 12, cursor: 'pointer' }}
      >+ Add condition</button>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '5px 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)', fontSize: 12, cursor: 'pointer' }}>
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!isValid}
          style={{ padding: '5px 12px', background: 'var(--accent)', border: 'none', borderRadius: 4, color: '#fff', fontSize: 12, cursor: 'pointer', opacity: isValid ? 1 : 0.5 }}
        >
          Save Query
        </button>
      </div>
    </div>
  )
}
