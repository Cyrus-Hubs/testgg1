import express, { type Request, type Response } from 'express'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer, type WebSocket } from 'ws'
import { redactRoom } from '../shared/engine'
import { callerSystemPrompt, callerUserPrompt } from '../shared/llm'
import type { Action, Lang, Personality } from '../shared/types'
import { Hub } from './hub'

const DEV = process.env.NODE_ENV === 'development'
const PORT = Number(process.env.PORT) || 3000
const HOST = '0.0.0.0'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const distDir = path.join(root, 'dist')

const hub = new Hub()
const sockets = new Map<string, WebSocket>()
const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '40kb' }))

app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).json({ ok: true })
})

const hits = new Map<string, { n: number; t: number }>()

app.post('/api/caller-line', async (req: Request, res: Response) => {
  const ip = req.ip || 'local'
  const now = Date.now()
  const bucket = hits.get(ip)
  if (!bucket || now - bucket.t > 60_000) hits.set(ip, { n: 1, t: now })
  else if (bucket.n > 30) {
    res.status(429).json({ error: 'slow' })
    return
  } else bucket.n += 1

  const body = (req.body ?? {}) as Record<string, unknown>
  const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : ''
  const baseUrl = typeof body.baseUrl === 'string' ? body.baseUrl.trim() : ''
  const model = typeof body.model === 'string' && body.model.trim() ? body.model.trim() : 'gpt-4o-mini'
  const lang: Lang = body.lang === 'en' ? 'en' : 'th'
  if (!apiKey || !baseUrl) {
    res.status(400).json({ error: 'missing' })
    return
  }
  let target: URL
  try {
    target = new URL(baseUrl)
  } catch {
    res.status(400).json({ error: 'bad_url' })
    return
  }
  if (target.protocol !== 'https:') {
    res.status(400).json({ error: 'https_only' })
    return
  }
  const endpoint = `${target.origin}${target.pathname.replace(/\/$/, '')}/chat/completions`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 4000)
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.9,
        max_tokens: 120,
        messages: [
          { role: 'system', content: callerSystemPrompt(lang) },
          {
            role: 'user',
            content: callerUserPrompt({
              lang,
              personality: ((body.personality as Personality) || 'grandma'),
              name: String(body.name || 'caller').slice(0, 40),
              trust: Number(body.trust) || 0,
              playerLine: String(body.playerLine || '').slice(0, 200),
              houseLine: String(body.houseLine || '').slice(0, 240),
            }),
          },
        ],
      }),
    })
    if (!response.ok) {
      res.status(502).json({ error: 'upstream' })
      return
    }
    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
    const text = String(data.choices?.[0]?.message?.content ?? '').trim().slice(0, 280)
    res.json({ text })
  } catch {
    res.status(502).json({ error: 'upstream' })
  } finally {
    clearTimeout(timer)
  }
})

const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 20_000 })

function send(ws: WebSocket, payload: unknown) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload))
}

function broadcastRoom(code: string) {
  const raw = hub.raw(code)
  if (!raw) return
  const room = redactRoom(raw)
  for (const player of raw.players) {
    const ws = sockets.get(player.id)
    if (ws) send(ws, { t: 'state', playerId: player.id, room })
  }
}

function remember(playerId: string, ws: WebSocket) {
  const previous = sockets.get(playerId)
  if (previous && previous !== ws) previous.close()
  sockets.set(playerId, ws)
}

wss.on('connection', (ws) => {
  let playerId = ''
  ws.on('message', (buf) => {
    let msg: {
      t?: string
      name?: string
      code?: string
      playerId?: string
      shiftSeconds?: number
      e2e?: boolean
      action?: Action
    }
    try {
      msg = JSON.parse(buf.toString()) as typeof msg
    } catch {
      send(ws, { t: 'error', code: 'invalid' })
      return
    }
    const now = Date.now()
    try {
      if (msg.t === 'solo' || msg.t === 'create') {
        const input = { name: String(msg.name ?? ''), now, shiftSeconds: Number(msg.shiftSeconds), e2e: Boolean(msg.e2e) }
        const result = msg.t === 'solo' ? hub.solo(input) : hub.create(input)
        if (!result.ok) {
          send(ws, { t: 'error', code: result.error })
          return
        }
        playerId = result.playerId
        remember(playerId, ws)
        broadcastRoom(result.room.code)
        return
      }
      if (msg.t === 'join') {
        const result = hub.join(String(msg.code ?? ''), String(msg.name ?? ''), now)
        if (!result.ok) {
          send(ws, { t: 'error', code: result.error })
          return
        }
        playerId = result.playerId
        remember(playerId, ws)
        broadcastRoom(result.room.code)
        return
      }
      if (msg.t === 'rejoin') {
        const result = hub.rejoin(String(msg.code ?? ''), String(msg.playerId ?? ''), now)
        if (!result.ok) {
          send(ws, { t: 'error', code: result.error })
          return
        }
        playerId = result.playerId
        remember(playerId, ws)
        broadcastRoom(result.room.code)
        return
      }
      if (msg.t === 'action' && playerId && msg.action) {
        const result = hub.action(playerId, msg.action, now)
        if (!result.ok) send(ws, { t: 'error', code: result.error })
        if (result.room) broadcastRoom(result.room.code)
        return
      }
      send(ws, { t: 'error', code: 'invalid' })
    } catch (error) {
      console.error('ws message failed', msg.t)
      console.error(error)
      send(ws, { t: 'error', code: 'invalid' })
    }
  })
  ws.on('close', () => {
    if (!playerId) return
    if (sockets.get(playerId) === ws) sockets.delete(playerId)
    const code = hub.codeFor(playerId)
    const next = hub.disconnect(playerId, Date.now())
    if (next) broadcastRoom(next.code)
    else if (code) broadcastRoom(code)
  })
})

setInterval(() => {
  const dirty = hub.tick(Date.now())
  for (const room of dirty) broadcastRoom(room.code)
}, 250)

async function attachFrontend() {
  if (!DEV) {
    app.use(express.static(distDir, { index: false, maxAge: '1h' }))
    app.use((req: Request, res: Response, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next()
      if (req.path.startsWith('/api') || req.path.startsWith('/ws') || req.path === '/healthz') return next()
      res.sendFile(path.join(distDir, 'index.html'), (error) => {
        if (error) next()
      })
    })
    return
  }
  const viteMod = await import('vite')
  const vite = await viteMod.createServer({
    root,
    configFile: path.join(root, 'vite.config.ts'),
    appType: 'spa',
    server: {
      middlewareMode: { server },
      hmr: { server },
      allowedHosts: true,
    },
  })
  app.use(vite.middlewares)
}

await attachFrontend()

server.listen(PORT, HOST, () => {
  console.log(`ScamOS 98 on http://${HOST}:${PORT} (${DEV ? 'development' : 'production'})`)
})
