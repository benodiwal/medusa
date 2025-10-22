import Header from "../components/landing/Header";
import Ascii from "../components/landing/Ascii";
import Footer from "../components/landing/Footer";
import WhyMedusa from "../components/landing/WhyMedusa";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FBFBF4]">
      <Header />

      {/* ASCII Art Background - positioned from header level */}
      <div className="fixed right-0 top-0 text-xs font-mono leading-none opacity-60 sm:opacity-40 lg:opacity-50 pointer-events-none select-none z-30" style={{color: '#6B5B47'}}>
        <div className="scale-50 sm:scale-60 lg:scale-75 origin-top-right">
          <Ascii />
        </div>
      </div>

      {/* Hero Section */}
      <main className="pt-16 sm:pt-20 px-4 sm:px-6 lg:px-10" style={{backgroundColor: '#FBFBF4'}}>
        <div className="max-w-[1380px] mx-auto">
          {/* Hero Content */}
          <div className="relative pt-8 sm:pt-12 lg:pt-16 pb-8 sm:pb-12 overflow-hidden">

            {/* Hero Text Content */}
            <div className="relative z-10 max-w-2xl">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-4 sm:mb-6" style={{color: '#6B5B47'}}>
                Orchestration for Coding agents
              </h1>
              <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 leading-relaxed" style={{color: '#6B5B47'}}>
                Deploy any agent in secure containers. Execute parallel workflows, <br/> switch contexts instantly, and maintain control over AI-generated code.
              </p>

              {/* Email Signup Form */}
              <div className="mb-8 sm:mb-12 pl-0 sm:pl-1">
                <p className="text-sm mb-4" style={{color: '#6B5B47'}}>Available soon. Be first to get access.</p>
                <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                  <input
                    type="email"
                    placeholder="YOUR EMAIL"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{color: '#6B5B47'}}
                  />
                  <button className="px-6 py-3 text-white text-sm font-medium rounded-md transition-colors hover:opacity-90 cursor-pointer whitespace-nowrap" style={{backgroundColor: '#6B5B47'}}>
                    REQUEST ACCESS
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image Section with SaaS Animation */}
          <div className="pb-20">
            <div className="relative group">
              {/* Gradient background effect */}
              <div className="absolute -inset-1 bg-transparent rounded-lg blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>

              {/* Main image container */}
              <div className="relative rounded-lg overflow-hidden shadow-2xl transform transition-all duration-700 hover:scale-[1.02]">
                <div className="relative aspect-video w-full">
                  <Image
                    src="/hero.png"
                    alt="Medusa Platform Demo"
                    fill
                    className="object-cover animate-fadeIn"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      <WhyMedusa />

      <Footer />
    </div>
  );
}
