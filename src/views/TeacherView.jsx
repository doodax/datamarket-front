import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, LogOut, Copy, ExternalLink, Trash2, Archive, ChevronRight } from 'lucide-react';
import Logo from '../components/Logo';
import { api, setTeacherToken, isTeacherAuthenticated } from '../utils/api';
import { useConfig } from '../hooks/useConfig';

export default function TeacherView() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [archivedSessions, setArchivedSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isTeacherAuthenticated()) {
      navigate('/teacher/login');
      return;
    }
    loadSessions();
  }, [navigate]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const [active, archived] = await Promise.all([
        api.listSessions(false),
        api.listSessions(true)
      ]);
      setSessions(active.sessions);
      setArchivedSessions(archived.sessions);
    } catch (err) {
      if (err.status === 401) {
        setTeacherToken(null);
        navigate('/teacher/login');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setTeacherToken(null);
    navigate('/');
  };

  const handleArchive = async (code) => {
    if (!confirm('Archiver cette session ?')) return;
    try {
      await api.archiveSession(code);
      loadSessions();
    } catch (err) {
      setError(err.message);
    }
  };

  if (showCreate) {
    return <CreateSessionForm onClose={() => { setShowCreate(false); loadSessions(); }} navigate={navigate} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ink-700/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo size="md" />
          <div className="hidden md:block text-[10px] font-mono uppercase tracking-wider text-ink-300">
            Admin panel
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} className="btn-ghost flex items-center gap-1.5">
            <ArrowLeft size={14} />
            Accueil
          </button>
          <button onClick={handleLogout} className="btn-ghost flex items-center gap-1.5">
            <LogOut size={14} />
            Déconnexion
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 max-w-6xl w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display text-ink-100">Sessions actives</h1>
            <p className="text-sm text-ink-300 mt-1">
              Pilotez vos activités en classe en temps réel.
            </p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Nouvelle session
          </button>
        </div>

        {error && (
          <div className="bg-terminal-red/10 border border-terminal-red/30 text-terminal-red px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-ink-300 text-sm font-mono">
            Chargement...
          </div>
        ) : sessions.length === 0 ? (
          <div className="panel-bordered p-12 text-center">
            <div className="text-ink-300 text-sm mb-4">Aucune session active.</div>
            <button onClick={() => setShowCreate(true)} className="btn-primary inline-flex items-center gap-2">
              <Plus size={16} />
              Créer la première
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {sessions.map(s => (
              <SessionCard key={s.id} session={s} onArchive={handleArchive} navigate={navigate} />
            ))}
          </div>
        )}

        {archivedSessions.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="text-xs font-mono uppercase tracking-wider text-ink-300 hover:text-ink-100 mb-3 flex items-center gap-1.5"
            >
              <ChevronRight size={14} className={`transition-transform ${showArchived ? 'rotate-90' : ''}`} />
              Sessions archivées ({archivedSessions.length})
            </button>
            {showArchived && (
              <div className="grid gap-3 opacity-60">
                {archivedSessions.map(s => (
                  <SessionCard key={s.id} session={s} onArchive={null} navigate={navigate} archived />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function SessionCard({ session, onArchive, navigate, archived = false }) {
  const stateColors = {
    setup: 'chip-neutral',
    running: 'chip-success',
    locked: 'chip-warning',
    revealed: 'chip-danger'
  };
  const stateLabels = {
    setup: 'En attente',
    running: 'En cours',
    locked: 'Verrouillée',
    revealed: 'Révélée'
  };

  const copyJoinUrl = () => {
    const url = `${window.location.origin}${window.location.pathname}#/?code=${session.code}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="panel-bordered p-4 hover:border-ink-400 transition-colors group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-terminal-cyan text-lg font-bold">{session.code}</span>
            <span className={stateColors[session.state]}>{stateLabels[session.state]}</span>
          </div>
          {session.label && <div className="text-ink-100 text-sm">{session.label}</div>}
          <div className="text-[11px] font-mono text-ink-300 mt-1">
            {session.mode === 'shared_mission' ? 'Mission partagée' : 'Missions assignées'}
            {' · '}{session.difficulty_mode === 'blind' ? 'Aveugle' : session.difficulty_mode === 'sector_hints' ? 'Indices' : 'Descriptions'}
            {' · '}{Math.round(session.timer_duration_seconds / 60)} min
            {' · '}{new Date(session.created_at).toLocaleDateString('fr-CH')}
          </div>
        </div>
        <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          {!archived && (
            <>
              <button onClick={copyJoinUrl} className="btn-ghost" title="Copier URL pour groupes">
                <Copy size={14} />
              </button>
              <button onClick={() => navigate(`/teacher/session/${session.code}`)} className="btn-secondary text-xs">
                <ExternalLink size={14} className="mr-1.5 inline" />
                Piloter
              </button>
              {onArchive && (
                <button onClick={() => onArchive(session.code)} className="btn-ghost" title="Archiver">
                  <Archive size={14} />
                </button>
              )}
            </>
          )}
          {archived && (
            <button onClick={() => navigate(`/teacher/session/${session.code}`)} className="btn-ghost text-xs">
              Voir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FORMULAIRE DE CRÉATION
// ============================================================
function CreateSessionForm({ onClose }) {
  const { config, loading: cfgLoading } = useConfig();
  const navigate = useNavigate();
  const [label, setLabel] = useState('');
  const [mode, setMode] = useState('shared_mission');
  const [difficultyMode, setDifficultyMode] = useState('blind');
  const [timerMinutes, setTimerMinutes] = useState(10);
  const [selectedMissions, setSelectedMissions] = useState([]);
  const [numGroups, setNumGroups] = useState(4);
  const [groupMissions, setGroupMissions] = useState([
    { mission_id: 'babycloud', label: '' },
    { mission_id: 'betmax', label: '' },
    { mission_id: 'vitaplus', label: '' },
    { mission_id: 'quickcash', label: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const missions = config ? Object.values(config.missionsConfig?.missions || {}) : [];

  const toggleMission = (id) => {
    setSelectedMissions(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const updateGroupMission = (idx, field, value) => {
    const next = [...groupMissions];
    next[idx] = { ...next[idx], [field]: value };
    setGroupMissions(next);
  };

  const updateNumGroups = (n) => {
    setNumGroups(n);
    // Ajuster la liste des missions par groupe
    const current = [...groupMissions];
    if (n > current.length) {
      const defaultMissions = ['babycloud', 'betmax', 'vitaplus', 'quickcash', 'fitsmart', 'lovematch'];
      while (current.length < n) {
        current.push({ mission_id: defaultMissions[current.length] || 'babycloud', label: '' });
      }
    } else {
      current.length = n;
    }
    setGroupMissions(current);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (mode === 'shared_mission' && selectedMissions.length === 0) {
      setError('Sélectionner au moins une mission');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        label: label || null,
        mode,
        difficulty_mode: difficultyMode,
        timer_duration_seconds: timerMinutes * 60
      };
      if (mode === 'shared_mission') {
        payload.shared_mission_ids = selectedMissions;
        payload.num_groups = numGroups;
      } else {
        payload.group_missions = groupMissions.slice(0, numGroups);
      }
      const { session } = await api.createSession(payload);
      navigate(`/teacher/session/${session.code}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (cfgLoading) return <div className="p-12 text-center text-ink-300">Chargement...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ink-700/50 px-6 py-4 flex items-center justify-between">
        <Logo size="md" />
        <button onClick={onClose} className="btn-ghost flex items-center gap-1.5">
          <ArrowLeft size={14} />
          Annuler
        </button>
      </header>

      <main className="flex-1 px-6 py-8 max-w-3xl w-full mx-auto">
        <h1 className="text-2xl font-display text-ink-100 mb-6">Nouvelle session</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="panel-bordered p-5 space-y-4">
            <div className="section-header">Informations</div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-ink-300 block mb-1.5">
                Nom de la session (optionnel)
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex : 2M3 - lundi 15h"
                className="input-terminal w-full"
              />
            </div>
          </div>

          <div className="panel-bordered p-5 space-y-4">
            <div className="section-header">Mode de session</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <RadioCard
                checked={mode === 'shared_mission'} onChange={() => setMode('shared_mission')}
                title="Mission partagée" desc="Tous les groupes jouent la même mission. Idéal pour comparer les stratégies."
              />
              <RadioCard
                checked={mode === 'assigned_missions'} onChange={() => setMode('assigned_missions')}
                title="Missions assignées" desc="Chaque groupe a une mission différente. Pour voir la diversité des cas."
              />
            </div>
          </div>

          {mode === 'shared_mission' && (
            <div className="panel-bordered p-5 space-y-3">
              <div className="section-header">Mission(s) à jouer</div>
              <div className="text-xs text-ink-300 mb-2">
                Si plusieurs sélectionnées, les missions s'enchaîneront.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {missions.map(m => (
                  <button
                    key={m.id} type="button" onClick={() => toggleMission(m.id)}
                    className={`text-left p-3 border transition-colors ${
                      selectedMissions.includes(m.id)
                        ? 'bg-terminal-cyan/10 border-terminal-cyan'
                        : 'bg-ink-800/50 border-ink-600 hover:border-ink-400'
                    }`}
                  >
                    <div className="font-medium text-sm">{m.company_name}</div>
                    <div className="text-xs text-ink-300 mt-0.5">{m.sector}</div>
                    {m.difficulty === 'advanced' && (
                      <span className="chip-warning mt-2">Avancée</span>
                    )}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-ink-300 block mb-1.5 mt-3">
                  Nombre de groupes attendus
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6].map(n => (
                    <button key={n} type="button" onClick={() => setNumGroups(n)}
                      className={`w-12 h-10 border font-mono ${
                        numGroups === n ? 'bg-terminal-cyan text-ink-900 border-terminal-cyan' : 'bg-ink-800 border-ink-600'
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {mode === 'assigned_missions' && (
            <div className="panel-bordered p-5 space-y-3">
              <div className="section-header">Assignation des missions</div>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-ink-300 block mb-1.5">
                  Nombre de groupes
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6].map(n => (
                    <button key={n} type="button" onClick={() => updateNumGroups(n)}
                      className={`w-12 h-10 border font-mono ${
                        numGroups === n ? 'bg-terminal-cyan text-ink-900 border-terminal-cyan' : 'bg-ink-800 border-ink-600'
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                {groupMissions.slice(0, numGroups).map((gm, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <div className="font-mono text-sm text-ink-300 w-20">Groupe {i + 1}</div>
                    <select
                      value={gm.mission_id}
                      onChange={(e) => updateGroupMission(i, 'mission_id', e.target.value)}
                      className="input-terminal flex-1"
                    >
                      {missions.map(m => (
                        <option key={m.id} value={m.id}>{m.company_name} — {m.sector}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="panel-bordered p-5 space-y-4">
            <div className="section-header">Difficulté</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <RadioCard
                checked={difficultyMode === 'blind'} onChange={() => setDifficultyMode('blind')}
                title="Aveugle" desc="Aucun indice. Les élèves achètent à l'intuition."
              />
              <RadioCard
                checked={difficultyMode === 'sector_hints'} onChange={() => setDifficultyMode('sector_hints')}
                title="Indices secteur" desc="Étoiles de pertinence par donnée."
              />
              <RadioCard
                checked={difficultyMode === 'descriptions'} onChange={() => setDifficultyMode('descriptions')}
                title="Descriptions" desc="Description neutre du type de donnée."
              />
            </div>
          </div>

          <div className="panel-bordered p-5 space-y-2">
            <div className="section-header">Durée du timer</div>
            <div className="flex gap-2">
              {[5, 10, 15, 20].map(m => (
                <button key={m} type="button" onClick={() => setTimerMinutes(m)}
                  className={`px-4 h-10 border font-mono ${
                    timerMinutes === m ? 'bg-terminal-cyan text-ink-900 border-terminal-cyan' : 'bg-ink-800 border-ink-600'
                  }`}>
                  {m} min
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-terminal-red/10 border border-terminal-red/30 text-terminal-red px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Annuler
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Création...' : 'Créer la session'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function RadioCard({ checked, onChange, title, desc }) {
  return (
    <button type="button" onClick={onChange}
      className={`text-left p-3 border transition-colors ${
        checked ? 'bg-terminal-cyan/10 border-terminal-cyan' : 'bg-ink-800/50 border-ink-600 hover:border-ink-400'
      }`}>
      <div className="font-medium text-sm">{title}</div>
      <div className="text-xs text-ink-300 mt-1">{desc}</div>
    </button>
  );
}
