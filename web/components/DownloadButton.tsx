'use client'

import { useState } from 'react'
import { BiDownload } from 'react-icons/bi'
import Modal from './Modal'
import TypingAnimation from './TypingAnimation'

interface DownloadButtonProps {
  variant?: 'default' | 'compact'
  className?: string
}

const DownloadButton = ({ variant = 'default', className = '' }: DownloadButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)

  const handleDownloadSuccess = () => {
    setIsModalOpen(false)
    setShowThankYou(true)
  }

  if (showThankYou) {
    return (
      <div
        className={`px-3 py-2 sm:px-5 text-xs sm:text-sm font-bold flex items-center ${className}`}
        style={{ color: '#6B5B47' }}
      >
        <TypingAnimation
          text="Thank You! ✨"
          speed={150}
          showCursor={true}
          style={{ fontSize: 'inherit' }}
        />
      </div>
    )
  }

  return (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleDownloadSuccess}
        title="Download Medusa"
        submitText="Join Waitlist"
      />
      <button
        onClick={() => setIsModalOpen(true)}
        className={`px-3 py-2 sm:px-5 text-xs sm:text-sm font-medium border-2 rounded-md transition-all hover:shadow-md flex items-center gap-1 sm:gap-2 cursor-pointer ${className}`}
        style={{ borderColor: '#6B5B47', color: '#6B5B47' }}
      >
        <span className={variant === 'compact' ? 'sm:hidden' : 'hidden sm:inline'}>
          Download Medusa
        </span>
        <span className={variant === 'compact' ? 'hidden sm:inline' : 'sm:hidden'}>
          {variant === 'compact' ? 'Download Medusa' : 'Download'}
        </span>
        <BiDownload className="text-sm sm:text-lg" />
      </button>
    </>
  )
}

export default DownloadButton