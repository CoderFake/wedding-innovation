const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:18600/api/v1'

export const config = {
  apiUrl,
  // Base URL for static files (images uploaded to backend) - derived from API URL
  staticUrl: apiUrl.replace('/api/v1', ''),
}

// Helper function to get full image URL
export function getImageUrl(path: string | null | undefined): string {
  if (!path) return ''
  // If already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  // If relative path, prepend static URL
  return `${config.staticUrl}${path}`
}

// System subdomains that should not be treated as wedding subdomains
const SYSTEM_SUBDOMAINS = ['www', 'api', 'admin', 'mail', 'ftp', 'cpanel']

/**
 * Get user subdomain from current URL
 * Examples:
 * - nguyen-van-a.hoangdieuit.io.vn -> "nguyen-van-a"
 * - hoangdieuit.io.vn -> null (no subdomain)
 * - localhost -> null (check localStorage for dev)
 */
export function getSubdomainFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  
  const hostname = window.location.hostname
  
  // Localhost - check localStorage for development testing
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return localStorage.getItem('wedding_subdomain') || null
  }
  
  const parts = hostname.split('.')
  
  // For domain like nguyen-van-a.hoangdieuit.io.vn (4 parts)
  // Base domain hoangdieuit.io.vn has 3 parts
  if (parts.length >= 4) {
    const subdomain = parts[0].toLowerCase()
    
    // Skip system subdomains
    if (!SYSTEM_SUBDOMAINS.includes(subdomain)) {
      return subdomain
    }
  }
  
  return null
}

/**
 * Check if current page is a wedding subdomain page
 */
export function isWeddingSubdomain(): boolean {
  return getSubdomainFromUrl() !== null
}

// Helper function to fetch public wedding data with subdomain support
// Usage: publicFetch(guestId, 'intro') or publicFetch(guestId) for main data
// Options: { method: 'POST' } for confirm endpoint
export async function publicFetch(
  guestId: string, 
  endpoint?: string, 
  options: RequestInit = {}
): Promise<any> {
  const subdomain = getSubdomainFromUrl()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  
  if (subdomain) {
    headers['X-Subdomain'] = subdomain
  }
  
  // Build URL based on subdomain presence
  const basePath = subdomain ? 'by-subdomain' : 'public'
  const path = endpoint ? `/${endpoint}` : ''
  const url = `${config.apiUrl}/landing-page/${basePath}/${guestId}${path}`
  
  const response = await fetch(url, {
    ...options,
    headers,
  })
  
  if (!response.ok) {
    return null
  }
  
  return response.json()
}
