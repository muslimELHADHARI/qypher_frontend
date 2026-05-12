import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getTokenFromCookie, verifySession } from './lib/auth'

const PROTECTED_PATHS = ['/dashboard', '/admin', '/api/protected']

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    // Only run for protected paths
    if (!PROTECTED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
        return NextResponse.next()
    }

    const token = getTokenFromCookie(req.headers.get('cookie'))
    const session = token ? verifySession(token) : null
    if (!session) {
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('from', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // allow request
    return NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*', '/admin/:path*', '/api/protected/:path*'],
}
