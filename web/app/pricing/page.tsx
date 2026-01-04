'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import DownloadButton from '../../components/DownloadButton'

export default function Pricing() {
  const [annual, setAnnual] = useState(true)

  const proPrice = annual ? 7499 : 749
  const proLabel = annual ? '/year' : '/month'

  const teamPrice = annual ? 20000 : 2000
  const teamLabel = annual ? '/year' : '/month per user'

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FBFBF4' }}>
      {/* Header */}
      <header className="fixed top-0 w-full z-[100] border-b border-gray-100" style={{ backgroundColor: '#FBFBF4' }}>
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
              <div className="text-xl sm:text-2xl font-bold tracking-wider" style={{ color: '#6B5B47' }}>
                MEDUSA
              </div>
            </Link>
            <div className="flex items-center gap-4 sm:gap-6">
              <Link
                href="/docs"
                className="text-sm font-medium hover:underline hidden sm:block"
                style={{ color: '#6B5B47' }}
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
        <div className="max-w-[1100px] mx-auto">

          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ color: '#6B5B47' }}>
              Simple pricing
            </h1>
            <p className="text-base sm:text-lg max-w-xl mx-auto" style={{ color: '#6B5B47', opacity: 0.8 }}>
              Start free, upgrade when you need cloud sync and history.
            </p>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <span
              className="text-sm font-medium cursor-pointer"
              style={{ color: !annual ? '#6B5B47' : '#6B5B4780' }}
              onClick={() => setAnnual(false)}
            >
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className="relative w-12 h-6 rounded-full transition-colors"
              style={{ backgroundColor: annual ? '#6B5B47' : '#E8E4D9' }}
            >
              <span
                className="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform"
                style={{ left: annual ? '28px' : '4px' }}
              />
            </button>
            <span
              className="text-sm font-medium cursor-pointer"
              style={{ color: annual ? '#6B5B47' : '#6B5B4780' }}
              onClick={() => setAnnual(true)}
            >
              Annual
            </span>
            {annual && (
              <span className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: '#D2691E20', color: '#D2691E' }}>
                Save 17%
              </span>
            )}
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">

            {/* Free */}
            <div className="p-6 sm:p-8 rounded-2xl border" style={{ backgroundColor: '#F7F5EE', borderColor: '#E8E4D9' }}>
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2" style={{ color: '#6B5B47' }}>Free</h2>
                <p className="text-sm" style={{ color: '#6B5B47', opacity: 0.7 }}>
                  Everything you need to review plans locally.
                </p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold" style={{ color: '#6B5B47' }}>$0</span>
                <span className="text-sm" style={{ color: '#6B5B47', opacity: 0.6 }}> forever</span>
              </div>

              <DownloadButton />

              <ul className="mt-8 space-y-3">
                {[
                  'Plan review & annotations',
                  'Approve/reject flow',
                  'Diff view between revisions',
                  'Share plans via URL',
                  'Obsidian export',
                  '7-day local history',
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm" style={{ color: '#6B5B47' }}>
                    <svg className="w-5 h-5 shrink-0" style={{ color: '#6B5B47' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div className="p-6 sm:p-8 rounded-2xl border-2 relative" style={{ backgroundColor: '#FFFFFF', borderColor: '#6B5B47' }}>
              <div className="absolute -top-3 left-6 px-3 py-1 text-xs font-medium rounded-full text-white" style={{ backgroundColor: '#6B5B47' }}>
                Popular
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2" style={{ color: '#6B5B47' }}>Pro</h2>
                <p className="text-sm" style={{ color: '#6B5B47', opacity: 0.7 }}>
                  Cloud sync and unlimited history.
                </p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold" style={{ color: '#6B5B47' }}>₹{proPrice.toLocaleString('en-IN')}</span>
                <span className="text-sm" style={{ color: '#6B5B47', opacity: 0.6 }}>{proLabel}</span>
                {annual && (
                  <span className="ml-2 text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: '#22C55E20', color: '#16A34A' }}>
                    Save ₹1,489
                  </span>
                )}
              </div>

              <button
                disabled
                className="w-full px-4 py-2.5 text-sm font-medium rounded-lg text-white cursor-not-allowed opacity-75"
                style={{ backgroundColor: '#6B5B47' }}
              >
                Coming Soon
              </button>

              <ul className="mt-8 space-y-3">
                <li className="text-xs font-medium uppercase tracking-wide mb-4" style={{ color: '#6B5B47', opacity: 0.5 }}>
                  Everything in Free, plus:
                </li>
                {[
                  'Cloud sync & backup',
                  'Unlimited plan history',
                  'Search across all plans',
                  'Priority support',
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm" style={{ color: '#6B5B47' }}>
                    <svg className="w-5 h-5 shrink-0" style={{ color: '#16A34A' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Team */}
            <div className="p-6 sm:p-8 rounded-2xl border relative" style={{ backgroundColor: '#F7F5EE', borderColor: '#E8E4D9' }}>
              <div className="absolute -top-3 left-6 px-3 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: '#D2691E20', color: '#D2691E' }}>
                For Teams
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2" style={{ color: '#6B5B47' }}>Team</h2>
                <p className="text-sm" style={{ color: '#6B5B47', opacity: 0.7 }}>
                  Collaborate with your team in real-time.
                </p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold" style={{ color: '#6B5B47' }}>₹{teamPrice.toLocaleString('en-IN')}</span>
                <span className="text-sm" style={{ color: '#6B5B47', opacity: 0.6 }}>{teamLabel}</span>
              </div>

              <button
                disabled
                className="w-full px-4 py-2.5 text-sm font-medium rounded-lg cursor-not-allowed opacity-75"
                style={{ backgroundColor: '#E8E4D9', color: '#6B5B47' }}
              >
                Coming Soon
              </button>

              <ul className="mt-8 space-y-3">
                <li className="text-xs font-medium uppercase tracking-wide mb-4" style={{ color: '#6B5B47', opacity: 0.5 }}>
                  Everything in Pro, plus:
                </li>
                {[
                  'Real-time collaboration',
                  'Shared team workspace',
                  'Centralized cloud storage',
                  'Webhook notifications',
                  'Approval workflows',
                  'Audit logs',
                  'SSO (coming soon)',
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm" style={{ color: '#6B5B47' }}>
                    <svg className="w-5 h-5 shrink-0" style={{ color: '#D2691E' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-20 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8" style={{ color: '#6B5B47' }}>
              Questions
            </h2>

            <div className="space-y-6">
              {[
                {
                  q: 'Can I use Medusa for free?',
                  a: 'Yes! The free tier includes all core features - plan review, annotations, diff view, sharing, and Obsidian export. You can use it indefinitely.'
                },
                {
                  q: 'What does cloud sync include?',
                  a: 'Pro syncs your plan history to the cloud so you can access it from any machine. Plans are searchable and never lost.'
                },
                {
                  q: 'What is real-time collaboration?',
                  a: 'Team plan lets multiple people review the same plan simultaneously. See each other\'s annotations live, discuss changes, and approve together.'
                },
                {
                  q: 'Can I cancel anytime?',
                  a: 'Yes. Cancel anytime and keep access until your billing period ends. No questions asked.'
                },
                {
                  q: 'What are webhook notifications?',
                  a: 'Team plan can send HTTP requests to your URL when plans are approved or rejected. Useful for Slack notifications, CI/CD triggers, or logging.'
                }
              ].map(({ q, a }) => (
                <div key={q} className="p-5 rounded-xl" style={{ backgroundColor: '#F7F5EE' }}>
                  <h3 className="font-semibold mb-2" style={{ color: '#6B5B47' }}>{q}</h3>
                  <p className="text-sm" style={{ color: '#6B5B47', opacity: 0.8 }}>{a}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t" style={{ borderColor: '#D2691E' }}>
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm" style={{ color: '#6B5B47' }}>
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
