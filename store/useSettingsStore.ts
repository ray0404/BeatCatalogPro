import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  // UI Settings
  compactMode: boolean;
  showWaveform: boolean;
  showAnalysis: boolean;
  
  // Audio Settings
  autoPlay: boolean;
  masterVolume: number; // 0 to 1
  crossfadeDuration: number; // in seconds

  // Analysis Settings (Meyda)
  analysisBufferSize: number;
  analysisWindowing: string;

  // Actions
  toggleCompactMode: () => void;
  toggleShowWaveform: () => void;
  toggleShowAnalysis: () => void;
  toggleAutoPlay: () => void;
  setMasterVolume: (val: number) => void;
  setCrossfadeDuration: (val: number) => void;
  setAnalysisBufferSize: (val: number) => void;
  setAnalysisWindowing: (val: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      compactMode: false,
      showWaveform: true,
      showAnalysis: true,
      
      autoPlay: true,
      masterVolume: 1.0,
      crossfadeDuration: 2,
      
      analysisBufferSize: 2048,
      analysisWindowing: 'hanning',

      toggleCompactMode: () => set((state) => ({ compactMode: !state.compactMode })),
      toggleShowWaveform: () => set((state) => ({ showWaveform: !state.showWaveform })),
      toggleShowAnalysis: () => set((state) => ({ showAnalysis: !state.showAnalysis })),
      toggleAutoPlay: () => set((state) => ({ autoPlay: !state.autoPlay })),
      setMasterVolume: (val) => set({ masterVolume: val }),
      setCrossfadeDuration: (val) => set({ crossfadeDuration: val }),
      setAnalysisBufferSize: (val) => set({ analysisBufferSize: val }),
      setAnalysisWindowing: (val) => set({ analysisWindowing: val }),
    }),
    {
      name: 'beatcatalog-settings', // unique name in localStorage
    }
  )
);