import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, UserCircle, AlertCircle, Settings, RefreshCw } from 'lucide-react';
import Logo from '../components/Logo';
import { api, isTeacherAuthenticated, getApiUrl, setApiUrl } from '../utils/api';

const STORAGE_KEY = 'group_session';

export default function HomeView() {
  const [mode, setMode] = useState('join'); // 'join' | 'reclaim'
  const [code, setCode] = useState('');
  const [groupNumber, setGroupNumber] = useState('');
  const [transferCode, setTransferCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(getApiUrl());
  const [healthStatus, setHealthStatus] = useState('checking');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) setCode(codeFromUrl.toUpperCase());
  }, [searchParams]);

  useEffect(() => {
    api.health()
      .then(() => setHealthStatus('ok'))
      .catch(() => setHealthStatus('error'));
  }, []);

  const handleJoin = async (e) => {
    e?.preventDefault();
    if (!code || code.length < 4) {
      setError('Code de session invalide');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.getSession(code.toUpperCase());
      navigate(`/group/${code.toUpperCase()}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReclaim = async (e) => {
    e?.preventDefault();
    if (!code || code.length < 4) {
      setError('Code de session invalide');
      return;
    }
    if (!groupNumber) {
      setError('Sélectionnez votre groupe');
      return;
    }
    if (!/^\d{4}$/.test(transferCode)) {
      setError('Code de reconnexion : 4 chiffres');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { group } = await api.reclaimGroup(code.toUpperCase(), parseInt(groupNumber), transferCode);
      // Stocker l'identité du groupe pour ce navigateur
      localStorage.setItem(
        `${STORAGE_KEY}_${code.toUpperCase()}`,
        JSON.stringify({ id: group.id, group_number: group.group_number })
      );
      navigate(`/group/${code.toUpperCase()}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiUrl = () => {
    setApiUrl(apiUrlInput);
    setShowSettings(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ink-700/50 px-6 py-4 flex items-center justify-between">
        <Logo size="md" />
        <div className="flex items-center gap-4">
          <div className={`tag-live ${healthStatus === 'ok' ? '' : 'opacity-50'}`}>
            {healthStatus === 'ok' ? 'live' : healthStatus === 'error' ? 'offline' : 'checking'}
          </div>
          <button onClick={() => setShowSettings(!showSettings)} className="btn-ghost">
            <Settings size={16} />
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="bg-ink-800 border-b border-ink-600 px-6 py-4 animate-slide-up">
          <div className="max-w-2xl mx-auto">
            <label className="text-xs font-mono uppercase tracking-wider text-ink-300 mb-2 block">
              URL du serveur (avancé)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiUrlInput}
                onChange={(e) => setApiUrlInput(e.target.value)}
                className="input-terminal flex-1 text-sm"
              />
              <button onClick={handleSaveApiUrl} className="btn-secondary text-xs">
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-10 animate-fade-in">

          {/* Slogan */}
          <div className="text-center space-y-3 animate-fade-in">
            <div className="text-[12px] font-mono uppercase tracking-[0.3em] text-terminal-cyan">
              Un jeu pour comprendre les enjeux du BigData
            </div>
            <h1 className="text-2xl font-display font-light text-ink-100 leading-tight">
              Acheter des données.<br />
              <span className="text-terminal-cyan">Connaître vos clients.</span>
            </h1>
            <p className="text-base text-ink-300">
              5 000+ sources de données vérifiées. Livraison immédiate.
            </p>
          </div>

          {/* Onglets join / reclaim */}
          <div className="flex gap-2 border-b border-ink-700">
            <button
              type="button"
              onClick={() => { setMode('join'); setError(null); }}
              className={`px-4 py-2 text-sm border-b-2 transition-colors -mb-px ${
                mode === 'join'
                  ? 'border-terminal-cyan text-ink-100'
                  : 'border-transparent text-ink-300 hover:text-ink-100'
              }`}
            >
              Nouvelle connexion
            </button>
            <button
              type="button"
              onClick={() => { setMode('reclaim'); setError(null); }}
              className={`px-4 py-2 text-sm border-b-2 transition-colors -mb-px flex items-center gap-1.5 ${
                mode === 'reclaim'
                  ? 'border-terminal-cyan text-ink-100'
                  : 'border-transparent text-ink-300 hover:text-ink-100'
              }`}
            >
              <RefreshCw size={13} />
              Reprendre un groupe
            </button>
          </div>

          {/* Form Join */}
          {mode === 'join' && (
            <form onSubmit={handleJoin} className="panel-bordered p-6 space-y-4 animate-fade-in">
              <div className="section-header">Accès groupe</div>
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-ink-300 block mb-1.5">
                  Code de session
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ABCD42"
                  maxLength={8}
                  className="input-terminal w-full text-2xl tracking-[0.4em] text-center uppercase"
                  autoFocus
                />
              </div>
              {error && (
                <div className="flex items-start gap-2 text-terminal-red text-sm">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={!code || loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <LogIn size={16} />
                {loading ? 'Connexion...' : 'Rejoindre la session'}
              </button>
            </form>
          )}

          {/* Form Reclaim */}
          {mode === 'reclaim' && (
            <form onSubmit={handleReclaim} className="panel-bordered p-6 space-y-4 animate-fade-in">
              <div className="section-header">Reprendre un groupe existant</div>
              <p className="text-sm text-ink-300 leading-relaxed">
                Si votre équipe a déjà commencé sur un autre appareil, saisissez
                le <span className="text-terminal-amber font-mono">code de reconnexion</span> à 4 chiffres
                qui était affiché dans votre interface (ou demandez-le à
                l'administrateur·rice).
              </p>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-ink-300 block mb-1.5">
                  Code de session
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ABCD42"
                  maxLength={8}
                  className="input-terminal w-full text-lg tracking-[0.3em] text-center uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-ink-300 block mb-1.5">
                  Votre numéro de groupe
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setGroupNumber(n.toString())}
                      className={`h-11 border font-mono text-base transition-colors ${
                        groupNumber === n.toString()
                          ? 'bg-terminal-cyan text-ink-900 border-terminal-cyan'
                          : 'bg-ink-800 border-ink-600 hover:border-ink-400'
                      }`}
                    >
                      G{n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-ink-300 block mb-1.5">
                  Code de reconnexion (4 chiffres)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{4}"
                  value={transferCode}
                  onChange={(e) => setTransferCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="0000"
                  maxLength={4}
                  className="input-terminal w-full text-2xl tracking-[0.5em] text-center font-mono"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 text-terminal-red text-sm">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!code || !groupNumber || transferCode.length !== 4 || loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                {loading ? 'Reconnexion...' : 'Reprendre la session'}
              </button>
            </form>
          )}

          {/* Lien enseignant */}
          <div className="text-center">
            <button
              onClick={() => navigate(isTeacherAuthenticated() ? '/teacher' : '/teacher/login')}
              className="text-ink-300 hover:text-terminal-cyan text-sm font-mono uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
            >
              <UserCircle size={14} />
              Espace administrateur
            </button>
          </div>
        </div>
      </main>

      <footer className="px-6 py-4 border-t border-ink-700/30 text-center">
        <div className="text-[9px] font-mono uppercase tracking-wider text-ink-400">
          Toutes les données sont fictives · Compliance terms apply
        </div>
      </footer>
    </div>
  );
}
