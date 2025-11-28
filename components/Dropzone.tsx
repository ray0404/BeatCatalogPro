import React, { useRef, useState } from 'react';
import { Upload, Music, Loader2 } from 'lucide-react';
import { parseAndAnalyzeFile } from '../services/audioAnalysis';
import { db } from '../db/db';

export const Dropzone: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setIsDragging(false);

    const tracksToAdd = [];
    
    // Process sequentially to avoid choking the thread (in prod, use a worker pool)
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('audio/')) {
        try {
          const track = await parseAndAnalyzeFile(file);
          tracksToAdd.push(track);
        } catch (e) {
          console.error(`Failed to process ${file.name}`, e);
        }
      }
    }

    if (tracksToAdd.length > 0) {
      await db.tracks.bulkAdd(tracksToAdd);
    }
    
    setIsProcessing(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    await processFiles(e.dataTransfer.files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await processFiles(e.target.files);
    // Reset input so same files can be selected again if needed
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div 
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ease-in-out cursor-pointer group
        ${isDragging ? 'border-accent-500 bg-accent-500/10' : 'border-gray-700 hover:border-gray-500 bg-gray-900/50'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input 
        type="file" 
        multiple 
        accept="audio/*" 
        className="hidden" 
        ref={inputRef}
        onChange={handleFileSelect}
      />
      
      <div className="flex flex-col items-center justify-center gap-4">
        {isProcessing ? (
          <>
            <Loader2 className="w-10 h-10 text-accent-500 animate-spin" />
            <div className="text-sm font-medium text-gray-300">
              Analyzing waveforms & vibes...
            </div>
          </>
        ) : (
          <>
            <div className={`p-4 rounded-full bg-gray-800 group-hover:bg-gray-700 transition-colors`}>
              <Upload className="w-6 h-6 text-gray-400 group-hover:text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-200">
                Drop your beats here
              </p>
              <p className="text-xs text-gray-500 mt-1">
                WAV, MP3, FLAC supported. Processing happens locally.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};