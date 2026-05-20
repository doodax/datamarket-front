import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, ShoppingCart, Wallet, Briefcase, FileText } from 'lucide-react';
import Logo from '../components/Logo';
import Timer from '../components/Timer';
import DataCard from '../components/DataCard';
import CompanyLogo from '../components/CompanyLogo';
import { api } from '../utils/api';
import { useConfig } from '../hooks/useConfig';
import { useSessionSocket } from '../hooks/useSessionSocket';

const STORAGE_KEY = 'group_session';

export default function GroupView() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { config, loading: cfgLoading } = useConfig();

  // État local du groupe (id, num) persisté entre rechargements
  const [groupInfo, setGroupInfo] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${code}`);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const { connected, sessionState, groups, timerRemaining, error: socketError } =
    useSessionSocket(code, 'group', groupInfo?.id);

  // Si pas encore identifié, montrer le formulaire de join
  if (!groupInfo) {
    return <GroupJoinForm code={code} onJoined={(g) => {
      localStorage.setItem(`${STORAGE_KEY}_${code}`, JSON.stringify({ id: g.id, group_number: g.group_number }));
      setGroupInfo({ id: g.id, group_number: g.group_number });
    }} sessionState={sessionState} groups={groups} navigate={navigate} />;
  }

  if (cfgLoading || !sessionState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-ink-300 text-sm font-mono">
          {socketError ? `Erreur : ${socketError}` : 'Chargement de la session...'}
        </div>
      </div>
    );
  }

  const myGroup = groups.find(g => g.id === groupInfo.id);
  if (!myGroup) {
    // Notre groupe a disparu de la liste — reset
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-terminal-amber mb-4">Session introuvable</div>
          <button onClick={() => {
            localStorage.removeItem(`${STORAGE_KEY}_${code}`);
            navigate('/');
          }} className="btn-primary">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // Rediriger vers résultats si la session est révélée
  if (sessionState.state === 'revealed') {
    return <GroupResultsLoader code={code} groupId={myGroup.id} navigate={navigate} />;
  }

  const mission = config.missionsConfig.missions[myGroup.mission_id];
  if (!mission) {
    return <div className="p-12 text-center text-terminal-red">Mission introuvable</div>;
  }

  return (
    <GroupGameView
      code={code}
      group={myGroup}
      mission={mission}
      config={config}
      sessionState={sessionState}
      timerRemaining={timerRemaining}
      connected={connected}
    />
  );
}

// ============================================================
// FORMULAIRE DE JOIN
// ============================================================
function GroupJoinForm({ code, onJoined, sessionState, groups, navigate }) {
  const [groupNumber, setGroupNumber] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Récupérer la session pour savoir combien de groupes max
  const [info, setInfo] = useState(null);
  useEffect(() => {
    api.getSession(code).then(setInfo).catch(err => setError(err.message));
  }, [code]);

  const maxGroups = info?.session?.num_groups || 4;
  const takenNumbers = new Set((info?.groups || []).map(g => g.group_number));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupNumber) return;
    setLoading(true);
    setError(null);
    try {
      const { group } = await api.joinSession(code, parseInt(groupNumber), label || null);
      onJoined(group);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ink-700/50 px-6 py-4 flex items-center justify-between">
        <Logo size="md" />
        <button onClick={() => navigate('/')} className="btn-ghost flex items-center gap-1.5">
          <ArrowLeft size={14} />
          Retour
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-6 animate-fade-in">
          <div className="text-center">
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-ink-300 mb-1">Session</div>
            <div className="font-mono text-3xl text-terminal-cyan font-bold">{code}</div>
            {info?.session?.label && (
              <div className="text-sm text-ink-300 mt-1">{info.session.label}</div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="panel-bordered p-6 space-y-4">
            <div className="section-header">Identification</div>

            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-ink-300 block mb-2">
                Quel groupe êtes-vous ?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: maxGroups }, (_, i) => i + 1).map(n => {
                  const taken = takenNumbers.has(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => !taken && setGroupNumber(n.toString())}
                      disabled={taken && groupNumber !== n.toString()}
                      className={`h-12 border font-mono text-lg transition-colors ${
                        groupNumber === n.toString()
                          ? 'bg-terminal-cyan text-ink-900 border-terminal-cyan'
                          : taken
                            ? 'bg-ink-800 border-ink-700 opacity-40 cursor-not-allowed'
                            : 'bg-ink-800 border-ink-600 hover:border-ink-400'
                      }`}
                    >
                      G{n}{taken && groupNumber !== n.toString() && <div className="text-[8px]">pris</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-ink-300 block mb-1.5">
                Nom de votre équipe (optionnel)
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex : Les Datavores"
                maxLength={30}
                className="input-terminal w-full"
              />
            </div>

            {error && (
              <div className="text-terminal-red text-xs flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={!groupNumber || loading} className="btn-primary w-full">
              {loading ? 'Connexion...' : 'Rejoindre'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

// ============================================================
// VUE DE JEU PRINCIPALE
// ============================================================
function GroupGameView({ code, group, mission, config, sessionState, timerRemaining, connected }) {
  const [localPurchases, setLocalPurchases] = useState(group.purchases);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [errorMsg, setErrorMsg] = useState(null);
  const [showMission, setShowMission] = useState(true);

  // Synchroniser avec le serveur
  useEffect(() => {
    setLocalPurchases(group.purchases);
  }, [group.purchases]);

  const categoriesMap = useMemo(() => {
    return Object.fromEntries((config.dataCatalog?.data_categories || []).map(c => [c.id, c]));
  }, [config]);

  const spending = useMemo(() => {
    return localPurchases.reduce((sum, id) => sum + (categoriesMap[id]?.price || 0), 0);
  }, [localPurchases, categoriesMap]);

  const budgetRemaining = mission.budget - spending;
  const locked = group.locked || sessionState.state === 'locked' || sessionState.state === 'revealed';
  const setupPhase = sessionState.state === 'setup';

  // Toggle achat
  const togglePurchase = async (categoryId) => {
    if (locked) return;
    const isSelected = localPurchases.includes(categoryId);
    let next;
    if (isSelected) {
      next = localPurchases.filter(p => p !== categoryId);
    } else {
      const category = categoriesMap[categoryId];
      if (!category) return;
      if (budgetRemaining < category.price) {
        setErrorMsg('Budget insuffisant');
        setTimeout(() => setErrorMsg(null), 3000);
        return;
      }
      next = [...localPurchases, categoryId];
    }
    setLocalPurchases(next);
    setSaveStatus('saving');
    try {
      await api.updatePurchases(group.id, next);
      setSaveStatus('saved');
    } catch (err) {
      setErrorMsg(err.message);
      setSaveStatus('error');
      // Revert
      setLocalPurchases(group.purchases);
    }
  };

  // Section ouverture/fermeture détails mission
  const sections = config.dataCatalog?.sections || [];
  const dataByCat = useMemo(() => {
    const result = {};
    sections.forEach(s => result[s.id] = []);
    (config.dataCatalog?.data_categories || []).forEach(c => {
      if (!result[c.section]) result[c.section] = [];
      result[c.section].push(c);
    });
    return result;
  }, [config, sections]);

  const showHints = sessionState.difficulty_mode === 'sector_hints';
  const showDescriptions = sessionState.difficulty_mode === 'descriptions';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Bandeau entreprise */}
      <header
        className="border-b-4 px-6 py-4"
        style={{
          borderColor: mission.color_palette.primary,
          background: `linear-gradient(135deg, ${mission.color_palette.primary}15 0%, transparent 70%)`
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <CompanyLogo logoStyle={mission.logo_style} color={mission.color_palette.primary} size={48} />
            <div>
              <h1 className="font-display text-2xl text-ink-100">{mission.company_name}</h1>
              <div className="text-xs text-ink-300">{mission.sector}</div>
            </div>
            <div className="hidden md:block pl-4 border-l border-ink-600">
              <div className="text-[10px] font-mono uppercase tracking-wider text-ink-300">Groupe</div>
              <div className="font-mono text-lg text-terminal-cyan">
                G{group.group_number} · {group.group_label || `Équipe ${group.group_number}`}
              </div>
            </div>
          </div>
          <Timer
            secondsRemaining={timerRemaining}
            totalSeconds={sessionState.timer_duration_seconds}
            state={sessionState.state}
          />
        </div>
      </header>

      <main className="flex-1 px-6 py-6 max-w-7xl w-full mx-auto">
        {/* Mission brief */}
        {showMission && (
          <div className="panel-bordered p-5 mb-6 relative animate-slide-up">
            <button
              onClick={() => setShowMission(false)}
              className="absolute top-3 right-3 text-ink-400 hover:text-ink-100 text-xs"
            >
              Masquer
            </button>
            <div className="section-header mb-3">Votre mission</div>
            <p className="text-ink-100 text-sm leading-relaxed mb-3">{mission.brief}</p>

            {mission.internal_note && (
              <div className="mt-4 border-l-2 border-terminal-red bg-terminal-red/5 px-4 py-3 relative">
                <div className="text-[9px] font-mono uppercase tracking-[0.3em] text-terminal-red mb-1">
                  ⚠ Note interne — confidentiel
                </div>
                <p className="text-xs text-ink-100 italic">{mission.internal_note}</p>
              </div>
            )}
          </div>
        )}
        {!showMission && (
          <button onClick={() => setShowMission(true)} className="btn-ghost flex items-center gap-1.5 mb-4">
            <FileText size={14} />
            Afficher la mission
          </button>
        )}

        {/* Phase setup */}
        {setupPhase && (
          <div className="bg-terminal-amber/10 border border-terminal-amber/30 px-4 py-3 mb-4 text-sm text-terminal-amber flex items-center gap-2">
            <div className="w-2 h-2 bg-terminal-amber rounded-full animate-pulse" />
            En attente du démarrage par l'administrateur·rice...
          </div>
        )}

        {locked && (
          <div className="bg-ink-800 border border-ink-500 px-4 py-3 mb-4 text-sm flex items-center gap-2">
            <AlertTriangle size={16} className="text-terminal-amber" />
            Session verrouillée. Vous ne pouvez plus modifier vos achats.
          </div>
        )}

        {/* Header budget */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <StatPanel icon={<Wallet size={16} />} label="Budget restant" value={`${budgetRemaining} CHF`}
            color={budgetRemaining < 100 ? 'text-terminal-amber' : 'text-terminal-cyan'} />
          <StatPanel icon={<ShoppingCart size={16} />} label="Catégories achetées" value={localPurchases.length} />
          <StatPanel icon={<Briefcase size={16} />} label="Investi" value={`${spending} CHF`} />
        </div>

        {errorMsg && (
          <div className="bg-terminal-red/10 border border-terminal-red/30 text-terminal-red px-4 py-3 mb-4 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Catalogue */}
        <div className="space-y-6">
          {sections.map(section => (
            <div key={section.id}>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-ink-700">
                <div className="w-1 h-4" style={{ background: section.color }} />
                <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-ink-100">{section.label}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {(dataByCat[section.id] || []).map(category => {
                  const selected = localPurchases.includes(category.id);
                  const canAfford = budgetRemaining >= category.price || selected;
                  const relevance = showHints ? mission.sector_relevance?.[category.id] : null;
                  return (
                    <DataCard
                      key={category.id}
                      category={category}
                      selected={selected}
                      disabled={!canAfford || locked}
                      relevance={relevance}
                      showDescription={showDescriptions}
                      onClick={() => togglePurchase(category.id)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer status */}
        <div className="mt-8 pt-4 border-t border-ink-700/50 flex items-center justify-between text-xs">
          <div className="text-ink-400 font-mono">
            All data sourced legally from third-party partners. Compliance: see terms.
          </div>
          <div className="flex items-center gap-3">
            {saveStatus === 'saving' && <span className="text-ink-300">Sauvegarde...</span>}
            {saveStatus === 'saved' && <span className="text-terminal-green">✓ Sauvegardé</span>}
            <span className={`tag-live ${connected ? '' : 'opacity-50'}`}>{connected ? 'connecté' : 'reconnexion'}</span>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatPanel({ icon, label, value, color = 'text-ink-100' }) {
  return (
    <div className="panel-bordered p-3 flex items-center gap-3">
      <div className="text-ink-300">{icon}</div>
      <div className="flex-1">
        <div className="text-[10px] font-mono uppercase tracking-wider text-ink-300">{label}</div>
        <div className={`text-xl font-mono font-bold ${color}`}>{value}</div>
      </div>
    </div>
  );
}

// ============================================================
// LOADER POUR LES RÉSULTATS GROUPE
// ============================================================
function GroupResultsLoader({ code, groupId, navigate }) {
  useEffect(() => {
    navigate(`/group/${code}/results`);
  }, [code, navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center text-ink-300 text-sm">
      Redirection vers les résultats...
    </div>
  );
}
