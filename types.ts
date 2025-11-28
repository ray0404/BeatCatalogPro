

export interface Track {
  id: string;
  title: string;
  artist: string;
  addedAt: number;
  duration: number;
  format: string;
  blob: Blob; // Stored in IndexedDB
  analysis?: AudioAnalysis;
}

export interface AudioAnalysis {
  duration?: number; // Duration of the track in seconds
  bpm?: number;
  energy?: number; // RMS (0-100)
  brightness?: number; // Spectral Centroid (0-100 normalized)
  waveform?: number[]; // PCM Peaks for Wavesurfer
  key?: string;
  
  // Advanced Features (Meyda)
  spectralFlatness?: number; // "Noisiness" or "Texture"
  spectralRolloff?: number; // "Sharpness"
  zeroCrossingRate?: number; // "Percussiveness"
  chroma?: number[]; // 12-bin Pitch Class Profile for Key Detection

  // Mixing & Mastering Metrics
  integratedLoudness?: number; // LUFS (EBU R128 approx)
  peakAmplitude?: number; // dBTP (True Peak approx)
  dynamicRange?: number; // dB (Crest Factor)
  stereoWidth?: number; // -1 (Phase Cancel) to 1 (Mono). 0 is Wide.

  // Raw Values for Tooltips
  rawEnergy?: number;
  rawBrightness?: number;
  rawRolloff?: number;
  rawFlatness?: number;
  rawZCR?: number;
}

export enum ViewMode {
  LIST = 'LIST',
  GRID = 'GRID'
}

export interface PlayerState {
  currentTrackId: string | null;
  isPlaying: boolean;
  volume: number;
  play: (trackId: string) => void;
  pause: () => void;
  togglePlay: () => void;
  setVolume: (vol: number) => void;
  playNext: () => void;
  playPrev: () => void;
}