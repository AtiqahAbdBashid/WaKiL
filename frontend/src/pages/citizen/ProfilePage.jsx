import { Link } from 'react-router-dom'
import { Bell, ChevronRight, CircleHelp, Landmark, LockKeyhole, LogOut, MapPin, ShieldCheck, UserRound } from 'lucide-react'

import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import LanguageToggle from '../../components/ui/LanguageToggle'
import PageTitle from '../../components/ui/PageTitle'
import { citizenUser } from '../../data/citizenMock'

function Detail({ label, value, icon: Icon }) {
  return (
    <div className="flex gap-3 py-4 first:pt-0 last:pb-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
        <dd className="mt-1 break-words text-sm font-semibold text-ink">{value}</dd>
      </div>
    </div>
  )
}

function SettingLink({ icon: Icon, title, description, to }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl py-4 focus-visible:outline-2 focus-visible:outline-brand"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block text-sm text-muted">{description}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-brand" aria-hidden="true" />
    </Link>
  )
}

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-white px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <PageTitle
          title="My Profile"
          subtitle="View your account details and manage your preferences."
        />

        <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm" aria-labelledby="profile-summary-title">
          <div className="flex flex-col gap-5 bg-brand-soft/70 p-5 sm:flex-row sm:items-center sm:p-7">
            <Avatar initials={citizenUser.initials} size="lg" ring />
            <div className="min-w-0 flex-1">
              <h2 id="profile-summary-title" className="text-xl font-bold text-ink">{citizenUser.name}</h2>
              <p className="mt-1 text-sm text-muted">{citizenUser.area}</p>
            </div>
            <Badge tone="neutral">Citizen account</Badge>
          </div>

          <div className="p-5 sm:p-7">
            <p className="mb-4 text-sm text-muted">Full name: <span className="font-semibold text-ink">{citizenUser.name}</span></p>
            <div className="grid gap-4 sm:grid-cols-2">
              <section className="rounded-xl border border-line p-4 sm:p-5" aria-labelledby="parliament-title">
                <h3 id="parliament-title" className="text-base font-bold text-ink">Parliament</h3>
                <dl className="mt-4 divide-y divide-line">
                  <Detail label="Constituency" value={citizenUser.parliament} icon={Landmark} />
                  <Detail label="Member of Parliament" value={citizenUser.mpName} icon={UserRound} />
                </dl>
              </section>

              <section className="rounded-xl border border-line p-4 sm:p-5" aria-labelledby="dun-title">
                <h3 id="dun-title" className="text-base font-bold text-ink">DUN</h3>
                <dl className="mt-4 divide-y divide-line">
                  <Detail label="State constituency" value="Not applicable — Kuala Lumpur has no State Legislative Assembly" icon={MapPin} />
                  <Detail label="ADUN" value="Not applicable — Kuala Lumpur has no ADUN" icon={UserRound} />
                  <Detail label="Federal territory" value={citizenUser.state} icon={MapPin} />
                </dl>
              </section>
            </div>
          </div>
        </section>

        <section aria-labelledby="account-settings-title">
          <h2 id="account-settings-title" className="text-xl font-bold text-ink">Account settings</h2>
          <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white px-5 shadow-sm sm:px-7">
            <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-ink">Language</h3>
                <p className="mt-1 text-sm text-muted">Choose your preferred language for the interface.</p>
              </div>
              <LanguageToggle />
            </div>

            <SettingLink
              icon={Bell}
              title="Notifications"
              description="Review complaint submissions and status updates."
              to="/citizen/notifikasi"
            />
            <div className="flex items-center gap-3 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">Sign-in and privacy</span>
                <span className="mt-0.5 block text-sm text-muted">Account security settings will be available when citizen sign-in is connected.</span>
              </span>
              <Badge tone="neutral">Demo</Badge>
            </div>
            <SettingLink
              icon={CircleHelp}
              title="Your complaints"
              description="View your reports and their progress updates."
              to="/citizen/aduan-saya"
            />
          </div>
        </section>

        <div className="flex justify-end">
          <Button as={Link} to="/" variant="ghost" className="text-accent-dark">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log out
          </Button>
        </div>

        <aside className="flex items-start gap-3 rounded-xl bg-canvas p-4 sm:p-5">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-bold text-ink">Your information</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              The constituency details shown are for the current demo profile. Kuala Lumpur is a Federal Territory, so it has no DUN or ADUN. Profile editing and verified account details will be available when citizen sign-in is connected.
            </p>
          </div>
        </aside>
      </div>
    </main>
  )
}
