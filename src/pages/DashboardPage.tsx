import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileImage, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Volume2, 
  Cpu, 
  Upload, 
  ArrowRight,
  Eye,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell 
} from 'recharts';

import api from '../services/api';
import type { DashboardStats, DetectionRecord } from '../types';
import { StatCard } from '../components/StatCard';
import { getDemoStats, getDemoHistory } from '../services/demoFallback';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentScans, setRecentScans] = useState<DetectionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, historyRes] = await Promise.all([
        api.get<DashboardStats>('/api/dashboard/stats'),
        api.get<DetectionRecord[]>('/api/detections?sort=newest')
      ]);

      if (
        statsRes.data &&
        typeof statsRes.data === 'object' &&
        Array.isArray(historyRes.data)
      ) {
        setStats(statsRes.data);
        setRecentScans(historyRes.data.slice(0, 5));
      } else {
        throw new Error('Non-JSON response received from backend');
      }
    } catch (err) {
      // Fallback to demo stats for Vercel deployment
      const dStats = getDemoStats();
      const dHistory = getDemoHistory();
      setStats(dStats);
      setRecentScans(Array.isArray(dHistory) ? dHistory.slice(0, 5) : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading Industrial Safety Console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header & Quick Action Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Chemical Cabinet Gas Exfiltration Overview</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status tracking and machine learning visual simulation alerts.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/detect"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2.5 rounded-lg shadow-sm flex items-center space-x-2 transition"
          >
            <Upload className="w-4 h-4" />
            <span>Analyse Cabinet Image</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Analysed"
          value={stats?.total_images || 0}
          subtitle="Cabinet RGB Scans"
          icon={FileImage}
          color="blue"
          badgeText="Active DB Records"
        />

        <StatCard
          title="Leakage Alerts"
          value={stats?.leakage_predictions || 0}
          subtitle="Simulated Risk Warnings"
          icon={ShieldAlert}
          color="red"
          badgeText="Action Recommended"
        />

        <StatCard
          title="Safe Cabinets"
          value={stats?.safe_predictions || 0}
          subtitle="Normal Indications"
          icon={ShieldCheck}
          color="green"
          badgeText="Nominal Status"
        />

        <StatCard
          title="Latest Detection"
          value={stats?.latest_detection ? stats.latest_detection.prediction.toUpperCase() : 'N/A'}
          subtitle={stats?.latest_detection ? new Date(stats.latest_detection.timestamp).toLocaleTimeString() : 'No scans yet'}
          icon={Clock}
          color={stats?.latest_detection?.prediction === 'leakage' ? 'red' : 'indigo'}
          badgeText={stats?.latest_detection ? `Conf: ${(stats.latest_detection.confidence * 100).toFixed(1)}%` : 'Ready'}
        />

        <StatCard
          title="Alarm Status"
          value={stats?.alarm_status?.toUpperCase() || 'SILENT'}
          subtitle="Browser Alert Engine"
          icon={Volume2}
          color={stats?.alarm_status === 'active' ? 'amber' : 'purple'}
          badgeText={stats?.alarm_status === 'active' ? 'Alert Active' : 'Standby Mode'}
        />

        <StatCard
          title="ML Engine Status"
          value={stats?.model_status === 'trained_model' ? 'TRAINED' : 'DEMO'}
          subtitle="MobileNetV2 Model"
          icon={Cpu}
          color="purple"
          badgeText={stats?.model_status === 'trained_model' ? 'Custom Weights' : 'Simulation Engine'}
        />
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart: Detections Over Time */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Cabinet Scans & Detection Timeline</h3>
              <p className="text-xs text-slate-500">Daily frequency of safe status vs leakage predictions</p>
            </div>
            <span className="text-[11px] bg-slate-100 text-slate-600 font-mono px-2 py-1 rounded">Last 7 Days</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.detections_over_time || []} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="total" name="Total Scans" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="leakage" name="Leakage Alerts" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="safe" name="Safe Status" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Safe vs Leakage Comparison */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">Prediction Distribution</h3>
            <p className="text-xs text-slate-500">Aggregate count comparison</p>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.prediction_breakdown || []} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="value" name="Scans" radius={[6, 6, 0, 0]}>
                  {(stats?.prediction_breakdown || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Detections Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Recent Cabinet Scan Log</h3>
            <p className="text-xs text-slate-500">Most recent chemical storage cabinet image evaluations</p>
          </div>
          <Link to="/history" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1">
            <span>View Full History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentScans.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No image analysis records found in database. Click <strong>Analyse Cabinet Image</strong> to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Scan ID</th>
                  <th className="px-5 py-3">Preview</th>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Prediction</th>
                  <th className="px-5 py-3">Confidence</th>
                  <th className="px-5 py-3">Mode</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {(Array.isArray(recentScans) ? recentScans : []).map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 font-mono text-slate-900 font-bold">#{record.id}</td>
                    <td className="px-5 py-3.5">
                      <img
                        src={record.original_image_path}
                        alt="Cabinet preview"
                        className="w-10 h-10 object-cover rounded border border-slate-200 shadow-sm"
                      />
                    </td>
                    <td className="px-5 py-3.5">{new Date(record.timestamp).toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      {record.prediction === 'leakage' ? (
                        <span className="inline-flex items-center space-x-1 bg-red-100 text-red-700 font-bold px-2.5 py-1 rounded-full border border-red-300">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          <span>Leakage Alert</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-300">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Safe Status</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-semibold">{(record.confidence * 100).toFixed(1)}%</td>
                    <td className="px-5 py-3.5">
                      <span className="bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded text-[10px]">
                        {record.mode}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/history/${record.id}`}
                        className="text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
