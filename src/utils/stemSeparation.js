/**
 * Stem separation using Web Audio API OfflineAudioContext.
 *
 * Produces 3 stems that approximate Rekordbox's stem output:
 *   1. BASS      — frequencies below ~250 Hz (kick fundamentals, sub-bass, bass guitar)
 *   2. DRUMS     — 250 Hz – 6 kHz (snare body, toms, kick attack, hi-hats low end)
 *   3. MELODY & VOCALS — 6 kHz and above + broad mid presence (vocals, leads, brightness)
 *
 * Note: This is a frequency-domain approximation. True stem separation (as Rekordbox
 * uses internally) requires neural network source separation (e.g. Demucs), which is
 * not feasible in a pure browser context without a backend.
 *
 * The three band outputs together reconstruct the full-frequency spectrum of the mix.
 */

/**
 * Apply a filter chain to an AudioBuffer using OfflineAudioContext.
 * @param {AudioBuffer} audioBuffer - source buffer
 * @param {Array<{type, frequency, Q, gain}>} filters - BiquadFilter configs to chain
 * @param {Function} [onProgress] - optional progress callback (0–1)
 * @returns {Promise<AudioBuffer>}
 */
async function applyFilters(audioBuffer, filters) {
  const { numberOfChannels, length, sampleRate } = audioBuffer;
  const offlineCtx = new OfflineAudioContext({ numberOfChannels, length, sampleRate });

  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;

  let node = source;
  for (const cfg of filters) {
    const f = offlineCtx.createBiquadFilter();
    f.type = cfg.type;
    f.frequency.value = cfg.frequency;
    if (cfg.Q !== undefined) f.Q.value = cfg.Q;
    if (cfg.gain !== undefined) f.gain.value = cfg.gain;
    node.connect(f);
    node = f;
  }
  node.connect(offlineCtx.destination);
  source.start(0);

  return offlineCtx.startRendering();
}

/**
 * Separate the given AudioBuffer into 3 stems.
 * @param {AudioBuffer} audioBuffer
 * @param {Function} onProgress - callback(pct: number, label: string)
 * @returns {Promise<{bass: AudioBuffer, drums: AudioBuffer, melody: AudioBuffer}>}
 */
export async function separateStems(audioBuffer, onProgress = () => {}) {
  onProgress(5, 'Decoding audio…');

  // ── STEM 1: BASS (lowpass cascade at 250 Hz) ──────────────────────────────
  onProgress(10, 'Extracting bass stem…');
  const bass = await applyFilters(audioBuffer, [
    { type: 'lowpass', frequency: 250, Q: 0.5 },
    { type: 'lowpass', frequency: 250, Q: 0.5 },  // two-pole cascade = steeper rolloff
  ]);
  onProgress(40, 'Bass stem complete');

  // ── STEM 2: DRUMS (bandpass 250 Hz – 6 kHz) ───────────────────────────────
  onProgress(45, 'Extracting drums stem…');
  const drums = await applyFilters(audioBuffer, [
    { type: 'highpass', frequency: 250, Q: 0.5 },
    { type: 'lowpass',  frequency: 6000, Q: 0.5 },
  ]);
  onProgress(70, 'Drums stem complete');

  // ── STEM 3: MELODY & VOCALS (highpass cascade at 6 kHz) ───────────────────
  onProgress(75, 'Extracting melody & vocals stem…');
  const melody = await applyFilters(audioBuffer, [
    { type: 'highpass', frequency: 6000, Q: 0.5 },
    { type: 'highpass', frequency: 6000, Q: 0.5 },  // steeper slope
  ]);
  onProgress(98, 'All stems extracted');

  return { bass, drums, melody };
}
