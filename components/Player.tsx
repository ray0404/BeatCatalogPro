import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { usePlayerStore } from '../store/usePlayerStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { db } from '../db/db';
import { Play, Pause, SkipBack, SkipForward, Volume2, Music, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { Track } from '../types';

export const Player: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLAudioElement>(null); // Reference to native audio element
  const wavesurfer = useRef<WaveSurfer | null>(null);
  
  const { currentTrackId, isPlaying, volume, play, pause, playNext, playPrev, togglePlay, setVolume } = usePlayerStore();
  const { showWaveform, autoPlay, masterVolume } = useSettingsStore();
  
  const [track, setTrack] = useState<Track | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [needsInteraction, setNeedsInteraction] = useState(false);

  // 1. Fetch Track Data
  useEffect(() => {
    if (!currentTrackId) return;

    const fetchTrack = async () => {
      setIsLoading(true);
      setError(null);
      setNeedsInteraction(false);
      try {
        const t = await db.tracks.get(currentTrackId);
        if (t) {
          setTrack(t);
        } else {
            setError("Track not found");
        }
      } catch (error) {
        console.error("Error loading track", error);
        setError("DB Error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrack();
  }, [currentTrackId]);

  // 2. Initialize Wavesurfer with Media Element
  useEffect(() => {
    if (!containerRef.current || !mediaRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      media: mediaRef.current, // Use the native audio element for playback
      waveColor: '#4b5563',
      progressColor: '#8b5cf6',
      cursorColor: '#c4b5fd',
      barWidth: 2,
      barGap: 3,
      barRadius: 3,
      height: 48,
      normalize: true,
    });

    wavesurfer.current = ws;

    // Events
    ws.on('ready', () => {
        setIsReady(true);
        setIsLoading(false);
        const effectiveVol = usePlayerStore.getState().volume * useSettingsStore.getState().masterVolume;
        ws.setVolume(effectiveVol);
        
        // Auto-play logic
        if (usePlayerStore.getState().isPlaying) {
            ws.play().catch(err => {
                console.warn("Autoplay blocked:", err);
                setNeedsInteraction(true);
            });
        }
    });

    ws.on('finish', () => {
        if (useSettingsStore.getState().autoPlay) {
            usePlayerStore.getState().playNext();
        } else {
            usePlayerStore.getState().pause();
        }
    });

    ws.on('error', (err) => {
        console.error("Wavesurfer Error:", err);
        setError("Decode Failed");
        setIsLoading(false);
    });

    // Cleanup
    return () => {
      ws.destroy();
      wavesurfer.current = null;
    };
  }, []);

  // 3. Load Audio when Track Changes
  useEffect(() => {
    const ws = wavesurfer.current;
    if (!ws || !track) return;

    setIsReady(false);
    setIsLoading(true);
    setError(null);
    setNeedsInteraction(false);

    const url = URL.createObjectURL(track.blob);
    
    // Validate peaks before passing (WaveSurfer crashes on NaNs)
    let validPeaks: number[][] | undefined = undefined;
    if (track.analysis?.waveform && track.analysis.waveform.length > 0) {
        const hasNaN = track.analysis.waveform.some(n => isNaN(n));
        if (!hasNaN) {
            validPeaks = [track.analysis.waveform];
        }
    }

    // Load the URL into the media element (via WaveSurfer)
    ws.load(url, validPeaks);

    return () => {
        // We defer revocation slightly or handle it on next load
        // But for Blob URLs, immediate revocation after load start is usually okay
        // However, with media element, we keep it until track changes
        // Just let the next useEffect cleanup handle it, or garbage collect.
        // Actually, explicit revocation is best practice:
        setTimeout(() => URL.revokeObjectURL(url), 5000); 
    };
  }, [track]);

  // 4. Sync Play/Pause State
  useEffect(() => {
    const ws = wavesurfer.current;
    if (!ws || !isReady) return;

    if (isPlaying) {
        ws.play().catch(err => {
            console.warn("Play blocked:", err);
            setNeedsInteraction(true);
        });
    } else {
        ws.pause();
    }
  }, [isPlaying, isReady]);

  // 5. Sync Volume
  useEffect(() => {
    const ws = wavesurfer.current;
    if (!ws) return;
    const effectiveVol = volume * masterVolume;
    ws.setVolume(effectiveVol);
    // Double ensure media element volume
    if (mediaRef.current) {
        mediaRef.current.volume = Math.max(0, Math.min(1, effectiveVol));
    }
  }, [volume, masterVolume]);

  const handleInteractionRetry = () => {
      if (wavesurfer.current && isPlaying) {
          wavesurfer.current.play();
          setNeedsInteraction(false);
      }
  };

  if (!track && !isLoading) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Hidden Audio Element for robust playback */}
        <audio ref={mediaRef} className="hidden" crossOrigin="anonymous" />

        <div className="flex flex-col md:flex-row items-center gap-4">
          
          {/* Metadata */}
          <div className="flex items-center gap-3 w-full md:w-64 min-w-[200px]">
            <div className={`w-12 h-12 rounded bg-gray-800 flex items-center justify-center flex-shrink-0 ${error ? 'text-red-500' : 'text-gray-500'}`}>
               {error ? <AlertCircle size={20} /> : <Music size={20} />}
            </div>
            <div className="overflow-hidden">
              <h3 className="text-sm font-bold text-white truncate">{track?.title || 'Loading...'}</h3>
              <p className="text-xs text-gray-400 truncate">{error || track?.artist || '...'}</p>
            </div>
          </div>

          {/* Controls & Waveform */}
          <div className="flex-1 w-full flex flex-col gap-2 relative">
            
            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button variant="ghost" size="sm" onClick={playPrev} disabled={!isReady}>
                <SkipBack size={20} />
              </Button>
              <button 
                className={`
                    w-10 h-10 rounded-full bg-white text-black flex items-center justify-center 
                    hover:scale-105 transition-transform shadow-lg shadow-white/10
                    disabled:opacity-50 disabled:cursor-not-allowed
                `}
                onClick={togglePlay}
                disabled={!isReady && !error}
              >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
              </button>
              <Button variant="ghost" size="sm" onClick={playNext} disabled={!isReady}>
                <SkipForward size={20} />
              </Button>
            </div>

            {/* Waveform Container */}
            <div 
              className={`
                relative w-full rounded overflow-hidden cursor-pointer group transition-all duration-300
                ${showWaveform ? 'h-12 bg-gray-900/50' : 'h-1 bg-gray-800'} 
              `}
            >
               <div 
                  ref={containerRef} 
                  className={`w-full h-full transition-opacity ${showWaveform ? 'opacity-80 group-hover:opacity-100' : 'opacity-0'}`} 
               />
               
               {/* Fallback Progress Bar (when waveform hidden) */}
               {!showWaveform && (
                 <div className="absolute inset-y-0 left-0 bg-accent-500 w-1/3 opacity-50" /> 
               )}

               {/* Loading Overlay */}
               {isLoading && (
                 <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 backdrop-blur-[1px]">
                   <Loader2 className="w-5 h-5 text-accent-500 animate-spin" />
                 </div>
               )}

               {/* Autoplay Blocked Overlay */}
               {needsInteraction && (
                   <div 
                     className="absolute inset-0 flex items-center justify-center bg-accent-900/80 z-20 cursor-pointer"
                     onClick={handleInteractionRetry}
                   >
                       <span className="text-xs font-bold text-white flex items-center gap-2">
                           <Play size={12} fill="currentColor" /> Click to Play
                       </span>
                   </div>
               )}
            </div>
          </div>

          {/* Volume */}
          <div className="hidden md:flex items-center gap-2 w-48 justify-end">
            <Volume2 size={16} className="text-gray-400" />
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-500"
            />
          </div>

        </div>
      </div>
    </div>
  );
};