import { useEffect, useRef, useState } from 'react'
import type { Call, Room } from '@shared/types'
import { QUICK_REPLIES } from '@shared/constants'
import type { Action } from '@shared/types'
import { dict } from '../i18n/dict'
import { useI18n } from '../i18n/context'
import { useSettings } from '../settings'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Notice, TrustReadout } from './widgets'

export function Phone({
  room,
  call,
  act,
  showTrust,
}: {
  room: Room
  call?: Call
  act: (action: Action) => void
  showTrust?: boolean
}) {
  const { t, lang } = useI18n()
  const { settings } = useSettings()
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const [micNote, setMicNote] = useState('')
  const [flavors, setFlavors] = useState<Record<string, string>>({})
  const bottom = useRef<HTMLDivElement>(null)
  const rec = useRef<SpeechRecognitionLike | null>(null)

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [call?.transcript.length, flavors])

  useEffect(() => {
    if (!call || !settings.tts || settings.muted) return
    const last = call.transcript[call.transcript.length - 1]
    if (!last || last.speaker === 'agent') return
    const spoken = flavors[last.id] || last.text[lang]
    if (!window.speechSynthesis) return
    const utter = new SpeechSynthesisUtterance(spoken)
    utter.lang = lang === 'th' ? 'th-TH' : 'en-US'
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utter)
  }, [call?.transcript.length, settings.tts, settings.muted, lang, flavors, call])

  useEffect(() => {
    if (!settings.llmKey || !call) return
    const last = [...call.transcript].reverse().find((line) => line.speaker === 'caller')
    if (!last || flavors[last.id]) return
    const playerLine = [...call.transcript].reverse().find((line) => line.speaker === 'agent')
    const controller = new AbortController()
    void fetch('/api/caller-line', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        apiKey: settings.llmKey,
        baseUrl: settings.llmBase,
        model: settings.llmModel,
        lang,
        personality: call.isBait ? 'scambaiter' : call.personality,
        name: call.name[lang],
        trust: call.trust,
        playerLine: playerLine?.text[lang] ?? '',
        houseLine: last.text[lang],
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { text?: string } | null) => {
        if (data?.text) setFlavors((prev) => ({ ...prev, [last.id]: data.text as string }))
      })
      .catch(() => undefined)
    return () => controller.abort()
  }, [call, settings.llmKey, settings.llmBase, settings.llmModel, lang, flavors])

  const toggleMic = () => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Ctor) {
      setMicNote(t(dict.micMissing))
      return
    }
    if (listening && rec.current) {
      rec.current.stop()
      setListening(false)
      return
    }
    const recog = new Ctor()
    recog.lang = lang === 'th' ? 'th-TH' : 'en-US'
    recog.interimResults = false
    recog.onresult = (event) => {
      const said = event.results[0]?.[0]?.transcript ?? ''
      if (said) setText(said)
    }
    recog.onerror = () => setListening(false)
    recog.onend = () => setListening(false)
    rec.current = recog
    recog.start()
    setListening(true)
  }

  if (!call) {
    return <div className="p-4 text-sm text-ink/70">{t(dict.emptyCall)}</div>
  }

  const live = call.status === 'active' || call.status === 'hold'
  return (
    <div className="flex h-full min-h-0 flex-col bg-[#e7efe6] text-ink">
      <div className="flex items-center gap-3 border-b border-black/10 p-3">
        <div className="grid h-14 w-14 place-items-center bg-[#123c4a] text-3xl">{call.avatar}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-lg">{call.name[lang]}</div>
          <div className="truncate text-xs text-ink/70">
            {t(dict.personalities[call.personality])} · {t(dict.scenarios[call.scenario])}
          </div>
          {call.isBait ? <div className="mt-1 inline-block bg-hot px-2 py-0.5 text-xs text-white">{t(dict.baitBadge)}</div> : null}
        </div>
        {showTrust ? <TrustReadout call={call} tagged /> : <TrustReadout call={call} />}
      </div>
      {call.status === 'ringing' ? (
        <div data-testid="incoming-call" className="m-3 border-2 border-hot bg-white p-4 text-center">
          <div className="font-display text-sm tracking-[0.2em] text-hot">{t(dict.incoming)}</div>
          <p className="mt-2 text-sm">{t(call.bio)}</p>
          <Button data-testid="answer-call" variant="hot" className="mt-3 w-full" onClick={() => act({ type: 'answer' })}>
            {t(dict.answer)}
          </Button>
        </div>
      ) : null}
      {call.outcome === 'terminated' ? (
        <div data-testid="call-terminated" className="m-3 bg-hot p-4 text-center font-display text-2xl text-white">
          {t(dict.terminated)}
        </div>
      ) : null}
      <div data-testid="transcript" className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {call.transcript.map((line) => (
          <div key={line.id} className={line.speaker === 'agent' ? 'ml-8 text-right' : line.speaker === 'system' ? 'text-center text-xs' : 'mr-8'}>
            <div className={line.speaker === 'agent' ? 'inline-block bg-acid px-3 py-2 text-left text-sm' : line.speaker === 'system' ? 'text-ink/60' : 'inline-block bg-white px-3 py-2 text-sm shadow-win'}>
              {flavors[line.id] || line.text[lang]}
            </div>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <Notice call={call} />
      {live ? (
        <div className="space-y-2 border-t border-black/10 p-3">
          <div className="flex flex-wrap gap-2">
            {QUICK_REPLIES.map((card) => (
              <button
                key={card.intent}
                type="button"
                data-testid={card.intent === 'ask_code' ? 'quick-ask' : `quick-${card.intent}`}
                className="min-h-11 border border-ink/20 bg-white px-3 text-left text-xs"
                onClick={() => act({ type: 'quick', intent: card.intent })}
              >
                {card.label[lang]}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              const next = text.trim()
              if (!next) return
              act({ type: 'say', text: next })
              setText('')
            }}
          >
            <Input data-testid="chat-input" value={text} placeholder={t(dict.chatPh)} onChange={(event) => setText(event.target.value)} />
            <Button type="button" variant="steel" data-testid="mic" onClick={toggleMic}>
              {listening ? t(dict.micStop) : t(dict.mic)}
            </Button>
            <Button type="submit" data-testid="send">
              {t(dict.send)}
            </Button>
          </form>
          {micNote ? <p className="text-xs">{micNote}</p> : null}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="steel" onClick={() => act({ type: 'hold' })}>
              {call.status === 'hold' ? t(dict.resume) : t(dict.hold)}
            </Button>
            <Button variant="hot" onClick={() => act({ type: 'hangup' })}>
              {t(dict.hangup)}
            </Button>
          </div>
        </div>
      ) : null}
      <span className="sr-only">{room.code}</span>
    </div>
  )
}
