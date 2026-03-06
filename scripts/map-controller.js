// ================================================
// map-controller.js
// ================================================
// Emotional Spain Map — Map Controller
// ================================================
// Responsibilities:
//   1. Read pre-loaded global data (no server needed)
//   2. Initialize Leaflet map centered on Spain
//   3. Render city emoji markers
//   4. Marker hover → update body[data-emotion-theme]
//   5. Marker click → open popup
//   6. GSAP animations (hover, popup, ambience)
//   7. Reduced motion support
// ================================================

'use strict';

// Wait for Leaflet + GSAP to load (defer order)
window.addEventListener('load', function initMap() {

  // ================================================
  // REDUCED MOTION CHECK
  // ================================================
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ================================================
  // GSAP HELPERS — safe wrappers
  // ================================================
  function animate(targets, vars) {
    if (prefersReducedMotion) return;
    if (typeof gsap === 'undefined') return;
    gsap.to(targets, vars);
  }


  // ================================================
  // DOM REFERENCES
  // ================================================
  const mapEl = document.getElementById('map');
  const ambienceLayer = document.getElementById('ambienceLayer');
  const loadingEl = document.getElementById('mapLoading');
  const popup = document.getElementById('emotionPopup');
  const popupEmoji = document.getElementById('popupEmoji');
  const popupCity = document.getElementById('popupCity');
  const popupEmotionTag = document.getElementById('popupEmotionTag');
  const popupHeadline = document.getElementById('popupHeadline');
  const popupSource = document.getElementById('popupSource');
  const popupDate = document.getElementById('popupDate');
  const popupDateText = document.getElementById('popupDateText');
  const popupLink = document.getElementById('popupLink');
  const popupClose = document.getElementById('popupClose');
  const statusText = document.getElementById('statusText');
  const liveBadge = document.getElementById('liveBadge');
  const liveBadgeText = document.getElementById('liveBadgeText');

  // ================================================
  // EMOTION METADATA
  // ================================================
  const EMOTION_LABELS = {
    anger:    { es: 'Ira',       en: 'anger'    },
    sadness:  { es: 'Tristeza',  en: 'sadness'  },
    fear:     { es: 'Miedo',     en: 'fear'     },
    joy:      { es: 'Alegría',   en: 'joy'      },
    surprise: { es: 'Sorpresa',  en: 'surprise' },
    disgust:  { es: 'Asco',      en: 'disgust'  },
    neutral:  { es: 'Neutral',   en: 'neutral'  }
  };

  // ================================================
  // GLOBALS: data loaded via <script> tags in index.html
  // No fetch(), no server needed — works with file://
  // emotionByCityMap is kept mutable so live updates can patch it
  // ================================================
  const cities   = window.CITIES_SPAIN   || [];
  const emotions = window.EMOTIONS_SPAIN || [];

  // Index emotions by city name for fast lookup (mutable — updated by live feed)
  const emotionByCityMap = {};
  for (const entry of emotions) {
    emotionByCityMap[entry.city] = entry;
  }

  // Track open popup's city for live refresh
  let openPopupCity = null;

  // ================================================
  // MAP INITIALIZATION
  // ================================================
  const map = L.map('map', {
    center: [40.2, -3.5],
    zoom: 6,
    zoomControl: true,
    attributionControl: true,
    scrollWheelZoom: true,
    keyboard: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 12,
    minZoom: 5
  }).addTo(map);

  // ================================================
  // THEME SWITCHING
  // ================================================
  let currentTheme = 'neutral';
  let ambienceTimeout = null;

  function setEmotionTheme(emotion) {
    if (emotion === currentTheme) return;
    currentTheme = emotion;

    document.body.setAttribute('data-emotion-theme', emotion);

    // Update status display
    const label = EMOTION_LABELS[emotion]?.es || emotion;
    const emoji = emotionByCityMap[lastHoveredCity]?.emoji || '😐';
    if (statusText) {
      statusText.textContent = `${emoji} ${label}`;
    }

    // Ambience layer animation
    if (!prefersReducedMotion && ambienceLayer) {
      clearTimeout(ambienceTimeout);
      ambienceLayer.classList.add('is-active');
      animate(ambienceLayer, {
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out'
      });
    }
  }

  function resetTheme() {
    if (!prefersReducedMotion && ambienceLayer) {
      animate(ambienceLayer, {
        opacity: 0,
        duration: 1.2,
        ease: 'power2.inOut',
        onComplete: () => ambienceLayer.classList.remove('is-active')
      });
    }
    document.body.setAttribute('data-emotion-theme', 'neutral');
    currentTheme = 'neutral';
    if (statusText) statusText.textContent = 'Hover a city';
  }

  // ================================================
  // POPUP MANAGEMENT
  // ================================================
  let popupOpen = false;
  let popupToggleTimeout = null;

  function fillPopupContent(cityData) {
    const emotionEntry = emotionByCityMap[cityData.city] || {
      emotion: 'neutral', emoji: '😐', headline: 'Sin información disponible', source: 'N/A'
    };

    popupEmoji.textContent = emotionEntry.emoji;
    popupCity.textContent = cityData.city;
    popupEmotionTag.textContent = EMOTION_LABELS[emotionEntry.emotion]?.es || emotionEntry.emotion;
    popupHeadline.textContent = emotionEntry.headline;

    // Date
    if (emotionEntry.pubDate && popupDate && popupDateText) {
      popupDateText.textContent = emotionEntry.pubDate;
      popupDate.style.display = 'flex';
    } else if (popupDate) {
      popupDate.style.display = 'none';
    }

    // Article link
    if (emotionEntry.link && popupLink) {
      popupLink.href = emotionEntry.link;
      popupLink.classList.remove('is-hidden');
    } else if (popupLink) {
      popupLink.classList.add('is-hidden');
      popupLink.href = '#';
    }

    // Source (without link — link is now the button)
    if (popupSource) {
      popupSource.innerHTML = `<span aria-hidden="true">📰</span> ${emotionEntry.source || 'Google News'}`;
      if (emotionEntry.link && popupLink) popupSource.appendChild(popupLink);
    }
  }

  function openPopup(cityData) {
    clearTimeout(popupToggleTimeout);
    openPopupCity = cityData.city;

    fillPopupContent(cityData);

    popup.setAttribute('aria-hidden', 'false');
    popup.classList.add('is-open');
    popupOpen = true;

    // GSAP popup entrance
    if (!prefersReducedMotion) {
      gsap.fromTo(popup,
        { y: '120%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 0.5, ease: 'back.out(1.4)' }
      );
    } else {
      popup.style.transform = 'translateX(-50%) translateY(0%)';
      popup.style.opacity = '1';
    }

    popupClose.focus();
  }

  function closePopup() {
    if (!popupOpen) return;

    if (!prefersReducedMotion) {
      gsap.to(popup, {
        y: '120%',
        opacity: 0,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => {
          popup.classList.remove('is-open');
          popup.setAttribute('aria-hidden', 'true');
          popupOpen = false;
        }
      });
    } else {
      popup.style.transform = 'translateX(-50%) translateY(120%)';
      popup.style.opacity = '0';
      popup.classList.remove('is-open');
      popup.setAttribute('aria-hidden', 'true');
      popupOpen = false;
    }
  }

  popupClose.addEventListener('click', closePopup);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && popupOpen) closePopup();
  });

  // ================================================
  // LIVE UPDATE EVENTS (from fetch-live-emotions.js)
  // ================================================

  // Per-city update — refresh emotionByCityMap and open popup if city is visible
  window.addEventListener('emotionCityUpdated', (e) => {
    const city = e.detail;
    if (!city) return;

    // Patch the map
    emotionByCityMap[city.city] = city;

    // If popup is open for this city, silently refresh content
    if (popupOpen && openPopupCity === city.city) {
      fillPopupContent({ city: city.city });
    }

    // Refresh the marker icon for this city (find and re-render)
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        const latlng = layer.getLatLng();
        const cityObj = cities.find(c => c.lat === latlng.lat && c.lng === latlng.lng);
        if (cityObj && cityObj.city === city.city) {
          layer.setIcon(createMarkerIcon(city.city, emotionByCityMap[city.city]));
        }
      }
    });
  });

  // Fetch lifecycle — live badge state
  window.addEventListener('emotionsFetchStart', () => {
    if (liveBadge) { liveBadge.classList.add('is-loading'); }
    if (liveBadgeText) liveBadgeText.textContent = 'Cargando...';
  });

  window.addEventListener('emotionsFetchComplete', () => {
    if (liveBadge) { liveBadge.classList.remove('is-loading'); liveBadge.classList.add('is-live'); }
    if (liveBadgeText) liveBadgeText.textContent = 'Live';
  });

  // If cache was used (no fetch from network), still mark as live
  window.addEventListener('emotionsUpdated', () => {
    if (liveBadge) { liveBadge.classList.add('is-live'); }
    if (liveBadgeText) liveBadgeText.textContent = 'Live';
    // Also repopulate emotionByCityMap from updated global
    for (const entry of window.EMOTIONS_SPAIN) {
      emotionByCityMap[entry.city] = entry;
    }
  });

  // ================================================
  // MARKERS
  // ================================================
  let lastHoveredCity = null;

  function createMarkerIcon(city, emotionEntry) {
    const emoji = emotionEntry?.emoji || '😐';
    const html = `
      <div class="city-marker" tabindex="0" role="button" aria-label="${city}: ${emotionEntry?.emotion || 'neutral'}">
        <span class="city-marker__ring" aria-hidden="true"></span>
        <span class="city-marker__emoji" aria-hidden="true">${emoji}</span>
        <span class="city-marker__label">${city}</span>
      </div>
    `;
    return L.divIcon({
      html,
      className: '',
      iconSize: [60, 60],
      iconAnchor: [30, 42]
    });
  }

  function addMarker(cityData, markerIndex) {
    const { city, lat, lng } = cityData;
    const emotionEntry = emotionByCityMap[city];

    const marker = L.marker([lat, lng], {
      icon: createMarkerIcon(city, emotionEntry),
      keyboard: true,
      title: city,
      alt: `${city}: ${emotionEntry?.emotion || 'neutral'}`
    }).addTo(map);

    // Get the DivIcon container
    let markerEl = null;
    let wiggleTween = null;   // GSAP tween reference for pause/resume
    let wiggleTimer = null;   // delayedCall reference

    // ── ATTENTION WIGGLE LOOP ──
    // GSAP handles rotation+scale only — CSS handles float (y-axis)
    // No conflict, no overwrite.
    function playAttentionWiggle() {
      if (!prefersReducedMotion && markerEl) {
        const emojiEl = markerEl.querySelector('.city-marker__emoji');
        if (!emojiEl) return;

        wiggleTween = gsap.timeline()
          .to(emojiEl, { scale: 1.2, rotation: -10, duration: 0.14, ease: 'power2.out' })
          .to(emojiEl, { rotation: 10,  duration: 0.13, ease: 'power2.inOut' })
          .to(emojiEl, { rotation: -6,  duration: 0.10, ease: 'power2.inOut' })
          .to(emojiEl, { rotation: 3,   duration: 0.09, ease: 'power2.inOut' })
          .to(emojiEl, { rotation: 0, scale: 1, duration: 0.22, ease: 'back.out(2)' })
          .call(() => {
            // Repeat with random delay 4–7s so cities feel alive independently
            wiggleTimer = gsap.delayedCall(4 + Math.random() * 3, playAttentionWiggle);
          });
      } else {
        // Loop even with no animation (so it doesn't stop when motion comes back)
        wiggleTimer = gsap.delayedCall(5, playAttentionWiggle);
      }
    }

    marker.on('add', () => {
      markerEl = marker.getElement();
      if (!prefersReducedMotion) {
        // Stagger start: each city begins at a slightly different time
        gsap.delayedCall(1.5 + markerIndex * 0.45, playAttentionWiggle);
      }
    });

    // ── HOVER — pause wiggle, scale up ──
    marker.on('mouseover', () => {
      lastHoveredCity = city;
      setEmotionTheme(emotionEntry?.emotion || 'neutral');

      if (!prefersReducedMotion && markerEl) {
        const emojiEl = markerEl.querySelector('.city-marker__emoji');
        // Pause the wiggle loop while hovering
        if (wiggleTween) wiggleTween.pause();
        if (wiggleTimer) wiggleTimer.pause();
        if (emojiEl) gsap.to(emojiEl, { scale: 1.35, rotation: 0, duration: 0.22, ease: 'back.out(2)' });
      }
    });

    marker.on('mouseout', () => {
      if (!prefersReducedMotion && markerEl) {
        const emojiEl = markerEl.querySelector('.city-marker__emoji');
        if (emojiEl) gsap.to(emojiEl, { scale: 1, rotation: 0, duration: 0.2, ease: 'power2.out',
          onComplete: () => {
            // Resume the wiggle loop after hover
            if (wiggleTimer) wiggleTimer.resume();
          }
        });
      }

      clearTimeout(ambienceTimeout);
      ambienceTimeout = setTimeout(resetTheme, 1500);
    });

    // ── CLICK ──
    marker.on('click', () => {
      clearTimeout(ambienceTimeout);
      setEmotionTheme(emotionEntry?.emotion || 'neutral');
      openPopup(cityData);
    });

    // ── KEYBOARD ──
    marker.on('keypress', (e) => {
      if (e.originalEvent.key === 'Enter' || e.originalEvent.key === ' ') {
        clearTimeout(ambienceTimeout);
        setEmotionTheme(emotionEntry?.emotion || 'neutral');
        openPopup(cityData);
      }
    });
  }

  // Render all markers
  for (let i = 0; i < cities.length; i++) {
    addMarker(cities[i], i);
  }

  // ================================================
  // MAP CLICK — close popup and reset
  // ================================================
  map.on('click', (e) => {
    // Only reset if click is on the map (not a marker)
    if (e.originalEvent.target === mapEl || e.originalEvent.target.classList.contains('leaflet-tile')) {
      closePopup();
      clearTimeout(ambienceTimeout);
      resetTheme();
    }
  });

  // ================================================
  // HIDE LOADING SCREEN
  // ================================================
  function hideLoading() {
    if (!prefersReducedMotion && loadingEl) {
      animate(loadingEl, {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: () => loadingEl.classList.add('is-hidden')
      });
    } else if (loadingEl) {
      loadingEl.classList.add('is-hidden');
    }
  }

  // Show map after a brief moment for Leaflet to render tiles
  setTimeout(hideLoading, 800);

});
