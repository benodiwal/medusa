import Header from "../components/landing/Header";
import Footer from "../components/landing/Footer";
import HowItWorks from "../components/landing/HowItWorks";
import Features from "../components/landing/Features";
import TrustSignals from "../components/landing/TrustSignals";
import Image from "next/image";
import DownloadButton from "../components/DownloadButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FBFBF4]">
      <Header />

      {/* Hero Section */}
      <main className="pt-16 sm:pt-20 px-4 sm:px-6 lg:px-10" style={{backgroundColor: '#FBFBF4'}}>
        <div className="max-w-[1380px] mx-auto">
          {/* Hero Content */}
          <div className="relative pt-8 sm:pt-12 lg:pt-20 pb-8 sm:pb-12 overflow-hidden">

            {/* Hero Text Content */}
            <div className="relative z-10 max-w-3xl">
              <p className="text-sm sm:text-base font-medium mb-4 tracking-wide" style={{color: '#D2691E'}}>
                FOR CLAUDE CODE USERS
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] mb-6" style={{color: '#6B5B47'}}>
                The checkpoint between Claude and your codebase
              </h1>
              <p className="text-base sm:text-lg lg:text-xl mb-8 leading-relaxed max-w-2xl" style={{color: '#6B5B47', opacity: 0.85}}>
                Claude Code plans complex changes to your project. Medusa shows you exactly
                what&apos;s about to happen—review, annotate, approve—before a single line executes.
              </p>

              {/* Download Button */}
              <div className="flex items-center gap-4 mb-8 sm:mb-12">
                <DownloadButton />
                <a
                  href="https://github.com/benodiwal/medusa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:underline"
                  style={{color: '#6B5B47'}}
                >
                  View on GitHub →
                </a>
              </div>
            </div>
          </div>

          {/* Hero Image Section */}
          <div className="pb-16 sm:pb-20">
            <div className="relative">
              {/* Main image container */}
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-black/5">
                <div className="relative aspect-[16/10] w-full">
                  <Image
                    src="/hero.png"
                    alt="Medusa Plan Review Interface showing a Claude Code plan with annotations"
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1380px"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      <HowItWorks />
      <Features />
      <TrustSignals />
      <Footer />
    </div>
  );
}
