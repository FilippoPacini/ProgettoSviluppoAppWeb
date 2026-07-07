// Illustrazioni SVG inline in stile "flat": autonome, senza dipendenze esterne
// ne' problemi di licenza, si colorano con le variabili del tema e non dipendono
// da hosting di terzi. Ogni SVG usa currentColor e le variabili --color-* del brand.

const P = 'var(--color-primary)';
const PL = 'var(--color-primary-light)';
const PB = 'var(--color-primary-bg)';
const BORDER = 'var(--color-border)';

function Frame({ children, size = 160 }) {
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 200 160" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

// Obiettivi: bersaglio con freccia.
function Goals(props) {
  return (
    <Frame {...props}>
      <ellipse cx="100" cy="145" rx="60" ry="8" fill={PB} />
      <circle cx="95" cy="78" r="52" fill={PB} />
      <circle cx="95" cy="78" r="52" stroke={PL} strokeWidth="3" />
      <circle cx="95" cy="78" r="34" stroke={PL} strokeWidth="3" />
      <circle cx="95" cy="78" r="14" fill={P} />
      <path d="M150 30 L96 78" stroke={P} strokeWidth="5" strokeLinecap="round" />
      <path d="M150 30 l-16 2 l4 -16 z" fill={P} />
    </Frame>
  );
}

// Abitudini: lista con spunte.
function Habits(props) {
  return (
    <Frame {...props}>
      <ellipse cx="100" cy="148" rx="62" ry="8" fill={PB} />
      <rect x="52" y="24" width="96" height="112" rx="10" fill="var(--color-surface)" stroke={BORDER} strokeWidth="2" />
      <rect x="66" y="44" width="18" height="18" rx="5" fill={P} />
      <path d="M70 53 l4 4 l7 -8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="94" y="49" width="42" height="7" rx="3.5" fill={BORDER} />
      <rect x="66" y="76" width="18" height="18" rx="5" fill={P} />
      <path d="M70 85 l4 4 l7 -8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="94" y="81" width="42" height="7" rx="3.5" fill={BORDER} />
      <rect x="66" y="108" width="18" height="18" rx="5" fill={PB} stroke={PL} strokeWidth="2" />
      <rect x="94" y="113" width="30" height="7" rx="3.5" fill={BORDER} />
    </Frame>
  );
}

// Diario: taccuino aperto.
function Diary(props) {
  return (
    <Frame {...props}>
      <ellipse cx="100" cy="146" rx="64" ry="8" fill={PB} />
      <path d="M100 44 C80 32 58 34 46 40 L46 124 C58 118 80 116 100 128 Z" fill="var(--color-surface)" stroke={BORDER} strokeWidth="2" />
      <path d="M100 44 C120 32 142 34 154 40 L154 124 C142 118 120 116 100 128 Z" fill={PB} stroke={PL} strokeWidth="2" />
      <path d="M58 58 h30 M58 72 h30 M58 86 h24" stroke={BORDER} strokeWidth="3" strokeLinecap="round" />
      <path d="M112 58 h30 M112 72 h30 M112 86 h24" stroke={PL} strokeWidth="3" strokeLinecap="round" />
    </Frame>
  );
}

// Autenticazione / crescita: una piccola pianta che cresce (tema "forge/growth").
function Auth(props) {
  return (
    <Frame {...props}>
      <ellipse cx="100" cy="140" rx="52" ry="8" fill={PB} />
      <path d="M100 138 V80" stroke={P} strokeWidth="5" strokeLinecap="round" />
      <path d="M100 96 C80 92 72 74 74 60 C92 62 102 78 100 96 Z" fill={PL} />
      <path d="M100 84 C118 78 126 60 124 46 C108 50 98 68 100 84 Z" fill={P} />
      <rect x="78" y="120" width="44" height="22" rx="6" fill={PB} stroke={PL} strokeWidth="2" />
    </Frame>
  );
}

// Risultato / festeggiamento: stella con coriandoli.
function Celebrate(props) {
  return (
    <Frame {...props}>
      <circle cx="100" cy="78" r="40" fill={PB} />
      <path d="M100 50 l8 18 l20 2 l-15 13 l5 20 l-18 -11 l-18 11 l5 -20 l-15 -13 l20 -2 z" fill={P} />
      <circle cx="46" cy="52" r="4" fill={PL} />
      <circle cx="158" cy="60" r="5" fill={P} />
      <circle cx="150" cy="118" r="4" fill={PL} />
      <circle cx="52" cy="112" r="5" fill={P} />
      <rect x="40" y="80" width="7" height="7" rx="2" fill={PL} transform="rotate(20 43 83)" />
      <rect x="156" y="92" width="7" height="7" rx="2" fill={P} transform="rotate(-15 159 95)" />
    </Frame>
  );
}

const MAP = { goals: Goals, habits: Habits, diary: Diary, auth: Auth, celebrate: Celebrate };

export function Illustration({ name, size }) {
  const Cmp = MAP[name] || Goals;
  return <Cmp size={size} />;
}
