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
import { Clock, QuotaReadout, TrustReadout, callOf, meOf, panic, useNow } from './widgets'

type Tab = 'phone' | 'apps' | 'market' | 'tools' | 'rank'

export function MobileShift({ room, playerId, act }: { room: Room; playerId: string; act: (action: Action) => void }) {
  const { t, lang } = useI18n()
  const { settings, update } = useSettings()
  const me = meOf(room, playerId)
  const call = callOf(room, playerId)
  const now = useNow(true)
  const hot = panic(room, now)
  const [tab, setTab] = useState<Tab>('phone')
  const [tool, setTool] = useState<'notes' | 'paint' | 'viewer' | 'settings' | 'chaos'>('notes')
  const [confirm, setConfirm] = useState(false)
  useEffect(() => {
    if (call?.status === 'ringing') setTab('phone')
  }, [call?.id, call?.status])
  if (!me) return null
  const tabs: Tab[] = ['phone', 'apps', 'market', 'tools', 'rank']
  return (
    <div data-testid="desktop" className={`flex h-dvh max-w-full flex-col overflow-hidden bg-desk text-paper ${hot ? 'panic-desk' : ''}`}>
      <header className="shrink-0 border-b border-white/10 px-2 pt-[max(6px,var(--safe-top))]" data-testid="hud">
        {hot ? (
          <div data-testid="panic-banner" className="mb-1 bg-hot px-2 py-1 text-center font-display text-xs tracking-widest text-white">
            {t(dict.dayEnds)}
          </div>
        ) : null}
        {room.boss ? <div className="mb-1 bg-hot/90 px-2 py-1 text-xs">{BOSS[room.boss.key]?.[lang] ?? ''}</div> : null}
        <div className="flex items-center gap-2">
          <Clock room={room} now={now} />
          <QuotaReadout room={room} />
          <TrustReadout call={call} tagged />
        </div>
        <div className="mt-1 flex gap-2 pb-2">
          <button type="button" data-testid="call-toggle" className="h-11 min-w-0 flex-1 truncate bg-white/10 px-2 text-left text-sm" onClick={() => setTab('phone')}>
            {call ? `${call.avatar} ${call.name[lang]} · ${call.status}` : t(dict.emptyCall)}
          </button>
          {me.isHost ? (
            <Button data-testid="end-shift" variant="hot" size="sm" onClick={() => setConfirm(true)}>
              {t(dict.clockOut)}
            </Button>
          ) : null}
          <button type="button" data-testid="mute-toggle" className="h-11 min-w-11 bg-white/10 px-2" onClick={() => update({ muted: !settings.muted })}>
            {settings.muted ? '×' : '♪'}
          </button>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-hidden">
        {tab === 'phone' ? <Phone room={room} call={call} act={act} /> : null}
        {tab === 'apps' ? <ScamApps room={room} me={me} call={call} act={act} /> : null}
        {tab === 'market' ? <Market room={room} me={me} act={act} /> : null}
        {tab === 'rank' ? (
          <div className="grid h-full grid-rows-2">
            <RankBoard room={room} me={me} />
            <ChaosLog room={room} />
          </div>
        ) : null}
        {tab === 'tools' ? (
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex gap-2 overflow-x-auto p-2">
              {(['notes', 'paint', 'viewer', 'settings', 'chaos'] as const).map((id) => (
                <button key={id} type="button" className={`h-11 shrink-0 px-3 text-sm ${tool === id ? 'bg-acid text-ink' : 'bg-white/10'}`} onClick={() => setTool(id)}>
                  {id === 'viewer' ? 'AnyViewer' : id === 'notes' ? t(dict.notesTitle) : id === 'paint' ? t(dict.paint) : id === 'chaos' ? t(dict.chaos) : t(dict.settings)}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1">
              {tool === 'notes' ? <Notes /> : null}
              {tool === 'paint' ? <PaintApp /> : null}
              {tool === 'viewer' ? <ScamApps room={room} me={me} call={call} act={act} /> : null}
              {tool === 'settings' ? <SettingsPanel /> : null}
              {tool === 'chaos' ? <ChaosLog room={room} /> : null}
            </div>
          </div>
        ) : null}
      </main>
      <nav data-testid="mobile-dock" className="grid shrink-0 grid-cols-5 border-t border-white/10 bg-[#0d1a22] pb-[max(6px,var(--safe-bottom))]">
        {tabs.map((id) => (
          <button key={id} type="button" data-testid={`tab-${id}`} className={`h-14 text-xs ${tab === id ? 'bg-acid text-ink' : 'text-paper'}`} onClick={() => setTab(id)}>
            {t(dict.tabs[id])}
          </button>
        ))}
      </nav>
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
          <div className="mt-3">
            <LangSwitch />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
