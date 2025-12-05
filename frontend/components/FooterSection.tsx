'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { config, getImageUrl, publicFetch } from '@/lib/config'

interface FooterData {
  thank_you_text: string
  closing_message: string
  photo_url: string | null
}

interface FooterSectionProps {
  guestId: string
}

export default function FooterSection({ guestId }: FooterSectionProps) {
  const [data, setData] = useState<FooterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showHearts, setShowHearts] = useState(false)

  useEffect(() => {
    const fetchFooter = async () => {
      try {
        const result = await publicFetch(guestId, 'footer')
        if (!result) throw new Error('Failed to fetch footer')
        setData(result)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchFooter()
  }, [guestId])

  const textRef = useRef(null)
  const imageRef = useRef(null)
  const copyrightRef = useRef(null)
  const footerRef = useRef(null)
  
  const footerInView = useInView(footerRef, { once: true, amount: 0.4 })

  // Trigger hearts when footer comes into view
  useEffect(() => {
    if (footerInView && !showHearts) {
      setShowHearts(true)
    }
  }, [footerInView, showHearts])

  // Generate hearts with random properties
  const hearts = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: 5 + Math.random() * 90,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
    size: 18 + Math.random() * 18,
    color: ['#ff6b6b', '#ee5a5a', '#ff8787', '#fa5252', '#ff4757', '#e84393', '#fd79a8'][i % 7]
  }))

  if (loading) {
    return (
      <section className="w-full py-16 px-8 bg-gradient-to-b from-pink-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-pulse text-gray-400">Đang tải...</div>
        </div>
      </section>
    )
  }

  if (!data) {
    return null
  }

  return (
    <section 
      ref={footerRef} 
      className="w-full py-16 px-8 bg-gradient-to-b from-pink-50 to-white relative overflow-hidden"
    >
      {/* Floating Hearts Animation */}
      {showHearts && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {hearts.map((heart) => (
            <motion.div
              key={heart.id}
              className="absolute"
              style={{ 
                left: `${heart.left}%`,
                bottom: -50,
                color: heart.color
              }}
              initial={{ 
                y: 0, 
                opacity: 0,
                scale: 0.3
              }}
              animate={{ 
                y: -700,
                opacity: [0, 1, 1, 1, 0],
                scale: [0.3, 1, 1.2, 1, 0.8],
                x: [0, -15, 15, -10, 10, 0]
              }}
              transition={{ 
                duration: heart.duration,
                delay: heart.delay,
                ease: 'easeOut',
                repeat: Infinity,
                repeatDelay: Math.random() * 2
              }}
            >
              <svg 
                width={heart.size} 
                height={heart.size} 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </motion.div>
          ))}
        </div>
      )}

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Epic Image with Premium Effects */}
        {data.photo_url && (
          <motion.div
            ref={imageRef}
            initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
            whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative w-full max-w-lg mx-auto aspect-[3/4] perspective-1000"
            style={{ perspective: '1000px' }}
          >
            {/* Outer glow effect */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 2, delay: 0.5 }}
              className="absolute -inset-4 bg-gradient-to-r from-pink-300 via-rose-300 to-pink-300 rounded-2xl blur-xl opacity-40"
              style={{
                animation: 'pulse 3s ease-in-out infinite'
              }}
            />
            
            {/* Main image container with 3D effect */}
            <motion.div
              className="relative w-full h-full rounded-xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)]"
              whileHover={{ 
                scale: 1.02,
                boxShadow: '0 35px 80px -15px rgba(0,0,0,0.5)'
              }}
              transition={{ duration: 0.4 }}
            >
              {/* Image with zoom animation */}
              <motion.div
                initial={{ scale: 1.2 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 2.5, ease: 'easeOut' }}
                className="w-full h-full"
              >
                <Image
                  src={getImageUrl(data.photo_url)}
                  alt="Footer"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </motion.div>
              
              {/* Animated shimmer overlay */}
              <motion.div
                initial={{ x: '-100%' }}
                whileInView={{ x: '200%' }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1.5, delay: 1, ease: 'easeInOut' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
              />
              
              {/* Elegant gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
              
              {/* Decorative corner accents */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-white/50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 1.3 }}
                className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-white/50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 1.4 }}
                className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-white/50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 1.5 }}
                className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-white/50"
              />
              
              {/* Center - Thank You Overlay Banner with epic reveal */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                whileInView={{ scaleX: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 1.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute left-0 right-0 top-1/2 -translate-y-1/2 origin-center"
              >
                <div className="relative py-6 bg-gradient-to-r from-transparent via-gray-900/70 to-transparent backdrop-blur-sm">
                  {/* Animated decorative lines */}
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 2.2 }}
                    className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent origin-center"
                  />
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 2.3 }}
                    className="absolute bottom-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent origin-center"
                  />
                  
                  {/* Thank you text with glow effect - no letter-spacing animation */}
                  <motion.h2
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 2.5 }}
                    className="text-4xl sm:text-5xl text-white text-center drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] whitespace-nowrap"
                    style={{ fontFamily: 'NVN-Motherland-Signature, cursive' }}
                  >
                    ~ thank you ~
                  </motion.h2>
                </div>
              </motion.div>

              {/* Bottom text with staggered animation */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 3 }}
                className="absolute bottom-8 left-0 right-0 text-center px-4"
              >
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: -10 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 3.2 }}
                  className="text-xl text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] mb-3"
                  style={{ fontFamily: 'NVN-Motherland-Signature, cursive' }}
                >
                  Xin chân thành cảm ơn!
                </motion.p>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 3.5 }}
                  className="text-lg text-white/90 italic tracking-wide"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Rất mong được đón tiếp quý khách
                </motion.p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* Copyright */}
        <motion.div
          ref={copyrightRef}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1 }}
          className="text-center mt-12 pt-10 text-gray-500 text-sm"
        >
          <p>&copy; 2025 HoangDieuIT. All rights reserved.</p>
        </motion.div>
      </div>
    </section>
  )
}
