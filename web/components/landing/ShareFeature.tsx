'use client'

import Link from 'next/link'

const ShareFeature = () => {
  // Demo share URL - a sample plan with annotations from Alice and Bob
  const demoShareUrl = "/share#N4IgLglmA2CmIC4QEEAmqAEBVAzrAThsgK5gAWsAdpAMYCGkA9pSADQg3NhViIgDEGAJIBbAA5wRPBhGYYACtDqUE2PIRLkeEek0oAdA5X6CA8gDcC5iLADuhtJjw1i+WBjqkK1HTLlhGDC0PMQlfPQxiHAhKAHMMACkAdQAVIMYAayocD0pMACMafABPMTAMMTocHFtGfEwyKrIY2IA6Q0MTDABlbjEcDuMugEZW4UocMDpoaAwAEVgxKlQqGhsBygADbfymw0oxEQwYyenZgCscZltYfICsygxCkrKMAAEwUtgcAHpL69u9yo70+S1+z1KYEM202gxMggATGMAMJuBjuTRkHpWHSwQwAWmE4kkPAwm0aODI8iqNTqqAAFABKTaRaJxJ5FSEYWxQLE4ablfCMYh5HKMABmGGGCIJRIksCk1DJlnwEHFxWp1Vq9SZLPFdQw0EYsRiGHM0wgqD8RkJonlivKm1iVAI6JSmSouu5vIwCIALFjYAAPMQQfDW2V2klKzYqtXFd0PL0iS2oOC2OhuOFdADMYzmDDouzwPRoFBEdAc6FZBByU3ycG95AQsstGHpWCwQjmrAqqorJQwWWKjNlCroEFm9JFEAAjsRYL2Yisg7BUKPKITKlq6QB9ClY+nm-BlzMbwlFWDo1C7hjtyBSU7iDedLp+sbIeRCDAAUTyYkYGIwA2Ql5FMbo0h+TxyB+NwTUmAgMEJVEr24DBKDsGt8FlMCIIwKCvB+I0TUeQlMW0XR3GUTA3DAVxHmSFJZQAcR-SDoLIH4pCQjBmNgcoXHwNwlSiRD6TEIVuBobh1xw8D2MI4jhXKW1KHNaBLXRdIHmzbFBKgYoMGRZhohWcM9BAjAACUtI0lNymI00GG4cRgPbABWCpEJTShSFgc81HcAAJFIUnkfFmGgQzOEydYMH1QggUeSY6joZ1I2JBVSWRborIAMT7RgpL0WVHAwNx52+cp1M0iIeXIDAAC9GFQNgODRGTkF4BBhgAdgANl69yAAYAE5pWGAAOXrRvYSlMzXAAhYo+GQDSaHgObGjcVAusQPrBpG8aESmmb2GUSgiutHBEAAbVAS0+Au-FhjahtGBoDIhFapB3s+-Fhra058DAUxxXFPBuuG9hljBiH+MQaHwC+PhkVMABZdGfwAORSNruCDbqQGYjqKiUSgAEIMBSChElSEIJMYOgy2OHIrg01BWjauoIBI6YUmDIm2sva89p6gahuG9z3JO6bZpADi6lW9bNoVrw6mxugpGV3E2sV-BjKNfA+H4fqc36-rxVegBfVgHp+hXKE3BE3qNT7vr4P6MnxHMgamEG4chxGYbyQOEYQJHQXgJA0cxnG8fYAmie6MhhWgTAbgwTgJktRCohaIh8FiZgEWOCZuDoTAJQ5F4wAAfmEMAAHIchEOp3DcaJTiVAJePkLAPDAKZPpwLn2B5vnoAFwm+GFjq1zFg7Jd6nNZbOtXyCVpBFsYfI9fV-BNe17fd-3zeDcYI2TfFUaV+GfqQGtgBddgVWiZhEARa2gA"

  return (
    <section className="py-12 sm:py-16 lg:py-20 relative z-50 px-4 sm:px-6 lg:px-10" style={{backgroundColor: '#FBFBF4'}}>
      <div className="max-w-[1380px] mx-auto">

        {/* Section Header */}
        <div className="mb-12 sm:mb-16">
          <p className="text-sm sm:text-base font-medium mb-3 tracking-wide" style={{color: '#D2691E'}}>
            COLLABORATE
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight" style={{color: '#6B5B47'}}>
            Share plans, not files
          </h2>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left - Description */}
          <div className="space-y-6">
            <p className="text-base sm:text-lg leading-relaxed" style={{color: '#6B5B47'}}>
              Share any plan via URL. Recipients can view, annotate, and reshare—all
              without creating an account. Each person&apos;s feedback is tracked with their
              name and color.
            </p>

            {/* Feature bullets */}
            <ul className="space-y-4">
              {[
                { title: 'No sign-up required', desc: 'Share a link. That\'s it. Recipients can annotate immediately.' },
                { title: 'Author attribution', desc: 'Every annotation shows who wrote it with unique colors.' },
                { title: 'Stack annotations', desc: 'Build on each other\'s feedback. Reshare with combined notes.' },
              ].map((item) => (
                <li key={item.title} className="flex gap-3">
                  <svg className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#D2691E' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="font-medium" style={{color: '#6B5B47'}}>{item.title}</span>
                    <span className="text-sm block mt-0.5" style={{color: '#6B5B47', opacity: 0.7}}>{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="pt-4">
              <Link
                href={demoShareUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all hover:gap-3"
                style={{ backgroundColor: '#6B5B47', color: '#FFFFFF' }}
              >
                Try a shared plan
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right - Visual Illustration */}
          <div className="relative">
            <div className="rounded-2xl p-6 sm:p-8" style={{ backgroundColor: '#F3F1E8' }}>
              {/* Flow Diagram */}
              <svg viewBox="0 0 400 280" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Person A */}
                <g>
                  <circle cx="70" cy="50" r="24" fill="#6B5B47" />
                  <text x="70" y="55" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">A</text>
                  <text x="70" y="90" textAnchor="middle" fill="#6B5B47" fontSize="11" fontWeight="500">Alice</text>
                </g>

                {/* Arrow A to URL */}
                <path d="M100 50 L155 50" stroke="#D2691E" strokeWidth="2" strokeDasharray="4 2" />
                <polygon points="155,45 165,50 155,55" fill="#D2691E" />

                {/* URL/Link representation */}
                <g>
                  <rect x="170" y="30" width="60" height="40" rx="8" fill="#FBFBF4" stroke="#D2691E" strokeWidth="2" />
                  <text x="200" y="54" textAnchor="middle" fill="#D2691E" fontSize="11" fontWeight="600">URL</text>
                </g>

                {/* Arrow URL to B */}
                <path d="M235 50 L290 50" stroke="#D2691E" strokeWidth="2" strokeDasharray="4 2" />
                <polygon points="290,45 300,50 290,55" fill="#D2691E" />

                {/* Person B */}
                <g>
                  <circle cx="330" cy="50" r="24" fill="#8B7355" />
                  <text x="330" y="55" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">B</text>
                  <text x="330" y="90" textAnchor="middle" fill="#6B5B47" fontSize="11" fontWeight="500">Bob</text>
                </g>

                {/* Annotations flowing down */}
                <path d="M70 110 L70 140 Q70 150 80 150 L190 150" stroke="#6B5B47" strokeWidth="2" />
                <path d="M330 110 L330 140 Q330 150 320 150 L210 150" stroke="#8B7355" strokeWidth="2" />

                {/* Combined annotations box */}
                <g>
                  <rect x="60" y="170" width="280" height="90" rx="12" fill="#FBFBF4" stroke="#E5E2DB" strokeWidth="2" />

                  {/* Plan title */}
                  <text x="80" y="195" fill="#6B5B47" fontSize="11" fontWeight="600">Implementation Plan</text>

                  {/* Alice's annotation */}
                  <rect x="75" y="205" width="120" height="20" rx="4" fill="#6B5B47" fillOpacity="0.15" />
                  <circle cx="85" cy="215" r="4" fill="#6B5B47" />
                  <text x="95" y="218" fill="#6B5B47" fontSize="9">Alice: Looks good!</text>

                  {/* Bob's annotation */}
                  <rect x="75" y="230" width="140" height="20" rx="4" fill="#8B7355" fillOpacity="0.15" />
                  <circle cx="85" cy="240" r="4" fill="#8B7355" />
                  <text x="95" y="243" fill="#6B5B47" fontSize="9">Bob: Add error handling</text>
                </g>

                {/* Label */}
                <text x="200" y="275" textAnchor="middle" fill="#6B5B47" fontSize="10" opacity="0.6">Combined annotations from both reviewers</text>
              </svg>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-3 -right-3 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm" style={{ backgroundColor: '#D2691E', color: 'white' }}>
              No backend needed
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

export default ShareFeature
