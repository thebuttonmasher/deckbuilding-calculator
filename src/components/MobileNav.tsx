import styles from './MobileNav.module.css'

export type MobileTab = 'search' | 'deck' | 'analysis'

interface MobileNavProps {
  activeTab: MobileTab
  onChange: (tab: MobileTab) => void
}

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="8.5" cy="8.5" r="5.5" />
    <line x1="13" y1="13" x2="18" y2="18" />
  </svg>
)

const DeckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="11" height="14" rx="1" />
    <path d="M6 5V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-2" />
  </svg>
)

const AnalysisIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="12" width="4" height="6" rx="0.5" />
    <rect x="8" y="7" width="4" height="11" rx="0.5" />
    <rect x="14" y="3" width="4" height="15" rx="0.5" />
  </svg>
)

const TABS: { id: MobileTab; label: string; Icon: () => JSX.Element }[] = [
  { id: 'search',   label: 'Search',   Icon: SearchIcon },
  { id: 'deck',     label: 'Deck',     Icon: DeckIcon },
  { id: 'analysis', label: 'Analysis', Icon: AnalysisIcon },
]

export function MobileNav({ activeTab, onChange }: MobileNavProps) {
  return (
    <nav className={styles.nav}>
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`${styles.tab} ${activeTab === id ? styles.active : ''}`}
          onClick={() => onChange(id)}
        >
          <span className={styles.icon}><Icon /></span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
