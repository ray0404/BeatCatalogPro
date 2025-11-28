import { create } from 'zustand';
import { PlayerState } from '../types';

interface PlayerStore extends PlayerState {
  queue: string[];
  setQueue: (ids: string[]) => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrackId: null,
  isPlaying: false,
  volume: 0.7,
  queue: [],

  setQueue: (ids) => set({ queue: ids }),

  play: (trackId) => {
    set({ currentTrackId: trackId, isPlaying: true });
  },

  pause: () => {
    set({ isPlaying: false });
  },

  togglePlay: () => {
    set((state) => ({ isPlaying: !state.isPlaying }));
  },

  setVolume: (vol) => {
    set({ volume: vol });
  },

  playNext: () => {
    const { queue, currentTrackId } = get();
    if (!currentTrackId) return;
    const idx = queue.indexOf(currentTrackId);
    if (idx < queue.length - 1) {
      set({ currentTrackId: queue[idx + 1], isPlaying: true });
    }
  },

  playPrev: () => {
    const { queue, currentTrackId } = get();
    if (!currentTrackId) return;
    const idx = queue.indexOf(currentTrackId);
    if (idx > 0) {
      set({ currentTrackId: queue[idx - 1], isPlaying: true });
    }
  },
}));
