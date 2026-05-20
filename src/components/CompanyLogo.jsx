// Logos SVG inline pour chaque entreprise fictive.
// Le style varie selon l'entreprise pour renforcer son identité.

export default function CompanyLogo({ logoStyle, color = '#ffffff', size = 40 }) {
  const props = { width: size, height: size, viewBox: '0 0 40 40', fill: 'none' };

  switch (logoStyle) {
    case 'leaf':
      return (
        <svg {...props}>
          <path d="M20 5 Q8 12 8 25 Q8 32 20 35 Q32 32 32 25 Q32 12 20 5 Z" fill={color} opacity="0.2"/>
          <path d="M20 8 Q12 14 12 24 Q12 30 20 32 Q28 30 28 24 Q28 14 20 8 Z" fill={color} opacity="0.4"/>
          <path d="M20 12 L20 30 M14 18 Q20 22 26 18 M14 24 Q20 28 26 24" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );

    case 'lightning':
      return (
        <svg {...props}>
          <path d="M22 4 L10 22 L18 22 L14 36 L30 16 L22 16 Z" fill={color}/>
        </svg>
      );

    case 'cross':
      return (
        <svg {...props}>
          <rect x="4" y="4" width="32" height="32" stroke={color} strokeWidth="1.5" fill="none"/>
          <rect x="16" y="10" width="8" height="20" fill={color}/>
          <rect x="10" y="16" width="20" height="8" fill={color}/>
        </svg>
      );

    case 'lightning-coin':
      return (
        <svg {...props}>
          <circle cx="20" cy="20" r="16" stroke={color} strokeWidth="2" fill="none"/>
          <path d="M22 8 L14 22 L19 22 L17 32 L26 18 L21 18 Z" fill={color}/>
        </svg>
      );

    case 'dumbbell':
      return (
        <svg {...props}>
          <rect x="4" y="14" width="6" height="12" fill={color}/>
          <rect x="30" y="14" width="6" height="12" fill={color}/>
          <rect x="10" y="18" width="20" height="4" fill={color}/>
          <rect x="2" y="17" width="2" height="6" fill={color}/>
          <rect x="36" y="17" width="2" height="6" fill={color}/>
        </svg>
      );

    case 'heart':
      return (
        <svg {...props}>
          <path d="M20 34 C20 34 6 24 6 14 C6 9 10 5 14 5 C17 5 20 7 20 11 C20 7 23 5 26 5 C30 5 34 9 34 14 C34 24 20 34 20 34 Z" fill={color}/>
        </svg>
      );

    default:
      // Logo générique : losange
      return (
        <svg {...props}>
          <path d="M20 4 L36 20 L20 36 L4 20 Z" stroke={color} strokeWidth="2" fill="none"/>
          <path d="M20 12 L28 20 L20 28 L12 20 Z" fill={color}/>
        </svg>
      );
  }
}
