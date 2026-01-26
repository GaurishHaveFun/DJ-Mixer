/**
 * Demo Audio Player - Generates synthetic music for demo mode
 * Each track has a unique sound pattern using Web Audio API
 */

type TrackStyle = 'house' | 'techno' | 'ambient' | 'dnb' | 'hiphop' | 'disco' | 'synthwave' | 'deephouse'

interface TrackConfig {
  style: TrackStyle
  bpm: number
  baseFreq: number
}

// Map demo track IDs to their audio configurations
const TRACK_CONFIGS: Record<string, TrackConfig> = {
  'demo-1': { style: 'house', bpm: 124, baseFreq: 110 },      // Summer Vibes
  'demo-2': { style: 'synthwave', bpm: 100, baseFreq: 82 },   // Night Drive
  'demo-3': { style: 'dnb', bpm: 174, baseFreq: 55 },         // Bass Drop
  'demo-4': { style: 'ambient', bpm: 90, baseFreq: 130 },     // Sunset Beach
  'demo-5': { style: 'techno', bpm: 138, baseFreq: 65 },      // Techno Pulse
  'demo-6': { style: 'disco', bpm: 118, baseFreq: 98 },       // Funk It Up
  'demo-7': { style: 'synthwave', bpm: 108, baseFreq: 73 },   // Midnight City
  'demo-8': { style: 'deephouse', bpm: 122, baseFreq: 87 },   // Deep House Journey
}

class DemoAudioPlayer {
  private audioContext: AudioContext | null = null
  private gainNode: GainNode | null = null
  private currentOscillators: OscillatorNode[] = []
  private currentGains: GainNode[] = []
  private intervalId: number | null = null
  private _volume: number = 0.5
  private _isPlaying: boolean = false
  private currentTrackId: string | null = null

  async initialize(): Promise<void> {
    if (this.audioContext) return
    this.audioContext = new AudioContext()
    this.gainNode = this.audioContext.createGain()
    this.gainNode.gain.value = this._volume
    this.gainNode.connect(this.audioContext.destination)
  }

  async play(trackId: string): Promise<void> {
    if (!this.audioContext || !this.gainNode) {
      await this.initialize()
    }

    // Resume context if suspended
    if (this.audioContext!.state === 'suspended') {
      await this.audioContext!.resume()
    }

    // Stop any current playback
    this.stop()

    const config = TRACK_CONFIGS[trackId] || TRACK_CONFIGS['demo-1']
    this.currentTrackId = trackId
    this._isPlaying = true

    this.startPattern(config)
  }

  private startPattern(config: TrackConfig): void {
    const { style, bpm, baseFreq } = config
    const beatInterval = 60000 / bpm // ms per beat

    // Create base oscillators based on style
    switch (style) {
      case 'house':
        this.playHousePattern(baseFreq, beatInterval)
        break
      case 'techno':
        this.playTechnoPattern(baseFreq, beatInterval)
        break
      case 'ambient':
        this.playAmbientPattern(baseFreq, beatInterval)
        break
      case 'dnb':
        this.playDnBPattern(baseFreq, beatInterval)
        break
      case 'hiphop':
        this.playHipHopPattern(baseFreq, beatInterval)
        break
      case 'disco':
        this.playDiscoPattern(baseFreq, beatInterval)
        break
      case 'synthwave':
        this.playSynthwavePattern(baseFreq, beatInterval)
        break
      case 'deephouse':
        this.playDeepHousePattern(baseFreq, beatInterval)
        break
    }
  }

  private createOscillator(type: OscillatorType, freq: number): { osc: OscillatorNode; gain: GainNode } {
    const osc = this.audioContext!.createOscillator()
    const gain = this.audioContext!.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.value = 0
    osc.connect(gain)
    gain.connect(this.gainNode!)
    osc.start()
    this.currentOscillators.push(osc)
    this.currentGains.push(gain)
    return { osc, gain }
  }

  private playHousePattern(baseFreq: number, beatInterval: number): void {
    // 4-on-the-floor kick pattern with bassline
    const kick = this.createOscillator('sine', baseFreq)
    const bass = this.createOscillator('sawtooth', baseFreq * 2)
    const hihat = this.createOscillator('square', 8000)

    let beat = 0
    this.intervalId = window.setInterval(() => {
      const time = this.audioContext!.currentTime

      // Kick on every beat
      kick.gain.gain.setValueAtTime(0.4, time)
      kick.gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1)
      kick.osc.frequency.setValueAtTime(baseFreq * 2, time)
      kick.osc.frequency.exponentialRampToValueAtTime(baseFreq, time + 0.05)

      // Hi-hat on off-beats
      if (beat % 2 === 1) {
        hihat.gain.gain.setValueAtTime(0.05, time)
        hihat.gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
      }

      // Bass on beat 1 and 3
      if (beat % 4 === 0 || beat % 4 === 2) {
        bass.gain.gain.setValueAtTime(0.15, time)
        bass.gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2)
      }

      beat = (beat + 1) % 8
    }, beatInterval / 2)
  }

  private playTechnoPattern(baseFreq: number, beatInterval: number): void {
    const kick = this.createOscillator('sine', baseFreq)
    const synth = this.createOscillator('sawtooth', baseFreq * 4)

    let beat = 0
    this.intervalId = window.setInterval(() => {
      const time = this.audioContext!.currentTime

      // Hard kick
      kick.gain.gain.setValueAtTime(0.5, time)
      kick.gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08)
      kick.osc.frequency.setValueAtTime(baseFreq * 3, time)
      kick.osc.frequency.exponentialRampToValueAtTime(baseFreq, time + 0.04)

      // Synth stab
      if (beat % 4 === 2) {
        synth.gain.gain.setValueAtTime(0.1, time)
        synth.gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1)
        synth.osc.frequency.setValueAtTime(baseFreq * 4 * (1 + Math.random() * 0.5), time)
      }

      beat = (beat + 1) % 8
    }, beatInterval)
  }

  private playAmbientPattern(baseFreq: number, beatInterval: number): void {
    const pad1 = this.createOscillator('sine', baseFreq)
    const pad2 = this.createOscillator('sine', baseFreq * 1.5)
    const pad3 = this.createOscillator('sine', baseFreq * 2)

    // Slow evolving pads
    pad1.gain.gain.value = 0.1
    pad2.gain.gain.value = 0.08
    pad3.gain.gain.value = 0.06

    let phase = 0
    this.intervalId = window.setInterval(() => {
      const time = this.audioContext!.currentTime

      // Gentle frequency modulation
      pad1.osc.frequency.setValueAtTime(baseFreq * (1 + Math.sin(phase) * 0.02), time)
      pad2.osc.frequency.setValueAtTime(baseFreq * 1.5 * (1 + Math.sin(phase * 0.7) * 0.02), time)
      pad3.osc.frequency.setValueAtTime(baseFreq * 2 * (1 + Math.sin(phase * 0.5) * 0.02), time)

      phase += 0.1
    }, beatInterval)
  }

  private playDnBPattern(baseFreq: number, beatInterval: number): void {
    const kick = this.createOscillator('sine', baseFreq)
    const snare = this.createOscillator('triangle', 200)
    const bass = this.createOscillator('sawtooth', baseFreq * 2)

    let beat = 0
    this.intervalId = window.setInterval(() => {
      const time = this.audioContext!.currentTime

      // Kick pattern (syncopated)
      if (beat === 0 || beat === 6 || beat === 10) {
        kick.gain.gain.setValueAtTime(0.4, time)
        kick.gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1)
        kick.osc.frequency.setValueAtTime(baseFreq * 2, time)
        kick.osc.frequency.exponentialRampToValueAtTime(baseFreq, time + 0.05)
      }

      // Snare on 4 and 12
      if (beat === 4 || beat === 12) {
        snare.gain.gain.setValueAtTime(0.2, time)
        snare.gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1)
      }

      // Rolling bass
      if (beat % 2 === 0) {
        bass.gain.gain.setValueAtTime(0.1, time)
        bass.gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1)
        bass.osc.frequency.setValueAtTime(baseFreq * (2 + (beat % 4) * 0.25), time)
      }

      beat = (beat + 1) % 16
    }, beatInterval / 4)
  }

  private playHipHopPattern(baseFreq: number, beatInterval: number): void {
    const kick = this.createOscillator('sine', baseFreq)
    const snare = this.createOscillator('triangle', 180)

    let beat = 0
    this.intervalId = window.setInterval(() => {
      const time = this.audioContext!.currentTime

      // Boom bap pattern
      if (beat === 0 || beat === 6) {
        kick.gain.gain.setValueAtTime(0.4, time)
        kick.gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15)
      }

      if (beat === 4 || beat === 12) {
        snare.gain.gain.setValueAtTime(0.25, time)
        snare.gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1)
      }

      beat = (beat + 1) % 16
    }, beatInterval / 4)
  }

  private playDiscoPattern(baseFreq: number, beatInterval: number): void {
    const kick = this.createOscillator('sine', baseFreq)
    const hihat = this.createOscillator('square', 6000)
    const bass = this.createOscillator('triangle', baseFreq * 2)

    let beat = 0
    this.intervalId = window.setInterval(() => {
      const time = this.audioContext!.currentTime

      // Four on the floor
      if (beat % 2 === 0) {
        kick.gain.gain.setValueAtTime(0.35, time)
        kick.gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1)
      }

      // Off-beat hi-hats (disco style)
      if (beat % 2 === 1) {
        hihat.gain.gain.setValueAtTime(0.06, time)
        hihat.gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
      }

      // Funky bassline
      const bassNotes = [1, 1, 1.25, 1, 1.5, 1, 1.25, 1]
      bass.gain.gain.setValueAtTime(0.12, time)
      bass.gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1)
      bass.osc.frequency.setValueAtTime(baseFreq * 2 * bassNotes[beat % 8], time)

      beat = (beat + 1) % 8
    }, beatInterval / 2)
  }

  private playSynthwavePattern(baseFreq: number, beatInterval: number): void {
    const bass = this.createOscillator('sawtooth', baseFreq)
    const pad = this.createOscillator('triangle', baseFreq * 4)
    const arp = this.createOscillator('square', baseFreq * 8)

    let beat = 0
    this.intervalId = window.setInterval(() => {
      const time = this.audioContext!.currentTime

      // Pulsing bass
      bass.gain.gain.setValueAtTime(0.15, time)
      bass.gain.gain.exponentialRampToValueAtTime(0.05, time + beatInterval / 1000)

      // Pad swell
      pad.gain.gain.setValueAtTime(0.05 + (beat % 8) * 0.01, time)

      // Arpeggio
      const arpNotes = [1, 1.25, 1.5, 2, 1.5, 1.25, 1, 0.75]
      arp.gain.gain.setValueAtTime(0.04, time)
      arp.gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08)
      arp.osc.frequency.setValueAtTime(baseFreq * 8 * arpNotes[beat % 8], time)

      beat = (beat + 1) % 8
    }, beatInterval / 2)
  }

  private playDeepHousePattern(baseFreq: number, beatInterval: number): void {
    const kick = this.createOscillator('sine', baseFreq)
    const bass = this.createOscillator('sine', baseFreq * 2)
    const chord = this.createOscillator('triangle', baseFreq * 6)

    let beat = 0
    this.intervalId = window.setInterval(() => {
      const time = this.audioContext!.currentTime

      // Soft kick
      kick.gain.gain.setValueAtTime(0.3, time)
      kick.gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15)
      kick.osc.frequency.setValueAtTime(baseFreq * 1.5, time)
      kick.osc.frequency.exponentialRampToValueAtTime(baseFreq, time + 0.08)

      // Deep rolling bass
      if (beat % 2 === 0) {
        bass.gain.gain.setValueAtTime(0.12, time)
        bass.gain.gain.exponentialRampToValueAtTime(0.03, time + 0.3)
      }

      // Chord stabs
      if (beat === 2 || beat === 6) {
        chord.gain.gain.setValueAtTime(0.06, time)
        chord.gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4)
      }

      beat = (beat + 1) % 8
    }, beatInterval / 2)
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    // Stop and disconnect all oscillators
    this.currentOscillators.forEach(osc => {
      try {
        osc.stop()
        osc.disconnect()
      } catch {
        // Ignore errors if already stopped
      }
    })
    this.currentGains.forEach(gain => {
      try {
        gain.disconnect()
      } catch {
        // Ignore errors
      }
    })

    this.currentOscillators = []
    this.currentGains = []
    this._isPlaying = false
    this.currentTrackId = null
  }

  setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume))
    if (this.gainNode) {
      this.gainNode.gain.value = this._volume
    }
  }

  get volume(): number {
    return this._volume
  }

  get isPlaying(): boolean {
    return this._isPlaying
  }

  get trackId(): string | null {
    return this.currentTrackId
  }
}

// Singleton instance
export const demoPlayer = new DemoAudioPlayer()
