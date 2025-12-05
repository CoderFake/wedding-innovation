'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { config } from '@/lib/config'

interface User {
  id: number
  username: string
  role: 'root' | 'user'
  is_active: boolean
  max_invite: number
  created_at: string
}

export default function UsersManagementPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    checkAuth()
    fetchUsers()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await api.get('/auth/me')
      const user = response.data
      if (user.role !== 'root') {
        router.push('/dashboard')
        return
      }
      setCurrentUser(user)
    } catch (err: unknown) {
      console.error(err)
      router.push('/login')
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users')
      const data = response.data
      setUsers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const createUser = async (userData: Partial<User> & { password: string }) => {
    try {
      await api.post('/auth/users', userData)
      fetchUsers()
      setShowCreateModal(false)
    } catch (err: unknown) {
      console.error(err)
      if (err && typeof err === 'object' && 'response' in err) {
        const error = err as { response?: { data?: { detail?: string } } }
        alert(error.response?.data?.detail || 'Tạo người dùng thất bại')
      } else {
        alert('Tạo người dùng thất bại')
      }
    }
  }

  const updateUser = async (userId: number, userData: Partial<User>) => {
    try {
      await api.put(`/auth/users/${userId}`, userData)
      fetchUsers()
      setEditingUser(null)
    } catch (err: unknown) {
      console.error(err)
      if (err && typeof err === 'object' && 'response' in err) {
        const error = err as { response?: { data?: { detail?: string } } }
        alert(error.response?.data?.detail || 'Cập nhật người dùng thất bại')
      } else {
        alert('Cập nhật người dùng thất bại')
      }
    }
  }

  const deleteUser = async (userId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này không? Tất cả dữ liệu của họ sẽ bị xóa.')) return

    try {
      await api.delete(`/auth/users/${userId}`)
      fetchUsers()
    } catch (err: unknown) {
      console.error(err)
      if (err && typeof err === 'object' && 'response' in err) {
        const error = err as { response?: { data?: { detail?: string } } }
        alert(error.response?.data?.detail || 'Xóa người dùng thất bại')
      } else {
        alert('Xóa người dùng thất bại')
      }
    }
  }

  const getRoleBadgeColor = (role: string) => {
    return role === 'root' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
            >
              ← Quay lại Bảng điều khiển
            </button>
            <h1 className="text-4xl font-bold text-gray-900">Quản lý người dùng</h1>
            <p className="text-gray-600 mt-2">Chỉ dành cho Admin - Quản lý tất cả người dùng và quyền hạn</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
          >
            + Tạo người dùng
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Tổng số người dùng</p>
            <p className="text-3xl font-bold text-gray-900">{users.length}</p>
          </div>
          <div className="bg-purple-50 rounded-lg shadow p-4">
            <p className="text-sm text-purple-600">Admin</p>
            <p className="text-3xl font-bold text-purple-700">
              {users.filter(u => u.role === 'root').length}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <p className="text-sm text-green-600">Người dùng hoạt động</p>
            <p className="text-3xl font-bold text-green-700">
              {users.filter(u => u.is_active).length}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <p className="text-sm text-blue-600">Người dùng thường</p>
            <p className="text-3xl font-bold text-blue-700">
              {users.filter(u => u.role === 'user').length}
            </p>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-600">Đang tải...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên đăng nhập</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vai trò</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số thiệp tối đa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        #{user.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.username}
                        {currentUser?.id === user.id && (
                          <span className="ml-2 text-xs text-purple-600">(Bạn)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.is_active)}`}>
                          {user.is_active ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.max_invite}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                          disabled={currentUser?.id === user.id}
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="text-red-600 hover:text-red-800"
                          disabled={currentUser?.id === user.id}
                        >
                          Xóa
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <UserModal
            onClose={() => setShowCreateModal(false)}
            onSave={createUser}
            isCreate
          />
        )}

        {/* Edit Modal */}
        {editingUser && (
          <UserModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSave={(data) => updateUser(editingUser.id, data)}
          />
        )}
      </div>
    </div>
  )
}

function UserModal({
  user,
  onClose,
  onSave,
  isCreate = false
}: {
  user?: User
  onClose: () => void
  onSave: (data: any) => void
  isCreate?: boolean
}) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    password: '',
    role: user?.role || 'user',
    is_active: user?.is_active ?? true,
    max_invite: user?.max_invite || 1
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">
          {isCreate ? 'Tạo người dùng' : 'Sửa người dùng'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tên đăng nhập *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
              disabled={!isCreate}
            />
          </div>

          {isCreate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
                minLength={6}
              />
            </div>
          )}

          {!isCreate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu mới (để trống nếu không đổi)
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                minLength={6}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vai trò</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'root' | 'user' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="user">Người dùng</option>
              <option value="root">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Số thiệp tối đa</label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.max_invite}
              onChange={(e) => setFormData({ ...formData, max_invite: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Số lượng thiệp cưới tối đa người dùng này có thể tạo</p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Hoạt động (người dùng có thể đăng nhập)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => onSave(formData)}
              className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              {isCreate ? 'Tạo' : 'Lưu'}
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
