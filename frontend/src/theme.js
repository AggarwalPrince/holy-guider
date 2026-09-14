// Design tokens. Base "temple stone" shell shared by every screen,
// plus a per-religion accent + motif applied once a tradition is selected.

export const BASE = {
  stone: "#EDEEEA",
  stoneDeep: "#E2E3DC",
  ink: "#1B1F22",
  inkSoft: "#4A4F52",
  brass: "#B08D3F"
};

export const RELIGIONS = [
  {
    key: "christianity",
    name: "Christianity",
    scripture: "The Bible",
    accent: "#3A5A8C",
    accentSoft: "#DCE4EF",
    motif: "cross",
    devanagariNeeded: false
  },
  {
    key: "islam",
    name: "Islam",
    scripture: "The Quran",
    accent: "#1F6650",
    accentSoft: "#DCEAE4",
    motif: "crescent",
    devanagariNeeded: false
  },
  {
    key: "hinduism",
    name: "Hinduism",
    scripture: "The Bhagavad Gita",
    accent: "#C1791F",
    accentSoft: "#F3E5CE",
    motif: "om",
    devanagariNeeded: true
  },
  {
    key: "buddhism",
    name: "Buddhism",
    scripture: "The Dhammapada",
    accent: "#8C4A2F",
    accentSoft: "#EEDDD3",
    motif: "dharma",
    devanagariNeeded: false
  },
  {
    key: "sikhism",
    name: "Sikhism",
    scripture: "The Guru Granth Sahib",
    accent: "#1E4D8C",
    accentSoft: "#DBE5F1",
    motif: "khanda",
    devanagariNeeded: true
  },
  {
    key: "judaism",
    name: "Judaism",
    scripture: "The Torah",
    accent: "#3F5B8C",
    accentSoft: "#DEE4EF",
    motif: "star_of_david",
    devanagariNeeded: false
  },
  {
    key: "bahai",
    name: "Bahá'í Faith",
    scripture: "Writings of Bahá'u'lláh",
    accent: "#2A9D8F",
    accentSoft: "#D9EEEB",
    motif: "nine_star",
    devanagariNeeded: false
  },
  {
    key: "jainism",
    name: "Jainism",
    scripture: "The Tattvartha Sutra",
    accent: "#A13D3D",
    accentSoft: "#F0DCDC",
    motif: "ahimsa",
    devanagariNeeded: true
  },
  {
    key: "shinto",
    name: "Shinto",
    scripture: "The Kojiki",
    accent: "#B23A1E",
    accentSoft: "#F0DAD2",
    motif: "torii",
    devanagariNeeded: false
  },
  {
    key: "taoism",
    name: "Taoism",
    scripture: "The Tao Te Ching",
    accent: "#4A5A4E",
    accentSoft: "#DFE5E0",
    motif: "yinyang",
    devanagariNeeded: false
  }
];

export function getReligion(key) {
  return RELIGIONS.find((r) => r.key === key) || null;
}

// Applies a religion's accent as CSS custom properties on the document root
// so every component can just reference var(--accent) etc.
export function applyReligionTheme(key) {
  const religion = getReligion(key);
  const root = document.documentElement;
  if (!religion) {
    root.style.removeProperty("--accent");
    root.style.removeProperty("--accent-soft");
    return;
  }
  root.style.setProperty("--accent", religion.accent);
  root.style.setProperty("--accent-soft", religion.accentSoft);
}
