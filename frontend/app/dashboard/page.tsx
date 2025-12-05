'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import api from '@/lib/api'

interface User {
  id: number
  username: string
  role: string
  is_active: boolean
  max_invite: number
  created_at: string
  subdomain?: string
}

interface Intro {
  id: number
  groom_name: string
  groom_full_name: string
  bride_name: string
  bride_full_name: string
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [intros, setIntros] = useState<Intro[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSubdomainModal, setShowSubdomainModal] = useState(false)
  const [subdomain, setSubdomain] = useState('')
  const [subdomainInfo, setSubdomainInfo] = useState<{subdomain: string | null, guest_url_preview: string | null, base_domain: string} | null>(null)
  const [formData, setFormData] = useState({
    groom_name: '',
    groom_full_name: '',
    bride_name: '',
    bride_full_name: ''
  })
  const [error, setError] = useState('')
  const [subdomainError, setSubdomainError] = useState('')
  const [subdomainSuccess, setSubdomainSuccess] = useState('')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)

    fetchIntros()
    fetchSubdomainInfo()
  }, [router])

  const fetchSubdomainInfo = async () => {
    try {
      const response = await api.get('/user/subdomain')
      setSubdomainInfo(response.data)
      setSubdomain(response.data.subdomain || '')
    } catch (err) {
      console.error('Error fetching subdomain:', err)
    }
  }

  const handleUpdateSubdomain = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubdomainError('')
    setSubdomainSuccess('')

    try {
      const response = await api.put('/user/subdomain', { subdomain })
      setSubdomainSuccess(response.data.message)
      setSubdomainInfo({
        ...subdomainInfo!,
        subdomain: response.data.subdomain,
        guest_url_preview: response.data.guest_url_preview
      })
      // Update user in localStorage
      const userData = localStorage.getItem('user')
      if (userData) {
        const parsedUser = JSON.parse(userData)
        parsedUser.subdomain = response.data.subdomain
        localStorage.setItem('user', JSON.stringify(parsedUser))
        setUser(parsedUser)
      }
      setTimeout(() => {
        setShowSubdomainModal(false)
        setSubdomainSuccess('')
      }, 1500)
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const error = err as { response?: { data?: { detail?: string } } }
        setSubdomainError(error.response?.data?.detail || 'Không thể cập nhật subdomain')
      } else {
        setSubdomainError('Lỗi kết nối')
      }
    }
  }

  const fetchIntros = async () => {
    try {
      const response = await api.get('/landing-page/intros')
      setIntros(response.data)
    } catch (err) {
      console.error('Error fetching intros:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const handleCreateIntro = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await api.post('/landing-page/intro', formData)
      setShowCreateModal(false)
      setFormData({
        groom_name: '',
        groom_full_name: '',
        bride_name: '',
        bride_full_name: ''
      })
      fetchIntros()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const error = err as { response?: { data?: { detail?: string } } }
        setError(error.response?.data?.detail || 'Failed to create invitation')
      } else {
        setError('Network error')
      }
    }
  }

  const canCreateMore = user && intros.length < user.max_invite

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển</h1>
            <p className="text-sm text-gray-600">Xin chào, {user?.username}</p>
          </div>
          <div className="flex gap-3">
            {user?.role === 'root' && (
              <button
                onClick={() => router.push('/admin/users')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Quản lý người dùng
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Subdomain Info */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold mb-2">🌐 Địa chỉ thiệp cưới của bạn</h3>
              {subdomainInfo?.subdomain ? (
                <>
                  <p className="text-2xl font-bold mb-1">
                    {subdomainInfo.subdomain}.{subdomainInfo.base_domain}
                  </p>
                  <p className="text-sm opacity-80">
                    Link mẫu: {subdomainInfo.guest_url_preview?.replace('{guest_id}', 'abc123')}
                  </p>
                </>
              ) : (
                <p className="text-lg opacity-90">
                  Chưa thiết lập subdomain. Hãy thiết lập để có link thiệp đẹp hơn!
                </p>
              )}
            </div>
            <button
              onClick={() => setShowSubdomainModal(true)}
              className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              {subdomainInfo?.subdomain ? 'Đổi subdomain' : 'Thiết lập'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Tổng số thiệp mời</h3>
            <p className="text-3xl font-bold text-gray-900">{intros.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Giới hạn tối đa</h3>
            <p className="text-3xl font-bold text-gray-900">{user?.max_invite}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Còn lại</h3>
            <p className="text-3xl font-bold text-green-600">{(user?.max_invite || 0) - intros.length}</p>
          </div>
        </div>

        {/* Invitations List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Thiệp cưới của tôi</h2>
            {canCreateMore && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Tạo mới
              </motion.button>
            )}
          </div>

          {intros.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-600 mb-4">Bạn chưa tạo thiệp mời nào.</p>
              {canCreateMore && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Tạo thiệp mời đầu tiên
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {intros.map((intro) => (
                <div key={intro.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {intro.groom_name} & {intro.bride_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {intro.groom_full_name} - {intro.bride_full_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Đã tạo: {new Date(intro.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/preview/${intro.id}`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Xem trước
                      </button>
                      <button
                        onClick={() => router.push(`/edit/${intro.id}`)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Chỉnh sửa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Tạo thiệp cưới mới
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateIntro} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên Chú Rể (Ngắn gọn)
                </label>
                <input
                  type="text"
                  value={formData.groom_name}
                  onChange={(e) => setFormData({ ...formData, groom_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="VD: Thế Tài"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ tên Chú Rể
                </label>
                <input
                  type="text"
                  value={formData.groom_full_name}
                  onChange={(e) => setFormData({ ...formData, groom_full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="VD: Võ Nhân Thành Đại"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên Cô Dâu (Ngắn gọn)
                </label>
                <input
                  type="text"
                  value={formData.bride_name}
                  onChange={(e) => setFormData({ ...formData, bride_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="VD: Phạm Huyền"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ tên Cô Dâu
                </label>
                <input
                  type="text"
                  value={formData.bride_full_name}
                  onChange={(e) => setFormData({ ...formData, bride_full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="VD: Lữu Hải Đường Phạm"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Tạo
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Subdomain Modal */}
      {showSubdomainModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <h2 className="text-2xl font-bold mb-2 text-gray-900">
              Thiết lập Subdomain
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Subdomain sẽ tạo link thiệp dạng: <span className="font-mono bg-gray-100 px-1 rounded">{subdomain || 'ten-cua-ban'}.{subdomainInfo?.base_domain}</span>
            </p>

            {subdomainError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {subdomainError}
              </div>
            )}

            {subdomainSuccess && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {subdomainSuccess}
              </div>
            )}

            <form onSubmit={handleUpdateSubdomain} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subdomain
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="ten-cua-ban"
                    required
                    minLength={3}
                    maxLength={50}
                  />
                  <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-600">
                    .{subdomainInfo?.base_domain}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Chỉ dùng chữ thường, số và dấu gạch ngang. VD: nguyen-van-a, wedding-2025
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSubdomainModal(false)
                    setSubdomainError('')
                    setSubdomainSuccess('')
                    setSubdomain(subdomainInfo?.subdomain || '')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
