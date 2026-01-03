'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import DownloadButton from '../../components/DownloadButton'

export default function Demo() {
  const [activeAnnotation, setActiveAnnotation] = useState<string | null>(null)

  const annotations = [
    {
      id: '1',
      type: 'comment',
      text: 'Consider using a more descriptive variable name here',
      originalText: 'data',
      color: '#3B82F6'
    },
    {
      id: '2',
      type: 'deletion',
      text: '',
      originalText: 'console.log(debug)',
      color: '#EF4444'
    },
    {
      id: '3',
      type: 'replacement',
      text: 'async/await',
      originalText: '.then() chain',
      color: '#F97316'
    }
  ]

  return (
    <div className="min-h-screen" style={{backgroundColor: '#FBFBF4'}}>
      {/* Header */}
      <header className="fixed top-0 w-full z-[100] border-b border-gray-100" style={{backgroundColor: '#FBFBF4'}}>
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <Image
                src="/medusa-logo.png"
                alt="Medusa Logo"
                width={48}
                height={48}
                className="w-10 h-10 sm:w-12 sm:h-12"
              />
              <div className="text-xl sm:text-2xl font-bold tracking-wider" style={{color: '#6B5B47'}}>
                MEDUSA
              </div>
            </Link>
            <div className="flex items-center gap-4 sm:gap-6">
              <Link
                href="/docs"
                className="text-sm font-medium hover:underline hidden sm:block"
                style={{color: '#6B5B47'}}
              >
                Docs
              </Link>
              <DownloadButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 sm:pt-28 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-10">
        <div className="max-w-[1380px] mx-auto">

          {/* Hero */}
          <div className="text-center mb-12">
            <p className="text-sm sm:text-base font-medium mb-3 tracking-wide" style={{color: '#D2691E'}}>
              INTERACTIVE DEMO
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{color: '#6B5B47'}}>
              See Medusa in action
            </h1>
            <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{color: '#6B5B47', opacity: 0.8}}>
              This is how you review Claude Code plans. Select text to annotate,
              add comments, and approve or request changes.
            </p>
          </div>

          {/* Demo Interface */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

            {/* Plan Viewer */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-2xl shadow-xl border border-black/5 overflow-hidden">

                {/* Plan Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <span className="font-medium" style={{color: '#6B5B47'}}>Implementation Plan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors" style={{color: '#6B5B47'}}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Plan Content */}
                <div className="p-6 sm:p-8 lg:p-10">
                  <article className="prose prose-sm max-w-none" style={{color: '#6B5B47'}}>
                    <h2 className="text-xl font-bold mb-4" style={{color: '#6B5B47'}}>Add User Authentication</h2>

                    <p className="mb-4 leading-relaxed">
                      I&apos;ll implement JWT-based authentication with the following approach:
                    </p>

                    <h3 className="text-lg font-semibold mt-6 mb-3" style={{color: '#6B5B47'}}>1. Create Auth Module</h3>
                    <p className="mb-4">
                      First, I&apos;ll set up the authentication module with login and registration endpoints.
                      The <span
                        className={`px-1 rounded cursor-pointer transition-all ${activeAnnotation === '1' ? 'ring-2 ring-blue-400' : ''}`}
                        style={{backgroundColor: 'rgba(59, 130, 246, 0.2)'}}
                        onClick={() => setActiveAnnotation(activeAnnotation === '1' ? null : '1')}
                        onMouseEnter={() => setActiveAnnotation('1')}
                        onMouseLeave={() => setActiveAnnotation(null)}
                      >data</span> will be validated using Zod schemas.
                    </p>

                    <h3 className="text-lg font-semibold mt-6 mb-3" style={{color: '#6B5B47'}}>2. Implement Middleware</h3>
                    <p className="mb-4">
                      Add authentication middleware to protect routes. Remove temporary debugging:
                      <span
                        className={`px-1 mx-1 rounded cursor-pointer line-through transition-all ${activeAnnotation === '2' ? 'ring-2 ring-red-400' : ''}`}
                        style={{backgroundColor: 'rgba(239, 68, 68, 0.2)', textDecorationColor: '#EF4444'}}
                        onClick={() => setActiveAnnotation(activeAnnotation === '2' ? null : '2')}
                        onMouseEnter={() => setActiveAnnotation('2')}
                        onMouseLeave={() => setActiveAnnotation(null)}
                      >console.log(debug)</span>
                    </p>

                    <h3 className="text-lg font-semibold mt-6 mb-3" style={{color: '#6B5B47'}}>3. Update API Calls</h3>
                    <p className="mb-4">
                      Refactor existing API calls to use
                      <span
                        className={`px-1 mx-1 rounded cursor-pointer transition-all ${activeAnnotation === '3' ? 'ring-2 ring-orange-400' : ''}`}
                        style={{backgroundColor: 'rgba(249, 115, 22, 0.2)', borderBottom: '2px dashed #F97316'}}
                        onClick={() => setActiveAnnotation(activeAnnotation === '3' ? null : '3')}
                        onMouseEnter={() => setActiveAnnotation('3')}
                        onMouseLeave={() => setActiveAnnotation(null)}
                      >.then() chain</span>
                      for better error handling and readability.
                    </p>

                    {/* Code Block */}
                    <div className="my-6 rounded-lg overflow-hidden" style={{backgroundColor: '#1a1a1a'}}>
                      <div className="px-4 py-2 border-b border-gray-700 flex items-center justify-between">
                        <span className="text-xs text-gray-400">auth.ts</span>
                        <button className="text-gray-400 hover:text-white transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                      <pre className="p-4 text-sm overflow-x-auto">
                        <code className="text-gray-300">
{`export async function authenticate(token: string) {
  const decoded = jwt.verify(token, SECRET);
  return decoded;
}`}
                        </code>
                      </pre>
                    </div>

                    <h3 className="text-lg font-semibold mt-6 mb-3" style={{color: '#6B5B47'}}>4. Add Tests</h3>
                    <p>
                      Finally, I&apos;ll add unit tests for the authentication flow and integration tests
                      for the protected endpoints.
                    </p>
                  </article>
                </div>

                {/* Decision Bar */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between" style={{backgroundColor: '#F9F9F4'}}>
                  <div className="text-sm" style={{color: '#6B5B47', opacity: 0.7}}>
                    3 annotations
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all hover:shadow-md" style={{borderColor: '#F97316', color: '#F97316'}}>
                      Request Changes
                    </button>
                    <button className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-all hover:shadow-md" style={{backgroundColor: '#22C55E'}}>
                      Approve Plan
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Annotation Sidebar */}
            <div className="w-full lg:w-80 shrink-0">
              <div className="bg-white rounded-2xl shadow-xl border border-black/5 overflow-hidden sticky top-28">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-semibold" style={{color: '#6B5B47'}}>Annotations</h3>
                </div>

                <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                  {annotations.map((ann) => (
                    <div
                      key={ann.id}
                      className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all ${activeAnnotation === ann.id ? 'ring-2 ring-offset-2' : ''}`}
                      style={{
                        backgroundColor: `${ann.color}10`,
                        borderLeftColor: ann.color,
                        boxShadow: activeAnnotation === ann.id ? `0 0 0 2px ${ann.color}` : 'none'
                      }}
                      onClick={() => setActiveAnnotation(activeAnnotation === ann.id ? null : ann.id)}
                      onMouseEnter={() => setActiveAnnotation(ann.id)}
                      onMouseLeave={() => setActiveAnnotation(null)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded"
                          style={{backgroundColor: ann.color, color: 'white'}}
                        >
                          {ann.type.charAt(0).toUpperCase() + ann.type.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm mb-1" style={{color: '#6B5B47'}}>
                        <span className="opacity-60">On:</span> &quot;{ann.originalText}&quot;
                      </p>
                      {ann.text && (
                        <p className="text-sm" style={{color: '#6B5B47'}}>
                          {ann.type === 'replacement' ? (
                            <><span className="opacity-60">Replace with:</span> {ann.text}</>
                          ) : (
                            ann.text
                          )}
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Global Comment */}
                  <div className="p-3 rounded-lg border-l-4" style={{backgroundColor: '#8B5CF610', borderLeftColor: '#8B5CF6'}}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded text-white" style={{backgroundColor: '#8B5CF6'}}>
                        Global
                      </span>
                    </div>
                    <p className="text-sm" style={{color: '#6B5B47'}}>
                      Please ensure all new code follows our existing patterns for error handling.
                    </p>
                  </div>
                </div>

                {/* Add Annotation Hint */}
                <div className="px-4 py-3 border-t border-gray-100" style={{backgroundColor: '#F9F9F4'}}>
                  <p className="text-xs text-center" style={{color: '#6B5B47', opacity: 0.6}}>
                    Select text in the plan to add annotations
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Annotation Types Legend */}
          <div className="mt-12 p-6 rounded-2xl" style={{backgroundColor: '#F3F1E8'}}>
            <h3 className="font-semibold mb-4 text-center" style={{color: '#6B5B47'}}>Annotation Types</h3>
            <div className="flex flex-wrap justify-center gap-6">
              {[
                { name: 'Comment', color: '#3B82F6', desc: 'Add notes or questions' },
                { name: 'Delete', color: '#EF4444', desc: 'Mark for removal' },
                { name: 'Replace', color: '#F97316', desc: 'Suggest alternatives' },
                { name: 'Global', color: '#8B5CF6', desc: 'Plan-wide feedback' },
              ].map((type) => (
                <div key={type.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: type.color}}></div>
                  <span className="text-sm font-medium" style={{color: '#6B5B47'}}>{type.name}</span>
                  <span className="text-xs" style={{color: '#6B5B47', opacity: 0.6}}>- {type.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <p className="text-lg mb-4" style={{color: '#6B5B47'}}>
              Ready to take control of your AI-generated code?
            </p>
            <DownloadButton />
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t" style={{borderColor: '#D2691E'}}>
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm" style={{color: '#6B5B47'}}>
            <Link href="/" className="hover:underline">Back to Home</Link>
            <div className="flex items-center gap-4">
              <Link href="/docs" className="hover:underline">Documentation</Link>
              <a href="https://github.com/benodiwal/medusa" target="_blank" rel="noopener noreferrer" className="hover:underline">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
