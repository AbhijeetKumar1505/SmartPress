
import React, { useState } from 'react';
import { 
  Cpu, 
  Settings, 
  Download, 
  Trash2, 
  AlertCircle, 
  Info,
  Layers,
  Sparkles,
  RefreshCcw,
  CheckCircle2,
  Maximize2,
  Minimize2,
  FileIcon,
  TriangleAlert
} from 'lucide-react';
import FileUploader from './components/FileUploader';
import { AppState, FileMetadata, FileCategory } from './types';
import { getCompressionStrategy } from './services/geminiService';
import { compressFile } from './services/compressionEngine';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    file: null,
    metadata: null,
    targetSize: 1024 * 500,
    isProcessing: false,
    progress: 0,
    result: null,
    error: null,
    iteration: 0
  });

  const [inputVal, setInputVal] = useState("500");
  const [unit, setUnit] = useState<"B" | "KB" | "MB">("KB");
  const [showCompare, setShowCompare] = useState(false);

  const reset = () => {
    setState({
      file: null,
      metadata: null,
      targetSize: 1024 * 500,
      isProcessing: false,
      progress: 0,
      result: null,
      error: null,
      iteration: 0
    });
    setInputVal("500");
    setUnit("KB");
    setShowCompare(false);
  };

  const handleFileSelect = (file: File, metadata: FileMetadata) => {
    if (file.size > MAX_FILE_SIZE) {
      setState(prev => ({ ...prev, error: "File exceeds 500MB limit. Please upload a smaller file." }));
      return;
    }
    
    setState(prev => ({ ...prev, file, metadata, error: null }));
    const suggestedTarget = file.size * 0.4;
    if (suggestedTarget > 1024 * 1024) {
      setInputVal((suggestedTarget / (1024 * 1024)).toFixed(1));
      setUnit("MB");
    } else if (suggestedTarget > 1024) {
      setInputVal((suggestedTarget / 1024).toFixed(0));
      setUnit("KB");
    } else {
      setInputVal(suggestedTarget.toFixed(0));
      setUnit("B");
    }
  };

  const targetInBytes = unit === "B" 
    ? parseFloat(inputVal) 
    : unit === "KB" 
      ? parseFloat(inputVal) * 1024 
      : parseFloat(inputVal) * 1024 * 1024;

  const isTargetAggressive = state.file ? (targetInBytes < (state.file.size * 0.05)) : false;

  const startCompression = async () => {
    if (!state.file || !state.metadata) return;

    if (isNaN(targetInBytes) || targetInBytes <= 0) {
      setState(prev => ({ ...prev, error: "Please enter a valid target size." }));
      return;
    }
    
    if (targetInBytes >= state.file.size) {
      setState(prev => ({ ...prev, error: "Target size must be smaller than original." }));
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, progress: 5, error: null, result: null, iteration: 0, targetSize: targetInBytes }));

    try {
      let currentIteration = 0;
      let lastSize = state.file.size;
      let finalBlob: Blob | null = null;
      let lastStrategy = null;

      while (currentIteration < 4) {
        currentIteration++;
        setState(prev => ({ ...prev, iteration: currentIteration, progress: 10 + (currentIteration * 20) }));

        const strategy = await getCompressionStrategy(
          state.metadata.category,
          state.file.size,
          targetInBytes,
          currentIteration,
          lastSize
        );
        lastStrategy = strategy;

        finalBlob = await compressFile(state.file, state.metadata.category, strategy);
        lastSize = finalBlob.size;

        if (lastSize <= (targetInBytes * 1.05)) break;
      }

      if (finalBlob && lastStrategy) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          progress: 100,
          result: {
            originalSize: state.file!.size,
            compressedSize: finalBlob!.size,
            blob: finalBlob!,
            format: finalBlob!.type,
            strategyUsed: lastStrategy!
          }
        }));
      }
    } catch (err: any) {
      console.error(err);
      setState(prev => ({ ...prev, isProcessing: false, error: "AI reasoning or processing failed. Please try again." }));
    }
  };

  const downloadResult = () => {
    if (!state.result || !state.metadata) return;
    const url = URL.createObjectURL(state.result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart_${state.metadata.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes: number) => {
    if (isNaN(bytes)) return "0 B";
    if (bytes < 1024) return `${bytes.toFixed(0)} B`;
    if (bytes < (1024 * 1024)) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const compressionRatio = state.result 
    ? ((1 - (state.result.compressedSize / state.result.originalSize)) * 100).toFixed(1)
    : "0";

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 lg:py-16">
      <header className="mb-12 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-500/20">
          <Sparkles size={14} className="animate-pulse" />
          <span>Iterative AI Optimization Loop</span>
        </div>
        <h1 className="text-4xl lg:text-7xl font-black tracking-tight text-white mb-4">
          SmartPress<span className="text-blue-500">.AI</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
          The intelligent compression engine that converts your files into the exact size you need, optimized by Gemini 3 logic.
        </p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          {!state.file ? (
            <FileUploader onFileSelect={handleFileSelect} />
          ) : (
            <div className="glass-morphism rounded-3xl p-8 relative overflow-hidden border border-white/5">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <FileIcon size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-white truncate max-w-[240px] md:max-w-md">{state.metadata?.name}</h3>
                    <p className="text-sm text-slate-400 font-medium">
                      {formatSize(state.file.size)} 
                      <span className="mx-2 opacity-30">|</span> 
                      {state.file.size.toLocaleString()} bytes
                    </p>
                  </div>
                </div>
                <button 
                  onClick={reset}
                  className="p-3 bg-slate-800/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="space-y-6 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-bold text-slate-300 uppercase tracking-widest">Desired Target Size</label>
                    <p className="text-xs text-slate-500 mt-1">
                      Current Target: <span className="text-blue-400 font-mono">{targetInBytes.toLocaleString()} bytes</span>
                    </p>
                  </div>
                  <div className="flex bg-slate-900/80 rounded-xl p-1 border border-white/5">
                    {["B", "KB", "MB"].map(u => (
                      <button 
                        key={u}
                        onClick={() => setUnit(u as "B" | "KB" | "MB")}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${unit === u ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <input 
                      type="number"
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      className="w-28 bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-white font-mono text-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner"
                    />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="range"
                      min="1"
                      max={
                        unit === "B" 
                        ? state.file.size 
                        : unit === "KB" 
                          ? Math.min(state.file.size / 1024, 5000) 
                          : Math.min(state.file.size / (1024 * 1024), 500)
                      }
                      step="1"
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {isTargetAggressive && (
                  <div className="flex items-center space-x-3 text-amber-400 text-xs bg-amber-500/5 p-3 rounded-xl border border-amber-500/20">
                    <TriangleAlert size={14} />
                    <span>Aggressive target (&lt; 5% of original). Quality may be significantly reduced.</span>
                  </div>
                )}
                
                {state.error && (
                  <div className="flex items-center space-x-3 text-red-400 text-sm bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
                    <AlertCircle size={18} />
                    <span className="font-medium">{state.error}</span>
                  </div>
                )}

                <button
                  disabled={state.isProcessing}
                  onClick={startCompression}
                  className={`group relative w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center space-x-3 transition-all ${
                    state.isProcessing 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-2xl active:scale-[0.98]'
                  }`}
                >
                  {state.isProcessing ? (
                    <>
                      <RefreshCcw className="animate-spin" size={24} />
                      <span>Gemini Optimization {state.iteration}/4...</span>
                    </>
                  ) : (
                    <>
                      <Cpu size={24} />
                      <span>Compress to {inputVal} {unit}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {state.result && (
            <div className="glass-morphism rounded-3xl p-8 border-l-4 border-blue-500 shadow-xl">
              <div className="flex items-center space-x-3 text-blue-400 mb-4">
                <Sparkles size={20} />
                <h4 className="font-black uppercase text-sm tracking-[0.2em]">AI Decision Reasoning</h4>
              </div>
              <p className="text-slate-200 text-lg leading-relaxed mb-6">"{state.result.strategyUsed.reasoning}"</p>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { label: 'Algorithm', value: state.result.strategyUsed.method },
                  { label: 'Quality Score', value: `${(state.result.strategyUsed.quality * 100).toFixed(0)}%` },
                  { label: 'Size Reduction', value: `${compressionRatio}%` }
                ].map(stat => (
                  <div key={stat.label} className="bg-slate-900/50 rounded-2xl p-4 border border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">{stat.label}</p>
                    <p className="text-white font-bold text-lg">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="glass-morphism rounded-3xl p-8 min-h-[500px] flex flex-col border border-white/5">
            <h3 className="text-xl font-black mb-8 flex items-center space-x-3 text-white">
              <Layers size={22} className="text-blue-500" />
              <span>Byte-Level Analytics</span>
            </h3>

            {!state.result && !state.isProcessing ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <div className="w-20 h-20 bg-slate-900/50 rounded-3xl flex items-center justify-center mb-6 border border-white/5">
                  <Settings size={40} className="text-slate-700 animate-spin-slow" />
                </div>
                <p className="text-slate-400 text-lg font-medium leading-relaxed">
                  Ready for Input<br/>
                  <span className="text-sm font-normal text-slate-500 italic">Supports up to 500MB per file</span>
                </p>
              </div>
            ) : state.isProcessing ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-10">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle className="text-slate-800" strokeWidth="6" stroke="currentColor" fill="transparent" r="42" cx="50" cy="50" />
                    <circle 
                      className="text-blue-500 transition-all duration-700 ease-out" 
                      strokeWidth="6" 
                      strokeDasharray={263.89}
                      strokeDashoffset={263.89 - (263.89 * state.progress) / 100}
                      strokeLinecap="round" 
                      stroke="currentColor" 
                      fill="transparent" 
                      r="42" cx="50" cy="50" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white">{state.progress}%</span>
                  </div>
                </div>
                <div className="text-center space-y-3">
                  <p className="text-xl font-bold text-white flex items-center justify-center space-x-2">
                    <RefreshCcw className="text-blue-500 animate-spin" size={20} />
                    <span>Neural Loop Active</span>
                  </p>
                  <p className="text-slate-400 font-medium max-w-[200px] mx-auto">Evaluating content context for minimal loss...</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Efficiency</span>
                    <span className="text-3xl font-black text-green-400">-{compressionRatio}%</span>
                  </div>
                  <div className="w-full h-5 bg-slate-950 rounded-full p-1 border border-white/5 flex items-center">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-1000"
                      style={{ width: `${(state.result!.compressedSize / state.result!.originalSize) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-black tracking-widest text-slate-600 uppercase">
                    <span>Final State</span>
                    <span>{state.result!.compressedSize.toLocaleString()} Bytes</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-900/60 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Raw Input</p>
                    <p className="text-xl font-bold text-slate-300">{formatSize(state.result!.originalSize)}</p>
                  </div>
                  <div className="p-5 bg-green-500/10 rounded-2xl border border-green-500/20">
                    <p className="text-[10px] text-green-500/60 uppercase font-black tracking-widest mb-1">Raw Output</p>
                    <p className="text-xl font-bold text-green-400">{formatSize(state.result!.compressedSize)}</p>
                  </div>
                </div>

                {state.metadata?.category === FileCategory.IMAGE && (
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950 group h-64 shadow-2xl">
                    <div className={`grid h-full transition-all duration-500 ${showCompare ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      <div className="relative overflow-hidden flex items-center justify-center p-2">
                        <img 
                          src={URL.createObjectURL(state.result!.blob)} 
                          className="max-h-full max-w-full object-contain drop-shadow-lg"
                          alt="Compressed" 
                        />
                        <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold text-white border border-white/10">COMPRESSED</span>
                      </div>
                      {showCompare && state.metadata.previewUrl && (
                        <div className="relative overflow-hidden border-l border-white/10 flex items-center justify-center p-2 bg-slate-900/50">
                          <img 
                            src={state.metadata.previewUrl} 
                            className="max-h-full max-w-full object-contain drop-shadow-lg"
                            alt="Original" 
                          />
                          <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold text-white border border-white/10">RAW SOURCE</span>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => setShowCompare(!showCompare)}
                      className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 backdrop-blur text-white rounded-xl border border-white/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      {showCompare ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                  </div>
                )}

                <div className="flex items-center space-x-4 text-sm text-slate-400 bg-blue-500/5 p-5 rounded-2xl border border-blue-500/10">
                  <CheckCircle2 size={24} className="text-green-500 shrink-0" />
                  <p className="font-medium">Verification Successful. Bit-depth and metadata optimized for web delivery.</p>
                </div>

                <button
                  onClick={downloadResult}
                  className="w-full py-5 bg-white text-slate-950 hover:bg-slate-100 rounded-2xl font-black text-xl shadow-2xl flex items-center justify-center space-x-3 transition-all hover:-translate-y-1"
                >
                  <Download size={26} />
                  <span>Save Optimized File</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-slate-600 text-xs font-bold uppercase tracking-[0.3em] gap-6">
        <p>&copy; 2024 SmartPress AI Engine // Max 500MB</p>
        <div className="flex space-x-10">
          <p className="text-blue-500/50">Gemini 3 Flash Powered</p>
          <a href="#" className="hover:text-blue-500 transition-colors">Safety Systems</a>
          <a href="#" className="hover:text-blue-500 transition-colors">Protocol Info</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
