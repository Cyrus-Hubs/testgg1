import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useSettings } from '../settings'
import type { Action, AppId, Call, Player, Room } from '@shared/types'
import { appsBlocked, priceOf } from '@shared/constants'
import { dict } from '../i18n/dict'
import { useI18n } from '../i18n/context'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Notice } from './widgets'

const SHOP_COPY: Record<'anyviewer' | 'fine' | 'lottery', { blurb: { th: string; en: string } }> = {
  anyviewer: { blurb: { th: 'เปิดจอการ์ตูนของคู่สาย แล้วหาโน้ตที่เขียนเลขมั่ว', en: 'Open their cartoon desktop and find the scribbled note.' } },
  fine: { blurb: { th: 'กรมที่จอดความฝัน เก็บเลขยืนยันค่าปรับเอียง', en: 'Dream Parking wants a confirmation for a diagonal dream.' } },
  lottery: { blurb: { th: 'ขูดสามช่อง อาจได้ขนเป็ดหรือแจ็กพอตการ์ตูน', en: 'Scratch three panels. Duck fluff, or a cartoon jackpot.' } },
}

const ICONS: Record<string, { th: string; en: string }> = {
  cat: { th: 'รูปแมว', en: 'Cat' },
  mail: { th: 'จดหมายป้า', en: 'Aunt mail' },
  trash: { th: 'ถังมีกลิ่น', en: 'Smelly bin' },
  sol: { th: 'ไพ่คนเดียว', en: 'Solitaire' },
  folder: { th: 'โฟลเดอร์ปลอม', en: 'Fake folder' },
  sticky: { th: 'กระดาษโน้ต', en: 'Sticky' },
  calc: { th: 'เครื่องคิดเลขพัง', en: 'Broken calc' },
  music: { th: 'เพลงรอสาย', en: 'Hold music' },
  tax: { th: 'ภาษีถุงเท้า', en: 'Sock tax' },
  duck: { th: 'เป็ด.exe', en: 'duck.exe' },
  map: { th: 'แผนที่ฝัน', en: 'Dream map' },
  clock: { th: 'นาฬิกาถอย', en: 'Backward clock' },
  pizza: { th: 'พิซซ่าค้าง', en: 'Cold pizza' },
  virus: { th: 'อย่าเปิด', en: 'Do not open' },
  bank: { th: 'ธนาคารเป็ด', en: 'Duck bank' },
  note2: { th: 'โน้ตปลอม', en: 'Decoy note' },
}

export function ScamApps({ room, me, call, act }: { room: Room; me: Player; call?: Call; act: (action: Action) => void }) {
  const { t, lang } = useI18n()
  const [tab, setTab] = useState<AppId>(call?.scenario && call.scenario !== 'none' ? call.scenario : 'giftcard')
  const blocked = appsBlocked(room.viruses, me.id)
  const apps: AppId[] = ['giftcard', 'memecoin', 'cardverify', 'fine', 'lottery', 'anyviewer']
  return (
    <div className="flex h-full min-h-0 flex-col bg-paper text-ink">
      <div className="flex gap-2 overflow-x-auto p-2">
        {apps.map((id) => (
          <button key={id} type="button" data-testid={`app-${id}`} className={`h-11 shrink-0 px-3 text-sm ${tab === id ? 'bg-ink text-paper' : 'bg-white'}`} onClick={() => setTab(id)}>
            {t(dict.apps[id])}
            {me.unlocked.includes(id) ? '' : ' · lock'}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {blocked ? <p className="mb-3 bg-hot px-3 py-2 text-sm text-white">{t(dict.blocked)}</p> : null}
        {tab === 'giftcard' ? <Gift call={call} act={act} /> : null}
        {tab === 'memecoin' ? <Coin call={call} act={act} /> : null}
        {tab === 'cardverify' ? <Syllables call={call} act={act} /> : null}
        {tab === 'fine' ? <Fine me={me} call={call} act={act} /> : null}
        {tab === 'lottery' ? <Lottery me={me} call={call} act={act} /> : null}
        {tab === 'anyviewer' ? <Viewer me={me} call={call} act={act} lang={lang} /> : null}
      </div>
    </div>
  )
}

function Gift({ call, act }: { call?: Call; act: (action: Action) => void }) {
  const { t } = useI18n()
  const [code, setCode] = useState('')
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        act({ type: 'redeem_gift', code })
      }}
    >
      <h2 className="font-display text-xl">{t(dict.apps.giftcard)}</h2>
      <p className="mt-1 text-sm">{call?.scenario === 'giftcard' ? (call.revealed ? t(dict.codePh) : t(dict.needCode)) : t(dict.emptyCall)}</p>
      <Input data-testid="gift-code" className="mt-3 uppercase" value={code} autoCapitalize="characters" onChange={(event) => setCode(event.target.value.toUpperCase())} />
      <Button data-testid="gift-redeem" className="mt-3 w-full" type="submit">
        {t(dict.redeem)}
      </Button>
      <Notice call={call?.scenario === 'giftcard' ? call : undefined} />
    </form>
  )
}

function Coin({ call, act }: { call?: Call; act: (action: Action) => void }) {
  const { t } = useI18n()
  const coin = call?.scenario === 'memecoin' ? call.memecoin : null
  const prices = coin?.prices ?? [10]
  const max = Math.max(...prices, 12)
  const points = prices.map((price, index) => `${(index / Math.max(1, prices.length - 1)) * 100},${100 - (price / max) * 100}`).join(' ')
  return (
    <div>
      <h2 className="font-display text-xl">HONK</h2>
      <div className="mt-3 bg-[#102028] p-3 text-acid">
        <div className="font-display text-4xl tabular-nums">{prices[prices.length - 1]?.toFixed(1)}</div>
        <svg viewBox="0 0 100 100" className="mt-2 h-32 w-full">
          <polyline fill="none" stroke="#39f3b0" strokeWidth="2" points={points || '0,80 100,40'} />
        </svg>
        {coin?.crashed ? <div className="stamp mt-2 inline-block px-3 py-1 text-hot">{t(dict.crashed)}</div> : null}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button onClick={() => act({ type: 'memecoin_start' })} disabled={!coin || coin.running}>
          {t(dict.pitch)}
        </Button>
        <Button variant="hot" onClick={() => act({ type: 'memecoin_cashout' })} disabled={!coin?.running || coin.cashed}>
          {t(dict.cashOut)}
        </Button>
      </div>
      <Notice call={call?.scenario === 'memecoin' ? call : undefined} />
    </div>
  )
}

function Syllables({ call, act }: { call?: Call; act: (action: Action) => void }) {
  const { t } = useI18n()
  const [chunks, setChunks] = useState(['', '', ''])
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        act({ type: 'verify_chunks', chunks })
      }}
    >
      <h2 className="font-display text-xl">{t(dict.apps.cardverify)}</h2>
      <div className="mt-3 grid gap-2">
        {chunks.map((chunk, index) => (
          <Input
            key={index}
            className="uppercase"
            placeholder={`${index + 1}`}
            value={chunk}
            onChange={(event) => setChunks((prev) => prev.map((item, i) => (i === index ? event.target.value.toUpperCase() : item)))}
          />
        ))}
      </div>
      <Button className="mt-3 w-full" type="submit">
        {t(dict.checkSyllables)}
      </Button>
      <Notice call={call?.scenario === 'cardverify' ? call : undefined} />
    </form>
  )
}

function Fine({ me, call, act }: { me: Player; call?: Call; act: (action: Action) => void }) {
  const { t } = useI18n()
  const [code, setCode] = useState('')
  if (!me.unlocked.includes('fine')) return <p>{t(dict.locked)}</p>
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        act({ type: 'fine_submit', code })
      }}
    >
      <h2 className="font-display text-xl">{t(dict.apps.fine)}</h2>
      <p className="mt-1 text-sm">{t(dict.scenarios.fine)}</p>
      <Input className="mt-3 uppercase" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} />
      <Button className="mt-3 w-full" type="submit">
        {t(dict.fineSubmit)}
      </Button>
      <Notice call={call?.scenario === 'fine' ? call : undefined} />
    </form>
  )
}

function Lottery({ me, call, act }: { me: Player; call?: Call; act: (action: Action) => void }) {
  const { t } = useI18n()
  const [code, setCode] = useState('')
  const lottery = call?.scenario === 'lottery' ? call.lottery : null
  if (!me.unlocked.includes('lottery')) return <p>{t(dict.locked)}</p>
  return (
    <div>
      <h2 className="font-display text-xl">{t(dict.apps.lottery)}</h2>
      {!lottery?.armed ? (
        <form
          className="mt-3"
          onSubmit={(event) => {
            event.preventDefault()
            act({ type: 'lottery_arm', code })
          }}
        >
          <Input className="uppercase" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} />
          <Button className="mt-3 w-full" type="submit">
            {t(dict.arm)}
          </Button>
        </form>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(lottery.panels.length ? lottery.panels : [-1, -1, -1]).map((panel, index) => (
            <ScratchCard key={index} revealed={panel >= 0} value={panel} disabled={index !== lottery.scratched} onScratch={() => act({ type: 'lottery_scratch' })} />
          ))}
        </div>
      )}
      <Notice call={call?.scenario === 'lottery' ? call : undefined} />
    </div>
  )
}

function ScratchCard({ revealed, value, disabled, onScratch }: { revealed: boolean; value: number; disabled: boolean; onScratch: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const scratched = useRef(false)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas || revealed) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)
    ctx.fillStyle = '#c0c6cf'
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.fillStyle = '#5c6775'
    ctx.font = '12px sans-serif'
    ctx.fillText('SCRATCH', 8, rect.height / 2)
  }, [revealed])
  const paint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (disabled || revealed) return
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const rect = canvas.getBoundingClientRect()
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(event.clientX - rect.left, event.clientY - rect.top, 16, 0, Math.PI * 2)
    ctx.fill()
    if (!scratched.current && event.type !== 'pointerdown') {
      scratched.current = true
      onScratch()
    }
  }
  return (
    <div className="relative h-28 overflow-hidden border-2 border-ink bg-yolk">
      <div className="grid h-full place-items-center font-display text-2xl">{revealed ? (value > 0 ? value : '0') : ''}</div>
      {revealed ? null : (
        <canvas
          ref={ref}
          data-testid="lottery-scratch"
          className="absolute inset-0 h-full w-full"
          style={{ touchAction: 'none' }}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            paint(event)
          }}
          onPointerMove={(event) => {
            if (event.buttons || event.currentTarget.hasPointerCapture(event.pointerId)) paint(event)
          }}
        />
      )}
    </div>
  )
}

function Viewer({ me, call, act, lang }: { me: Player; call?: Call; act: (action: Action) => void; lang: 'th' | 'en' }) {
  const { t } = useI18n()
  const view = call?.scenario === 'anyviewer' ? call.anyviewer : null
  if (!me.unlocked.includes('anyviewer')) return <p>{t(dict.locked)}</p>
  return (
    <div>
      <h2 className="font-display text-xl">AnyViewer</h2>
      <Button className="mt-3" onClick={() => act({ type: 'anyviewer_connect' })}>
        {t(dict.connect)}
      </Button>
      {view?.connected ? (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {view.order.map((id) => (
            <button key={id} type="button" className="h-16 bg-[#1b3344] text-[10px] text-paper" onClick={() => act({ type: 'anyviewer_click', iconId: id })}>
              {ICONS[id]?.[lang] ?? id}
            </button>
          ))}
        </div>
      ) : null}
      {view?.found ? (
        <form
          className="mt-3"
          onSubmit={(event) => {
            event.preventDefault()
            const data = new FormData(event.currentTarget)
            act({ type: 'anyviewer_submit', pin: String(data.get('pin') ?? '') })
          }}
        >
          <p className="text-sm">PIN {view.pin}</p>
          <Input name="pin" className="mt-2" />
          <Button className="mt-2 w-full" type="submit">
            {t(dict.submitPin)}
          </Button>
        </form>
      ) : null}
      <Notice call={call?.scenario === 'anyviewer' ? call : undefined} />
    </div>
  )
}

export function Market({ room, me, act }: { room: Room; me: Player; act: (action: Action) => void }) {
  const { t, lang } = useI18n()
  const bonus = room.bonusShop && room.phase === 'review'
  const items = ['anyviewer', 'fine', 'lottery'] as const
  return (
    <div className="h-full overflow-y-auto bg-[#fff8ea] p-3 text-ink">
      <div className="flex items-end justify-between gap-2">
        <h2 className="font-display text-2xl">Scamazon</h2>
        <div className="text-right text-sm">
          <div>{t(dict.bank)}</div>
          <div className="font-display text-xl">{me.bank}</div>
        </div>
      </div>
      {bonus ? <div className="mt-2 inline-block bg-hot px-2 py-1 text-xs text-white">{t(dict.sale)}</div> : null}
      <div className="mt-3 grid gap-3">
        {items.map((id) => {
          const owned = me.unlocked.includes(id)
          const price = priceOf(id, bonus)
          return (
            <article key={id} className="border-2 border-ink bg-white p-3">
              <h3 className="font-display text-lg">{t(dict.apps[id])}</h3>
              <p className="mt-1 text-sm">{SHOP_COPY[id].blurb[lang]}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-display">{owned ? t(dict.owned) : price}</span>
                <Button disabled={owned} onClick={() => act({ type: 'buy', app: id })}>
                  {owned ? t(dict.owned) : t(dict.buy)}
                </Button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

export function RankBoard({ room, me }: { room: Room; me: Player | null }) {
  const { t } = useI18n()
  const rows = [...room.players].sort((a, b) => b.earned - a.earned || b.callsWon - a.callsWon || a.name.localeCompare(b.name))
  return (
    <div className="h-full overflow-y-auto bg-paper p-3 text-ink">
      <h2 className="font-display text-xl">{t(dict.rank)}</h2>
      <ol className="mt-3 space-y-2">
        {rows.map((player, index) => (
          <li key={player.id} className={`flex items-center justify-between border border-ink/15 px-3 py-2 ${player.id === me?.id ? 'bg-acid/40' : 'bg-white'}`}>
            <span className="flex items-center gap-2">
              <i className="inline-block h-3 w-3" style={{ background: player.color }} />
              {index + 1}. {player.name}
              {!player.connected ? ' …' : ''}
            </span>
            <span className="font-display tabular-nums">{player.earned}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function ChaosLog({ room }: { room: Room }) {
  const { t, lang } = useI18n()
  return (
    <div className="h-full overflow-y-auto bg-[#1b2430] p-3 text-paper">
      <h2 className="font-display text-lg">{t(dict.chaos)}</h2>
      <ul className="mt-2 space-y-2 text-sm">
        {room.feed.map((item) => (
          <li key={item.id} className={item.tone === 'boss' ? 'text-hot' : item.tone === 'good' ? 'text-acid' : ''}>
            {item.text[lang]}
          </li>
        ))}
      </ul>
    </div>
  )
}

const TIPS = [
  { th: 'ยายมาลีละลายถ้าชมสวน อย่าเร่งเธอ', en: 'Granny Mali melts if you praise the garden. Do not rush her.' },
  { th: 'สายเหรียญชอบความรีบ และเกลียดคำว่ากรม', en: 'The coin bro loves hurry and hates the word department.' },
  { th: 'ผู้บริหารต้องการน้ำเสียงหน่วยงานสั้นๆ', en: 'The executive wants a short office voice.' },
  { th: 'มือใหม่ต้องการให้วางใจก่อนค่อยถามรหัส', en: 'The novice needs comfort before any code.' },
  { th: 'ลุงทฤษฎีรักประโยคที่งงแบบสนุก', en: 'Uncle Theory loves cheerfully confusing sentences.' },
  { th: 'ถ้าเขาแจกทูลบาร์หรือรหัสกล้วย ให้วางสาย', en: 'If they offer toolbars or a banana code, hang up.' },
]

export function Notes() {
  const { t, lang } = useI18n()
  const [note, setNote] = useState('')
  return (
    <div className="grid h-full gap-3 overflow-y-auto bg-[#fff4c2] p-3 text-ink">
      <h2 className="font-display text-xl">{t(dict.notesTitle)}</h2>
      <ul className="space-y-2 text-sm">
        {TIPS.map((tip) => (
          <li key={tip.en} className="border-b border-black/10 pb-2">
            {tip[lang]}
          </li>
        ))}
      </ul>
      <textarea value={note} onChange={(event) => setNote(event.target.value)} className="min-h-28 w-full border-2 border-ink bg-white p-2 text-base" placeholder="…" />
    </div>
  )
}

export function PaintApp() {
  const { t } = useI18n()
  const ref = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const color = useRef('#17202a')
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height)
      canvas.width = Math.max(1, Math.floor(rect.width * 2))
      canvas.height = Math.max(1, Math.floor(rect.height * 2))
      ctx.putImageData(snapshot, 0, 0)
      ctx.fillStyle = '#fffdf6'
      if (!snapshot.width) ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    resize()
  }, [])
  const pos = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = ref.current!
    const rect = canvas.getBoundingClientRect()
    return { x: ((event.clientX - rect.left) / rect.width) * canvas.width, y: ((event.clientY - rect.top) / rect.height) * canvas.height }
  }
  return (
    <div className="flex h-full min-h-0 flex-col bg-white text-ink">
      <div className="flex flex-wrap gap-2 p-2">
        {['#17202a', '#ff3d6e', '#1f7a6a', '#ffc857', '#2f6feb'].map((swatch) => (
          <button key={swatch} type="button" aria-label={swatch} className="h-11 w-11 border border-black" style={{ background: swatch }} onClick={() => (color.current = swatch)} />
        ))}
        <Button
          variant="steel"
          onClick={() => {
            const canvas = ref.current
            const ctx = canvas?.getContext('2d')
            if (!canvas || !ctx) return
            ctx.fillStyle = '#fffdf6'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
          }}
        >
          {t(dict.clear)}
        </Button>
      </div>
      <canvas
        ref={ref}
        className="min-h-48 w-full flex-1"
        style={{ touchAction: 'none' }}
        onPointerDown={(event) => {
          drawing.current = true
          event.currentTarget.setPointerCapture(event.pointerId)
          const ctx = ref.current?.getContext('2d')
          if (!ctx) return
          const p = pos(event)
          ctx.strokeStyle = color.current
          ctx.lineWidth = 6
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
        }}
        onPointerMove={(event) => {
          if (!drawing.current) return
          const ctx = ref.current?.getContext('2d')
          if (!ctx) return
          const p = pos(event)
          ctx.lineTo(p.x, p.y)
          ctx.stroke()
        }}
        onPointerUp={() => {
          drawing.current = false
        }}
      />
    </div>
  )
}

export function SettingsPanel() {
  const { t } = useI18n()
  const { settings, update } = useSettings()
  const [saved, setSaved] = useState(false)
  return (
    <form
      className="space-y-3 overflow-y-auto bg-paper p-3 text-ink"
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        update({
          tts: data.get('tts') === 'on',
          llmBase: String(data.get('base') ?? ''),
          llmModel: String(data.get('model') ?? ''),
          llmKey: String(data.get('key') ?? ''),
        })
        setSaved(true)
      }}
    >
      <h2 className="font-display text-xl">{t(dict.settings)}</h2>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input name="tts" type="checkbox" defaultChecked={settings.tts} /> {t(dict.tts)}
      </label>
      <p className="text-xs">{t(dict.llmHelp)}</p>
      <Input name="base" defaultValue={settings.llmBase} aria-label="API base" />
      <Input name="model" defaultValue={settings.llmModel} aria-label="model" />
      <Input name="key" type="password" defaultValue={settings.llmKey} placeholder="API key" autoComplete="off" />
      <Button type="submit">{saved ? t(dict.saved) : t(dict.save)}</Button>
    </form>
  )
}
