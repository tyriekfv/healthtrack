'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';

/** Maps the stored snake_case medication frequency enum to its translated
 *  label (medication.frequency.* in messages/*.json). Shared by Dashboard,
 *  MedCard, and AddMedForm so the label set only lives in one place. */
export function useFrequencyLabel() {
  const t = useTranslations('medication.frequency');
  return useCallback(
    (freq: string): string => {
      switch (freq) {
        case 'once_daily': return t('onceDaily');
        case 'twice_daily': return t('twiceDaily');
        case 'three_times_daily': return t('threeTimesDaily');
        case 'four_times_daily': return t('fourTimesDaily');
        case 'every_other_day': return t('everyOtherDay');
        case 'weekly': return t('weekly');
        case 'biweekly': return t('biweekly');
        case 'monthly': return t('monthly');
        case 'as_needed': return t('asNeeded');
        case 'other': return t('other');
        default: return freq;
      }
    },
    [t],
  );
}
