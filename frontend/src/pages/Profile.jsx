import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api, { getErrorMessage } from '../services/api';
import { Card, Input, Button } from '../components/UI';
import { ROLE_LABELS } from '../config/nav';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', form);
      updateUser(res.data.data);
      toast.success('Profile updated.');
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  }

  async function changePassword() {
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', pwForm);
      toast.success('Password changed successfully.');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setPwSaving(false); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-bold text-slate-800">Profile</h2>
      <Card title="Account Information">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold">
            {user?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{user?.name}</p>
            <p className="text-sm text-slate-500">{ROLE_LABELS[user?.role]} · {user?.email}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Full Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </div>
        <Button className="mt-4" onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
      </Card>

      <Card title="Change Password">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Current Password" type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))} />
          <Input label="New Password" type="password" value={pwForm.newPassword} onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))} />
        </div>
        <Button className="mt-4" variant="secondary" onClick={changePassword} disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword}>{pwSaving ? 'Updating...' : 'Update Password'}</Button>
      </Card>
    </div>
  );
}
