'use client'

import WaitlistForm from '../WaitlistForm'

const Footer = () => {
  return (
    <footer className="relative py-12 sm:py-16 lg:py-20" style={{backgroundColor: '#FBFBF4'}}>
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10">

        {/* Main CTA Section */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6" style={{color: '#6B5B47'}}>
            Making tools for makers
          </h2>

          <p className="text-base sm:text-lg mb-6 sm:mb-8" style={{color: '#6B5B47'}}>
            Available soon. Be first to get access.
          </p>

          {/* Email Signup Form */}
          <WaitlistForm
            layout="horizontal"
            buttonText="REQUEST ACCESS"
            placeholder="YOUR EMAIL"
            className="max-w-md mx-auto"
          />
        </div>

        {/* Bottom Links and Copyright */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm" style={{color: '#6B5B47'}}>
            <a href="#" className="hover:underline transition-all">PRIVACY POLICY</a>
            <a href="#" className="hover:underline transition-all">TERMS OF USE</a>
          </div>

          <p className="text-xs sm:text-sm" style={{color: '#6B5B47', opacity: 0.7}}>
            © 2025 COPYRIGHT.
          </p>
        </div>

      </div>
    </footer>
  )
}

export default Footer