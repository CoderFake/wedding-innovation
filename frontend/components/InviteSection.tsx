'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { config, getImageUrl, publicFetch } from '@/lib/config'

interface InviteData {
  left_image_url: string | null
  center_image_url: string | null
  right_image_url: string | null
  greeting_text: string | null
  attendance_request_text: string | null
}

interface DateData {
  lunar_day: string
  calendar_day: string
  event_time: string
  venue_address: string | null
  map_iframe: string | null
}

interface FooterData {
  photo_url: string | null
}

interface InviteSectionProps {
  guestId: string
}

// Helper function to parse date data
function parseDateInfo(dateData: DateData | null) {
  if (!dateData) {
    return {
      time: '10:00',
      dayOfWeek: 'Thứ 5',
      day: '09',
      month: 'Tháng 1',
      year: '2025',
      lunarDate: 'Ngày 18 Tháng 01 Năm Ất Tỵ'
    }
  }

  const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
  
  // Parse calendar_day (format: "2025-01-29" or "09.01.2025")
  let dateObj: Date
  if (dateData.calendar_day.includes('-')) {
    dateObj = new Date(dateData.calendar_day)
  } else {
    const parts = dateData.calendar_day.split('.')
    dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
  }
  
  // Parse event_time (format: "10:00:00" or "10:00")
  const timeParts = dateData.event_time.split(':')
  const timeStr = `${timeParts[0]} giờ ${timeParts[1]}`

  return {
    time: timeStr,
    dayOfWeek: dayNames[dateObj.getDay()],
    day: dateObj.getDate().toString().padStart(2, '0'),
    month: `Tháng ${dateObj.getMonth() + 1}`,
    year: `Năm ${dateObj.getFullYear()}`,
    lunarDate: dateData.lunar_day || ''
  }
}

// Helper function to generate calendar data for a specific month
function generateCalendar(dateData: DateData | null) {
  let dateObj: Date
  if (!dateData) {
    dateObj = new Date()
  } else if (dateData.calendar_day.includes('-')) {
    dateObj = new Date(dateData.calendar_day)
  } else {
    const parts = dateData.calendar_day.split('.')
    dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
  }

  const year = dateObj.getFullYear()
  const month = dateObj.getMonth() // 0-indexed
  const highlightDay = dateObj.getDate()

  // Get first day of month (0 = Sunday, 1 = Monday, ...)
  const firstDay = new Date(year, month, 1).getDay()
  // Convert to Monday-based (0 = Monday, 6 = Sunday)
  const startOffset = firstDay === 0 ? 6 : firstDay - 1

  // Get total days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Generate calendar array
  const calendar: (number | null)[] = []
  
  // Add empty cells for days before the 1st
  for (let i = 0; i < startOffset; i++) {
    calendar.push(null)
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendar.push(day)
  }

  // Month/Year display text
  const monthYearText = `Tháng ${String(month + 1).padStart(2, '0')} năm ${year}`

  return {
    calendar,
    highlightDay,
    monthYearText
  }
}

export default function InviteSection({ guestId }: InviteSectionProps) {
  const [data, setData] = useState<InviteData | null>(null)
  const [dateData, setDateData] = useState<DateData | null>(null)
  const [footerData, setFooterData] = useState<FooterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMapModal, setShowMapModal] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [hasConfirmed, setHasConfirmed] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const guestResult = await publicFetch(guestId)
        if (guestResult?.guest?.confirm) {
          setHasConfirmed(true)
        }

        // Fetch invite section
        const inviteResult = await publicFetch(guestId, 'invite-section')
        if (inviteResult) {
          setData(inviteResult)
        }

        // Fetch date data for map
        const dateResult = await publicFetch(guestId, 'date')
        if (dateResult) {
          setDateData(dateResult)
        }

        // Fetch footer for confirm modal image
        const footerResult = await publicFetch(guestId, 'footer')
        if (footerResult) {
          setFooterData(footerResult)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [guestId])

  const titleRef = useRef(null)
  const contentRef = useRef(null)
  const calendarRef = useRef(null)
  const imagesRef = useRef(null)
  const confirmRef = useRef(null)
  
  const titleInView = useInView(titleRef, { once: true, margin: "-100px" })
  const contentInView = useInView(contentRef, { once: true, margin: "-100px" })
  const calendarInView = useInView(calendarRef, { once: true, margin: "-100px" })
  const imagesInView = useInView(imagesRef, { once: true, margin: "-100px" })
  const confirmInView = useInView(confirmRef, { once: true, margin: "-100px" })

  const handleConfirmClick = async () => {
    if (isConfirming || hasConfirmed) return
    
    setIsConfirming(true)
    
    try {
      // Call API to confirm attendance
      const result = await publicFetch(guestId, 'confirm', { method: 'POST' })
      
      if (result) {
        setHasConfirmed(true)
        setIsModalOpen(true)
        setShowThankYou(true)
        setShowMessage(false)
        
        setTimeout(() => {
          setShowThankYou(false)
          setTimeout(() => {
            setShowMessage(true)
          }, 300)
        }, 1500)
      } else {
        console.error('Failed to confirm attendance')
        // Still show modal even if API fails
        setIsModalOpen(true)
        setShowThankYou(true)
        setShowMessage(false)
        
        setTimeout(() => {
          setShowThankYou(false)
          setTimeout(() => {
            setShowMessage(true)
          }, 300)
        }, 1500)
      }
    } catch (error) {
      console.error('Error confirming attendance:', error)
      // Still show modal even if API fails
      setIsModalOpen(true)
      setShowThankYou(true)
      setShowMessage(false)
      
      setTimeout(() => {
        setShowThankYou(false)
        setTimeout(() => {
          setShowMessage(true)
        }, 300)
      }, 1500)
    } finally {
      setIsConfirming(false)
    }
  }

  if (loading) {
    return (
      <section className="w-full py-16 px-8 bg-gradient-to-b from-white to-pink-50">
        <div className="max-w-md mx-auto text-center">
          <div className="animate-pulse text-gray-400">Đang tải...</div>
        </div>
      </section>
    )
  }

  if (!data) {
    return null
  }

  return (
    <section className="w-full py-16 px-8 bg-gradient-to-b from-white to-pink-50">
      <div className="max-w-md mx-auto">
        {/* Title with Decorative Line */}
        <div className="flex items-center justify-center mb-8 gap-3">
          <div className="flex-1 max-w-[100px] h-px bg-gradient-to-r from-transparent via-gray-300 to-gray-400"></div>
          <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <div className="flex-1 max-w-[100px] h-px bg-gradient-to-l from-transparent via-gray-300 to-gray-400"></div>
        </div>

        {/* Title */}
        <motion.h2
          ref={titleRef}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1.5 }}
          className="text-2xl font-bold text-center text-gray-800 mb-8 tracking-wide"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Trân Trọng Kính Mời
        </motion.h2>

        {/* Three Images */}
        <motion.div
          ref={imagesRef}
          className="flex items-end justify-center gap-4 mb-12 px-4"
        >
          {/* Left Image - Fade in from bottom */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.5, delay: 0.2 }}
            className="w-1/3 rounded-lg overflow-hidden shadow-lg"
          >
            <img
              src={getImageUrl(data.left_image_url) || '/img/couple-1.jpg'}
              alt="Couple photo left"
              className="w-full h-auto object-cover"
            />
          </motion.div>

          {/* Center Image - Zoom out (larger) */}
          <motion.div
            initial={{ opacity: 0, scale: 1.3 }}
            whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.5, delay: 0.3 }}
            className="w-2/5 rounded-lg overflow-hidden shadow-2xl relative z-10"
          >
            <img
              src={getImageUrl(data.center_image_url) || '/img/couple-2.jpg'}
              alt="Couple photo center"
              className="w-full h-auto object-cover"
            />
          </motion.div>

          {/* Right Image - Fade in from bottom */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.5, delay: 0.4 }}
            className="w-1/3 rounded-lg overflow-hidden shadow-lg"
          >
            <img
              src={getImageUrl(data.right_image_url) || '/img/couple-3.jpg'}
              alt="Couple photo right"
              className="w-full h-auto object-cover"
            />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1.5 }}
          className="text-sm font-semibold text-center text-gray-700 mb-2 tracking-wider"
          style={{ fontFamily: "'Cormorant', serif" }}
        >
          THAM DỰ TIỆC MỪNG LỄ THÀNH HÔN
        </motion.h2>

        {/* Wedding Details */}
        <motion.div
          ref={contentRef}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="text-center space-y-4"
        >
          {/* Vào Lúc */}
          <p className="text-xm text-gray-600" style={{ fontFamily: "'Cormorant', serif" }}>
            Vào Lúc
          </p>

          {/* Date Layout - 3 columns with vertical dividers */}
          {(() => {
            const dateInfo = parseDateInfo(dateData)
            return (
              <div className="relative flex items-center justify-center text-gray-700">
                {/* Left: Time */}
                <div className="flex flex-col items-center justify-center px-4 py-2">
                  <p className="text-xl whitespace-nowrap">{dateInfo.time}</p>
                </div>

                {/* Center: Day of week + Date + Month - with relative positioning for dividers */}
                <div className="relative flex flex-col items-center px-6 py-2">
                  {/* Left Vertical Divider */}
                  <motion.div 
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="absolute left-0 top-0 bottom-0 w-px bg-gray-400"
                    style={{ transformOrigin: 'center' }}
                  />
                  
                  <p className="text-xl mb-1">{dateInfo.dayOfWeek}</p>
                  <p className="text-5xl font-bold leading-none text-red-600">{dateInfo.day}</p>
                  <p className="text-xl mt-1">{dateInfo.month}</p>
                  
                  {/* Right Vertical Divider */}
                  <motion.div 
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                    className="absolute right-0 top-0 bottom-0 w-px bg-gray-400"
                    style={{ transformOrigin: 'center' }}
                  />
                </div>

                {/* Right: Year */}
                <div className="flex flex-col items-center justify-center px-4 py-2">
                  <p className="text-xl whitespace-nowrap">{dateInfo.year}</p>
                </div>
              </div>
            )
          })()}

          {/* Lunar Date */}
          <p className="text-xl text-gray-500 italic pt-2">
            ({dateData?.lunar_day ? `Tức ${dateData.lunar_day}` : 'Tức Ngày 18 Tháng 01 Năm Ất Tỵ'})
          </p>

          {/* Venue Title */}
          <p className="text-xm font-semibold text-gray-700 pt-4 tracking-wide" style={{ fontFamily: "'Cormorant', serif" }}>
            BUỔI TIỆC ĐƯỢC TỔ CHỨC TẠI
          </p>

          {/* Address Box with Map Link */}
          <div className="border-2 border-red-600 rounded p-3 text-center mx-4">
            <p className="text-xm text-gray-700 leading-relaxed whitespace-pre-line">
              {dateData?.venue_address || 'Địa chỉ nơi tổ chức'}
            </p>
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-1 text-red-600 text-xl font-semibold hover:text-red-700 active:scale-95 transition-all cursor-pointer relative z-20"
              onClick={() => {
                console.log('Map button clicked')
                if (dateData?.map_iframe) {
                  setShowMapModal(true)
                } else {
                  window.open('https://maps.google.com', '_blank')
                }
              }}
              onTouchEnd={(e) => {
                e.preventDefault()
                console.log('Map button touched')
                if (dateData?.map_iframe) {
                  setShowMapModal(true)
                } else {
                  window.open('https://maps.google.com', '_blank')
                }
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Xem bản đồ
            </button>
          </div>

          {/* Calendar */}
          {(() => {
            const { calendar, highlightDay, monthYearText } = generateCalendar(dateData)
            return (
              <motion.div
                ref={calendarRef}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="pt-6"
              >
                <p className="text-xm text-gray-600 mb-3" style={{ fontFamily: "'Cormorant', serif" }}>
                  {monthYearText}
                </p>
                
                {/* Calendar Grid */}
                <div className="inline-block">
                  <div className="grid grid-cols-7 gap-1 text-xs">
                    {/* Day headers */}
                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                      <div key={day} className="w-7 h-7 flex items-center justify-center font-semibold text-gray-500 text-[10px]">
                        {day}
                      </div>
                    ))}
                    
                    {/* Calendar days - dynamically generated */}
                    {calendar.map((day, i) => (
                      day === highlightDay ? (
                        <div key={`day-${i}`} className="w-7 h-7 flex items-center justify-center relative">
                          <motion.svg 
                            className="absolute w-7 h-7 text-red-400" 
                            viewBox="0 0 24 24" 
                            fill="currentColor"
                            animate={{ 
                              scale: [1, 1.15, 1],
                              opacity: [0.8, 1, 0.8]
                            }}
                            transition={{ 
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          >
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </motion.svg>
                          <span className="relative z-10 text-white font-semibold text-[11px]">{day}</span>
                        </div>
                      ) : (
                        <div key={`day-${i}`} className="w-7 h-7 flex items-center justify-center text-gray-600 text-[11px]">
                          {day || ''}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </motion.div>
            )
          })()}
        </motion.div>

        {/* Confirmation Section */}
        <motion.div
          ref={confirmRef}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mt-12"
        >
          <h3 
            className="text-3xl text-gray-700 mb-6"
            style={{ fontFamily: 'NVN-Motherland-Signature, cursive' }}
          >
            Xác nhận tham dự
          </h3>
          
          <button
            type="button"
            onClick={() => {
              console.log('Confirm button clicked, hasConfirmed:', hasConfirmed)
              if (hasConfirmed) {
                setIsModalOpen(true)
              } else if (!isConfirming) {
                handleConfirmClick()
              }
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              console.log('Confirm button touched, hasConfirmed:', hasConfirmed)
              if (hasConfirmed) {
                setIsModalOpen(true)
              } else if (!isConfirming) {
                handleConfirmClick()
              }
            }}
            disabled={isConfirming}
            className={`px-8 py-3 text-white text-sm font-semibold rounded-full shadow-lg transition-all active:scale-95 relative z-20 ${
              hasConfirmed 
                ? 'bg-green-600 hover:bg-green-700 cursor-pointer' 
                : isConfirming 
                  ? 'bg-gray-400 cursor-wait' 
                  : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {hasConfirmed ? '✓ Đã xác nhận' : isConfirming ? 'Đang xác nhận...' : 'Xác nhận tham dự'}
          </button>
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-md w-full bg-white rounded-lg overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Couple Image - use footer image or fallback */}
              <div className="relative w-full">
                <img
                  src={getImageUrl(footerData?.photo_url) || '/img/couple-main.jpg'}
                  alt="Couple"
                  className="w-full h-auto object-cover"
                />
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                
                {/* Thank You Overlay Banner - slides across */}
                <motion.div
                  initial={{ x: '-100%', opacity: 0 }}
                  animate={{ x: '0%', opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                  className="absolute left-0 right-0 top-1/2 -translate-y-1/2"
                >
                  <div className="relative py-4 bg-gray-800/50 backdrop-blur-sm">
                    {/* Decorative lines */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/30"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/30"></div>
                    
                    {/* Thank you text */}
                    <motion.h2
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                      className="text-3xl text-white text-center drop-shadow-lg"
                      style={{ fontFamily: 'NVN-Motherland-Signature, cursive' }}
                    >
                      ~ thank you ~
                    </motion.h2>
                  </div>
                </motion.div>

                {/* Message - Fade In at bottom */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1 }}
                  className="absolute bottom-6 left-0 right-0 text-center"
                >
                  <p 
                    className="text-xl text-white px-4 drop-shadow-lg"
                    style={{ fontFamily: 'NVN-Motherland-Signature, cursive' }}
                  >
                    Rất hân hạnh được đón tiếp!
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Modal */}
      <AnimatePresence>
        {showMapModal && dateData?.map_iframe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4"
            onClick={() => setShowMapModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-lg w-full bg-white rounded-lg overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowMapModal(false)}
                className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 rounded-full shadow-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Map iframe */}
              <div className="w-full h-80">
                <iframe
                  src={dateData.map_iframe.match(/src=["']([^"']+)["']/)?.[1] || ''}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
