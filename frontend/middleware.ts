import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SYSTEM_SUBDOMAINS = ['www', 'api', 'admin', 'mail', 'ftp', 'cpanel']

const PUBLIC_ROUTES = ['/login', '/admin', '/dashboard', '/edit', '/preview', '/_next', '/favicon.ico', '/img', '/font', '/music']
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'hoangdieuit.io.vn'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:18600/api/v1'

/**
 * Extract subdomain from hostname
 */
function getSubdomain(hostname: string): string | null {
  const host = hostname.split(':')[0]
  if (host === 'localhost' || host === '127.0.0.1') {
    return null
  }
  
  const parts = host.split('.')
  if (parts.length >= 4) {
    const subdomain = parts[0].toLowerCase()
    
    if (!SYSTEM_SUBDOMAINS.includes(subdomain)) {
      return subdomain
    }
  }
  
  return null
}

/**
 * Check if subdomain exists in database
 */
async function validateSubdomain(subdomain: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/landing-page/by-subdomain`, {
      method: 'GET',
      headers: {
        'X-Subdomain': subdomain,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    })
    
    return response.ok
  } catch (error) {
    console.error('Subdomain validation error:', error)
    return true
  }
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname
  const subdomain = getSubdomain(hostname)
  
  if (!subdomain) {
    return NextResponse.next()
  }
  
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon') ||
      pathname.startsWith('/img') ||
      pathname.startsWith('/font') ||
      pathname.startsWith('/music') ||
      pathname.includes('.')) {
    return NextResponse.next()
  }
  
  const isValid = await validateSubdomain(subdomain)
  
  if (!isValid) {
    return NextResponse.rewrite(new URL('/not-found', request.url))
  }
  
  const response = NextResponse.next()
  response.headers.set('x-subdomain', subdomain)
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
