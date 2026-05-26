import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, UserCircle, AlertCircle, Settings } from 'lucide-react';
import Logo from '../components/Logo';
import { api, isTeacherAuthenticated, getApiUrl, setApiUrl } from '../utils/api';

export default function HomeView() {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(getApiUrl());
  const [healthStatus, setHealthStatus] = useState('checking');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Pré-remplir le code si dans l'URL
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) setCode(codeFromUrl.toUpperCase());
  }, [searchParams]);

  // Vérifier la santé du serveur au chargement
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

  const handleSaveApiUrl = () => {
    setApiUrl(apiUrlInput);
    setShowSettings(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
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

      {/* Settings panel */}
      {showSettings && (
        <div className="bg-ink-800 border-b border-ink-600 px-6 py-4 animate-slide-up">
          <div className="max-w-2xl mx-auto">
            <label className="text-[10px] font-mono uppercase tracking-wider text-ink-300 mb-2 block">
              URL du serveur (avancé)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiUrlInput}
                onChange={(e) => setApiUrlInput(e.target.value)}
                className="input-terminal flex-1 text-xs"
              />
              <button onClick={handleSaveApiUrl} className="btn-secondary text-xs">
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-12">

          {/* Slogan */}
          <div className="text-center space-y-3 animate-fade-in">
            <div className="text-[12px] font-mono uppercase tracking-[0.3em] text-terminal-cyan">
              Un jeu pour comprendre les enjeux du BigData
            </div>
            <h1 className="text-2xl font-display font-light text-ink-100 leading-tight">
              Acheter des données.<br />
              <span className="text-terminal-cyan">Connaître vos clients.</span>
            </h1>
            <p className="text-sm text-ink-300">
              5 000+ sources de données vérifiées. Livraison immédiate.
            </p>
          </div>

          {/* Form Join */}
          <div className="panel-bordered p-6 space-y-4 animate-slide-up">
            <div className="section-header">Accès groupe</div>
            <form onSubmit={handleJoin} className="space-y-3">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-ink-300 block mb-1.5">
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
                <div className="flex items-start gap-2 text-terminal-red text-xs">
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
          </div>

          {/* Lien enseignant */}
          <div className="text-center">
            <button
              onClick={() => navigate(isTeacherAuthenticated() ? '/teacher' : '/teacher/login')}
              className="text-ink-300 hover:text-terminal-cyan text-xs font-mono uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
            >
              <UserCircle size={14} />
              Espace administrateur
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-ink-700/30 text-center">
        <div className="text-[9px] font-mono uppercase tracking-wider text-ink-400">
          All data sourced legally from third-party partners · Compliance terms apply
        </div>
      </footer>
    </div>
  );
}
