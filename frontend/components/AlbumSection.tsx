'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { config, getImageUrl, publicFetch } from '@/lib/config'

interface AlbumSession {
  id: string
  title: string | null
  order: number
  images: Array<{
    id: string
    image_url: string
    order: number
  }>
}

interface AlbumSectionProps {
  guestId: string
}

function AlbumImageItem({ image, index }: { image: { id: string; image_url: string; order: number }; index: number }) {
  const imageRef = useRef(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)
  
  // Load image to get natural dimensions
  useEffect(() => {
    if (!image.image_url) return
    
    const img = new window.Image()
    img.onload = () => {
      let width = img.naturalWidth
      let height = img.naturalHeight
      
      // Limit aspect ratio to max 9:16 (portrait)
      const maxRatio = 16 / 9
      const currentRatio = height / width
      
      if (currentRatio > maxRatio) {
        // Image is too tall, cap the height
        height = width * maxRatio
      }
      
      setImageDimensions({ width, height })
      setImageLoaded(true)
    }
    img.src = getImageUrl(image.image_url)
  }, [image.image_url])
  
  // Calculate aspect ratio for CSS
  const aspectRatio = imageDimensions 
    ? `${imageDimensions.width} / ${imageDimensions.height}`
    : '4 / 3' // Default fallback
  
  return (
    <motion.div
      ref={imageRef}
      initial={{ 
        opacity: 0, 
        x: index % 2 === 0 ? -50 : 50 
      }}
      whileInView={{ 
        opacity: 1, 
        x: 0 
      }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ 
        duration: 1.5, 
        ease: 'easeOut' 
      }}
      className="relative rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow"
      style={{ aspectRatio }}
    >
      {image.image_url ? (
        <img
          src={getImageUrl(image.image_url)}
          alt={`Album ${index + 1}`}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          style={{ 
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
        />
      ) : (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center" style={{ aspectRatio: '4/3' }}>
          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </motion.div>
  )
}

export default function AlbumSection({ guestId }: AlbumSectionProps) {
  const [albums, setAlbums] = useState<AlbumSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const result = await publicFetch(guestId, 'albums')
        if (!result) throw new Error('Failed to fetch albums')
        setAlbums(result)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAlbums()
  }, [guestId])

  const titleRef = useRef(null)
  const titleInView = useInView(titleRef, { once: true, margin: "-100px" })

  if (loading) {
    return (
      <section className="w-full py-10 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-pulse text-gray-400">Đang tải...</div>
        </div>
      </section>
    )
  }

  // If no albums, show placeholder album with 10 white images
  const displayAlbums = albums.length > 0 ? albums : [{
    id: 'placeholder',
    title: 'Album ảnh',
    order: 0,
    images: Array.from({ length: 10 }, (_, i) => ({
      id: `placeholder-${i}`,
      image_url: '',
      order: i
    }))
  }]

  return (
    <>
      {displayAlbums.map((album) => (
        <section key={album.id} className="w-full py-10 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            {/* Title with decorative line and heart */}
            <motion.div
              ref={titleRef}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8 }}
              className="flex items-center justify-center gap-4 mb-12"
            >
              {/* Title text */}
              <h2 
                className="text-3xl font-bold text-gray-800 whitespace-nowrap tracking-wide"
                style={{ fontFamily: "'Playfair Display', 'Great Vibes', 'Cormorant Garamond', serif", fontWeight: 700 }}
              >
                {album.title || "Album Ảnh"}
              </h2>
              
              {/* Line with heart */}
              <div className="flex items-center flex-1 max-w-xs">
                {/* Short line before heart */}
                <div className="flex-shrink-0 w-8 h-[1px] bg-gray-400"></div>
                
                {/* Heart icon */}
                <svg className="flex-shrink-0 w-4 h-4 text-red-500 mx-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                
                {/* Long line after heart */}
                <div className="flex-1 h-[1px] bg-gray-400"></div>
              </div>
            </motion.div>

            {/* Grid of Images - 2 columns */}
            <div className="grid grid-cols-2 gap-2">
              {album.images
                ?.sort((a, b) => a.order - b.order)
                .map((image, index) => (
                  <AlbumImageItem key={image.id} image={image} index={index} />
                ))}
            </div>
          </div>
        </section>
      ))}
    </>
  )
}
