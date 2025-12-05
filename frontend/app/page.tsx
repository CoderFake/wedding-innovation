'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getSubdomainFromUrl, publicFetch } from '@/lib/config'
import IntroPage from '@/components/IntroPage'
import Header from '@/components/Header'
import FamilySection from '@/components/FamilySection'
import InviteSection from '@/components/InviteSection'
import AlbumSection from '@/components/AlbumSection'
import FooterSection from '@/components/FooterSection'

interface LandingPageData {
  guest?: {
    id: string
    name: string
    user_relationship: string
    confirm: boolean
  }
  intro: {
    id: string
    groom_name: string
    groom_full_name: string
    bride_name: string
    bride_full_name: string
  }
  date_of_organization: any
  header_section: any
  family_section: any
  invite_section: any
  album_sessions: any[]
  footer_section: any
}

export default function Home() {
  const router = useRouter()
  const [subdomain, setSubdomain] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [weddingData, setWeddingData] = useState<LandingPageData | null>(null)
  const [error, setError] = useState('')
  const [introComplete, setIntroComplete] = useState(false)
  
  useEffect(() => {
    const sub = getSubdomainFromUrl()
    setSubdomain(sub)
    
    if (sub) {
      // This is a subdomain - show wedding page without guestId
      fetchWeddingBySubdomain()
    } else {
      // Main domain - redirect to login or dashboard
      const token = localStorage.getItem('access_token')
      if (token) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [router])

  const fetchWeddingBySubdomain = async () => {
    try {
      // Fetch wedding data using subdomain only (no guestId)
      const sub = getSubdomainFromUrl()
      if (!sub) return
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:18600/api/v1'}/landing-page/by-subdomain`, {
        headers: {
          'X-Subdomain': sub,
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error('Không tìm thấy thiệp cưới')
      }
      
      const data = await response.json()
      setWeddingData(data)
    } catch (err: any) {
      setError(err.message || 'Không tìm thấy thiệp cưới')
    } finally {
      setLoading(false)
    }
  }

  // Main domain - show loading while redirecting
  if (!subdomain) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    )
  }

  // Subdomain - loading wedding data
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-pink-300 border-t-pink-600 rounded-full"
        />
      </div>
    )
  }

  // Subdomain not found
  if (error || !weddingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center"
        >
          <div className="text-6xl mb-6">💔</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Không Tìm Thấy Thiệp Cưới
          </h2>
          <p className="text-gray-600 mb-8">
            Rất tiếc, thiệp cưới bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
          </p>
          <p className="text-sm text-gray-500">
            Vui lòng kiểm tra lại đường link hoặc liên hệ người gửi thiệp mời.
          </p>
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-400">
              &copy; 2025 HoangDieuIT. All rights reserved.
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  // Show wedding page (without specific guest)
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="max-w-[500px] mx-auto min-h-screen bg-white shadow-2xl relative">
        <IntroPage data={weddingData} onIntroComplete={() => setIntroComplete(true)} />
        {/* For subdomain without guestId, we use a placeholder */}
        <Header guestId="preview" startHeartAnimation={introComplete} />
        <FamilySection guestId="preview" />
        <InviteSection guestId="preview" />
        <AlbumSection guestId="preview" />
        <FooterSection guestId="preview" />
      </div>
    </div>
  )
}
