import { useEffect, useState } from 'react';
import api from '../services/api';

export function useMineOptions() {
  const [options, setOptions] = useState([]);
  useEffect(() => {
    api.get('/mines', { params: { limit: 100 } })
      .then((res) => setOptions(res.data.data.map((m) => ({ value: m.id, label: m.name }))))
      .catch(() => {});
  }, []);
  return options;
}

export function useContractorOptions() {
  const [options, setOptions] = useState([]);
  useEffect(() => {
    api.get('/contractors', { params: { limit: 100 } })
      .then((res) => setOptions(res.data.data.map((c) => ({ value: c.id, label: c.name }))))
      .catch(() => {});
  }, []);
  return options;
}
