/**
 * next-intl request config — "without i18n routing" mode (see next-intl
 * docs). Deliberately no [locale] URL segment and no middleware: language is
 * a stored preference (NEXT_LOCALE cookie, same idea as the existing
 * Imperial/Metric unit_system toggle on the profile), not part of the URL.
 * Every existing route/link stays exactly as it is.
 */
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, isSupportedLocale } from './locales';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  const locale = isSupportedLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
