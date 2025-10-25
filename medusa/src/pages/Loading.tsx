import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Ascii from '../components/Ascii';
import TypingAnimation from '../components/TypingAnimation';

const Loading = () => {
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    // Show logo after ASCII animation completes (assuming it takes about 8 seconds)
    const timer = setTimeout(() => {
      setShowLogo(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center w-screen h-screen m-0 p-0"
      style={{ backgroundColor: '#FBFBF4' }}
    >
      <AnimatePresence mode="wait">
        {!showLogo ? (
          <motion.div
            key="ascii"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 0.8,
              rotateY: 90,
              transition: { duration: 1.2, ease: "easeInOut" }
            }}
            className="flex flex-col items-center justify-center"
          >
            <Ascii />
          </motion.div>
        ) : (
          <motion.div
            key="logo"
            initial={{
              opacity: 0,
              scale: 0.3,
              rotateY: -90,
              y: 50
            }}
            animate={{
              opacity: 1,
              scale: 1,
              rotateY: 0,
              y: 0,
              transition: {
                duration: 1.5,
                ease: [0.68, -0.55, 0.265, 1.55],
                staggerChildren: 0.2
              }
            }}
            className="flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{
                scale: 1,
                rotate: 0,
                transition: {
                  duration: 1.2,
                  ease: [0.68, -0.55, 0.265, 1.55],
                  delay: 0.3
                }
              }}
              whileHover={{
                scale: 1.05,
                rotate: 5,
                transition: { duration: 0.3 }
              }}
              className="relative"
            >
              <motion.img
                src="/medusa-logo.png"
                alt="Medusa Logo"
                className="w-24 h-24 object-contain"
                initial={{ filter: "brightness(0.5) blur(4px)" }}
                animate={{
                  filter: "brightness(1) blur(0px)",
                  transition: { duration: 1, delay: 0.5 }
                }}
              />

              {/* Glowing effect */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%)',
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: [0, 0.8, 0.6],
                  scale: [0.5, 1.2, 1],
                  transition: {
                    duration: 2,
                    delay: 0.8,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }
                }}
              />
            </motion.div>

            {/* Floating particles effect */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-amber-400 rounded-full opacity-60"
                initial={{
                  x: 0,
                  y: 0,
                  scale: 0
                }}
                animate={{
                  x: [0, Math.cos(i * 45 * Math.PI / 180) * 80, Math.cos(i * 45 * Math.PI / 180) * 120],
                  y: [0, Math.sin(i * 45 * Math.PI / 180) * 80, Math.sin(i * 45 * Math.PI / 180) * 120],
                  scale: [0, 1, 0],
                  opacity: [0, 0.8, 0],
                  transition: {
                    duration: 3,
                    delay: 1.5 + i * 0.1,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeOut"
                  }
                }}
              />
            ))}

            {/* MEDUSA typing text */}
            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.8,
                  delay: 0.8,
                  ease: "easeOut"
                }
              }}
            >
              <TypingAnimation
                text="MEDUSA"
                speed={150}
                showCursor={true}
                delay={1000}
                className="font-bold tracking-wider"
                style={{ color: '#6B5B47', fontSize: '5rem' }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Loading;