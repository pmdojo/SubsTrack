import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Subscription } from './types'
import { seedSubs } from './data'

const STORAGE_KEY = 'subtrack_subs'

export async function getSubs(): Promise<Subscription[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seedSubs))
      return seedSubs
    }
    const parsed = JSON.parse(raw) as Subscription[]
    if (!Array.isArray(parsed)) return seedSubs
    return parsed
  } catch (err) {
    console.warn('[subtrack] getSubs failed', err)
    return seedSubs
  }
}

export async function saveSubs(subs: Subscription[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(subs))
  } catch (err) {
    console.warn('[subtrack] saveSubs failed', err)
  }
}

export async function addSub(sub: Subscription): Promise<void> {
  try {
    const current = await getSubs()
    await saveSubs([sub, ...current])
  } catch (err) {
    console.warn('[subtrack] addSub failed', err)
  }
}

export async function deleteSub(id: string): Promise<void> {
  try {
    const current = await getSubs()
    await saveSubs(current.filter((s) => s.id !== id))
  } catch (err) {
    console.warn('[subtrack] deleteSub failed', err)
  }
}

export async function updateSub(sub: Subscription): Promise<void> {
  try {
    const current = await getSubs()
    await saveSubs(current.map((s) => (s.id === sub.id ? sub : s)))
  } catch (err) {
    console.warn('[subtrack] updateSub failed', err)
  }
}

export function formatINR(n: number, opts?: { withCents?: boolean }): string {
  const withCents = opts?.withCents ?? false
  try {
    return '₹' + n.toLocaleString('en-IN', {
      minimumFractionDigits: withCents ? 2 : 0,
      maximumFractionDigits: withCents ? 2 : 0,
    })
  } catch {
    return '₹' + (withCents ? n.toFixed(2) : String(Math.round(n)))
  }
}

// Back-compat alias — kept so components that still import formatUSD compile.
export const formatUSD = formatINR
