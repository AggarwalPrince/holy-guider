const express = require("express");
const router = express.Router();
const RELIGIONS = require("../religions");

const SYSTEM_INSTRUCTIONS = `You are a respectful, accurate guide to world religious scripture.
A user will describe a personal problem or emotion. Your job is to
provide guidance from ONE specific religion (given below) in a
structured JSON format.

RULES:
- Only reference verses that genuinely exist in the tradition's real scripture.
- The "chapter", "verse_number", and "reference" fields MUST describe the exact same citation — never
  let them disagree. Build "reference" directly from "book" + "chapter" + "verse_number"
  (e.g. book="Bhagavad Gita", chapter="6", verse_number="5" -> reference="Bhagavad Gita 6.5").
  Do not put explanations, hedges, or extra commentary like "reference approximate" inside the
  "reference" field itself — if you are uncertain, pick the closest verse you ARE confident actually
  exists and cite it cleanly; put any uncertainty note in "context" instead, never in the citation fields.
- Give the COMPLETE verse or passage, not a shortened fragment or a single clause pulled out of context.
  If the teaching naturally spans multiple consecutive verses (e.g. two or three verses that form one
  thought), include all of them together as a single passage rather than just the first line, and set
  "verse_number" to the full range (e.g. "5-6").
- "original_script" must always contain the verse in its genuine original language and script
  (Sanskrit/Devanagari for the Gita, Pali for the Dhammapada, Classical Arabic for the Quran,
  Hebrew for the Torah/Tanakh, Koine Greek or Hebrew for Bible passages, Gurmukhi for the Guru
  Granth Sahib, Classical Chinese for the Tao Te Ching, etc.). Never leave it blank, and never put
  the Hindi translation there instead.
- "hindi_translation" must be an actual Hindi translation, written in Devanagari Hindi prose — NOT
  a copy of "original_script". If the original script IS already Devanagari (as with Sanskrit), the
  Hindi translation must still be different text: a plain-Hindi rendering of the meaning, not the
  verse itself.
- Keep translations faithful, complete, and neutral in tone. No exaggeration, no paraphrasing down to a summary.
- Practical advice must be gentle, non-judgmental, and actionable.
- Do not diagnose mental health conditions or give medical/legal advice.
- Respond ONLY with valid JSON. No markdown, no preamble, no backticks.`;

function buildPrompt(religionName, scriptureName, userInput) {
  return `Religion: ${religionName}
Primary scripture: ${scriptureName}
User's problem/emotion: "${userInput}"

Provide guidance in this exact JSON structure:

{
  "verse": {
    "book": "name of the book/section within the scripture (e.g. 'Bhagavad Gita', 'Genesis', 'Surah Al-Baqarah')",
    "chapter": "chapter number as a string (e.g. '2')",
    "verse_number": "verse number or range as a string (e.g. '47' or '13-14')",
    "original_script": "the FULL verse or passage in its original language script, complete, not shortened",
    "transliteration": "romanized version if applicable, else null",
    "hindi_translation": "accurate, complete Hindi translation of the full verse (not a summary)",
    "english_translation": "accurate, complete English translation of the full verse (not a summary)",
    "reference": "human-readable citation, e.g. 'Bhagavad Gita 2.47' or 'John 3:16-17'"
  },
  "context": "1-2 sentences explaining what this verse traditionally means",
  "application": {
    "reframe": "a short mindset shift relevant to the user's problem (1-2 sentences)",
    "action_steps": ["concrete step 1", "concrete step 2"]
  },
  "disclaimer": "This is an AI-generated interpretation. Please verify with original scripture or a trusted teacher."
}`;
}

// Rebuilds "reference" from book/chapter/verse_number whenever all three are
// present, so the citation text on screen can never disagree with the
// "Ch X · Verse Y" badge — even if the model's own "reference" string drifted
// or had commentary baked into it.
function normalizeVerse(verse, fallbackBook) {
  const book = (verse.book || fallbackBook || "").trim();
  const chapter = verse.chapter != null ? String(verse.chapter).trim() : "";
  const verseNumber = verse.verse_number != null ? String(verse.verse_number).trim() : "";

  if (book && chapter && verseNumber) {
    verse.reference = `${book} ${chapter}.${verseNumber}`;
  }

  if (verse.hindi_translation && verse.original_script && verse.hindi_translation.trim() === verse.original_script.trim()) {
    // Model dumped the original into both fields - better to show nothing
    // than to mislabel the original verse as a "Hindi translation".
    verse.hindi_translation = null;
  }
}

router.post("/guidance", async (req, res) => {
  const { problem, religion } = req.body;

  if (!problem || typeof problem !== "string" || !problem.trim()) {
    return res.status(400).json({ error: "Please describe what's on your mind." });
  }

  const religionKey = (religion || "").toLowerCase();
  const religionData = RELIGIONS[religionKey];

  if (!religionData) {
    return res.status(400).json({ error: "Please select a valid tradition." });
  }

  const prompt = buildPrompt(religionData.name, religionData.scripture, problem.trim());

  try {
    const { rawText, providerUsed } = await callWithFallback(prompt);

    if (!rawText) {
      return res.status(502).json({ error: "No response received. Please try again." });
    }

    const cleaned = rawText.replace(/```json|```/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("JSON parse failure:", cleaned);
      return res.status(502).json({ error: "Something went wrong understanding the response. Please try again." });
    }

    console.log(`Guidance served via ${providerUsed}`);

    if (parsed.verse) {
      normalizeVerse(parsed.verse, religionData.name);
    }

    return res.json({
      religion: religionData.name,
      religionKey,
      ...parsed
    });
  } catch (err) {
    console.error("Guidance route error:", err.message);
    return res.status(502).json({ error: "The guidance service is temporarily unavailable. Please try again." });
  }
});

// --- AICredits provider ---------------------------------------------------
// Single provider: AICredits OpenAI-compatible API using Gemini 2.5 Flash-Lite.
// Put only AICREDITS_API_KEY in backend/.env. You can override the model/base URL
// via AICREDITS_MODEL / AICREDITS_BASE_URL if needed.
const AICREDITS_MODEL = process.env.AICREDITS_MODEL || "google/gemini-2.5-flash-lite";
const AICREDITS_BASE_URL = (process.env.AICREDITS_BASE_URL || "https://api.aicredits.in/v1").replace(/\/$/, "");
const PER_ATTEMPT_TIMEOUT_MS = 30000;

async function callWithFallback(prompt) {
  if (!process.env.AICREDITS_API_KEY) {
    throw new Error("AICREDITS_API_KEY is not configured in backend/.env.");
  }

  const rawText = await callAICredits(AICREDITS_MODEL, prompt);
  if (!rawText) throw new Error("AICredits returned an empty response.");

  return {
    rawText,
    providerUsed: `aicredits:${AICREDITS_MODEL}`
  };
}

function withTimeout(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function callAICredits(model, prompt) {
  const { signal, clear } = withTimeout(PER_ATTEMPT_TIMEOUT_MS);
  try {
    const apiRes = await fetch(`${AICREDITS_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.AICREDITS_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTIONS },
          { role: "user", content: prompt }
        ],
        temperature: 0,
        max_tokens: 1800,
        response_format: { type: "json_object" }
      }),
      signal
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      const err = new Error(`AICredits HTTP ${apiRes.status}: ${errText}`);
      err.status = apiRes.status;
      throw err;
    }

    const data = await apiRes.json();
    return data?.choices?.[0]?.message?.content;
  } finally {
    clear();
  }
}

module.exports = router;
