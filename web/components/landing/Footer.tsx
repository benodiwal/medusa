'use client'

import DownloadButton from '../DownloadButton'

const Footer = () => {
  return (
    <footer className="relative py-12 sm:py-16 lg:py-20" style={{backgroundColor: '#FBFBF4'}}>
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10">

        {/* Main CTA Section */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6" style={{color: '#6B5B47'}}>
            Stop flying blind
          </h2>

          <p className="text-base sm:text-lg mb-6 sm:mb-8" style={{color: '#6B5B47'}}>
            Add human oversight to Claude Code. Review every plan, approve only what you trust.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <DownloadButton />
            <a
              href="https://github.com/benodiwal/medusa"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 text-sm font-medium border-2 rounded-md transition-all hover:shadow-md"
              style={{ borderColor: '#6B5B47', color: '#6B5B47' }}
            >
              View Source on GitHub
            </a>
          </div>
        </div>

        {/* Bottom Links */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm" style={{color: '#6B5B47'}}>
            <a
              href="https://github.com/benodiwal/medusa"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline transition-all"
            >
              GitHub
            </a>
            <a
              href="/docs"
              className="hover:underline transition-all"
            >
              Documentation
            </a>
            <a
              href="https://github.com/benodiwal/medusa/blob/master/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline transition-all"
            >
              Apache 2.0 License
            </a>
          </div>

          <p className="text-xs sm:text-sm" style={{color: '#6B5B47', opacity: 0.6}}>
            Made for developers who want control over AI-generated code.
          </p>
        </div>

      </div>
    </footer>
  )
}

export default Footer