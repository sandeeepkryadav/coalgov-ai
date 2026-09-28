import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useMineOptions } from '../../hooks/useLookups';
import { Button, Input, Select, Card } from '../../components/UI';
import { DASHBOARD_PATH_BY_ROLE } from '../../config/nav';

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useAuth();
  const mineOptions = useMineOptions();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'worker', mine_id: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', { ...form, mine_id: form.mine_id ? Number(form.mine_id) : null });
      const user = await login(form.email, form.password);
      toast.success('Account created successfully.');
      navigate(DASHBOARD_PATH_BY_ROLE[user.role] || '/');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-md" title="Create an operational account">
        <p className="text-xs text-slate-500 -mt-2 mb-4">Self-registration is available for field-level roles. Admin and leadership accounts are provisioned by your Super Admin.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Input label="Password" type="password" required minLength={6} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          <Select label="Role" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            options={[
              { value: 'worker', label: 'Worker' }, { value: 'contractor', label: 'Contractor' }, { value: 'field_inspector', label: 'Field Inspector' },
              { value: 'mine_manager', label: 'Mine Manager' }, { value: 'safety_officer', label: 'Safety Officer' }, { value: 'environmental_officer', label: 'Environmental Officer' }
            ]} />
          <Select label="Mine (if applicable)" value={form.mine_id} onChange={(e) => setForm((f) => ({ ...f, mine_id: e.target.value }))}
            options={[{ value: '', label: 'Select a mine' }, ...mineOptions]} />
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating account...' : 'Create Account'}</Button>
        </form>
        <p className="text-center text-xs text-slate-400 mt-4">Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link></p>
      </Card>
    </div>
  );
}
