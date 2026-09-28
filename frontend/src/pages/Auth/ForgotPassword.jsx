import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Button, Input, Card } from '../../components/UI';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-sm" title="Reset your password">
        {message ? <p className="text-sm text-slate-600">{message}</p> : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email Address" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Instructions'}</Button>
          </form>
        )}
        <p className="text-center text-xs text-slate-400 mt-4"><Link to="/login" className="text-blue-600 hover:underline">Back to Login</Link></p>
      </Card>
    </div>
  );
}
