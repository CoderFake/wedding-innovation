'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { getImageUrl } from '@/lib/config'
import Image from 'next/image'

// Family Section Edit Modal
export function FamilyEditModal({ onClose, onSave }: { onClose: () => void, onSave?: () => void }) {
  const [formData, setFormData] = useState({
    groom_father_name: '',
    groom_mother_name: '',
    groom_address: '',
    bride_father_name: '',
    bride_mother_name: '',
    bride_address: '',
    session_image_id: '',
    groom_image_id: '',
    bride_image_id: ''
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [groomImageFile, setGroomImageFile] = useState<File | null>(null)
  const [groomImagePreview, setGroomImagePreview] = useState<string>('')
  const [brideImageFile, setBrideImageFile] = useState<File | null>(null)
  const [brideImagePreview, setBrideImagePreview] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFamilyData()
  }, [])

  const fetchFamilyData = async () => {
    try {
      const response = await api.get('/landing-page/family')
      const data = response.data
      setFormData(data)
      if (data.photo_url) {
        setImagePreview(getImageUrl(data.photo_url))
      }
      if (data.groom_image_url) {
        setGroomImagePreview(getImageUrl(data.groom_image_url))
      }
      if (data.bride_image_url) {
        setBrideImagePreview(getImageUrl(data.bride_image_url))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleGroomImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setGroomImageFile(file)
      setGroomImagePreview(URL.createObjectURL(file))
    }
  }

  const handleBrideImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBrideImageFile(file)
      setBrideImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let imageId = formData.session_image_id
      let groomImageId = formData.groom_image_id
      let brideImageId = formData.bride_image_id

      // Upload new main image if selected
      if (imageFile) {
        const formDataImg = new FormData()
        formDataImg.append('file', imageFile)
        const uploadResponse = await api.post('/landing-page/images/upload', formDataImg)
        imageId = uploadResponse.data.id
      }

      // Upload new groom image if selected
      if (groomImageFile) {
        const formDataImg = new FormData()
        formDataImg.append('file', groomImageFile)
        const uploadResponse = await api.post('/landing-page/images/upload', formDataImg)
        groomImageId = uploadResponse.data.id
      }

      // Upload new bride image if selected
      if (brideImageFile) {
        const formDataImg = new FormData()
        formDataImg.append('file', brideImageFile)
        const uploadResponse = await api.post('/landing-page/images/upload', formDataImg)
        brideImageId = uploadResponse.data.id
      }

      const saveData = {
        ...formData,
        session_image_id: imageId || null,
        groom_image_id: groomImageId || null,
        bride_image_id: brideImageId || null
      }

      await api.post('/landing-page/family', saveData)

      onSave?.()
      onClose()
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalWrapper onClose={onClose} title="Chỉnh sửa thông tin Gia đình">
      {loading ? (
        <div className="py-8 text-center text-gray-600">Đang tải...</div>
      ) : (
        <div className="space-y-6">
          {/* Groom's Family */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nhà Trai</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Tên Bố"
                value={formData.groom_father_name}
                onChange={(e) => setFormData({ ...formData, groom_father_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                placeholder="Tên Mẹ"
                value={formData.groom_mother_name}
                onChange={(e) => setFormData({ ...formData, groom_mother_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <textarea
                placeholder="Địa chỉ"
                value={formData.groom_address}
                onChange={(e) => setFormData({ ...formData, groom_address: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              
              {/* Groom Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ảnh Chú Rể (hiển thị bên trái)
                </label>
                {groomImagePreview && (
                  <div className="mb-4 w-32 h-44 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300 flex items-center justify-center">
                    <img src={groomImagePreview} alt="Groom Preview" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleGroomImageChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Bride's Family */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nhà Gái</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Tên Bố"
                value={formData.bride_father_name}
                onChange={(e) => setFormData({ ...formData, bride_father_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                placeholder="Tên Mẹ"
                value={formData.bride_mother_name}
                onChange={(e) => setFormData({ ...formData, bride_mother_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <textarea
                placeholder="Địa chỉ"
                value={formData.bride_address}
                onChange={(e) => setFormData({ ...formData, bride_address: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              
              {/* Bride Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ảnh Cô Dâu (hiển thị bên phải)
                </label>
                {brideImagePreview && (
                  <div className="mb-4 w-32 h-44 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300 flex items-center justify-center">
                    <img src={brideImagePreview} alt="Bride Preview" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBrideImageChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Main Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ảnh Chính (giữa)
            </label>
            {imagePreview && (
              <div className="mb-4 w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <img src={imagePreview} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
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
    </ModalWrapper>
  )
}

// Date & Time Edit Modal
export function DateEditModal({ onClose, onSave }: { onClose: () => void, onSave?: () => void }) {
  const [formData, setFormData] = useState({
    lunar_day: '',
    calendar_day: '',
    event_time: '',
    venue_address: '',
    map_iframe: ''
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDateData()
  }, [])

  const fetchDateData = async () => {
    try {
      const response = await api.get('/landing-page/date-organization')
      const data = response.data
      setFormData({
        lunar_day: data.lunar_day || '',
        calendar_day: data.calendar_day || '',
        event_time: data.event_time || '',
        venue_address: data.venue_address || '',
        map_iframe: data.map_iframe || ''
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.post('/landing-page/date-organization', formData)
      onSave?.()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // Extract src from iframe string
  const extractIframeSrc = (iframe: string): string | null => {
    const match = iframe.match(/src=["']([^"']+)["']/)
    return match ? match[1] : null
  }

  return (
    <ModalWrapper onClose={onClose} title="Chỉnh sửa Ngày & Địa điểm">
      {loading ? (
        <div className="py-8 text-center text-gray-600">Đang tải...</div>
      ) : (
        <div className="space-y-6">
          <input
            type="text"
            placeholder="Ngày Âm lịch (VD: Ngày 18 Tháng 01 Năm Ất Tỵ)"
            value={formData.lunar_day}
            onChange={(e) => setFormData({ ...formData, lunar_day: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="text"
            placeholder="Ngày Dương lịch (VD: 09.01.2025)"
            value={formData.calendar_day}
            onChange={(e) => setFormData({ ...formData, calendar_day: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="text"
            placeholder="Giờ (VD: 10:00:00)"
            value={formData.event_time}
            onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />

          {/* Venue Address Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ nơi tổ chức
            </label>
            <textarea
              placeholder="Xóm X, thôn ABC&#10;Xã XYZ - Huyện ABC - Tỉnh XYZ"
              value={formData.venue_address}
              onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Nhập mỗi dòng cho một phần địa chỉ (xuống dòng để tách)
            </p>
          </div>

          {/* Map Iframe Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã nhúng Google Maps (dán mã iframe)
            </label>
            <textarea
              placeholder='<iframe src="https://www.google.com/maps/embed?..." ...></iframe>'
              value={formData.map_iframe}
              onChange={(e) => setFormData({ ...formData, map_iframe: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lấy mã iframe từ Google Maps: Mở Google Maps → Chọn địa điểm → Chia sẻ → Nhúng bản đồ → Copy mã iframe
            </p>
          </div>

          {/* Map Preview */}
          {formData.map_iframe && extractIframeSrc(formData.map_iframe) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Xem trước</label>
              <div className="w-full h-48 rounded-lg overflow-hidden border border-gray-300">
                <iframe
                  src={extractIframeSrc(formData.map_iframe) || ''}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          )}

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
    </ModalWrapper>
  )
}

// Footer Edit Modal
export function FooterEditModal({ onClose, onSave }: { onClose: () => void, onSave?: () => void }) {
  const [formData, setFormData] = useState({
    thank_you_text: '',
    closing_message: '',
    session_image_id: ''
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFooterData()
  }, [])

  const fetchFooterData = async () => {
    try {
      const response = await api.get('/landing-page/footer')
      const data = response.data
      setFormData(data)
      if (data.photo_url) {
        setImagePreview(getImageUrl(data.photo_url))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let imageId = formData.session_image_id

      if (imageFile) {
        const formDataImg = new FormData()
        formDataImg.append('file', imageFile)

        const uploadResponse = await api.post('/landing-page/images/upload', formDataImg)
        imageId = uploadResponse.data.id
      }

      await api.post('/landing-page/footer', {
        ...formData,
        session_image_id: imageId
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
    <ModalWrapper onClose={onClose} title="Chỉnh sửa thông tin Footer">
      {loading ? (
        <div className="py-8 text-center text-gray-600">Đang tải...</div>
      ) : (
        <div className="space-y-6">
          <textarea
            placeholder="Lời cảm ơn"
            value={formData.thank_you_text}
            onChange={(e) => setFormData({ ...formData, thank_you_text: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
          <textarea
            placeholder="Lời kết (tùy chọn)"
            value={formData.closing_message}
            onChange={(e) => setFormData({ ...formData, closing_message: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ảnh Footer
            </label>
            {imagePreview && (
              <div className="mb-4 w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <img src={imagePreview} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
          </div>

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
    </ModalWrapper>
  )
}

// Modal Wrapper Component
function ModalWrapper({ children, onClose, title }: { children: React.ReactNode, onClose: () => void, title: string }) {
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
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}
