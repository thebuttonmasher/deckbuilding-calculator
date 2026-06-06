import { useState, useEffect } from 'react'
import { Toolbar } from './components/Toolbar'
import { CardSearch } from './components/CardSearch'
import { DeckEditor } from './components/DeckEditor'
import { AnalysisPanel } from './components/AnalysisPanel'
import { Tutorial } from './components/Tutorial'
import styles from './App.module.css'

export default function App() {
  const [tutorialOpen, setTutorialOpen] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('tutorialSeen')) {
      setTutorialOpen(true)
    }
  }, [])

  function handleTutorialDone() {
    localStorage.setItem('tutorialSeen', '1')
    setTutorialOpen(false)
  }

  return (
    <div className={styles.app}>
      <Toolbar onOpenTutorial={() => setTutorialOpen(true)} />
      <div className={styles.body}>
        <CardSearch />
        <DeckEditor />
        <AnalysisPanel />
      </div>
      {tutorialOpen && <Tutorial onDone={handleTutorialDone} />}
    </div>
  )
}
