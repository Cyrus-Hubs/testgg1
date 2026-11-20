import type { AppId, Intent, L10n, Mood, Personality, ShopApp } from './types'

export const STARTER_APPS: AppId[] = ['giftcard', 'memecoin', 'cardverify']
export const SHOP_APPS: ShopApp[] = ['anyviewer', 'fine', 'lottery']
export const SHIFT_CHOICES = [60, 120, 180, 240] as const
export const MAX_PLAYERS = 8
export const PANIC_MS = 30_000

export const START_TRUST: Record<Personality, number> = {
  grandma: 56,
  crypto: 47,
  executive: 50,
  novice: 52,
  uncle: 49,
  scambaiter: 68,
}

export const DELTA: Record<Personality, Record<Intent, number>> = {
  grandma: {
    greet: 6,
    reassure: 9,
    urgency: -14,
    authority: 1,
    flattery: 11,
    ask_code: 0,
    confuse: -7,
    insult: -18,
  },
  crypto: {
    greet: 2,
    reassure: -2,
    urgency: 10,
    authority: -9,
    flattery: -5,
    ask_code: 3,
    confuse: -4,
    insult: -15,
  },
  executive: {
    greet: 1,
    reassure: 2,
    urgency: 7,
    authority: 10,
    flattery: -6,
    ask_code: 1,
    confuse: -8,
    insult: -20,
  },
  novice: {
    greet: 5,
    reassure: 12,
    urgency: -10,
    authority: 3,
    flattery: 6,
    ask_code: -2,
    confuse: -3,
    insult: -16,
  },
  scambaiter: {
    greet: -2,
    reassure: -5,
    urgency: -7,
    authority: -9,
    flattery: -4,
    ask_code: -14,
    confuse: -2,
    insult: -10,
  },
  uncle: {
    greet: 3,
    reassure: 2,
    urgency: -4,
    authority: -6,
    flattery: 4,
    ask_code: 0,
    confuse: 8,
    insult: -8,
  },
}

export const THRESHOLDS = {
  gift: 72,
  card: 64,
  fine: 74,
  lottery: 66,
  coin: 52,
  remote: 58,
  baitVirusMs: 40_000,
  baitDodgeMs: 25_000,
  baitSuspectMs: 20_000,
}

export const SHOP_PRICE: Record<ShopApp, number> = {
  anyviewer: 300,
  fine: 360,
  lottery: 240,
}

export const PLAYER_COLORS = ['#39f3b0', '#ffc857', '#ff8a3d', '#7aa2ff', '#ff3d6e', '#d489ff', '#b6f25c', '#ffd1dc']

export const QUICK_REPLIES: { intent: Intent; label: L10n }[] = [
  {
    intent: 'reassure',
    label: {
      th: 'ใจเย็น นี่ละครเป็ด ไม่กัด',
      en: 'Easy. This is duck theater. Nobody gets bitten.',
    },
  },
  {
    intent: 'urgency',
    label: {
      th: 'รีบหน่อย เหรียญฮอนค์จะจาม',
      en: 'Hurry, the HONK coin is about to sneeze.',
    },
  },
  {
    intent: 'authority',
    label: {
      th: 'กรมที่จอดความฝัน ขอความร่วมมือ',
      en: 'Dream Parking Authority. Your dream is parked diagonally.',
    },
  },
  {
    intent: 'flattery',
    label: {
      th: 'เสียงคุณเพราะกว่าเพลงรอสายทั้งแผนก',
      en: 'Your voice outranks every hold-music song we own.',
    },
  },
  {
    intent: 'ask_code',
    label: {
      th: 'อ่านรหัสการ์ตูนให้ฟังช้าๆ ได้ไหม',
      en: 'Could you read the cartoon code, slowly?',
    },
  },
]

export function quotaForDay(day: number) {
  return Math.round(520 * Math.pow(1.58, Math.max(0, day - 1)))
}

export function priceOf(app: ShopApp, bonus: boolean) {
  const base = SHOP_PRICE[app]
  return bonus ? Math.round(base * 0.7) : base
}

export function moodOf(trust: number): Mood {
  if (trust >= 80) return 'trusting'
  if (trust >= 55) return 'neutral'
  if (trust >= 25) return 'suspicious'
  return 'furious'
}

export function clampTrust(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)))
}

export function normalizeCode(s: string) {
  return s.trim().toUpperCase().replace(/\s+/g, '')
}

export function spiceOf(text: string) {
  let s = 1
  if (text.length <= 12) s += 1
  if (text.length >= 60) s += 2
  const bangs = text.match(/!/g)?.length ?? 0
  if (bangs >= 2) s += 2
  if (/555|ฮ่า|lol|haha|honk|ฮอนค์|เป็ด|duck/i.test(text)) s += 3
  if (text === text.toUpperCase() && /[A-Z]{6,}/.test(text)) s += 2
  return s
}

export function cleanName(input: string) {
  const name = input
    .replace(/[\u0000-\u001f\u202a-\u202e\u2066-\u2069]/g, '')
    .trim()
    .slice(0, 16)
  return name.length ? name : null
}

export function clampShift(seconds: number) {
  return (SHIFT_CHOICES as readonly number[]).includes(seconds) ? seconds : 180
}

export function formatClock(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

export function virusCount(viruses: { playerId: string }[], playerId: string) {
  return viruses.filter((v) => v.playerId === playerId).length
}

export function appsBlocked(viruses: { playerId: string }[], playerId: string) {
  return virusCount(viruses, playerId) >= 3
}
