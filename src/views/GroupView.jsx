import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, ShoppingCart, Wallet, Briefcase, FileText, Clock, Copy, Check } from 'lucide-react';
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

  const [groupInfo, setGroupInfo] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${code}`);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const { connected, sessionState, groups, timerRemaining, error: socketError } =
      useSessionSocket(code, 'group', groupInfo?.id);

  if (!groupInfo) {
    return <GroupJoinForm code={code} onJoined={(g) => {
      localStorage.setItem(`${STORAGE_KEY}_${code}`, JSON.stringify({ id: g.id, group_number: g.group_number }));
      setGroupInfo({ id: g.id, group_number: g.group_number });
    }} navigate={navigate} />;
  }

  if (cfgLoading || !sessionState) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-ink-300 text-base font-mono">
            {socketError ? `Erreur : ${socketError}` : 'Chargement de la session...'}
          </div>
        </div>
    );
  }

  const myGroup = groups.find(g => g.id === groupInfo.id);
  if (!myGroup) {
    return (
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="text-center max-w-sm">
            <div className="text-terminal-amber mb-4">
              Votre groupe n'est plus enregistré côté serveur.
            </div>
            <div className="text-base text-ink-300 mb-4">
              Cela peut arriver si la session a été réinitialisée ou si vous étiez
              connecté à une session antérieure.
            </div>
            <button onClick={() => {
              localStorage.removeItem(`${STORAGE_KEY}_${code}`);
              window.location.reload();
            }} className="btn-primary">
              Recommencer
            </button>
          </div>
        </div>
    );
  }

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
function GroupJoinForm({ code, onJoined, navigate }) {
  const [groupNumber, setGroupNumber] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchInfo = () => {
      api.getSession(code)
          .then(data => {
            if (!cancelled) {
              setInfo(data);
              if (error && error.includes('Session')) setError(null);
            }
          })
          .catch(err => {
            if (!cancelled) setError(err.message);
          });
    };
    fetchInfo();
    const interval = setInterval(fetchInfo, 2000);
    return () => { cancelled = true; clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const maxGroups = info?.session?.num_groups || 4;
  const takenGroups = new Map((info?.groups || []).map(g => [g.group_number, g]));

  const storedGroupInfo = useMemo(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${code}`);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  }, [code]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupNumber) return;
    setLoading(true);
    setError(null);
    try {
      const claimedId = (storedGroupInfo && storedGroupInfo.group_number === parseInt(groupNumber))
          ? storedGroupInfo.id
          : null;
      const { group } = await api.joinSession(code, parseInt(groupNumber), label || null, claimedId);
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
              <div className="text-xs font-mono uppercase tracking-[0.3em] text-ink-300 mb-1">Session</div>
              <div className="font-mono text-3xl text-terminal-cyan font-bold">{code}</div>
              {info?.session?.label && (
                  <div className="text-base text-ink-300 mt-1">{info.session.label}</div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="panel-bordered p-6 space-y-4">
              <div className="section-header">Identification</div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-ink-300 block mb-2">
                  Quel groupe êtes-vous ?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: maxGroups }, (_, i) => i + 1).map(n => {
                    const takenGroup = takenGroups.get(n);
                    const taken = !!takenGroup;
                    const isOwnGroup = storedGroupInfo && takenGroup && storedGroupInfo.id === takenGroup.id;
                    const disabled = taken && !isOwnGroup;

                    return (
                        <button
                            key={n}
                            type="button"
                            onClick={() => !disabled && setGroupNumber(n.toString())}
                            disabled={disabled}
                            className={`h-14 border font-mono text-base transition-colors flex flex-col items-center justify-center ${
                                groupNumber === n.toString()
                                    ? 'bg-terminal-cyan text-ink-900 border-terminal-cyan'
                                    : disabled
                                        ? 'bg-ink-800 border-ink-700 opacity-40 cursor-not-allowed'
                                        : isOwnGroup
                                            ? 'bg-ink-700 border-terminal-amber text-terminal-amber hover:bg-ink-600'
                                            : 'bg-ink-800 border-ink-600 hover:border-ink-400'
                            }`}
                        >
                          <span className="font-bold">G{n}</span>
                          {taken && (
                              <span className="text-[9px] mt-0.5 leading-none truncate max-w-full px-1">
                          {isOwnGroup ? 'vous' : (takenGroup.group_label || 'pris')}
                        </span>
                          )}
                        </button>
                    );
                  })}
                </div>
                {storedGroupInfo && (
                    <div className="text-xs text-terminal-amber mt-2 font-mono leading-relaxed">
                      Vous avez déjà rejoint cette session en tant que G{storedGroupInfo.group_number}.
                      Cliquez sur ce bouton pour reprendre votre place.
                    </div>
                )}
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-ink-300 block mb-1.5">
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
                  <div className="text-terminal-red text-sm flex items-start gap-2">
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
// AFFICHAGE DU CODE DE RECONNEXION
// ============================================================
function ReconnectionCode({ code }) {
  const [copied, setCopied] = useState(false);

  if (!code) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
      <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-terminal-amber hover:text-amber-300 transition-colors group"
          title="Cliquer pour copier"
      >
      <span className="uppercase tracking-wider text-ink-400 group-hover:text-ink-300">
        Code reconnexion
      </span>
        <span className="font-bold tracking-[0.2em] text-base">{code}</span>
        {copied ? (
            <Check size={12} className="text-terminal-green" />
        ) : (
            <Copy size={12} className="opacity-60 group-hover:opacity-100" />
        )}
      </button>
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
  const setupPhase = sessionState.state === 'setup';
  const locked = group.locked || sessionState.state === 'locked' || sessionState.state === 'revealed';
  const catalogVisible = !setupPhase;

  const togglePurchase = async (categoryId) => {
    if (locked || setupPhase) return;
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
      setLocalPurchases(group.purchases);
    }
  };

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
                <div className="text-sm text-ink-300">{mission.sector}</div>
              </div>
              <div className="hidden md:block pl-4 border-l border-ink-600">
                <div className="text-xs font-mono uppercase tracking-wider text-ink-300">Groupe</div>
                <div className="font-mono text-lg text-terminal-cyan">
                  G{group.group_number} · {group.group_label || `Équipe ${group.group_number}`}
                </div>
                <ReconnectionCode code={group.transfer_code} />
              </div>
            </div>
            <Timer
                secondsRemaining={timerRemaining}
                totalSeconds={sessionState.timer_duration_seconds}
                state={sessionState.state}
            />
          </div>

          {/* Version mobile : code visible sous le header principal */}
          <div className="md:hidden max-w-7xl mx-auto mt-2 pt-2 border-t border-ink-700/40 flex items-center justify-between text-xs">
            <div className="font-mono text-terminal-cyan">
              G{group.group_number} · {group.group_label || `Équipe ${group.group_number}`}
            </div>
            <ReconnectionCode code={group.transfer_code} />
          </div>
        </header>

        <main className="flex-1 px-6 py-6 max-w-7xl w-full mx-auto">
          {showMission && (
              <div className="panel-bordered p-5 mb-6 relative animate-slide-up">
                {!setupPhase && (
                    <button
                        onClick={() => setShowMission(false)}
                        className="absolute top-3 right-3 text-ink-400 hover:text-ink-100 text-xs"
                    >
                      Masquer
                    </button>
                )}
                <div className="section-header mb-3">Votre mission</div>

                <div className="mb-4 border-l-2 border-terminal-cyan bg-terminal-cyan/5 px-4 py-2.5">
                  <p className="text-sm text-ink-100">
                <span className="font-mono uppercase tracking-wider text-xs text-terminal-cyan mr-2">
                  Rappel Dataflow™
                </span>
                    la valeur est dans le croisement. Une donnée seule ne vaut presque rien.
                  </p>
                </div>

                <p className="text-ink-100 text-base leading-relaxed mb-3">{mission.brief}</p>

                {mission.internal_note && (
                    <div className="mt-4 border-l-2 border-terminal-red bg-terminal-red/5 px-4 py-3 relative">
                      <div className="text-xs font-mono uppercase tracking-[0.3em] text-terminal-red mb-1">
                        ⚠ Note interne — confidentiel
                      </div>
                      <p className="text-sm text-ink-100 italic">{mission.internal_note}</p>
                    </div>
                )}
              </div>
          )}
          {!showMission && !setupPhase && (
              <button onClick={() => setShowMission(true)} className="btn-ghost flex items-center gap-1.5 mb-4">
                <FileText size={14} />
                Afficher la mission
              </button>
          )}

          {setupPhase && (
              <div className="panel-bordered p-12 text-center animate-fade-in my-6">
                <div className="inline-flex w-16 h-16 bg-ink-700 border border-terminal-amber items-center justify-center mb-6 animate-pulse">
                  <Clock size={32} className="text-terminal-amber" />
                </div>
                <div className="text-xs font-mono uppercase tracking-[0.3em] text-terminal-amber mb-3">
                  En attente
                </div>
                <h2 className="text-2xl font-display text-ink-100 mb-3">
                  Le marché des données ouvrira sous peu
                </h2>
                <p className="text-base text-ink-300 max-w-md mx-auto leading-relaxed">
                  Lisez attentivement votre mission ci-dessus.
                  Le catalogue des données disponibles s'ouvrira dès que l'administrateur·rice
                  aura démarré le compte à rebours.
                </p>

                <div className="mt-8 pt-6 border-t border-ink-700/40 max-w-2xl mx-auto text-left">
                  <div className="text-xs font-mono uppercase tracking-[0.3em] text-terminal-cyan mb-3 text-center">
                    ━━ Un mot de Dataflow™ ━━
                  </div>
                  <p className="text-base text-ink-200 leading-relaxed mb-3">
                    Vous êtes responsable acquisition pour votre marque. Dans quelques instants,
                    notre marketplace va ouvrir : 15 catégories de données, un budget, un compte à rebours.
                  </p>
                  <p className="text-base text-ink-200 leading-relaxed mb-3">
                    <span className="text-terminal-cyan">Un conseil de la maison :</span> nos meilleurs clients
                    ne sont pas ceux qui achètent le plus. Ce sont ceux qui achètent <em className="text-ink-100 not-italic font-semibold">les bonnes combinaisons</em>.
                    Une donnée isolée, c'est une ligne dans un tableau. Deux ou trois données qui se parlent,
                    c'est un profile. Plus le profile est précis, plus notre modèle marketing est rentable.
                  </p>
                  <p className="text-base text-ink-200 leading-relaxed mb-4">
                    Prenez le temps de réfléchir avant de cliquer. Demandez-vous, pour chaque achat :
                    <em className="text-ink-100 not-italic"> qu'est-ce que cette donnée raconte une fois mise à côté des autres ?</em>
                    {' '}Votre rapport de campagne, à la fin, vous dira si votre intuition était la bonne.
                  </p>
                  <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink-400 text-center mt-4">
                    Dataflow™ — Where data meets purpose.
                  </p>
                </div>

                <div className="mt-8 text-sm font-mono text-ink-400">
                  Budget alloué : <span className="text-terminal-cyan font-bold">{mission.budget} CHF</span>
                  {' · '}
                  Durée prévue : <span className="text-terminal-cyan font-bold">{Math.round(sessionState.timer_duration_seconds / 60)} min</span>
                </div>
                {group.transfer_code && (
                    <div className="mt-6 pt-6 border-t border-ink-700/40 text-sm">
                      <div className="text-ink-300 mb-1">
                        <span className="text-xs font-mono uppercase tracking-wider text-ink-400">Code de reconnexion</span>
                      </div>
                      <div className="text-3xl font-mono font-bold text-terminal-amber tracking-[0.3em]">
                        {group.transfer_code}
                      </div>
                      <div className="text-xs text-ink-400 mt-2 max-w-sm mx-auto">
                        Notez ce code. Il vous permettra de reprendre votre groupe
                        depuis un autre appareil en cas de problème.
                      </div>
                    </div>
                )}
              </div>
          )}

          {locked && !setupPhase && (
              <div className="bg-ink-800 border border-ink-500 px-4 py-3 mb-4 text-sm flex items-center gap-2">
                <AlertTriangle size={16} className="text-terminal-amber" />
                Session verrouillée. Vous ne pouvez plus modifier vos achats.
              </div>
          )}

          {catalogVisible && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                  <StatPanel icon={<Wallet size={18} />} label="Budget restant" value={`${budgetRemaining} CHF`}
                             color={budgetRemaining < 100 ? 'text-terminal-amber' : 'text-terminal-cyan'} />
                  <StatPanel icon={<ShoppingCart size={18} />} label="Catégories achetées" value={localPurchases.length} />
                  <StatPanel icon={<Briefcase size={18} />} label="Investi" value={`${spending} CHF`} />
                </div>

                {errorMsg && (
                    <div className="bg-terminal-red/10 border border-terminal-red/30 text-terminal-red px-4 py-3 mb-4 text-sm">
                      {errorMsg}
                    </div>
                )}

                <div className="space-y-6">
                  {sections.map(section => (
                      <div key={section.id}>
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-ink-700">
                          <div className="w-1 h-4" style={{ background: section.color }} />
                          <h2 className="text-base font-mono uppercase tracking-[0.2em] text-ink-100">{section.label}</h2>
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
              </>
          )}

          <div className="mt-8 pt-4 border-t border-ink-700/50 flex items-center justify-between text-sm">
            <div className="text-ink-400 font-mono text-xs">
              All data sourced legally from third-party partners. Compliance: see terms.
            </div>
            <div className="flex items-center gap-3">
              {saveStatus === 'saving' && <span className="text-ink-300 text-xs">Sauvegarde...</span>}
              {saveStatus === 'saved' && catalogVisible && <span className="text-terminal-green text-xs">✓ Sauvegardé</span>}
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
          <div className="text-xs font-mono uppercase tracking-wider text-ink-300">{label}</div>
          <div className={`text-2xl font-mono font-bold ${color}`}>{value}</div>
        </div>
      </div>
  );
}

function GroupResultsLoader({ code, groupId, navigate }) {
  const { sessionState } = useSessionSocket(code, 'group', groupId);

  useEffect(() => {
    if (!sessionState) return;
    if (sessionState.state === 'revealed') {
      navigate(`/group/${code}/results`);
    } else if (sessionState.state === 'setup' || sessionState.state === 'running') {
      // L'enseignant·e a lancé la mission suivante : on retourne à la vue de jeu
      navigate(`/group/${code}`, { replace: true });
    }
  }, [sessionState, code, navigate]);

  return (
      <div className="min-h-screen flex items-center justify-center text-ink-300 text-base">
        Redirection vers les résultats...
      </div>
  );
}