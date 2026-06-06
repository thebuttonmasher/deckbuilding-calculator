export type Comparator = '>=' | '<=' | '==' | '>' | '<'

export interface AtomicConstraint {
  type: 'constraint'
  categoryId: string
  op: Comparator
  value: number
}

export interface AndQuery {
  type: 'and'
  operands: QueryNode[]
}

export interface OrQuery {
  type: 'or'
  operands: QueryNode[]
}

export interface NotQuery {
  type: 'not'
  operand: QueryNode
}

export type QueryNode = AtomicConstraint | AndQuery | OrQuery | NotQuery

export function evaluateQuery(
  query: QueryNode,
  counts: ReadonlyMap<string, number>,
): boolean {
  switch (query.type) {
    case 'constraint': {
      const count = counts.get(query.categoryId) ?? 0
      switch (query.op) {
        case '>=': return count >= query.value
        case '<=': return count <= query.value
        case '==': return count === query.value
        case '>':  return count > query.value
        case '<':  return count < query.value
      }
    }
    // eslint-disable-next-line no-fallthrough
    case 'and': return query.operands.every((op) => evaluateQuery(op, counts))
    case 'or':  return query.operands.some((op) => evaluateQuery(op, counts))
    case 'not': return !evaluateQuery(query.operand, counts)
  }
}

export function getQueryCategories(query: QueryNode): Set<string> {
  const result = new Set<string>()
  function collect(q: QueryNode): void {
    switch (q.type) {
      case 'constraint': result.add(q.categoryId); break
      case 'and':
      case 'or': q.operands.forEach(collect); break
      case 'not': collect(q.operand); break
    }
  }
  collect(query)
  return result
}
