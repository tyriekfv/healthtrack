'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { noteSchema, type NoteFormValues } from '@/lib/validations';
import type { NoteType } from '@/lib/types';

const NOTE_TYPE_VALUES: NoteType[] = ['general', 'symptom', 'observation'];

function severityLabel(t: ReturnType<typeof useTranslations>, value: number): string {
  switch (value) {
    case 1: return t('severity.1');
    case 2: return t('severity.2');
    case 3: return t('severity.3');
    case 4: return t('severity.4');
    case 5: return t('severity.5');
    default: return String(value);
  }
}

interface NoteEntryProps {
  onSubmit: (data: {
    content: string;
    note_type: NoteType;
    severity: number | null;
    tags: string[];
    recorded_at: string;
  }) => Promise<void>;
}

function toLocalDatetimeString(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function NoteEntry({ onSubmit }: NoteEntryProps) {
  const t = useTranslations('notes');
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      content: '',
      note_type: 'general',
      severity: undefined,
    },
  });

  const [tags, setTags] = React.useState('');
  const [recordedAt, setRecordedAt] = React.useState(
    toLocalDatetimeString(new Date()),
  );

  const noteType = watch('note_type');
  const severity = watch('severity');

  async function handleFormSubmit(data: NoteFormValues) {
    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await onSubmit({
      content: data.content,
      note_type: data.note_type,
      severity: data.note_type === 'symptom' ? (data.severity ?? null) : null,
      tags: parsedTags,
      recorded_at: new Date(recordedAt).toISOString(),
    });

    reset();
    setTags('');
    setRecordedAt(toLocalDatetimeString(new Date()));
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="rounded-xl border p-5 space-y-4"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
      aria-label={t('form.ariaLabel')}
    >
      <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        {t('form.newNote')}
      </h2>

      {/* Type selector pills */}
      <fieldset>
        <legend className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-text-muted)' }}>
          {t('form.typeLabel')}
        </legend>
        <div className="flex gap-2">
          {NOTE_TYPE_VALUES.map((value) => {
            const isActive = noteType === value;
            const activeColors: Record<NoteType, string> = {
              symptom: 'var(--color-terracotta)',
              observation: 'var(--color-sage)',
              general: 'var(--color-text-muted)',
            };
            return (
              <button
                key={value}
                type="button"
                onClick={() => setValue('note_type', value)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer"
                style={{
                  backgroundColor: isActive ? `${activeColors[value]}20` : 'transparent',
                  color: isActive ? activeColors[value] : 'var(--color-text-muted)',
                  border: `1px solid ${isActive ? activeColors[value] : 'var(--border-card)'}`,
                }}
                aria-pressed={isActive}
              >
                {t(`type.${value}`)}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Content textarea */}
      <div>
        <label
          htmlFor="note-content"
          className="text-sm font-medium mb-1 block"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {t('form.contentLabel')}
        </label>
        <textarea
          id="note-content"
          {...register('content')}
          rows={4}
          className="w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: errors.content ? 'var(--color-terracotta)' : 'var(--border-card)',
            color: 'var(--color-text-primary)',
          }}
          placeholder={t('form.contentPlaceholder')}
          aria-invalid={!!errors.content}
          aria-describedby={errors.content ? 'content-error' : undefined}
          maxLength={5000}
        />
        {errors.content && (
          <p id="content-error" className="text-xs mt-1" style={{ color: 'var(--color-terracotta)' }}>
            {errors.content.message}
          </p>
        )}
      </div>

      {/* Severity slider - only for symptom */}
      {noteType === 'symptom' && (
        <div>
          <label
            htmlFor="note-severity"
            className="text-sm font-medium mb-1 block"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {t('severity.label', { value: severity ? `${severity} - ${severityLabel(t, severity)}` : t('severity.notSet') })}
          </label>
          <input
            id="note-severity"
            type="range"
            min={1}
            max={5}
            step={1}
            value={severity ?? 3}
            onChange={(e) => setValue('severity', parseInt(e.target.value, 10))}
            className="w-full accent-current"
            style={{ color: 'var(--color-sage)' }}
            aria-valuemin={1}
            aria-valuemax={5}
            aria-valuenow={severity ?? 3}
            aria-valuetext={severity ? severityLabel(t, severity) : t('severity.notSet')}
          />
          <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            <span>{t('severity.scaleMild')}</span>
            <span>{t('severity.scaleModerate')}</span>
            <span>{t('severity.scaleSevere')}</span>
          </div>
        </div>
      )}

      {/* Tags input */}
      <div>
        <label
          htmlFor="note-tags"
          className="text-sm font-medium mb-1 block"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {t('form.tagsLabel')}
        </label>
        <input
          id="note-tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-card)',
            color: 'var(--color-text-primary)',
          }}
          placeholder={t('form.tagsPlaceholder')}
        />
      </div>

      {/* Timestamp */}
      <div>
        <label
          htmlFor="note-timestamp"
          className="text-sm font-medium mb-1 block"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {t('form.dateTimeLabel')}
        </label>
        <input
          id="note-timestamp"
          type="datetime-local"
          value={recordedAt}
          onChange={(e) => setRecordedAt(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-card)',
            color: 'var(--color-text-primary)',
            colorScheme: 'dark',
          }}
        />
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: 'var(--color-sage)',
          color: 'var(--color-bark)',
        }}
      >
        {isSubmitting ? t('form.adding') : t('form.addNote')}
      </button>
    </form>
  );
}
