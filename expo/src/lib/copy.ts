// All user-facing strings. Mapped 1:1 to docs/UX_SPEC.md §12 "Copy library".
// Never hard-code copy in components — pull from here so l10n is trivial later.

export const copy = {
  greeting: {
    morning: 'Good Morning',
    afternoon: 'Good Afternoon',
    evening: 'Good Evening',
  },

  hero: {
    totalSpending: 'TOTAL SPENDING',
    duePayment: 'DUE PAYMENT',
    dueToday: 'Due Today',
    dueTomorrow: 'Due Tomorrow',
    dueInDays: 'Due in {n} days',
    activeSubsCount: '{n} active subscriptions',
  },

  section: {
    upcoming: 'Upcoming payments',
    active: 'Active Subscriptions',
    seeAll: 'See all →',
    manage: 'Manage →',
    changeArrow: 'Change >',
  },

  quickActions: {
    add: 'Add',
    category: 'Category',
    insights: 'Insights',
    export: 'Export',
  },

  chip: {
    today: 'TODAY',
    day1: '1 DAY',
    dayN: '{n} DAYS',
    active: 'Active',
    activeSubscription: 'Active Subscription',
    paused: 'Paused',
    cancelled: 'Cancelled',
    expired: 'Expired',
  },

  detail: {
    title: 'SUBSCRIPTION',
    nextPayment: 'NEXT PAYMENT',
    billingCycle: 'BILLING CYCLE',
    totalSpent: 'TOTAL SPENT',
    category: 'CATEGORY',
    status: 'Status',
    plan: 'Plan',
    monthlyCost: 'Monthly Cost',
    nextBilling: 'Next Billing',
    paymentMethod: 'Payment Method',
    autoRenewal: 'Auto Renewal',
    paymentReminder: 'Payment Reminder',
    paymentReminderSubtitle: 'Notify me {n} days before',
    autoRenew: 'Auto - Renew',
    autoRenewSubtitle: 'Renew automatically each month',
    paymentMethods: 'Payment methods',
    change: 'Change >',
    since: 'Since {date}',
    overNMonths: 'Over {n} months',
    inNextMonth: 'in next month',
    inNDays: 'in {n} days',
  },

  action: {
    payNow: 'Pay now ↗',
    pause: 'Pause',
    pauseGlyph: 'Pause II',
    resume: 'Resume',
    resumeGlyph: 'Resume ▶',
    cancel: 'Cancel',
    cancelGlyph: 'Cancel ×',
    reactivate: 'Reactivate',
    renewNow: 'Renew Now',
    deletePermanently: 'Delete permanently',
    manageSubscription: 'Manage Subscription',
    changePlan: 'Change Plan',
    changePaymentMethod: 'Change Payment Method',
    reminderSettings: 'Reminder Settings',
    exportInvoice: 'Export Invoice',
    viewPaymentHistory: 'View Payment History',
    viewBillingHistory: 'View Billing History',
    contactSupport: 'Contact Support',
    tapToManage: 'Tap to Manage →',
  },

  confirm: {
    cancelTitle: 'Cancel {name}?',
    cancelBody:
      'Access continues until the current cycle ends. You can reactivate anytime.',
    deleteTitle: 'Delete {name}?',
    deleteBody:
      "This removes it from your list forever. Total-spent history is lost.",
    keep: 'Keep',
    confirmCancel: 'Cancel it',
    confirmDelete: 'Delete',
  },

  toast: {
    paused: "Paused {name}. We'll stop counting it.",
    resumed: '{name} is active again.',
    cancelled: '{name} cancelled.',
    deleted: '{name} deleted.',
    added: 'Added {name}.',
    updated: 'Saved {name}.',
    reminderOff: "Reminder off. We won't ping you.",
    reminderOn: "Reminder on. We'll ping you {n} days before.",
    autoRenewOn: 'Auto renewal enabled',
    autoRenewOff: 'Auto renewal disabled',
    exportSoon: 'Export is coming soon.',
    saved: 'Saved.',
  },

  empty: {
    subsTitle: 'Nothing tracked yet.',
    subsBody: 'Tap the + button to add your first subscription.',
    remindersTitle: "You're all clear this month.",
    remindersBody: 'Enjoy the peace ✌️',
    insightsTitle: 'Not enough data yet.',
    insightsBody: 'Add a few subscriptions to see spending patterns.',
  },
} as const

// ── Interpolation ───────────────────────────────────────────────────────────

/**
 * Replaces every {token} in the template with its value from `vars`.
 *
 *   t(copy.hero.dueInDays, { n: 3 })  → 'Due in 3 days'
 *   t(copy.toast.paused, { name: 'Netflix' })  → "Paused Netflix. We'll stop counting it."
 */
export function t(
  template: string,
  vars?: Record<string, string | number>
): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    key in vars ? String(vars[key]) : `{${key}}`
  )
}
