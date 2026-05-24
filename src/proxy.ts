import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { VARIANT_COOKIE, VARIANT_COOKIE_MAX_AGE, parseVariant } from '@/lib/pricing-report/pricing'

export const config = {
  matcher: ['/account/:path*', '/pricing-report/:path*', '/demo'],
}

export function proxy(request: NextRequest) {
  const variant = parseVariant(request.nextUrl.searchParams.get('price'))
  if (variant == null) {
    // No valid ?price — let the request through untouched.
    return NextResponse.next()
  }

  // Strip ONLY the price param (keep e.g. ?demo=1) so the variant never shows in the URL.
  const url = request.nextUrl.clone()
  url.searchParams.delete('price')

  const response = NextResponse.redirect(url) // 307 temporary redirect
  response.cookies.set(VARIANT_COOKIE, String(variant), {
    path: '/',
    maxAge: VARIANT_COOKIE_MAX_AGE,
    sameSite: 'lax',
  })
  return response
}
