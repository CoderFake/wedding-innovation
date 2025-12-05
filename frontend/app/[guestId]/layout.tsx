import { Metadata } from 'next'
import { config, getImageUrl } from '@/lib/config'

interface Props {
  params: Promise<{ guestId: string }>
  children: React.ReactNode
}

// Default OG image - use public URL
const DEFAULT_OG_IMAGE = '/img/og-wedding.png'

async function getWeddingData(guestId: string) {
  try {
    const [mainResponse, headerResponse] = await Promise.all([
      fetch(`${config.apiUrl}/landing-page/public/${guestId}`, { cache: 'no-store' }),
      fetch(`${config.apiUrl}/landing-page/public/${guestId}/header`, { cache: 'no-store' })
    ])
    
    if (!mainResponse.ok) return null
    
    const mainData = await mainResponse.json()
    const headerData = headerResponse.ok ? await headerResponse.json() : null
    
    return { ...mainData, header_detail: headerData }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const data = await getWeddingData(resolvedParams.guestId)
  
  // Get base URL for absolute paths
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://demo-wedding.hoangdieuit.io.vn'
  
  if (!data) {
    return {
      title: 'Thiệp mời cưới',
      description: 'Thiệp mời đám cưới trực tuyến',
      openGraph: {
        title: 'Thiệp mời cưới',
        description: 'Thiệp mời đám cưới trực tuyến',
        type: 'website',
        images: [
          {
            url: `${baseUrl}${DEFAULT_OG_IMAGE}`,
            width: 1200,
            height: 630,
            alt: 'Thiệp mời cưới',
          }
        ],
      },
    }
  }

  const { intro, header_detail } = data
  const title = `Thiệp mời cưới của ${intro.groom_name} & ${intro.bride_name}`
  const description = `Trân trọng kính mời bạn đến dự lễ cưới của ${intro.groom_full_name} và ${intro.bride_full_name}`
  
  // Get header image URL for preview - must be absolute URL
  let ogImage = `${baseUrl}${DEFAULT_OG_IMAGE}`
  if (header_detail?.photo_url) {
    const imageUrl = getImageUrl(header_detail.photo_url)
    // Ensure absolute URL
    if (imageUrl.startsWith('http')) {
      ogImage = imageUrl
    }
  }

  return {
    title,
    description,
    icons: {
      icon: '/wedding-letter.svg',
    },
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default function GuestLayout({ children }: Props) {
  return <>{children}</>
}
