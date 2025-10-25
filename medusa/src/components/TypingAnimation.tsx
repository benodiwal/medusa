import { useState, useEffect } from 'react'

interface TypingAnimationProps {
  text: string
  speed?: number
  showCursor?: boolean
  style?: React.CSSProperties
  className?: string
  delay?: number
}

const TypingAnimation = ({
  text,
  speed = 100,
  showCursor = true,
  style = {},
  className = '',
  delay = 0
}: TypingAnimationProps) => {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showCursorBlink, setShowCursorBlink] = useState(true)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (delay > 0) {
      const delayTimer = setTimeout(() => {
        setStarted(true)
      }, delay)
      return () => clearTimeout(delayTimer)
    } else {
      setStarted(true)
    }
  }, [delay])

  useEffect(() => {
    if (!started) return

    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timer)
    }
  }, [currentIndex, text, speed, started])

  useEffect(() => {
    if (showCursor) {
      const cursorTimer = setInterval(() => {
        setShowCursorBlink(prev => !prev)
      }, 530)

      return () => clearInterval(cursorTimer)
    }
  }, [showCursor])

  return (
    <span className={className} style={style}>
      {displayedText}
      {showCursor && (
        <span
          className={`inline-block ${showCursorBlink ? 'opacity-100' : 'opacity-0'}`}
          style={{ transition: 'opacity 0.1s' }}
        >
          |
        </span>
      )}
    </span>
  )
}

export default TypingAnimation