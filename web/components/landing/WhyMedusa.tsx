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
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight" style={{color: '#6B5B47'}}>
              Why Medusa?
            </h2>
          </div>

          {/* Right - Description */}
          <div className="flex flex-col justify-center">
            <p className="text-base sm:text-lg leading-relaxed" style={{color: '#6B5B47'}}>
              AI agents write code fast. Sometimes too fast. Medusa gives you a checkpoint
              before execution—review the plan, mark what needs fixing, and approve only
              when you&apos;re ready.
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
              Kanban workflow
            </h3>
            <p className="text-xs sm:text-sm lg:text-base leading-relaxed" style={{color: '#6B5B47', opacity: 0.8}}>
              Plans flow through Pending, In Review, and Approved columns.
              See what&apos;s waiting, what you&apos;re reviewing, and what&apos;s done.
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
              Highlight text, add comments, mark deletions. Your feedback goes
              directly to Claude as structured context for the next iteration.
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
              When you request changes, see exactly what Claude modified.
              Line-by-line diff between the original plan and the revision.
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
              Save to Obsidian
            </h3>
            <p className="text-xs sm:text-sm lg:text-base leading-relaxed" style={{color: '#6B5B47', opacity: 0.8}}>
              Archive approved plans to your Obsidian vault with one click.
              Build a knowledge base of implementation decisions.
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
