'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { publicFetch, getSubdomainFromUrl } from '@/lib/config'
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
  date_of_organization: {
    lunar_day: string
    calendar_day: string
    time: string
  } | null
  header_section: {
    session_image_id: string | null
  } | null
  family_section: {
    groom_father_name: string
    groom_mother_name: string
    groom_address: string
    bride_father_name: string
    bride_mother_name: string
    bride_address: string
    session_image_id: string | null
  } | null
  invite_section: {
    left_image_id: string | null
    center_image_id: string | null
    right_image_id: string | null
  } | null
  album_sessions: Array<{
    id: string
    title: string | null
    order: number
  }>
  footer_section: {
    thanks_text: string
    session_image_id: string | null
  } | null
}

export default function PublicWeddingPage({ params }: { params: Promise<{ guestId: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [data, setData] = useState<LandingPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [introComplete, setIntroComplete] = useState(false)

  useEffect(() => {
    // Landing page requires subdomain - redirect to 404 if no subdomain
    const subdomain = getSubdomainFromUrl()
    if (!subdomain) {
      router.replace('/not-found')
      return
    }
    
    fetchWeddingData()
  }, [resolvedParams.guestId, router])

  const fetchWeddingData = async () => {
    try {
      const result = await publicFetch(resolvedParams.guestId)
      
      if (!result) {
        throw new Error('Không tìm thấy thiệp cưới')
      }

      setData(result)
    } catch (err: any) {
      setError(err.message || 'Tải thiệp cưới thất bại')
    } finally {
      setLoading(false)
    }
  }

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

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">💔</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Rất tiếc!</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Vui lòng kiểm tra lại link thiệp mời của bạn</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="max-w-[500px] mx-auto min-h-screen bg-white shadow-2xl relative">
        <IntroPage data={data} onIntroComplete={() => setIntroComplete(true)} />
        <Header guestId={resolvedParams.guestId} startHeartAnimation={introComplete} />
        <FamilySection guestId={resolvedParams.guestId} />
        <InviteSection guestId={resolvedParams.guestId} />
        <AlbumSection guestId={resolvedParams.guestId} />
        <FooterSection guestId={resolvedParams.guestId} />
      </div>
    </div>
  )
}
