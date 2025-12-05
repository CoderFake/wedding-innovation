'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import IntroPage from '@/components/IntroPage'
import Header from '@/components/Header'
import FamilySection from '@/components/FamilySection'
import InviteSection from '@/components/InviteSection'
import AlbumSection from '@/components/AlbumSection'
import FooterSection from '@/components/FooterSection'
import api from '@/lib/api'
import { config } from '@/lib/config'

interface IntroData {
  id: string
  groom_name: string
  bride_name: string
}

interface GuestData {
  id: string
  name: string
  user_relationship: string
}

export default function PreviewPage() {
  const router = useRouter()
  const params = useParams()
  const introId = params.id as string

  const [introData, setIntroData] = useState<IntroData | null>(null)
  const [guestData, setGuestData] = useState<GuestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [guestId, setGuestId] = useState<string>('')

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchPreviewData()
  }, [router, introId])

  const fetchPreviewData = async () => {
    try {
      // Fetch intro data
      const introResponse = await api.get('/landing-page/intro')
      const intro = introResponse.data
      setIntroData(intro)
      
      // Fetch first guest (demo guest) to use as preview ID
      try {
        const firstGuestResponse = await api.get('/landing-page/guests/first')
        const guest = firstGuestResponse.data
        setGuestId(guest.id)
        setGuestData(guest)
      } catch (err) {
        try {
          const guestsResponse = await api.get('/landing-page/guests')
          const guests = guestsResponse.data.items || guestsResponse.data
          if (guests && guests.length > 0) {
            setGuestId(guests[0].id)
            setGuestData(guests[0])
          }
        } catch {
          console.error('No guests available for preview')
        }
      }

    } catch (err: unknown) {
      console.error('Preview error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Đang tải bản xem trước...</div>
      </div>
    )
  }

  if (!introData || !guestId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">Tải bản xem trước thất bại</div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Quay lại Bảng điều khiển
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Preview Mode Banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-purple-600 text-white py-2 px-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="font-semibold">Chế độ Xem trước</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/edit/${introId}`)}
            className="px-4 py-1 bg-white text-purple-600 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            Chỉnh sửa
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-1 bg-purple-700 text-white rounded-md hover:bg-purple-800 transition-colors text-sm font-medium"
          >
            Đóng xem trước
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="pt-12 min-h-screen bg-[#f5f5f5]">
        <div className="max-w-[500px] mx-auto min-h-screen bg-white shadow-2xl relative">
          {guestId && (
            <>
              <IntroPage data={{ intro: introData, guest: guestData || undefined }} />
              <Header guestId={guestId} />
              <FamilySection guestId={guestId} />
              <InviteSection guestId={guestId} />
              <AlbumSection guestId={guestId} />
              <FooterSection guestId={guestId} />
            </>
          )}
          {!guestId && (
            <div className="text-center py-20 text-red-500">
              Không tìm thấy guest ID. Vui lòng tạo guest trước.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
