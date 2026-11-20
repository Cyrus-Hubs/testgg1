import { classify, isIntent } from './classify'
import {
  DELTA,
  MAX_PLAYERS,
  PLAYER_COLORS,
  QUICK_REPLIES,
  SHOP_APPS,
  STARTER_APPS,
  START_TRUST,
  THRESHOLDS,
  appsBlocked,
  clampShift,
  clampTrust,
  cleanName,
  normalizeCode,
  priceOf,
  quotaForDay,
  spiceOf,
} from './constants'
import {
  BOSS,
  NAMES,
  REVIEW_BOSS,
  VIRUS_ADS,
  baitFake,
  chunkReveal,
  coinCash,
  coinCrash,
  coinStart,
  fineReveal,
  giftReveal,
  greetLine,
  lotteryReveal,
  missedLine,
  reactLine,
  remoteDecoy,
  remoteDeny,
  remoteFound,
  remoteOk,
  terminatedLine,
  thanksLine,
  walkedLine,
  wrongLine,
} from './lines'
import { makeRng, makeRoomCode, token } from './rng'
import type {
  Action,
  Call,
  EngineResult,
  Intent,
  L10n,
  Personality,
  Player,
  Room,
  Scenario,
  ScriptName,
} from './types'

const VIEWER_ICONS = ['cat', 'mail', 'trash', 'sol', 'folder', 'sticky', 'calc', 'music', 'tax', 'duck', 'map', 'clock', 'pizza', 'virus', 'bank', 'note2']

export interface CreateOpts {
  name: string
  now: number
  code?: string
  seed?: number
  shiftSeconds?: number
  e2e?: boolean
  script?: ScriptName
  quota?: number
}

const fail = (error: string, room?: Room): EngineResult => ({ ok: false, error, room })

function commit(draft: Room): EngineResult {
  draft.revision += 1
  return { ok: true, room: draft }
}

function nid(draft: Room, prefix: string) {
  draft.seq += 1
  return `${prefix}${draft.seq}`
}

function say(th: string, en: string): L10n {
  return { th, en }
}

function pushFeed(draft: Room, now: number, tone: Room['feed'][number]['tone'], text: L10n) {
  draft.feed.unshift({ id: nid(draft, 'f'), at: now, tone, text })
  draft.feed = draft.feed.slice(0, 40)
}

function pushLine(draft: Room, call: Call, now: number, speaker: Call['transcript'][number]['speaker'], text: L10n, extra?: { intent?: Intent; playerId?: string }) {
  call.transcript.push({
    id: nid(draft, 'l'),
    at: now,
    speaker,
    text,
    intent: extra?.intent,
    playerId: extra?.playerId,
  })
  call.transcript = call.transcript.slice(-40)
}

function findPlayer(room: Room, id: string) {
  return room.players.find((p) => p.id === id)
}

function liveCall(room: Room, playerId: string) {
  return room.calls.find((c) => c.playerId === playerId && (c.status === 'ringing' || c.status === 'active' || c.status === 'hold'))
}

function makePlayer(draft: Room, name: string, host: boolean, now: number): Player {
  return {
    id: nid(draft, 'p'),
    name,
    isHost: host,
    connected: true,
    disconnectedAt: 0,
    earned: 0,
    bank: 0,
    callsWon: 0,
    callsLost: 0,
    callsDodged: 0,
    said: [],
    unlocked: [...STARTER_APPS],
    lastActivity: now,
    lastSayAt: 0,
    color: PLAYER_COLORS[draft.players.length % PLAYER_COLORS.length] ?? '#39f3b0',
    virusSpawns: 0,
    nextRingAt: Number.MAX_SAFE_INTEGER,
  }
}

export function createLobby(opts: CreateOpts): EngineResult {
  const name = cleanName(opts.name)
  if (!name) return fail('bad_name')
  const seed = opts.seed || Math.floor(Math.random() * 1_000_000_000) + 1
  const coded = opts.code ? { code: opts.code.toUpperCase(), seed } : makeRoomCode(seed)
  const room: Room = {
    code: coded.code,
    phase: 'lobby',
    day: 1,
    shiftSeconds: clampShift(opts.shiftSeconds ?? 180),
    shiftEndsAt: null,
    shiftStartedAt: 0,
    quota: opts.quota ?? quotaForDay(1),
    progress: 0,
    seed,
    rngSeed: coded.seed || seed,
    hostId: '',
    players: [],
    calls: [],
    viruses: [],
    feed: [],
    boss: null,
    lastBossAt: 0,
    review: null,
    bonusShop: false,
    createdAt: opts.now,
    e2e: Boolean(opts.e2e),
    script: opts.script,
    revision: 0,
    seq: 0,
    lastTickAt: opts.now,
    behindWarned: false,
  }
  const player = makePlayer(room, name, true, opts.now)
  room.hostId = player.id
  room.players.push(player)
  pushFeed(room, opts.now, 'info', say(`${name} เปิดห้องการ์ตูน`, `${name} opened the cartoon floor`))
  const result = commit(room)
  if (result.ok) result.playerId = player.id
  return result
}

export function joinRoom(room: Room, name: string, now: number): EngineResult {
  const clean = cleanName(name)
  if (!clean) return fail('bad_name', room)
  if (room.phase !== 'lobby') return fail('already_started', room)
  if (room.players.length >= MAX_PLAYERS) return fail('room_full', room)
  const draft = structuredClone(room)
  const player = makePlayer(draft, clean, false, now)
  draft.players.push(player)
  pushFeed(draft, now, 'info', say(`${clean} เดินเข้ากะ`, `${clean} clocked into the room`))
  const result = commit(draft)
  if (result.ok) result.playerId = player.id
  return result
}

function persona(rng: () => number, key: Exclude<Personality, 'scambaiter'>) {
  const list = NAMES[key]
  return list[Math.floor(rng() * list.length)] ?? list[0]
}

function scripted(script: ScriptName | undefined, e2e: boolean): { personality: Personality; scenario: Scenario; trust: number; bait: boolean } | null {
  if (e2e) return { personality: 'grandma', scenario: 'giftcard', trust: 64, bait: false }
  switch (script) {
    case 'grandma':
      return { personality: 'grandma', scenario: 'giftcard', trust: START_TRUST.grandma, bait: false }
    case 'bait':
      return { personality: 'grandma', scenario: 'giftcard', trust: START_TRUST.scambaiter, bait: true }
    case 'coin':
      return { personality: 'crypto', scenario: 'memecoin', trust: 70, bait: false }
    case 'card':
      return { personality: 'novice', scenario: 'cardverify', trust: 70, bait: false }
    case 'fine':
      return { personality: 'executive', scenario: 'fine', trust: 70, bait: false }
    case 'lottery':
      return { personality: 'uncle', scenario: 'lottery', trust: 70, bait: false }
    case 'remote':
      return { personality: 'novice', scenario: 'anyviewer', trust: 70, bait: false }
    default:
      return null
  }
}

function buildCall(draft: Room, player: Player, now: number, scriptedFirst: boolean): Call {
  const rng = makeRng(draft)
  const forced = scriptedFirst ? scripted(draft.script, draft.e2e) : null
  let personality: Personality = 'grandma'
  let scenario: Scenario = 'giftcard'
  let trust = START_TRUST.grandma
  let isBait = false
  if (forced) {
    personality = forced.personality
    scenario = forced.scenario
    trust = forced.trust
    isBait = forced.bait
  } else {
    const baitP = Math.min(0.42, 0.08 + (draft.day - 1) * 0.07)
    if (rng() < baitP) {
      isBait = true
      const covers: Exclude<Personality, 'scambaiter'>[] = ['grandma', 'crypto', 'executive', 'novice', 'uncle']
      personality = covers[Math.floor(rng() * covers.length)] ?? 'grandma'
      const owned = player.unlocked
      scenario = owned[Math.floor(rng() * owned.length)] ?? 'giftcard'
      trust = START_TRUST.scambaiter
    } else {
      const pool: Exclude<Personality, 'scambaiter'>[] = ['grandma', 'crypto', 'executive', 'novice', 'uncle']
      personality = pool[Math.floor(rng() * pool.length)] ?? 'grandma'
      trust = START_TRUST[personality]
      const owned = player.unlocked
      scenario = owned[Math.floor(rng() * owned.length)] ?? 'giftcard'
    }
  }
  const who = persona(rng, personality as Exclude<Personality, 'scambaiter'>)
  const chunks = [token(rng, 4), token(rng, 4), token(rng, 4)]
  const gift = `DUCK-${token(rng, 2)}-${token(rng, 2)}`
  const fine = `DREAM-${token(rng, 2)}`
  const ticket = `TIX-${String(100 + Math.floor(rng() * 900))}`
  const secret = scenario === 'fine' ? fine : scenario === 'lottery' ? ticket : scenario === 'giftcard' ? gift : gift
  const order = [...VIEWER_ICONS]
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const a = order[i] ?? 'cat'
    const b = order[j] ?? 'cat'
    order[i] = b
    order[j] = a
  }
  const panels = [0, 1, 2].map(() => {
    const table = [0, 40, 90, 140, 200]
    return table[Math.floor(rng() * table.length)] ?? 0
  })
  const call: Call = {
    id: nid(draft, 'c'),
    playerId: player.id,
    personality,
    isBait,
    baitSuspected: false,
    scenario: isBait ? scenario : scenario,
    name: { th: who.th, en: who.en },
    bio: who.bio,
    avatar: who.avatar,
    trust,
    status: 'ringing',
    ringAt: now,
    startedAt: null,
    clearAt: null,
    holdAt: null,
    holdWarned: false,
    transcript: [],
    secret: isBait ? 'BANANA-HAMMOCK' : secret,
    chunks,
    revealedChunks: 0,
    verified: [false, false, false],
    revealed: false,
    wrongGuesses: 0,
    authorityHits: 0,
    askFails: 0,
    memecoin:
      scenario === 'memecoin'
        ? { prices: [10], crashed: false, cashed: false, running: false, stake: 120, crashAt: 7 + Math.floor(rng() * 8), lastStep: now }
        : null,
    anyviewer:
      scenario === 'anyviewer'
        ? { connected: false, found: false, clicks: 0, pin: String(1000 + Math.floor(rng() * 9000)), order }
        : null,
    lottery: scenario === 'lottery' ? { panels, scratched: 0, jackpot: rng() < 0.08, armed: false } : null,
    nextBaitDrop: 0,
    baitVirusFired: false,
    notice: null,
    completed: false,
  }
  return call
}

function spawnInto(draft: Room, playerId: string, now: number, scriptedFirst: boolean) {
  const player = findPlayer(draft, playerId)
  if (!player) return
  if (liveCall(draft, playerId)) return
  const call = buildCall(draft, player, now, scriptedFirst)
  draft.calls.push(call)
  player.nextRingAt = Number.MAX_SAFE_INTEGER
  pushFeed(draft, now, 'info', say(`สายเข้าหา ${player.name}: ${call.name.th}`, `Incoming for ${player.name}: ${call.name.en}`))
}

export function startShift(room: Room, hostId: string, now: number): EngineResult {
  if (room.hostId !== hostId) return fail('not_host', room)
  if (room.phase !== 'lobby' && room.phase !== 'review') return fail('bad_phase', room)
  const draft = structuredClone(room)
  draft.phase = 'shift'
  draft.shiftStartedAt = now
  draft.shiftEndsAt = now + draft.shiftSeconds * 1000
  draft.lastTickAt = now
  draft.progress = 0
  draft.calls = []
  draft.viruses = []
  draft.boss = null
  draft.behindWarned = false
  draft.bonusShop = false
  draft.review = null
  for (const player of draft.players) {
    player.earned = 0
    player.callsWon = 0
    player.callsLost = 0
    player.callsDodged = 0
    player.said = []
    player.lastActivity = now
    player.virusSpawns = 0
    player.nextRingAt = Number.MAX_SAFE_INTEGER
  }
  pushFeed(draft, now, 'boss', BOSS.start)
  for (const player of draft.players) spawnInto(draft, player.id, now, true)
  return commit(draft)
}

function setBoss(draft: Room, now: number, key: string) {
  if (draft.lastBossAt && now - draft.lastBossAt < 8000) return
  draft.boss = { key, until: now + 6500 }
  draft.lastBossAt = now
  const line = BOSS[key]
  if (line) pushFeed(draft, now, 'boss', line)
}

function endCall(call: Call, now: number, outcome: NonNullable<Call['outcome']>, clearIn = 2800) {
  call.status = 'ended'
  call.outcome = outcome
  call.clearAt = now + clearIn
  call.holdAt = null
}

function pay(draft: Room, player: Player, call: Call, amount: number, now: number, note: L10n) {
  if (call.isBait || call.completed) return false
  player.earned += amount
  player.callsWon += 1
  draft.progress += amount
  call.completed = true
  call.notice = { tone: 'good', text: note }
  pushLine(draft, call, now, 'caller', thanksLine())
  pushLine(draft, call, now, 'system', say(`โควต้า +${amount}`, `Quota +${amount}`))
  pushFeed(draft, now, 'good', say(`${player.name} +${amount}`, `${player.name} banked +${amount}`))
  endCall(call, now, 'success', 3600)
  return true
}

function failCall(draft: Room, player: Player, call: Call, now: number, outcome: 'failed' | 'missed' | 'terminated', bossKey: string) {
  if (call.status === 'ended') return
  player.callsLost += 1
  call.notice = {
    tone: 'bad',
    text: outcome === 'terminated' ? terminatedLine() : outcome === 'missed' ? missedLine() : say('สายนี้หลุดมือ', 'This one slipped.'),
  }
  if (outcome === 'terminated') pushLine(draft, call, now, 'system', terminatedLine())
  endCall(call, now, outcome, outcome === 'terminated' ? 4200 : 2200)
  setBoss(draft, now, bossKey)
}

function tryReveal(draft: Room, call: Call, intent: Intent, now: number) {
  if (call.isBait || call.completed) return false
  if (intent !== 'ask_code') return false
  if (call.scenario === 'giftcard' && call.trust >= THRESHOLDS.gift && !call.revealed) {
    call.revealed = true
    pushLine(draft, call, now, 'caller', giftReveal(call.secret))
    return true
  }
  if (call.scenario === 'cardverify' && call.trust >= THRESHOLDS.card && call.revealedChunks < 3) {
    const chunk = call.chunks[call.revealedChunks] ?? ''
    call.revealedChunks += 1
    pushLine(draft, call, now, 'caller', chunkReveal(call.revealedChunks, chunk))
    return true
  }
  if (call.scenario === 'fine' && call.trust >= THRESHOLDS.fine && call.authorityHits >= 1 && !call.revealed) {
    call.revealed = true
    pushLine(draft, call, now, 'caller', fineReveal(call.secret))
    return true
  }
  if (call.scenario === 'lottery' && call.trust >= THRESHOLDS.lottery && !call.revealed) {
    call.revealed = true
    pushLine(draft, call, now, 'caller', lotteryReveal(call.secret))
    return true
  }
  return false
}

function talk(draft: Room, player: Player, call: Call, intent: Intent, uttered: L10n, now: number, raw: string) {
  if (call.status === 'hold') {
    call.status = 'active'
    call.holdAt = null
  }
  if (call.status !== 'active') return
  const table = call.isBait ? 'scambaiter' : call.personality
  let delta = DELTA[table][intent]
  if (/honk|ฮอนค์|เป็ดยาง|rubber duck/i.test(raw)) {
    if (call.isBait) delta -= 2
    else if (call.personality !== 'executive') delta += 4
  }
  call.trust = clampTrust(call.trust + delta)
  pushLine(draft, call, now, 'agent', uttered, { intent, playerId: player.id })
  player.said.push({ text: uttered, spice: spiceOf(raw), at: now })
  player.said = player.said.slice(-24)
  player.lastSayAt = now
  player.lastActivity = now
  if (call.trust <= 0) {
    failCall(draft, player, call, now, 'terminated', 'terminated')
    return
  }
  if (call.isBait && intent === 'ask_code') {
    pushLine(draft, call, now, 'caller', baitFake())
    call.trust = clampTrust(call.trust - 8)
    call.revealed = true
    if (call.trust <= 0) failCall(draft, player, call, now, 'terminated', 'terminated')
    return
  }
  if (intent === 'authority') call.authorityHits += 1
  const revealed = tryReveal(draft, call, intent, now)
  if (!revealed) {
    if (intent === 'ask_code') {
      call.askFails += 1
      if (call.askFails >= 4) call.trust = clampTrust(call.trust - 10)
    }
    const rng = makeRng(draft)
    pushLine(draft, call, now, 'caller', reactLine(call.isBait ? 'scambaiter' : call.personality, intent, delta >= 0, rng()))
    if (call.trust <= 0) failCall(draft, player, call, now, 'terminated', 'terminated')
  }
}

function blocked(draft: Room, playerId: string) {
  return appsBlocked(draft.viruses, playerId)
}

function spawnVirus(draft: Room, playerId: string, now: number, reason: 'random' | 'bait' | 'poke' | 'icon') {
  const player = findPlayer(draft, playerId)
  if (!player) return false
  if (player.virusSpawns >= 8) return false
  if (draft.viruses.filter((v) => v.playerId === playerId).length >= 4) return false
  const rng = makeRng(draft)
  const ad = VIRUS_ADS[Math.floor(rng() * VIRUS_ADS.length)] ?? VIRUS_ADS[0]
  draft.viruses.push({
    id: nid(draft, 'v'),
    playerId,
    title: ad.title,
    body: ad.body,
    fake: ad.fake,
    at: now,
    bred: false,
  })
  player.virusSpawns += 1
  pushFeed(draft, now, 'bad', say(`ไวรัสบุกจอ ${player.name}`, `A virus hopped onto ${player.name}'s screen`))
  if (reason === 'bait') setBoss(draft, now, 'bait')
  else setBoss(draft, now, 'virus')
  return true
}

export function applyAction(room: Room, playerId: string, action: Action, now: number): EngineResult {
  const actor = findPlayer(room, playerId)
  if (!actor) return fail('invalid', room)
  if (action.type === 'set_shift') {
    if (room.phase !== 'lobby') return fail('bad_phase', room)
    if (room.hostId !== playerId) return fail('not_host', room)
    const draft = structuredClone(room)
    draft.shiftSeconds = clampShift(action.seconds)
    return commit(draft)
  }
  if (action.type === 'play_again') {
    if (room.hostId !== playerId) return fail('not_host', room)
    if (room.phase !== 'fired' && room.phase !== 'review') return fail('bad_phase', room)
    const draft = structuredClone(room)
    draft.phase = 'lobby'
    draft.day = 1
    draft.quota = quotaForDay(1)
    draft.progress = 0
    draft.calls = []
    draft.viruses = []
    draft.boss = null
    draft.review = null
    draft.bonusShop = false
    draft.behindWarned = false
    draft.shiftEndsAt = null
    for (const player of draft.players) {
      player.bank = 0
      player.earned = 0
      player.unlocked = [...STARTER_APPS]
      player.said = []
      player.callsWon = 0
      player.callsLost = 0
      player.callsDodged = 0
      player.virusSpawns = 0
    }
    pushFeed(draft, now, 'info', say('กะใหม่ กระดานถูกลบ', 'Fresh shift. The board is wiped.'))
    return commit(draft)
  }
  if (action.type === 'next_day') {
    if (room.hostId !== playerId) return fail('not_host', room)
    if (room.phase !== 'review' || !room.review?.passed) return fail('bad_phase', room)
    const draft = structuredClone(room)
    draft.day += 1
    draft.quota = quotaForDay(draft.day)
    draft.phase = 'lobby'
    const started = startShift(draft, playerId, now)
    if (!started.ok) return fail(started.error, room)
    return started
  }
  if (action.type === 'start_shift') return startShift(room, playerId, now)
  if (action.type === 'end_shift') {
    if (room.phase !== 'shift') return fail('bad_phase', room)
    if (room.hostId !== playerId) return fail('not_host', room)
    return commit(finishShift(structuredClone(room), now))
  }
  if (action.type === 'buy') {
    if (room.phase === 'fired') return fail('bad_phase', room)
    if (!(SHOP_APPS as readonly string[]).includes(action.app)) return fail('invalid', room)
    const draft = structuredClone(room)
    const player = findPlayer(draft, playerId)
    if (!player) return fail('invalid', room)
    if (player.unlocked.includes(action.app)) return fail('invalid', room)
    const price = priceOf(action.app, draft.bonusShop && draft.phase === 'review')
    if (player.bank < price) return fail('cannot_afford', room)
    player.bank -= price
    player.unlocked.push(action.app)
    pushFeed(draft, now, 'good', say(`${player.name} ปลดล็อกแอปการ์ตูน`, `${player.name} unlocked a cartoon app`))
    return commit(draft)
  }
  if (action.type === 'quarantine') {
    const draft = structuredClone(room)
    const before = draft.viruses.length
    draft.viruses = draft.viruses.filter((v) => !(v.id === action.virusId && v.playerId === playerId))
    if (draft.viruses.length === before) return fail('invalid', room)
    const player = findPlayer(draft, playerId)
    if (player) player.lastActivity = now
    pushFeed(draft, now, 'good', say('กักกันสำเร็จ จอกลับมาหายใจ', 'Quarantined. The screen can breathe.'))
    return commit(draft)
  }
  if (action.type === 'virus_poke') {
    const draft = structuredClone(room)
    const virus = draft.viruses.find((v) => v.id === action.virusId && v.playerId === playerId)
    if (!virus) return fail('invalid', room)
    spawnVirus(draft, playerId, now, 'poke')
    return commit(draft)
  }

  if (room.phase !== 'shift') return fail('bad_phase', room)
  const draft = structuredClone(room)
  const player = findPlayer(draft, playerId)
  if (!player) return fail('invalid', room)
  player.lastActivity = now
  const call = liveCall(draft, playerId)

  if (action.type === 'answer') {
    if (!call || call.status !== 'ringing') return fail('no_call', room)
    call.status = 'active'
    call.startedAt = now
    const rng = makeRng(draft)
    pushLine(draft, call, now, 'caller', greetLine(call.personality, rng()))
    if (call.isBait) call.nextBaitDrop = now + 8000
    return commit(draft)
  }
  if (action.type === 'hold') {
    if (!call || (call.status !== 'active' && call.status !== 'hold')) return fail('no_call', room)
    if (call.status === 'hold') {
      call.status = 'active'
      call.holdAt = null
    } else {
      call.status = 'hold'
      call.holdAt = now
      if (!call.isBait && call.personality === 'executive') call.trust = clampTrust(call.trust - 10)
      else call.trust = clampTrust(call.trust - 2)
      setBoss(draft, now, 'hold')
      if (call.trust <= 0) failCall(draft, player, call, now, 'terminated', 'terminated')
    }
    return commit(draft)
  }
  if (action.type === 'hangup') {
    if (!call) return fail('no_call', room)
    if (call.status === 'ringing') {
      player.callsLost += 1
      endCall(call, now, 'missed', 1200)
      setBoss(draft, now, 'missed')
      return commit(draft)
    }
    const dur = call.startedAt ? now - call.startedAt : 0
    if (call.isBait && call.status !== 'ended' && dur < THRESHOLDS.baitDodgeMs && !call.completed) {
      player.earned += 100
      player.callsDodged += 1
      draft.progress += 100
      call.notice = { tone: 'good', text: say('รอดเบท +100', 'Dodged the bait +100') }
      pushFeed(draft, now, 'good', say(`${player.name} วางสายหนีเบท +100`, `${player.name} dodged a baiter +100`))
      endCall(call, now, 'dodged', 2200)
      return commit(draft)
    }
    if (!call.completed && call.status !== 'ended') {
      player.callsLost += 1
      endCall(call, now, 'failed', 1600)
      setBoss(draft, now, 'dropped')
      return commit(draft)
    }
    endCall(call, now, call.outcome ?? 'success', 800)
    return commit(draft)
  }
  if (action.type === 'say' || action.type === 'quick') {
    if (!call || (call.status !== 'active' && call.status !== 'hold')) return fail('no_call', room)
    if (action.type === 'say' && now - player.lastSayAt < 200) return fail('invalid', room)
    if (action.type === 'say') {
      const text = action.text.replace(/[\u0000-\u001f]/g, '').trim().slice(0, 180)
      if (!text) return fail('invalid', room)
      talk(draft, player, call, classify(text), { th: text, en: text }, now, text)
    } else {
      const intent = isIntent(action.intent) ? action.intent : 'confuse'
      const card = QUICK_REPLIES.find((q) => q.intent === intent)
      const label = card?.label ?? say(intent, intent)
      talk(draft, player, call, intent, label, now, label.en)
    }
    return commit(draft)
  }

  if (!call || call.status === 'ringing' || call.status === 'ended') return fail('no_call', room)
  if (blocked(draft, playerId)) return fail('locked', room)

  if (action.type === 'redeem_gift') {
    if (call.scenario !== 'giftcard') return fail('invalid', room)
    if (call.isBait) {
      call.trust = clampTrust(call.trust - 12)
      call.notice = { tone: 'bad', text: say('รหัสนี้กลิ่นทูลบาร์', 'That code smells like a toolbar.') }
      pushLine(draft, call, now, 'caller', baitFake())
      if (call.trust <= 0) failCall(draft, player, call, now, 'terminated', 'bait')
      return commit(draft)
    }
    if (!call.revealed) return fail('invalid', room)
    if (normalizeCode(action.code) !== normalizeCode(call.secret)) {
      call.wrongGuesses += 1
      call.trust = clampTrust(call.trust - 18)
      call.notice = { tone: 'bad', text: wrongLine() }
      pushLine(draft, call, now, 'caller', wrongLine())
      if (call.wrongGuesses >= 3 || call.trust <= 0) failCall(draft, player, call, now, 'terminated', 'terminated')
      return commit(draft)
    }
    const amount = 180 + Math.round(call.trust * 1.1)
    pay(draft, player, call, amount, now, say(`บัตรเป็ดเข้าโควต้า +${amount}`, `Duck voucher booked +${amount}`))
    return commit(draft)
  }

  if (action.type === 'memecoin_start') {
    if (!call.memecoin || call.scenario !== 'memecoin') return fail('invalid', room)
    if (call.memecoin.running) return fail('invalid', room)
    if (call.isBait) {
      call.memecoin.running = true
      call.memecoin.crashAt = call.memecoin.prices.length + 2
      call.memecoin.lastStep = now
      pushLine(draft, call, now, 'caller', say('เข้าให้แล้ว เดี๋ยวมันจามเอง', 'I bought in. It will sneeze itself.'))
      return commit(draft)
    }
    if (call.trust < THRESHOLDS.coin) {
      call.trust = clampTrust(call.trust - 6)
      call.notice = { tone: 'bad', text: say('เขายังไม่ยอมซื้อฮอนค์', 'They will not buy HONK yet.') }
      return commit(draft)
    }
    call.memecoin.running = true
    call.memecoin.lastStep = now
    pushLine(draft, call, now, 'caller', coinStart())
    return commit(draft)
  }

  if (action.type === 'memecoin_cashout') {
    if (!call.memecoin || !call.memecoin.running || call.memecoin.cashed) return fail('invalid', room)
    if (call.memecoin.crashed || call.isBait) {
      call.notice = { tone: 'bad', text: coinCrash() }
      return commit(draft)
    }
    const price = call.memecoin.prices[call.memecoin.prices.length - 1] ?? 10
    const amount = Math.max(20, Math.round(call.memecoin.stake * (price / 10)))
    call.memecoin.cashed = true
    pushLine(draft, call, now, 'caller', coinCash(amount))
    pay(draft, player, call, amount, now, say(`ฮอนค์เข้ากระเป๋า +${amount}`, `HONK cashed +${amount}`))
    return commit(draft)
  }

  if (action.type === 'verify_chunks') {
    if (call.scenario !== 'cardverify' || call.isBait) return fail('invalid', room)
    const guesses = Array.isArray(action.chunks) ? action.chunks.slice(0, 3) : []
    let gained = 0
    let wrong = false
    guesses.forEach((guess, i) => {
      if (call.verified[i]) return
      if (i >= call.revealedChunks) return
      if (!guess?.trim()) return
      if (normalizeCode(guess) === normalizeCode(call.chunks[i] ?? '')) {
        call.verified[i] = true
        gained += 80
        call.trust = clampTrust(call.trust + 6)
      } else {
        wrong = true
        call.trust = clampTrust(call.trust - 8)
      }
    })
    if (gained) {
      player.earned += gained
      draft.progress += gained
      pushFeed(draft, now, 'good', say(`${player.name} พยางค์ตรง +${gained}`, `${player.name} matched syllables +${gained}`))
    }
    const all = call.verified.every(Boolean)
    if (all) {
      const bonus = 120
      pushLine(draft, call, now, 'caller', say('ครบสามพยางค์ บิลการ์ตูนยิ้ม', 'All three syllables. The cartoon invoice smiles.'))
      pay(draft, player, call, bonus, now, say(`บิลครบ +${bonus}`, `Invoice complete +${bonus}`))
    } else {
      call.notice = {
        tone: wrong ? 'bad' : gained ? 'good' : 'info',
        text: wrong ? wrongLine() : say(gained ? `ตรงแล้ว +${gained}` : 'ยังไม่ครบพยางค์', gained ? `Matched +${gained}` : 'Syllables still missing'),
      }
      if (call.trust <= 0) failCall(draft, player, call, now, 'terminated', 'terminated')
    }
    return commit(draft)
  }

  if (action.type === 'anyviewer_connect') {
    if (call.scenario !== 'anyviewer' || !call.anyviewer) return fail('invalid', room)
    if (!player.unlocked.includes('anyviewer')) return fail('not_unlocked', room)
    if (call.isBait) {
      call.trust = clampTrust(call.trust - 10)
      spawnVirus(draft, playerId, now, 'bait')
      pushLine(draft, call, now, 'caller', say('ต่อจอให้แล้ว พร้อมทูลบาร์สิบสี่อัน', 'Connected, plus fourteen toolbars.'))
      if (call.trust <= 0) failCall(draft, player, call, now, 'terminated', 'bait')
      return commit(draft)
    }
    if (call.trust < THRESHOLDS.remote) {
      call.trust = clampTrust(call.trust - 8)
      pushLine(draft, call, now, 'caller', remoteDeny())
      return commit(draft)
    }
    call.anyviewer.connected = true
    pushLine(draft, call, now, 'caller', remoteOk())
    return commit(draft)
  }

  if (action.type === 'anyviewer_click') {
    if (!call.anyviewer?.connected) return fail('invalid', room)
    call.anyviewer.clicks += 1
    if (action.iconId === 'sticky') {
      call.anyviewer.found = true
      pushLine(draft, call, now, 'caller', remoteFound(call.anyviewer.pin))
    } else if (action.iconId === 'virus') {
      spawnVirus(draft, playerId, now, 'icon')
      call.trust = clampTrust(call.trust - 6)
    } else {
      call.trust = clampTrust(call.trust - 4)
      pushLine(draft, call, now, 'caller', remoteDecoy())
    }
    if (call.anyviewer.clicks >= 8 && !call.anyviewer.found) {
      call.trust = clampTrust(call.trust - 12)
      call.anyviewer.connected = false
    }
    if (call.trust <= 0) failCall(draft, player, call, now, 'terminated', 'terminated')
    return commit(draft)
  }

  if (action.type === 'anyviewer_submit') {
    if (!call.anyviewer?.found) return fail('invalid', room)
    if (normalizeCode(action.pin) !== normalizeCode(call.anyviewer.pin)) {
      call.trust = clampTrust(call.trust - 10)
      call.notice = { tone: 'bad', text: wrongLine() }
      if (call.trust <= 0) failCall(draft, player, call, now, 'terminated', 'terminated')
      return commit(draft)
    }
    pay(draft, player, call, 360, now, say('เจอเลขในโน้ต +360', 'Sticky-note number +360'))
    return commit(draft)
  }

  if (action.type === 'fine_submit') {
    if (call.scenario !== 'fine' || !call.revealed || call.isBait) return fail('invalid', room)
    if (normalizeCode(action.code) !== normalizeCode(call.secret)) {
      call.trust = clampTrust(call.trust - 16)
      call.notice = { tone: 'bad', text: wrongLine() }
      if (call.trust <= 0) failCall(draft, player, call, now, 'terminated', 'terminated')
      return commit(draft)
    }
    pay(draft, player, call, 460, now, say('ค่าปรับความฝันเข้าโควต้า +460', 'Dream-parking fine +460'))
    return commit(draft)
  }

  if (action.type === 'lottery_arm') {
    if (!call.lottery || call.scenario !== 'lottery' || !call.revealed) return fail('invalid', room)
    if (normalizeCode(action.code) !== normalizeCode(call.secret)) {
      call.trust = clampTrust(call.trust - 8)
      call.notice = { tone: 'bad', text: wrongLine() }
      return commit(draft)
    }
    call.lottery.armed = true
    call.notice = { tone: 'info', text: say('สลากพร้อมขูด สามช่อง', 'Ticket armed. Three panels.') }
    return commit(draft)
  }

  if (action.type === 'lottery_scratch') {
    if (!call.lottery?.armed || call.lottery.scratched >= 3) return fail('invalid', room)
    call.lottery.scratched += 1
    if (call.lottery.scratched >= 3 && !call.completed) {
      const sum = call.lottery.panels.reduce((a, b) => a + b, 0)
      const amount = call.lottery.jackpot ? 700 : sum
      if (amount <= 0) {
        call.notice = { tone: 'bad', text: say('ขูดแล้วได้ขนเป็ด', 'You scratched up duck fluff.') }
        pushLine(draft, call, now, 'caller', say('ว่างทุกช่อง โชคไปกินข้าว', 'Empty panels. Luck went to lunch.'))
        endCall(call, now, 'failed', 2400)
        player.callsLost += 1
      } else {
        pay(draft, player, call, amount, now, say(call.lottery.jackpot ? `แจ็กพอตการ์ตูน +${amount}` : `ขูดได้ +${amount}`, call.lottery.jackpot ? `Cartoon jackpot +${amount}` : `Scratch paid +${amount}`))
      }
    }
    return commit(draft)
  }

  return fail('invalid', room)
}

function finishShift(draft: Room, now: number) {
  const passed = draft.progress >= draft.quota
  const ratio = draft.quota ? draft.progress / draft.quota : 0
  if (passed) {
    for (const player of draft.players) player.bank += player.earned + 150
    draft.bonusShop = true
    draft.phase = 'review'
  } else {
    draft.bonusShop = false
    draft.phase = 'fired'
  }
  const ranks = [...draft.players]
    .sort((a, b) => b.earned - a.earned || b.callsWon - a.callsWon || a.name.localeCompare(b.name))
    .map((p, i) => ({
      place: i + 1,
      id: p.id,
      name: p.name,
      earned: p.earned,
      callsWon: p.callsWon,
      callsLost: p.callsLost,
      callsDodged: p.callsDodged,
      bank: p.bank,
    }))
  const quotes = draft.players
    .flatMap((p) => p.said.map((s) => ({ name: p.name, text: s.text, spice: s.spice, at: s.at })))
    .sort((a, b) => b.spice - a.spice || b.at - a.at)
    .slice(0, 6)
  draft.review = {
    passed,
    quota: draft.quota,
    progress: draft.progress,
    ranks,
    quotes,
    bossKey: passed ? (ratio >= 1.35 ? 'proud' : 'ok') : 'fired',
  }
  draft.calls = []
  draft.viruses = []
  draft.boss = null
  draft.shiftEndsAt = null
  pushFeed(draft, now, passed ? 'good' : 'bad', passed ? REVIEW_BOSS[draft.review.bossKey] : REVIEW_BOSS.fired)
  return draft
}

function patienceMs(room: Room) {
  if (room.e2e) return 45_000
  return Math.max(10_000, 18_000 - (room.day - 1) * 1500)
}

export function tickRoom(room: Room, now: number): Room {
  if (room.phase !== 'shift' || room.shiftEndsAt == null) return room
  let draft = room
  let cursor = room.lastTickAt
  let changed = false
  const limit = Math.min(now, room.shiftEndsAt)
  let guard = 0
  while (cursor + 1000 <= limit && guard < 900) {
    guard += 1
    cursor += 1000
    const stepped = stepSecond(draft, cursor)
    if (stepped !== draft) {
      draft = stepped
      changed = true
    }
  }
  if (now >= room.shiftEndsAt && draft.phase === 'shift') {
    draft = finishShift(draft === room ? structuredClone(draft) : draft, now)
    changed = true
  }
  if (!changed) {
    if (cursor === room.lastTickAt) return room
    return { ...room, lastTickAt: cursor }
  }
  draft.lastTickAt = Math.max(cursor, draft.lastTickAt)
  draft.revision += 1
  return draft
}

function stepSecond(room: Room, now: number): Room {
  const draft = structuredClone(room)
  let changed = false
  const mark = () => {
    changed = true
  }

  for (const call of draft.calls) {
    if (call.status === 'ringing' && now - call.ringAt >= patienceMs(draft)) {
      const player = findPlayer(draft, call.playerId)
      if (player) player.callsLost += 1
      endCall(call, now, 'missed', 1500)
      pushLine(draft, call, now, 'system', missedLine())
      setBoss(draft, now, 'missed')
      mark()
    }
  }

  const kept: Call[] = []
  for (const call of draft.calls) {
    if (call.status === 'ended' && call.clearAt && now >= call.clearAt) {
      const player = findPlayer(draft, call.playerId)
      if (player) player.nextRingAt = now + 5000
      mark()
      continue
    }
    kept.push(call)
  }
  draft.calls = kept

  for (const player of draft.players) {
    if (!liveCall(draft, player.id) && now >= player.nextRingAt) {
      spawnInto(draft, player.id, now, false)
      mark()
    }
  }

  for (const call of [...draft.calls]) {
    if (call.status !== 'active' && call.status !== 'hold') continue
    const player = findPlayer(draft, call.playerId)
    if (!player || !call.startedAt) continue
    const dur = now - call.startedAt
    if (call.isBait && !call.baitSuspected && dur >= THRESHOLDS.baitSuspectMs) {
      call.baitSuspected = true
      mark()
    }
    if (call.isBait && call.status === 'active' && call.nextBaitDrop && now >= call.nextBaitDrop) {
      call.trust = clampTrust(call.trust - (4 + draft.day))
      call.nextBaitDrop = now + 4000
      if (call.trust <= 0) failCall(draft, player, call, now, 'terminated', 'bait')
      mark()
    }
    if (call.isBait && !call.baitVirusFired && dur >= THRESHOLDS.baitVirusMs) {
      call.baitVirusFired = true
      spawnVirus(draft, player.id, now, 'bait')
      mark()
    }
    if (!call.isBait && call.personality === 'executive' && call.status === 'active' && !call.completed && dur > 52_000) {
      pushLine(draft, call, now, 'caller', walkedLine())
      failCall(draft, player, call, now, 'failed', 'dropped')
      mark()
    }
    if (call.status === 'hold' && call.holdAt && !call.holdWarned && now - call.holdAt > 12_000) {
      call.holdWarned = true
      setBoss(draft, now, 'hold')
      mark()
    }
    if (call.memecoin?.running && !call.memecoin.crashed && !call.memecoin.cashed && call.status === 'active') {
      const rng = makeRng(draft)
      const last = call.memecoin.prices[call.memecoin.prices.length - 1] ?? 10
      const drift = 0.05 + rng() * 0.2
      const price = Math.round(last * (1 + drift) * 10) / 10
      call.memecoin.prices.push(price)
      call.memecoin.lastStep = now
      if (call.memecoin.prices.length >= call.memecoin.crashAt) {
        call.memecoin.crashed = true
        call.trust = clampTrust(call.trust - 24)
        pushLine(draft, call, now, 'caller', coinCrash())
        call.notice = { tone: 'bad', text: coinCrash() }
        if (call.trust <= 0) failCall(draft, player, call, now, 'terminated', 'terminated')
      }
      mark()
    }
  }

  if (draft.boss && now >= draft.boss.until) {
    draft.boss = null
    mark()
  }

  const total = draft.shiftSeconds * 1000
  const elapsed = now - draft.shiftStartedAt
  if (!draft.behindWarned && total > 0 && elapsed > total * 0.5 && draft.progress < draft.quota * 0.35) {
    draft.behindWarned = true
    setBoss(draft, now, 'behind')
    mark()
  }

  for (const player of draft.players) {
    const live = liveCall(draft, player.id)
    if (!live && now - player.lastActivity > 28_000) {
      setBoss(draft, now, 'idle')
      player.lastActivity = now
      mark()
    }
  }

  for (const virus of [...draft.viruses]) {
    if (!virus.bred && now - virus.at > 18_000) {
      virus.bred = true
      spawnVirus(draft, virus.playerId, now, 'random')
      mark()
    }
  }

  if (!draft.e2e && !draft.script && now - draft.shiftStartedAt > 20_000) {
    const rng = makeRng(draft)
    const roll = rng()
    mark()
    if (roll < 0.012) {
      const pool = draft.players.filter((p) => p.virusSpawns < 8 && draft.viruses.filter((v) => v.playerId === p.id).length < 4)
      const target = pool[Math.floor(rng() * pool.length)]
      if (target) spawnVirus(draft, target.id, now, 'random')
    }
  }

  return changed ? draft : room
}

export function redactRoom(room: Room): Room {
  const copy = structuredClone(room)
  copy.rngSeed = 0
  copy.script = undefined
  for (const call of copy.calls) {
    if (!(call.revealed || (call.isBait && call.baitSuspected))) call.secret = ''
    call.chunks = call.chunks.map((chunk, i) => (i < call.revealedChunks ? chunk : ''))
    if (call.memecoin) call.memecoin.crashAt = 0
    if (call.anyviewer && !call.anyviewer.found) call.anyviewer.pin = ''
    if (call.lottery) {
      call.lottery.panels = call.lottery.panels.map((panel, i) => (i < call.lottery!.scratched ? panel : -1))
    }
    if (!(call.baitSuspected || call.status === 'ended')) call.isBait = false
    call.nextBaitDrop = 0
  }
  return copy
}

export function markDisconnect(room: Room, playerId: string, now: number): Room {
  const player = findPlayer(room, playerId)
  if (!player || !player.connected) return room
  const draft = structuredClone(room)
  const gone = findPlayer(draft, playerId)
  if (!gone) return room
  gone.connected = false
  gone.disconnectedAt = now
  if (draft.hostId === playerId) {
    const next = draft.players.find((p) => p.connected && p.id !== playerId)
    if (next) {
      for (const p of draft.players) p.isHost = p.id === next.id
      draft.hostId = next.id
    }
  }
  draft.revision += 1
  return draft
}

export function latestCall(room: Room, playerId: string) {
  const mine = room.calls.filter((c) => c.playerId === playerId)
  return mine[mine.length - 1]
}

export { REVIEW_BOSS }
