import { Toolbar } from './components/Toolbar'
import { CardSearch } from './components/CardSearch'
import { DeckEditor } from './components/DeckEditor'
import { AnalysisPanel } from './components/AnalysisPanel'
import styles from './App.module.css'

export default function App() {
  return (
    <div className={styles.app}>
      <Toolbar />
      <div className={styles.body}>
        <CardSearch />
        <DeckEditor />
        <AnalysisPanel />
      </div>
    </div>
  )
}
