'use client'

import { withBase } from './basePath'

/**
 * Tiny sound manager. Mechanical ticks and fanfares are synthesized with
 * WebAudio (no assets needed); the CS:GO case-open sound uses the bundled mp3.
 */

let ctx: AudioContext | null = null
let enabled = true

export function setSoundEnabled(on: boolean) {
  enabled = on
}

function audioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** Short wheel/roulette tick. */
export function playTick(pitch = 1) {
  if (!enabled) return
  const ac = audioCtx()
  if (!ac) return
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'square'
  osc.frequency.value = 1800 * pitch
  gain.gain.setValueAtTime(0.06, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.04)
  osc.connect(gain).connect(ac.destination)
  osc.start()
  osc.stop(ac.currentTime + 0.05)
}

/** Rising chime when a player is locked in. */
export function playLockIn() {
  if (!enabled) return
  const ac = audioCtx()
  if (!ac) return
  const notes = [523.25, 659.25, 783.99] // C5 E5 G5
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const t = ac.currentTime + i * 0.07
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
    osc.connect(gain).connect(ac.destination)
    osc.start(t)
    osc.stop(t + 0.4)
  })
}

/** Victory fanfare when teams are complete. */
export function playFanfare() {
  if (!enabled) return
  const ac = audioCtx()
  if (!ac) return
  const seq = [392, 523.25, 659.25, 783.99, 1046.5]
  seq.forEach((freq, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sawtooth'
    osc.frequency.value = freq
    const t = ac.currentTime + i * 0.12
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.08, t + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
    osc.connect(gain).connect(ac.destination)
    osc.start(t)
    osc.stop(t + 0.55)
  })
}

let caseAudio: HTMLAudioElement | null = null
/** The bundled CS:GO case-opening sound. */
export function playCaseOpen() {
  if (!enabled || typeof window === 'undefined') return
  if (!caseAudio) caseAudio = new Audio(withBase('/csgo-wheel-sound.mp3'))
  caseAudio.currentTime = 0
  caseAudio.volume = 0.6
  void caseAudio.play().catch(() => {})
}

export function stopCaseOpen() {
  if (caseAudio) {
    caseAudio.pause()
    caseAudio.currentTime = 0
  }
}
