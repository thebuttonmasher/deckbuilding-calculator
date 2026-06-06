/** Parse a .ydk file into passcode lists for main / extra / side. */
export interface YdkParsed {
  main: number[]
  extra: number[]
  side: number[]
}

export function parseYdk(content: string): YdkParsed {
  const lines = content.split(/\r?\n/).map((l) => l.trim())
  const result: YdkParsed = { main: [], extra: [], side: [] }
  let section: 'main' | 'extra' | 'side' | null = null

  for (const line of lines) {
    if (line === '#main') { section = 'main'; continue }
    if (line === '#extra') { section = 'extra'; continue }
    if (line === '!side') { section = 'side'; continue }
    if (line.startsWith('#') || line === '') continue
    const id = parseInt(line, 10)
    if (isNaN(id) || id <= 0) continue
    if (section) result[section].push(id)
  }

  return result
}

/**
 * Convert passcode arrays back into a .ydk string.
 * Duplicates are preserved — the format uses one line per copy.
 */
export function serializeYdk(main: number[], extra: number[], side: number[]): string {
  const lines: string[] = ['#created by YGO Deck Calculator', '#main']
  for (const id of main) lines.push(String(id))
  lines.push('#extra')
  for (const id of extra) lines.push(String(id))
  lines.push('!side')
  for (const id of side) lines.push(String(id))
  return lines.join('\n')
}
