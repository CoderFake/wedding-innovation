const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:18600/api/v1'

export const config = {
  apiUrl,
  staticUrl: apiUrl.replace('/api/v1', ''),
}

export function getImageUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  return `${config.staticUrl}${path}`
}

const SYSTEM_SUBDOMAINS = ['www', 'api', 'admin', 'mail', 'ftp', 'cpanel']

const ADMIN_ROUTES = ['/login', '/admin', '/dashboard', '/edit', '/preview']

/**
 * Check if current page is an admin/management route
 */
function isAdminRoute(): boolean {
  if (typeof window === 'undefined') return false
  const pathname = window.location.pathname
  return ADMIN_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Get user subdomain from current URL
 * Returns null for admin routes (login, dashboard, etc.) even if on subdomain
 */
export function getSubdomainFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  
  if (isAdminRoute()) {
    return null
  }
  
  const hostname = window.location.hostname
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return localStorage.getItem('wedding_subdomain') || null
  }
  
  const parts = hostname.split('.')
  
  if (parts.length >= 3) {
    const subdomain = parts[0].toLowerCase()
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
