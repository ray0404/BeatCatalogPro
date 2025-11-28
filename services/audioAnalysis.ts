import { Track, AudioAnalysis } from '../types';
import { v4 as uuidv4 } from 'uuid';
import Meyda from 'meyda';
import { useSettingsStore } from '../store/useSettingsStore';
import { DEFAULT_ANALYSIS } from '../constants';

// --- Singleton AudioContext to prevent browser limit exhaustion ---
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

// --- K-Weighted Loudness (LUFS) Approximation ---
const calculateIntegratedLoudness = async (buffer: AudioBuffer): Promise<number> => {
  try {
    // EBU R128 uses a K-weighting filter chain:
    // 1. High-shelf filter (+4dB @ 1500Hz) to simulate head acoustics
    // 2. High-pass filter (cutoff ~38Hz) to simulate limited ear sensitivity to low freq
    
    // We utilize OfflineAudioContext for fast processing
    const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;

    // Stage 1: High Shelf
    const highShelf = offlineCtx.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 1500;
    highShelf.gain.value = 4;
    highShelf.Q.value = 0.7; // 1/sqrt(2) approx

    // Stage 2: High Pass (Pre-filter RLB)
    const highPass = offlineCtx.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 38;
    highPass.Q.value = 0.5;

    source.connect(highShelf);
    highShelf.connect(highPass);
    highPass.connect(offlineCtx.destination);
    
    source.start(0);
    const rendered = await offlineCtx.startRendering();
    
    // Calculate Mean Square of the filtered signal
    // For stereo, we should ideally sum channels with weights (L=1, R=1 for simple stereo)
    let sumSquares = 0;
    const totalSamples = rendered.length * rendered.numberOfChannels;
    
    for (let c = 0; c < rendered.numberOfChannels; c++) {
        const data = rendered.getChannelData(c);
        for (let i = 0; i < data.length; i++) {
            sumSquares += data[i] * data[i];
        }
    }
    
    const meanSquare = sumSquares / totalSamples;
    if (meanSquare === 0) return -100;

    // Formula: 10 * log10(meanSquare) - 0.691 (tuning factor for K-weighting)
    const lufs = (10 * Math.log10(meanSquare)) - 0.691;
    
    return parseFloat(lufs.toFixed(1));
  } catch (e) {
    console.warn("LUFS calc failed", e);
    return -100;
  }
};

// --- BPM Detection Algorithm ---
const calculateBPM = async (originalBuffer: AudioBuffer): Promise<number> => {
  try {
    const offlineCtx = new OfflineAudioContext(1, originalBuffer.length, originalBuffer.sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = originalBuffer;

    const filter = offlineCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 150; 
    filter.Q.value = 1;

    source.connect(filter);
    filter.connect(offlineCtx.destination);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    const data = renderedBuffer.getChannelData(0);

    const peaks = [];
    const threshold = 0.3;
    const minDistance = 0.25; 
    
    let maxVol = 0;
    for(let i=0; i<data.length; i++) {
        if (Math.abs(data[i]) > maxVol) maxVol = Math.abs(data[i]);
    }
    if (maxVol === 0) return 0;

    let lastPeakTime = -1;

    for (let i = 0; i < data.length; i++) {
        const val = Math.abs(data[i]) / maxVol; 
        if (val > threshold) {
            const time = i / originalBuffer.sampleRate;
            if (lastPeakTime === -1 || (time - lastPeakTime) > minDistance) {
                peaks.push(time);
                lastPeakTime = time;
                i += Math.floor(0.15 * originalBuffer.sampleRate); 
            }
        }
    }

    if (peaks.length < 10) return 0;

    const intervals: { [key: number]: number } = {};
    for (let i = 0; i < peaks.length - 1; i++) {
        for (let j = 1; j <= 5; j++) { 
             if (i + j >= peaks.length) break;
             const interval = peaks[i+j] - peaks[i];
             let bpm = 60 / interval;
             while (bpm < 70) bpm *= 2;
             while (bpm > 180) bpm /= 2;
             bpm = Math.round(bpm);
             if (!intervals[bpm]) intervals[bpm] = 0;
             intervals[bpm]++;
        }
    }

    let maxCount = 0;
    let detectedBPM = 0;
    Object.keys(intervals).forEach(bpmStr => {
        const bpm = parseInt(bpmStr);
        const count = (intervals[bpm] || 0) + ((intervals[bpm-1] || 0) * 0.5) + ((intervals[bpm+1] || 0) * 0.5);
        if (count > maxCount) {
            maxCount = count;
            detectedBPM = bpm;
        }
    });

    return detectedBPM;
  } catch (e) {
    console.warn("BPM Detection failed", e);
    return 0;
  }
};

export const parseAndAnalyzeFile = async (file: File): Promise<Track> => {
  const id = uuidv4();
  const blob = file; 
  
  const fileNameParts = file.name.split('.');
  const ext = fileNameParts.pop();
  const name = fileNameParts.join('.');
  
  let artist = "Unknown Artist";
  let title = name;
  if (name.includes('-')) {
    const parts = name.split('-');
    artist = parts[0].trim();
    title = parts.slice(1).join('-').trim();
  }

  const analysis = await analyzeAudio(file);

  return {
    id,
    title,
    artist,
    addedAt: Date.now(),
    duration: analysis.duration || 0, 
    format: ext || 'unknown',
    blob,
    analysis
  };
};

const analyzeAudio = async (file: File): Promise<AudioAnalysis> => {
  const ctx = getAudioContext();
  const settings = useSettingsStore.getState();
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // We let decodeAudioData try its best
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    const signal = new Float32Array(settings.analysisBufferSize);
    const channelData = audioBuffer.getChannelData(0); // Left channel
    const rightChannelData = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : null;

    // --- 0. BPM & LUFS Detection ---
    const [bpm, integratedLoudness] = await Promise.all([
        calculateBPM(audioBuffer),
        calculateIntegratedLoudness(audioBuffer)
    ]);

    // --- 1. Waveform Peaks ---
    const duration = audioBuffer.duration;
    const sampleRate = audioBuffer.sampleRate;
    const totalSamples = channelData.length;
    const waveform = [];
    const step = Math.ceil(totalSamples / (duration * 50)); 

    let absoluteMaxPeak = 0;

    for (let i = 0; i < totalSamples; i += step) {
       let min = 1.0;
       let max = -1.0;
       for (let j = 0; j < step; j++) {
           if ((i + j) >= totalSamples) break;
           const val = channelData[i + j];
           if (val < min) min = val;
           if (val > max) max = val;
           if (Math.abs(val) > absoluteMaxPeak) absoluteMaxPeak = Math.abs(val);
           if (rightChannelData) {
               const valR = rightChannelData[i + j];
               if (Math.abs(valR) > absoluteMaxPeak) absoluteMaxPeak = Math.abs(valR);
           }
       }
       // Ensure finite number
       const peak = Math.max(Math.abs(min), Math.abs(max));
       waveform.push(isFinite(peak) ? peak : 0);
    }

    // --- 2. Meyda Feature Extraction ---
    Meyda.bufferSize = settings.analysisBufferSize;
    Meyda.sampleRate = sampleRate; 

    const chunksToAnalyze = 10;
    const chunkStep = Math.floor(totalSamples / chunksToAnalyze);
    
    const featuresList: any[] = [];
    let totalCorrelation = 0;
    let validCorrelationChunks = 0;

    for (let i = 0; i < chunksToAnalyze; i++) {
        const start = i * chunkStep;
        if (start + settings.analysisBufferSize > totalSamples) break;
        
        let sumL2 = 0, sumR2 = 0, sumLR = 0;
        
        for (let j = 0; j < settings.analysisBufferSize; j++) {
            const valL = channelData[start + j];
            signal[j] = valL;

            if (rightChannelData) {
                const valR = rightChannelData[start + j];
                sumL2 += valL * valL;
                sumR2 += valR * valR;
                sumLR += valL * valR;
            }
        }

        if (rightChannelData && sumL2 > 0 && sumR2 > 0) {
            totalCorrelation += sumLR / Math.sqrt(sumL2 * sumR2);
            validCorrelationChunks++;
        }

        const features = Meyda.extract([
            'rms', 
            'spectralCentroid', 
            'spectralFlatness', 
            'spectralRolloff', 
            'zcr', 
            'chroma'
        ], signal);
        
        if (features) featuresList.push(features);
    }

    if (featuresList.length === 0) return { ...DEFAULT_ANALYSIS, duration, bpm, integratedLoudness };

    const avg = (key: string) => featuresList.reduce((acc, curr) => acc + (curr[key] || 0), 0) / featuresList.length;
    
    const rawEnergy = avg('rms'); 
    const rawBrightness = avg('spectralCentroid'); 
    const rawRolloff = avg('spectralRolloff');
    const rawFlatness = avg('spectralFlatness');
    const rawZCR = avg('zcr');

    // Process Chroma
    const chroma = featuresList[0].chroma ? new Array(12).fill(0) : [];
    if (chroma.length) {
        featuresList.forEach(f => {
            f.chroma.forEach((val: number, idx: number) => chroma[idx] += val);
        });
        // Normalize Chroma
        let maxChroma = 0;
        for(let k=0; k<12; k++) {
             chroma[k] /= featuresList.length;
             if (chroma[k] > maxChroma) maxChroma = chroma[k];
        }
        if (maxChroma > 0) {
            for(let k=0; k<12; k++) chroma[k] /= maxChroma;
        }
    }

    // --- 3. Mixing Metrics ---
    const peakAmplitudeDB = 20 * Math.log10(absoluteMaxPeak + 0.000001);
    const rmsDB = 20 * Math.log10(rawEnergy + 0.00001);
    const dynamicRange = peakAmplitudeDB - rmsDB;
    const stereoWidth = validCorrelationChunks > 0 ? totalCorrelation / validCorrelationChunks : 1;

    // --- 4. UI Normalization ---
    const energy = Math.max(0, Math.min(100, ((rmsDB + 60) / 60) * 100)); 

    const binWidth = sampleRate / settings.analysisBufferSize;
    const brightnessHz = rawBrightness * binWidth; 
    const brightness = Math.min(100, (brightnessHz / 8000) * 100);

    const rolloffHz = rawRolloff * binWidth;
    const spectralRolloff = Math.min(100, (rolloffHz / 16000) * 100);

    const spectralFlatness = rawFlatness * 100;

    const zcrHz = rawZCR * (sampleRate / settings.analysisBufferSize);
    const zeroCrossingRate = Math.min(100, (zcrHz / 4000) * 100);

    // Key Detection
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    let maxVal = -1;
    let maxIndex = -1;
    chroma.forEach((val, idx) => {
        if (val > maxVal) {
            maxVal = val;
            maxIndex = idx;
        }
    });
    const key = maxIndex >= 0 ? notes[maxIndex] : 'Unknown';

    return {
      duration,
      bpm,
      energy,
      brightness,
      waveform,
      key,
      spectralFlatness,
      spectralRolloff,
      zeroCrossingRate,
      chroma,
      
      integratedLoudness,
      peakAmplitude: parseFloat(peakAmplitudeDB.toFixed(2)),
      dynamicRange: parseFloat(dynamicRange.toFixed(1)),
      stereoWidth: parseFloat(stereoWidth.toFixed(2)),

      rawEnergy: parseFloat(rmsDB.toFixed(1)), 
      rawBrightness: Math.round(brightnessHz), 
      rawRolloff: Math.round(rolloffHz), 
      rawFlatness: parseFloat(rawFlatness.toFixed(2)), 
      rawZCR: Math.round(zcrHz) 
    };

  } catch (error) {
    console.error("Audio analysis failed", error);
    return { ...DEFAULT_ANALYSIS };
  }
};