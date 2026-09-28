import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('coalgov_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('coalgov_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then((res) => { setUser(res.data.data); localStorage.setItem('coalgov_user', JSON.stringify(res.data.data)); })
      .catch(() => { localStorage.removeItem('coalgov_token'); localStorage.removeItem('coalgov_user'); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('coalgov_token', res.data.token);
    localStorage.setItem('coalgov_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }

  function logout() {
    localStorage.removeItem('coalgov_token');
    localStorage.removeItem('coalgov_user');
    setUser(null);
  }

  function updateUser(patch) {
    setUser((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem('coalgov_user', JSON.stringify(next));
      return next;
    });
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
