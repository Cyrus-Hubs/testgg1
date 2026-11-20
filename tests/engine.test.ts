import { describe, expect, it } from 'vitest'
import { classify } from '../shared/classify'
import { DELTA, moodOf, quotaForDay } from '../shared/constants'
import { applyAction, createLobby, joinRoom, redactRoom, startShift, tickRoom } from '../shared/engine'
import { callerSystemPrompt } from '../shared/llm'
import type { Action, Room } from '../shared/types'
import { Hub } from '../server/hub'

function must(result: { ok: boolean; room?: Room; error?: string }) {
  if (!result.ok || !result.room) throw new Error(result.error || 'fail')
  return result.room
}

function boot(extra: Parameters<typeof createLobby>[0] = { name: 'Bee', now: 1000 }) {
  const created = createLobby({ code: 'ROOM01', seed: 11, ...extra, name: extra.name ?? 'Bee', now: extra.now ?? 1000 })
  if (!created.ok || !created.playerId || !created.room) throw new Error(created.error)
  const room = must(startShift(created.room, created.playerId, extra.now ?? 1000))
  return { room, id: created.playerId }
}

function act(room: Room, id: string, action: Action, now: number) {
  return must(applyAction(room, id, action, now))
}

describe('classify and mood', () => {
  it('reads Thai and English intents', () => {
    expect(classify('คุณน่ารักมากเลย')).toBe('flattery')
    expect(classify('please hurry this is urgent')).toBe('urgency')
    expect(classify('this is official department policy')).toBe('authority')
    expect(classify('hello สวัสดี')).toBe('greet')
    expect(classify('you are stupid')).toBe('insult')
    expect(classify('relax you are safe')).toBe('reassure')
    expect(classify('read the code please')).toBe('ask_code')
    expect(classify('asdfgh')).toBe('confuse')
    expect(classify('')).toBe('confuse')
  })

  it('bins the trust meter', () => {
    expect(moodOf(80)).toBe('trusting')
    expect(moodOf(79)).toBe('neutral')
    expect(moodOf(55)).toBe('neutral')
    expect(moodOf(54)).toBe('suspicious')
    expect(moodOf(25)).toBe('suspicious')
    expect(moodOf(24)).toBe('furious')
    expect(moodOf(0)).toBe('furious')
  })

  it('keeps the caller prompt fictional', () => {
    expect(callerSystemPrompt('th')).toMatch(/cartoon|duck|fiction|HONK/i)
    expect(callerSystemPrompt('en')).toMatch(/cartoon|duck|HONK/i)
  })
})

describe('shift economy', () => {
  it('raises trust, redeems a duck voucher, and hides secrets until then', () => {
    const { room: start, id } = boot({ name: 'Bee', now: 1000, e2e: true, code: 'ROOM01', seed: 11 })
    expect(redactRoom(start).calls[0]?.secret).toBe('')
    const snap = structuredClone(start)
    let room = act(start, id, { type: 'answer' }, 1500)
    expect(start.calls[0]?.status).toBe(snap.calls[0]?.status)
    const trust0 = room.calls[0]?.trust ?? 0
    room = act(room, id, { type: 'quick', intent: 'flattery' }, 2000)
    expect(room.calls[0]?.trust).toBe(trust0 + DELTA.grandma.flattery)
    room = act(room, id, { type: 'quick', intent: 'ask_code' }, 2500)
    const secret = room.calls[0]?.secret ?? ''
    expect(secret).toMatch(/^DUCK-/)
    expect(room.calls[0]?.transcript.some((line) => line.text.en.includes(secret))).toBe(true)
    expect(redactRoom(room).calls[0]?.secret).toBe(secret)
    const wrong = act(room, id, { type: 'redeem_gift', code: 'nope' }, 2600)
    expect(wrong.progress).toBe(0)
    expect(wrong.calls[0]?.trust).toBeLessThan(room.calls[0]?.trust ?? 100)
    room = act(room, id, { type: 'redeem_gift', code: secret.toLowerCase() }, 3000)
    expect(room.progress).toBeGreaterThan(200)
    room = act(room, id, { type: 'end_shift' }, 4000)
    expect(room.phase).toBe('fired')
    expect(room.review?.quotes.length).toBeGreaterThan(0)
  })

  it('passes quota, opens the bonus aisle, and advances the day', () => {
    const { room: start, id } = boot({ name: 'Bee', now: 1000, e2e: true, quota: 100, code: 'PASS01', seed: 4 })
    let room = act(start, id, { type: 'answer' }, 1200)
    room = act(room, id, { type: 'quick', intent: 'flattery' }, 1400)
    room = act(room, id, { type: 'quick', intent: 'ask_code' }, 1600)
    room = act(room, id, { type: 'redeem_gift', code: room.calls[0]?.secret ?? '' }, 1800)
    room = act(room, id, { type: 'end_shift' }, 2000)
    expect(room.phase).toBe('review')
    expect(room.review?.passed).toBe(true)
    expect(room.bonusShop).toBe(true)
    expect(room.players[0]?.bank).toBeGreaterThan(room.progress)
    room = act(room, id, { type: 'next_day' }, 3000)
    expect(room.day).toBe(2)
    expect(room.phase).toBe('shift')
    expect(room.quota).toBe(quotaForDay(2))
  })

  it('terminates a call at zero trust', () => {
    const { room: start, id } = boot({ name: 'Bee', now: 1000, script: 'grandma', e2e: false, code: 'MAD001', seed: 9 })
    let room = act(start, id, { type: 'answer' }, 1100)
    let guard = 0
    while ((room.calls[0]?.trust ?? 0) > 0 && guard < 8) {
      guard += 1
      room = act(room, id, { type: 'quick', intent: 'insult' }, 1100 + guard * 100)
    }
    expect(room.calls[0]?.outcome).toBe('terminated')
    expect(room.calls[0]?.trust).toBe(0)
  })

  it('cashes HONK before the sneeze and loses it after', () => {
    const { room: start, id } = boot({ name: 'Bee', now: 5000, script: 'coin', code: 'COIN01', seed: 2 })
    let room = act(start, id, { type: 'answer' }, 5200)
    room = act(room, id, { type: 'memecoin_start' }, 5400)
    room = tickRoom(room, 5400 + 3000)
    expect(room.calls[0]?.memecoin?.crashed).toBe(false)
    expect((room.calls[0]?.memecoin?.prices.length ?? 0) > 1).toBe(true)
    room = act(room, id, { type: 'memecoin_cashout' }, 9000)
    expect(room.progress).toBeGreaterThan(0)

    const again = boot({ name: 'Bee', now: 5000, script: 'coin', code: 'COIN02', seed: 3 })
    let crashed = act(again.room, again.id, { type: 'answer' }, 5100)
    crashed = act(crashed, again.id, { type: 'memecoin_start' }, 5200)
    crashed = tickRoom(crashed, 5200 + 20_000)
    expect(crashed.calls[0]?.memecoin?.crashed).toBe(true)
    const before = crashed.progress
    crashed = act(crashed, again.id, { type: 'memecoin_cashout' }, 26000)
    expect(crashed.progress).toBe(before)
  })

  it('checks invoice syllables and a dream-parking code', () => {
    const card = boot({ name: 'Bee', now: 1000, script: 'card', code: 'CARD01', seed: 6 })
    let room = act(card.room, card.id, { type: 'answer' }, 1100)
    room = act(room, card.id, { type: 'quick', intent: 'ask_code' }, 1200)
    room = act(room, card.id, { type: 'quick', intent: 'ask_code' }, 1300)
    room = act(room, card.id, { type: 'quick', intent: 'ask_code' }, 1400)
    expect(room.calls[0]?.revealedChunks).toBe(3)
    room = act(room, card.id, { type: 'verify_chunks', chunks: room.calls[0]?.chunks ?? [] }, 1500)
    expect(room.progress).toBeGreaterThan(0)

    const fine = boot({ name: 'Bee', now: 1000, script: 'fine', code: 'FINE01', seed: 8 })
    let desk = act(fine.room, fine.id, { type: 'answer' }, 1100)
    desk = act(desk, fine.id, { type: 'quick', intent: 'ask_code' }, 1200)
    expect(desk.calls[0]?.revealed).toBe(false)
    desk = act(desk, fine.id, { type: 'quick', intent: 'authority' }, 1300)
    desk = act(desk, fine.id, { type: 'quick', intent: 'ask_code' }, 1400)
    expect(desk.calls[0]?.revealed).toBe(true)
    const secret = desk.calls[0]?.secret ?? ''
    desk = act(desk, fine.id, { type: 'fine_submit', code: secret }, 1500)
    expect(desk.progress).toBe(460)
  })

  it('scratches a ticket and finds a sticky note', () => {
    const lot = boot({ name: 'Bee', now: 1000, script: 'lottery', code: 'LOT001', seed: 12 })
    let room = act(lot.room, lot.id, { type: 'answer' }, 1100)
    room = act(room, lot.id, { type: 'quick', intent: 'ask_code' }, 1200)
    const secret = room.calls[0]?.secret ?? ''
    const expected = room.calls[0]?.lottery?.jackpot ? 700 : room.calls[0]?.lottery?.panels.reduce((sum, n) => sum + n, 0) ?? 0
    room = act(room, lot.id, { type: 'lottery_arm', code: secret }, 1300)
    room = act(room, lot.id, { type: 'lottery_scratch' }, 1400)
    room = act(room, lot.id, { type: 'lottery_scratch' }, 1500)
    room = act(room, lot.id, { type: 'lottery_scratch' }, 1600)
    expect(room.progress).toBe(expected)

    const remote = boot({ name: 'Bee', now: 1000, script: 'remote', code: 'VIEW01', seed: 15 })
    const locked = applyAction(remote.room, remote.id, { type: 'anyviewer_connect' }, 1100)
    expect(locked.ok).toBe(false)
  })

  it('lets a funded desk connect and submit the note', () => {
    const created = createLobby({ name: 'Bee', now: 1000, script: 'remote', code: 'VIEW02', seed: 16 })
    if (!created.ok || !created.room || !created.playerId) throw new Error('create')
    created.room.players[0]!.bank = 500
    let room = must(startShift(created.room, created.playerId, 1000))
    room = act(room, created.playerId, { type: 'buy', app: 'anyviewer' }, 1050)
    room = act(room, created.playerId, { type: 'answer' }, 1100)
    room = act(room, created.playerId, { type: 'anyviewer_connect' }, 1200)
    expect(room.calls[0]?.anyviewer?.connected).toBe(true)
    room = act(room, created.playerId, { type: 'anyviewer_click', iconId: 'sticky' }, 1300)
    const pin = room.calls[0]?.anyviewer?.pin ?? ''
    expect(pin).not.toBe('')
    expect(redactRoom(room).calls[0]?.anyviewer?.pin).toBe(pin)
    room = act(room, created.playerId, { type: 'anyviewer_submit', pin }, 1400)
    expect(room.progress).toBe(360)
  })

  it('punishes staying with a baiter and pays for hanging up', () => {
    const hung = boot({ name: 'Bee', now: 1000, script: 'bait', code: 'BAIT01', seed: 21 })
    let room = act(hung.room, hung.id, { type: 'answer' }, 1500)
    room = act(room, hung.id, { type: 'hangup' }, 2000)
    expect(room.progress).toBe(100)
    expect(room.calls[0]?.outcome).toBe('dodged')

    const stayed = boot({ name: 'Bee', now: 1000, script: 'bait', code: 'BAIT02', seed: 22 })
    let long = act(stayed.room, stayed.id, { type: 'answer' }, 2000)
    long = tickRoom(long, 2000 + 41_000)
    expect(long.viruses.length).toBeGreaterThan(0)
    const id = long.viruses[0]?.id ?? ''
    long = act(long, stayed.id, { type: 'quarantine', virusId: id }, 44000)
    expect(long.viruses.some((virus) => virus.id === id)).toBe(false)
  })

  it('fires the room when the clock runs out under quota', () => {
    const created = createLobby({ name: 'Bee', now: 1000, shiftSeconds: 60, e2e: true, code: 'TIME01', seed: 1 })
    if (!created.ok || !created.room || !created.playerId) throw new Error('create')
    let room = must(startShift(created.room, created.playerId, 1000))
    room = tickRoom(room, room.shiftEndsAt ?? 0)
    expect(room.phase).toBe('fired')
    room = act(room, created.playerId, { type: 'play_again' }, 99999)
    expect(room.phase).toBe('lobby')
    expect(room.day).toBe(1)
    expect(room.players[0]?.bank).toBe(0)
  })
})

describe('rooms', () => {
  it('shares quota between players and refuses a ninth', () => {
    const created = createLobby({ name: 'A', now: 1, e2e: true, code: 'TEAM01', seed: 40 })
    if (!created.ok || !created.room || !created.playerId) throw new Error('create')
    let room = created.room
    let latest = room
    for (let i = 0; i < 7; i++) {
      const joined = joinRoom(latest, `P${i}`, 10 + i)
      expect(joined.ok).toBe(true)
      latest = joined.room!
    }
    expect(latest.players).toHaveLength(8)
    expect(joinRoom(latest, 'Nope', 30).ok).toBe(false)
    room = must(startShift(latest, created.playerId, 100))
    expect(room.calls).toHaveLength(8)
    const ranks = [...room.players].sort((a, b) => b.earned - a.earned)
    expect(ranks[0]?.earned).toBe(0)
    const first = room.players[0]!
    let next = act(room, first.id, { type: 'answer' }, 120)
    next = act(next, first.id, { type: 'quick', intent: 'flattery' }, 140)
    next = act(next, first.id, { type: 'quick', intent: 'ask_code' }, 160)
    next = act(next, first.id, { type: 'redeem_gift', code: next.calls.find((call) => call.playerId === first.id)?.secret ?? '' }, 180)
    expect(next.progress).toBeGreaterThan(0)
    const second = next.players[1]!
    let other = act(next, second.id, { type: 'answer' }, 200)
    other = act(other, second.id, { type: 'quick', intent: 'flattery' }, 220)
    other = act(other, second.id, { type: 'quick', intent: 'ask_code' }, 240)
    const before = other.progress
    other = act(other, second.id, { type: 'redeem_gift', code: other.calls.find((call) => call.playerId === second.id)?.secret ?? '' }, 260)
    expect(other.progress).toBeGreaterThan(before)
    expect(applyAction(other, second.id, { type: 'start_shift' }, 300).ok).toBe(false)
  })

  it('runs the hub for create, join, start, and rejoin', () => {
    const hub = new Hub()
    const host = hub.create({ name: 'Hosty', now: 1, shiftSeconds: 120, e2e: true })
    if (!host.ok) throw new Error(host.error)
    expect(host.room.code).toMatch(/^[A-Z0-9]{6}$/)
    const guest = hub.join(host.room.code, 'Joiny', 2)
    if (!guest.ok) throw new Error(guest.error)
    expect(guest.room.players).toHaveLength(2)
    const started = hub.action(host.playerId, { type: 'start_shift' }, 3)
    if (!started.ok) throw new Error(started.error)
    expect(started.room.phase).toBe('shift')
    expect(started.room.calls.length).toBe(2)
    const dropped = hub.disconnect(host.playerId, 4)
    expect(dropped?.hostId).not.toBe(host.playerId)
    const back = hub.rejoin(host.room.code, host.playerId, 5)
    expect(back.ok).toBe(true)
  })
})
