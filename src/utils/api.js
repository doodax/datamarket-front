// Module API mis à jour pour la version PHP du back.
// v3 : ajout de reclaim() pour la reconnexion via code de transfert.

const DEFAULT_API_URL = 'https://www.doodax.ch/datamarket';

export function getApiUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const stored = localStorage.getItem('api_url');
  if (stored) return stored;
  return DEFAULT_API_URL;
}

export function setApiUrl(url) {
  localStorage.setItem('api_url', url);
}

export function getTeacherToken() {
  return localStorage.getItem('teacher_token');
}

export function setTeacherToken(token) {
  if (token) localStorage.setItem('teacher_token', token);
  else localStorage.removeItem('teacher_token');
}

export function isTeacherAuthenticated() {
  return !!getTeacherToken();
}

async function fetchJSON(path, options = {}) {
  const url = `${getApiUrl()}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  if (options.auth) {
    const token = getTeacherToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Erreur ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  health: () => fetchJSON('/api/health'),
  getConfig: () => fetchJSON('/api/config'),

  login: (password) => fetchJSON('/api/auth/login', {
    method: 'POST', body: JSON.stringify({ password })
  }),

  createSession: (data) => fetchJSON('/api/sessions', {
    method: 'POST', auth: true, body: JSON.stringify(data)
  }),
  listSessions: (archived = false) => fetchJSON(`/api/sessions/mine?archived=${archived}`, { auth: true }),
  getSession: (code) => fetchJSON(`/api/sessions/${code}`),

  joinSession: (code, group_number, group_label, claimed_group_id = null) => fetchJSON(`/api/sessions/${code}/join`, {
    method: 'POST',
    body: JSON.stringify({ group_number, group_label, claimed_group_id })
  }),

  // Reprendre un groupe existant sur un nouvel appareil via le code de transfert.
  reclaimGroup: (code, group_number, transfer_code) => fetchJSON(`/api/sessions/${code}/reclaim`, {
    method: 'POST',
    body: JSON.stringify({ group_number, transfer_code })
  }),

  startSession: (code) => fetchJSON(`/api/sessions/${code}/start`, { method: 'POST', auth: true }),
  lockSession: (code) => fetchJSON(`/api/sessions/${code}/lock`, { method: 'POST', auth: true }),
  revealSession: (code) => fetchJSON(`/api/sessions/${code}/reveal`, { method: 'POST', auth: true }),
  nextMission: (code) => fetchJSON(`/api/sessions/${code}/next-mission`, { method: 'POST', auth: true }),
  archiveSession: (code) => fetchJSON(`/api/sessions/${code}/archive`, { method: 'POST', auth: true }),
  exportSession: async (code) => {
    const res = await fetch(`${getApiUrl()}/api/sessions/${code}/export`, {
      headers: { 'Authorization': `Bearer ${getTeacherToken()}` }
    });
    if (!res.ok) throw new Error('Export failed');
    return res.blob();
  },
  extendSession: (code, seconds) => fetchJSON(`/api/sessions/${code}/extend`, {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ seconds }),
  }),

  updatePurchases: (groupId, purchases) => fetchJSON(`/api/groups/${groupId}/purchases`, {
    method: 'PUT', body: JSON.stringify({ purchases })
  }),
  updateLabel: (groupId, label) => fetchJSON(`/api/groups/${groupId}/label`, {
    method: 'PUT', body: JSON.stringify({ label })
  })
};
