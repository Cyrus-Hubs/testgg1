import { applyAction, createLobby, joinRoom, markDisconnect, redactRoom, startShift, tickRoom } from '../shared/engine'
import type { Action, Room } from '../shared/types'
import type { CreateOpts } from '../shared/engine'

export interface HubOk {
  ok: true
  playerId: string
  room: Room
}

export interface HubErr {
  ok: false
  error: string
  room?: Room
  playerId?: string
}

export type HubResult = HubOk | HubErr

function errorOf(result: { ok: boolean; error?: string }) {
  return result.ok ? 'invalid' : result.error || 'invalid'
}

export class Hub {
  rooms = new Map<string, Room>()
  byPlayer = new Map<string, string>()

  private store(room: Room, playerId?: string) {
    this.rooms.set(room.code, room)
    if (playerId) this.byPlayer.set(playerId, room.code)
  }

  private publicRoom(room: Room): Room {
    return redactRoom(room)
  }

  solo(opts: CreateOpts): HubResult {
    const created = createLobby(opts)
    if (!created.ok || !created.room || !created.playerId) return { ok: false, error: errorOf(created) }
    const started = startShift(created.room, created.playerId, opts.now)
    if (!started.ok || !started.room) return { ok: false, error: errorOf(started) }
    this.store(started.room, created.playerId)
    return { ok: true, playerId: created.playerId, room: this.publicRoom(started.room) }
  }

  create(opts: CreateOpts): HubResult {
    for (let i = 0; i < 8; i++) {
      const seed = (opts.seed ?? Math.floor(Math.random() * 1e9) + 1) + i * 997
      const created = createLobby({ ...opts, seed, code: opts.code && i === 0 ? opts.code : undefined })
      if (!created.ok || !created.room || !created.playerId) return { ok: false, error: errorOf(created) }
      if (this.rooms.has(created.room.code)) continue
      this.store(created.room, created.playerId)
      return { ok: true, playerId: created.playerId, room: this.publicRoom(created.room) }
    }
    return { ok: false, error: 'invalid' }
  }

  join(code: string, name: string, now: number): HubResult {
    const room = this.rooms.get(code.toUpperCase())
    if (!room) return { ok: false, error: 'room_not_found' }
    const joined = joinRoom(room, name, now)
    if (!joined.ok || !joined.room || !joined.playerId) return { ok: false, error: errorOf(joined), room: this.publicRoom(room) }
    this.store(joined.room, joined.playerId)
    return { ok: true, playerId: joined.playerId, room: this.publicRoom(joined.room) }
  }

  rejoin(code: string, playerId: string, now: number): HubResult {
    const room = this.rooms.get(code.toUpperCase())
    if (!room) return { ok: false, error: 'room_gone' }
    const player = room.players.find((p) => p.id === playerId)
    if (!player) return { ok: false, error: 'room_gone' }
    const draft = structuredClone(room)
    const me = draft.players.find((p) => p.id === playerId)
    if (!me) return { ok: false, error: 'room_gone' }
    me.connected = true
    me.disconnectedAt = 0
    if (!draft.players.some((p) => p.id === draft.hostId && p.connected)) {
      for (const p of draft.players) p.isHost = p.id === me.id
      draft.hostId = me.id
      me.isHost = true
    }
    draft.revision += 1
    this.store(draft, playerId)
    return { ok: true, playerId, room: this.publicRoom(draft) }
  }

  action(playerId: string, action: Action, now: number): HubResult {
    const code = this.byPlayer.get(playerId)
    const room = code ? this.rooms.get(code) : undefined
    if (!room) return { ok: false, error: 'room_gone' }
    const next = applyAction(room, playerId, action, now)
    if (!next.room) return { ok: false, error: next.ok ? 'invalid' : next.error }
    if (next.room !== room) this.rooms.set(next.room.code, next.room)
    if (!next.ok) return { ok: false, error: next.error, room: this.publicRoom(next.room), playerId }
    return { ok: true, playerId, room: this.publicRoom(next.room) }
  }

  disconnect(playerId: string, now: number) {
    const code = this.byPlayer.get(playerId)
    if (!code) return null
    const room = this.rooms.get(code)
    if (!room) return null
    const next = markDisconnect(room, playerId, now)
    if (next !== room) this.rooms.set(code, next)
    return next === room ? null : redactRoom(next)
  }

  tick(now: number) {
    const dirty: Room[] = []
    for (const [code, room] of this.rooms) {
      if (room.players.every((p) => !p.connected) && now - (room.players[0]?.disconnectedAt || now) > 10 * 60 * 1000) {
        this.rooms.delete(code)
        continue
      }
      const next = tickRoom(room, now)
      if (next !== room) this.rooms.set(code, next)
      if (next.revision !== room.revision) dirty.push(redactRoom(next))
    }
    return dirty
  }

  raw(code: string) {
    return this.rooms.get(code)
  }

  codeFor(playerId: string) {
    return this.byPlayer.get(playerId) ?? null
  }
}
