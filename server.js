require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// --- Middleware ---
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(express.json());

// --- Load static data ---
const eroOffices = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'ero-offices.json'), 'utf8'));
const locales = {};
['en', 'ta', 'hi'].forEach(lang => {
  locales[lang] = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'i18n', `${lang}.json`), 'utf8'));
});

// --- Gemini setup ---
let genAI, geminiModel;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

const SYSTEM_PROMPT = `You are Election Sahayak, an AI assistant specializing in Indian electoral processes.
You provide accurate, helpful information about:
- Voter registration (Form 6, Form 8A, NVSP portal at voters.eci.gov.in)
- Electoral Registration Officers (EROs) and their roles
- Election Commission of India (ECI) rules and procedures
- Polling day procedures and protocols
- EVM (Electronic Voting Machine) and VVPAT usage
- Voter ID (EPIC) cards — applying, corrections, duplicates
- Address changes, name corrections, and transfers
- Overseas voter registration (Form 6A)
- Age eligibility and qualifying dates

Guidelines:
- Always cite official sources: ECI (eci.gov.in), NVSP (voters.eci.gov.in)
- If unsure, direct users to their local ERO or the NVSP helpline 1950
- Never provide legal advice or predict election outcomes
- Be concise, actionable, and friendly
- When the user context indicates age < 18, focus on civic education
- Format responses with bullet points and bold text for readability using markdown`;

// --- API Routes ---

// i18n locale endpoint
app.get('/api/locale/:lang', (req, res) => {
  const lang = req.params.lang;
  if (locales[lang]) {
    res.json(locales[lang]);
  } else {
    res.status(404).json({ error: 'Language not supported' });
  }
});

// ERO search endpoint
app.get('/api/ero', (req, res) => {
  const pincode = req.query.pincode;
  if (!pincode) {
    return res.status(400).json({ error: 'pincode query parameter is required' });
  }
  // Exact match first
  let results = eroOffices.filter(o => o.pincode === pincode);
  // Prefix match fallback (same area)
  if (results.length === 0) {
    const prefix = pincode.substring(0, 3);
    results = eroOffices.filter(o => o.pincode.startsWith(prefix));
  }
  res.json({ offices: results, source: results.length > 0 ? 'static' : 'none' });
});

// ERO search with Gemini fallback
app.post('/api/ero/search', async (req, res) => {
  const { pincode } = req.body;
  if (!pincode) {
    return res.status(400).json({ error: 'pincode is required' });
  }

  // Try static data first
  let results = eroOffices.filter(o => o.pincode === pincode);
  if (results.length === 0) {
    const prefix = pincode.substring(0, 3);
    results = eroOffices.filter(o => o.pincode.startsWith(prefix));
  }

  if (results.length > 0) {
    return res.json({ offices: results, source: 'static' });
  }

  // Gemini fallback
  if (!geminiModel) {
    return res.json({ offices: [], source: 'none', message: 'No data available for this PIN code. Please visit voters.eci.gov.in for more information.' });
  }

  try {
    const prompt = `For Indian PIN code ${pincode}, provide the nearest Electoral Registration Office (ERO) details. Return ONLY a JSON array with objects containing: name, address, pincode, district, phone. If you don't know exact details, provide the District Collectorate/Tahsildar office as the ERO. Return 1-3 results maximum. Return ONLY valid JSON, no markdown.`;
    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text().trim();
    // Try to parse Gemini's response as JSON
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const aiOffices = JSON.parse(cleaned);
    res.json({ offices: aiOffices, source: 'ai' });
  } catch (err) {
    console.error('Gemini ERO fallback error:', err.message);
    res.json({ offices: [], source: 'none', message: 'Could not find ERO data. Visit voters.eci.gov.in' });
  }
});

// Chat endpoint (Gemini)
app.post('/api/chat', async (req, res) => {
  const { message, history, persona, language } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  if (!geminiModel) {
    return res.status(503).json({ error: 'AI service not configured. Please set GEMINI_API_KEY.' });
  }

  try {
    const personaContext = persona
      ? `\nUser context: Age: ${persona.age || 'unknown'}, Registration Status: ${persona.status || 'unknown'}`
      : '';

    const chatHistory = (history || []).map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }));

    const chat = geminiModel.startChat({
      history: chatHistory,
      systemInstruction: SYSTEM_PROMPT + personaContext
    });

    const result = await chat.sendMessage(message);
    let responseText = result.response.text();

    // Translate if needed
    let translatedText = null;
    if (language && language !== 'en' && process.env.GOOGLE_TRANSLATE_API_KEY) {
      try {
        translatedText = await translateText(responseText, language);
      } catch (err) {
        console.error('Translation error:', err.message);
      }
    }

    res.json({
      response: responseText,
      translatedResponse: translatedText
    });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Translation endpoint
app.post('/api/translate', async (req, res) => {
  const { text, target } = req.body;
  if (!text || !target) {
    return res.status(400).json({ error: 'text and target language are required' });
  }

  if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
    return res.status(503).json({ error: 'Translation service not configured' });
  }

  try {
    const translated = await translateText(text, target);
    res.json({ translatedText: translated });
  } catch (err) {
    console.error('Translation error:', err.message);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// Google Cloud Translation helper
async function translateText(text, targetLang) {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, target: targetLang, source: 'en', format: 'text' })
  });
  const data = await response.json();
  if (data.data && data.data.translations) {
    return data.data.translations[0].translatedText;
  }
  throw new Error('Translation API returned unexpected format');
}

// Client config endpoint (safely exposes Maps API key)
app.get('/api/config', (req, res) => {
  res.json({
    mapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    hasTranslation: !!process.env.GOOGLE_TRANSLATE_API_KEY,
    hasGemini: !!process.env.GEMINI_API_KEY
  });
});

// --- Static files ---
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`🗳️  Election Sahayak running on port ${PORT}`);
  console.log(`   Gemini: ${geminiModel ? '✅ Connected' : '❌ No API key'}`);
  console.log(`   Maps: ${process.env.GOOGLE_MAPS_API_KEY ? '✅ Configured' : '❌ No API key'}`);
  console.log(`   Translate: ${process.env.GOOGLE_TRANSLATE_API_KEY ? '✅ Configured' : '❌ No API key'}`);
});
