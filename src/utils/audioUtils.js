/**
 * Convert an AudioBuffer to a WAV ArrayBuffer.
 * Uses 16-bit PCM, interleaved channels.
 */
export function audioBufferToWav(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const numSamples = audioBuffer.length;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeStr(offset, str) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);        // chunk size
  view.setUint16(20, 1, true);         // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);        // bit depth
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  // Interleave channel data
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(ch)[i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return buffer;
}

/**
 * Trigger a browser download of an AudioBuffer as a WAV file.
 */
export function downloadAudioBuffer(audioBuffer, filename) {
  const wav = audioBufferToWav(audioBuffer);
  const blob = new Blob([wav], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Draw a waveform from an AudioBuffer onto a canvas element.
 */
export function drawWaveform(canvas, audioBuffer, color = '#00d4ff') {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const data = audioBuffer.getChannelData(0);
  const step = Math.ceil(data.length / width);
  const amp = height / 2;

  ctx.clearRect(0, 0, width, height);

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, 'rgba(0,212,255,0.05)');
  grad.addColorStop(0.5, 'rgba(123,47,255,0.05)');
  grad.addColorStop(1, 'rgba(0,212,255,0.05)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();

  for (let x = 0; x < width; x++) {
    let min = 1;
    let max = -1;
    for (let j = 0; j < step; j++) {
      const val = data[x * step + j] || 0;
      if (val < min) min = val;
      if (val > max) max = val;
    }
    const yMin = (1 + min) * amp;
    const yMax = (1 + max) * amp;
    if (x === 0) ctx.moveTo(x, yMin);
    ctx.lineTo(x, yMin);
    ctx.lineTo(x, yMax);
  }

  ctx.stroke();

  // Center line
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, amp);
  ctx.lineTo(width, amp);
  ctx.stroke();
}
