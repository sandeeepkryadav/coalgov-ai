import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';
import { Button, Input } from '../../components/UI';
import { DASHBOARD_PATH_BY_ROLE } from '../../config/nav';

const DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'admin@coalgov.demo' },
  { label: 'Corporate / Leadership', email: 'leadership@coalgov.demo' },
  { label: 'Mine Manager', email: 'manager@coalgov.demo' },
  { label: 'Safety Officer', email: 'safety@coalgov.demo' },
  { label: 'Environmental Officer', email: 'environment@coalgov.demo' },
  { label: 'Field Inspector', email: 'inspector@coalgov.demo' },
  { label: 'Contractor', email: 'contractor@coalgov.demo' },
  { label: 'Worker', email: 'worker@coalgov.demo' },
  { label: 'Regulatory Authority', email: 'regulator@coalgov.demo' }
];

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Demo@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      const target = location.state?.from?.pathname || DASHBOARD_PATH_BY_ROLE[user.role] || '/';
      navigate(target, { replace: true });
      toast.success(`Welcome back, ${user.name.split(' ')[0]}.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex relative overflow-hidden text-white">

  {/* Background Image */}
  <img
    src="/images/login-coal-mine.jpg"
    alt="Coal Mine"
    className="absolute inset-0 w-full h-full object-cover"
  />

  {/* Dark Overlay */}
  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/95 via-navy-950/70 to-navy-900/40"></div>

  {/* Content */}
  <div className="relative z-10 flex flex-col justify-between p-10 w-full">

    <div>
      <div className="flex items-center gap-2 mb-10">
        <div className="bg-blue-600 rounded-lg p-2">
          <Shield size={20}/>
        </div>

        <span className="font-bold text-lg">CoalGov AI</span>
      </div>

      <h1 className="text-4xl font-bold leading-tight max-w-md">
        Smart Governance for India's Coal Mining Ecosystem
      </h1>

      <p className="mt-4 text-slate-200 max-w-md">
        AI-powered compliance, safety monitoring, inspections, environmental tracking and operational intelligence.
      </p>
    </div>

    <div className="space-y-4">
      {[
        "Real-time Mine Monitoring",
        "AI Risk Prediction Engine",
        "GIS-based Mine Tracking",
        "Digital Compliance & Reports"
      ].map((item) => (
        <div key={item} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            ✓
          </div>

          <span>{item}</span>
        </div>
      ))}
    </div>

  </div>
</div>

      <div className="flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-slate-800">Welcome to CoalGov AI</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">Sign in to access your dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email Address" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@coalgov.demo" />
            <div className="relative">
              <Input label="Password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-[30px] text-slate-400">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">Forgot Password?</Link>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-2">Quick demo login (password: Demo@123)</p>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button key={acc.email} type="button" onClick={() => { setEmail(acc.email); setPassword('Demo@123'); }}
                  className="text-left text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 truncate">
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Contact Admin</Link></p>
        </div>
        
      </div>
    </div>
  );
}
