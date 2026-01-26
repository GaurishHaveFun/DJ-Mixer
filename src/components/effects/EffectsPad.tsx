import { useState } from 'react'
import { djEffects, type EffectName } from '../../services/audio/effects'

export default function EffectsPad() {
  const [activeEffect, setActiveEffect] = useState<EffectName | null>(null)
  const [volume, setVolume] = useState(djEffects.volume * 100)

  const effects = djEffects.getEffectList()

  const handlePlay = (name: EffectName) => {
    setActiveEffect(name)
    djEffects.play(name)
    // Reset active state after a short delay
    setTimeout(() => setActiveEffect(null), 200)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value)
    setVolume(newVolume)
    djEffects.setVolume(newVolume / 100)
  }

  return (
    <div className="bg-spotify-darkgray rounded-lg p-4">
      <h2 className="text-white font-semibold mb-4 text-center">EFFECTS</h2>

      {/* Effect Pads */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {effects.map((effect) => (
          <button
            key={effect.name}
            onClick={() => handlePlay(effect.name)}
            className={`p-3 rounded-lg font-bold text-sm transition-all ${
              activeEffect === effect.name
                ? 'bg-spotify-green text-black scale-95'
                : 'bg-gray-700 text-white hover:bg-gray-600 active:scale-95'
            }`}
          >
            <div>{effect.label}</div>
            <div className="text-xs opacity-60 mt-1">[ {effect.shortcut.toUpperCase()} ]</div>
          </button>
        ))}
      </div>

      {/* Effects Volume */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-spotify-lightgray mb-2">
          <span>Effects Volume</span>
          <span>{Math.round(volume)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
          className="w-full"
        />
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="mt-4 text-center">
        <p className="text-spotify-lightgray text-xs">
          Press keyboard shortcuts to trigger effects
        </p>
      </div>
    </div>
  )
}
