/**
 * /api/locale — sets the NEXT_LOCALE cookie the language switcher writes to.
 * No auth required (language preference isn't sensitive, and the login/
 * marketing pages should be switchable too); a persistent cookie so it
 * survives across sessions like the rest of the app's local preferences.
 */
import { NextRequest, NextResponse } from 'next/server';
import { isSupportedLocale } from '@/i18n/locales';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { locale?: string } | null;
  const locale = body?.locale;
  if (!isSupportedLocale(locale)) {
    return NextResponse.json({ error: 'unsupported_locale' }, { status: 400 });
  }

  const response = NextResponse.json({ locale });
  response.cookies.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  return response;
}
