'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { config, getImageUrl, publicFetch } from '@/lib/config'
import HeartImageReveal from './HeartImageReveal'

interface IntroData {
  groom_name: string
  bride_name: string
}

interface DateData {
  lunar_day: string
  calendar_day: string
  event_time: string
}

interface HeaderData {
  photo_url: string | null
}

interface HeaderProps {
  guestId: string
  startHeartAnimation?: boolean
}

export default function Header({ guestId, startHeartAnimation = false }: HeaderProps) {
  const [intro, setIntro] = useState<IntroData | null>(null)
  const [dateData, setDateData] = useState<DateData | null>(null)
  const [headerData, setHeaderData] = useState<HeaderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHeader = async () => {
      try {
        const [introData, dateResult, header] = await Promise.all([
          publicFetch(guestId, 'intro'),
          publicFetch(guestId, 'date'),
          publicFetch(guestId, 'header')
        ])
        if (!introData || !dateResult || !header) throw new Error('Failed to fetch header data')
        setIntro(introData)
        setDateData(dateResult)
        setHeaderData(header)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi')
      } finally {
        setLoading(false)
      }
    }
    fetchHeader()
  }, [guestId])

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-gray-400">Đang tải...</div>
      </div>
    )
  }

  if (error || !intro || !dateData) {
    return null // Don't render if data is missing
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.8 }}
      className="relative w-full min-h-screen flex flex-col items-center justify-start z-0 p-8 overflow-x-hidden bg-white"
    >
      {/* Text Content - At Top */}
      <motion.div
        className="text-center space-y-4 mb-6"
      >
        {/* THIỆP MỜI - Fade in */}
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1.2, ease: 'easeInOut' }}
          className="text-2xl font-bold text-red-800 mb-3" 
          style={{ fontFamily: "'Helvetica', serif" }}
        >
          THIỆP MỜI
        </motion.h2>

        {/* Names - Zoom out with fade */}
        <motion.p 
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.8, ease: 'easeOut' }}
          className="text-4xl font-extrabold" 
          style={{ 
            fontFamily: "'KD Aureligena Script', cursive",
            transform: 'scaleY(1.5)',
            letterSpacing: '0.01em',
            color: '#991B1B',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.15), 0 0 20px rgba(153, 27, 27, 0.3)'
          }}
        >
          {intro.groom_name} & {intro.bride_name}
        </motion.p>

        {/* Double Happiness Logo */}
        <motion.div 
          initial={{ scale: 1.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 2.5, duration: 1.5, ease: 'easeOut' }}
          className="flex justify-center"
        >
          <div className="relative w-16 h-16">
            <Image
              src="/img/header-logo.png"
              alt="Double Happiness"
              fill
              className="object-contain"
            />
          </div>
        </motion.div>

        {/* Time - Fade in */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8, duration: 1.5, ease: 'easeInOut' }}
          className="text-base font-bold text-gray-600" 
          style={{ fontFamily: "'Helvetica', serif", letterSpacing: '0.1em' }}
        >
          {(() => {
            const [hours, minutes] = dateData.event_time.split(':')
            return `${hours} giờ ${minutes} phút`
          })()}
        </motion.p>

        {/* Date - Fade in */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.2, duration: 2, ease: 'easeInOut' }}
          className="text-xl font-bold text-gray-800" 
          style={{ fontFamily: "'Helvetica', serif", letterSpacing: '0.3em' }}
        >
          {dateData.calendar_day.split('-').reverse().join('.')}
        </motion.p>
      </motion.div>

      {/* Main Photo Frame */}
      <div className="relative w-full max-w-md aspect-[3/4] p-4">
        {/* Decorative Outer Border - Modern & Stylized */}
        <div className="absolute inset-0 border-[3px] border-red-200 rounded-tr-[60px] rounded-bl-[60px] rounded-tl-md rounded-br-md transform rotate-1"></div>
        <div className="absolute inset-0 border-[2px] border-red-400 rounded-tr-[60px] rounded-bl-[60px] rounded-tl-md rounded-br-md transform -rotate-1 opacity-50"></div>

        {/* Wedding Photo with Heart Animation */}
        <div className="relative w-full h-full overflow-hidden rounded-tr-[50px] rounded-bl-[50px] rounded-tl-sm rounded-br-sm border-2 border-red-100 shadow-lg bg-white z-20">
          <Image
            src={getImageUrl(headerData?.photo_url) || '/img/logo-intro.png'}
            alt="Wedding Photo"
            fill
            sizes="(max-width: 768px) 100vw, 448px"
            style={{ objectFit: 'cover', objectPosition: 'center' }}
            unoptimized={!!headerData?.photo_url}
            priority
          />
          {/* Heart Animation Overlay */}
          <HeartImageReveal
            imageUrl={getImageUrl(headerData?.photo_url) || '/img/logo-intro.png'}
            className="absolute inset-0 z-30"
            startAnimation={startHeartAnimation}
          />
        </div>

        {/* Top-Left Corner Flowers - L shape pattern */}
        <div className="absolute top-0 left-0 z-40 pointer-events-none">
          {/* Main flower at corner */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 2, duration: 0.5 }}
            className="absolute -top-4 -left-4"
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="5" fill="#DC2626" />
              <circle cx="20" cy="8" r="7" fill="#EF4444" opacity="0.9" />
              <circle cx="32" cy="20" r="7" fill="#EF4444" opacity="0.9" />
              <circle cx="20" cy="32" r="7" fill="#EF4444" opacity="0.9" />
              <circle cx="8" cy="20" r="7" fill="#EF4444" opacity="0.9" />
              <circle cx="26" cy="14" r="6" fill="#F87171" opacity="0.8" />
              <circle cx="26" cy="26" r="6" fill="#F87171" opacity="0.8" />
              <circle cx="14" cy="26" r="6" fill="#F87171" opacity="0.8" />
              <circle cx="14" cy="14" r="6" fill="#F87171" opacity="0.8" />
            </svg>
          </motion.div>

          {/* Horizontal: flower going right */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 2.2, duration: 0.5 }}
            className="absolute -top-3 left-10"
          >
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <circle cx="15" cy="15" r="4" fill="#DC2626" />
              <circle cx="15" cy="6" r="5" fill="#F87171" opacity="0.9" />
              <circle cx="24" cy="15" r="5" fill="#F87171" opacity="0.9" />
              <circle cx="15" cy="24" r="5" fill="#F87171" opacity="0.9" />
              <circle cx="6" cy="15" r="5" fill="#F87171" opacity="0.9" />
              <circle cx="20" cy="10" r="4" fill="#FCA5A5" opacity="0.8" />
              <circle cx="20" cy="20" r="4" fill="#FCA5A5" opacity="0.8" />
              <circle cx="10" cy="20" r="4" fill="#FCA5A5" opacity="0.8" />
              <circle cx="10" cy="10" r="4" fill="#FCA5A5" opacity="0.8" />
            </svg>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 2.4, duration: 0.5 }}
            className="absolute -top-2 left-20"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="3" fill="#DC2626" />
              <circle cx="10" cy="4" r="4" fill="#FCA5A5" opacity="0.9" />
              <circle cx="16" cy="10" r="4" fill="#FCA5A5" opacity="0.9" />
              <circle cx="10" cy="16" r="4" fill="#FCA5A5" opacity="0.9" />
              <circle cx="4" cy="10" r="4" fill="#FCA5A5" opacity="0.9" />
              <circle cx="13" cy="7" r="3" fill="#FED7AA" opacity="0.8" />
              <circle cx="13" cy="13" r="3" fill="#FED7AA" opacity="0.8" />
              <circle cx="7" cy="13" r="3" fill="#FED7AA" opacity="0.8" />
              <circle cx="7" cy="7" r="3" fill="#FED7AA" opacity="0.8" />
            </svg>
          </motion.div>

          {/* Vertical: flowers going down */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 2.2, duration: 0.5 }}
            className="absolute top-10 -left-3"
          >
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <circle cx="15" cy="15" r="4" fill="#DC2626" />
              <circle cx="15" cy="6" r="5" fill="#F87171" opacity="0.9" />
              <circle cx="24" cy="15" r="5" fill="#F87171" opacity="0.9" />
              <circle cx="15" cy="24" r="5" fill="#F87171" opacity="0.9" />
              <circle cx="6" cy="15" r="5" fill="#F87171" opacity="0.9" />
              <circle cx="20" cy="10" r="4" fill="#FCA5A5" opacity="0.8" />
              <circle cx="20" cy="20" r="4" fill="#FCA5A5" opacity="0.8" />
              <circle cx="10" cy="20" r="4" fill="#FCA5A5" opacity="0.8" />
              <circle cx="10" cy="10" r="4" fill="#FCA5A5" opacity="0.8" />
            </svg>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 2.4, duration: 0.5 }}
            className="absolute top-20 -left-2"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="3" fill="#DC2626" />
              <circle cx="10" cy="4" r="4" fill="#FCA5A5" opacity="0.9" />
              <circle cx="16" cy="10" r="4" fill="#FCA5A5" opacity="0.9" />
              <circle cx="10" cy="16" r="4" fill="#FCA5A5" opacity="0.9" />
              <circle cx="4" cy="10" r="4" fill="#FCA5A5" opacity="0.9" />
              <circle cx="13" cy="7" r="3" fill="#FED7AA" opacity="0.8" />
              <circle cx="13" cy="13" r="3" fill="#FED7AA" opacity="0.8" />
              <circle cx="7" cy="13" r="3" fill="#FED7AA" opacity="0.8" />
              <circle cx="7" cy="7" r="3" fill="#FED7AA" opacity="0.8" />
            </svg>
          </motion.div>
        </div>

        {/* Bottom-Right Corner Flowers - L shape pattern */}
        <div className="absolute bottom-0 right-0 z-40 pointer-events-none">
          {/* Main flower at corner */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 2, duration: 0.5 }}
            className="absolute -bottom-4 -right-4"
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="5" fill="#DC2626" />
              <circle cx="20" cy="8" r="7" fill="#EF4444" opacity="0.9" />
              <circle cx="32" cy="20" r="7" fill="#EF4444" opacity="0.9" />
              <circle cx="20" cy="32" r="7" fill="#EF4444" opacity="0.9" />
              <circle cx="8" cy="20" r="7" fill="#EF4444" opacity="0.9" />
              <circle cx="26" cy="14" r="6" fill="#F87171" opacity="0.8" />
              <circle cx="26" cy="26" r="6" fill="#F87171" opacity="0.8" />
              <circle cx="14" cy="26" r="6" fill="#F87171" opacity="0.8" />
              <circle cx="14" cy="14" r="6" fill="#F87171" opacity="0.8" />
            </svg>
          </motion.div>

          {/* Horizontal: flowers going left */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 2.2, duration: 0.5 }}
            className="absolute -bottom-3 right-10"
          >
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <circle cx="15" cy="15" r="4" fill="#DC2626" />
              <circle cx="15" cy="6" r="5" fill="#F87171" opacity="0.9" />
              <circle cx="24" cy="15" r="5" fill="#F87171" opacity="0.9" />
              <circle cx="15" cy="24" r="5" fill="#F87171" opacity="0.9" />
              <circle cx="6" cy="15" r="5" fill="#F87171" opacity="0.9" />
              <circle cx="20" cy="10" r="4" fill="#FCA5A5" opacity="0.8" />
              <circle cx="20" cy="20" r="4" fill="#FCA5A5" opacity="0.8" />
              <circle cx="10" cy="20" r="4" fill="#FCA5A5" opacity="0.8" />
              <circle cx="10" cy="10" r="4" fill="#FCA5A5" opacity="0.8" />
            </svg>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 2.4, duration: 0.5 }}
            className="absolute -bottom-2 right-20"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="3" fill="#DC2626" />
              <circle cx="10" cy="4" r="4" fill="#FCA5A5" opacity="0.9" />
              <circle cx="16" cy="10" r="4" fill="#FCA5A5" opacity="0.9" />
              <circle cx="10" cy="16" r="4" fill="#FCA5A5" opacity="0.9" />
              <circle cx="4" cy="10" r="4" fill="#FCA5A5" opacity="0.9" />
              <circle cx="13" cy="7" r="3" fill="#FED7AA" opacity="0.8" />
              <circle cx="13" cy="13" r="3" fill="#FED7AA" opacity="0.8" />
              <circle cx="7" cy="13" r="3" fill="#FED7AA" opacity="0.8" />
              <circle cx="7" cy="7" r="3" fill="#FED7AA" opacity="0.8" />
            </svg>
          </motion.div>

          {/* Vertical: flowers going up */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 2.2, duration: 0.5 }}
            className="absolute bottom-10 -right-3"
          >
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <circle cx="15" cy="15" r="4" fill="#DC2626" />
              <circle cx="15" cy="6" r="5" fill="#F87171" opacity="0.9" />
              <circle cx="24" cy="15" r="5" fill="#F87171" opacity="0.9" />
              <circle cx="15" cy="24" r="5" fill="#F87171" opacity="0.9" />
              <circle cx="6" cy="15" r="5" fill="#F87171" opacity="0.9" />
              <circle cx="20" cy="10" r="4" fill="#FCA5A5" opacity="0.8" />
              <circle cx="20" cy="20" r="4" fill="#FCA5A5" opacity="0.8" />
              <circle cx="10" cy="20" r="4" fill="#FCA5A5" opacity="0.8" />
              <circle cx="10" cy="10" r="4" fill="#FCA5A5" opacity="0.8" />
            </svg>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 2.4, duration: 0.5 }}
            className="absolute bottom-20 -right-2"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="3" fill="#DC2626" />
              <circle cx="10" cy="4" r="4" fill="#FCA5A5" opacity="0.9" />
              <circle cx="16" cy="10" r="4" fill="#FCA5A5" opacity="0.9" />
              <circle cx="10" cy="16" r="4" fill="#FCA5A5" opacity="0.9" />
              <circle cx="4" cy="10" r="4" fill="#FCA5A5" opacity="0.9" />
              <circle cx="13" cy="7" r="3" fill="#FED7AA" opacity="0.8" />
              <circle cx="13" cy="13" r="3" fill="#FED7AA" opacity="0.8" />
              <circle cx="7" cy="13" r="3" fill="#FED7AA" opacity="0.8" />
              <circle cx="7" cy="7" r="3" fill="#FED7AA" opacity="0.8" />
            </svg>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
