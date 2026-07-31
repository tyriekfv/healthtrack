'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { SUPPORTED_LOCALES, LOCALE_LABELS, type Locale } from '@/i18n/locales';

/**
 * Same pattern as the Imperial/Metric toggle in ProfileForm: two buttons,
 * active one highlighted. Sets the NEXT_LOCALE cookie server-side, then
 * router.refresh() so the server-rendered layout (which reads the cookie)
 * and every server component re-render with the new locale immediately —
 * no full page reload needed.
 */
export default function LanguageSwitcher() {
  const t = useTranslations('settings');
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(next: Locale) {
    if (next === locale) return;
    setError(null);
    try {
      const res = await fetch('/api/locale', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ locale: next }),
      });
      if (!res.ok) throw new Error('Failed to set language');
      startTransition(() => router.refresh());
    } catch {
      setError('Failed to change language');
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
        {t('languageDescription')}
      </p>
      <div className="flex gap-2">
        {SUPPORTED_LOCALES.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => handleSelect(loc)}
            disabled={pending}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
            style={{
              backgroundColor: locale === loc ? 'var(--color-sage)' : 'var(--bg-primary)',
              color: locale === loc ? 'var(--color-bark)' : 'var(--color-text-muted)',
              border: locale === loc ? 'none' : '1px solid var(--border-card)',
            }}
          >
            {LOCALE_LABELS[loc]}
          </button>
        ))}
      </div>
      {error && (
        <p className="text-xs" style={{ color: 'var(--color-terracotta)' }}>{error}</p>
      )}
    </div>
  );
}
