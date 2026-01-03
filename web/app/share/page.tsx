'use client'

import { useEffect, useState } from 'react'
import { decompressData, SharedPlan } from '../../lib/share'

export default function SharePage() {
  const [plan, setPlan] = useState<SharedPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPlan = async () => {
      try {
        // Get data from URL hash
        const hash = window.location.hash.slice(1)
        if (!hash) {
          setError('No plan data found in URL')
          setLoading(false)
          return
        }

        const data = await decompressData(hash)
        setPlan(data)
      } catch (e) {
        setError('Failed to load plan. The link may be invalid or corrupted.')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    loadPlan()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-gray-400">Loading plan...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Unable to load plan</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  if (!plan) return null

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-white">Medusa</span>
            <span className="text-gray-500">/ Shared Plan</span>
          </div>
          <div className="text-sm text-gray-500">
            {plan.project && <span>{plan.project}</span>}
          </div>
        </div>
      </header>

      {/* Plan Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <article className="bg-[#242424] border border-gray-800 rounded-xl p-8 md:p-12">
          <PlanContent content={plan.content} annotations={plan.annotations} />
        </article>

        {/* Annotations Summary */}
        {plan.annotations.length > 0 && (
          <div className="mt-8 bg-[#242424] border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Annotations ({plan.annotations.length})
            </h2>
            <div className="space-y-3">
              {plan.annotations.map((ann, i) => (
                <div key={i} className="p-3 bg-[#1a1a1a] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-medium uppercase ${getTypeColor(ann.type)}`}>
                      {ann.type}
                    </span>
                  </div>
                  {ann.originalText && (
                    <div className="text-sm text-gray-500 font-mono mb-2 truncate">
                      &ldquo;{ann.originalText}&rdquo;
                    </div>
                  )}
                  {ann.text && (
                    <div className="text-sm text-gray-300">
                      {ann.type === 'REPLACEMENT' && <span className="text-orange-500 mr-1">→</span>}
                      {ann.text}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'DELETION': return 'text-red-400'
    case 'REPLACEMENT': return 'text-orange-400'
    case 'COMMENT': return 'text-blue-400'
    case 'GLOBAL_COMMENT': return 'text-purple-400'
    default: return 'text-gray-400'
  }
}

function PlanContent({ content, annotations }: { content: string; annotations: SharedPlan['annotations'] }) {
  // Simple markdown-like rendering
  const lines = content.split('\n')

  return (
    <div className="prose prose-invert max-w-none">
      {lines.map((line, i) => {
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-2xl font-bold text-white mt-6 mb-4 first:mt-0">{line.slice(2)}</h1>
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-xl font-semibold text-white mt-8 mb-3">{line.slice(3)}</h2>
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-lg font-semibold text-gray-200 mt-6 mb-2">{line.slice(4)}</h3>
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-3 my-1.5 text-gray-300">
              <span className="text-gray-500">•</span>
              <span>{line.slice(2)}</span>
            </div>
          )
        }
        if (line.startsWith('```')) {
          return null // Skip code fence markers
        }
        if (line.trim() === '') {
          return <div key={i} className="h-4" />
        }
        return <p key={i} className="text-gray-300 leading-relaxed mb-3">{line}</p>
      })}
    </div>
  )
}
