import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post<{ access_token: string }>('/api/auth/login', { email, password });
      await login(res.data.access_token);
      navigate('/');
    } catch (err: any) {
      if (!err.response) {
        setError('Cannot connect to backend server. Please start the backend server (uvicorn app.main:app) on port 8000.');
      } else {
        setError(err.response?.data?.detail || 'Failed to sign in. Please verify your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('admin@lab.com');
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex bg-red-600 p-3 rounded-2xl shadow-xl mb-4">
          <ShieldAlert className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white uppercase">ChemCabinet AI</h2>
        <p className="mt-1 text-xs text-slate-400">Smart Chemical Storage Cabinet Gas Exfiltration Monitoring</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-4 bg-red-950/80 border border-red-600 text-red-300 px-4 py-3 rounded-lg text-xs leading-relaxed">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-850 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="safety.officer@lab.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-850 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs py-2 rounded-lg font-medium border border-slate-700 flex items-center justify-center space-x-2 transition mb-4"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fill Admin Demo Credentials (admin@lab.com)</span>
            </button>

            <p className="text-center text-xs text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-blue-400 hover:text-blue-300 underline">
                Register new account
              </Link>
            </p>
          </div>
        </div>

        {/* Scientific limitation note */}
        <p className="mt-6 text-center text-[11px] text-slate-500 max-w-sm mx-auto">
          Software Simulation Project. RGB images cannot measure physical gas concentration. Built with React, FastAPI, & PyTorch MobileNetV2.
        </p>
      </div>
    </div>
  );
};
