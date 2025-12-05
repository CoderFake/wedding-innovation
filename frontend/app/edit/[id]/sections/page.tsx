'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import { config, getImageUrl } from '@/lib/config'
import { FamilyEditModal, DateEditModal, FooterEditModal } from '@/components/SectionEditModals'
import { InviteEditModal as InviteModal } from '@/components/InviteEditModal'

type SectionType = 'header' | 'family' | 'invite' | 'date' | 'footer' | null

export default function EditSectionsPage() {
  const router = useRouter()
  const params = useParams()
  const introId = params.id

  const [activeSection, setActiveSection] = useState<SectionType>(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  const sections = [
    { id: 'header', name: 'Phần đầu trang (Header)', icon: '📷', color: 'blue' },
    { id: 'family', name: 'Thông tin gia đình', icon: '👨‍👩‍👧‍👦', color: 'green' },
    { id: 'invite', name: 'Chi tiết thiệp mời', icon: '💌', color: 'purple' },
    { id: 'date', name: 'Ngày & Giờ', icon: '📅', color: 'red' },
    { id: 'footer', name: 'Lời kết (Footer)', icon: '📝', color: 'yellow' }
  ]

  const managementPages = [
    { id: 'albums', name: 'Quản lý Album', icon: '📸', path: `/edit/${introId}/albums`, color: 'pink' },
    { id: 'guests', name: 'Quản lý Khách mời', icon: '👥', path: `/edit/${introId}/guests`, color: 'indigo' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa các phần thiệp cưới</h1>
              <p className="text-sm text-gray-600 mt-1">Tùy chỉnh thiệp cưới của bạn</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/preview/${introId}`)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Xem trước
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Quay lại
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sections */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">Nội dung</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {sections.map((section) => (
            <motion.div
              key={section.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveSection(section.id as SectionType)}
              className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-500"
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">{section.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{section.name}</h3>
                  <p className="text-sm text-gray-500">Nhấn để chỉnh sửa</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Management Pages */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quản lý</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {managementPages.map((page) => (
            <motion.div
              key={page.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(page.path)}
              className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-500"
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">{page.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{page.name}</h3>
                  <p className="text-sm text-gray-500">Quản lý nội dung</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Section Edit Modals */}
      <AnimatePresence>
        {activeSection === 'header' && <HeaderEditModal onClose={() => setActiveSection(null)} />}
        {activeSection === 'family' && <FamilyEditModal onClose={() => setActiveSection(null)} />}
        {activeSection === 'invite' && <InviteModal onClose={() => setActiveSection(null)} />}
        {activeSection === 'date' && <DateEditModal onClose={() => setActiveSection(null)} />}
        {activeSection === 'footer' && <FooterEditModal onClose={() => setActiveSection(null)} />}
      </AnimatePresence>
    </div>
  )
}

// Header Edit Modal Component
function HeaderEditModal({ onClose }: { onClose: () => void }) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [currentImage, setCurrentImage] = useState<string>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchHeaderData()
  }, [])

  const fetchHeaderData = async () => {
    try {
      const response = await api.get('/landing-page/header')
      const data = response.data
      if (data.photo_url) {
        setCurrentImage(data.photo_url)
      }
    } catch (err) {
      console.error(err)
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
      let imageId = null

      // Upload image if new file selected
      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)

        const uploadResponse = await api.post('/landing-page/images/upload', formData)
        const imageData = uploadResponse.data
        imageId = imageData.id
      }

      // Update header section
      if (imageId) {
        await api.post('/landing-page/header', { session_image_id: imageId })
      }

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
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Chỉnh sửa ảnh bìa</h2>

          <div className="space-y-6">
            {/* Current Image */}
            {currentImage && !imagePreview && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ảnh hiện tại
                </label>
                <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <img src={getImageUrl(currentImage)} alt="Current header" className="max-w-full max-h-full object-contain rounded-lg" />
                </div>
              </div>
            )}

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {imagePreview ? 'Xem trước ảnh mới' : 'Tải ảnh mới'}
              </label>
              {imagePreview && (
                <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
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
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={saving || !imageFile}
              className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Hủy
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
