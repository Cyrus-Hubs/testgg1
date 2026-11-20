let ctx: AudioContext | null = null
let ringTimer: number | null = null

function context() {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

function tone(freq: number, dur: number, type: OscillatorType, gain = 0.05) {
  const audio = context()
  const osc = audio.createOscillator()
  const amp = audio.createGain()
  osc.type = type
  osc.frequency.value = freq
  amp.gain.setValueAtTime(0.0001, audio.currentTime)
  amp.gain.exponentialRampToValueAtTime(gain, audio.currentTime + 0.02)
  amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur)
  osc.connect(amp).connect(audio.destination)
  osc.start()
  osc.stop(audio.currentTime + dur + 0.02)
}

export const sfx = {
  muted: false,
  unlock() {
    try {
      const audio = context()
      if (audio.state === 'suspended') void audio.resume()
    } catch {
      /* ignore */
    }
  },
  blip() {
    if (this.muted) return
    try {
      tone(520, 0.08, 'square', 0.04)
    } catch {
      /* ignore */
    }
  },
  startRing() {
    if (this.muted || ringTimer) return
    const beep = () => {
      if (sfx.muted) return
      try {
        tone(440, 0.18, 'square', 0.04)
        window.setTimeout(() => tone(480, 0.22, 'square', 0.04), 200)
      } catch {
        /* ignore */
      }
    }
    beep()
    ringTimer = window.setInterval(beep, 1600)
  },
  stopRing() {
    if (ringTimer) window.clearInterval(ringTimer)
    ringTimer = null
  },
  cash() {
    if (this.muted) return
    try {
      ;[523, 659, 784, 1046].forEach((freq, i) => window.setTimeout(() => tone(freq, 0.12, 'triangle', 0.05), i * 90))
    } catch {
      /* ignore */
    }
  },
  bad() {
    if (this.muted) return
    try {
      tone(180, 0.2, 'sawtooth', 0.05)
    } catch {
      /* ignore */
    }
  },
  virus() {
    if (this.muted) return
    try {
      tone(140, 0.25, 'square', 0.05)
      tone(155, 0.25, 'square', 0.03)
    } catch {
      /* ignore */
    }
  },
  boss() {
    if (this.muted) return
    try {
      tone(90, 0.35, 'sawtooth', 0.06)
    } catch {
      /* ignore */
    }
  },
  tick() {
    if (this.muted) return
    try {
      tone(880, 0.05, 'square', 0.03)
    } catch {
      /* ignore */
    }
  },
}
