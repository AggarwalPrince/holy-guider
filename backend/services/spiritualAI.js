/**
 * Spiritual AI Guidance Service
 * Supports:
 * 1. AICredits (OpenAI-compatible endpoint at https://api.aicredits.in/v1 with google/gemini-2.5-flash-lite)
 * 2. Google Gemini API (GEMINI_API_KEY)
 * 3. Free Local Wisdom Knowledge Engine (Fallback when no key is configured)
 */

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
- Give the COMPLETE verse or passage, not a shortened fragment or a single clause pulled out of context.
- "original_script" must always contain the verse in its genuine original language and script
  (Sanskrit/Devanagari for the Gita, Pali for the Dhammapada, Classical Arabic for the Quran,
  Hebrew for the Torah/Tanakh, Koine Greek or Hebrew for Bible passages, Gurmukhi for the Guru
  Granth Sahib, Classical Chinese for the Tao Te Ching, etc.). Never leave it blank.
- "hindi_translation" must be an actual Hindi translation, written in Devanagari Hindi prose — NOT
  a copy of "original_script".
- Keep translations faithful, complete, and neutral in tone.
- Practical advice must be gentle, non-judgmental, and actionable.
- Respond ONLY with valid JSON. No markdown, no preamble, no backticks.`;

function buildPrompt(religionName, scriptureName, userInput) {
  return `Religion: ${religionName}
Primary scripture: ${scriptureName}
User's problem/emotion: "${userInput}"

Provide guidance in this exact JSON structure:
{
  "verse": {
    "book": "name of the book/section within the scripture",
    "chapter": "chapter number as a string",
    "verse_number": "verse number or range as a string",
    "original_script": "the FULL verse or passage in its original language script",
    "transliteration": "romanized version if applicable, else null",
    "hindi_translation": "accurate, complete Hindi translation of the full verse",
    "english_translation": "accurate, complete English translation of the full verse",
    "reference": "human-readable citation, e.g. 'Bhagavad Gita 2.47'"
  },
  "context": "1-2 sentences explaining what this verse traditionally means",
  "application": {
    "reframe": "a short mindset shift relevant to the user's problem (1-2 sentences)",
    "action_steps": ["concrete step 1", "concrete step 2"]
  },
  "disclaimer": "This is an AI-generated interpretation. Please verify with original scripture or a trusted teacher."
}`;
}

const LOCAL_FALLBACK_VERSES = {
  hinduism: {
    verse: {
      book: "Bhagavad Gita",
      chapter: "2",
      verse_number: "47",
      original_script: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
      transliteration: "karmaṇy-evādhikāras te mā phaleṣu kadācana | mā karma-phala-hetur bhūr mā te saṅgo 'stv akarmaṇi",
      hindi_translation: "कर्म करने में ही तुम्हारा अधिकार है, उसके फलों में कभी नहीं। इसलिए कर्म के फल की चिंता मत करो और न ही कर्म त्यागने का विचार करो।",
      english_translation: "You have a right to perform your prescribed duty, but you are not entitled to the fruits of action. Never consider yourself the cause of the results of your activities, and never be attached to inaction.",
      reference: "The Bhagavad Gita 2.47",
    },
    context: "Spoken by Sri Krishna to Arjuna on the battlefield of Kurukshetra when overwhelmed by anxiety about outcomes.",
    application: {
      reframe: "Focus your energy on the actions within your hands right now, letting go of obsessive worry about future outcomes.",
      action_steps: [
        "Dedicate your present work with wholehearted devotion without checking metrics or outcome expectations.",
        "Take 5 minutes of mindful breath awareness whenever your mind starts racing into the future."
      ]
    },
    disclaimer: "This is sacred spiritual reflection. Please verify with authentic scripture or trusted teachers."
  },
  buddhism: {
    verse: {
      book: "Dhammapada",
      chapter: "1",
      verse_number: "1-2",
      original_script: "मनोपुब्बङ्गमा धम्मा मनोसेट्ठा मनोमया। मनसा चे पदुट्ठेन भासति वा करोति वा। ततो नं दुक्खमन्वेति चक्कंव वहतो पदं॥",
      transliteration: "manopubbaṅgamā dhammā manoseṭṭhā manomayā | manasā ce paduṭṭhena bhāsati vā karoti vā | tato naṁ dukkhamanveti cakkaṁva vahato padaṁ",
      hindi_translation: "मन सभी प्रवृत्तियों का अगुआ है, मन ही प्रधान है, सब कुछ मनोमय है। यदि कोई दूषित मन से बोलता या कर्म करता है, तो दुःख उसका उसी तरह अनुसरण करता है जैसे बैल के पैर के पीछे गाड़ी का पहिया।",
      english_translation: "Mind precedes all mental states. Mind is their chief; they are all mind-wrought. If with an impure mind a person speaks or acts, suffering follows him like the wheel that follows the foot of the ox.",
      reference: "The Dhammapada 1.1",
    },
    context: "The Buddha's fundamental teaching on how consciousness and mental intention shape our experiential reality.",
    application: {
      reframe: "Notice the internal quality of your thought before acting. A serene mind naturally invites peace into outer circumstances.",
      action_steps: [
        "Pause and take three calm breaths before reacting to frustrating situations.",
        "Observe turbulent thoughts like passing clouds without clinging to them."
      ]
    },
    disclaimer: "This is sacred spiritual reflection. Please verify with authentic scripture or trusted teachers."
  }
};

async function generateSpiritualGuidance(question, religionKey = "hinduism") {
  const normKey = (religionKey || "hinduism").toLowerCase();
  const religionData = RELIGIONS[normKey] || RELIGIONS.hinduism;

  const aicreditsKey = process.env.AICREDITS_API_KEY;
  const baseUrl = (process.env.AICREDITS_BASE_URL || "https://api.aicredits.in/v1").replace(/\/$/, "");
  const model = process.env.AICREDITS_MODEL || "google/gemini-2.5-flash-lite";

  // 1. If AICredits API Key is provided, call AICredits API
  if (aicreditsKey && !aicreditsKey.includes("PASTE_YOUR")) {
    console.log(`🚀 [SpiritualAI] Calling AICredits API (${baseUrl}) with model '${model}' for ${religionData.name}...`);
    try {
      const prompt = buildPrompt(religionData.name, religionData.scripture, question);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25000);

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${aicreditsKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTIONS },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 1800,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errText = await response.text();
        console.error(`❌ [SpiritualAI] AICredits API HTTP ${response.status}: ${errText}`);
        throw new Error(`AICredits HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;

      if (content) {
        const cleaned = content.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        console.log(`✅ [SpiritualAI] Successfully received guidance from AICredits! (Billed to your AICredits account)`);
        return {
          religion: religionData.name,
          religionKey: normKey,
          ...parsed,
          provider: `aicredits:${model}`,
        };
      }
    } catch (err) {
      console.warn(`⚠️ [SpiritualAI] AICredits API call failed (${err.message}). Falling back to local scripture wisdom.`);
    }
  } else {
    console.log(`💡 [SpiritualAI] AICREDITS_API_KEY is empty in backend/.env. Using free local scripture knowledge (No API cost).`);
  }

  // 2. Free Local Knowledge Fallback
  const fallback = LOCAL_FALLBACK_VERSES[normKey] || LOCAL_FALLBACK_VERSES.hinduism;
  return {
    religion: religionData.name,
    religionKey: normKey,
    verse: fallback.verse,
    context: fallback.context,
    application: {
      reframe: `Regarding "${question.slice(0, 70)}...": ${fallback.application.reframe}`,
      action_steps: fallback.application.action_steps,
    },
    disclaimer: fallback.disclaimer,
    provider: "local-wisdom-engine:free",
  };
}

module.exports = {
  generateSpiritualGuidance,
  RELIGIONS,
};
