'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { getImageUrl } from '@/lib/config'
import Image from 'next/image'

interface InviteEditModalProps {
  onClose: () => void
  onSave?: () => void
}

export function InviteEditModal({ onClose, onSave }: InviteEditModalProps) {
  const [formData, setFormData] = useState({
    left_image_id: '',
    center_image_id: '',
    right_image_id: '',
    greeting_text: '',
    attendance_request_text: ''
  })
  
  const [leftImage, setLeftImage] = useState<File | null>(null)
  const [centerImage, setCenterImage] = useState<File | null>(null)
  const [rightImage, setRightImage] = useState<File | null>(null)
  
  const [leftPreview, setLeftPreview] = useState<string>('')
  const [centerPreview, setCenterPreview] = useState<string>('')
  const [rightPreview, setRightPreview] = useState<string>('')
  
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInviteData()
  }, [])

  const fetchInviteData = async () => {
    try {
      const response = await api.get('/landing-page/invite-section')
      const data = response.data
      setFormData(data)
      if (data.left_image_url) setLeftPreview(getImageUrl(data.left_image_url))
      if (data.center_image_url) setCenterPreview(getImageUrl(data.center_image_url))
      if (data.right_image_url) setRightPreview(getImageUrl(data.right_image_url))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (position: 'left' | 'center' | 'right', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const preview = URL.createObjectURL(file)
    
    if (position === 'left') {
      setLeftImage(file)
      setLeftPreview(preview)
    } else if (position === 'center') {
      setCenterImage(file)
      setCenterPreview(preview)
    } else {
      setRightImage(file)
      setRightPreview(preview)
    }
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    const formDataImg = new FormData()
    formDataImg.append('file', file)

    try {
      const response = await api.post('/landing-page/images/upload', formDataImg)
      return response.data.id
    } catch {
      return null
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let leftId = formData.left_image_id
      let centerId = formData.center_image_id
      let rightId = formData.right_image_id

      // Upload new images if selected
      if (leftImage) {
        const id = await uploadImage(leftImage)
        if (id) leftId = id
      }
      if (centerImage) {
        const id = await uploadImage(centerImage)
        if (id) centerId = id
      }
      if (rightImage) {
        const id = await uploadImage(rightImage)
        if (id) rightId = id
      }

      // Save invite section
      await api.post('/landing-page/invite-section', {
        left_image_id: leftId,
        center_image_id: centerId,
        right_image_id: rightId,
        greeting_text: formData.greeting_text,
        attendance_request_text: formData.attendance_request_text
      })

      onSave?.()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Chỉnh sửa phần Thiệp mời</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-8 text-center text-gray-600">Đang tải...</div>
          ) : (
            <div className="space-y-6">
              {/* Three Images Layout */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Ảnh thiệp mời (3 ảnh)
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {/* Left Image */}
                  <div>
                    <p className="text-xs text-gray-600 mb-2">Ảnh trái</p>
                    {leftPreview && (
                      <div className="mb-2 relative w-full h-48">
                        <Image src={leftPreview} alt="Left" fill className="object-cover rounded-lg" unoptimized />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange('left', e)}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>

                  {/* Center Image */}
                  <div>
                    <p className="text-xs text-gray-600 mb-2">Ảnh giữa (Lớn hơn)</p>
                    {centerPreview && (
                      <div className="mb-2 relative w-full h-48">
                        <Image src={centerPreview} alt="Center" fill className="object-cover rounded-lg" unoptimized />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange('center', e)}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>

                  {/* Right Image */}
                  <div>
                    <p className="text-xs text-gray-600 mb-2">Ảnh phải</p>
                    {rightPreview && (
                      <div className="mb-2 relative w-full h-48">
                        <Image src={rightPreview} alt="Right" fill className="object-cover rounded-lg" unoptimized />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange('right', e)}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Text Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lời chào
                </label>
                <textarea
                  placeholder="Nhập lời chào..."
                  value={formData.greeting_text}
                  onChange={(e) => setFormData({ ...formData, greeting_text: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lời nhắn xác nhận tham dự
                </label>
                <textarea
                  placeholder="Nhập lời nhắn..."
                  value={formData.attendance_request_text}
                  onChange={(e) => setFormData({ ...formData, attendance_request_text: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
