'use client'

import { useState } from 'react'
import Link from 'next/link'

const SponsorBanner = () => {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] w-full py-2 px-4" style={{backgroundColor: '#6B5B47'}}>
      <div className="max-w-[1380px] mx-auto flex items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
        <span className="hidden sm:inline">⚔️</span>
        <p className="text-white/90 text-center">
          <span className="hidden sm:inline">Help us defeat the </span>
          <span className="font-medium text-white">macOS Gatekeeper boss</span>
          <span className="hidden sm:inline"> — </span>
          <span className="sm:hidden"> · </span>
          <Link
            href="https://github.com/sponsors/benodiwal"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline font-medium"
            style={{color: '#FFD700'}}
          >
            Sponsor our Apple Developer License
          </Link>
          <span className="hidden sm:inline"> ($99/year)</span>
        </p>
        <span className="hidden sm:inline">💛</span>

        {/* Dismiss button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1 text-white/60 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default SponsorBanner
