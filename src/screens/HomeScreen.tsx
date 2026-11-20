import { useState } from 'react'
import { SHIFT_CHOICES } from '@shared/constants'
import { dict } from '../i18n/dict'
import { LangSwitch, useI18n } from '../i18n/context'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

export function HomeScreen({
  connected,
  error,
  preset,
  onSolo,
  onCreate,
  onJoin,
}: {
  connected: boolean
  error: string | null
  preset: string
  onSolo: (name: string, seconds: number) => void
  onCreate: (name: string, seconds: number) => void
  onJoin: (name: string, code: string) => void
}) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [code, setCode] = useState(preset)
  const [seconds, setSeconds] = useState(180)
  const [localError, setLocalError] = useState('')
  const ready = () => {
    if (!name.trim()) {
      setLocalError(t(dict.errors.bad_name))
      return false
    }
    setLocalError('')
    return true
  }
  return (
    <main data-testid="lobby" className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="font-display text-xs tracking-[0.25em] text-acid">CALLCENTER OS</p>
        <LangSwitch />
      </div>
      <div className="border-4 border-[#2a3330] bg-[#121a18] p-3 shadow-win">
        <div className="desktop-bg relative overflow-hidden px-4 py-8 sm:px-8">
          <div className="scanlines pointer-events-none absolute inset-0" />
          <h1 data-testid="logo" className="relative font-display text-4xl font-bold sm:text-6xl">
            {t(dict.logo)}
          </h1>
          <p className="relative mt-3 max-w-xl text-base text-paper/90">{t(dict.deck)}</p>
          <div className="relative mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="block text-sm">
              {t(dict.name)}
              <Input data-testid="player-name" className="mt-1" maxLength={16} placeholder={t(dict.namePh)} value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="block text-sm">
              {t(dict.shiftLength)}
              <div className="mt-1 grid grid-cols-4 gap-1">
                {SHIFT_CHOICES.map((choice) => (
                  <button key={choice} type="button" className={`h-12 px-1 text-xs ${seconds === choice ? 'bg-acid text-ink' : 'bg-black/30'}`} onClick={() => setSeconds(choice)}>
                    {choice / 60} {t(dict.minute)}
                  </button>
                ))}
              </div>
            </label>
          </div>
          <div className="relative mt-4 grid gap-2 sm:grid-cols-3">
            <Button data-testid="solo-shift" disabled={!connected} onClick={() => ready() && onSolo(name, seconds)}>
              {t(dict.solo)}
            </Button>
            <Button data-testid="create-room" variant="steel" disabled={!connected} onClick={() => ready() && onCreate(name, seconds)}>
              {t(dict.create)}
            </Button>
            <div className="flex min-w-0 gap-2">
              <Input
                data-testid="room-code-input"
                className="min-w-0 uppercase"
                inputMode="text"
                autoCapitalize="characters"
                maxLength={6}
                placeholder="ABC123"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              />
              <Button data-testid="join-room" className="shrink-0" variant="hot" disabled={!connected} onClick={() => ready() && code.length === 6 && onJoin(name, code)}>
                {t(dict.join)}
              </Button>
            </div>
          </div>
          {!connected ? <p className="relative mt-3 text-sm text-yolk">{t(dict.connecting)}</p> : null}
          {localError || error ? <p className="relative mt-3 text-sm text-hot">{localError || t(dict.errors[error || ''] ?? dict.errors.invalid)}</p> : null}
        </div>
      </div>
      <p className="mt-4 text-xs text-steel">{t(dict.disclaimer)}</p>
    </main>
  )
}
