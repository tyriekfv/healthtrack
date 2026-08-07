'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { profileSchema } from '@/lib/validations';
import { apiFetch, ApiRequestError } from '@/lib/api/client';
import type { Profile } from '@/lib/types';
import type { UnitSystem } from '@/lib/units';
import { inchesToDisplayHeight, lbsToDisplayWeight, heightToInches, weightToLbs } from '@/lib/units';
import { z } from 'zod';

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const t = useTranslations('settings.profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // Track display values for height/weight separately so we can convert on unit change
  const [heightDisplay, setHeightDisplay] = useState(0);
  const [weightDisplay, setWeightDisplay] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      unit_system: 'imperial',
      height_inches: 0,
      weight_lbs: 0,
    },
  });

  const unitSystem = useWatch({ control, name: 'unit_system' }) as UnitSystem ?? 'imperial';

  useEffect(() => {
    const fetchProfile = async () => {
      let profile: Profile | null = null;
      try {
        profile = await apiFetch<Profile>('/api/profile');
      } catch (err) {
        // 404 = no profile row yet (fresh account) — start with defaults
        if (!(err instanceof ApiRequestError && err.status === 404)) {
          setLoading(false);
          return;
        }
      }

      if (profile) {
        const sys = profile.unit_system ?? 'imperial';
        reset({
          display_name: profile.display_name ?? '',
          date_of_birth: profile.date_of_birth ?? '',
          biological_sex: profile.biological_sex ?? undefined,
          unit_system: sys,
          height_inches: profile.height_inches ?? 0,
          weight_lbs: profile.weight_lbs ?? 0,
        });
        setHeightDisplay(inchesToDisplayHeight(profile.height_inches ?? 0, sys));
        setWeightDisplay(lbsToDisplayWeight(profile.weight_lbs ?? 0, sys));
      }
      setLoading(false);
    };
    fetchProfile();
  }, [reset]);

  // When unit system changes, recalculate display values from the stored DB values
  const handleUnitChange = (newSystem: UnitSystem) => {
    const currentHeightInches = heightToInches(heightDisplay, unitSystem);
    const currentWeightLbs = weightToLbs(weightDisplay, unitSystem);
    setValue('unit_system', newSystem);
    setHeightDisplay(inchesToDisplayHeight(currentHeightInches, newSystem));
    setWeightDisplay(lbsToDisplayWeight(currentWeightLbs, newSystem));
  };

  const onSubmit = async (formData: ProfileFormData) => {
    setSaving(true);
    setMessage(null);

    // Convert display values back to DB units (imperial)
    const heightInches = heightToInches(heightDisplay, unitSystem);
    const weightLbs = weightToLbs(weightDisplay, unitSystem);

    try {
      await apiFetch<Profile>('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          display_name: formData.display_name,
          date_of_birth: formData.date_of_birth,
          biological_sex: formData.biological_sex,
          unit_system: formData.unit_system,
          height_inches: heightInches,
          weight_lbs: weightLbs,
        }),
      });
      setMessage({ type: 'success', text: t('saveSuccess') });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : t('saveError'),
      });
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="h-64 bg-bg-card rounded-xl animate-pulse" />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="display_name" className="block text-sm font-medium text-text-muted mb-1">
          {t('displayNameLabel')}
        </label>
        <input
          id="display_name"
          type="text"
          {...register('display_name')}
          className="w-full px-3 py-2.5 bg-bg-primary border border-border-card rounded-xl text-text-primary focus:outline-none focus:border-accent-green"
        />
        {errors.display_name && (
          <p className="mt-1 text-sm text-accent-red" role="alert">
            {errors.display_name.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="date_of_birth" className="block text-sm font-medium text-text-muted mb-1">
          {t('dateOfBirthLabel')}
        </label>
        <input
          id="date_of_birth"
          type="date"
          {...register('date_of_birth')}
          className="w-full px-3 py-2.5 bg-bg-primary border border-border-card rounded-xl text-text-primary focus:outline-none focus:border-accent-green"
        />
      </div>

      <div>
        <fieldset>
          <legend className="block text-sm font-medium text-text-muted mb-2">{t('biologicalSexLabel')}</legend>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="male" {...register('biological_sex')} className="accent-accent-green" />
              <span className="text-sm">{t('male')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="female" {...register('biological_sex')} className="accent-accent-green" />
              <span className="text-sm">{t('female')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="prefer_not_to_say" {...register('biological_sex')} className="accent-accent-green" />
              <span className="text-sm">{t('preferNotToSay')}</span>
            </label>
          </div>
          {errors.biological_sex && (
            <p className="mt-1 text-sm text-accent-red" role="alert">{errors.biological_sex.message}</p>
          )}
        </fieldset>
      </div>

      {/* Unit system toggle */}
      <div>
        <span className="block text-sm font-medium text-text-muted mb-2">{t('unitSystemLabel')}</span>
        <div className="inline-flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-card)' }}>
          <button
            type="button"
            onClick={() => handleUnitChange('imperial')}
            className="px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: unitSystem === 'imperial' ? 'var(--color-sage)' : 'var(--bg-primary)',
              color: unitSystem === 'imperial' ? 'var(--color-bark)' : 'var(--color-text-muted)',
            }}
          >
            {t('imperial')}
          </button>
          <button
            type="button"
            onClick={() => handleUnitChange('metric')}
            className="px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: unitSystem === 'metric' ? 'var(--color-sage)' : 'var(--bg-primary)',
              color: unitSystem === 'metric' ? 'var(--color-bark)' : 'var(--color-text-muted)',
            }}
          >
            {t('metric')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="height_display" className="block text-sm font-medium text-text-muted mb-1">
            {t('heightLabel', { unit: unitSystem === 'metric' ? t('heightUnitCm') : t('heightUnitInches') })}
          </label>
          <input
            id="height_display"
            type="number"
            value={heightDisplay}
            onChange={(e) => setHeightDisplay(Number(e.target.value))}
            className="w-full px-3 py-2.5 bg-bg-primary border border-border-card rounded-xl text-text-primary focus:outline-none focus:border-accent-green"
            placeholder={unitSystem === 'metric' ? t('heightPlaceholderMetric') : t('heightPlaceholderImperial')}
          />
          {errors.height_inches && (
            <p className="mt-1 text-sm text-accent-red" role="alert">{errors.height_inches.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="weight_display" className="block text-sm font-medium text-text-muted mb-1">
            {t('weightLabel', { unit: unitSystem === 'metric' ? t('weightUnitKg') : t('weightUnitLbs') })}
          </label>
          <input
            id="weight_display"
            type="number"
            step="0.1"
            value={weightDisplay}
            onChange={(e) => setWeightDisplay(Number(e.target.value))}
            className="w-full px-3 py-2.5 bg-bg-primary border border-border-card rounded-xl text-text-primary focus:outline-none focus:border-accent-green"
          />
          {errors.weight_lbs && (
            <p className="mt-1 text-sm text-accent-red" role="alert">{errors.weight_lbs.message}</p>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`text-sm px-3 py-2 rounded-lg ${
            message.type === 'success'
              ? 'bg-accent-green/10 text-accent-green'
              : 'bg-accent-red/10 text-accent-red'
          }`}
          role="status"
        >
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full px-4 py-2.5 bg-accent-green text-bg-primary font-medium rounded-xl disabled:opacity-50 transition-opacity"
      >
        {saving ? t('saving') : t('saveProfile')}
      </button>
    </form>
  );
}
