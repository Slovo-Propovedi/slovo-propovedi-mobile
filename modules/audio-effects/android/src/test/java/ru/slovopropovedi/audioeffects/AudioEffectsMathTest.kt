package ru.slovopropovedi.audioeffects

import org.junit.Assert.assertEquals
import org.junit.Test

private const val EXACT = 0f
private const val LOG_DELTA = 0.01f

class AudioEffectsMathTest {
  @Test
  fun `centered balance leaves both channels at unity gain`() {
    assertEquals(1f, AudioEffectsMath.leftGainFactor(0f), EXACT)
    assertEquals(1f, AudioEffectsMath.rightGainFactor(0f), EXACT)
  }

  @Test
  fun `fully right balance silences the left channel`() {
    assertEquals(0f, AudioEffectsMath.leftGainFactor(1f), EXACT)
    assertEquals(1f, AudioEffectsMath.rightGainFactor(1f), EXACT)
  }

  @Test
  fun `fully left balance silences the right channel`() {
    assertEquals(1f, AudioEffectsMath.leftGainFactor(-1f), EXACT)
    assertEquals(0f, AudioEffectsMath.rightGainFactor(-1f), EXACT)
  }

  @Test
  fun `out of range balance clamps to the audible window`() {
    assertEquals(0f, AudioEffectsMath.leftGainFactor(3f), EXACT)
    assertEquals(1f, AudioEffectsMath.rightGainFactor(3f), EXACT)
    assertEquals(1f, AudioEffectsMath.leftGainFactor(-3f), EXACT)
    assertEquals(0f, AudioEffectsMath.rightGainFactor(-3f), EXACT)
  }

  @Test
  fun `linearToDb maps unity gain to zero decibels`() {
    assertEquals(0f, AudioEffectsMath.linearToDb(1f), EXACT)
  }

  @Test
  fun `linearToDb floors silence and negative gain at minus sixty decibels`() {
    assertEquals(-60f, AudioEffectsMath.linearToDb(0f), EXACT)
    assertEquals(-60f, AudioEffectsMath.linearToDb(-0.5f), EXACT)
  }

  @Test
  fun `linearToDb maps half gain to about minus six decibels`() {
    assertEquals(-6.02f, AudioEffectsMath.linearToDb(0.5f), LOG_DELTA)
  }

  @Test
  fun `gainToMillibels scales decibels by one hundred`() {
    assertEquals(150, AudioEffectsMath.gainToMillibels(-1500, 1500, 1.5f))
  }

  @Test
  fun `gainToMillibels clamps to the equalizer range`() {
    assertEquals(1500, AudioEffectsMath.gainToMillibels(-1500, 1500, 30f))
    assertEquals(-1500, AudioEffectsMath.gainToMillibels(-1500, 1500, -30f))
  }

  @Test
  fun `resizeGains pads a shorter list with the default gain`() {
    assertEquals(
      listOf(1f, 2f, 0f, 0f),
      AudioEffectsMath.resizeGains(listOf(1f, 2f), 4, 0f),
    )
  }

  @Test
  fun `resizeGains truncates a longer list to the device band count`() {
    assertEquals(
      listOf(1f, 2f),
      AudioEffectsMath.resizeGains(listOf(1f, 2f, 3f), 2, 0f),
    )
  }

  @Test
  fun `resizeGains returns the stored gains unchanged when lengths match`() {
    assertEquals(
      listOf(1f, 2f),
      AudioEffectsMath.resizeGains(listOf(1f, 2f), 2, 0f),
    )
  }

  @Test
  fun `resizeGains fills every band with the default gain when nothing is stored`() {
    assertEquals(listOf(-3f, -3f), AudioEffectsMath.resizeGains(emptyList(), 2, -3f))
  }

  @Test
  fun `milliHzToHz converts millihertz to whole hertz`() {
    assertEquals(100, AudioEffectsMath.milliHzToHz(100_000))
    assertEquals(60, AudioEffectsMath.milliHzToHz(60_000))
    assertEquals(0, AudioEffectsMath.milliHzToHz(999))
  }
}
