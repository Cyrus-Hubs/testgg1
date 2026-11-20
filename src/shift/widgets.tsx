import { useEffect, useState } from 'react'
import type { Call, Room } from '@shared/types'
import { formatClock, moodOf, PANIC_MS } from '@shared/constants'
import { dict } from '../i18n/dict'
import { useI18n } from '../i18n/context'
import { latestCall } from '@shared/engine'

export function meOf(room: Room, playerId: string | null) {
  return room.players.find((p) => p.id === playerId) ?? null
}

export function callOf(room: Room, playerId: string | null) {
  if (!playerId) return undefined
  return latestCall(room, playerId)
}

export function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [active])
  return now
}

export function remaining(room: Room, now: number) {
  if (!room.shiftEndsAt) return 0
  return Math.max(0, room.shiftEndsAt - now)
}

export function panic(room: Room, now: number) {
  return room.phase === 'shift' && remaining(room, now) <= PANIC_MS && remaining(room, now) > 0
}

export function Clock({ room, now, big }: { room: Room; now: number; big?: boolean }) {
  const { t } = useI18n()
  const left = remaining(room, now)
  const hot = panic(room, now)
  return (
    <div className={`font-display tabular-nums ${big ? 'text-2xl' : 'text-lg'} ${hot ? 'text-hot' : 'text-acid'}`}>
      {hot ? <span className="mr-2 text-[10px] tracking-widest">{t(dict.dayEnds)}</span> : null}
      <span data-testid="countdown">{formatClock(left)}</span>
    </div>
  )
}

export function QuotaReadout({ room }: { room: Room }) {
  const pct = Math.min(100, Math.round((room.progress / Math.max(1, room.quota)) * 100))
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-2 font-display text-xs">
        <span data-testid="quota-progress">{room.progress}</span>
        <span className="text-white/70">/ {room.quota}</span>
      </div>
      <div className="mt-1 h-2 bg-black/40">
        <div className={`h-full ${pct >= 100 ? 'bg-acid' : 'bg-yolk'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function TrustReadout({ call, tagged }: { call?: Call; tagged?: boolean }) {
  const { t } = useI18n()
  const trust = call && call.status !== 'ringing' ? call.trust : null
  const mood = trust == null ? null : moodOf(trust)
  return (
    <div className="min-w-[92px]">
      <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-wide text-white/70">
        <span>{t(dict.trust)}</span>
        {mood ? (
          <span data-testid={tagged ? 'mood' : undefined} data-mood={mood}>
            {t(dict.moods[mood])}
          </span>
        ) : null}
      </div>
      <div className="font-display text-xl tabular-nums">
        {trust == null ? '—' : <span data-testid={tagged ? 'trust-value' : undefined}>{trust}</span>}
        {trust == null ? null : '%'}
      </div>
      <div className="h-2 bg-black/40">
        <div
          className={`h-full ${mood === 'furious' ? 'bg-hot' : mood === 'suspicious' ? 'bg-orange-400' : mood === 'trusting' ? 'bg-acid' : 'bg-yolk'}`}
          style={{ width: `${trust ?? 0}%` }}
        />
      </div>
    </div>
  )
}

export function Notice({ call }: { call?: Call }) {
  const { t } = useI18n()
  if (!call?.notice) return null
  const tone = call.notice.tone === 'good' ? 'text-emerald-800' : call.notice.tone === 'bad' ? 'text-hot' : 'text-ink'
  return <p className={`mt-2 text-sm font-semibold ${tone}`}>{t(call.notice.text)}</p>
}
