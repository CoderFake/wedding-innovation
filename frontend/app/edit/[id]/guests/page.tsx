'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { config } from '@/lib/config'

interface Guest {
  id: string
  name: string
  user_relationship: string
  confirm: boolean
  guest_url?: string
  created_at?: string
}

interface GuestStats {
  total_guests: number
  confirmed: number
  pending: number
  max_guests: number
}

export default function GuestsManagementPage() {
  const router = useRouter()
  const params = useParams()
  const introId = params.id as string

  const [guests, setGuests] = useState<Guest[]>([])
  const [stats, setStats] = useState<GuestStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [copiedGuestId, setCopiedGuestId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const pageSize = 20

  useEffect(() => {
    fetchGuests()
    fetchStats()
  }, [currentPage])

  const fetchGuests = async () => {
    try {
      const response = await api.get(
        `/landing-page/guests?intro_id=${introId}&page=${currentPage}&page_size=${pageSize}`
      )
      const data = response.data
      setGuests(data.items)
      setTotalPages(data.pages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get(`/landing-page/guests/stats?intro_id=${introId}`)
      const data = response.data
      setStats(data)
    } catch (err) {
      console.error(err)
    }
  }

  const createGuest = async (guestData: Partial<Guest>) => {
    try {
      await api.post('/landing-page/guests', {
        intro_id: introId,
        ...guestData
      })
      fetchGuests()
      fetchStats()
      setShowCreateModal(false)
    } catch (err) {
      console.error(err)
    }
  }

  const updateGuest = async (guestId: string, guestData: Partial<Guest>) => {
    try {
      await api.put(`/landing-page/guests/${guestId}`, guestData)
      fetchGuests()
      fetchStats()
      setEditingGuest(null)
    } catch (err) {
      console.error(err)
    }
  }

  const deleteGuest = async (guestId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa khách mời này không?')) return

    try {
      await api.delete(`/landing-page/guests/${guestId}`)
      fetchGuests()
      fetchStats()
      setErrorMessage(null)
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Xóa khách mời thất bại'
      setErrorMessage(message)
      setTimeout(() => setErrorMessage(null), 3000)
    }
  }

  const isFirstGuest = (index: number) => {
    return currentPage === 1 && index === 0
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
            >
              ← Quay lại
            </button>
            <h1 className="text-4xl font-bold text-gray-900">Quản lý Khách mời</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!!(stats && stats.total_guests >= stats.max_guests)}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              stats && stats.total_guests >= stats.max_guests
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            + Thêm khách
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Tổng khách mời</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total_guests}</p>
              <p className="text-xs text-gray-500 mt-1">Tối đa: {stats.max_guests}</p>
            </div>
            <div className="bg-blue-50 rounded-lg shadow p-4">
              <p className="text-sm text-blue-600">Còn lại</p>
              <p className={`text-3xl font-bold ${stats.max_guests - stats.total_guests <= 50 ? 'text-red-600' : 'text-blue-700'}`}>
                {stats.max_guests - stats.total_guests}
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${stats.total_guests >= stats.max_guests ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(100, (stats.total_guests / stats.max_guests) * 100)}%` }}
                />
              </div>
            </div>
            <div className="bg-green-50 rounded-lg shadow p-4">
              <p className="text-sm text-green-600">Đã xác nhận</p>
              <p className="text-3xl font-bold text-green-700">{stats.confirmed}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow p-4">
              <p className="text-sm text-yellow-600">Chờ xác nhận</p>
              <p className="text-3xl font-bold text-yellow-700">{stats.pending}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-600">Đang tải...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mối quan hệ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Link mời</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {guests.map((guest, index) => (
                    <motion.tr
                      key={guest.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {guest.name}
                        {isFirstGuest(index) && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                            Demo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {guest.user_relationship || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          guest.confirm 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {guest.confirm ? 'Đã xác nhận' : 'Chờ xác nhận'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            if (guest.guest_url) {
                              navigator.clipboard.writeText(guest.guest_url)
                              setCopiedGuestId(guest.id)
                              setTimeout(() => setCopiedGuestId(null), 2000)
                            }
                          }}
                          disabled={!guest.guest_url}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            copiedGuestId === guest.id
                              ? 'bg-green-100 text-green-700'
                              : guest.guest_url 
                                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {copiedGuestId === guest.id ? '✓ Đã sao chép!' : '📋 Sao chép link'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setEditingGuest(guest)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          Sửa
                        </button>
                        {!isFirstGuest(index) && (
                          <button
                            onClick={() => deleteGuest(guest.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Xóa
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50"
                >
                  Trước
                </button>
                <span className="text-sm text-gray-600">
                  Trang {currentPage} trên {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <GuestModal
            onClose={() => setShowCreateModal(false)}
            onSave={createGuest}
          />
        )}

        {/* Edit Modal */}
        {editingGuest && (
          <GuestModal
            guest={editingGuest}
            onClose={() => setEditingGuest(null)}
            onSave={(data) => updateGuest(editingGuest.id, data)}
          />
        )}
      </div>
    </div>
  )
}

function GuestModal({
  guest,
  onClose,
  onSave
}: {
  guest?: Guest
  onClose: () => void
  onSave: (data: Partial<Guest>) => void
}) {
  // Danh sách các mối quan hệ
  const RELATIONSHIPS = [
    { value: '', label: '-- Chọn mối quan hệ --' },
    { value: 'Ông', label: 'Ông' },
    { value: 'Bà', label: 'Bà' },
    { value: 'Bố', label: 'Bố' },
    { value: 'Mẹ', label: 'Mẹ' },
    { value: 'Bác', label: 'Bác' },
    { value: 'Chú', label: 'Chú' },
    { value: 'Cô', label: 'Cô' },
    { value: 'Dì', label: 'Dì' },
    { value: 'Cậu', label: 'Cậu' },
    { value: 'Mợ', label: 'Mợ' },
    { value: 'Anh', label: 'Anh' },
    { value: 'Chị', label: 'Chị' },
    { value: 'Em', label: 'Em' },
    { value: 'Bạn', label: 'Bạn' },
    { value: 'Anh/Chị', label: 'Anh/Chị' },
    { value: 'Đồng nghiệp', label: 'Đồng nghiệp' },
    { value: 'Quý khách', label: 'Quý khách' },
  ]

  // Parse existing data - tách relationship và tên
  const parseGuestName = (fullName: string, relationship: string) => {
    // Nếu đã có relationship riêng, trả về tên gốc
    if (relationship) {
      // Kiểm tra xem tên có bắt đầu bằng relationship không
      for (const rel of RELATIONSHIPS) {
        if (rel.value && fullName.toLowerCase().startsWith(rel.value.toLowerCase() + ' ')) {
          return fullName.substring(rel.value.length + 1)
        }
      }
    }
    return fullName
  }

  const [formData, setFormData] = useState({
    name: parseGuestName(guest?.name || '', guest?.user_relationship || ''),
    relationship: guest?.user_relationship || '',
    confirm: guest?.confirm || false
  })

  // Preview tên đầy đủ
  const getFullDisplayName = () => {
    if (formData.relationship && formData.name.trim()) {
      return `${formData.relationship} ${formData.name.trim()}`
    }
    return formData.name.trim()
  }

  const handleSave = () => {
    const fullName = getFullDisplayName()
    onSave({
      name: fullName,
      user_relationship: formData.relationship,
      confirm: formData.confirm
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">
          {guest ? 'Sửa khách mời' : 'Thêm khách mời'}
        </h2>

        <div className="space-y-4">
          {/* Dropdown Relationship */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Xưng hô</label>
            <select
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
            >
              {RELATIONSHIPS.map(rel => (
                <option key={rel.value} value={rel.value}>{rel.label}</option>
              ))}
            </select>
          </div>

          {/* Tên */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tên khách mời *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nhập tên (VD: Minh, Hùng, ...)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          {/* Preview */}
          {formData.name.trim() && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-600 mb-1">Sẽ hiển thị:</p>
              <p className="text-lg font-semibold text-purple-800">
                Kính mời: <span className="text-purple-900">{getFullDisplayName()}</span>
              </p>
            </div>
          )}

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.confirm}
                onChange={(e) => setFormData({ ...formData, confirm: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Đã xác nhận tham dự</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={!formData.name.trim()}
              className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              Lưu
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
