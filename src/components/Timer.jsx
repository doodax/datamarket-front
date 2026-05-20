import { useMemo } from 'react';

function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function Timer({ secondsRemaining, totalSeconds, state }) {
  const display = formatTime(secondsRemaining);
  const isUrgent = secondsRemaining !== null && secondsRemaining <= 30 && secondsRemaining > 0;
  const isCritical = secondsRemaining !== null && secondsRemaining <= 10 && secondsRemaining > 0;
  const isExpired = secondsRemaining === 0;

  const progress = useMemo(() => {
    if (!totalSeconds || secondsRemaining === null) return 0;
    return ((totalSeconds - secondsRemaining) / totalSeconds) * 100;
  }, [secondsRemaining, totalSeconds]);

  const stateLabel = {
    setup: 'EN ATTENTE',
    running: 'EN COURS',
    locked: 'VERROUILLÉ',
    revealed: 'RÉSULTATS'
  }[state] || '';

  const color = isCritical ? 'text-terminal-red'
    : isUrgent ? 'text-terminal-amber'
    : 'text-terminal-cyan';

  return (
    <div className="flex flex-col items-end">
      <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-ink-300 mb-1">
        {stateLabel}
      </div>
      <div
        className={`font-mono text-3xl font-bold tabular-nums ${color} ${isCritical ? 'animate-pulse' : ''}`}
        style={{
          textShadow: isCritical ? '0 0 20px currentColor' : isUrgent ? '0 0 10px currentColor' : 'none'
        }}
      >
        {display}
      </div>
      {state === 'running' && (
        <div className="w-32 h-0.5 bg-ink-700 mt-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${isCritical ? 'bg-terminal-red' : isUrgent ? 'bg-terminal-amber' : 'bg-terminal-cyan'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
