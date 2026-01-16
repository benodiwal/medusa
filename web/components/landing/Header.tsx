'use client'

import Image from "next/image"
import DownloadButton from "../DownloadButton"

const Header = () => {
  return (
      <header className="fixed top-9 w-full z-[100] border-b border-gray-100" style={{backgroundColor: '#FBFBF4'}}>
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Image
                src="/medusa-logo.png"
                alt="Medusa Logo"
                width={48}
                height={48}
                className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14"
              />
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-wider" style={{color: '#6B5B47'}}>
                MEDUSA
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <a
                href="/docs"
                className="text-sm font-medium hover:underline hidden sm:block"
                style={{color: '#6B5B47'}}
              >
                Docs
              </a>
              <a
                href="/pricing"
                className="text-sm font-medium hover:underline"
                style={{color: '#6B5B47'}}
              >
                Pricing
              </a>
              <a
                href="https://screen.studio/share/VWB7nmog"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:underline"
                style={{color: '#6B5B47'}}
              >
                Demo
              </a>
              <a
                href="https://github.com/benodiwal/medusa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:underline hidden sm:block"
                style={{color: '#6B5B47'}}
              >
                GitHub
              </a>
              <DownloadButton />
            </div>
          </div>
        </div>
      </header>
  )
}

export default Header