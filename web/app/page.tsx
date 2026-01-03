import Header from "../components/landing/Header";
import Ascii from "../components/landing/Ascii";
import Footer from "../components/landing/Footer";
import WhyMedusa from "../components/landing/WhyMedusa";
import Image from "next/image";
import DownloadButton from "../components/DownloadButton";

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
                Review AI plans before they execute
              </h1>
              <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 leading-relaxed" style={{color: '#6B5B47'}}>
                Intercept Claude Code plans, add annotations, request changes, <br className="hidden sm:block"/> and approve only what you want. Stay in control of AI-generated code.
              </p>

              {/* Download Button */}
              <div className="mb-8 sm:mb-12 px-1 sm:pl-1">
                <DownloadButton />
              </div>
            </div>
          </div>

          {/* Hero Image Section */}
          <div className="pb-20">
            <div className="relative group">
              {/* Gradient background effect */}
              <div className="absolute -inset-1 bg-transparent rounded-lg blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>

              {/* Main image container */}
              <div className="relative rounded-lg overflow-hidden shadow-2xl transform transition-all duration-700 hover:scale-[1.02]">
                <div className="relative aspect-video w-full">
                  <Image
                    src="/hero.png"
                    alt="Medusa Plan Review Interface"
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
