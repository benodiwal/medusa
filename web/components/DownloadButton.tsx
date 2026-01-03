'use client'

import { BiDownload } from 'react-icons/bi'

interface DownloadButtonProps {
  variant?: 'default' | 'compact'
  className?: string
}

const DownloadButton = ({ variant = 'default', className = '' }: DownloadButtonProps) => {
  return (
    <a
      href="https://github.com/benodiwal/medusa/releases/latest"
      target="_blank"
      rel="noopener noreferrer"
      className={`px-3 py-2 sm:px-5 text-xs sm:text-sm font-medium border-2 rounded-md transition-all hover:shadow-md flex items-center gap-1 sm:gap-2 cursor-pointer ${className}`}
      style={{ borderColor: '#6B5B47', color: '#6B5B47' }}
    >
      <span className={variant === 'compact' ? 'sm:hidden' : 'hidden sm:inline'}>
        Download Medusa
      </span>
      <span className={variant === 'compact' ? 'hidden sm:inline' : 'sm:hidden'}>
        {variant === 'compact' ? 'Download Medusa' : 'Download'}
      </span>
      <BiDownload className="text-sm sm:text-lg" />
    </a>
  )
}

export default DownloadButton
