import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import styles from './Tutorial.module.css'

type Prefer = 'top' | 'bottom' | 'left' | 'right' | 'center'

type Step = {
  title: string
  body: string
  target: string | null
  prefer?: Prefer
}

const STEPS: Step[] = [
  {
    title: 'Welcome to YGO Deck Calc',
    body: "Build decks and calculate your opening hand odds. This 30-second tour covers the essentials.",
    target: null,
  },
  {
    title: 'Search for cards',
    body: "Type a card name here to search. Results appear instantly — click any result to add it to your deck.",
    target: 'card-search',
    prefer: 'right',
  },
  {
    title: 'Your deck zones',
    body: "Your deck is split into Main (40–60), Extra (0–15), and Side (0–15). Cards auto-route to the right zone.",
    target: 'deck-editor',
    prefer: 'center',
  },
  {
    title: 'Adjust quantities',
    body: "Click any card to open its detail view, or use the + / − buttons on the tile to quickly change how many copies you run.",
    target: null,
  },
  {
    title: 'Create categories',
    body: "Categories are tags you assign to cards — like 'Starter', 'Hand Trap', or 'Extender'. Click here to create some.",
    target: 'categories-btn',
    prefer: 'bottom',
  },
  {
    title: 'Tag your cards',
    body: "Once categories exist, open any card and toggle the colored buttons to tag it. Tagged cards light up with colored dots.",
    target: null,
  },
  {
    title: 'See your odds',
    body: "The analysis panel shows the probability of drawing each category in your opening hand — updated live as you edit.",
    target: 'analysis-panel',
    prefer: 'left',
  },
  {
    title: 'Build a query',
    body: "Queries let you ask specific questions — like 'at least 1 Starter AND 1 Hand Trap'. Save them and track exact combo odds.",
    target: 'new-query-btn',
    prefer: 'left',
  },
]

interface TutorialProps {
  onDone: () => void
}

export function Tutorial({ onDone }: TutorialProps) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const stepRef = useRef(step)
  stepRef.current = step

  const current = STEPS[step]

  const measureTarget = useCallback(() => {
    if (!current.target) { setRect(null); return }
    const el = document.querySelector(`[data-tutorial="${current.target}"]`)
    setRect(el ? el.getBoundingClientRect() : null)
  }, [current.target])

  useEffect(() => {
    measureTarget()
    window.addEventListener('resize', measureTarget)
    return () => window.removeEventListener('resize', measureTarget)
  }, [measureTarget])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onDone()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (stepRef.current < STEPS.length - 1) setStep((s) => s + 1)
        else onDone()
      } else if (e.key === 'ArrowLeft') {
        setStep((s) => Math.max(0, s - 1))
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onDone])

  function goNext() {
    if (step < STEPS.length - 1) setStep((s) => s + 1)
    else onDone()
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1))
  }

  const PAD = 8
  const highlightStyle = rect
    ? {
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null

  const tooltipStyle = computeTooltipStyle(rect, current.prefer)

  return (
    <div className={styles.overlay}>
      {rect ? (
        <div className={styles.spotlight} style={highlightStyle!} />
      ) : (
        <div className={styles.backdrop} />
      )}

      <div className={styles.tooltip} style={tooltipStyle}>
        <div className={styles.stepCount}>Step {step + 1} of {STEPS.length}</div>
        <h3 className={styles.title}>{current.title}</h3>
        <p className={styles.body}>{current.body}</p>
        <div className={styles.actions}>
          <button className={styles.skip} onClick={onDone}>Skip tour</button>
          <div className={styles.nav}>
            {step > 0 && (
              <button className={styles.back} onClick={goBack}>← Back</button>
            )}
            <button className={styles.next} onClick={goNext}>
              {step === STEPS.length - 1 ? 'Done' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const TOOLTIP_W = 288
const TOOLTIP_H = 220
const GAP = 16

function computeTooltipStyle(rect: DOMRect | null, prefer?: Prefer): CSSProperties {
  if (!rect || !prefer) {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  }

  const vw = window.innerWidth
  const vh = window.innerHeight

  const clampL = (l: number) => Math.max(GAP, Math.min(l, vw - TOOLTIP_W - GAP))
  const clampT = (t: number) => Math.max(GAP, Math.min(t, vh - TOOLTIP_H - GAP))

  switch (prefer) {
    case 'right': {
      const left = rect.right + GAP + TOOLTIP_W > vw
        ? rect.left - TOOLTIP_W - GAP
        : rect.right + GAP
      return { left: clampL(left), top: clampT(rect.top) }
    }
    case 'left': {
      const left = rect.left - TOOLTIP_W - GAP < 0
        ? rect.right + GAP
        : rect.left - TOOLTIP_W - GAP
      return { left: clampL(left), top: clampT(rect.top) }
    }
    case 'bottom': {
      const top = rect.bottom + GAP + TOOLTIP_H > vh
        ? rect.top - TOOLTIP_H - GAP
        : rect.bottom + GAP
      return { top: clampT(top), left: clampL(rect.left + rect.width / 2 - TOOLTIP_W / 2) }
    }
    case 'top': {
      const top = rect.top - TOOLTIP_H - GAP < 0
        ? rect.bottom + GAP
        : rect.top - TOOLTIP_H - GAP
      return { top: clampT(top), left: clampL(rect.left + rect.width / 2 - TOOLTIP_W / 2) }
    }
    case 'center': {
      return {
        top: clampT(rect.top + rect.height / 2 - TOOLTIP_H / 2),
        left: clampL(rect.left + rect.width / 2 - TOOLTIP_W / 2),
      }
    }
  }
}
