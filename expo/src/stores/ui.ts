import { create } from 'zustand'

/**
 * Volatile UI state — sheets, modals, active tab. NOT persisted; every cold
 * start begins on Home with no open sheets. Toast + Confirm live in their
 * own imperative UiProvider — this store handles longer-lived UI state.
 */
type UiState = {
  activeTab: 'home' | 'calendar' | 'insights' | 'profile'
  detailSubId: string | null
  editSubId: string | null
  addWizardOpen: boolean
  addWizardStep: 1 | 2 | 3 | 4 | 5
  monthPickerOpen: boolean
  selectedMonth: Date
}

type UiActions = {
  setTab: (t: UiState['activeTab']) => void
  openDetail: (id: string) => void
  closeDetail: () => void
  openEdit: (id: string) => void
  closeEdit: () => void
  openAddWizard: () => void
  closeAddWizard: () => void
  setWizardStep: (step: UiState['addWizardStep']) => void
  setMonth: (d: Date) => void
  openMonthPicker: () => void
  closeMonthPicker: () => void
}

export const useUiStore = create<UiState & UiActions>((set) => ({
  activeTab: 'home',
  detailSubId: null,
  editSubId: null,
  addWizardOpen: false,
  addWizardStep: 1,
  monthPickerOpen: false,
  selectedMonth: startOfMonth(new Date()),

  setTab: (activeTab) => set({ activeTab }),
  openDetail: (id) => set({ detailSubId: id }),
  closeDetail: () => set({ detailSubId: null }),
  openEdit: (id) => set({ editSubId: id, detailSubId: null }),
  closeEdit: () => set({ editSubId: null }),
  openAddWizard: () => set({ addWizardOpen: true, addWizardStep: 1 }),
  closeAddWizard: () => set({ addWizardOpen: false, addWizardStep: 1 }),
  setWizardStep: (addWizardStep) => set({ addWizardStep }),
  setMonth: (selectedMonth) => set({ selectedMonth }),
  openMonthPicker: () => set({ monthPickerOpen: true }),
  closeMonthPicker: () => set({ monthPickerOpen: false }),
}))

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
