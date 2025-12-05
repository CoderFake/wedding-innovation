'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { config, getImageUrl } from '@/lib/config'
import Image from 'next/image'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface AlbumImage {
  id: string
  image_url: string
  order: number
}

interface AlbumSession {
  id: string
  title: string
  description?: string
  order: number
  images: AlbumImage[]
}

// Sortable Image Component
function SortableImage({ 
  image, 
  onDelete 
}: { 
  image: AlbumImage
  onDelete: (id: string) => void 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'shadow-2xl scale-105' : ''}`}
    >
      <div 
        {...attributes}
        {...listeners}
        className="relative w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing"
      >
        <Image
          src={getImageUrl(image.image_url)}
          alt=""
          fill
          className="object-contain rounded-lg pointer-events-none"
          unoptimized
        />
        {/* Order badge */}
        <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
          {image.order}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(image.id)
        }}
        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// Album Card with DnD
function AlbumCard({
  session,
  onEdit,
  onDelete,
  onUpload,
  onDeleteImage,
  onReorder,
  uploading,
}: {
  session: AlbumSession
  onEdit: () => void
  onDelete: () => void
  onUpload: (files: FileList) => void
  onDeleteImage: (imageId: string) => void
  onReorder: (sessionId: string, images: AlbumImage[]) => void
  uploading: boolean
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = session.images.findIndex((img) => img.id === active.id)
      const newIndex = session.images.findIndex((img) => img.id === over.id)

      const newImages = arrayMove(session.images, oldIndex, newIndex).map((img, idx) => ({
        ...img,
        order: idx + 1,  // Start from 1
      }))

      onReorder(session.id, newImages)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{session.title}</h2>
          {session.description && (
            <p className="text-gray-600 mt-1">{session.description}</p>
          )}
          <p className="text-sm text-gray-400 mt-1">
            Kéo thả để sắp xếp thứ tự ảnh
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
          >
            Sửa
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
          >
            Xóa
          </button>
        </div>
      </div>

      {/* Image Gallery with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={session.images.map((img) => img.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
            {session.images
              .sort((a, b) => a.order - b.order)
              .map((image) => (
                <SortableImage
                  key={image.id}
                  image={image}
                  onDelete={onDeleteImage}
                />
              ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Upload Button */}
      <label className="block">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && onUpload(e.target.files)}
          className="hidden"
        />
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors">
          {uploading ? (
            <p className="text-gray-600">Đang tải lên...</p>
          ) : (
            <p className="text-gray-600">Nhấn để tải ảnh lên (hoặc kéo thả)</p>
          )}
        </div>
      </label>
    </motion.div>
  )
}

export default function AlbumsManagementPage() {
  const router = useRouter()
  const params = useParams()
  const introId = params.id as string

  const [sessions, setSessions] = useState<AlbumSession[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSession, setEditingSession] = useState<AlbumSession | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await api.get(`/landing-page/album-sessions?intro_id=${introId}`)
      const data = response.data
      setSessions(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const createSession = async (title: string, description: string) => {
    try {
      await api.post('/landing-page/album-sessions', {
        intro_id: introId,
        title,
        description,
        display_order: sessions.length
      })
      fetchSessions()
      setShowCreateModal(false)
    } catch (err) {
      console.error(err)
    }
  }

  const updateSession = async (sessionId: string, title: string, description: string) => {
    try {
      await api.put(`/landing-page/album-sessions/${sessionId}`, { title, description })
      fetchSessions()
      setEditingSession(null)
    } catch (err) {
      console.error(err)
    }
  }

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa album này không?')) return
    
    try {
      await api.delete(`/landing-page/album-sessions/${sessionId}`)
      fetchSessions()
    } catch (err) {
      console.error(err)
    }
  }

  const uploadImages = async (sessionId: string, files: FileList) => {
    setUploadingImages({ ...uploadingImages, [sessionId]: true })
    try {
      for (const file of Array.from(files)) {
        // Upload image file first
        const formData = new FormData()
        formData.append('file', file)
        
        const uploadResponse = await api.post('/landing-page/images/upload', formData)
        const imageData = uploadResponse.data
        
        // Add image to session (backend will auto-assign order)
        await api.post(`/landing-page/album-sessions/${sessionId}/images`, {
          session_image_id: imageData.id
        })
      }
      
      fetchSessions()
    } catch (err) {
      console.error(err)
    } finally {
      setUploadingImages({ ...uploadingImages, [sessionId]: false })
    }
  }

  const deleteImage = async (imageId: string) => {
    if (!confirm('Xóa ảnh này?')) return
    
    try {
      await api.delete(`/landing-page/album-images/${imageId}`)
      fetchSessions()
    } catch (err) {
      console.error(err)
    }
  }

  const reorderImages = async (sessionId: string, images: AlbumImage[]) => {
    // Update locally first for instant feedback
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, images } 
        : session
    ))

    // Save to backend
    try {
      await api.put(`/landing-page/album-sessions/${sessionId}/reorder`, {
        image_orders: images.map(img => ({ id: img.id, order: img.order }))
      })
    } catch (err) {
      console.error(err)
      // Revert on error
      fetchSessions()
    }
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
            <h1 className="text-4xl font-bold text-gray-900">Quản lý Album</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
          >
            + Tạo Album
          </button>
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="text-center py-12 text-gray-600">Đang tải...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            Chưa có album nào. Hãy tạo album đầu tiên!
          </div>
        ) : (
          <div className="space-y-8">
            {sessions.map((session) => (
              <AlbumCard
                key={session.id}
                session={session}
                onEdit={() => setEditingSession(session)}
                onDelete={() => deleteSession(session.id)}
                onUpload={(files) => uploadImages(session.id, files)}
                onDeleteImage={deleteImage}
                onReorder={reorderImages}
                uploading={uploadingImages[session.id] || false}
              />
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <SessionModal
            onClose={() => setShowCreateModal(false)}
            onSave={createSession}
          />
        )}

        {/* Edit Modal */}
        {editingSession && (
          <SessionModal
            session={editingSession}
            onClose={() => setEditingSession(null)}
            onSave={(title, description) => updateSession(editingSession.id, title, description)}
          />
        )}
      </div>
    </div>
  )
}

function SessionModal({
  session,
  onClose,
  onSave
}: {
  session?: AlbumSession
  onClose: () => void
  onSave: (title: string, description: string) => void
}) {
  const [title, setTitle] = useState(session?.title || '')
  const [description, setDescription] = useState(session?.description || '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">
          {session ? 'Sửa Album' : 'Tạo Album'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="VD: Lễ thành hôn"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Mô tả tùy chọn..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => onSave(title, description)}
              className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
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
