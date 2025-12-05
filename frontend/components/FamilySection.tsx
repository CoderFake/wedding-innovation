'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { config, getImageUrl, publicFetch } from '@/lib/config'

interface FamilyData {
  groom_father_name: string
  groom_mother_name: string
  groom_address: string
  bride_father_name: string
  bride_mother_name: string
  bride_address: string
  photo_url: string | null
  groom_image_url: string | null
  bride_image_url: string | null
}

interface IntroData {
  groom_full_name: string
  bride_full_name: string
}

interface FamilySectionProps {
  guestId: string
}

export default function FamilySection({ guestId }: FamilySectionProps) {
  const [data, setData] = useState<FamilyData | null>(null)
  const [intro, setIntro] = useState<IntroData | null>(null)
  const [loading, setLoading] = useState(true)

  // Generate math-perfect heart polygon
  const generateHeartPolygon = (scale = 3.0, pointCount = 200) => {
    const points = []
    for (let i = 0; i < pointCount; i++) {
      const t = (i / pointCount) * Math.PI * 2
      // Heart formula (modified for wider shape)
      const x = 20 * Math.pow(Math.sin(t), 3) // Further increased width
      const y = -(13 * Math.cos(t) - 4 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
      
      // Normalize to 0-100%
      // Adjusted X scale to prevent clipping at edges
      const xNorm = 50 + (x * scale * 0.78) 
      const yNorm = 42 + (y * scale) // Re-centered
      
      points.push(`${xNorm}% ${yNorm}%`)
    }
    return `polygon(${points.join(', ')})`
  }

  // Two nested hearts for frame effect
  const outerHeartPolygon = generateHeartPolygon(3.2) // Larger for frame
  const innerHeartPolygon = generateHeartPolygon(3.0) // Smaller for image
  const initialPolygon = generateHeartPolygon(0.1) // Start as a tiny heart
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [familyData, introData] = await Promise.all([
          publicFetch(guestId, 'family'),
          publicFetch(guestId, 'intro')
        ])
        if (!familyData || !introData) throw new Error('Failed to fetch data')
        setData(familyData)
        setIntro(introData)
      } catch (err) {
        console.error('FamilySection error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [guestId])

  const titleRef = useRef(null)
  const groomRef = useRef(null)
  const brideRef = useRef(null)
  
  const titleInView = useInView(titleRef, { once: true, amount: 0.5 })
  const groomInView = useInView(groomRef, { once: true, amount: 0.5 })
  const brideInView = useInView(brideRef, { once: true, amount: 0.5 })
  
  const announcementRef = useRef(null)
  const imageRef = useRef(null)
  const announcementInView = useInView(announcementRef, { once: true, amount: 0.3 })
  const imageInView = useInView(imageRef, { once: true, amount: 0.3 })

  if (loading) {
    return (
      <section className="w-full py-8 px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-pulse text-gray-400">Đang tải...</div>
        </div>
      </section>
    )
  }

  if (!data || !intro) {
    return null
  }

  return (
    <section className="w-full pt-0 pb-8 px-8 bg-white relative z-10">
      <div className="max-w-4xl mx-auto">
        {/* Family Icon with Groom and Bride images on sides */}
        <motion.div
          ref={titleRef}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          className="flex justify-center items-end gap-10 md:gap-16 mb-6 relative"
          style={{ zIndex: 100 }}
        >
          {/* Groom Image - Left side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
            className="flex-shrink-0"
            style={{
              filter: 'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.2))'
            }}
          >
            {data.groom_image_url ? (
              <>
                <div className="relative w-16 h-24 md:w-20 md:h-28 rounded-lg overflow-hidden">
                  <Image
                    src={getImageUrl(data.groom_image_url)}
                    alt="Chú rể"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <p className="text-center text-[10px] text-gray-600 mt-1 font-medium">Chú rể</p>
              </>
            ) : (
              <div className="w-16 h-24 md:w-20 md:h-28" /> 
            )}
          </motion.div>

          {/* Family Icon - Center */}
          <div className="relative w-16 h-16 flex-shrink-0">
            <Image
              src="/img/family-png.png"
              alt="Family Icon"
              fill
              className="object-contain"
            />
          </div>

          {/* Bride Image - Right side */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
            className="flex-shrink-0"
            style={{
              filter: 'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.2))'
            }}
          >
            {data.bride_image_url ? (
              <>
                <div className="relative w-16 h-24 md:w-20 md:h-28 rounded-lg overflow-hidden">
                  <Image
                    src={getImageUrl(data.bride_image_url)}
                    alt="Cô dâu"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <p className="text-center text-[10px] text-gray-600 mt-1 font-medium">Cô dâu</p>
              </>
            ) : (
              <div className="w-16 h-24 md:w-20 md:h-28" />
            )}
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          className="text-2xl font-bold text-center text-red-800 mb-8"
          style={{ fontFamily: "'Cormorant', serif" }}
        >
          GIA ĐÌNH HAI BÊN
        </motion.h2>

        <div className="relative grid grid-cols-2 gap-0">
          {/* Center Divider Line - Wipe from top to bottom */}
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ transformOrigin: 'top' }}
            className="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-gradient-to-b from-red-300 via-red-600 to-red-300 z-10"
          />

          {/* Groom's Family - Fade from right to left, align right */}
          <div className="overflow-hidden">
            <motion.div
              ref={groomRef}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
              className="text-right pr-6 space-y-2"
            >
              <h3 className="text-base font-bold text-gray-800 mb-2" style={{ fontFamily: "'Cormorant', serif" }}>
                NHÀ TRAI
              </h3>
              <div className="space-y-1">
                <p className="text-xs text-gray-700 leading-tight">
                  <span className="font-semibold">{data.groom_father_name}</span>
                </p>
                <p className="text-xs text-gray-700 leading-tight">
                  <span className="font-semibold">{data.groom_mother_name}</span>
                </p>
                <p className="text-[10px] text-gray-600 mt-2 leading-tight">
                  {data.groom_address}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Bride's Family - Fade from left to right, align left */}
          <div className="overflow-hidden">
            <motion.div
              ref={brideRef}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
              className="text-left pl-6 space-y-2"
            >
              <h3 className="text-base font-bold text-gray-800 mb-2" style={{ fontFamily: "'Cormorant', serif" }}>
                NHÀ GÁI
              </h3>
              <div className="space-y-1">
                <p className="text-xs text-gray-700 leading-tight">
                  <span className="font-semibold">{data.bride_father_name}</span>
                </p>
                <p className="text-xs text-gray-700 leading-tight">
                  <span className="font-semibold">{data.bride_mother_name}</span>
                </p>
                <p className="text-[10px] text-gray-600 mt-2 leading-tight">
                  {data.bride_address}
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Wedding Announcement */}
        <div
          ref={announcementRef}
          className="text-center mt-12 space-y-4"
        >
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1, delay: 0.1 }}
            className="text-xl text-gray-600" 
            style={{ fontFamily: "'Cormorant', serif" }}
          >
            Trân trọng báo tin lễ thành hôn của
          </motion.p>
          <div className="space-y-2">
            <motion.p 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1.2, delay: 0.3 }}
              className="text-5xl font-extrabold" 
              style={{ 
                fontFamily: "'KD Aureligena Script', cursive",
                color: '#991B1B',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.15), 0 0 20px rgba(153, 27, 27, 0.3)'
              }}
            >
              {intro.groom_full_name}
            </motion.p>
            <motion.p 
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-3xl font-bold text-red-600" 
              style={{ 
                fontFamily: "'KD Aureligena Script', cursive",
                textShadow: '1px 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              &
            </motion.p>
            <motion.p 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1.2, delay: 0.7 }}
              className="text-5xl font-extrabold" 
              style={{ 
                fontFamily: "'KD Aureligena Script', cursive",
                color: '#991B1B',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.15), 0 0 20px rgba(153, 27, 27, 0.3)'
              }}
            >
              {intro.bride_full_name}
            </motion.p>
          </div>
        </div>

        {/* Wedding Photo with Heart Reveal Effect */}
        <motion.div
          ref={imageRef}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="mt-8 flex justify-center"
        >
          <div className="relative group">
            {/* Glow effect behind image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 1.5, delay: 0.3 }}
              className="absolute -inset-6 bg-gradient-to-r from-pink-400 via-red-500 to-pink-400 blur-2xl opacity-40"
              style={{ 
                clipPath: outerHeartPolygon,
                transform: 'scale(1.2)'
              }}
            />
            
            {/* Heart reveal container */}
            <div className="relative w-80 h-96 filter drop-shadow-2xl">
              {/* Outer Heart (Frame) */}
              <motion.div
                initial={{ 
                  clipPath: initialPolygon
                }}
                whileInView={{ 
                  clipPath: outerHeartPolygon
                }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 2,
                  delay: 0.2,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                className="absolute inset-0 bg-gradient-to-br from-red-500 via-pink-600 to-red-500"
              />

              {/* Inner Heart (Image) */}
              <motion.div
                initial={{ 
                  clipPath: initialPolygon
                }}
                whileInView={{ 
                  clipPath: innerHeartPolygon
                }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 2,
                  delay: 0.2,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                className="absolute inset-0 bg-white overflow-hidden"
              >
                {/* Image inside heart */}
                <div className="absolute inset-0 bg-pink-50" />
                <div className="absolute inset-0 flex items-start justify-center pt-8">
                  <img
                    src={getImageUrl(data.photo_url) || '/img/logo-intro.png'}
                    alt="Wedding Photo"
                    className="w-full h-full object-cover object-top"
                    style={{ transform: 'scale(1.1)' }}
                  />
                </div>
                
                {/* Shine effect overlay */}
                <motion.div
                  initial={{ x: '-100%', opacity: 0 }}
                  whileInView={{ x: '200%', opacity: [0, 0.6, 0] }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: 2.2, ease: 'easeInOut' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent skew-x-12"
                  style={{ width: '50%' }}
                />
              </motion.div>
            </div>
            
            {/* Floating hearts around the photo - more hearts */}
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                whileInView={{ 
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1, 1.2, 0.3],
                  x: [0, (i % 2 === 0 ? -1 : 1) * (20 + Math.random() * 60)],
                  y: [0, -60 - Math.random() * 80]
                }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 2.5,
                  delay: 1.5 + i * 0.12,
                  ease: 'easeOut'
                }}
                className="absolute"
                style={{
                  left: `${10 + (i * 6) % 80}%`,
                  bottom: `${5 + (i * 7) % 30}%`,
                  color: ['#ef4444', '#ec4899', '#f43f5e', '#fb7185', '#fda4af', '#be123c', '#e11d48'][i % 7]
                }}
              >
                <svg 
                  className={`w-${4 + (i % 3)} h-${4 + (i % 3)}`}
                  style={{ width: 16 + (i % 4) * 4, height: 16 + (i % 4) * 4 }}
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
