'use client';

import { useMemo, useState } from 'react';
import { useMedicationDoses } from '@/hooks/useMedicationDoses';
import { useDonations, useDonationRecovery } from '@/hooks/useDonations';
import { useLabResults } from '@/hooks/useLabResults';
import EmptyState from '@/components/shared/EmptyState';
import Skeleton from '@/components/shared/Skeleton';
import CurrentDoseCard from '@/components/cycle/CurrentDoseCard';
import UpdateDoseForm from '@/components/cycle/UpdateDoseForm';
import DonationForm from '@/components/cycle/DonationForm';
import DonationCard from '@/components/cycle/DonationCard';
import RecoveryTimeline from '@/components/cycle/RecoveryTimeline';
import CorrelationExplorer from '@/components/cycle/CorrelationExplorer';

type Tab = 'doses' | 'donations' | 'correlations';

const TABS: { key: Tab; label: string }[] = [
  { key: 'doses', label: 'Doses' },
  { key: 'donations', label: 'Donations' },
  { key: 'correlations', label: 'Correlations' },
];

export default function CycleTrackingPage() {
  const [tab, setTab] = useState<Tab>('doses');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Cycle Tracking
        </h1>
      </div>

      <div className="flex gap-2" role="tablist" aria-label="Cycle tracking section">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            role="tab"
            aria-selected={tab === t.key}
            aria-controls={`cycle-panel-${t.key}`}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: tab === t.key ? 'var(--color-sage)' : 'var(--bg-card)',
              color: tab === t.key ? 'var(--bg-primary)' : 'var(--color-text-muted)',
              border: tab === t.key ? 'none' : '1px solid var(--border-card)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'doses' && <DosesPanel />}
      {tab === 'donations' && <DonationsPanel />}
      {tab === 'correlations' && <CorrelationsPanel />}
    </div>
  );
}

function DosesPanel() {
  const [showForm, setShowForm] = useState(false);
  const { doses, loading, error, updateDose } = useMedicationDoses();
  const knownCompounds = useMemo(() => doses.map((d) => d.compound), [doses]);

  return (
    <div id="cycle-panel-doses" role="tabpanel" className="space-y-4">
      <div className="flex justify-end">
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, var(--color-terracotta), var(--color-terracotta-light))',
              color: 'white',
              boxShadow: '0 4px 14px rgba(224, 122, 95, 0.3)',
            }}
          >
            Update a Dose
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Update a Medication
          </h2>
          <UpdateDoseForm
            knownCompounds={knownCompounds}
            onCancel={() => setShowForm(false)}
            onSubmit={async (data) => {
              const result = await updateDose(data);
              setShowForm(false);
              return result;
            }}
          />
        </div>
      )}

      {error && (
        <div className="rounded-xl border p-4 text-sm" style={{ borderColor: 'var(--color-terracotta)', color: 'var(--color-terracotta)' }} role="alert">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading doses">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      )}

      {!loading && doses.length === 0 && (
        <div className="rounded-xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}>
          <EmptyState
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.591.659H9.061a2.25 2.25 0 01-1.591-.659L5 14.5m14 0V5.846a2.25 2.25 0 00-1.683-2.177M5 14.5V5.846a2.25 2.25 0 011.683-2.177" />
              </svg>
            }
            title="No doses tracked yet"
            description="Log a compound's dose to start tracking its continuous history and days-at-dose."
            action={{ label: 'Update a Dose', onClick: () => setShowForm(true) }}
          />
        </div>
      )}

      {!loading && doses.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {doses.map((dose) => (
            <CurrentDoseCard key={dose.id} dose={dose} />
          ))}
        </div>
      )}
    </div>
  );
}

function DonationsPanel() {
  const [showForm, setShowForm] = useState(false);
  const { donations, loading, error, addDonation, deleteDonation } = useDonations();
  const { entries: recoveryEntries, loading: recoveryLoading } = useDonationRecovery();

  return (
    <div id="cycle-panel-donations" role="tabpanel" className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Donation Log
          </h2>
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, var(--color-terracotta), var(--color-terracotta-light))',
                color: 'white',
                boxShadow: '0 4px 14px rgba(224, 122, 95, 0.3)',
              }}
            >
              Log Donation
            </button>
          )}
        </div>

        {showForm && (
          <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}>
            <DonationForm
              onCancel={() => setShowForm(false)}
              onSubmit={async (data) => {
                const row = await addDonation(data);
                setShowForm(false);
                return row;
              }}
            />
          </div>
        )}

        {error && (
          <div className="rounded-xl border p-4 text-sm" style={{ borderColor: 'var(--color-terracotta)', color: 'var(--color-terracotta)' }} role="alert">
            {error}
          </div>
        )}

        {loading && (
          <div className="space-y-3" aria-busy="true" aria-label="Loading donations">
            <Skeleton variant="card" />
          </div>
        )}

        {!loading && donations.length === 0 && (
          <div className="rounded-xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}>
            <EmptyState
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.97-4.418-8.25-8.09-8.25-11.607C3.75 6.093 6.093 3.75 9 3.75c1.928 0 3.617 1.03 4.5 2.567A5.25 5.25 0 0118 3.75c2.907 0 5.25 2.343 5.25 5.643 0 3.517-3.28 7.19-8.25 11.607z" />
                </svg>
              }
              title="No donations logged yet"
              description="Log a blood donation to track eligibility and its effect on your labs over time."
              action={{ label: 'Log Donation', onClick: () => setShowForm(true) }}
            />
          </div>
        )}

        {!loading && donations.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-4">
            {donations.map((donation) => (
              <DonationCard key={donation.id} donation={donation} onDelete={deleteDonation} />
            ))}
          </div>
        )}
      </div>

      {donations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Recovery Timeline
          </h2>
          {recoveryLoading ? (
            <Skeleton variant="card" />
          ) : (
            <div className="space-y-3">
              {recoveryEntries.map((entry) => (
                <RecoveryTimeline key={entry.donation_id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CorrelationsPanel() {
  const { doses } = useMedicationDoses();
  const { labVisits } = useLabResults();

  const compounds = useMemo(
    () => Array.from(new Set(doses.map((d) => d.compound))),
    [doses],
  );
  const labMetrics = useMemo(
    () =>
      Array.from(
        new Set(labVisits.flatMap((v) => v.lab_results.map((r) => r.test_name))),
      ).sort(),
    [labVisits],
  );

  return (
    <div id="cycle-panel-correlations" role="tabpanel" className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
        What moves with a compound&apos;s dose, days since your last donation, or another lab
        metric? Every result comes with a confidence badge — a correlation on very few data
        points is exploratory only, not evidence of a relationship.
      </p>
      {labMetrics.length === 0 ? (
        <div className="rounded-xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}>
          <EmptyState
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            }
            title="No lab results yet"
            description="Add lab results to start exploring correlations."
          />
        </div>
      ) : (
        <CorrelationExplorer labMetrics={labMetrics} compounds={compounds} />
      )}
    </div>
  );
}
