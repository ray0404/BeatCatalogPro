import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Dropzone } from './components/Dropzone';
import { TrackList } from './components/TrackList';
import { Player } from './components/Player';
import { SettingsPanel } from './components/SettingsPanel';
import { FolderOpen, Settings, Search } from 'lucide-react';
import { Button } from './components/Button';

const App: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="h-screen w-screen bg-gray-950 text-white flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="flex-none h-16 border-b border-gray-800 bg-gray-950/50 flex items-center px-6 justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-accent-500/20">
              <span className="font-bold text-white text-lg">B</span>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              BeatCatalog
            </h1>
            <span className="ml-2 px-2 py-0.5 rounded bg-gray-800 text-[10px] text-gray-400 border border-gray-700">v2.0 Local</span>
          </div>

          <div className="flex items-center gap-3">
             <div className="hidden md:flex relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={14} className="text-gray-500" />
                </div>
                <input 
                  type="text" 
                  placeholder="Filter beats..." 
                  className="bg-gray-900 border border-gray-800 text-gray-300 text-sm rounded-full focus:ring-accent-500 focus:border-accent-500 block w-full pl-10 p-1.5 transition-all w-64 focus:w-80" 
                />
             </div>
             <Button variant="icon" onClick={() => setIsSettingsOpen(true)}>
                <Settings size={20} />
             </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Sidebar (Desktop) */}
          <aside className="hidden md:flex w-64 flex-col border-r border-gray-800 bg-gray-900/30 p-4 gap-2">
             <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Library</div>
             <Button variant="ghost" className="justify-start text-white bg-gray-800/50">
                <FolderOpen size={18} className="mr-2" />
                All Tracks
             </Button>
             
             <div className="mt-6 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Smart Crates</div>
             {['High Energy', 'Chill Vibes', 'Dark / Trap', 'Samples'].map(crate => (
                 <Button key={crate} variant="ghost" className="justify-start">
                    <span className="w-2 h-2 rounded-full bg-gray-600 mr-3" />
                    {crate}
                 </Button>
             ))}
          </aside>

          {/* Center Stage */}
          <div className="flex-1 flex flex-col min-w-0 bg-gray-950">
             <div className="p-6 pb-2">
                <Dropzone />
             </div>
             <div className="flex-1 px-2 pb-24 overflow-hidden">
                <TrackList />
             </div>
          </div>

        </main>

        {/* Global Player */}
        <Player />

        {/* Settings Panel */}
        <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      </div>
    </BrowserRouter>
  );
};

export default App;
