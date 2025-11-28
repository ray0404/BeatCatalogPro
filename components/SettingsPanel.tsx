import React from 'react';
import { X, Monitor, Speaker, Trash2, AlertCircle, Cpu } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { db } from '../db/db';
import { Button } from './Button';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const settings = useSettingsStore();

  const handleClearLibrary = async () => {
    if (window.confirm('Are you sure you want to delete all tracks? This cannot be undone.')) {
      await db.tracks.clear();
      window.location.reload();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`
        fixed inset-y-0 right-0 z-[70] w-80 bg-gray-900 border-l border-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">Settings</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* UI Section */}
            <section>
              <div className="flex items-center gap-2 mb-4 text-accent-400 font-semibold uppercase text-xs tracking-wider">
                <Monitor size={14} />
                Interface
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Compact Track List</span>
                  <Toggle checked={settings.compactMode} onChange={settings.toggleCompactMode} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Show Visualizer</span>
                  <Toggle checked={settings.showWaveform} onChange={settings.toggleShowWaveform} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Show Analysis Details</span>
                  <Toggle checked={settings.showAnalysis} onChange={settings.toggleShowAnalysis} />
                </div>
              </div>
            </section>

            {/* Audio Section */}
            <section>
              <div className="flex items-center gap-2 mb-4 text-accent-400 font-semibold uppercase text-xs tracking-wider">
                <Speaker size={14} />
                Audio Engine
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Auto-play Next</span>
                  <Toggle checked={settings.autoPlay} onChange={settings.toggleAutoPlay} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Master Gain Limit</span>
                    <span className="text-gray-500">{Math.round(settings.masterVolume * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1" 
                    step="0.05"
                    value={settings.masterVolume}
                    onChange={(e) => settings.setMasterVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Crossfade Duration</span>
                    <span className="text-gray-500">{settings.crossfadeDuration}s</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    step="1"
                    value={settings.crossfadeDuration}
                    onChange={(e) => settings.setCrossfadeDuration(parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-500"
                  />
                </div>
              </div>
            </section>

             {/* Analysis Config */}
             <section>
              <div className="flex items-center gap-2 mb-4 text-accent-400 font-semibold uppercase text-xs tracking-wider">
                <Cpu size={14} />
                Analysis Config
              </div>
              <div className="space-y-4 bg-gray-800/20 p-4 rounded-lg border border-gray-800">
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Buffer Size</span>
                    <span className="text-gray-500 font-mono text-xs">{settings.analysisBufferSize} samples</span>
                  </div>
                  <select 
                    value={settings.analysisBufferSize}
                    onChange={(e) => settings.setAnalysisBufferSize(parseInt(e.target.value))}
                    className="w-full bg-gray-800 text-gray-200 text-xs rounded border border-gray-700 p-2 focus:border-accent-500 outline-none"
                  >
                    {[512, 1024, 2048, 4096, 8192].map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Windowing Function</span>
                    <span className="text-gray-500 text-xs capitalize">{settings.analysisWindowing}</span>
                  </div>
                  <select 
                    value={settings.analysisWindowing}
                    onChange={(e) => settings.setAnalysisWindowing(e.target.value)}
                    className="w-full bg-gray-800 text-gray-200 text-xs rounded border border-gray-700 p-2 focus:border-accent-500 outline-none capitalize"
                  >
                    {['rect', 'hanning', 'hamming', 'blackman', 'sine'].map(func => (
                      <option key={func} value={func}>{func}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-start gap-2 mt-2">
                  <AlertCircle size={12} className="text-gray-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-gray-500 leading-tight">
                    Changes apply to newly imported tracks only. 
                    Larger buffers increase frequency resolution but reduce time precision.
                  </p>
                </div>

              </div>
            </section>

            {/* Danger Zone */}
            <section className="pt-6 border-t border-gray-800">
               <div className="flex items-center gap-2 mb-4 text-red-400 font-semibold uppercase text-xs tracking-wider">
                <AlertCircle size={14} />
                Storage
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-xs text-red-200 mb-3">
                  This will permanently delete all tracks and analysis data from your local browser storage.
                </p>
                <Button 
                  onClick={handleClearLibrary}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white border-none shadow-none"
                >
                  <Trash2 size={16} />
                  Clear Library
                </Button>
              </div>
            </section>

          </div>
          
          <div className="p-4 border-t border-gray-800 text-center">
            <p className="text-xs text-gray-600">BeatCatalog v2.0</p>
          </div>
        </div>
      </div>
    </>
  );
};

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button 
    onClick={onChange}
    className={`
      w-11 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-accent-500
      ${checked ? 'bg-accent-600' : 'bg-gray-700'}
    `}
  >
    <div className={`
      absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform transform
      ${checked ? 'translate-x-5' : 'translate-x-0'}
    `} />
  </button>
);