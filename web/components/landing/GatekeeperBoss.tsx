'use client'

import { useState } from 'react'

const GatekeeperBoss = () => {
  const [copied, setCopied] = useState(false)
  const command = 'xattr -cr /Applications/medusa.app'

  const handleCopy = () => {
    navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 relative z-50 px-4 sm:px-6 lg:px-10" style={{backgroundColor: '#FBFBF4'}}>
      <div className="max-w-[900px] mx-auto">

        {/* Boss Fight Card */}
        <div className="relative overflow-hidden rounded-2xl border-2 p-6 sm:p-8 lg:p-10" style={{borderColor: '#D2691E', backgroundColor: '#F3F1E8'}}>

          {/* Decorative pixels in corners */}
          <div className="absolute top-3 left-3 w-2 h-2 rounded-sm" style={{backgroundColor: '#D2691E', opacity: 0.3}} />
          <div className="absolute top-3 right-3 w-2 h-2 rounded-sm" style={{backgroundColor: '#D2691E', opacity: 0.3}} />
          <div className="absolute bottom-3 left-3 w-2 h-2 rounded-sm" style={{backgroundColor: '#D2691E', opacity: 0.3}} />
          <div className="absolute bottom-3 right-3 w-2 h-2 rounded-sm" style={{backgroundColor: '#D2691E', opacity: 0.3}} />

          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <p className="text-xs sm:text-sm font-mono tracking-widest mb-2" style={{color: '#D2691E'}}>
              ⚔️ BOSS ENCOUNTER ⚔️
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold" style={{color: '#6B5B47'}}>
              macOS Gatekeeper
            </h2>
            <p className="text-sm sm:text-base mt-2" style={{color: '#6B5B47', opacity: 0.7}}>
              &quot;This app is from an unidentified developer&quot;
            </p>
          </div>

          {/* Health Bar */}
          <div className="max-w-md mx-auto mb-6 sm:mb-8">
            <div className="flex items-center justify-between text-xs font-mono mb-1" style={{color: '#6B5B47'}}>
              <span>HP</span>
              <span>1 / 1</span>
            </div>
            <div className="h-4 rounded-full overflow-hidden" style={{backgroundColor: '#6B5B47', opacity: 0.2}}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{backgroundColor: '#D2691E', width: '100%'}}
              />
            </div>
            <p className="text-xs text-center mt-1 font-mono" style={{color: '#6B5B47', opacity: 0.6}}>
              Weak to: Terminal commands
            </p>
          </div>

          {/* The Spell/Command */}
          <div className="mb-6 sm:mb-8">
            <p className="text-center text-sm sm:text-base mb-3" style={{color: '#6B5B47'}}>
              🗡️ <span className="font-medium">Cast this spell in Terminal to defeat:</span>
            </p>
            <div
              className="relative group cursor-pointer"
              onClick={handleCopy}
            >
              <div
                className="font-mono text-sm sm:text-base p-4 rounded-lg text-center transition-all"
                style={{backgroundColor: '#1a1a1a', color: '#e5e5e5'}}
              >
                <span style={{color: '#22C55E'}}>$</span> {command}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-sm font-medium">
                  {copied ? '✓ Copied!' : 'Click to copy'}
                </span>
              </div>
            </div>
            <p className="text-xs text-center mt-2" style={{color: '#6B5B47', opacity: 0.6}}>
              Or right-click the app → Open → &quot;Open Anyway&quot;
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6 sm:mb-8">
            <div className="flex-1 h-px" style={{backgroundColor: '#D2691E', opacity: 0.3}} />
            <span className="text-xs font-mono" style={{color: '#D2691E'}}>OR</span>
            <div className="flex-1 h-px" style={{backgroundColor: '#D2691E', opacity: 0.3}} />
          </div>

          {/* Skip Boss - Sponsor CTA */}
          <div className="text-center">
            <p className="text-sm sm:text-base mb-4" style={{color: '#6B5B47'}}>
              🏆 <span className="font-medium">Skip this boss forever?</span>
            </p>
            <p className="text-xs sm:text-sm mb-4 max-w-md mx-auto" style={{color: '#6B5B47', opacity: 0.7}}>
              Sponsor our Apple Developer License ($99/year) and help Medusa
              get the official seal of approval. No more Gatekeeper fights for anyone!
            </p>
            <a
              href="https://github.com/sponsors/benodiwal"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all hover:scale-105 hover:shadow-lg"
              style={{backgroundColor: '#D2691E'}}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              Become a Sponsor
            </a>
            <p className="text-xs mt-3" style={{color: '#6B5B47', opacity: 0.5}}>
              Rewards: Name in app credits + Eternal gratitude + Good karma ✨
            </p>
          </div>

        </div>

      </div>
    </section>
  )
}

export default GatekeeperBoss
