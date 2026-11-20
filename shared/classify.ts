import type { Intent } from './types'

const INTENTS: Intent[] = [
  'insult',
  'ask_code',
  'urgency',
  'authority',
  'flattery',
  'reassure',
  'greet',
  'confuse',
]

const RULES: { intent: Intent; phrases: string[] }[] = [
  {
    intent: 'insult',
    phrases: ['โง่', 'บ้า', 'กาก', 'หุบปาก', 'ไร้สาระ', 'stupid', 'idiot', 'dumb', 'shut up', 'moron'],
  },
  {
    intent: 'ask_code',
    phrases: ['รหัส', 'โค้ด', 'หมายเลข', 'อ่านให้', 'ตัวเลข', 'พิน', 'code', 'voucher', 'digits', 'pin', 'read it', 'number'],
  },
  {
    intent: 'urgency',
    phrases: ['ด่วน', 'รีบ', 'เดี๋ยวนี้', 'หมดเวลา', 'ภายใน', 'ทันที', 'เร็วๆ', 'urgent', 'hurry', 'immediately', 'expires', 'last chance', 'right now', 'asap'],
  },
  {
    intent: 'authority',
    phrases: ['เจ้าหน้าที่', 'กรม', 'ตามระเบียบ', 'นโยบาย', 'ทางการ', 'ระบบกลาง', 'officer', 'official', 'department', 'policy', 'authorized', 'compliance', 'regulation'],
  },
  {
    intent: 'flattery',
    phrases: ['น่ารัก', 'เก่งมาก', 'เสียงเพราะ', 'สวย', 'หล่อ', 'ฉลาด', 'ใจดี', 'สุดยอด', 'เจ๋ง', 'lovely', 'cute', 'smart', 'genius', 'amazing', 'beautiful', 'gorgeous', 'sweet', 'charming'],
  },
  {
    intent: 'reassure',
    phrases: ['ไม่เป็นไร', 'สบายใจ', 'ปลอดภัย', 'ใจเย็น', 'วางใจ', 'ไม่ต้องกลัว', 'ชิล', 'safe', 'relax', 'worry', 'calm', 'trust me', "it's okay", 'all good', 'no rush'],
  },
  {
    intent: 'greet',
    phrases: ['สวัสดี', 'หวัดดี', 'โย่', 'ฮัลโหล', 'hello', 'hi', 'hey', 'good morning', 'howdy'],
  },
]

function hit(haystack: string, phrase: string) {
  const p = phrase.toLowerCase()
  if (/[\u0e00-\u0e7f]/.test(p) || p.includes(' ')) return haystack.includes(p)
  const re = new RegExp(`(^|[^a-z])${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`, 'i')
  return re.test(haystack)
}

export function classify(text: string): Intent {
  const t = text.toLowerCase().trim()
  if (t.length < 1) return 'confuse'
  const scores = new Map<Intent, number>()
  for (const rule of RULES) {
    let n = 0
    for (const phrase of rule.phrases) if (hit(t, phrase)) n += phrase.length > 3 ? 2 : 1
    if (n) scores.set(rule.intent, n)
  }
  let best: Intent = 'confuse'
  let bestScore = 0
  for (const intent of INTENTS) {
    const score = scores.get(intent) ?? 0
    if (score > bestScore) {
      best = intent
      bestScore = score
    }
  }
  return best
}

export function isIntent(value: string): value is Intent {
  return (INTENTS as string[]).includes(value)
}
