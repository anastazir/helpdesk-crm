export const AUDIT_ACTION_STYLES: Record<
  string,
  { row: string; badge: string }
> = {
  created: {
    row: 'bg-emerald-50 dark:bg-emerald-950/20',
    badge: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  },
  updated: {
    row: 'bg-blue-50 dark:bg-blue-950/20',
    badge: 'border-blue-200 bg-blue-100 text-blue-700',
  },
  password_changed: {
    row: 'bg-amber-50 dark:bg-amber-950/20',
    badge: 'border-amber-200 bg-amber-100 text-amber-700',
  },
  disabled: {
    row: 'bg-orange-50 dark:bg-orange-950/20',
    badge: 'border-orange-200 bg-orange-100 text-orange-700',
  },
  enabled: {
    row: 'bg-lime-50 dark:bg-lime-950/20',
    badge: 'border-lime-200 bg-lime-100 text-lime-700',
  },
  deleted: {
    row: 'bg-red-50 dark:bg-red-950/20',
    badge: 'border-red-200 bg-red-100 text-red-700',
  },
  zone_added: {
    row: 'bg-violet-50 dark:bg-violet-950/20',
    badge: 'border-violet-200 bg-violet-100 text-violet-700',
  },
  zone_removed: {
    row: 'bg-rose-50 dark:bg-rose-950/20',
    badge: 'border-rose-200 bg-rose-100 text-rose-700',
  },
}

export const auditActionStyle = (action: string) =>
  AUDIT_ACTION_STYLES[action] ?? {
    row: '',
    badge: 'border-border bg-muted text-muted-foreground',
  }
