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
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="YOUR EMAIL"
              className="flex-1 px-4 sm:px-5 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
              style={{color: '#6B5B47'}}
            />
            <button
              className="px-6 sm:px-8 py-3 text-white text-sm font-medium rounded-md transition-colors hover:opacity-90 cursor-pointer whitespace-nowrap"
              style={{backgroundColor: '#6B5B47'}}
            >
              REQUEST ACCESS
            </button>
          </div>
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