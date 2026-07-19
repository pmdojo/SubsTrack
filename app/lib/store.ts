import type { Subscription } from './types'
import { seedSubs } from './data'

const STORAGE_KEY = 'subtrack_subs'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function getSubs(): Subscription[] {
  if (!isBrowser()) return seedSubs
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSubs))
      return seedSubs
    }
    const parsed = JSON.parse(raw) as Subscription[]
    if (!Array.isArray(parsed)) return seedSubs
    return parsed
  } catch (err) {
    console.error('[subtrack] getSubs failed', err)
    return seedSubs
  }
}

export function saveSubs(subs: Subscription[]): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(subs))
  } catch (err) {
    console.error('[subtrack] saveSubs failed', err)
  }
}

export function addSub(sub: Subscription): void {
  if (!isBrowser()) return
  try {
    const current = getSubs()
    const next = [sub, ...current]
    saveSubs(next)
  } catch (err) {
    console.error('[subtrack] addSub failed', err)
  }
}

export function deleteSub(id: string): void {
  if (!isBrowser()) return
  try {
    const current = getSubs()
    saveSubs(current.filter((s) => s.id !== id))
  } catch (err) {
    console.error('[subtrack] deleteSub failed', err)
  }
}

export function updateSub(sub: Subscription): void {
  if (!isBrowser()) return
  try {
    const current = getSubs()
    saveSubs(current.map((s) => (s.id === sub.id ? sub : s)))
  } catch (err) {
    console.error('[subtrack] updateSub failed', err)
  }
}
