import { useState, useEffect } from 'react'
import { Toolbar } from './components/Toolbar'
import { CardSearch } from './components/CardSearch'
import { DeckEditor } from './components/DeckEditor'
import { AnalysisPanel } from './components/AnalysisPanel'
import { Tutorial } from './components/Tutorial'
import { MobileNav, type MobileTab } from './components/MobileNav'
import { useIsMobile } from './hooks/useIsMobile'
import styles from './App.module.css'

export default function App() {
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<MobileTab>('deck')
  const isMobile = useIsMobile()

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
      <div className={`${styles.body} ${isMobile ? styles.bodyMobile : ''}`}>
        {(!isMobile || activeTab === 'search') && <CardSearch />}
        {(!isMobile || activeTab === 'deck') && <DeckEditor />}
        {(!isMobile || activeTab === 'analysis') && <AnalysisPanel />}
      </div>
      {isMobile && <MobileNav activeTab={activeTab} onChange={setActiveTab} />}
      {tutorialOpen && (
        <Tutorial
          onDone={handleTutorialDone}
          onTabChange={isMobile ? setActiveTab : undefined}
        />
      )}
    </div>
  )
}
