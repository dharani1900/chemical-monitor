import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  AlertTriangle, 
  ShieldCheck, 
  Download, 
  Trash2, 
  Cpu, 
  Clock, 
  FileText,
  Sliders,
  CheckCircle2,
  Sparkles,
  Info,
  Volume2,
  RefreshCw
} from 'lucide-react';

import api, { resolveImageUrl } from '../services/api';
import type { DetectionRecord } from '../types';

const LEAKAGE_DANGER_THRESHOLD = 0.525;

export const DetectionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<DetectionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);

  const navigate = useNavigate();

  const fetchRecord = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<DetectionRecord>(`/api/detections/${id}`);
      if (res.data && typeof res.data === 'object' && res.data.id) {
        setRecord(res.data);
      } else {
        throw new Error('Invalid record data received from server.');
      }
    } catch (err: any) {
      console.error('Failed to load record:', err);
      if (err.response?.status === 404) {
        setError(`Detection record #${id} was not found in the database.`);
      } else if (err.response?.status === 401) {
        setError('Your session has expired. Please sign in again.');
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Connection timed out. Please check that the backend server is running.');
      } else if (err.message?.includes('Network Error') || !err.response) {
        setError('Cannot reach backend server. Please verify network connectivity and that the API service is online.');
      } else {
        setError(err.response?.data?.detail || err.message || 'Detection record could not be loaded.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecord();
  }, [id]);

  const handleDelete = async () => {
    if (!record || !window.confirm(`Delete scan record #${record.id}?`)) return;
    try {
      await api.delete(`/api/detections/${record.id}`);
      navigate('/history');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete record. Please check server connection.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading Scan Details...</p>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-xl border border-red-200 shadow-sm text-center space-y-4">
        <div className="inline-flex p-3 rounded-full bg-red-100 text-red-600">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Unable to Display Scan</h2>
        <p className="text-xs text-slate-600 leading-relaxed">{error || 'Record not found.'}</p>
        <div className="pt-2 flex justify-center space-x-3">
          <button
            onClick={fetchRecord}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
          <Link
            to="/history"
            className="inline-flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-lg border border-slate-300 transition"
          >
            <span>Return to History</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Back button & Action Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/history"
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-lg transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Detection History</span>
        </Link>

        <button
          onClick={handleDelete}
          className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs px-3.5 py-2 rounded-lg border border-red-200 transition flex items-center space-x-1.5"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Record</span>
        </button>
      </div>

      {/* Primary Header Card */}
      {(() => {
        const isDanger = record.prediction === 'leakage' && record.confidence >= LEAKAGE_DANGER_THRESHOLD;
        return (
          <div
            className={`p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border-2 transition-all ${
              isDanger
                ? 'bg-red-600 border-red-700 animate-pulse-danger'
                : 'bg-emerald-600 border-emerald-700'
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
                    Confidence: {(record.confidence * 100).toFixed(1)}%
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

      {/* Safety Disclaimer Banner */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900 flex items-start space-x-3 shadow-sm">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="font-bold text-amber-950">Safety Disclaimer & Sensor Scope:</strong>
          <p>
            Standard optical RGB cameras cannot detect invisible or colorless gas plumes and cannot certify an area is gas-free. A <strong>SAFE</strong> status indicates exclusively that optical image features did not meet the 52.5% leakage confidence threshold. Always corroborate with calibrated chemical sensor hardware and follow standard plant safety protocols.
          </p>
        </div>
      </div>

      {/* Side-by-Side Visual Comparison Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Side-by-Side Visual Inspection</span>
          </h3>

          {record.visualization_image_path && (
            <button
              onClick={() => setShowOverlay(!showOverlay)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-300 transition"
            >
              {showOverlay ? 'Hide Visual Overlay' : 'Show Visual Overlay'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original RGB Image */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Original RGB Cabinet Image</span>
            </p>
            <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center min-h-[320px]">
              <img
                src={resolveImageUrl(record.original_image_path)}
                alt="Original Cabinet"
                className="max-h-96 w-full object-contain"
              />
            </div>
          </div>

          {/* AI Visual Simulation Overlay */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{record.prediction === 'leakage' && record.confidence >= LEAKAGE_DANGER_THRESHOLD ? 'AI Grad-CAM Simulated Plume' : 'Verified Safe Status Overlay'}</span>
            </p>
            <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center min-h-[320px]">
              <img
                src={resolveImageUrl(showOverlay && record.visualization_image_path ? record.visualization_image_path : record.original_image_path)}
                alt="Simulated Visualization"
                className="max-h-96 w-full object-contain"
              />
            </div>
          </div>
        </div>

        {record.visualization_image_path && (
          <div className="pt-2 flex justify-end">
            <a
              href={resolveImageUrl(record.visualization_image_path)}
              download={`Cabinet_Result_${record.id}.jpg`}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition shadow flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Visual Artifact</span>
            </a>
          </div>
        )}
      </div>

      {/* Metadata & Technical Parameters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <span>Model Metadata</span>
          </h4>
          <div className="space-y-2 text-xs text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Model Architecture:</span>
              <span className="font-bold">{record.model_version}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Inference Mode:</span>
              <span className="font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded">{record.mode}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Visualization Engine:</span>
              <span className="font-semibold">{record.visualization_type}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center space-x-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Scan Timestamp</span>
          </h4>
          <div className="space-y-2 text-xs text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Date Evaluated:</span>
              <span className="font-bold">{new Date(record.timestamp).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Exact Time:</span>
              <span className="font-bold">{new Date(record.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Alarm Status:</span>
              <span className={`font-bold ${record.alarm_recommended ? 'text-red-600' : 'text-emerald-600'}`}>
                {record.alarm_recommended ? 'Alarm Triggered' : 'Silent / Nominal'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center space-x-2">
            <FileText className="w-4 h-4 text-purple-600" />
            <span>Inspector Notes</span>
          </h4>
          <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[80px]">
            {record.notes || 'No custom inspector notes provided for this scan.'}
          </p>
        </div>
      </div>
    </div>
  );
};
