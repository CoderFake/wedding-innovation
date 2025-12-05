'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'

import api from '@/lib/api'

interface IntroData {
  id: string
  groom_name: string
  groom_full_name: string
  bride_name: string
  bride_full_name: string
}

export default function EditIntroPage() {
  const router = useRouter()
  const params = useParams()
  const introId = params.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<IntroData>({
    id: '',
    groom_name: '',
    groom_full_name: '',
    bride_name: '',
    bride_full_name: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchIntroData()
  }, [router, introId])

  const fetchIntroData = async () => {
    try {
      const response = await api.get('/landing-page/intro')
      setFormData(response.data)
    } catch (err) {
      setError('Tải dữ liệu thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      await api.put('/landing-page/intro', {
        groom_name: formData.groom_name,
        groom_full_name: formData.groom_full_name,
        bride_name: formData.bride_name,
        bride_full_name: formData.bride_full_name
      })
      router.push('/dashboard')
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const error = err as { response?: { data?: { detail?: string } } }
        setError(error.response?.data?.detail || 'Cập nhật thất bại')
      } else {
        setError('Lỗi mạng')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa Thiệp cưới</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Quay lại Bảng điều khiển
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Chú Rể (Ngắn gọn)
                </label>
                <input
                  type="text"
                  value={formData.groom_name}
                  onChange={(e) => setFormData({ ...formData, groom_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="VD: Thế Tài"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ tên Chú Rể
                </label>
                <input
                  type="text"
                  value={formData.groom_full_name}
                  onChange={(e) => setFormData({ ...formData, groom_full_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="VD: Võ Nhân Thành Đại"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Cô Dâu (Ngắn gọn)
                </label>
                <input
                  type="text"
                  value={formData.bride_name}
                  onChange={(e) => setFormData({ ...formData, bride_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="VD: Phạm Huyền"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ tên Cô Dâu
                </label>
                <input
                  type="text"
                  value={formData.bride_full_name}
                  onChange={(e) => setFormData({ ...formData, bride_full_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="VD: Lữu Hải Đường Phạm"
                  required
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </motion.button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex-1 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
              >
                Hủy
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Các phần khác</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => router.push(`/edit/${introId}/sections`)}
                className="px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
              >
                📋 Tất cả các phần
              </button>
              <button 
                onClick={() => router.push(`/edit/${introId}/albums`)}
                className="px-4 py-3 bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 transition-colors font-medium"
              >
                📸 Album ảnh
              </button>
              <button 
                onClick={() => router.push(`/edit/${introId}/guests`)}
                className="px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium"
              >
                👥 Khách mời
              </button>
              <button 
                onClick={() => router.push(`/preview/${introId}`)}
                className="px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium"
              >
                👁️ Xem trước
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
