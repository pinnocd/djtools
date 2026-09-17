import React, { useState } from 'react';
import Header from './components/Header.jsx';
import FileManager from './components/FileManager.jsx';
import StemProcessor from './components/StemProcessor.jsx';
import styles from './App.module.css';

export default function App() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  function handleFilesAdded(newFiles) {
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      const filtered = newFiles.filter((f) => !existing.has(f.name + f.size));
      return [...prev, ...filtered];
    });
  }

  function handleFileSelect(file) {
    setSelectedFile(file);
  }

  function handleFileRemove(file) {
    setFiles((prev) => prev.filter((f) => f !== file));
    if (selectedFile === file) setSelectedFile(null);
  }

  return (
    <div className={styles.app}>
      <Header />
      <div className={styles.layout}>
        <FileManager
          files={files}
          selectedFile={selectedFile}
          onFilesAdded={handleFilesAdded}
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
        />
        <main className={styles.main}>
          <StemProcessor selectedFile={selectedFile} />
        </main>
      </div>
    </div>
  );
}
