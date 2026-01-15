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
              Two workflows, one board
            </h2>
          </div>

          {/* Right - Description */}
          <div className="flex flex-col justify-center">
            <p className="text-base sm:text-lg leading-relaxed" style={{color: '#6B5B47'}}>
              Review AI plans before they execute. Run autonomous agents on isolated branches.
              Medusa gives you control over both—in a single unified interface.
            </p>
          </div>
        </div>

        {/* Feature Cards - 6 items in 2x3 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">

          {/* Unified Workflow */}
          <div className="space-y-2 sm:space-y-3">
            <div className="relative w-full aspect-[16/10] mb-2 rounded-lg overflow-hidden bg-[#F3F1E8]">
              <Image
                src="/kanban.png"
                alt="Unified kanban board"
                fill
                className="object-contain"
              />
            </div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold" style={{color: '#6B5B47'}}>
              Unified workflow
            </h3>
            <p className="text-xs sm:text-sm lg:text-base leading-relaxed" style={{color: '#6B5B47', opacity: 0.8}}>
              Plans and tasks in one kanban board. See what&apos;s pending review, what agents are running,
              and what&apos;s ready to merge—all at a glance.
            </p>
          </div>

          {/* Parallel Agents */}
          <div className="space-y-2 sm:space-y-3">
            <div className="relative w-full aspect-[16/10] mb-2 rounded-lg overflow-hidden bg-[#F3F1E8]">
              <Image
                src="/agent-output.png"
                alt="Agent output and chat"
                fill
                className="object-contain"
              />
            </div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold" style={{color: '#6B5B47'}}>
              Parallel agents
            </h3>
            <p className="text-xs sm:text-sm lg:text-base leading-relaxed" style={{color: '#6B5B47', opacity: 0.8}}>
              Run multiple Claude Code instances simultaneously. Each task gets its own git worktree—
              isolated branches that won&apos;t conflict with each other.
            </p>
          </div>

          {/* Code Review */}
          <div className="space-y-2 sm:space-y-3">
            <div className="relative w-full aspect-[16/10] mb-2 rounded-lg overflow-hidden bg-[#F3F1E8]">
              <Image
                src="/diff.png"
                alt="Code diff review"
                fill
                className="object-contain"
              />
            </div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold" style={{color: '#6B5B47'}}>
              Code review
            </h3>
            <p className="text-xs sm:text-sm lg:text-base leading-relaxed" style={{color: '#6B5B47', opacity: 0.8}}>
              See exactly what the agent changed before merging. File-by-file diffs, commit history,
              and one-click merge when you&apos;re ready.
            </p>
          </div>

          {/* Inline annotations */}
          <div className="space-y-2 sm:space-y-3">
            <div className="relative w-full aspect-[16/10] mb-2 rounded-lg overflow-hidden bg-[#F3F1E8]">
              <Image
                src="/annotations.png"
                alt="Inline annotations"
                fill
                className="object-contain"
              />
            </div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold" style={{color: '#6B5B47'}}>
              Rich annotations
            </h3>
            <p className="text-xs sm:text-sm lg:text-base leading-relaxed" style={{color: '#6B5B47', opacity: 0.8}}>
              Select any text to comment, delete, or suggest a replacement. Your feedback goes
              directly to Claude as structured context—no copy-pasting needed.
            </p>
          </div>

          {/* Revision diffs */}
          <div className="space-y-2 sm:space-y-3">
            <div className="relative w-full aspect-[16/10] mb-2 rounded-lg overflow-hidden bg-[#F3F1E8]">
              <Image
                src="/plan-diff.png"
                alt="Revision diffs"
                fill
                className="object-contain"
              />
            </div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold" style={{color: '#6B5B47'}}>
              Plan revision diffs
            </h3>
            <p className="text-xs sm:text-sm lg:text-base leading-relaxed" style={{color: '#6B5B47', opacity: 0.8}}>
              Requested changes? See exactly how Claude updated the plan. Line-by-line
              comparison between versions so nothing slips through.
            </p>
          </div>

          {/* Obsidian integration */}
          <div className="space-y-2 sm:space-y-3">
            <div className="relative w-full aspect-[16/10] mb-2 rounded-lg overflow-hidden bg-[#F3F1E8]">
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
