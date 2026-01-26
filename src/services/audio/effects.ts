export type EffectName = 'scratch' | 'airhorn' | 'rewind' | 'drop' | 'siren' | 'laser'

interface Effect {
  name: EffectName
  label: string
  shortcut: string
  buffer: AudioBuffer | null
}

const EFFECT_CONFIG: Record<EffectName, { label: string; shortcut: string }> = {
  scratch: { label: 'Scratch', shortcut: 's' },
  airhorn: { label: 'Air Horn', shortcut: 'a' },
  rewind: { label: 'Rewind', shortcut: 'r' },
  drop: { label: 'Drop', shortcut: 'd' },
  siren: { label: 'Siren', shortcut: 'q' },
  laser: { label: 'Laser', shortcut: 'l' },
}

class DJEffects {
  private audioContext: AudioContext | null = null
  private effects: Map<EffectName, Effect> = new Map()
  private gainNode: GainNode | null = null
  private _volume: number = 0.8

  constructor() {
    // Initialize effects map with config
    for (const [name, config] of Object.entries(EFFECT_CONFIG)) {
      this.effects.set(name as EffectName, {
        name: name as EffectName,
        label: config.label,
        shortcut: config.shortcut,
        buffer: null,
      })
    }
  }

  /**
   * Initialize the audio context (must be called after user interaction)
   */
  async initialize(): Promise<void> {
    if (this.audioContext) return

    this.audioContext = new AudioContext()
    this.gainNode = this.audioContext.createGain()
    this.gainNode.gain.value = this._volume
    this.gainNode.connect(this.audioContext.destination)

    // Load all effects
    await this.loadAllEffects()
  }

  /**
   * Load all effect sounds
   */
  private async loadAllEffects(): Promise<void> {
    // For now, we'll generate simple synthetic sounds
    // In production, you'd load actual audio files
    const loadPromises = Array.from(this.effects.keys()).map((name) =>
      this.generateSyntheticSound(name)
    )
    await Promise.all(loadPromises)
  }

  /**
   * Generate synthetic sounds (placeholder until real audio files are added)
   */
  private async generateSyntheticSound(name: EffectName): Promise<void> {
    if (!this.audioContext) return

    const sampleRate = this.audioContext.sampleRate
    let duration: number
    let buffer: AudioBuffer

    switch (name) {
      case 'scratch':
        duration = 0.5
        buffer = this.createScratchSound(sampleRate, duration)
        break
      case 'airhorn':
        duration = 1.5
        buffer = this.createAirhornSound(sampleRate, duration)
        break
      case 'rewind':
        duration = 1.0
        buffer = this.createRewindSound(sampleRate, duration)
        break
      case 'drop':
        duration = 0.8
        buffer = this.createDropSound(sampleRate, duration)
        break
      case 'siren':
        duration = 2.0
        buffer = this.createSirenSound(sampleRate, duration)
        break
      case 'laser':
        duration = 0.3
        buffer = this.createLaserSound(sampleRate, duration)
        break
      default:
        return
    }

    const effect = this.effects.get(name)
    if (effect) {
      effect.buffer = buffer
    }
  }

  private createScratchSound(sampleRate: number, duration: number): AudioBuffer {
    const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      // Frequency wobble for scratch effect
      const freq = 200 + Math.sin(t * 30) * 150
      data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 4) * 0.5
      // Add some noise
      data[i] += (Math.random() - 0.5) * 0.3 * Math.exp(-t * 3)
    }

    return buffer
  }

  private createAirhornSound(sampleRate: number, duration: number): AudioBuffer {
    const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      // Multiple harmonics for airhorn
      const fundamental = 440
      let sample = 0
      sample += Math.sin(2 * Math.PI * fundamental * t) * 0.5
      sample += Math.sin(2 * Math.PI * fundamental * 1.5 * t) * 0.3
      sample += Math.sin(2 * Math.PI * fundamental * 2 * t) * 0.2

      // Envelope
      const attack = Math.min(t / 0.05, 1)
      const release = t > duration - 0.3 ? (duration - t) / 0.3 : 1

      data[i] = sample * attack * release
    }

    return buffer
  }

  private createRewindSound(sampleRate: number, duration: number): AudioBuffer {
    const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      // Rising frequency
      const freq = 100 + (t / duration) * 800
      data[i] = Math.sin(2 * Math.PI * freq * t) * 0.4
      // Add noise bursts
      if (Math.random() < 0.1) {
        data[i] += (Math.random() - 0.5) * 0.3
      }
    }

    return buffer
  }

  private createDropSound(sampleRate: number, duration: number): AudioBuffer {
    const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      // Descending bass frequency
      const freq = 200 * Math.exp(-t * 3)
      data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 2) * 0.8
    }

    return buffer
  }

  private createSirenSound(sampleRate: number, duration: number): AudioBuffer {
    const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      // Oscillating frequency
      const freq = 600 + Math.sin(t * 4) * 200
      data[i] = Math.sin(2 * Math.PI * freq * t) * 0.4
    }

    return buffer
  }

  private createLaserSound(sampleRate: number, duration: number): AudioBuffer {
    const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      // Descending high frequency
      const freq = 2000 * Math.exp(-t * 10)
      data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 5) * 0.5
    }

    return buffer
  }

  /**
   * Play an effect by name
   */
  play(name: EffectName): void {
    if (!this.audioContext || !this.gainNode) {
      console.warn('DJEffects not initialized. Call initialize() first.')
      return
    }

    const effect = this.effects.get(name)
    if (!effect || !effect.buffer) {
      console.warn(`Effect "${name}" not loaded`)
      return
    }

    // Resume audio context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    const source = this.audioContext.createBufferSource()
    source.buffer = effect.buffer
    source.connect(this.gainNode)
    source.start()
  }

  /**
   * Set effects volume
   */
  setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume))
    if (this.gainNode) {
      this.gainNode.gain.value = this._volume
    }
  }

  /**
   * Get current volume
   */
  get volume(): number {
    return this._volume
  }

  /**
   * Get all effect names and their shortcuts
   */
  getEffectList(): Array<{ name: EffectName; label: string; shortcut: string }> {
    return Array.from(this.effects.values()).map((e) => ({
      name: e.name,
      label: e.label,
      shortcut: e.shortcut,
    }))
  }

  /**
   * Get effect by keyboard shortcut
   */
  getEffectByShortcut(key: string): EffectName | null {
    for (const effect of this.effects.values()) {
      if (effect.shortcut.toLowerCase() === key.toLowerCase()) {
        return effect.name
      }
    }
    return null
  }
}

// Singleton instance
export const djEffects = new DJEffects()
