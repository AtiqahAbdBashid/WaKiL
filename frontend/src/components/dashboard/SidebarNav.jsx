import { NavLink } from 'react-router-dom'

import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import Logo from '../ui/Logo'

export default function SidebarNav({ tagline, user, items, extra, footer }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-5 pb-6 pt-2 lg:pt-8">
      <Logo className="h-14 -ml-2" />
      <p className="mt-1 text-sm text-muted">{tagline}</p>

      <div className="mt-6 flex items-center gap-3">
        <Avatar initials={user.initials} tone="accent" size="lg" online />
        <div className="min-w-0">
          <p className="truncate font-bold leading-tight text-ink">{user.name}</p>
          <p className="truncate text-sm leading-tight text-muted">{user.role}</p>
          <p className="truncate text-sm leading-tight text-muted">{user.area}</p>
        </div>
      </div>

      <nav aria-label="Dashboard" className="mt-8">
        <p className="px-3 text-xs font-bold uppercase tracking-widest text-muted">Menu</p>
        <ul className="mt-3 space-y-1">
          {items.map(({ label, to, icon: Icon, badge, count }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 rounded-2xl px-3 py-3 text-[15px] font-medium transition focus-visible:outline-2 focus-visible:outline-brand ${
                    isActive ? 'bg-accent-soft text-accent-dark' : 'text-ink hover:bg-canvas'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute -left-5 top-1/2 h-8 w-1.5 -translate-y-1/2 rounded-r-full bg-accent"
                      />
                    )}
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="flex-1">{label}</span>
                    {badge && (
                      <Badge tone="brand" caps className="!px-2 !py-0.5 !text-[10px]">
                        {badge}
                      </Badge>
                    )}
                    {count > 0 && (
                      <span
                        className="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-white"
                        aria-label={`${count} unread`}
                      >
                        {count}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {extra}

      <div className="mt-auto pt-8">{footer}</div>
    </div>
  )
}
