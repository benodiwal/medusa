'use client'

import Image from 'next/image'
import DownloadButton from '../DownloadButton'

const WhyMedusa = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 relative z-50 px-4 sm:px-6 lg:px-10" style={{backgroundColor: '#F3F1E8'}}>
      {/* Section divider line */}
      <div className="w-full h-1 mb-12 sm:mb-16 lg:mb-20" style={{backgroundColor: '#D2691E'}}></div>

      <div className="max-w-[1380px] mx-auto">

        {/* Title and Description Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 mb-12 sm:mb-16 lg:mb-20">
          {/* Left - Title */}
          <div>
            <p className="text-sm sm:text-base font-medium mb-3 tracking-wide" style={{color: '#D2691E'}}>
              FEATURES
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight" style={{color: '#6B5B47'}}>
              Review with precision
            </h2>
          </div>

          {/* Right - Description */}
          <div className="flex flex-col justify-center">
            <p className="text-base sm:text-lg leading-relaxed" style={{color: '#6B5B47'}}>
              Claude Code can rewrite your entire codebase in minutes. Medusa makes sure
              that&apos;s actually what you want—with tools designed for careful review.
            </p>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">

          {/* Kanban workflow */}
          <div className="space-y-2 sm:space-y-3">
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/10] mb-2 rounded-lg overflow-hidden bg-[#F3F1E8]">
              <Image
                src="/kanban.png"
                alt="Kanban board"
                fill
                className="object-contain"
              />
            </div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold" style={{color: '#6B5B47'}}>
              Multi-session tracking
            </h3>
            <p className="text-xs sm:text-sm lg:text-base leading-relaxed" style={{color: '#6B5B47', opacity: 0.8}}>
              Running Claude in multiple terminals? One board tracks every plan across all sessions.
              See what&apos;s pending, what you&apos;re reviewing, and what&apos;s approved.
            </p>
          </div>

          {/* Inline annotations */}
          <div className="space-y-2 sm:space-y-3">
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/10] mb-2 rounded-lg overflow-hidden bg-[#F3F1E8]">
              <Image
                src="/annotations.png"
                alt="Inline annotations"
                fill
                className="object-contain"
              />
            </div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold" style={{color: '#6B5B47'}}>
              Inline annotations
            </h3>
            <p className="text-xs sm:text-sm lg:text-base leading-relaxed" style={{color: '#6B5B47', opacity: 0.8}}>
              Select any text to comment, delete, or suggest a replacement. Your feedback goes
              directly to Claude as structured context—no copy-pasting needed.
            </p>
          </div>

          {/* Diff view */}
          <div className="space-y-2 sm:space-y-3">
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/10] mb-2 rounded-lg overflow-hidden bg-[#F3F1E8]">
              <Image
                src="/diff.png"
                alt="Diff view"
                fill
                className="object-contain"
              />
            </div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold" style={{color: '#6B5B47'}}>
              Revision diffs
            </h3>
            <p className="text-xs sm:text-sm lg:text-base leading-relaxed" style={{color: '#6B5B47', opacity: 0.8}}>
              Requested changes? See exactly how Claude updated the plan. Line-by-line
              comparison between versions so nothing slips through.
            </p>
          </div>

          {/* Obsidian integration */}
          <div className="space-y-2 sm:space-y-3">
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/10] mb-2 rounded-lg overflow-hidden bg-[#F3F1E8]">
              <Image
                src="/obsidian.png"
                alt="Obsidian integration"
                fill
                className="object-contain"
              />
            </div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold" style={{color: '#6B5B47'}}>
              Obsidian export
            </h3>
            <p className="text-xs sm:text-sm lg:text-base leading-relaxed" style={{color: '#6B5B47', opacity: 0.8}}>
              Every approved plan becomes documentation. One-click export to your
              Obsidian vault builds a knowledge base of implementation decisions.
            </p>
          </div>

        </div>

        {/* Download Button - Centered at Bottom */}
        <div className="flex justify-center mt-12 sm:mt-16 lg:mt-20">
          <DownloadButton />
        </div>

      </div>
    </section>
  )
}

export default WhyMedusa
