'use client'

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Claude writes a plan",
      description: "When Claude Code enters plan mode, it outlines what it's going to change—files to modify, code to write, architecture decisions.",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )
    },
    {
      number: "02",
      title: "Medusa intercepts",
      description: "Before Claude can execute, Medusa catches the plan and opens it in a review interface. Claude waits for your decision.",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
        </svg>
      )
    },
    {
      number: "03",
      title: "You decide",
      description: "Review the plan, add annotations to specific sections, then approve to proceed—or request changes and Claude iterates.",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ]

  return (
    <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-10" style={{backgroundColor: '#FBFBF4'}}>
      <div className="max-w-[1380px] mx-auto">

        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <p className="text-sm sm:text-base font-medium mb-3 tracking-wide" style={{color: '#D2691E'}}>
            HOW IT WORKS
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{color: '#6B5B47'}}>
            Three steps to controlled AI coding
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{color: '#6B5B47', opacity: 0.8}}>
            Medusa integrates with Claude Code&apos;s native hook system. No configuration, no friction.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector line for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px" style={{backgroundColor: '#D2691E', opacity: 0.3}} />
              )}

              <div className="relative bg-white rounded-2xl p-6 sm:p-8 border border-black/5 shadow-sm">
                {/* Step number */}
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl sm:text-5xl font-bold" style={{color: '#D2691E', opacity: 0.3}}>
                    {step.number}
                  </span>
                  <div style={{color: '#6B5B47'}}>
                    {step.icon}
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold mb-3" style={{color: '#6B5B47'}}>
                  {step.title}
                </h3>
                <p className="text-sm sm:text-base leading-relaxed" style={{color: '#6B5B47', opacity: 0.8}}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default HowItWorks
