import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import Logo from '../components/Logo';
import { api, setTeacherToken } from '../utils/api';

export default function TeacherLoginView() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError(null);
    try {
      const { token } = await api.login(password);
      setTeacherToken(token);
      navigate('/teacher');
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
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex w-12 h-12 bg-ink-700 border border-ink-500 items-center justify-center mb-2">
              <Lock size={20} className="text-terminal-cyan" />
            </div>
            <h1 className="text-xl font-display text-ink-100">Espace administrateur</h1>
            <p className="text-xs text-ink-300 font-mono uppercase tracking-wider">
              Accès restreint
            </p>
          </div>

          <form onSubmit={handleSubmit} className="panel-bordered p-6 space-y-4">
            <div className="section-header">Authentification</div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-ink-300 block mb-1.5">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-terminal w-full"
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
              disabled={!password || loading}
              className="btn-primary w-full"
            >
              {loading ? 'Vérification...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
