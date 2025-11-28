import { AudioAnalysis } from './types';

export const DB_NAME = 'BeatCatalogDB_v2';
export const DB_VERSION = 1;

export const DEFAULT_ANALYSIS: AudioAnalysis = {
  energy: 0,
  brightness: 0,
  waveform: [],
};

// Mock genre detection based on BPM ranges
export const BPM_RANGES = [
  { min: 60, max: 90, label: 'Lo-Fi / HipHop' },
  { min: 90, max: 110, label: 'Trap / Rap' },
  { min: 110, max: 128, label: 'House / Pop' },
  { min: 128, max: 140, label: 'Techno / Trance' },
  { min: 140, max: 175, label: 'Dubstep / DnB' },
];
