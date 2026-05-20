import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, ChevronLeft, ChevronRight, TrendingUp, Users, BarChart3, FileDown, Trophy } from 'lucide-react';
import Logo from '../components/Logo';
import CompanyLogo from '../components/CompanyLogo';
import { api } from '../utils/api';
import { useConfig } from '../hooks/useConfig';
import { useSessionSocket } from '../hooks/useSessionSocket';

const RISK_STYLES = {
  low: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', label: 'Risque faible', icon: '✓' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/40', label: 'Zone grise RGPD/LPD', icon: '⚠' },
  high: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/40', label: 'Risque élevé', icon: '⚠' },
  critical: { color: 'text-red-300', bg: 'bg-red-900/30', border: 'border-red-700/60', label: 'Risque critique — exploitation de vulnérabilité', icon: '⛔' }
};

export default function ResultsView({ role }) {
  const { code } = useParams();
  const navigate = useNavigate();
  const { config } = useConfig();
  const { sessionState, groups, reports, synthesis, error } = useSessionSocket(code, role);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState('individual'); // 'individual' | 'synthesis'

  // Si pas encore de reports, charger depuis l'API
  const [fetchedReports, setFetchedReports] = useState(null);
  useEffect(() => {
    if (!reports && sessionState?.state === 'revealed') {
      // Force un appel à reveal pour récupérer reports
      api.revealSession(code)
        .then(data => setFetchedReports(data))
        .catch(() => {});
    }
  }, [reports, sessionState, code]);

  const finalReports = reports || fetchedReports?.reports;
  const finalSynthesis = synthesis || fetchedReports?.synthesis;

  if (!config || !sessionState) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-300">
        {error ? `Erreur : ${error}` : 'Chargement des résultats...'}
      </div>
    );
  }

  if (sessionState.state !== 'revealed' || !finalReports) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-terminal-amber mb-2 font-mono text-sm uppercase tracking-widest">En attente</div>
          <div className="text-ink-100 text-lg mb-4">
            Les résultats seront révélés par l'administrateur·rice.
          </div>
          <div className="text-ink-300 text-xs font-mono">
            Session : {code} · État : {sessionState.state}
          </div>
        </div>
      </div>
    );
  }

  const handleExport = async () => {
    try {
      const blob = await api.exportSession(code);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${code}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
  };

  const currentReport = finalReports[currentIndex];
  const currentMission = currentReport ? config.missionsConfig.missions[currentReport.mission_id] : null;
  const categoriesMap = useMemo(() => Object.fromEntries((config.dataCatalog?.data_categories || []).map(c => [c.id, c])), [config]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ink-700/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo size="md" />
          <div className="text-[10px] font-mono uppercase tracking-wider text-ink-300">
            Rapports de campagne
          </div>
        </div>
        <div className="flex items-center gap-2">
          {role === 'teacher' && (
            <>
              <button onClick={handleExport} className="btn-ghost flex items-center gap-1.5">
                <FileDown size={14} />
                Exporter
              </button>
              <button onClick={() => navigate(`/teacher/session/${code}`)} className="btn-ghost flex items-center gap-1.5">
                <ArrowLeft size={14} />
                Session
              </button>
            </>
          )}
          {role === 'group' && (
            <button onClick={() => navigate('/')} className="btn-ghost">
              Quitter
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-6 py-6 max-w-5xl w-full mx-auto">
        {/* Tabs viewMode */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setViewMode('individual')}
            className={`px-4 py-2 text-sm transition-colors border-b-2 ${
              viewMode === 'individual'
                ? 'border-terminal-cyan text-ink-100'
                : 'border-transparent text-ink-300 hover:text-ink-100'
            }`}
          >
            Rapports individuels
          </button>
          <button
            onClick={() => setViewMode('synthesis')}
            className={`px-4 py-2 text-sm transition-colors border-b-2 ${
              viewMode === 'synthesis'
                ? 'border-terminal-cyan text-ink-100'
                : 'border-transparent text-ink-300 hover:text-ink-100'
            }`}
          >
            Synthèse de classe
          </button>
        </div>

        {viewMode === 'individual' && currentReport && currentMission && (
          <>
            {/* Navigation entre rapports */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="btn-ghost flex items-center gap-1.5 disabled:opacity-30"
              >
                <ChevronLeft size={16} />
                Précédent
              </button>
              <div className="text-xs font-mono text-ink-300">
                {currentIndex + 1} / {finalReports.length}
              </div>
              <button
                onClick={() => setCurrentIndex(Math.min(finalReports.length - 1, currentIndex + 1))}
                disabled={currentIndex === finalReports.length - 1}
                className="btn-ghost flex items-center gap-1.5 disabled:opacity-30"
              >
                Suivant
                <ChevronRight size={16} />
              </button>
            </div>

            <ReportCard
              report={currentReport}
              mission={currentMission}
              categoriesMap={categoriesMap}
            />
          </>
        )}

        {viewMode === 'synthesis' && finalSynthesis && (
          <SynthesisView synthesis={finalSynthesis} reports={finalReports} config={config} onSelectReport={(i) => { setCurrentIndex(i); setViewMode('individual'); }} />
        )}
      </main>
    </div>
  );
}

// ============================================================
// CARTE DE RAPPORT INDIVIDUEL
// ============================================================
function ReportCard({ report, mission, categoriesMap }) {
  const risk = RISK_STYLES[report.risk_level] || RISK_STYLES.low;
  const isInferred = report.sensitive && (
    report.profile_label?.includes('INFÉRÉ') ||
    report.profile_label?.includes('INFÉRÉE') ||
    report.profile_label?.includes('GROSSESSE') ||
    report.profile_label?.includes('ADDICTION') ||
    report.profile_label?.includes('RUPTURE') ||
    report.profile_label?.includes('SOLITUDE') ||
    report.profile_label?.includes('FRAGILITÉ') ||
    report.profile_label?.includes('CUMUL')
  );

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="panel-bordered p-5 flex items-start gap-4">
        <CompanyLogo logoStyle={mission.logo_style} color={mission.color_palette.primary} size={48} />
        <div className="flex-1">
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-ink-300 mb-1">
            Rapport de campagne — Q4
          </div>
          <h2 className="text-2xl font-display text-ink-100">{report.group_label}</h2>
          <div className="text-sm text-ink-300">{report.company_name} — {mission.sector}</div>
        </div>
        <div className={`chip font-bold text-xs ${risk.color}`}>
          {risk.icon} {risk.label}
        </div>
      </div>

      {/* Chiffres clés */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatBlock label="Investissement données" value={`${report.spending}`} suffix="CHF" color="text-ink-100" />
        <StatBlock label="Revenu généré" value={`${report.revenue.toLocaleString('fr-CH')}`} suffix="CHF" color="text-terminal-cyan" />
        <StatBlock
          label="Bénéfice net"
          value={`${report.net_profit >= 0 ? '+' : ''}${report.net_profit.toLocaleString('fr-CH')}`}
          suffix={`CHF (ROI ${report.roi_percent}%)`}
          color={report.net_profit >= 0 ? 'text-terminal-green' : 'text-terminal-red'}
        />
      </div>

      {/* Profil débloqué */}
      <div className={`p-5 border-2 ${risk.border} ${risk.bg} animate-slide-up`}>
        <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-ink-300 mb-2">
          Profil ciblé débloqué
        </div>
        <h3 className={`text-2xl font-display font-bold mb-3 ${risk.color}`}>
          {isInferred && '⚠ '}{report.profile_label}
        </h3>
        {report.profile_explanation && (
          <p className="text-sm text-ink-100 leading-relaxed">
            {report.profile_explanation}
          </p>
        )}
        {report.sensitive_label && (
          <div className="mt-3 pt-3 border-t border-ink-700/50">
            <div className="text-[10px] font-mono uppercase tracking-wider text-ink-300 mb-1">
              Note légale & réputationnelle
            </div>
            <div className={`text-sm ${risk.color} italic`}>
              {report.sensitive_label}
            </div>
          </div>
        )}
      </div>

      {/* Détails selon modèle économique */}
      <ReportDetails report={report} mission={mission} />

      {/* Achats */}
      <div className="panel-bordered p-5">
        <div className="section-header mb-3">Données acquises</div>
        {report.purchases.length === 0 ? (
          <div className="text-sm text-ink-400 italic">Aucun achat effectué.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {report.purchases.map(pid => {
              const cat = categoriesMap[pid];
              if (!cat) return null;
              return (
                <div key={pid} className="bg-ink-800/50 border border-ink-600 p-2 flex items-center justify-between text-sm">
                  <span className="truncate">{cat.name}</span>
                  <span className="font-mono text-terminal-cyan ml-2">{cat.price} CHF</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBlock({ label, value, suffix, color }) {
  return (
    <div className="panel-bordered p-4">
      <div className="text-[10px] font-mono uppercase tracking-wider text-ink-300 mb-1">{label}</div>
      <div className={`text-3xl font-mono font-bold ${color}`}>{value}</div>
      <div className="text-xs text-ink-400 font-mono mt-1">{suffix}</div>
    </div>
  );
}

function ReportDetails({ report, mission }) {
  const d = report.details;

  if (mission.economic_model === 'simple') {
    return (
      <div className="panel-bordered p-5">
        <div className="section-header mb-3">Conversion publicitaire</div>
        <div className="text-3xl font-mono font-bold text-terminal-cyan">
          {d.clients} clients
        </div>
        <div className="text-xs text-ink-400 mt-1">
          {d.client_value} CHF par client converti
        </div>
      </div>
    );
  }

  if (mission.economic_model === 'betmax') {
    return (
      <div className="panel-bordered p-5">
        <div className="section-header mb-3">Conversion & rétention</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-ink-300 mb-1">Clients neufs</div>
            <div className="text-2xl font-mono font-bold text-ink-100">{d.clients_new}</div>
          </div>
          <div>
            <div className="text-xs text-ink-300 mb-1">Clients récurrents</div>
            <div className="text-2xl font-mono font-bold text-terminal-amber">{d.clients_recurring}</div>
          </div>
        </div>
        {d.recurring_revenue_percent > 0 && (
          <div className="mt-4 pt-3 border-t border-ink-700/50">
            <div className="text-sm text-ink-100">
              <span className="font-bold text-terminal-red">{d.recurring_revenue_percent}%</span> de votre revenu provient des <span className="italic">clients récurrents</span> —
              c'est-à-dire des personnes qui rejouent après avoir perdu.
            </div>
          </div>
        )}
      </div>
    );
  }

  if (mission.economic_model === 'vitaplus') {
    return (
      <div className="panel-bordered p-5">
        <div className="section-header mb-3">Tri des risques</div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-ink-300 mb-1">Bons risques acceptés</div>
            <div className="text-2xl font-mono font-bold text-terminal-green">{d.good_risks}</div>
            <div className="text-[10px] font-mono text-ink-400">+{d.good_risks * mission.margin_good_risk} CHF</div>
          </div>
          <div>
            <div className="text-xs text-ink-300 mb-1">Mauvais identifiés (rejetés)</div>
            <div className="text-2xl font-mono font-bold text-terminal-amber">{d.bad_risks_identified}</div>
            <div className="text-[10px] font-mono text-ink-400">+{d.bad_risks_identified * mission.margin_bad_risk_identified} CHF</div>
          </div>
          <div>
            <div className="text-xs text-ink-300 mb-1">Mauvais non détectés</div>
            <div className="text-2xl font-mono font-bold text-terminal-red">{d.bad_risks_unidentified}</div>
            <div className="text-[10px] font-mono text-ink-400">-{d.bad_risks_unidentified * mission.loss_bad_risk_unidentified} CHF</div>
          </div>
        </div>
      </div>
    );
  }

  if (mission.economic_model === 'quickcash') {
    return (
      <div className="panel-bordered p-5">
        <div className="section-header mb-3">Acquisition & taux de défaut</div>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-xs text-ink-300 mb-1">Clients solvables</div>
            <div className="text-2xl font-mono font-bold text-terminal-green">{d.solvent}</div>
          </div>
          <div>
            <div className="text-xs text-ink-300 mb-1">Clients en défaut</div>
            <div className="text-2xl font-mono font-bold text-terminal-red">{d.insolvent}</div>
          </div>
        </div>
        <div className="pt-3 border-t border-ink-700/50">
          <div className="text-sm text-ink-100">
            Taux de défaut : <span className="font-bold text-terminal-amber">{d.default_rate}%</span>
            {d.default_rate > 40 && (
              <span className="text-xs text-ink-300 ml-2 italic">
                Mécanisme caractéristique des crédits prédateurs (subprime).
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ============================================================
// SYNTHÈSE DE CLASSE
// ============================================================
function SynthesisView({ synthesis, reports, config, onSelectReport }) {
  const totalSensitive = synthesis.groups_with_sensitive_inference;
  const totalGroups = synthesis.total_groups;
  const percentSensitive = totalGroups > 0 ? Math.round((totalSensitive / totalGroups) * 100) : 0;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Phrase-choc */}
      <div className="panel-bordered p-8 text-center bg-gradient-to-br from-ink-800/80 to-ink-900">
        <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-ink-300 mb-3">
          Constat de classe
        </div>
        <div className="text-5xl font-display font-bold text-terminal-cyan mb-2">
          {totalSensitive} <span className="text-ink-300">/</span> {totalGroups}
        </div>
        <div className="text-lg text-ink-100">
          {totalSensitive === totalGroups
            ? "Tous les groupes ont fabriqué une inférence sensible."
            : totalSensitive === 0
              ? "Aucun groupe n'a fabriqué d'inférence sensible cette fois-ci."
              : `${percentSensitive}% des groupes ont fabriqué une inférence sensible sans le savoir explicitement.`
          }
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SynthStat icon={<TrendingUp size={20} />} label="Bénéfice le + élevé"
          value={`${synthesis.highest_profit.toLocaleString('fr-CH')} CHF`} color="text-terminal-green" />
        <SynthStat icon={<BarChart3 size={20} />} label="Bénéfice moyen"
          value={`${synthesis.avg_profit.toLocaleString('fr-CH')} CHF`} color="text-ink-100" />
        <SynthStat icon={<AlertTriangle size={20} />} label="Risque critique"
          value={`${synthesis.groups_with_critical_risk} groupe${synthesis.groups_with_critical_risk > 1 ? 's' : ''}`}
          color={synthesis.groups_with_critical_risk > 0 ? 'text-terminal-red' : 'text-ink-100'} />
      </div>

      {/* Classement */}
      <div className="panel-bordered p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="text-terminal-amber" size={20} />
          <h2 className="text-lg font-display">Classement par bénéfice</h2>
        </div>
        <div className="space-y-1">
          {synthesis.ranking.map((r, i) => {
            const risk = RISK_STYLES[r.risk_level] || RISK_STYLES.low;
            return (
              <button
                key={i}
                onClick={() => onSelectReport(reports.findIndex(rep => rep.group_label === r.group_label))}
                className="w-full flex items-center gap-3 p-3 hover:bg-ink-700/50 transition-colors text-left border border-transparent hover:border-ink-600"
              >
                <div className="text-2xl font-display font-bold text-ink-300 w-8">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-medium truncate">{r.group_label}</div>
                  <div className="text-xs text-ink-300">{r.company_name}</div>
                </div>
                <div className={`chip text-xs ${risk.color}`}>
                  {risk.icon} {risk.label}
                </div>
                <div className={`font-mono text-lg font-bold ${r.net_profit >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                  {r.net_profit >= 0 ? '+' : ''}{r.net_profit.toLocaleString('fr-CH')} CHF
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Questions de débrief */}
      <div className="panel-bordered p-5 bg-ink-800/30">
        <div className="section-header mb-4">Questions de débrief</div>
        <ol className="space-y-3 text-sm leading-relaxed">
          <li className="flex gap-3">
            <span className="font-mono text-terminal-cyan font-bold">01</span>
            <span className="text-ink-100">
              Pour atteindre vos objectifs commerciaux, fallait-il acheter les catégories
              les plus problématiques ? Auriez-vous pu faire autrement ?
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-terminal-cyan font-bold">02</span>
            <span className="text-ink-100">
              Quand vous utilisez TikTok ou Instagram gratuitement, qu'échangez-vous vraiment ?
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-terminal-cyan font-bold">03</span>
            <span className="text-ink-100">
              Le RGPD européen et la LPD suisse interdisent en théorie la vente de certaines
              données sensibles. Pourquoi ce marché existe-t-il quand même ?
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}

function SynthStat({ icon, label, value, color }) {
  return (
    <div className="panel-bordered p-4 flex items-center gap-3">
      <div className="text-ink-300">{icon}</div>
      <div className="flex-1">
        <div className="text-[10px] font-mono uppercase tracking-wider text-ink-300">{label}</div>
        <div className={`text-xl font-mono font-bold ${color}`}>{value}</div>
      </div>
    </div>
  );
}
