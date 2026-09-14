// Simple, respectful line-art motifs per tradition. Kept minimal and
// geometric on purpose so they read as calm iconography, not decoration.

export default function Motif({ type, size = 40, color = "currentColor" }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 48 48",
    fill: "none",
    stroke: color,
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };

  switch (type) {
    case "cross":
      return (
        <svg {...props}>
          <line x1="24" y1="6" x2="24" y2="42" />
          <line x1="10" y1="18" x2="38" y2="18" />
        </svg>
      );
    case "crescent":
      return (
        <svg {...props}>
          <path d="M28 8a16 16 0 1 0 0 32 13 13 0 1 1 0-32z" />
          <path d="M35 15 L37 15 M37 13 L37 17" strokeWidth="1.2" />
        </svg>
      );
    case "om":
      return (
        <svg {...props} fill={color} stroke="none">
          <text x="24" y="33" fontSize="26" textAnchor="middle" fontFamily="'Noto Serif Devanagari', serif">
            ॐ
          </text>
        </svg>
      );
    case "dharma":
      return (
        <svg {...props}>
          <circle cx="24" cy="24" r="16" />
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * Math.PI) / 4;
            const x2 = 24 + 16 * Math.cos(angle);
            const y2 = 24 + 16 * Math.sin(angle);
            return <line key={i} x1="24" y1="24" x2={x2} y2={y2} />;
          })}
          <circle cx="24" cy="24" r="3" />
        </svg>
      );
    case "khanda":
      return (
        <svg {...props}>
          <circle cx="24" cy="24" r="15" />
          <line x1="24" y1="9" x2="24" y2="39" strokeWidth="1.4" />
          <path d="M16 16 L32 32" />
          <path d="M32 16 L16 32" />
        </svg>
      );
    case "star_of_david":
      return (
        <svg {...props}>
          <polygon points="24,8 30,20 43,20 32,28 36,40 24,32 12,40 16,28 5,20 18,20" />
        </svg>
      );
    case "nine_star":
      return (
        <svg {...props}>
          <circle cx="24" cy="24" r="16" />
          {Array.from({ length: 9 }).map((_, i) => {
            const angle = (i * 2 * Math.PI) / 9 - Math.PI / 2;
            const x2 = 24 + 16 * Math.cos(angle);
            const y2 = 24 + 16 * Math.sin(angle);
            return <line key={i} x1="24" y1="24" x2={x2} y2={y2} strokeWidth="1.1" />;
          })}
        </svg>
      );
    case "ahimsa":
      return (
        <svg {...props}>
          <circle cx="24" cy="26" r="14" />
          <text x="24" y="31" fontSize="13" textAnchor="middle" fill={color} stroke="none" fontFamily="'Noto Serif Devanagari', serif">
            अ
          </text>
        </svg>
      );
    case "torii":
      return (
        <svg {...props}>
          <line x1="8" y1="16" x2="40" y2="16" strokeWidth="2.2" />
          <line x1="6" y1="12" x2="42" y2="12" strokeWidth="2.6" />
          <line x1="14" y1="12" x2="14" y2="40" />
          <line x1="34" y1="12" x2="34" y2="40" />
          <line x1="12" y1="22" x2="36" y2="22" />
        </svg>
      );
    case "yinyang":
      return (
        <svg {...props}>
          <circle cx="24" cy="24" r="16" />
          <path d="M24 8a8 8 0 0 1 0 16 8 8 0 0 0 0 16 16 16 0 0 1 0-32z" fill={color} stroke="none" />
          <circle cx="24" cy="16" r="2" fill={color} stroke="none" />
          <circle cx="24" cy="32" r="2" fill="none" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="24" cy="24" r="16" />
        </svg>
      );
  }
}
