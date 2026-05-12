import { NextRequest, NextResponse } from 'next/server'
import PAM from 'authenticate-pam'
import { signSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        if (req.headers.get('content-type') !== 'application/json') {
            return new NextResponse('Invalid content type', { status: 400 })
        }

        const body = await req.json()
        const username = (body.username || '').toString().trim().slice(0, 64)
        const password = (body.password || '').toString()

        if (!username || !password) {
            return new NextResponse(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 })
        }

        // Ensure requests are same-origin to reduce CSRF risk
        const origin = req.headers.get('origin') || req.headers.get('referer') || ''
        if (origin) {
            try {
                const u = new URL(origin)
                if (u.origin !== `${req.nextUrl.protocol}//${req.nextUrl.host}`) {
                    return new NextResponse('Invalid origin', { status: 403 })
                }
            } catch { }
        }

        const pamAuthenticate = () =>
            new Promise<void>((resolve, reject) => {
                PAM.authenticate(username, password, (err: any) => {
                    if (err) return reject(err)
                    resolve()
                })
            })

        try {
            await pamAuthenticate()
        } catch (e) {
            // Do not expose PAM internal errors
            return new NextResponse(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 })
        }

        const token = await signSession({ username })

        const cookieOptions = [
            `session=${token}`,
            `HttpOnly`,
            `Path=/`,
            `SameSite=Strict`,
            `Max-Age=${60 * 60}`,
        ]
        if (process.env.NODE_ENV === 'production') cookieOptions.push('Secure')

        const res = NextResponse.json({ ok: true })
        res.headers.set('Set-Cookie', cookieOptions.join('; '))
        return res
    } catch (err) {
        return new NextResponse(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 })
    }
}
