/** Type-safe useTranslations() keys, checked against en.json's shape (the
 *  canonical structure — es.json must match it exactly, key for key). */
type Messages = typeof import('../../messages/en.json');

declare interface IntlMessages extends Messages {}
