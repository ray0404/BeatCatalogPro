# BeatCatalog Pro 🎧

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)
![Status](https://img.shields.io/badge/status-active-success.svg)

**BeatCatalog Pro** is a comprehensive, local-first Progressive Web App (PWA) designed for **audio professionals across all disciplines**. Whether you are a sound designer, archivist, music researcher, or producer, this tool provides a high-performance environment for organizing libraries and extracting deep acoustic features—ranging from temporal dynamics to harmonic content—without your data ever leaving the device.

> 🚀 **v2.0 Local** - Privacy-focused, general-purpose audio feature extraction and cataloging.

---

## ✨ Features

*   **Universal Feature Extraction**:
    *   **Temporal Analysis**: Precise BPM/Tempo detection, duration, and transient analysis.
    *   **Harmonic Content**: Chroma-based musical key detection and pitch class profiling.
    *   **Spectral Metrics**: Analysis of brightness (Centroid), texture (Flatness), and timbre (Rolloff).
    *   **Loudness Standards**: Integrated LUFS (EBU R128 approx) and True Peak metering.
*   **Local-First Architecture**: Leveraging IndexedDB (Dexie.js), your audio data remains 100% private and offline-accessible. No cloud uploads required.
*   **Broad Format Support**: Analyze and catalog a wide variety of audio formats supported by the browser.
*   **Interactive Visualizer**: High-resolution waveform rendering for detailed visual inspection of signal characteristics.
*   **Flexible Organization**: Tagging, searching, and smart filtering adapted for diverse audio libraries, from field recordings to musical stems.

## 🛠 Tech Stack

*   **Core**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
*   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
*   **Database**: [Dexie.js](https://dexie.org/) (IndexedDB wrapper)
*   **Audio Engine**:
    *   [Wavesurfer.js](https://wavesurfer-js.org/) (Visualization)
    *   [Meyda](https://meyda.js.org/) (Feature Extraction)
    *   Native `OfflineAudioContext` (Custom DSP)
*   **Routing**: [React Router v7](https://reactrouter.com/)
*   **Styling**: Tailwind CSS

## 🚀 Getting Started

### Prerequisites

*   **Node.js**: v18 or higher
*   **npm** or **yarn**

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/ray0404/BeatCatalogPro.git
    cd BeatCatalogPro
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```
    Open `http://localhost:3000` to view the app.

### Building for Production

To create a production-ready build:

```bash
npm run build
```

This will generate a `dist` folder containing the compiled assets, ready to be deployed to Vercel, Netlify, or any static host.

## 🧠 Audio Analysis Engine

BeatCatalog Pro leverages a sophisticated client-side DSP pipeline (`services/audioAnalysis.ts`) suitable for a wide range of analytical needs:

1.  **Decoding**: High-fidelity decoding via Web Audio API.
2.  **DSP Pipeline**:
    *   **Loudness**: K-weighting filter chain (High Shelf @ 1500Hz + High Pass @ 38Hz) for standard loudness measurement.
    *   **Temporal**: Custom peak-detection and interval clustering for robust tempo and rhythm analysis.
    *   **Spectral**: Utilizes `Meyda` for granular extraction of spectral centroid, flatness, and rolloff, quantifying the sonic "texture" and timbre.

## 📂 Project Structure

```text
/
├── components/       # Reusable UI components
├── db/               # Dexie database schema and configuration
├── services/         # Audio analysis and signal processing logic
├── store/            # Global application state
├── types.ts          # Domain models and type definitions
├── App.tsx           # Main application layout
└── vite.config.ts    # Build configuration
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request to expand the analytical capabilities or improve the interface.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/NewAnalysisModule`)
3.  Commit your changes (`git commit -m 'Add new spectral feature'`)
4.  Push to the branch (`git push origin feature/NewAnalysisModule`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Empowering audio professionals with local, transparent analysis tools.*
