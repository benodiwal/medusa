'use client'

import Link from 'next/link'

const ShareFeature = () => {
  // Demo share URL - a sample plan with annotations from Alice and Bob
  const demoShareUrl = "/share#N4IgLglmA2CmIC4QEEAmqAEBVAzrAThsgK5gAWsAdpAMYCGkA9pSADQg3NhViIgDERdNjyES5HhHpNKAHTmV+ggPIA3AqoiwA7vICSAWwAOcAzwwApAOoAVALQAjOnkx1SFalIYRmGAGaMhBIYdEYmXjIAdPLyShiGJrBm1N6+AMrcRjgxinEAjJEYAEJ0NADWVJgAwmR0lADmsNmUdkKYDjT4AJ5GYP6BGEbOONqBmLU4ZBAN8q1V+LAMsCHuGAYQ6HDadAv9hEb4jNw03JiHpE2z8cam5gD0oRB30Iz10yGUmA9GTwtvONxCJUjIxpmBmq00JhrDYMGBGBVKBhGpQCKkkXVMKo6NANuickpBAAmQoAMUO1EqGBqdUaEOpCyWGBebwxnwwfwgAIIewM9KhK3IGE4lIAHn0AoQAUyDHU6I1kmArglbtRBodjqcOYwLhhtPhQkYCFcMoFlvDETgMO8yGAwEZlJRoF1hYwEVpmrE4gBmQoAEQYdCceAwaRoFFlVwFxFEVrAQbgeqgZAwSToEGgrEGw1G+FQAH0JmQs51Fqd8wwo8I8DgcD5KHGE8tJRzYH4FpM4QiqJ7chgbE1IA0MAAFaB1K5YShQOGDq0ttxC9abHQ7WDKyn1A0yWcA+cDFnvPwvXQtDAAUSJ5934L2rf+YG39fkbA4jNOyF4CDyAHYAGw-gArHkRJ-kSeQAJwABwQewkxrqgRRdHwyC4jQ8BwbUCyoJ+iC-gBwGgeB0GwSAdSUEc6I4IgADaoAbHw5F2DiUiwHYeSvg4LzlHoqB8FxjDlOxr7SvgYDKH4fh4F+AAM7CVBJUmwF+IHsGAPTwEgVTKAAsjp54AHI2K+3DinwAAybplFa9RuqgACE1LMHWqA8nQ6DTPUHJMri6xDvUkSvoEECsjiA5mUgMKOM4sCuO4kjSPWr6lksOEqf+QEgWBkEwewi5kIEBl0GYKFoRhZHuIEVSMC8+B8Pwf5FIBRQACw-iAAC+rD0XxSBMQ4jAOMJ7ACTxvUgKNZR2ESInxmJinSYgckgApkmLQgRLLepRp8H657meeNh6MoBkmbAEUgGkBXENAmAxssOy2ZQRLWg23DuUF+AhdMYXnV+E2dD0EoDEMta5uMzhTA0yXvrFuHfhlhHZSReWVfgRUlUgRSDa++VVTVgT1VBRQ-t6gGAZ13UgAxfWUC0A1DTNI3cWUvH8SzdjerNOziWtylLfJnwLfz36AWpGl8NpemGcZal-ShwgEIchC1J8uLDi2sWNMKMXUewwWhdA4X-QcRywCcsXahcetvmWcPpQRWXEblFXkIVxWaSA2MOLjaPVbVRMk2TFMdQAuuw6j4HWzB4R1QA"

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
