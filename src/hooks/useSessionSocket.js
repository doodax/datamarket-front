// Hook React pour la connexion Socket.IO à une session.
// Gère la reconnexion, l'écoute des événements et l'état de session.

import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getApiUrl } from '../utils/api';

export function useSessionSocket(sessionCode, role, groupId = null) {
  const [connected, setConnected] = useState(false);
  const [sessionState, setSessionState] = useState(null);
  const [groups, setGroups] = useState([]);
  const [timerRemaining, setTimerRemaining] = useState(null);
  const [reports, setReports] = useState(null);
  const [synthesis, setSynthesis] = useState(null);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const eventListenersRef = useRef({});

  // Permet aux composants d'écouter des événements personnalisés
  const on = useCallback((event, handler) => {
    if (!eventListenersRef.current[event]) eventListenersRef.current[event] = [];
    eventListenersRef.current[event].push(handler);
    return () => {
      eventListenersRef.current[event] = eventListenersRef.current[event].filter(h => h !== handler);
    };
  }, []);

  const emit = useCallback((event, payload) => {
    if (Array.isArray(eventListenersRef.current[event])) {
      eventListenersRef.current[event].forEach(h => h(payload));
    }
  }, []);

  useEffect(() => {
    if (!sessionCode) return;

    const socket = io(getApiUrl(), {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setError(null);
      socket.emit('join_session', { code: sessionCode, role, group_id: groupId });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('connect_error', (err) => {
      setError(`Connexion impossible : ${err.message}`);
    });

    socket.on('session_state', (data) => {
      setSessionState(data.session);
      setGroups(data.groups);
      if (typeof data.timer_remaining === 'number') {
        setTimerRemaining(data.timer_remaining);
      }
      emit('session_state', data);
    });

    socket.on('timer_started', (data) => {
      setTimerRemaining(data.duration);
      emit('timer_started', data);
    });

    socket.on('purchases_changed', (data) => {
      setGroups(prev => prev.map(g =>
        g.id === data.group_id
          ? { ...g, purchases: data.purchases, budget_remaining: data.budget_remaining }
          : g
      ));
      emit('purchases_changed', data);
    });

    socket.on('session_locked', () => {
      setSessionState(s => s ? { ...s, state: 'locked' } : s);
      emit('session_locked');
    });

    socket.on('session_revealed', (data) => {
      setReports(data.reports);
      setSynthesis(data.synthesis);
      setSessionState(s => s ? { ...s, state: 'revealed' } : s);
      emit('session_revealed', data);
    });

    socket.on('mission_changed', (data) => emit('mission_changed', data));

    socket.on('error', (data) => setError(data.message));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionCode, role, groupId, emit]);

  // Décompte côté client (sans attendre les pings serveur)
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
