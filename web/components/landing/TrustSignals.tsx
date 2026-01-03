'use client'

const TrustSignals = () => {
  const signals = [
    {
      title: "Open source",
      description: "Apache 2.0 licensed. Read the code, contribute, or fork it. No black boxes.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
      )
    },
    {
      title: "Local first",
      description: "Your plans never leave your machine. No cloud, no accounts, no data collection.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
        </svg>
      )
    },
    {
      title: "Native integration",
      description: "Uses Claude Code's built-in hook system. Install the app, add the hook, done.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" />
        </svg>
      )
    }
  ]

  return (
    <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-10" style={{backgroundColor: '#FBFBF4'}}>
      <div className="max-w-[1380px] mx-auto">

        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-sm sm:text-base font-medium mb-3 tracking-wide" style={{color: '#D2691E'}}>
            BUILT FOR DEVELOPERS
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold" style={{color: '#6B5B47'}}>
            No compromises
          </h2>
        </div>

        {/* Trust Signal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {signals.map((signal, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 sm:p-8 border border-black/5 shadow-sm text-center"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{backgroundColor: '#F3F1E8', color: '#6B5B47'}}
              >
                {signal.icon}
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2" style={{color: '#6B5B47'}}>
                {signal.title}
              </h3>
              <p className="text-sm sm:text-base leading-relaxed" style={{color: '#6B5B47', opacity: 0.8}}>
                {signal.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default TrustSignals
