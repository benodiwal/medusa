'use client'

import { useState, useEffect } from 'react'

interface TypingAnimationProps {
  text: string
  speed?: number
  className?: string
  style?: React.CSSProperties
  showCursor?: boolean
}

const TypingAnimation = ({
  text,
  speed = 100,
  className = '',
  style = {},
  showCursor = true
}: TypingAnimationProps) => {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showBlink, setShowBlink] = useState(true)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)
      return () => clearTimeout(timeout)
    }
  }, [currentIndex, text, speed])

  useEffect(() => {
    if (showCursor) {
      const interval = setInterval(() => {
        setShowBlink(prev => !prev)
      }, 500)
      return () => clearInterval(interval)
    }
  }, [showCursor])

  return (
    <span className={className} style={style}>
      {displayText}
      {showCursor && (
        <span
          style={{
            opacity: showBlink ? 1 : 0,
            marginLeft: '2px',
            fontWeight: 'normal'
          }}
        >
          |
        </span>
      )}
    </span>
  )
}

export default TypingAnimation