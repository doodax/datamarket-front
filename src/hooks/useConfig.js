import { useEffect, useState } from 'react';
import { api } from '../utils/api';

let cachedConfig = null;

export function useConfig() {
  const [config, setConfig] = useState(cachedConfig);
  const [loading, setLoading] = useState(!cachedConfig);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cachedConfig) return;
    api.getConfig()
      .then(data => {
        cachedConfig = data;
        setConfig(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { config, loading, error };
}

export function clearConfigCache() {
  cachedConfig = null;
}
