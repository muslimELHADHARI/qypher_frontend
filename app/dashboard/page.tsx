import { cookies } from 'next/headers'
import { verifySession } from '@/lib/auth'
import React from 'react'

export default async function DashboardPage() {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value || null
    const session = token ? verifySession(token) : null

    if (!session) {
        // This should be unreachable due to middleware, but safeguard server render
        return (
            <div style={{ padding: 24 }}>
                <h1>Unauthorized</h1>
                <p>Please <a href="/login">sign in</a>.</p>
            </div>
        )
    }

    return (
        <div style={{ padding: 24 }}>
            <h1>Dashboard</h1>
            <p>Signed in as <strong>{session.username}</strong></p>
            <p>Welcome to your dashboard.</p>
        </div>
    )
}
