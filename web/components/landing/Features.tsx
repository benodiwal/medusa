'use client'

import Image from 'next/image'

const Features = () => {
  const features = [
    {
      image: "/annotations.png",
      title: "Inline annotations",
      description: "Select any text to comment, delete, or suggest a replacement. Your feedback goes directly to Claude as structured context—no copy-pasting needed."
    },
    {
      image: "/kanban.png",
      title: "Multi-session tracking",
      description: "Running Claude in multiple terminals? One board tracks every plan across all sessions. See what's pending, what you're reviewing, and what's approved."
    },
    {
      image: "/diff.png",
      title: "Revision diffs",
      description: "Requested changes? See exactly how Claude updated the plan. Line-by-line comparison between versions so nothing slips through."
    },
    {
      image: "/obsidian.png",
      title: "Obsidian export",
      description: "Every approved plan becomes documentation. One-click export to your Obsidian vault builds a knowledge base of implementation decisions."
    }
  ]

  return (
    <section className="py-16 sm:py-20 lg:py-24 relative z-50 px-4 sm:px-6 lg:px-10" style={{backgroundColor: '#F3F1E8'}}>
      {/* Section divider line */}
      <div className="w-full h-1 mb-12 sm:mb-16 lg:mb-20 max-w-[1380px] mx-auto" style={{backgroundColor: '#D2691E'}}></div>

      <div className="max-w-[1380px] mx-auto">

        {/* Title and Description Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 mb-12 sm:mb-16 lg:mb-20">
          {/* Left - Title */}
          <div>
            <p className="text-sm sm:text-base font-medium mb-3 tracking-wide" style={{color: '#D2691E'}}>
              FEATURES
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight" style={{color: '#6B5B47'}}>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-10">
          {features.map((feature, index) => (
            <div key={index} className="group">
              <div className="relative w-full aspect-[16/10] mb-4 rounded-xl overflow-hidden bg-white border border-black/5 shadow-sm">
                <Image
                  src={feature.image}
                  alt={feature.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2" style={{color: '#6B5B47'}}>
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base leading-relaxed" style={{color: '#6B5B47', opacity: 0.8}}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default Features
