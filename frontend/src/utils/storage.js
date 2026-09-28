const RELIGION_KEY = "sg_religion";
const JOURNAL_KEY = "sg_journal";
const DAY_MS = 24 * 60 * 60 * 1000;

export function saveReligion(religionKey) {
  const payload = { religion: religionKey, timestamp: Date.now() };
  localStorage.setItem(RELIGION_KEY, JSON.stringify(payload));
}

export function loadReligion() {
  const raw = localStorage.getItem(RELIGION_KEY);
  if (!raw) return null;
  try {
    const { religion, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > DAY_MS) {
      localStorage.removeItem(RELIGION_KEY);
      return null;
    }
    return religion;
  } catch {
    return null;
  }
}

export function clearReligion() {
  localStorage.removeItem(RELIGION_KEY);
}

export function getJournal() {
  const raw = localStorage.getItem(JOURNAL_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveJournalEntry(entry) {
  const journal = getJournal();
  const withId = { ...entry, id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}` };
  journal.unshift(withId);
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(journal));
  return withId;
}

export function deleteJournalEntry(id) {
  const journal = getJournal().filter((e) => e.id !== id);
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(journal));
}
