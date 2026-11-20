import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export interface Settings {
  muted: boolean
  tts: boolean
  llmBase: string
  llmModel: string
  llmKey: string
}

const KEY = 'scamos-settings'

const defaults: Settings = {
  muted: false,
  tts: false,
  llmBase: 'https://api.openai.com/v1',
  llmModel: 'gpt-4o-mini',
  llmKey: '',
}

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaults
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return defaults
  }
}

const Ctx = createContext<{ settings: Settings; update: (patch: Partial<Settings>) => void } | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load)
  const update = (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }
  const value = useMemo(() => ({ settings, update }), [settings])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSettings() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('settings')
  return ctx
}
