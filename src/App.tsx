import { useEffect, useState } from 'react'
import { useRoom } from './net/useRoom'
import { sfx } from './audio/sfx'
import { useSettings } from './settings'
import { dict } from './i18n/dict'
import { useI18n } from './i18n/context'
import { HomeScreen } from './screens/HomeScreen'
import { RoomLobby } from './screens/RoomLobby'
import { ResultScreen } from './screens/ResultScreen'
import { Desktop } from './shift/Desktop'
import { MobileShift } from './shift/MobileShift'
import { callOf, useNow } from './shift/widgets'

function useMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const onChange = () => setMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return mobile
}

export function App() {
  const net = useRoom()
  const { settings } = useSettings()
  const { t } = useI18n()
  const mobile = useMobile()
  const preset = new URLSearchParams(location.search).get('room')?.toUpperCase() ?? ''
  sfx.muted = settings.muted
  useEffect(() => {
    if (!settings.muted) return
    sfx.stopRing()
  }, [settings.muted])
  return (
    <div className="min-h-dvh w-full max-w-full overflow-x-hidden" onPointerDown={() => sfx.unlock()}>
      {!net.connected && !net.room ? <p className="px-4 pt-3 text-sm text-yolk">{t(dict.offline)}</p> : null}
      {!net.room ? (
        <HomeScreen
          connected={net.connected}
          error={net.error}
          preset={preset}
          onSolo={net.solo}
          onCreate={net.create}
          onJoin={net.join}
        />
      ) : net.room.phase === 'lobby' ? (
        <RoomLobby room={net.room} playerId={net.playerId || ''} error={net.error} onStart={() => net.act({ type: 'start_shift' })} onShift={(seconds) => net.act({ type: 'set_shift', seconds })} />
      ) : net.room.phase === 'review' || net.room.phase === 'fired' ? (
        <ResultScreen room={net.room} playerId={net.playerId || ''} act={net.act} />
      ) : (
        <ShiftRoom mobile={mobile} room={net.room} playerId={net.playerId || ''} act={net.act} />
      )}
    </div>
  )
}

function ShiftRoom({
  mobile,
  room,
  playerId,
  act,
}: {
  mobile: boolean
  room: NonNullable<ReturnType<typeof useRoom>['room']>
  playerId: string
  act: ReturnType<typeof useRoom>['act']
}) {
  const now = useNow(room.phase === 'shift')
  const call = callOf(room, playerId)
  useEffect(() => {
    if (call?.status === 'ringing') sfx.startRing()
    else sfx.stopRing()
    return () => sfx.stopRing()
  }, [call?.id, call?.status])
  useEffect(() => {
    if (room.boss) sfx.boss()
  }, [room.boss?.until])
  useEffect(() => {
    if (room.shiftEndsAt && room.shiftEndsAt - now <= 10_000 && room.shiftEndsAt - now > 0) sfx.tick()
  }, [Math.floor((room.shiftEndsAt ?? 0) - now) / 1000])
  const earned = room.players.find((p) => p.id === playerId)?.earned ?? 0
  useEffect(() => {
    if (earned > 0) sfx.cash()
  }, [earned])
  if (mobile) return <MobileShift room={room} playerId={playerId} act={act} />
  return <Desktop room={room} playerId={playerId} act={act} />
}
