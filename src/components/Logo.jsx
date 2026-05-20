// Logo "DATAFLOW™" stylisé — l'identité visuelle de l'app
export default function Logo({ size = 'md', className = '' }) {
  const sizes = {
    sm: { text: 'text-sm', icon: 14 },
    md: { text: 'text-lg', icon: 20 },
    lg: { text: 'text-3xl', icon: 32 },
    xl: { text: 'text-5xl', icon: 48 }
  };
  const s = sizes[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width={s.icon} height={s.icon} viewBox="0 0 32 32" className="text-terminal-cyan">
        <path d="M4 8 L16 16 L4 24 Z" fill="currentColor" opacity="0.9" />
        <path d="M16 16 L28 8 L28 24 Z" fill="currentColor" opacity="0.6" />
        <circle cx="16" cy="16" r="2" fill="#0a0e1a" />
      </svg>
      <div className="flex items-baseline gap-0.5">
        <span className={`${s.text} font-bold tracking-tight font-display text-ink-100`}>
          DATAFLOW
        </span>
        <span className="text-[10px] text-terminal-cyan font-mono">™</span>
      </div>
    </div>
  );
}
