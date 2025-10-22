'use client'

import { BiDownload } from "react-icons/bi"
import Image from "next/image"
import { useState } from "react"
import Modal from "../Modal"

const Header = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Download Medusa"
        submitText="Download"
      />
      <header className="fixed top-0 w-full z-50 border-b border-gray-100" style={{backgroundColor: '#FBFBF4'}}>
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Image
                src="/medusa-logo.png"
                alt="Medusa Logo"
                width={48}
                height={48}
                className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14"
              />
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-wider" style={{color: '#6B5B47'}}>
                MEDUSA
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-2 sm:px-5 text-xs sm:text-sm font-medium border-2 rounded-md transition-all hover:shadow-md flex items-center gap-1 sm:gap-2 cursor-pointer"
              style={{borderColor: '#6B5B47', color: '#6B5B47'}}
            >
              <span className="hidden sm:inline">Download Medusa</span>
              <span className="sm:hidden">Download</span>
              <BiDownload className="text-sm sm:text-lg" />
            </button>
          </div>
        </div>
      </header>
    </>
  )
}

export default Header