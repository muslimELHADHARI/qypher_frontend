import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    const res = NextResponse.json({ ok: true })
    const cookieOptions = ['session=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0']
    if (process.env.NODE_ENV === 'production') cookieOptions.push('Secure')
    res.headers.set('Set-Cookie', cookieOptions.join('; '))
    return res
}

export async function GET() {
    const res = NextResponse.redirect(new URL('/login', '/'))
    const cookieOptions = ['session=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0']
    if (process.env.NODE_ENV === 'production') cookieOptions.push('Secure')
    res.headers.set('Set-Cookie', cookieOptions.join('; '))
    return res
}
