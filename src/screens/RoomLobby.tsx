import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import type { Room } from '@shared/types'
import { quotaForDay } from '@shared/constants'
import { dict } from '../i18n/dict'
import { LangSwitch, useI18n } from '../i18n/context'
import { Button } from '../components/ui/button'
import { meOf } from '../shift/widgets'

export function RoomLobby({
  room,
  playerId,
  error,
  onStart,
  onShift,
}: {
  room: Room
  playerId: string
  error: string | null
  onStart: () => void
  onShift: (seconds: number) => void
}) {
  const { t } = useI18n()
  const me = meOf(room, playerId)
  const link = `${location.origin}${location.pathname}?room=${room.code}`
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    void QRCode.toDataURL(link, { margin: 1, width: 220, color: { dark: '#122018', light: '#e7e1d2' } }).then(setQr).catch(() => setQr(''))
  }, [link])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      const input = document.createElement('textarea')
      input.value = link
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      input.remove()
      setCopied(true)
    }
  }
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'ScamOS 98', text: room.code, url: link })
        return
      } catch {
        /* fall through */
      }
    }
    await copy()
  }
  return (
    <main data-testid="room-lobby" className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">{t(dict.logo)}</h1>
        <LangSwitch />
      </div>
      <section className="bg-paper p-4 text-ink">
        <p className="text-xs uppercase tracking-widest">{t(dict.roomCode)}</p>
        <p data-testid="room-code" className="break-all font-display text-4xl tracking-[0.14em] sm:text-5xl">
          {room.code}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button data-testid="copy-link" variant="steel" onClick={() => void copy()}>
            {copied ? t(dict.copied) : t(dict.copyLink)}
          </Button>
          <Button variant="default" onClick={() => void share()}>
            {t(dict.share)}
          </Button>
        </div>
        {qr ? <img src={qr} alt={room.code} className="mt-4 h-40 w-40 bg-paper" /> : null}
        <p className="mt-3 break-all text-xs">{link}</p>
      </section>
      <section className="bg-[#17262f] p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display">{t(dict.players)}</h2>
          <span>
            {t(dict.quotaTarget)} {room.quota || quotaForDay(room.day)}
          </span>
        </div>
        <ul className="mt-3 space-y-2">
          {room.players.map((player) => (
            <li key={player.id} className="flex min-h-11 items-center justify-between bg-black/20 px-3">
              <span>
                <i className="mr-2 inline-block h-3 w-3" style={{ background: player.color }} />
                {player.name}
              </span>
              {player.isHost ? <span className="text-xs text-acid">{t(dict.host)}</span> : null}
            </li>
          ))}
        </ul>
        {me?.isHost ? (
          <div className="mt-4 grid gap-2">
            <div className="grid grid-cols-4 gap-1">
              {[60, 120, 180, 240].map((seconds) => (
                <button key={seconds} type="button" className={`h-11 text-xs ${room.shiftSeconds === seconds ? 'bg-acid text-ink' : 'bg-white/10'}`} onClick={() => onShift(seconds)}>
                  {seconds / 60}m
                </button>
              ))}
            </div>
            <Button data-testid="start-shift" onClick={onStart}>
              {t(dict.start)}
            </Button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-yolk">{t(dict.waiting)}</p>
        )}
        {error ? <p className="mt-3 text-sm text-hot">{t(dict.errors[error] ?? dict.errors.invalid)}</p> : null}
      </section>
    </main>
  )
}
