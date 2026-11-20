import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { L10n, Lang } from '@shared/types'

const KEY = 'scamos-lang'

interface Ctx {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (value: L10n | string) => string
}

const I18nContext = createContext<Ctx | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem(KEY) === 'en' ? 'en' : 'th'))
  const setLang = (next: Lang) => {
    localStorage.setItem(KEY, next)
    setLangState(next)
  }
  useEffect(() => {
    document.documentElement.lang = lang === 'th' ? 'th' : 'en'
  }, [lang])
  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang,
      t: (valueIn) => (typeof valueIn === 'string' ? valueIn : valueIn[lang]),
    }),
    [lang],
  )
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('i18n')
  return ctx
}

export function LangSwitch() {
  const { lang, setLang } = useI18n()
  return (
    <div className="flex overflow-hidden border border-white/20">
      <button type="button" data-testid="lang-th" aria-pressed={lang === 'th'} className={`h-11 min-w-11 px-3 font-display ${lang === 'th' ? 'bg-acid text-ink' : 'bg-black/30 text-paper'}`} onClick={() => setLang('th')}>
        TH
      </button>
      <button type="button" data-testid="lang-en" aria-pressed={lang === 'en'} className={`h-11 min-w-11 px-3 font-display ${lang === 'en' ? 'bg-acid text-ink' : 'bg-black/30 text-paper'}`} onClick={() => setLang('en')}>
        EN
      </button>
    </div>
  )
}
