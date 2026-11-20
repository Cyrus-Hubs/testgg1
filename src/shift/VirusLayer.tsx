import type { Action, Room } from '@shared/types'
import { dict } from '../i18n/dict'
import { useI18n } from '../i18n/context'

export function VirusLayer({ room, playerId, act }: { room: Room; playerId: string; act: (action: Action) => void }) {
  const { lang, t } = useI18n()
  const mine = room.viruses.filter((virus) => virus.playerId === playerId)
  if (!mine.length) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 top-16 z-[60] md:bottom-16">
      {mine.map((virus, index) => (
        <section
          key={virus.id}
          className="pointer-events-auto absolute w-[min(92vw,320px)] border-2 border-hot bg-white p-3 text-ink shadow-win"
          style={{ left: `${8 + (index % 3) * 8}%`, top: `${12 + index * 18}%` }}
        >
          <h3 className="font-display text-sm text-hot">{virus.title[lang]}</h3>
          <p className="mt-1 text-xs">{virus.body[lang]}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" className="h-12 bg-yolk text-xs font-semibold" onClick={() => act({ type: 'virus_poke', virusId: virus.id })}>
              {virus.fake[lang]}
            </button>
            <button type="button" data-testid="quarantine" className="h-12 bg-hot text-xs font-semibold text-white" onClick={() => act({ type: 'quarantine', virusId: virus.id })}>
              {t(dict.quarantine)}
            </button>
          </div>
        </section>
      ))}
    </div>
  )
}
