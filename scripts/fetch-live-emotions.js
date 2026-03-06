// ================================================
// fetch-live-emotions.js
// ================================================
// Browser-side live RSS feed fetcher for Emotional Spain Map
// ================================================
// Strategy (optimized latency):
//   1. Check localStorage cache (TTL: 30 min) → skip fetch if fresh
//   2. Launch all 10 city fetches IN PARALLEL via corsproxy.io
//   3. Classify each city as promises resolve (progressive)
//   4. Dispatch 'emotionsUpdated' event after each city resolves
//   5. Persist to localStorage on completion
// ================================================

'use strict';

(function LiveEmotionsFetcher() {

  // ── CONFIG ──────────────────────────────────────
  const CACHE_KEY   = 'emotional-map-cache';
  const CACHE_TTL   = 30 * 60 * 1000; // 30 minutes
  const PROXY       = 'https://corsproxy.io/?url=';
  const MAX_ITEMS   = 12; // headlines per city to score against

  // ── EMOTION KEYWORDS (Spanish) ──────────────────
  const EMOTION_KEYWORDS = {
    anger:    ['protesta','protestas','huelga','huelgas','manifestación','manifestaciones','incendio','asesinato','violencia','ataque','enfado','indignación','furia','disturbios','bloqueo','enfrentamiento','agresión','conflicto','denuncia','rechazo','revuelta','agricultores','cortan','protestan','exigen','crisis','incumplimiento'],
    sadness:  ['fallece','fallecen','fallecido','muere','mueren','muerte','muertes','tristeza','duelo','luto','víctima','víctimas','accidente','tragedia','pérdida','funeral','desgracia','dolor','sufrimiento','herido','heridos','cierre','despidos','desempleo','paro','precariedad','pobreza','colapso','hundimiento','desaparece','cae','declive'],
    fear:     ['alerta','alertas','emergencia','emergencias','amenaza','amenazas','riesgo','peligro','terremoto','tormenta','tormentas','inundación','evacuación','catástrofe','desastre','pánico','contagio','brote','epidemia','pandemia','virus','explosión','terrorismo','aviso','avisos','climatología extrema','deslizamiento','derrumbe'],
    joy:      ['récord','celebración','éxito','campeón','campeones','ganó','gana','ganan','victoria','fiesta','alegría','felicidad','boda','premio','logro','triunfo','histórico','medalla','ascenso','inauguración','apertura','turismo récord','copa','liga','campeonato','crecimiento','aprobado','nuevo parque','batió'],
    surprise: ['sorpresa','sorprendente','inesperado','nunca visto','sin precedentes','viral','espectacular','insólito','impactante','descubren','descubrimiento','hallazgo','revelación','primera vez','récord absoluto','imprevisto','bombazo','filtración','lotería','primer premio','gordo','innovación','invento','acontecimiento histórico'],
    disgust:  ['escándalo','escándalos','corrupción','fraude','fraudes','vergüenza','repugnante','basura','soborno','malversación','negligencia','enchufismo','trama','irregular','irregularidades','acusado','imputado','abuso','explotación','engaño','mentira','traición','estafa','prevaricación','salpica','investigan','juzgado','condena','condenado']
  };

  const EMOTION_EMOJI = {
    anger:'😡', sadness:'😢', fear:'😱', joy:'😀', surprise:'😲', disgust:'🤢', neutral:'😐'
  };

  // ── CACHE ────────────────────────────────────────
  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { data, timestamp } = JSON.parse(raw);
      if (Date.now() - timestamp < CACHE_TTL) return data;
    } catch (_) { /* ignore */ }
    return null;
  }

  function writeCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (_) { /* quota exceeded — skip */ }
  }

  // ── DATE FORMATTING ──────────────────────────────
  function formatDate(pubDateStr) {
    if (!pubDateStr) return null;
    try {
      const d = new Date(pubDateStr);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('es-ES', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (_) {
      return null;
    }
  }

  // ── CLASSIFIER ───────────────────────────────────
  function classifyEmotion(text) {
    const norm = text.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const scores = {};
    for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
      scores[emotion] = 0;
      for (const kw of keywords) {
        const normKw = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (norm.includes(normKw)) scores[emotion]++;
      }
    }

    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return 'neutral';
    return Object.entries(scores).find(([, s]) => s === maxScore)[0];
  }

  // ── RSS PARSER (browser DOMParser) ───────────────
  function parseRSS(xmlText) {
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
    const items = [...doc.querySelectorAll('item')].slice(0, MAX_ITEMS);
    return items.map(item => {
      // Google News wraps real link inside <guid> or as first <a> in description
      let link = item.querySelector('link')?.textContent?.trim() ||
                 item.querySelector('guid')?.textContent?.trim() || '';
      // Google RSS: link is the text node AFTER <link> (not inside it)
      if (!link) {
        const linkNode = item.querySelector('link');
        if (linkNode) link = linkNode.nextSibling?.nodeValue?.trim() || '';
      }
      return {
        title:   item.querySelector('title')?.textContent?.trim() || '',
        link:    link,
        pubDate: item.querySelector('pubDate')?.textContent?.trim() || null
      };
    }).filter(i => i.title);
  }

  // ── AGGREGATE ────────────────────────────────────
  function aggregateCity(city, items) {
    if (!items.length) return null;

    const scores = { anger:0, sadness:0, fear:0, joy:0, surprise:0, disgust:0, neutral:0 };
    const topByEmotion = {};

    for (const item of items) {
      const emotion = classifyEmotion(item.title);
      scores[emotion]++;
      if (!topByEmotion[emotion]) topByEmotion[emotion] = item;
    }

    // Prefer non-neutral
    const nonNeutral = { ...scores };
    delete nonNeutral.neutral;
    const maxNNScore = Math.max(...Object.values(nonNeutral));
    const dominant = maxNNScore > 0
      ? Object.entries(nonNeutral).find(([, s]) => s === maxNNScore)[0]
      : 'neutral';

    const winner = topByEmotion[dominant] || items[0];

    return {
      city,
      emotion:  dominant,
      emoji:    EMOTION_EMOJI[dominant],
      headline: winner.title,
      link:     winner.link || null,
      pubDate:  formatDate(winner.pubDate),
      source:   'Google News'
    };
  }

  // ── FETCH ONE CITY ───────────────────────────────
  async function fetchCity(cityName) {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(cityName + ' España')}&hl=es&gl=ES&ceid=ES:es`;
    const proxyUrl = PROXY + encodeURIComponent(rssUrl);

    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const items = parseRSS(text);
    return aggregateCity(cityName, items);
  }

  // ── DISPATCH UPDATE ──────────────────────────────
  function dispatchUpdate(cityResult) {
    // Merge into global
    const idx = window.EMOTIONS_SPAIN.findIndex(e => e.city === cityResult.city);
    if (idx >= 0) {
      window.EMOTIONS_SPAIN[idx] = cityResult;
    } else {
      window.EMOTIONS_SPAIN.push(cityResult);
    }
    // Notify map to refresh this city's marker + popup
    window.dispatchEvent(new CustomEvent('emotionCityUpdated', { detail: cityResult }));
  }

  // ── MAIN ─────────────────────────────────────────
  async function fetchLiveEmotions() {
    // 1. Serve from cache if fresh
    const cached = readCache();
    if (cached) {
      console.log('🗂️ [EmotionsFetcher] Using cached data');
      window.EMOTIONS_SPAIN = cached;
      window.dispatchEvent(new CustomEvent('emotionsUpdated', { detail: cached }));
      return;
    }

    console.log('🌐 [EmotionsFetcher] Fetching live RSS (parallel)...');
    window.dispatchEvent(new CustomEvent('emotionsFetchStart'));

    const cities = (window.CITIES_SPAIN || []).map(c => c.city);
    const results = [];

    // 2. Launch ALL fetches in parallel — fastest wins, update progressively
    const promises = cities.map(cityName =>
      fetchCity(cityName)
        .then(result => {
          if (result) {
            dispatchUpdate(result);
            results.push(result);
          }
        })
        .catch(err => {
          console.warn(`⚠️ [EmotionsFetcher] ${cityName}: ${err.message}`);
        })
    );

    await Promise.allSettled(promises);

    // 3. Persist to cache
    if (results.length > 0) {
      writeCache(window.EMOTIONS_SPAIN);
    }

    window.dispatchEvent(new CustomEvent('emotionsFetchComplete'));
    console.log(`✅ [EmotionsFetcher] Done — ${results.length}/${cities.length} cities updated`);
  }

  // Start after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchLiveEmotions);
  } else {
    fetchLiveEmotions();
  }

})();
