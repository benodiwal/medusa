import Header from "../components/landing/Header";
import Ascii from "../components/landing/Ascii";
import Footer from "../components/landing/Footer";
import WhyMedusa from "../components/landing/WhyMedusa";
import ShareFeature from "../components/landing/ShareFeature";
import Image from "next/image";
import Link from "next/link";
import DownloadButton from "../components/DownloadButton";

const DEMO_URL = "/share#N4IgLglmA2CmIC4QEEAmqAEBVAzrAThsgK5gAWsAdpAMYCGkA9pSADQg3NhViIgDERdNjyES5HhHpNKAHTmV+ggPIA3AqoiwA7vICSAWwAOcAzwwApAOoAVALQAjOnkx1SFalIYRmGAGaMhBIYdEYmXjIAdPLyShiGJrBm1N6+AMrcRjgxinEAjJEYAEJ0NADWVJgAwmR0lADmsNmUdkKYDjT4AJ5GYP6BGEbOONqBmLU4ZBAN8q1V+LAMsCHuGAYQ6HDadAv9hEb4jNw03JiHpE2z8cam5gD0oRB30Iz10yGUmA9GTwtvONxCJUjIxpmBmq00JhrDYMGBGBVKBhGpQCKkkXVMKo6NANuickpBAAmQoAMUO1EqGBqdUaEOpCyWGBebwxnwwfwgAIIewM9KhK3IGE4lIAHn0AoQAUyDHU6I1kmArglbtRBodjqcOYwLhhtPhQkYCFcMoFlvDETgMO8yGAwEZlJRoF1hYwEVpmrE4gBmQoAEQYdCceAwaRoFFlVwFxFEVrAQbgeqgZAwSToEGgrEGw1G+FQAH0JmQs51Fqd8wwo8I8DgcD5KHGE8tJRzYH4FpM4QiqJ7chgbE1IA0MAAFaB1K5YShQOGDq0ttxC9abHQ7WDKyn1A0yWcA+cDFnvPwvXQtDAAUSJ5934L2rf+YG39fkbA4jNOyF4CDyAHYAGw-gArHkRJ-kSeQAJwABwQewkxrqgRRdHwyC4jQ8BwbUCyoJ+iC-gBwGgeB0GwSAdSUEc6I4IgADaoAbHw5F2DiUiwHYeSvg4LzlHoqB8FxjDlOxr7SvgYDKH4fh4F+AAM7CVBJUmwF+IHsGAPTwEgVTKAAsjp54AHI2K+3DinwAAybplFa9RuqgACE1LMHWqA8nQ6DTPUHJMri6xDvUkSvoEECsjiA5mUgMKOM4sCuO4kjSPWr6lksOEqf+QEgWBkEwewi5kIEBl0GYKFoRhZHuIEVSMC8+B8Pwf5FIBRQACw-iAAC+rD0XxSBMQ4jAOMJ7ACTxvUgKNZR2ESInxmJinSYgckgApkmLQgRLLepRp8H657meeNh6MoBkmbAEUgGkBXENAmAxssOy2ZQRLWg23DuUF+AhdMYXnV+E2dD0EoDEMta5uMzhTA0yXvrFuHfhlhHZSReWVfgRUlUgRSDa++VVTVgT1VBRQ-t6gGAZ13UgAxfWUC0A1DTNI3cWUvH8SzdjerNOziWtylLfJnwLfz36AWpGl8NpemGcZal-ShwgEIchC1J8uLDi2sWNMKMXUewwWhdA4X-QcRywCcsXahcetvmWcPpQRWXEblFXkIVxWaSA2MOLjaPVbVRMk2TFMdQAuuw6j4HWzB4R1QA";

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
              <p className="text-sm sm:text-base font-medium mb-3 tracking-wide" style={{color: '#D2691E'}}>
                FOR CLAUDE CODE USERS
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-4 sm:mb-6" style={{color: '#6B5B47'}}>
                The checkpoint between Claude and your codebase
              </h1>
              <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 leading-relaxed" style={{color: '#6B5B47'}}>
                Claude Code plans complex changes to your project. Medusa shows you exactly <br className="hidden sm:block"/> what&apos;s about to happen—review, annotate, approve—before a single line executes.
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

      <ShareFeature />

      <Footer />

      {/* Mobile Floating Demo Button */}
      <Link
        href={DEMO_URL}
        className="sm:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 bg-[#6B5B47] text-white rounded-full shadow-lg hover:opacity-90 transition-opacity"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm font-medium">Try Demo</span>
      </Link>
    </div>
  );
}
