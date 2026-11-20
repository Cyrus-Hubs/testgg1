export type Lang = 'th' | 'en'

export type Phase = 'lobby' | 'shift' | 'review' | 'fired'

export type AppId = 'giftcard' | 'memecoin' | 'cardverify' | 'anyviewer' | 'fine' | 'lottery'

export type ShopApp = 'anyviewer' | 'fine' | 'lottery'

export type Scenario = AppId | 'none'

export type Personality = 'grandma' | 'crypto' | 'executive' | 'novice' | 'scambaiter' | 'uncle'

export type Intent =
  | 'greet'
  | 'reassure'
  | 'urgency'
  | 'authority'
  | 'flattery'
  | 'ask_code'
  | 'confuse'
  | 'insult'

export type Mood = 'trusting' | 'neutral' | 'suspicious' | 'furious'

export type ScriptName = 'grandma' | 'bait' | 'coin' | 'card' | 'fine' | 'lottery' | 'remote'

export interface L10n {
  th: string
  en: string
}

export interface TranscriptLine {
  id: string
  at: number
  speaker: 'caller' | 'agent' | 'system'
  text: L10n
  intent?: Intent
  playerId?: string
}

export interface SaidLine {
  text: L10n
  spice: number
  at: number
}

export interface MemeCoin {
  prices: number[]
  crashed: boolean
  cashed: boolean
  running: boolean
  stake: number
  crashAt: number
  lastStep: number
}

export interface AnyViewer {
  connected: boolean
  found: boolean
  clicks: number
  pin: string
  order: string[]
}

export interface Lottery {
  panels: number[]
  scratched: number
  jackpot: boolean
  armed: boolean
}

export interface CallNotice {
  tone: 'good' | 'bad' | 'info'
  text: L10n
}

export interface Call {
  id: string
  playerId: string
  personality: Personality
  isBait: boolean
  baitSuspected: boolean
  scenario: Scenario
  name: L10n
  bio: L10n
  avatar: string
  trust: number
  status: 'ringing' | 'active' | 'hold' | 'ended'
  ringAt: number
  startedAt: number | null
  clearAt: number | null
  holdAt: number | null
  holdWarned: boolean
  transcript: TranscriptLine[]
  secret: string
  chunks: string[]
  revealedChunks: number
  verified: boolean[]
  revealed: boolean
  wrongGuesses: number
  authorityHits: number
  askFails: number
  memecoin: MemeCoin | null
  anyviewer: AnyViewer | null
  lottery: Lottery | null
  nextBaitDrop: number
  baitVirusFired: boolean
  outcome?: 'success' | 'failed' | 'dodged' | 'missed' | 'terminated'
  notice: CallNotice | null
  completed: boolean
}

export interface Virus {
  id: string
  playerId: string
  title: L10n
  body: L10n
  fake: L10n
  at: number
  bred: boolean
}

export interface FeedItem {
  id: string
  at: number
  text: L10n
  tone: 'info' | 'good' | 'bad' | 'boss'
}

export interface Player {
  id: string
  name: string
  isHost: boolean
  connected: boolean
  disconnectedAt: number
  earned: number
  bank: number
  callsWon: number
  callsLost: number
  callsDodged: number
  said: SaidLine[]
  unlocked: AppId[]
  lastActivity: number
  lastSayAt: number
  color: string
  virusSpawns: number
  nextRingAt: number
}

export interface RankRow {
  place: number
  id: string
  name: string
  earned: number
  callsWon: number
  callsLost: number
  callsDodged: number
  bank: number
}

export interface Quote {
  name: string
  text: L10n
  spice: number
  at: number
}

export interface Review {
  passed: boolean
  quota: number
  progress: number
  ranks: RankRow[]
  quotes: Quote[]
  bossKey: 'proud' | 'ok' | 'fired'
}

export interface BossAlert {
  key: string
  until: number
}

export interface Room {
  code: string
  phase: Phase
  day: number
  shiftSeconds: number
  shiftEndsAt: number | null
  shiftStartedAt: number
  quota: number
  progress: number
  seed: number
  rngSeed: number
  hostId: string
  players: Player[]
  calls: Call[]
  viruses: Virus[]
  feed: FeedItem[]
  boss: BossAlert | null
  lastBossAt: number
  review: Review | null
  bonusShop: boolean
  createdAt: number
  e2e: boolean
  script?: ScriptName
  revision: number
  seq: number
  lastTickAt: number
  behindWarned: boolean
}

export type Action =
  | { type: 'answer' }
  | { type: 'hold' }
  | { type: 'hangup' }
  | { type: 'say'; text: string }
  | { type: 'quick'; intent: Intent }
  | { type: 'redeem_gift'; code: string }
  | { type: 'memecoin_start' }
  | { type: 'memecoin_cashout' }
  | { type: 'verify_chunks'; chunks: string[] }
  | { type: 'anyviewer_connect' }
  | { type: 'anyviewer_click'; iconId: string }
  | { type: 'anyviewer_submit'; pin: string }
  | { type: 'fine_submit'; code: string }
  | { type: 'lottery_arm'; code: string }
  | { type: 'lottery_scratch' }
  | { type: 'buy'; app: ShopApp }
  | { type: 'quarantine'; virusId: string }
  | { type: 'virus_poke'; virusId: string }
  | { type: 'start_shift' }
  | { type: 'end_shift' }
  | { type: 'next_day' }
  | { type: 'play_again' }
  | { type: 'set_shift'; seconds: number }

export type EngineResult =
  | { ok: true; room: Room; playerId?: string }
  | { ok: false; error: string; room?: Room; playerId?: string }
