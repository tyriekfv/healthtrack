/** Type-safe useTranslations() keys, checked against en.json's shape (the
 *  canonical structure — es.json must match it exactly, key for key). */
import type messages from '../../messages/en.json';

declare module 'next-intl' {
  interface AppConfig {
    Messages: typeof messages;
  }
}
