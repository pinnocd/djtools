import React, { useRef, useState, useCallback } from 'react';
import styles from './FileManager.module.css';

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function FileManager({ files, selectedFile, onFilesAdded, onFileSelect, onFileRemove }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [durations, setDurations] = useState({});

  const loadDuration = useCallback((file) => {
    const key = file.name + file.size;
    if (durations[key] !== undefined) return;
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    audio.src = url;
    audio.addEventListener('loadedmetadata', () => {
      setDurations((prev) => ({ ...prev, [key]: audio.duration }));
      URL.revokeObjectURL(url);
    });
  }, [durations]);

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type === 'audio/mpeg' || f.name.toLowerCase().endsWith('.mp3')
    );
    if (dropped.length) {
      dropped.forEach(loadDuration);
      onFilesAdded(dropped);
    }
  }

  function handleFileInput(e) {
    const selected = Array.from(e.target.files);
    if (selected.length) {
      selected.forEach(loadDuration);
      onFilesAdded(selected);
    }
    e.target.value = '';
  }

  function handleKeyDown(e, file) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onFileSelect(file);
    }
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <span className={styles.sidebarTitle}>Files</span>
        <span className={styles.fileCount}>{files.length}</span>
      </div>

      <div
        className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/mpeg,.mp3"
          multiple
          onChange={handleFileInput}
          className={styles.hiddenInput}
        />
        <div className={styles.dropzoneIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17,8 12,3 7,8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <span className={styles.dropzoneText}>Drop MP3 files here</span>
        <span className={styles.dropzoneSubtext}>or click to browse</span>
      </div>

      <div className={styles.fileList}>
        {files.length === 0 && (
          <div className={styles.emptyState}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            <span>No MP3 files loaded</span>
          </div>
        )}

        {files.map((file) => {
          const key = file.name + file.size;
          const isSelected = selectedFile === file;
          const dur = durations[key];

          return (
            <div
              key={key}
              className={`${styles.fileItem} ${isSelected ? styles.fileItemSelected : ''}`}
              onClick={() => onFileSelect(file)}
              onKeyDown={(e) => handleKeyDown(e, file)}
              tabIndex={0}
              role="button"
              aria-pressed={isSelected}
            >
              <div className={styles.fileIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              <div className={styles.fileMeta}>
                <span className={styles.fileName} title={file.name}>
                  {file.name.replace(/\.mp3$/i, '')}
                </span>
                <div className={styles.fileDetails}>
                  <span>{formatBytes(file.size)}</span>
                  {dur !== undefined && <span>{formatDuration(dur)}</span>}
                </div>
              </div>
              <button
                className={styles.removeBtn}
                onClick={(e) => { e.stopPropagation(); onFileRemove(file); }}
                title="Remove file"
                aria-label={`Remove ${file.name}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
