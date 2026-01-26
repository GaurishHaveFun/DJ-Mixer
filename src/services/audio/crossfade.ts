export type CrossfadeCurve = 'linear' | 'equalPower' | 'sCurve'

/**
 * Calculate deck volumes based on crossfader position
 * @param position - Crossfader position from -100 (full A) to +100 (full B)
 * @param curve - The crossfade curve type
 * @returns Volume multipliers for each deck (0 to 1)
 */
export function calculateVolumes(
  position: number,
  curve: CrossfadeCurve = 'equalPower'
): { deckA: number; deckB: number } {
  // Normalize position from -100..+100 to 0..1
  const normalized = (position + 100) / 200

  switch (curve) {
    case 'linear':
      return {
        deckA: 1 - normalized,
        deckB: normalized,
      }

    case 'equalPower':
      // Equal power maintains constant perceived loudness during crossfade
      return {
        deckA: Math.cos(normalized * Math.PI / 2),
        deckB: Math.sin(normalized * Math.PI / 2),
      }

    case 'sCurve':
      // S-curve: sharp cut in the middle, good for scratching/quick cuts
      const sCurve = (x: number) =>
        x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
      return {
        deckA: 1 - sCurve(normalized),
        deckB: sCurve(normalized),
      }

    default:
      return { deckA: 1, deckB: 1 }
  }
}

interface TransitionConfig {
  duration: number // Duration in ms
  curve: CrossfadeCurve
  onProgress?: (position: number) => void
  onComplete?: () => void
}

/**
 * Animate crossfader from current position to target
 */
export function animateCrossfade(
  fromPosition: number,
  toPosition: number,
  config: TransitionConfig
): () => void {
  const { duration, onProgress, onComplete } = config
  const startTime = performance.now()
  let animationId: number

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)

    // Ease in-out for smooth transition
    const eased = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2

    const currentPosition = fromPosition + (toPosition - fromPosition) * eased

    onProgress?.(currentPosition)

    if (progress < 1) {
      animationId = requestAnimationFrame(animate)
    } else {
      onComplete?.()
    }
  }

  animationId = requestAnimationFrame(animate)

  // Return cancel function
  return () => cancelAnimationFrame(animationId)
}

/**
 * Auto-transition: Detects when to start crossfading based on track position
 */
export interface AutoTransitionConfig {
  fadeStartTime: number // Start fading this many ms before track ends
  fadeDuration: number // Duration of the crossfade
  curve: CrossfadeCurve
}

export const DEFAULT_AUTO_TRANSITION: AutoTransitionConfig = {
  fadeStartTime: 8000, // Start 8 seconds before end
  fadeDuration: 5000, // 5 second fade
  curve: 'equalPower',
}

/**
 * Check if auto-transition should begin
 */
export function shouldStartAutoTransition(
  currentPosition: number,
  trackDuration: number,
  config: AutoTransitionConfig = DEFAULT_AUTO_TRANSITION
): boolean {
  const timeRemaining = trackDuration - currentPosition
  return timeRemaining <= config.fadeStartTime && timeRemaining > 0
}
