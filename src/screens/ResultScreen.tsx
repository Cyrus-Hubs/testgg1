import type { Action, Room } from '@shared/types'
import { REVIEW_BOSS } from '@shared/lines'
import { dict } from '../i18n/dict'
import { useI18n } from '../i18n/context'
import { Button } from '../components/ui/button'
import { Market } from '../shift/apps'
import { meOf } from '../shift/widgets'

export function ResultScreen({ room, playerId, act }: { room: Room; playerId: string; act: (action: Action) => void }) {
  const { t, lang } = useI18n()
  const me = meOf(room, playerId)
  const review = room.review
  const passed = room.phase === 'review'
  return (
    <main data-testid="shift-result" className={`min-h-dvh w-full max-w-full overflow-x-hidden px-4 py-6 ${passed ? 'bg-[#e7e1d2] text-ink' : 'bg-[#2a060c] text-white'}`}>
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <p className={`stamp w-fit px-4 py-2 font-display text-3xl sm:text-5xl ${passed ? 'text-emerald-700' : 'text-hot'}`}>{passed ? t(dict.pass) : t(dict.fired)}</p>
        <p className="max-w-xl font-display text-lg">{review ? REVIEW_BOSS[review.bossKey][lang] : ''}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label={t(dict.quotaTarget)} value={`${review?.progress ?? room.progress} / ${review?.quota ?? room.quota}`} />
          <Stat label={t(dict.day)} value={String(room.day)} />
          <Stat label={t(dict.rank)} value={String(review?.ranks.find((row) => row.id === playerId)?.place ?? '—')} />
        </div>
        <section className={`${passed ? 'bg-white' : 'bg-black/30'} p-3`}>
          <h2 className="font-display">{t(dict.rank)}</h2>
          <ol className="mt-2 space-y-2">
            {review?.ranks.map((row) => (
              <li key={row.id} className="flex justify-between border-b border-current/10 py-2">
                <span>
                  {row.place}. {row.name}
                </span>
                <span className="font-display">{row.earned}</span>
              </li>
            ))}
          </ol>
        </section>
        <section className={`${passed ? 'bg-[#fff4c2] text-ink' : 'bg-black/40'} p-3`}>
          <h2 className="font-display">{t(dict.quotes)}</h2>
          {review?.quotes.length ? (
            <ul className="mt-2 space-y-2">
              {review.quotes.map((quote, index) => (
                <li key={`${quote.at}-${index}`} className="border-l-4 border-hot pl-3">
                  <b>{quote.name}: </b>
                  {quote.text[lang]}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm">{t(dict.noQuotes)}</p>
          )}
        </section>
        {passed && me ? (
          <section className="bg-white text-ink">
            <Market room={room} me={me} act={act} />
          </section>
        ) : null}
        <div className="grid gap-2 sm:grid-cols-2">
          {passed && me?.isHost ? (
            <Button data-testid="next-day" onClick={() => act({ type: 'next_day' })}>
              {t(dict.nextDay)}
            </Button>
          ) : null}
          {me?.isHost ? (
            <Button variant={passed ? 'steel' : 'hot'} onClick={() => act({ type: 'play_again' })}>
              {t(dict.again)}
            </Button>
          ) : (
            <p>{t(dict.waiting)}</p>
          )}
        </div>
      </div>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-current/20 p-3">
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      <div className="font-display text-2xl">{value}</div>
    </div>
  )
}
