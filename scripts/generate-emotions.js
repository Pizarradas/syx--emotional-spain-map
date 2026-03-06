// ================================================
// generate-emotions.js
// ================================================
// Emotional Spain Map — News Pipeline
// ================================================
// Phase 1: Fetch Google News RSS per city
// Phase 2: Parse headlines
// Phase 3: Classify emotional tone via keyword matching
// Phase 4: Aggregate emotion counts per city
// Phase 5: Write data/emotions-spain.json
// ================================================
// Usage: node scripts/generate-emotions.js
// ================================================

"use strict";

const RSSParser = require("rss-parser");
const fs = require("fs");
const path = require("path");

const parser = new RSSParser({
  timeout: 10000,
  headers: {
    "User-Agent": "Mozilla/5.0 (EmotionalSpainMap/1.0)",
  },
});

// ================================================
// CITY LIST (from data/cities-spain.json)
// ================================================
const CITIES_PATH = path.join(__dirname, "..", "data", "cities-spain.json");
const OUTPUT_PATH = path.join(__dirname, "..", "data", "emotions-spain.json");

// ================================================
// EMOTION KEYWORD CLASSIFIER
// Spanish keywords mapped to 6 emotion categories
// ================================================
const EMOTION_KEYWORDS = {
  anger: [
    "protesta",
    "protestas",
    "huelga",
    "huelgas",
    "manifestación",
    "manifestaciones",
    "incendio",
    "asesinato",
    "asesinatos",
    "violencia",
    "ataque",
    "ataques",
    "crisis",
    "enfado",
    "indignación",
    "furia",
    "disturbios",
    "corte",
    "bloqueo",
    "enfrentamiento",
    "pelea",
    "agresión",
    "agresiones",
    "conflicto",
    "controversia",
    "denuncia",
    "denuncias",
    "rechazo",
    "insurrección",
    "revuelta",
    "quema",
    "destrucción",
    "caos",
    "agricultores",
    "cortan",
    "autovía",
    "protestan",
    "exigen",
  ],
  sadness: [
    "fallece",
    "fallecen",
    "fallecido",
    "muere",
    "mueren",
    "muerte",
    "muertes",
    "tristeza",
    "duelo",
    "luto",
    "víctima",
    "víctimas",
    "accidente",
    "accidentes",
    "tragedia",
    "pérdida",
    "pérdidas",
    "funeral",
    "funerales",
    "desgracia",
    "dolor",
    "sufrimiento",
    "herido",
    "heridos",
    "grave",
    "fallecimiento",
    "cierre",
    "despidos",
    "desempleo",
    "paro",
    "precariedad",
    "pobreza",
    "crisis",
    "colapso",
    "hundimiento",
    "desaparece",
    "cae",
    "declive",
  ],
  fear: [
    "alerta",
    "alertas",
    "emergencia",
    "emergencias",
    "amenaza",
    "amenazas",
    "riesgo",
    "riesgos",
    "peligro",
    "peligros",
    "terremoto",
    "terremotos",
    "tormenta",
    "tormentas",
    "inundación",
    "inundaciones",
    "evacuación",
    "evacuaciones",
    "catástrofe",
    "desastre",
    "pánico",
    "susto",
    "contagio",
    "brote",
    "epidemia",
    "pandemia",
    "virus",
    "incendio forestal",
    "deslizamiento",
    "derrumbe",
    "explosion",
    "explosión",
    "terrorismo",
    "meteoro",
    "meteorológica",
    "aviso",
    "avisos",
    "climatología extrema",
  ],
  joy: [
    "récord",
    "récords",
    "celebración",
    "celebraciones",
    "éxito",
    "éxitos",
    "campeón",
    "campeones",
    "ganó",
    "gana",
    "ganan",
    "victoria",
    "victorias",
    "fiesta",
    "fiestas",
    "alegría",
    "felicidad",
    "boda",
    "bodas",
    "premio",
    "premios",
    "logro",
    "logros",
    "triunfo",
    "triunfos",
    "histórico",
    "bate récord",
    "medalla",
    "medallas",
    "clasificación",
    "ascenso",
    "aprobación",
    "inauguración",
    "apertura",
    "nuevo parque",
    "nuevo centro",
    "vacaciones",
    "turismo récord",
    "visitantes récord",
    "gana la copa",
    "copa del rey",
    "liga",
    "campeonato",
    "palmarés",
    "crecimiento",
  ],
  surprise: [
    "sorpresa",
    "sorprendente",
    "inesperado",
    "inesperada",
    "histórico",
    "histórica",
    "nunca visto",
    "sin precedentes",
    "viral",
    "espectacular",
    "insólito",
    "impactante",
    "descubren",
    "descubrimiento",
    "hallazgo",
    "revelación",
    "primera vez",
    "récord absoluto",
    "imprevisto",
    "giro",
    "vuelta de tuerca",
    "bombazo",
    "exclusiva",
    "filtración",
    "filtran",
    "loteríaa",
    "lotería",
    "primer premio",
    "gordo",
    "premio arqueológico",
    "hallazgo arqueológico",
    "innovación",
    "invento",
    "inesperado giro",
    "acontecimiento histórico",
  ],
  disgust: [
    "escándalo",
    "escándalos",
    "corrupción",
    "fraude",
    "fraudes",
    "vergüenza",
    "repugnante",
    "basura",
    "asco",
    "soborno",
    "sobornos",
    "malversación",
    "negligencia",
    "negligencias",
    "enchufismo",
    "trama",
    "trama de corrupción",
    "irregular",
    "irregularidades",
    "acusado",
    "acusados",
    "imputado",
    "imputados",
    "abuso",
    "abusos",
    "explotación",
    "engaño",
    "engaños",
    "mentira",
    "mentiras",
    "traición",
    "traiciones",
    "defraudar",
    "estafa",
    "estafas",
    "prevaricación",
    "salpica",
    "investigan",
    "juzgado",
    "condena",
    "condenado",
    "pederastia",
  ],
};

// Emoji per emotion
const EMOTION_EMOJI = {
  anger: "😡",
  sadness: "😢",
  fear: "😱",
  joy: "😀",
  surprise: "😲",
  disgust: "🤢",
  neutral: "😐",
};

// ================================================
// CLASSIFY — keyword matching per headline
// Returns the emotion name or 'neutral'
// ================================================
function classifyEmotion(text) {
  const lowerText = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // strip accents for broader matching

  const scores = {};

  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    scores[emotion] = 0;
    for (const keyword of keywords) {
      const normalized = keyword
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      if (lowerText.includes(normalized)) {
        scores[emotion]++;
      }
    }
  }

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return "neutral";

  return Object.entries(scores).find(([, score]) => score === maxScore)[0];
}

// ================================================
// FETCH RSS — single city
// ================================================
async function fetchCityNews(city) {
  const query = encodeURIComponent(city);
  const url = `https://news.google.com/rss/search?q=${query}&hl=es&gl=ES&ceid=ES:es`;

  try {
    const feed = await parser.parseURL(url);
    const headlines = feed.items
      .map((item) => item.title || "")
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i) // deduplicate
      .slice(0, 15); // max 15 headlines per city

    return headlines;
  } catch (err) {
    console.warn(`⚠️  [${city}] RSS fetch failed: ${err.message}`);
    return [];
  }
}

// ================================================
// AGGREGATE — pick dominant emotion for a city
// ================================================
function aggregateEmotions(headlines) {
  if (headlines.length === 0)
    return {
      emotion: "neutral",
      headline: "Sin noticias disponibles",
      source: "N/A",
    };

  const scores = {
    anger: 0,
    sadness: 0,
    fear: 0,
    joy: 0,
    surprise: 0,
    disgust: 0,
    neutral: 0,
  };
  const headlineByEmotion = {};

  for (const headline of headlines) {
    const emotion = classifyEmotion(headline);
    scores[emotion]++;
    if (!headlineByEmotion[emotion]) {
      headlineByEmotion[emotion] = headline;
    }
  }

  // Remove 'neutral' from competition unless it's the only option
  const nonNeutralScores = { ...scores };
  delete nonNeutralScores.neutral;
  const maxNonNeutralScore = Math.max(...Object.values(nonNeutralScores));

  let dominantEmotion;
  if (maxNonNeutralScore > 0) {
    dominantEmotion = Object.entries(nonNeutralScores).find(
      ([, s]) => s === maxNonNeutralScore,
    )[0];
  } else {
    dominantEmotion = "neutral";
  }

  return {
    emotion: dominantEmotion,
    headline: headlineByEmotion[dominantEmotion] || headlines[0],
    source: "Google News",
  };
}

// ================================================
// MAIN — orchestrate pipeline
// ================================================
async function generateEmotions() {
  console.log("🗺️  Emotional Spain Map — News Pipeline");
  console.log("========================================");

  // Load city list
  const cities = JSON.parse(fs.readFileSync(CITIES_PATH, "utf-8"));
  console.log(`📍 Processing ${cities.length} cities...\n`);

  const results = [];

  for (const cityObj of cities) {
    const { city } = cityObj;
    process.stdout.write(`  Fetching [${city}]... `);

    const headlines = await fetchCityNews(city);
    const { emotion, headline, source } = aggregateEmotions(headlines);

    console.log(
      `${EMOTION_EMOJI[emotion]} ${emotion} (${headlines.length} headlines)`,
    );

    results.push({
      city,
      emotion,
      emoji: EMOTION_EMOJI[emotion],
      headline,
      source,
    });

    // Brief delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  // Write output
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), "utf-8");

  console.log("\n✅ emotions-spain.json generated successfully!");
  console.log(`📄 Output: ${OUTPUT_PATH}`);
  console.log("");
  console.log("Emotion distribution:");
  const dist = results.reduce((acc, r) => {
    acc[r.emotion] = (acc[r.emotion] || 0) + 1;
    return acc;
  }, {});
  Object.entries(dist).forEach(([e, count]) => {
    console.log(`   ${EMOTION_EMOJI[e]} ${e}: ${count} cities`);
  });
}

generateEmotions().catch((err) => {
  console.error("❌ Pipeline failed:", err.message);
  process.exit(1);
});
