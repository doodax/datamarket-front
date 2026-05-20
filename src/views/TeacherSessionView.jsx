import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Lock, Eye, Copy, FileDown, AlertTriangle, ChevronRight, Trash2 } from 'lucide-react';
import Logo from '../components/Logo';
import Timer from '../components/Timer';
import CompanyLogo from '../components/CompanyLogo';
import { api, isTeacherAuthenticated } from '../utils/api';
import { useConfig } from '../hooks/useConfig';
import { useSessionSocket } from '../hooks/useSessionSocket';

export default function TeacherSessionView() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { config } = useConfig();

  useEffect(() => {
    if (!isTeacherAuthenticated()) navigate('/teacher/login');
  }, [navigate]);

  const { connected, sessionState, groups, timerRemaining, reports, synthesis, error } =
    useSessionSocket(code, 'teacher');
  const [actionError, setActionError] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const handleStart = async () => {
    try {
      await api.startSession(code);
    } catch (err) { setActionError(err.message); }
  };

  const handleLock = async () => {
    try {
      await api.lockSession(code);
      setConfirmAction(null);
    } catch (err) { setActionError(err.message); }
  };

  const handleReveal = async () => {
    try {
      await api.revealSession(code);
      // Naviguer vers la vue résultats
      navigate(`/teacher/session/${code}/results`);
    } catch (err) { setActionError(err.message); }
  };

  const handleNextMission = async () => {
    try {
      await api.nextMission(code);
    } catch (err) { setActionError(err.message); }
  };

  const handleExport = async () => {
    try {
      const blob = await api.exportSession(code);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${code}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { setActionError(err.message); }
  };

  const copyJoinUrl = () => {
    const url = `${window.location.origin}${window.location.pathname}#/?code=${code}`;
    navigator.clipboard.writeText(url);
  };

  if (!config || !sessionState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-ink-300 text-sm font-mono">
          {error ? `Erreur : ${error}` : 'Chargement de la session...'}
        </div>
      </div>
    );
  }

  const currentMissionId = sessionState.mode === 'shared_mission'
    ? sessionState.shared_mission_ids?.[sessionState.current_mission_index || 0]
    : null;
  const currentMission = currentMissionId ? config.missionsConfig.missions[currentMissionId] : null;
  const hasMoreMissions = sessionState.mode === 'shared_mission' && sessionState.shared_mission_ids &&
    (sessionState.current_mission_index || 0) + 1 < sessionState.shared_mission_ids.length;

  const connectedGroups = groups.filter(g => Date.now() - g.last_seen_at < 30000);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ink-700/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo size="md" />
          <div className="text-[10px] font-mono uppercase tracking-wider text-ink-300">
            Mode pilotage
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/teacher')} className="btn-ghost flex items-center gap-1.5">
            <ArrowLeft size={14} />
            Sessions
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-6 max-w-7xl w-full mx-auto">
        {/* Header session */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 justify-between mb-6">
          <div className="flex items-center gap-4 flex-1">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono text-3xl text-terminal-cyan font-bold tracking-wider">{code}</span>
                <button onClick={copyJoinUrl} className="btn-ghost" title="Copier URL pour groupes">
                  <Copy size={14} />
                </button>
              </div>
              {sessionState.label && <div className="text-ink-100">{sessionState.label}</div>}
            </div>
            {currentMission && (
              <div className="flex items-center gap-3 pl-4 border-l border-ink-600">
                <CompanyLogo logoStyle={currentMission.logo_style} color={currentMission.color_palette.primary} size={32} />
                <div>
                  <div className="font-display text-lg">{currentMission.company_name}</div>
                  <div className="text-xs text-ink-300">{currentMission.sector}</div>
                </div>
              </div>
            )}
          </div>
          <Timer
            secondsRemaining={timerRemaining}
            totalSeconds={sessionState.timer_duration_seconds}
            state={sessionState.state}
          />
        </div>

        {/* Actions */}
        <div className="panel-bordered p-4 mb-6 flex flex-wrap items-center gap-2">
          {sessionState.state === 'setup' && (
            <>
              <button
                onClick={handleStart}
                disabled={groups.length === 0}
                className="btn-primary flex items-center gap-2"
              >
                <Play size={16} />
                Démarrer le timer
              </button>
              <div className="text-xs text-ink-300">
                {groups.length} groupe{groups.length > 1 ? 's' : ''} connecté{groups.length > 1 ? 's' : ''}
              </div>
            </>
          )}
          {sessionState.state === 'running' && (
            <>
              <button onClick={() => setConfirmAction('lock')} className="btn-secondary flex items-center gap-2">
                <Lock size={16} />
                Forcer le verrouillage
              </button>
              <button onClick={handleReveal} className="btn-danger flex items-center gap-2">
                <Eye size={16} />
                Révéler maintenant
              </button>
            </>
          )}
          {sessionState.state === 'locked' && (
            <>
              <button onClick={handleReveal} className="btn-primary flex items-center gap-2">
                <Eye size={16} />
                Révéler les résultats
              </button>
              <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
                <FileDown size={16} />
                Exporter
              </button>
            </>
          )}
          {sessionState.state === 'revealed' && (
            <>
              <button
                onClick={() => navigate(`/teacher/session/${code}/results`)}
                className="btn-primary flex items-center gap-2"
              >
                <Eye size={16} />
                Voir les résultats
              </button>
              <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
                <FileDown size={16} />
                Exporter Markdown
              </button>
              {hasMoreMissions && (
                <button onClick={handleNextMission} className="btn-secondary flex items-center gap-2">
                  <ChevronRight size={16} />
                  Mission suivante
                </button>
              )}
            </>
          )}
          <div className="ml-auto tag-live">
            {connected ? 'live' : 'reconnexion...'}
          </div>
        </div>

        {actionError && (
          <div className="bg-terminal-red/10 border border-terminal-red/30 text-terminal-red px-4 py-3 mb-4 text-sm flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5" />
            {actionError}
            <button onClick={() => setActionError(null)} className="ml-auto text-xs">×</button>
          </div>
        )}

        {/* Confirm verrouillage */}
        {confirmAction === 'lock' && (
          <div className="bg-ink-800 border border-terminal-amber/50 p-4 mb-4 flex items-center gap-4">
            <AlertTriangle className="text-terminal-amber" size={20} />
            <div className="flex-1 text-sm">
              Verrouiller maintenant ? Les groupes ne pourront plus modifier leurs achats.
            </div>
            <button onClick={handleLock} className="btn-danger text-xs">Confirmer</button>
            <button onClick={() => setConfirmAction(null)} className="btn-ghost text-xs">Annuler</button>
          </div>
        )}

        {/* Groupes */}
        <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
          {groups.length === 0 ? (
            <div className="col-span-full panel-bordered p-12 text-center text-ink-300">
              <div className="text-sm mb-2">Aucun groupe connecté.</div>
              <div className="text-xs font-mono">Partagez le code : <span className="text-terminal-cyan">{code}</span></div>
            </div>
          ) : (
            groups.map(g => (
              <GroupCard key={g.id} group={g} mission={config.missionsConfig.missions[g.mission_id]} config={config} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function GroupCard({ group, mission, config }) {
  const isLive = Date.now() - group.last_seen_at < 30000;
  const purchasedTotal = group.purchases.length;
  const categoriesMap = Object.fromEntries(
    (config.dataCatalog?.data_categories || []).map(c => [c.id, c])
  );
  const spent = (mission?.budget || 500) - group.budget_remaining;
  const budgetPercent = (spent / (mission?.budget || 500)) * 100;

  return (
    <div className="panel-bordered p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="font-mono text-sm text-terminal-cyan">G{group.group_number}</div>
            <div className="text-base font-medium truncate">
              {group.group_label || `Groupe ${group.group_number}`}
            </div>
            {isLive ? <span className="tag-live">live</span> : <span className="chip-neutral">absent</span>}
            {group.locked && <span className="chip-warning">verrouillé</span>}
          </div>
          {mission && (
            <div className="text-xs text-ink-300">
              {mission.company_name} — {mission.sector}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-300 font-mono">Budget</span>
          <span className="font-mono">
            <span className="text-terminal-cyan">{spent}</span>
            <span className="text-ink-400"> / {mission?.budget || 500} CHF</span>
          </span>
        </div>
        <div className="h-1.5 bg-ink-700 overflow-hidden">
          <div
            className="h-full bg-terminal-cyan transition-all"
            style={{ width: `${budgetPercent}%` }}
          />
        </div>
      </div>

      <div className="text-xs text-ink-300 mb-2 font-mono">
        {purchasedTotal} catégorie{purchasedTotal > 1 ? 's' : ''} achetée{purchasedTotal > 1 ? 's' : ''}
      </div>

      <div className="flex flex-wrap gap-1">
        {group.purchases.length === 0 ? (
          <span className="text-xs text-ink-400 italic">Aucun achat pour le moment</span>
        ) : (
          group.purchases.map(pid => {
            const cat = categoriesMap[pid];
            if (!cat) return null;
            return (
              <span key={pid} className="text-[10px] px-1.5 py-0.5 bg-ink-700 text-ink-100 font-mono">
                {cat.name.slice(0, 30)}{cat.name.length > 30 ? '…' : ''}
              </span>
            );
          })
        )}
      </div>
    </div>
  );
}
