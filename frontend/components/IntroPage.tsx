'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface IntroPageProps {
  data: {
    guest?: {
      name: string
      user_relationship: string
    }
    intro: {
      groom_name: string
      bride_name: string
    }
  }
  onIntroComplete?: () => void
}

export default function IntroPage({ data, onIntroComplete }: IntroPageProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  if (!data || !data.intro) {
    return null
  }

  const handleOpen = () => {
    setIsOpen(true)
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log('Audio play failed:', err))
    }
    onIntroComplete?.()
  }

  if (animationComplete) {
    return (
      <audio ref={audioRef} loop className="hidden">
        <source src="/music/wedding-music.mp3" type="audio/mpeg" />
      </audio>
    )
  }

  return (
    <>
      {/* Background music - Always rendered */}
      <audio ref={audioRef} loop className="hidden">
        <source src="/music/wedding-music.mp3" type="audio/mpeg" />
      </audio>

      {/* Intro overlay - pointer-events: none ngay khi isOpen để không chặn click */}
      <div 
        className={`fixed inset-0 z-[60] ${isOpen ? 'pointer-events-none' : 'pointer-events-auto'}`}
      >
        <AnimatePresence mode="wait" onExitComplete={() => setAnimationComplete(true)}>
          {!isOpen && (
            <motion.div 
              key="intro-overlay"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, ease: 'easeOut' }}
              className="absolute inset-0 overflow-hidden bg-gradient-to-br from-rose-100 via-pink-50 to-purple-100"
              style={{ willChange: 'opacity' }}
            >

      {/* THIỆP MỜI at Top */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="absolute left-0 right-0 z-[90] text-center px-4"
        style={{ top: '7rem', willChange: 'transform, opacity' }}
      >
        <p 
          className="text-3xl font-bold tracking-widest" 
          style={{ 
            fontFamily: "'Cormorant', serif",
            color: '#FFD700',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.6), 0 2px 8px rgba(202, 138, 4, 0.7)',
            filter: 'brightness(1.3)'
          }}
        >
          THIỆP MỜI
        </p>
      </motion.div>

      {/* Center Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          scale: [1, 1.15, 1],
        }}
        exit={{ opacity: 0, scale: 2.5, pointerEvents: 'none' }}
        transition={{ 
          opacity: { duration: 0.5, delay: 0.2 },
          scale: { 
            duration: 1.5, 
            delay: 0.5,
            repeat: Infinity,
            ease: 'easeInOut'
          },
          exit: { duration: 0.8 }
        }}
        className="absolute top-1/2 left-1/2 z-[65] cursor-pointer"
        style={{ marginLeft: '-64px', marginTop: '-64px', willChange: 'transform, opacity' }}
        onClick={handleOpen}
      >
        <div className="relative w-32 h-32 drop-shadow-2xl">
          <Image
            src="/img/logo-intro.png"
            alt="Wedding Logo"
            fill
            className="object-contain"
          />
        </div>
      </motion.div>

      {/* Names at Bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="absolute left-0 right-0 z-[90] text-center space-y-3 px-4"
        style={{ bottom: '8rem', willChange: 'transform, opacity' }}
      >
        <p 
          className="text-4xl font-bold" 
          style={{ 
            fontFamily: "'KD Aureligena Script', cursive",
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.6), 0 4px 12px rgba(202, 138, 4, 0.7)',
            filter: 'brightness(1.3) contrast(1.2)',
          }}
        >
          {data.intro.groom_name} & {data.intro.bride_name}
        </p>
        
        {/* Guest Name - Below couple names */}
        {data.guest && (
          <p 
            className="text-xl tracking-wide mt-2 text-center" 
            style={{ 
              fontFamily: "'Cormorant', serif",
              color: '#FFD700',
              textShadow: '0 0 15px rgba(255, 215, 0, 0.6), 0 2px 6px rgba(202, 138, 4, 0.5)',
            }}
          >
            Kính mời: <span className="font-semibold">{data.guest.name}</span>
          </p>
        )}
      </motion.div>

      {/* Left Door */}
      <motion.div
        initial={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1] }}
        className="absolute top-0 right-1/2 left-0 h-full z-[5]"
        style={{ willChange: 'transform' }}
      >
        <div className="relative w-full h-full overflow-hidden">
          <Image
            src="/img/intro-left.png"
            alt="Wedding Left"
            fill
            className="object-cover"
            style={{ objectPosition: 'right center' }}
            priority
            sizes="50vw"
          />
        </div>
      </motion.div>

      {/* Right Door */}
      <motion.div
        initial={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1] }}
        className="absolute top-0 left-1/2 right-0 h-full z-[15]"
        style={{ willChange: 'transform' }}
      >
        <div className="relative w-full h-full overflow-hidden">
          <Image
            src="/img/intro-right.png"
            alt="Wedding Right"
            fill
            className="object-cover"
            style={{ objectPosition: 'left center' }}
            priority
            sizes="50vw"
          />
        </div>
      </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
