import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileCheck, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Info,
  Sliders,
  Volume2,
  CheckCircle2
} from 'lucide-react';

import api from '../services/api';
import type { DetectionRecord } from '../types';
import { useAlarm } from '../context/AlarmContext';

export const ImageDetectionPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionRecord | null>(null);
  const [showOverlay, setShowOverlay] = useState<boolean>(true);

  const { triggerAlarm } = useAlarm();

  const handleFileChange = (file: File | null) => {
    setError(null);
    setResult(null);

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file format. Only JPG, JPEG, and PNG images are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (notes) formData.append('notes', notes);

    try {
      const res = await api.post<DetectionRecord>('/api/detections/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResult(res.data);

      if (res.data.prediction === 'leakage') {
        triggerAlarm();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Image analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setNotes('');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Instructions */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Chemical Storage Cabinet RGB Analysis</h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload a high-resolution RGB image of a closed chemical storage cabinet to perform AI feature classification & simulated gas cloud risk estimation.
        </p>
      </div>

      {error && (
        <div className="bg-red-950/90 border border-red-600 text-red-200 p-4 rounded-xl text-xs flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Analysis Workflow Container */}
      {!result ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Area (Left 2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center bg-white transition flex flex-col items-center justify-center min-h-[320px] ${
                previewUrl ? 'border-blue-400 bg-blue-50/20' : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50'
              }`}
            >
              {previewUrl ? (
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="Cabinet preview"
                    className="max-h-72 max-w-full rounded-lg border border-slate-200 shadow-md mx-auto object-contain"
                  />
                  <div className="flex items-center justify-center space-x-2 text-xs text-slate-600">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold">{selectedFile?.name}</span>
                    <span className="text-slate-400">({((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Drag & drop chemical cabinet image here
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Supports JPG, JPEG, and PNG formats up to 10MB</p>
                  </div>
                  <div>
                    <label className="cursor-pointer inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition shadow">
                      <span>Browse Files</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        className="hidden"
                        onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action & Metadata Panel (Right Column) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Analysis Parameters</h3>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Inspector Notes (Optional)</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g., Cabinet #B-04, Flammable Solvents Section..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-[11px] text-amber-800 leading-tight space-y-1">
                <p className="font-bold flex items-center space-x-1">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Model Inference Notice</span>
                </p>
                <p>
                  Images are processed using a fine-tuned PyTorch MobileNetV2 network. If leakage is predicted, an explainable Grad-CAM gas plume simulation will be rendered.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-100">
              <button
                onClick={handleAnalyze}
                disabled={!selectedFile || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Running Model Inference...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyse Image</span>
                  </>
                )}
              </button>

              {previewUrl && (
                <button
                  onClick={handleReset}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2 rounded-lg transition"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Results View (Side-by-Side Display) */
        <div className="space-y-6">
          {/* Prominent Prediction Banner */}
          {result.prediction === 'leakage' ? (
            <div className="bg-red-600 text-white p-6 rounded-2xl shadow-xl border-2 border-red-700 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse-danger">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-2xl">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-white text-red-700 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      DANGER ALERT
                    </span>
                    <span className="text-xs text-red-100 font-mono">Mode: {result.mode}</span>
                  </div>
                  <h2 className="text-2xl font-black mt-1 tracking-tight">POSSIBLE GAS LEAKAGE PREDICTED!</h2>
                  <p className="text-xs text-red-100 mt-0.5">
                    Model Confidence: <strong>{(result.confidence * 100).toFixed(1)}%</strong> | Estimated Risk Severity: <strong>{result.severity}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-red-800/80 px-4 py-2 rounded-xl border border-red-400 text-center">
                  <Volume2 className="w-5 h-5 mx-auto text-amber-300 animate-bounce" />
                  <span className="text-[10px] font-bold text-red-100 uppercase">Alarm Active</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-xl border-2 border-emerald-700 flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-white text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    SAFE STATUS
                  </span>
                  <span className="text-xs text-emerald-100 font-mono">Mode: {result.mode}</span>
                </div>
                <h2 className="text-2xl font-black mt-1 tracking-tight">NO LEAKAGE INDICATORS DETECTED</h2>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Model Confidence: <strong>{(result.confidence * 100).toFixed(1)}%</strong> | Storage Cabinet Nominally Secure
                </p>
              </div>
            </div>
          )}

          {/* Side-by-Side Image Comparison Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Side-by-Side Visual Evaluation</span>
              </h3>
              
              {result.visualization_image_path && (
                <button
                  onClick={() => setShowOverlay(!showOverlay)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-300 transition"
                >
                  {showOverlay ? 'Hide Simulated Plume Overlay' : 'Show Simulated Plume Overlay'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original Cabinet Image */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Original Uploaded RGB Image</span>
                </p>
                <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center min-h-[300px]">
                  <img
                    src={result.original_image_path}
                    alt="Original Cabinet"
                    className="max-h-96 w-full object-contain"
                  />
                </div>
              </div>

              {/* AI Visual Simulation Overlay */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>AI Grad-CAM & Simulated Gas Plume</span>
                </p>
                <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center min-h-[300px]">
                  <img
                    src={showOverlay && result.visualization_image_path ? result.visualization_image_path : result.original_image_path}
                    alt="Simulated Visualization"
                    className="max-h-96 w-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Scientific Disclaimer Note under visualizer */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-600 flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Explainability Notice:</strong> The visualization renders a semi-transparent multi-colored plume (blue-cyan-yellow-orange-red) based on Grad-CAM model attention maps. This indicates regions influencing prediction, not direct physical gas molecules.
              </div>
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
            <button
              onClick={handleReset}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow transition flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Analyse Another Cabinet</span>
            </button>

            {result.visualization_image_path && (
              <a
                href={result.visualization_image_path}
                download={`Cabinet_Gas_Simulation_${result.id}.jpg`}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-lg border border-slate-700 transition flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Result Artifact</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
