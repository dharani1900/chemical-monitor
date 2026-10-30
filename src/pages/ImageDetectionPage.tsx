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

import api, { resolveImageUrl } from '../services/api';
import type { DetectionRecord } from '../types';
import { useAlarm } from '../context/AlarmContext';

const LEAKAGE_DANGER_THRESHOLD = 0.525;

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

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const validExtensions = ['jpg', 'jpeg', 'png'];
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png'];

    if (!validExtensions.includes(fileExt) && !validMimes.includes(file.type)) {
      setError('Invalid file format. Only JPG, JPEG, and PNG images are allowed.');
      return;
    }

    if (file.size === 0) {
      setError('The selected file is empty (0 bytes). Please choose a valid image.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit. Please upload a smaller image.');
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
    if (!selectedFile || loading) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (notes) formData.append('notes', notes);

    try {
      // Send multipart form-data. api request interceptor ensures boundaries are preserved.
      const res = await api.post<DetectionRecord>('/api/detections/analyze', formData);

      if (res.data && typeof res.data === 'object' && res.data.id) {
        setResult(res.data);
        const isDanger = res.data.prediction === 'leakage' && res.data.confidence >= LEAKAGE_DANGER_THRESHOLD;
        if (isDanger) {
          triggerAlarm();
        }
      } else {
        throw new Error('Non-JSON or invalid analysis response received from server.');
      }
    } catch (err: any) {
      console.error('Image analysis request failed:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
      });

      let userMsg = 'Image analysis failed. Please try again.';

      if (err.response) {
        const status = err.response.status;
        const detail = err.response.data?.detail;

        if (status === 400) {
          userMsg = typeof detail === 'string' ? detail : 'Invalid image file or format. Please provide a valid JPG or PNG.';
        } else if (status === 401) {
          userMsg = 'Authentication session expired. Please sign in again.';
        } else if (status === 413) {
          userMsg = 'File size exceeds 10MB limit.';
        } else if (status === 422) {
          userMsg = 'Malformed upload payload. Missing file parameter.';
        } else if (status >= 500) {
          userMsg = typeof detail === 'string' ? `Server error: ${detail}` : 'Internal server error during model inference.';
        }
      } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error') || !err.response) {
        userMsg = 'Unable to connect to backend server at http://127.0.0.1:8000. Please verify the backend is running.';
      } else if (err.message) {
        userMsg = err.message;
      }

      setError(userMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
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
                  Images are processed using fine-tuned PyTorch MobileNetV2 features. If leakage is predicted, an explainable Grad-CAM gas plume simulation will be rendered.
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
        /* Results View */
        <div className="space-y-6">
          {/* Primary Result Card */}
          {(() => {
            const isDanger = result.prediction === 'leakage' && result.confidence >= LEAKAGE_DANGER_THRESHOLD;
            return (
              <div
                className={`p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border-2 transition-all ${
                  isDanger
                    ? 'bg-red-600 text-white border-red-700 animate-pulse-danger'
                    : 'bg-emerald-600 text-white border-emerald-700'
                }`}
              >
                <div className="flex items-center space-x-5">
                  <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm shrink-0">
                    {isDanger ? (
                      <AlertTriangle className="w-10 h-10 text-white" />
                    ) : (
                      <ShieldCheck className="w-10 h-10 text-white" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl font-black tracking-tight">
                        {isDanger ? 'DANGER' : 'SAFE'}
                      </span>
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide">
                        Confidence: {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm font-medium text-white/95 leading-relaxed pt-1">
                      {isDanger
                        ? 'Immediate visual confirmation and secondary chemical sensor inspection required. Evacuate or isolate cabinet area if necessary.'
                        : 'No optical features crossed the 52.5% danger threshold. Maintain routine scheduled inspection.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center md:self-center shrink-0">
                  <div
                    className={`px-4 py-2.5 rounded-xl border text-center font-bold text-xs uppercase tracking-wider flex items-center space-x-2 ${
                      isDanger
                        ? 'bg-red-800/90 border-red-400 text-red-100'
                        : 'bg-emerald-800/90 border-emerald-400 text-emerald-100'
                    }`}
                  >
                    <Volume2
                      className={`w-4 h-4 ${
                        isDanger ? 'text-amber-300 animate-bounce' : 'text-emerald-300'
                      }`}
                    />
                    <span>{isDanger ? 'Alarm Active' : 'Alarm Silent'}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Prominent Optical RGB Limitations Safety Disclaimer */}
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900 flex items-start space-x-3 shadow-sm">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="font-bold text-amber-950">Safety Disclaimer & Sensor Scope:</strong>
              <p>
                Standard optical RGB cameras cannot detect invisible or colorless gas plumes and cannot certify an area is gas-free. A <strong>SAFE</strong> status indicates exclusively that optical image features did not meet the 52.5% leakage confidence threshold. Always corroborate with calibrated chemical sensor hardware and follow standard plant safety protocols.
              </p>
            </div>
          </div>

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
                  {showOverlay ? 'Hide Visual Overlay' : 'Show Visual Overlay'}
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
                    src={resolveImageUrl(result.original_image_path)}
                    alt="Original Cabinet"
                    className="max-h-96 w-full object-contain"
                  />
                </div>
              </div>

              {/* AI Visual Simulation Overlay */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{result.prediction === 'leakage' && result.confidence >= LEAKAGE_DANGER_THRESHOLD ? 'AI Grad-CAM Simulated Plume' : 'Verified Safe Status Overlay'}</span>
                </p>
                <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center min-h-[300px]">
                  <img
                    src={resolveImageUrl(showOverlay && result.visualization_image_path ? result.visualization_image_path : result.original_image_path)}
                    alt="Simulated Visualization"
                    className="max-h-96 w-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Explainability Note under visualizer */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-600 flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Explainability Notice:</strong> Visual overlays reflect machine learning feature attribution maps (Grad-CAM), indicating spatial regions influencing model inference rather than physical gas concentration measurements.
              </div>
            </div>
          </div>

          {/* Secondary Section: Technical Diagnostics */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
              Technical Model Diagnostics & Metadata
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Inference Mode</span>
                <span className="font-mono font-bold text-slate-800">{result.mode}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Model Version</span>
                <span className="font-mono font-bold text-slate-800">{result.model_version}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Raw Model Class</span>
                <span className="font-mono font-bold text-slate-800">{result.prediction}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Estimated Severity</span>
                <span className="font-bold text-slate-800">{result.severity || 'None'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Scan Record ID</span>
                <span className="font-mono font-bold text-slate-800">#{result.id}</span>
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
                href={resolveImageUrl(result.visualization_image_path)}
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
