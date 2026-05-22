// Hook de polling HTTP — remplace useSessionSocket (Socket.IO) pour la version PHP du back.
// Interroge /api/sessions/:code/state toutes les 2 secondes et expose le même état
// que l'ancien hook (interface identique pour les composants).

import { useEffect, useRef, useState, useCallback } from 'react';
import { getApiUrl, getTeacherToken } from '../utils/api';

const POLL_INTERVAL = 2000; // ms

export function useSessionSocket(sessionCode, role, groupId = null) {
  const [connected, setConnected] = useState(false);
  const [sessionState, setSessionState] = useState(null);
  const [groups, setGroups] = useState([]);
  const [timerRemaining, setTimerRemaining] = useState(null);
  const [reports, setReports] = useState(null);
  const [synthesis, setSynthesis] = useState(null);
  const [error, setError] = useState(null);

  // Pour la rétrocompatibilité avec le code qui utilisait `on()`
  const eventListenersRef = useRef({});
  const lastStateRef = useRef(null);

  const on = useCallback((event, handler) => {
    if (!eventListenersRef.current[event]) eventListenersRef.current[event] = [];
    eventListenersRef.current[event].push(handler);
    return () => {
      eventListenersRef.current[event] = (eventListenersRef.current[event] || []).filter(h => h !== handler);
    };
  }, []);

  const emit = useCallback((event, payload) => {
    if (Array.isArray(eventListenersRef.current[event])) {
      eventListenersRef.current[event].forEach(h => h(payload));
    }
  }, []);

  // Polling
  useEffect(() => {
    if (!sessionCode) return;

    let cancelled = false;

    const fetchState = async () => {
      try {
        const params = new URLSearchParams();
        if (groupId) params.set('group_id', groupId);
        const qs = params.toString() ? `?${params.toString()}` : '';
        const url = `${getApiUrl()}/api/sessions/${sessionCode}/state${qs}`;

        const res = await fetch(url);
        if (!res.ok) {
          if (res.status === 404) throw new Error('Session introuvable');
          throw new Error(`Erreur ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;

        setConnected(true);
        setError(null);
        setSessionState(data.session);
        setGroups(data.groups || []);
        if (typeof data.timer_remaining === 'number') {
          setTimerRemaining(data.timer_remaining);
        }
        if (data.reports) {
          setReports(data.reports);
          setSynthesis(data.synthesis);
        }

        // Détection de transitions pour émettre les événements (rétrocompat)
        const prev = lastStateRef.current;
        if (prev) {
          if (prev.session?.state !== data.session.state) {
            if (data.session.state === 'locked') emit('session_locked');
            if (data.session.state === 'revealed') emit('session_revealed', { reports: data.reports, synthesis: data.synthesis });
          }
          if (prev.session?.current_mission_index !== data.session.current_mission_index) {
            emit('mission_changed', { mission_id: data.session.shared_mission_ids?.[data.session.current_mission_index], mission_index: data.session.current_mission_index });
          }
          if (prev.session?.state !== 'running' && data.session.state === 'running') {
            emit('timer_started', { duration: data.session.timer_duration_seconds, started_at: data.session.timer_started_at });
          }
        }
        emit('session_state', data);
        lastStateRef.current = data;
      } catch (err) {
        if (cancelled) return;
        setConnected(false);
        setError(err.message);
      }
    };

    // Premier appel immédiat puis polling régulier
    fetchState();
    const interval = setInterval(fetchState, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionCode, role, groupId, emit]);

  // Décompte côté client entre 2 pings serveur (pour fluidité visuelle)
  useEffect(() => {
    if (sessionState?.state !== 'running' || timerRemaining === null) return;
    const interval = setInterval(() => {
      setTimerRemaining(t => (t !== null && t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionState?.state, timerRemaining]);

  return {
    connected,
    sessionState,
    groups,
    timerRemaining,
    reports,
    synthesis,
    error,
    on
  };
}
