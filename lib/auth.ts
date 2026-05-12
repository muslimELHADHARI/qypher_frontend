import jwt from 'jsonwebtoken'

const SECRET = process.env.AUTH_SECRET || 'replace_this_in_production'
const COOKIE_NAME = 'session'

export type SessionPayload = { username: string }

export async function signSession(payload: SessionPayload) {
    return jwt.sign({ ...payload }, SECRET, { expiresIn: '1h' })
}

export function verifySession(token: string): SessionPayload | null {
    try {
        const decoded = jwt.verify(token, SECRET) as any
        return { username: decoded.username }
    } catch (e) {
        return null
    }
}

export function getTokenFromCookie(cookieHeader: string | null): string | null {
    if (!cookieHeader) return null
    const cookies = cookieHeader.split(';').map(c => c.trim())
    for (const c of cookies) {
        if (c.startsWith(COOKIE_NAME + '=')) return c.slice((COOKIE_NAME + '=').length)
    }
    return null
}

export function requireAuthServer(token: string | null) {
    const session = token ? verifySession(token) : null
    if (!session) throw new Error('Unauthenticated')
    return session
}
