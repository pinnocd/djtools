import React, { useEffect, useRef, useState, useCallback } from 'react';
import { separateStems } from '../utils/stemSeparation.js';
import { drawWaveform, downloadAudioBuffer } from '../utils/audioUtils.js';
import styles from './StemProcessor.module.css';

const STEMS = [
  {
    key: 'bass',
    label: 'Bass',
    suffix: 'bass',
    description: 'Sub-bass & bass guitar (0 – 250 Hz)',
    color: '#ff6b35',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
  {
    key: 'drums',
    label: 'Drums',
    suffix: 'drums',
    description: 'Kick attack, snare, toms (250 Hz – 6 kHz)',
    color: '#7b2fff',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
  {
    key: 'melody',
    label: 'Melody & Vocals',
    suffix: 'melody_vocals',
    description: 'Leads, vocals, brightness (6 kHz+)',
    color: '#00d4ff',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="8" y1="22" x2="16" y2="22" />
      </svg>
    ),
  },
];

const SPLIT_MODES = [
  { value: 'all', label: 'All 3 stems' },
  { value: 'bass', label: 'Bass only' },
  { value: 'drums', label: 'Drums only' },
  { value: 'melody', label: 'Melody & Vocals only' },
];

export default function StemProcessor({ selectedFile }) {
  const waveformRef = useRef(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [stems, setStems] = useState(null);
  const [error, setError] = useState(null);
  const [splitMode, setSplitMode] = useState('all');
  const abortRef = useRef(false);

  // Decode the file whenever selectedFile changes
  useEffect(() => {
    if (!selectedFile) {
      setAudioBuffer(null);
      setStems(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoadingFile(true);
    setAudioBuffer(null);
    setStems(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      if (cancelled) return;
      try {
        const ctx = new AudioContext();
        const decoded = await ctx.decodeAudioData(e.target.result);
        ctx.close();
        if (!cancelled) setAudioBuffer(decoded);
      } catch {
        if (!cancelled) setError('Failed to decode audio file.');
      } finally {
        if (!cancelled) setLoadingFile(false);
      }
    };
    reader.onerror = () => {
      if (!cancelled) {
        setError('Failed to read file.');
        setLoadingFile(false);
      }
    };
    reader.readAsArrayBuffer(selectedFile);

    return () => { cancelled = true; };
  }, [selectedFile]);

  // Draw waveform after decoding
  useEffect(() => {
    if (!audioBuffer || !waveformRef.current) return;
    const canvas = waveformRef.current;
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    canvas.style.width = canvas.offsetWidth + 'px';
    canvas.style.height = canvas.offsetHeight + 'px';
    drawWaveform(canvas, audioBuffer);
  }, [audioBuffer]);

  const handleProcess = useCallback(async () => {
    if (!audioBuffer || processing) return;
    abortRef.current = false;
    setProcessing(true);
    setProgress(0);
    setProgressLabel('Starting…');
    setStems(null);
    setError(null);

    try {
      const result = await separateStems(audioBuffer, (pct, label) => {
        setProgress(pct);
        setProgressLabel(label);
      });
      setStems(result);
      setProgress(100);
      setProgressLabel('Done!');
    } catch (err) {
      setError(`Processing failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  }, [audioBuffer, processing]);

  function handleDownload(stemKey) {
    if (!stems || !selectedFile) return;
    const stemInfo = STEMS.find((s) => s.key === stemKey);
    const base = selectedFile.name.replace(/\.mp3$/i, '');
    downloadAudioBuffer(stems[stemKey], `${base}_${stemInfo.suffix}.wav`);
  }

  function handleDownloadAll() {
    if (!stems || !selectedFile) return;
    const keysToDownload = splitMode === 'all'
      ? ['bass', 'drums', 'melody']
      : [splitMode];
    keysToDownload.forEach((key) => handleDownload(key));
  }

  function formatDuration(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  if (!selectedFile) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <line x1="12" y1="2" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        </div>
        <h2 className={styles.emptyTitle}>Select a file to begin</h2>
        <p className={styles.emptyDesc}>
          Load an MP3 into the file manager, then select it to extract Rekordbox-compatible stems.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.processor}>
      {/* File info card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.fileInfo}>
            <div className={styles.fileIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <div>
              <div className={styles.fileTitle}>
                {selectedFile.name.replace(/\.mp3$/i, '')}
              </div>
              <div className={styles.fileSubtitle}>
                {audioBuffer
                  ? `${audioBuffer.numberOfChannels === 2 ? 'Stereo' : 'Mono'} · ${audioBuffer.sampleRate / 1000} kHz · ${formatDuration(audioBuffer.duration)}`
                  : loadingFile
                  ? 'Decoding…'
                  : selectedFile.name}
              </div>
            </div>
          </div>
        </div>

        {/* Waveform */}
        <div className={styles.waveformWrap}>
          {loadingFile && (
            <div className={styles.waveformOverlay}>
              <div className={styles.spinner} />
              <span>Decoding audio…</span>
            </div>
          )}
          <canvas ref={waveformRef} className={styles.waveform} />
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Controls card */}
      <div className={styles.card}>
        <div className={styles.controlsRow}>
          <div className={styles.selectGroup}>
            <label className={styles.selectLabel}>Stem output</label>
            <div className={styles.selectWrap}>
              <select
                className={styles.select}
                value={splitMode}
                onChange={(e) => setSplitMode(e.target.value)}
                disabled={processing}
              >
                {SPLIT_MODES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <svg className={styles.selectChevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          <button
            className={`${styles.processBtn} ${processing ? styles.processBtnActive : ''}`}
            onClick={handleProcess}
            disabled={!audioBuffer || processing}
          >
            {processing ? (
              <>
                <div className={styles.btnSpinner} />
                Processing…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
                Split into Stems
              </>
            )}
          </button>
        </div>

        {/* Progress bar */}
        {processing && (
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>{progressLabel}</span>
              <span className={styles.progressPct}>{Math.round(progress)}%</span>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stem results */}
      {stems && (
        <div className={styles.stemsSection}>
          <div className={styles.stemsSectionHeader}>
            <div className={styles.successDot} />
            <span>Stems ready — click to download individual files or use Download All</span>
          </div>

          <div className={styles.stemCards}>
            {STEMS.map((stem) => {
              const shouldShow = splitMode === 'all' || splitMode === stem.key;
              if (!shouldShow) return null;
              return (
                <div key={stem.key} className={styles.stemCard}>
                  <div className={styles.stemCardLeft}>
                    <div
                      className={styles.stemIcon}
                      style={{
                        color: stem.color,
                        background: `${stem.color}15`,
                        borderColor: `${stem.color}30`,
                      }}
                    >
                      {stem.icon}
                    </div>
                    <div>
                      <div className={styles.stemLabel}>{stem.label}</div>
                      <div className={styles.stemDesc}>{stem.description}</div>
                    </div>
                  </div>
                  <div className={styles.stemCardRight}>
                    <StemMiniWaveform buffer={stems[stem.key]} color={stem.color} />
                    <button
                      className={styles.downloadBtn}
                      style={{ '--stem-color': stem.color }}
                      onClick={() => handleDownload(stem.key)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7,10 12,15 17,10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      .wav
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button className={styles.downloadAllBtn} onClick={handleDownloadAll}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download {splitMode === 'all' ? 'All 3 Stems' : STEMS.find((s) => s.key === splitMode)?.label}
          </button>
        </div>
      )}
    </div>
  );
}

function StemMiniWaveform({ buffer, color }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!buffer || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    drawWaveform(canvas, buffer, color);
  }, [buffer, color]);

  return <canvas ref={canvasRef} className={styles.miniWaveform} />;
}
