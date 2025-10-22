'use client'

import { useState } from 'react'
import { BiX } from 'react-icons/bi'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  submitText: string
}

const Modal = ({ isOpen, onClose, title, submitText }: ModalProps) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    await new Promise(resolve => setTimeout(resolve, 1000))

    setName('')
    setEmail('')
    setIsSubmitting(false)
    onClose()

    alert('Thank you! We\'ll be in touch soon.')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold" style={{color: '#16110aff'}}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            style={{color: '#6B5B47'}}
          >
            <BiX className="w-6 h-6 cursor-pointer" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-gray-600 mb-6">
            Get early access to Medusa and be among the first to experience AI agent orchestration.
          </p>

          {/* Name Input */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium mb-2" style={{color: '#6B5B47'}}>
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
              placeholder="FULL NAME"
              style={{color: '#6B5B47'}}
            />
          </div>

          {/* Email Input */}
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium mb-2" style={{color: '#6B5B47'}}>
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
              placeholder="YOUR EMAIL"
              style={{color: '#6B5B47'}}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !email.trim()}
              className="cursor-pointer flex-1 px-4 py-3 text-white rounded-md transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{backgroundColor: '#6B5B47'}}
            >
              {isSubmitting ? 'Submitting...' : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Modal