package ru.slovopropovedi.audioeffects

import android.content.Context
import android.content.Intent
import android.media.MediaRouter2
import android.media.audiofx.AudioEffect
import android.media.audiofx.DynamicsProcessing
import android.media.audiofx.Equalizer
import android.os.Build
import android.util.Log
import androidx.media3.common.C
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import expo.modules.audio.AudioPlayer
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext

private const val TAG = "AudioEffectsModule"

/** Equalizer/DynamicsProcessing priority: 0 = normal priority, same as most media apps. */
private const val EFFECT_PRIORITY = 0

private const val DEFAULT_MIN_BAND_DB = -15.0
private const val DEFAULT_MAX_BAND_DB = 15.0
private const val DEFAULT_BAND_GAIN_DB = 0f
private const val BALANCE_MIN = -1f
private const val BALANCE_MAX = 1f
private const val PITCH_MIN = 0.5f
private const val PITCH_MAX = 2f

private const val CHANNEL_LEFT = 0
private const val CHANNEL_RIGHT = 1

/**
 * Settings.Panel media output action. The SDK constant is hidden, so the stable
 * string value is used directly. The panel exists since API 30 (R).
 */
private const val ACTION_MEDIA_OUTPUT_PANEL = "android.settings.panel.action.MEDIA_OUTPUT"

/**
 * Settings snapshot the JS side passes on every (re)attach: balance in [-1, 1]
 * (-1 = fully left, 1 = fully right), equalizer band gains in dB, the desired
 * pitch and the current playback rate. Speed is deliberately NOT read from the
 * player at pitch time — expo-audio's own rate writes are queued on the same
 * main queue, so reading the player mid-flight could resurrect a stale value.
 */
data class AttachSettings(
  @Field val balance: Double = 0.0,
  @Field val eqEnabled: Boolean = false,
  @Field val eqGains: List<Double> = emptyList(),
  @Field val pitch: Double = 1.0,
  @Field val rate: Double = 1.0,
) : Record

/**
 * Attaches system audio effects (equalizer, balance via DynamicsProcessing and
 * pitch correction) to the ExoPlayer instance owned by expo-audio.
 *
 * The player is created on the main looper and is not thread-safe, so every
 * player interaction below runs on the main queue: `attach` is a suspend
 * AsyncFunction that resolves the capability snapshot after the main-queue hop,
 * all other functions are fire-and-forget launches. Module state is only touched
 * inside those queued bodies. The player is recreated on every track load, so JS
 * re-calls `attach` after each loadAudio/replaceAudio. Every effect call is
 * guarded: a missing/failed effect degrades the capability flag but errors are
 * never thrown to JS.
 */
@OptIn(UnstableApi::class)
class AudioEffectsModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private var attachedPlayer: ExoPlayer? = null
  private var equalizer: Equalizer? = null
  private var equalizerSupported = false
  private var equalizerEnabled = false
  private var bandCount = 0
  private var bandGainsDb = mutableListOf<Float>()
  private var balanceProcessor: DynamicsProcessing? = null
  private var balanceSupported = false
  private var balance = 0f
  private var playbackRate = 1f

  private val sessionListener = object : Player.Listener {
    override fun onAudioSessionIdChanged(audioSessionId: Int) {
      recreateEffects(audioSessionId)
    }
  }

  override fun definition() = ModuleDefinition {
    Name("AudioEffects")

    // Teardown also hops to the main queue to keep the player-access
    // invariant; if the queue is already cancelled the job is a no-op and the
    // dying process reclaims everything anyway.
    OnDestroy { launchOnMain { releaseAll() } }

    // Suspend overload of AsyncFunction (expo-audio's own pattern): expo converts
    // the args (SharedRef player + Record settings) and resolves the JS promise
    // with the returned capability snapshot; the body hops to the main queue so
    // every player/effect access keeps the main-queue invariant.
    AsyncFunction("attach") Coroutine { player: AudioPlayer, settings: AttachSettings ->
      withContext(appContext.mainQueue.coroutineContext) {
        try {
          attachEffects(player, settings)
        } catch (error: Exception) {
          Log.e(TAG, "Failed to attach audio effects", error)
          capabilityInfo()
        }
      }
    }

    Function("getInfo") { runOnMain { capabilityInfo() } }

    Function("setBalance") { center: Double ->
      launchOnMain {
        balance = center.toFloat().coerceIn(BALANCE_MIN, BALANCE_MAX)
        applyBalance()
      }
    }

    Function("setEqualizerEnabled") { enabled: Boolean ->
      launchOnMain {
        equalizerEnabled = enabled
        applyEqualizerState()
      }
    }

    Function("setEqualizerBandGain") { index: Int, gainDb: Double ->
      launchOnMain { setBandGain(index, gainDb.toFloat()) }
    }

    Function("setPitch") { pitch: Double, rate: Double ->
      launchOnMain {
        playbackRate = rate.toFloat()
        applyPitch(pitch.toFloat().coerceIn(PITCH_MIN, PITCH_MAX))
      }
    }

    Function("openOutputSwitcher") { launchOnMain { openOutputSwitcher() } }

    Function("detach") { launchOnMain { releaseAll() } }
  }

  private fun attachEffects(player: AudioPlayer, settings: AttachSettings): Map<String, Any?> {
    releaseAll()

    val exoPlayer = player.ref
    attachedPlayer = exoPlayer
    balance = settings.balance.toFloat().coerceIn(BALANCE_MIN, BALANCE_MAX)
    equalizerEnabled = settings.eqEnabled
    bandGainsDb = settings.eqGains.map { it.toFloat() }.toMutableList()
    playbackRate = settings.rate.toFloat()

    try {
      exoPlayer.addListener(sessionListener)
    } catch (error: Exception) {
      Log.e(TAG, "Failed to register audio session listener", error)
    }

    // Effects are session-scoped: while the session id is still unset the
    // listener recreates them as soon as the player assigns one.
    val audioSessionId = exoPlayer.audioSessionId
    if (audioSessionId != C.AUDIO_SESSION_ID_UNSET) {
      createEffects(audioSessionId)
    }
    applyPitch(settings.pitch.toFloat().coerceIn(PITCH_MIN, PITCH_MAX))

    return capabilityInfo()
  }

  private fun recreateEffects(audioSessionId: Int) {
    releaseEffects()
    createEffects(audioSessionId)
  }

  private fun createEffects(audioSessionId: Int) {
    createEqualizer(audioSessionId)
    createBalanceProcessor(audioSessionId)
    applyEqualizerState()
    applyBalance()
  }

  private fun createEqualizer(audioSessionId: Int) {
    equalizer = try {
      Equalizer(EFFECT_PRIORITY, audioSessionId).also { created ->
        bandCount = created.numberOfBands.toInt()
        bandGainsDb = AudioEffectsMath.resizeGains(bandGainsDb, bandCount, DEFAULT_BAND_GAIN_DB)
          .toMutableList()
      }
    } catch (error: Exception) {
      Log.e(TAG, "Equalizer is not available on this device", error)
      null
    }
    equalizerSupported = equalizer != null
  }

  private fun createBalanceProcessor(audioSessionId: Int) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) return
    balanceProcessor = try {
      DynamicsProcessing(audioSessionId).also { processor ->
        applyChannelGains(processor)
        processor.setEnabled(true)
      }
    } catch (error: Exception) {
      Log.e(TAG, "DynamicsProcessing balance is not available on this device", error)
      null
    }
    balanceSupported = balanceProcessor != null
  }

  private fun setBandGain(index: Int, gainDb: Float) {
    if (index !in bandGainsDb.indices) {
      Log.w(TAG, "Equalizer band $index is out of range (0..${bandGainsDb.lastIndex})")
      return
    }
    bandGainsDb[index] = gainDb
    val equalizer = equalizer ?: return
    if (!equalizerEnabled) return
    val millibels = gainToMillibels(equalizer, gainDb) ?: return
    try {
      equalizer.setBandLevel(index.toShort(), millibels.toShort())
    } catch (error: Exception) {
      Log.e(TAG, "Failed to set equalizer band $index gain", error)
    }
  }

  private fun applyEqualizerState() {
    val equalizer = equalizer ?: return
    try {
      equalizer.setEnabled(equalizerEnabled)
      if (equalizerEnabled) applyBandGains()
    } catch (error: Exception) {
      Log.e(TAG, "Failed to set equalizer enabled=$equalizerEnabled", error)
    }
  }

  private fun applyBandGains() {
    val equalizer = equalizer ?: return
    try {
      bandGainsDb.forEachIndexed { band, gainDb ->
        val millibels = gainToMillibels(equalizer, gainDb) ?: return@forEachIndexed
        equalizer.setBandLevel(band.toShort(), millibels.toShort())
      }
    } catch (error: Exception) {
      Log.e(TAG, "Failed to apply equalizer band gains", error)
    }
  }

  private fun gainToMillibels(equalizer: Equalizer, gainDb: Float): Int? {
    val range = equalizer.bandLevelRange
    val minMillibels = range.getOrNull(0)?.toInt() ?: return null
    val maxMillibels = range.getOrNull(1)?.toInt() ?: return null
    return AudioEffectsMath.gainToMillibels(minMillibels, maxMillibels, gainDb)
  }

  private fun applyBalance() {
    val processor = balanceProcessor ?: return
    try {
      applyChannelGains(processor)
      processor.setEnabled(true)
    } catch (error: Exception) {
      Log.e(TAG, "Failed to apply balance $balance", error)
    }
  }

  private fun applyChannelGains(processor: DynamicsProcessing) {
    val leftDb = AudioEffectsMath.linearToDb(AudioEffectsMath.leftGainFactor(balance))
    val rightDb = AudioEffectsMath.linearToDb(AudioEffectsMath.rightGainFactor(balance))
    processor.setInputGainbyChannel(CHANNEL_LEFT, leftDb)
    processor.setInputGainbyChannel(CHANNEL_RIGHT, rightDb)
  }

  private fun applyPitch(pitch: Float) {
    val player = attachedPlayer ?: return
    try {
      // Pitch is always rebuilt on top of the cached rate, never on the
      // player's current speed: expo-audio queues PlaybackParameters(rate, 1f)
      // on this same queue when the rate changes, and this job runs after it
      // (FIFO) — reading the player mid-flight could resurrect a stale value.
      player.playbackParameters = PlaybackParameters(playbackRate, pitch)
    } catch (error: Exception) {
      Log.e(TAG, "Failed to set pitch $pitch", error)
    }
  }

  private fun openOutputSwitcher() {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        MediaRouter2.getInstance(context).showSystemOutputSwitcher()
        return
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        val intent = Intent(ACTION_MEDIA_OUTPUT_PANEL).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      }
    } catch (error: Exception) {
      Log.e(TAG, "Failed to open media output switcher", error)
    }
  }

  private fun capabilityInfo(): Map<String, Any?> {
    val frequencies = if (equalizer != null) {
      List(bandCount) { band -> readBandCenterHz(band) }
    } else {
      emptyList()
    }
    val range = equalizer?.bandLevelRange
    val minDb = range?.getOrNull(0)?.toInt()?.div(MILLIBELS_PER_DB.toDouble()) ?: DEFAULT_MIN_BAND_DB
    val maxDb = range?.getOrNull(1)?.toInt()?.div(MILLIBELS_PER_DB.toDouble()) ?: DEFAULT_MAX_BAND_DB

    return mapOf(
      "balanceSupported" to balanceSupported,
      "bandCount" to bandCount,
      "bandFrequencies" to frequencies,
      "bandRange" to listOf(minDb, maxDb),
      "eqSupported" to equalizerSupported,
      "outputSwitcherSupported" to (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R),
      // Deliberate: pitch is not an audio effect — it rides on the player's
      // PlaybackParameters, so it is supported whenever a player is attached.
      "pitchSupported" to (attachedPlayer != null),
    )
  }

  private fun readBandCenterHz(band: Int): Int = try {
    equalizer?.getCenterFreq(band.toShort())?.let(AudioEffectsMath::milliHzToHz) ?: 0
  } catch (error: Exception) {
    Log.e(TAG, "Failed to read center frequency of band $band", error)
    0
  }

  private fun releaseAll() {
    try {
      attachedPlayer?.removeListener(sessionListener)
    } catch (error: Exception) {
      Log.e(TAG, "Failed to remove audio session listener", error)
    }
    releaseEffects()
    attachedPlayer = null
    bandCount = 0
  }

  private fun releaseEffects() {
    releaseEffect(equalizer)
    equalizer = null
    equalizerSupported = false
    releaseEffect(balanceProcessor)
    balanceProcessor = null
    balanceSupported = false
  }

  private fun releaseEffect(effect: AudioEffect?) {
    try {
      effect?.release()
    } catch (error: Exception) {
      Log.e(TAG, "Failed to release ${effect?.javaClass?.simpleName}", error)
    }
  }

  /** Fire-and-forget main-queue job: errors stay logged, never thrown to JS. */
  private fun launchOnMain(block: () -> Unit) {
    appContext.mainQueue.launch {
      try {
        block()
      } catch (error: Exception) {
        Log.e(TAG, "Audio effects job failed", error)
      }
    }
  }

  /** Blocking main-queue hop for sync reads from the JS thread (expo-audio's pattern). */
  private fun <T> runOnMain(block: () -> T): T =
    runBlocking(appContext.mainQueue.coroutineContext) { block() }
}
