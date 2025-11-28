

import React, { useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { usePlayerStore } from '../store/usePlayerStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Track } from '../types';
import { Play, Pause, Activity, Zap, ChevronDown, ChevronUp, Music2, Waves, Sliders, AudioLines, MonitorSpeaker, Download } from 'lucide-react';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const TrackList: React.FC = () => {
  const tracks = useLiveQuery(() => db.tracks.orderBy('addedAt').reverse().toArray());
  const { currentTrackId, isPlaying, play, pause, setQueue } = usePlayerStore();
  const { compactMode, showAnalysis } = useSettingsStore();
  const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);

  React.useEffect(() => {
    if (tracks) {
      setQueue(tracks.map(t => t.id));
    }
  }, [tracks, setQueue]);

  if (!tracks) return <div className="p-8 text-center text-gray-500">Loading library...</div>;
  if (tracks.length === 0) return null;

  const toggleExpand = (id: string) => {
    setExpandedTrackId(expandedTrackId === id ? null : id);
  };

  const handleRowClick = (trackId: string) => {
    toggleExpand(trackId);
  };

  const handleExportAnalysis = (track: Track) => {
    // Create export object excluding the heavy blob
    const exportData = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      addedAt: new Date(track.addedAt).toISOString(),
      duration: track.duration,
      format: track.format,
      analysis: track.analysis
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${track.artist} - ${track.title}_analysis.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const Row = (index: number, track: Track) => {
    const isCurrent = currentTrackId === track.id;
    const isPlayingCurrent = isCurrent && isPlaying;
    const isExpanded = expandedTrackId === track.id;

    // Helper for LUFS coloring
    const getLufsColor = (lufs: number) => {
        if (lufs > -9) return 'text-red-500'; // Very Loud (Club/CD)
        if (lufs > -14) return 'text-green-400'; // Streaming Standard (Spotify/Apple)
        return 'text-yellow-500'; // Quiet / Dynamic
    };

    return (
      <div className={`flex flex-col border-b border-gray-800/50 ${isCurrent ? 'bg-accent-900/10' : ''}`}>
        {/* Main Row */}
        <div 
          className={`
            flex items-center gap-4 rounded-lg group transition-colors select-none cursor-pointer
            ${compactMode ? 'p-1.5 text-sm' : 'p-3'} 
            ${isCurrent ? '' : 'hover:bg-gray-900'}
          `}
          onClick={() => handleRowClick(track.id)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            play(track.id);
          }}
        >
          <div className={`flex justify-center text-gray-500 ${compactMode ? 'w-6' : 'w-8'}`}>
              <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    isPlayingCurrent ? pause() : play(track.id);
                  }}
                  className={`
                      rounded-full hover:bg-white/10 hover:text-white transition-all
                      ${compactMode ? 'p-0.5' : 'p-1.5'}
                      ${isCurrent ? 'text-accent-400' : 'text-gray-500 opacity-0 group-hover:opacity-100'}
                  `}
              >
                  {isPlayingCurrent ? <Pause size={compactMode ? 14 : 16} fill="currentColor" /> : <Play size={compactMode ? 14 : 16} fill="currentColor" />}
              </button>
          </div>

          <div className="flex-1 min-w-0">
            <div 
              className={`font-medium truncate ${isCurrent ? 'text-accent-400' : 'text-gray-200'}`}
              title={track.title}
            >
              {track.title}
            </div>
            <div 
              className={`text-gray-500 truncate ${compactMode ? 'text-[10px]' : 'text-xs'}`}
              title={track.artist}
            >
              {track.artist}
            </div>
          </div>

          {showAnalysis && (
            <div className={`hidden sm:flex items-center gap-4 text-xs text-gray-500 ${compactMode ? 'w-36' : 'w-48'}`}>
                <div className="flex items-center gap-1 w-12" title="BPM">
                    <Activity size={12} />
                    <span>{track.analysis?.bpm || '--'}</span>
                </div>
                <div className="flex items-center gap-1 w-16" title="Integrated Loudness">
                    <AudioLines size={12} />
                    <span>{track.analysis?.integratedLoudness ? `${Math.round(track.analysis.integratedLoudness)} LUFS` : '--'}</span>
                </div>
            </div>
          )}

          <div className="w-12 text-right text-xs text-gray-500 font-mono">
            {formatTime(track.duration)}
          </div>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(track.id);
            }}
            className="p-1 text-gray-600 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Expanded Details Panel */}
        {isExpanded && (
           <div 
             className="bg-gray-900/50 p-4 border-t border-gray-800 animate-in slide-in-from-top-2 duration-200 cursor-default"
             onClick={e => e.stopPropagation()}
           >
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
                
                {/* Column 1: Detailed Analysis (Musicality, Chroma, Flatness, ZCR) */}
                <div className="space-y-5">
                   <h4 className="text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-2">
                     Detailed Analysis
                   </h4>
                   
                   {/* Key & BPM */}
                   <div className="grid grid-cols-2 gap-3">
                       <div className="bg-gray-800/40 p-2.5 rounded border border-gray-800">
                           <div className="text-gray-500 mb-1 text-[10px] uppercase">Detected Key</div>
                           <div className="text-white font-mono text-lg font-bold text-accent-400">{track.analysis?.key || 'Unknown'}</div>
                       </div>
                       <div className="bg-gray-800/40 p-2.5 rounded border border-gray-800">
                           <div className="text-gray-500 mb-1 text-[10px] uppercase">BPM</div>
                           <div className="text-white font-mono text-lg font-bold">{track.analysis?.bpm || '--'}</div>
                       </div>
                   </div>
                   
                   {/* Chroma Graph */}
                   <div>
                       <div className="text-[10px] text-gray-500 uppercase mb-2 font-medium tracking-wider">Harmonic Profile</div>
                       <ChromaGraph chroma={track.analysis?.chroma} />
                   </div>

                   {/* Detailed Signal Features */}
                   <div className="space-y-3 pt-2 border-t border-gray-800/50">
                        <div className="text-[10px] text-gray-500 uppercase mb-2 font-medium tracking-wider">Signal Features</div>
                        <FeatureBar 
                            label="Spectral Flatness" 
                            value={track.analysis?.spectralFlatness || 0} 
                            displayValue={`${track.analysis?.rawFlatness}`}
                            color="bg-pink-500"
                            icon={<Waves size={10} />}
                            desc="1.0 = Pure Noise (White Noise), close to 0 = Pure Tone (Sine)."
                        />

                        <FeatureBar 
                            label="Zero Crossing Rate" 
                            value={(track.analysis?.zeroCrossingRate || 0)} 
                            displayValue={`${track.analysis?.rawZCR} Hz`}
                            color="bg-orange-500"
                            icon={<Music2 size={10} />}
                            desc="Rate of signal sign-changes. High values = Percussive/Noisy."
                        />
                   </div>
                </div>

                {/* Column 2: Mixing & Mastering */}
                <div className="space-y-4">
                  <h4 className="text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-2">
                     <MonitorSpeaker size={14} />
                     Mixing & Mastering
                   </h4>
                   
                   <div className="bg-gray-800/20 p-3 rounded border border-gray-800 space-y-4">
                      
                      {/* Integrated Loudness (LUFS) */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400">Integrated Loudness</span>
                          <span className={`font-mono font-bold ${getLufsColor(track.analysis?.integratedLoudness || -100)}`}>
                              {track.analysis?.integratedLoudness || '--'} LUFS
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden relative">
                           {/* Meter Background (-30 to 0) */}
                           <div className="absolute inset-0 flex">
                              <div className="w-[33%] bg-green-900/30"></div> {/* -30 to -20 */}
                              <div className="w-[33%] bg-yellow-900/30"></div> {/* -20 to -10 */}
                              <div className="w-[34%] bg-red-900/30"></div> {/* -10 to 0 */}
                           </div>
                           {/* Marker */}
                           <div 
                              className={`absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_white] transition-all`} 
                              style={{ 
                                  // Map -30LUFS (0%) to 0LUFS (100%)
                                  left: `${Math.max(0, Math.min(100, ((track.analysis?.integratedLoudness || -30) + 30) / 30 * 100))}%` 
                              }} 
                           />
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-600 mt-1">
                            <span>-30</span>
                            <span>-14 (Stream)</span>
                            <span>0</span>
                        </div>
                      </div>

                      {/* Dynamic Range (Crest Factor) */}
                      <div className="border-t border-gray-700/50 pt-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400">Dynamic Range</span>
                          <span className="text-white font-mono font-bold">DR{Math.round(track.analysis?.dynamicRange || 0)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                           <div 
                              className={`h-full rounded-full transition-all ${
                                  (track.analysis?.dynamicRange || 0) > 10 ? 'bg-green-500' : 
                                  (track.analysis?.dynamicRange || 0) < 6 ? 'bg-red-500' : 'bg-yellow-500'
                              }`} 
                              style={{ width: `${Math.min((track.analysis?.dynamicRange || 0) * 5, 100)}%` }} 
                           />
                        </div>
                      </div>

                      {/* True Peak */}
                      <div className="flex justify-between items-center border-t border-gray-700/50 pt-2">
                         <span className="text-gray-400">True Peak (Approx)</span>
                         <span className={`font-mono font-bold ${(track.analysis?.peakAmplitude || -99) > -0.1 ? 'text-red-500' : 'text-green-400'}`}>
                           {(track.analysis?.peakAmplitude || -99).toFixed(2)} dB
                         </span>
                      </div>

                       {/* Stereo Width */}
                       <div className="pt-2 border-t border-gray-700/50">
                         <div className="flex justify-between mb-1">
                           <span className="text-gray-400">Phase Correlation</span>
                           <span className="text-white font-mono">
                             {(track.analysis?.stereoWidth || 0).toFixed(2)}
                           </span>
                         </div>
                         <div className="h-1.5 w-full bg-gray-800 rounded-full relative">
                            {/* Center is 0. 1 is Mono (Right), -1 is Phase (Left) */}
                            <div className="absolute top-0 bottom-0 w-[2px] bg-gray-500 left-1/2 -ml-[1px]" />
                            <div 
                               className={`absolute top-0 bottom-0 w-2 h-2 rounded-full -mt-[1px] transition-all
                                 ${(track.analysis?.stereoWidth || 0) < 0 ? 'bg-red-500' : 'bg-green-500'}
                               `}
                               style={{ 
                                 left: `${((track.analysis?.stereoWidth || 0) + 1) / 2 * 100}%`,
                                 transform: 'translateX(-50%)'
                               }} 
                            />
                         </div>
                         <div className="flex justify-between text-[9px] text-gray-600 mt-1">
                            <span>-1 (Phase)</span>
                            <span>0 (Wide)</span>
                            <span>+1 (Mono)</span>
                         </div>
                       </div>
                   </div>
                </div>

                {/* Column 3: Spectrum Analysis (Timbre) */}
                <div className="space-y-4">
                   <h4 className="text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-2">
                     Spectrum Analysis
                   </h4>
                   
                   <div className="space-y-3">
                     <FeatureBar 
                        label="Energy (RMS)" 
                        value={track.analysis?.energy || 0} 
                        displayValue={`${track.analysis?.rawEnergy} dB`}
                        color="bg-yellow-500"
                        icon={<Zap size={10} />}
                        desc="Root Mean Square. Average loudness."
                     />
                     
                     <FeatureBar 
                        label="Brightness" 
                        value={track.analysis?.brightness || 0} 
                        displayValue={`${(track.analysis?.rawBrightness || 0) / 1000} kHz`}
                        color="bg-cyan-500"
                        icon={<Activity size={10} />}
                        desc="Spectral Centroid. Center of mass of spectrum."
                     />

                     <FeatureBar 
                        label="Sharpness" 
                        value={track.analysis?.spectralRolloff || 0} 
                        displayValue={`${(track.analysis?.rawRolloff || 0) / 1000} kHz`}
                        color="bg-purple-500"
                        icon={<Sliders size={10} />}
                        desc="Spectral Rolloff point (85% energy)."
                     />
                   </div>
                </div>

                {/* Column 4: Metadata */}
                <div className="space-y-4">
                   <h4 className="text-gray-500 font-semibold uppercase tracking-wider">Metadata</h4>
                   <div className="bg-gray-800/30 rounded-lg p-3 space-y-2 font-mono text-gray-400 border border-gray-800/50 text-[10px]">
                      <div className="flex justify-between border-b border-gray-800 pb-1">
                         <span>Format</span>
                         <span className="text-gray-200 uppercase">{track.format}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 pb-1">
                         <span>Size</span>
                         <span className="text-gray-200">{(track.blob.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 pb-1">
                         <span>Duration</span>
                         <span className="text-gray-200">{track.duration.toFixed(3)}s</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 pb-1">
                         <span>Added</span>
                         <span className="text-gray-200">{new Date(track.addedAt).toLocaleDateString()}</span>
                      </div>
                       <div className="flex justify-between pt-1">
                         <span>UUID</span>
                         <span className="opacity-50 truncate w-24 text-right" title={track.id}>{track.id}</span>
                      </div>
                   </div>
                   
                   <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportAnalysis(track);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded bg-gray-800/50 hover:bg-accent-600 hover:text-white border border-gray-700 hover:border-accent-500 transition-all text-xs text-gray-400 group"
                   >
                      <Download size={14} className="group-hover:scale-110 transition-transform" />
                      Export Data
                   </button>
                </div>

             </div>
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full w-full">
      <Virtuoso
        style={{ height: '100%' }}
        data={tracks}
        itemContent={Row}
        className="scrollbar-thin"
      />
    </div>
  );
};

const FeatureBar = ({ label, value, displayValue, color, icon, desc }: { label: string, value: number, displayValue?: string, color: string, icon: React.ReactNode, desc?: string }) => (
  <div className="group relative">
    <div className="flex justify-between mb-1">
       <div className="flex items-center gap-1.5 text-gray-300">
         {icon}
         <span className="text-[11px] font-medium">{label}</span>
       </div>
       <span className="text-gray-500 font-mono text-[10px]">{displayValue || Math.round(value)}</span>
    </div>
    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
       <div 
          className={`h-full ${color} rounded-full transition-all duration-500`} 
          style={{ width: `${Math.min(value, 100)}%` }} 
       />
    </div>
    {desc && (
      <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block bg-gray-900 border border-gray-700 text-gray-300 text-[10px] p-2 rounded shadow-xl whitespace-nowrap z-20 pointer-events-none">
        {desc}
      </div>
    )}
  </div>
);

const ChromaGraph = ({ chroma }: { chroma?: number[] }) => {
  if (!chroma || chroma.length !== 12) return <div className="h-20 flex items-center justify-center bg-gray-800/30 rounded border border-gray-800/50 text-gray-600 italic text-[10px]">No chroma data</div>;
  
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  // Values are already normalized 0-1 from backend
  const normalizedChroma = chroma;

  return (
    <div className="bg-gray-800/30 p-3 rounded border border-gray-800/50">
      <div className="flex justify-between items-end h-20 gap-1">
        {normalizedChroma.map((val, i) => {
          const isDominant = val > 0.85; // Highlight dominant notes
          return (
            <div key={i} className="flex flex-col items-center justify-end w-full h-full group relative">
              
              {/* Bar */}
              <div 
                className={`
                  w-full rounded-t-[1px] transition-all duration-300 min-h-[2px] relative
                  ${isDominant ? 'bg-accent-500 shadow-[0_0_8px_rgba(139,92,246,0.4)]' : 'bg-gray-700/50 hover:bg-gray-600'}
                `}
                style={{ height: `${val * 100}%` }}
              >
              </div>

              {/* Note Label */}
              <span className={`
                text-[9px] mt-1.5 font-mono transition-colors
                ${isDominant ? 'text-accent-300 font-bold' : 'text-gray-600 group-hover:text-gray-400'}
              `}>
                {notes[i]}
              </span>
              
              {/* Tooltip */}
              <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 left-1/2 -translate-x-1/2 text-[10px] bg-gray-900 text-gray-200 px-2 py-1 rounded border border-gray-700 pointer-events-none z-20 whitespace-nowrap shadow-xl flex flex-col items-center gap-0.5">
                 <span className="font-bold text-accent-400">{notes[i]}</span>
                 <span className="text-[9px] text-gray-400">{Math.round(val * 100)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
