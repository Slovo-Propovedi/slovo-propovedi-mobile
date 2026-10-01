package ru.slovopropovedi.audioeffects

import kotlin.math.log10

/** Floor for linear-to-dB conversion so that 0 gain maps to -60 dB instead of -Infinity. */
internal const val SILENCE_GAIN_DB = -60f

internal const val MILLIBELS_PER_DB = 100
internal const val MILLIHERTZ_PER_HZ = 1000

/**
 * Pure audio-effect math: no Android calls, so it is unit-testable on the JVM.
 * Callers pass equalizer ranges/band counts around; this object only transforms
 * numbers.
 */
internal object AudioEffectsMath {
  fun leftGainFactor(balance: Float): Float = (1f - balance).coerceIn(0f, 1f)

  fun rightGainFactor(balance: Float): Float = (1f + balance).coerceIn(0f, 1f)

  fun linearToDb(gain: Float): Float =
    if (gain <= 0f) SILENCE_GAIN_DB
    else (20f * log10(gain.toDouble()).toFloat()).coerceAtLeast(SILENCE_GAIN_DB)

  fun gainToMillibels(minMillibels: Int, maxMillibels: Int, gainDb: Float): Int =
    (gainDb * MILLIBELS_PER_DB).toInt().coerceIn(minMillibels, maxMillibels)

  fun resizeGains(gains: List<Float>, bandCount: Int, defaultGainDb: Float): List<Float> =
    List(bandCount) { band -> gains.getOrElse(band) { defaultGainDb } }

  fun milliHzToHz(centerFreqMilliHz: Int): Int = centerFreqMilliHz / MILLIHERTZ_PER_HZ
}
