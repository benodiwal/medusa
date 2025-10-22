'use client'

import { useState } from 'react'
import { WaitlistService } from '../lib/waitlist'

interface WaitlistFormProps {
  layout?: 'horizontal' | 'vertical'
  buttonText?: string
  placeholder?: string
  showName?: boolean
  className?: string
}

const WaitlistForm = ({
  layout = 'horizontal',
  buttonText = 'REQUEST ACCESS',
  placeholder = 'YOUR EMAIL',
  showName = false,
  className = ''
}: WaitlistFormProps) => {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter your email' })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await WaitlistService.addToWaitlist({
        name: name.trim() || email.split('@')[0], // Use email prefix as name if not provided
        email: email.trim(),
        type: 'waitlist'
      })

      if (result.success) {
        setEmail('')
        setName('')
        setMessage({ type: 'success', text: 'Thank you! We\'ll notify you when Medusa is ready.' })

        // Clear success message after 5 seconds
        setTimeout(() => setMessage(null), 5000)
      } else {
        setMessage({ type: 'error', text: result.error || 'Something went wrong. Please try again.' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isHorizontal = layout === 'horizontal'

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className={`flex ${isHorizontal ? 'flex-col sm:flex-row' : 'flex-col'} gap-3`}>
        {showName && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="YOUR NAME"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ color: '#6B5B47' }}
            disabled={isSubmitting}
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          required
          className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ color: '#6B5B47' }}
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 text-white text-sm font-medium rounded-md transition-colors hover:opacity-90 cursor-pointer whitespace-nowrap disabled:opacity-50"
          style={{ backgroundColor: '#6B5B47' }}
        >
          {isSubmitting ? 'SUBMITTING...' : buttonText}
        </button>
      </div>

      {message && (
        <div
          className="mt-3 text-sm"
          style={{
            color: '#6B5B47',
            opacity: message.type === 'success' ? 0.9 : 0.8,
            fontWeight: message.type === 'error' ? 500 : 400
          }}
        >
          {message.text}
        </div>
      )}
    </form>
  )
}

export default WaitlistForm