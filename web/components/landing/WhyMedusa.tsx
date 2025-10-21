const WhyMedusa = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 relative z-50" style={{backgroundColor: '#FBFBF4'}}>
      {/* Section divider line */}
      <div className="w-full h-0.5 mb-12 sm:mb-16 lg:mb-20" style={{backgroundColor: '#D2691E'}}></div>

      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10">

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
              Agent orchestration shouldn't feel like juggling chaos. Medusa gives you the control,
              safety, and flexibility to work with any AI coding agent while maintaining oversight
              of your development process.
            </p>
          </div>
        </div>

        {/* Visual Demo Placeholder */}
        <div className="mb-12 sm:mb-16 lg:mb-20">
          <div className="bg-gray-200 rounded-lg aspect-video flex items-center justify-center">
            <div className="text-center px-4" style={{color: '#6B5B47'}}>
              <div className="text-base sm:text-lg font-medium mb-2">Agent Orchestration Demo</div>
              <div className="text-xs sm:text-sm opacity-70">Visual demonstration placeholder</div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">

          {/* Agent-agnostic by design */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-lg sm:text-xl font-bold" style={{color: '#6B5B47'}}>
              Agent-agnostic by design
            </h3>
            <p className="text-sm sm:text-base leading-relaxed" style={{color: '#6B5B47', opacity: 0.8}}>
              Claude Code, Cursor, Devin, or your custom agent—Medusa works with them all.
              No vendor lock-in, no switching costs.
            </p>
          </div>

          {/* Safe experimentation */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-lg sm:text-xl font-bold" style={{color: '#6B5B47'}}>
              Safe experimentation
            </h3>
            <p className="text-sm sm:text-base leading-relaxed" style={{color: '#6B5B47', opacity: 0.8}}>
              Every agent runs in an isolated container. Test aggressive changes, run experimental
              prompts, and roll back instantly without risk.
            </p>
          </div>

          {/* See the best solution */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-lg sm:text-xl font-bold" style={{color: '#6B5B47'}}>
              See the best solution
            </h3>
            <p className="text-sm sm:text-base leading-relaxed" style={{color: '#6B5B47', opacity: 0.8}}>
              Run multiple agents on the same task in parallel. Compare approaches, spot issues
              faster, and choose the implementation that actually works.
            </p>
          </div>

          {/* Instant context switching */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-lg sm:text-xl font-bold" style={{color: '#6B5B47'}}>
              Instant context switching
            </h3>
            <p className="text-sm sm:text-base leading-relaxed" style={{color: '#6B5B47', opacity: 0.8}}>
              Jump between agent environments with one click. Test frontend changes, check backend
              logic, verify deployment—all without leaving your flow.
            </p>
          </div>

        </div>

      </div>
    </section>
  )
}

export default WhyMedusa