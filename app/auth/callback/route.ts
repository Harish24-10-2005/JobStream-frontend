import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

/**
 * Auth callback handler for Supabase magic link + password reset redirects.
 *
 * When using PKCE flow, Supabase redirects back with a `code` query param.
 * This route exchanges that code for a session (setting cookies), then
 * redirects the user to the app.
 *
 * For password resets, the `next` query param tells us where to redirect
 * after the code exchange (e.g. /auth/reset-password).
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createSupabaseServerClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            // Successful code exchange — redirect to the intended page
            return NextResponse.redirect(`${origin}${next}`)
        }
        console.error('[auth/callback] Code exchange failed:', error.message)
    }

    // If something went wrong, redirect to home with an error indicator
    return NextResponse.redirect(`${origin}/?auth_error=callback_failed`)
}
