import { useEffect, useState } from 'react'
import type { Action, Room } from '@shared/types'
import { BOSS } from '@shared/lines'
import { dict } from '../i18n/dict'
import { LangSwitch, useI18n } from '../i18n/context'
import { useSettings } from '../settings'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../components/ui/dialog'
import { ChaosLog, Market, Notes, PaintApp, RankBoard, ScamApps, SettingsPanel } from './apps'
import { Phone } from './Phone'
import { VirusLayer } from './VirusLayer'
import { Clock, QuotaReadout, callOf, meOf, panic, useNow } from './widgets'

type WinId = 'phone' | 'apps' | 'market' | 'notes' | 'paint' | 'rank' | 'chaos' | 'settings'

const START: Record<WinId, { x: number; y: number; w: number; h: number }> = {
  phone: { x: 112, y: 28, w: 420, h: 620 },
  apps: { x: 560, y: 36, w: 420, h: 560 },
  market: { x: 620, y: 80, w: 400, h: 480 },
  notes: { x: 180, y: 80, w: 380, h: 420 },
  paint: { x: 240, y: 90, w: 520, h: 420 },
  rank: { x: 980, y: 28, w: 300, h: 360 },
  chaos: { x: 980, y: 400, w: 300, h: 240 },
  settings: { x: 300, y: 120, w: 420, h: 460 },
}

export function Desktop({ room, playerId, act }: { room: Room; playerId: string; act: (action: Action) => void }) {
  const { t, lang } = useI18n()
  const { settings, update } = useSettings()
  const me = meOf(room, playerId)
  const call = callOf(room, playerId)
  const now = useNow(true)
  const hot = panic(room, now)
  const [open, setOpen] = useState<Record<WinId, boolean>>({
    phone: true,
    apps: false,
    market: false,
    notes: false,
    paint: false,
    rank: true,
    chaos: false,
    settings: false,
  })
  const [pos, setPos] = useState(START)
  const [z, setZ] = useState<Record<WinId, number>>({ phone: 5, apps: 2, market: 2, notes: 2, paint: 2, rank: 3, chaos: 2, settings: 2 })
  const [focus, setFocus] = useState<WinId>('phone')
  const [confirm, setConfirm] = useState(false)
  const [menu, setMenu] = useState(false)
  useEffect(() => {
    if (call?.status !== 'ringing') return
    setOpen((prev) => ({ ...prev, phone: true }))
    setFocus('phone')
    setZ((prev) => ({ ...prev, phone: Math.max(...Object.values(prev)) + 1 }))
  }, [call?.id, call?.status])
  if (!me) return null
  const focusWin = (id: WinId) => {
    setFocus(id)
    setZ((prev) => ({ ...prev, [id]: Math.max(...Object.values(prev)) + 1 }))
    setOpen((prev) => ({ ...prev, [id]: true }))
    setMenu(false)
  }
  const icons: { id: WinId; glyph: string; label: string; test?: string }[] = [
    { id: 'phone', glyph: '☎', label: t(dict.tabs.phone) },
    { id: 'apps', glyph: '🦆', label: t(dict.tabs.apps), test: 'icon-giftcard' },
    { id: 'market', glyph: '▤', label: 'Scamazon' },
    { id: 'notes', glyph: '✎', label: t(dict.notesTitle) },
    { id: 'paint', glyph: '◉', label: t(dict.paint) },
    { id: 'rank', glyph: '★', label: t(dict.rank) },
    { id: 'chaos', glyph: '!', label: t(dict.chaos) },
    { id: 'settings', glyph: '⚙', label: t(dict.settings) },
  ]
  return (
    <div data-testid="desktop" className={`desktop-bg relative h-dvh max-w-full overflow-hidden ${hot ? 'panic-desk' : ''} ${room.boss ? 'animate-boss' : ''}`}>
      <div className="scanlines pointer-events-none absolute inset-0 z-[45]" />
      {hot ? (
        <div data-testid="panic-banner" className="absolute left-24 right-2 top-2 z-[46] bg-hot px-3 py-1 text-center font-display tracking-widest text-white">
          {t(dict.dayEnds)}
        </div>
      ) : null}
      {room.boss ? <div className="absolute left-28 right-4 top-12 z-[46] bg-hot px-3 py-2 font-display text-sm text-white">{BOSS[room.boss.key]?.[lang]}</div> : null}
      <div className="absolute bottom-14 left-0 top-0 z-30 w-[100px] overflow-y-auto px-1 pt-3">
        {icons.map((icon) => (
          <button key={icon.id} type="button" data-testid={icon.test} className="mb-2 flex h-[72px] w-full flex-col items-center justify-center bg-black/20 text-center text-[11px] text-paper hover:bg-black/40" onClick={() => focusWin(icon.id)}>
            <span className="text-xl">{icon.glyph}</span>
            {icon.label}
          </button>
        ))}
      </div>
      {(Object.keys(open) as WinId[]).map((id) =>
        open[id] ? (
          <section
            key={id}
            className="os-window absolute flex flex-col"
            style={{ left: pos[id].x, top: pos[id].y, width: pos[id].w, height: pos[id].h, zIndex: 10 + z[id] }}
            onPointerDown={() => setFocus(id)}
          >
            <header
              className={`os-title flex h-8 shrink-0 items-center gap-2 px-2 text-sm ${focus === id ? '' : 'off'}`}
              style={{ touchAction: 'none' }}
              onPointerDown={(event) => {
                const startX = event.clientX
                const startY = event.clientY
                const origin = pos[id]
                const move = (ev: PointerEvent) => {
                  setPos((prev) => ({
                    ...prev,
                    [id]: { ...prev[id], x: Math.max(100, origin.x + ev.clientX - startX), y: Math.max(0, origin.y + ev.clientY - startY) },
                  }))
                }
                const up = () => {
                  window.removeEventListener('pointermove', move)
                  window.removeEventListener('pointerup', up)
                }
                window.addEventListener('pointermove', move)
                window.addEventListener('pointerup', up)
                focusWin(id)
              }}
            >
              <span className="flex-1 truncate">{icons.find((icon) => icon.id === id)?.label}</span>
              <button type="button" className="h-6 min-h-0 w-6 bg-paper text-ink" onClick={() => setOpen((prev) => ({ ...prev, [id]: false }))}>
                ×
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-hidden">
              {id === 'phone' ? <Phone room={room} call={call} act={act} showTrust /> : null}
              {id === 'apps' ? <ScamApps room={room} me={me} call={call} act={act} /> : null}
              {id === 'market' ? <Market room={room} me={me} act={act} /> : null}
              {id === 'notes' ? <Notes /> : null}
              {id === 'paint' ? <PaintApp /> : null}
              {id === 'rank' ? <RankBoard room={room} me={me} /> : null}
              {id === 'chaos' ? <ChaosLog room={room} /> : null}
              {id === 'settings' ? <SettingsPanel /> : null}
            </div>
          </section>
        ) : null,
      )}
      <footer className="absolute inset-x-0 bottom-0 z-40 flex h-12 items-center gap-2 bg-[#0d1a22] px-2">
        <button type="button" className="h-9 min-h-0 bg-acid px-3 font-display text-ink" onClick={() => setMenu((v) => !v)}>
          SCAM
        </button>
        {menu ? (
          <div className="absolute bottom-12 left-1 w-56 border border-white/20 bg-[#102028] p-2">
            {icons.map((icon) => (
              <button key={icon.id} type="button" className="block h-11 w-full text-left text-sm" onClick={() => focusWin(icon.id)}>
                {icon.glyph} {icon.label}
              </button>
            ))}
          </div>
        ) : null}
        <div className="hidden min-w-[180px] md:block">
          <QuotaReadout room={room} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs">
            {t(dict.day)} {room.day}
          </span>
          <Clock room={room} now={now} />
          <LangSwitch />
          <button type="button" data-testid="mute-toggle" className="h-9 min-h-0 min-w-11 bg-white/10 px-2" onClick={() => update({ muted: !settings.muted })}>
            {settings.muted ? t(dict.unmute) : t(dict.mute)}
          </button>
          {me.isHost ? (
            <Button data-testid="end-shift" variant="hot" size="sm" onClick={() => setConfirm(true)}>
              {t(dict.clockOut)}
            </Button>
          ) : (
            <span className="text-xs">{t(dict.waiting)}</span>
          )}
        </div>
      </footer>
      <VirusLayer room={room} playerId={playerId} act={act} />
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogTitle className="font-display text-xl">{t(dict.clockOut)}</DialogTitle>
          <DialogDescription className="mt-2 text-sm">{t(dict.clockWarn)}</DialogDescription>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="steel" onClick={() => setConfirm(false)}>
              {t(dict.cancel)}
            </Button>
            <Button data-testid="confirm-end" variant="hot" onClick={() => act({ type: 'end_shift' })}>
              {t(dict.confirmClock)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
