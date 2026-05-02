/* ========================================
   Election Sahayak — Client Application
   ======================================== */

// --- State ---
const state = {
  age: null,
  status: 'unknown',
  language: 'en',
  locale: {},
  chatHistory: [],
  map: null,
  markers: [],
  config: {}
};

// --- Init ---
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  await loadLocale('en');
  setupListeners();
  renderWelcome();
  addChatWelcome();
});

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    state.config = await res.json();
    if (state.config.hasGemini) document.getElementById('badge-gemini').classList.add('active');
    if (state.config.mapsApiKey) document.getElementById('badge-maps').classList.add('active');
    if (state.config.hasTranslation) document.getElementById('badge-translate').classList.add('active');
  } catch (e) { console.warn('Config load failed:', e); }
}

// --- Event Listeners ---
function setupListeners() {
  document.getElementById('update-btn').addEventListener('click', updateDashboard);
  document.getElementById('lang-select').addEventListener('change', e => loadLocale(e.target.value));
  document.getElementById('chat-fab').addEventListener('click', openChat);
  document.getElementById('chat-close').addEventListener('click', closeChat);
  document.getElementById('chat-overlay').addEventListener('click', closeChat);
  document.getElementById('chat-send').addEventListener('click', sendChat);
  document.getElementById('chat-input').addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });
  document.getElementById('age-input').addEventListener('keydown', e => { if (e.key === 'Enter') updateDashboard(); });
}

// --- i18n ---
async function loadLocale(lang) {
  try {
    const res = await fetch(`/api/locale/${lang}`);
    state.locale = await res.json();
    state.language = lang;
    applyLocale();
    // Re-render current panel
    updateDashboard();
  } catch (e) { console.warn('Locale load failed:', e); }
}

function applyLocale() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = getNestedValue(state.locale, key);
    if (val) el.textContent = val;
  });
}

function t(key) {
  return getNestedValue(state.locale, key) || key;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
}

// --- Dashboard Routing ---
function updateDashboard() {
  const age = parseInt(document.getElementById('age-input').value);
  const status = document.getElementById('status-select').value;
  state.age = isNaN(age) ? null : age;
  state.status = status;

  if (state.age === null || state.status === 'unknown') {
    renderWelcome();
  } else if (state.age < 18) {
    renderCivics();
  } else if (state.status === 'unregistered') {
    renderRegistration();
  } else {
    renderPollingDay();
  }
}

// --- Welcome Panel ---
function renderWelcome() {
  const d = document.getElementById('dashboard');
  d.innerHTML = `
    <div class="panel-header">
      <h2 class="panel-header__title">${t('welcome.title')}</h2>
      <p class="panel-header__subtitle">${t('welcome.description')}</p>
    </div>
    <div class="welcome-grid">
      <div class="glass-card feature-card">
        <span class="feature-card__icon">🎯</span>
        <h3 class="feature-card__title">${t('welcome.f1Title')}</h3>
        <p class="feature-card__desc">${t('welcome.f1Desc')}</p>
      </div>
      <div class="glass-card feature-card">
        <span class="feature-card__icon">🤖</span>
        <h3 class="feature-card__title">${t('welcome.f2Title')}</h3>
        <p class="feature-card__desc">${t('welcome.f2Desc')}</p>
      </div>
      <div class="glass-card feature-card">
        <span class="feature-card__icon">📍</span>
        <h3 class="feature-card__title">${t('welcome.f3Title')}</h3>
        <p class="feature-card__desc">${t('welcome.f3Desc')}</p>
      </div>
      <div class="glass-card feature-card">
        <span class="feature-card__icon">📅</span>
        <h3 class="feature-card__title">${t('welcome.f4Title')}</h3>
        <p class="feature-card__desc">${t('welcome.f4Desc')}</p>
      </div>
    </div>`;
}

// --- Civics 101 Panel (Age < 18) ---
function renderCivics() {
  const yearsLeft = 18 - state.age;
  const monthsLeft = yearsLeft * 12;
  const daysLeft = yearsLeft * 365;

  const countdownHTML = yearsLeft > 0 ? `
    <div class="glass-card">
      <h3 style="color:var(--white);margin-bottom:8px;">${t('civics.eligibilityTitle')}</h3>
      <p style="color:var(--text-muted);margin-bottom:16px;">${t('civics.eligibleIn')}</p>
      <div class="countdown">
        <div class="countdown__unit">
          <div class="countdown__number">${yearsLeft}</div>
          <div class="countdown__label">${t('civics.years')}</div>
        </div>
        <div class="countdown__unit">
          <div class="countdown__number">${monthsLeft}</div>
          <div class="countdown__label">${t('civics.months')}</div>
        </div>
        <div class="countdown__unit">
          <div class="countdown__number">${daysLeft}</div>
          <div class="countdown__label">${t('civics.days')}</div>
        </div>
      </div>
    </div>` : `
    <div class="glass-card" style="text-align:center;">
      <p style="color:var(--green-light);font-size:1.1rem;font-weight:600;">${t('civics.alreadyEligible')}</p>
    </div>`;

  const d = document.getElementById('dashboard');
  d.innerHTML = `
    <div class="panel-header">
      <h2 class="panel-header__title">${t('civics.title')}</h2>
      <p class="panel-header__subtitle">${t('civics.subtitle')}</p>
    </div>
    ${countdownHTML}
    <div class="welcome-grid" style="margin-top:20px;">
      <div class="glass-card feature-card">
        <span class="feature-card__icon">🏛️</span>
        <h3 class="feature-card__title">${t('civics.c1Title')}</h3>
        <p class="feature-card__desc">${t('civics.c1Desc')}</p>
      </div>
      <div class="glass-card feature-card">
        <span class="feature-card__icon">🗳️</span>
        <h3 class="feature-card__title">${t('civics.c2Title')}</h3>
        <p class="feature-card__desc">${t('civics.c2Desc')}</p>
      </div>
      <div class="glass-card feature-card">
        <span class="feature-card__icon">✊</span>
        <h3 class="feature-card__title">${t('civics.c3Title')}</h3>
        <p class="feature-card__desc">${t('civics.c3Desc')}</p>
      </div>
      <div class="glass-card feature-card">
        <span class="feature-card__icon">⚖️</span>
        <h3 class="feature-card__title">${t('civics.c4Title')}</h3>
        <p class="feature-card__desc">${t('civics.c4Desc')}</p>
      </div>
    </div>
    <div class="glass-card" style="margin-top:20px;">
      <h3 style="color:var(--white);margin-bottom:8px;">${t('civics.prepTitle')}</h3>
      <p style="color:var(--text-muted);margin-bottom:12px;">${t('civics.prepDesc')}</p>
      <ul class="doc-list">
        <li>${t('civics.doc1')}</li>
        <li>${t('civics.doc2')}</li>
        <li>${t('civics.doc3')}</li>
        <li>${t('civics.doc4')}</li>
      </ul>
    </div>`;
}

// --- Registration Panel (18+ Unregistered) ---
function renderRegistration() {
  const d = document.getElementById('dashboard');
  d.innerHTML = `
    <div class="panel-header">
      <h2 class="panel-header__title">${t('registration.title')}</h2>
      <p class="panel-header__subtitle">${t('registration.subtitle')}</p>
    </div>
    <div class="glass-card">
      <h3 style="color:var(--white);margin-bottom:16px;">${t('registration.checklistTitle')}</h3>
      <ol class="checklist">
        ${[1,2,3,4,5].map(i => `
          <li class="checklist__item">
            <span class="checklist__number">${i}</span>
            <div class="checklist__text">
              <strong>${t('registration.s'+i)}</strong>
              <span>${t('registration.s'+i+'d')}</span>
            </div>
          </li>`).join('')}
      </ol>
      <a href="https://voters.eci.gov.in/signup" target="_blank" class="btn btn--primary" style="margin-top:16px;">
        ${t('registration.formLink')}
      </a>
    </div>
    <div class="glass-card">
      <h3 style="color:var(--white);margin-bottom:8px;">${t('registration.eroTitle')}</h3>
      <p style="color:var(--text-muted);margin-bottom:12px;">${t('registration.eroDesc')}</p>
      <div class="map-search">
        <input type="text" id="ero-pincode" class="input" placeholder="${t('registration.pinPlaceholder')}" maxlength="6">
        <button class="btn btn--primary" id="ero-search-btn">${t('registration.searchBtn')}</button>
      </div>
      <div id="ero-results"></div>
      <div id="ero-map" class="map-container"></div>
    </div>
    <div class="glass-card">
      <h3 style="color:var(--white);margin-bottom:8px;">${t('registration.calTitle')}</h3>
      <p style="color:var(--text-muted);">${t('registration.calDesc')}</p>
      <a href="${generateCalendarURL('Voter Registration Deadline', 'Register to vote at voters.eci.gov.in')}" target="_blank" class="cal-link">${t('registration.addCal')}</a>
    </div>`;

  document.getElementById('ero-search-btn').addEventListener('click', () => searchERO('ero'));
  document.getElementById('ero-pincode').addEventListener('keydown', e => { if (e.key === 'Enter') searchERO('ero'); });
  initMap('ero-map');
}

// --- Polling Day Panel (Registered) ---
function renderPollingDay() {
  const d = document.getElementById('dashboard');
  d.innerHTML = `
    <div class="panel-header">
      <h2 class="panel-header__title">${t('polling.title')}</h2>
      <p class="panel-header__subtitle">${t('polling.subtitle')}</p>
    </div>
    <div class="glass-card">
      <h3 style="color:var(--white);margin-bottom:16px;">${t('polling.timeTitle')}</h3>
      <ul class="timeline">
        ${[1,2,3,4].map(i => `
          <li class="timeline__item">
            <div class="timeline__event">${t('polling.t'+i)}</div>
          </li>`).join('')}
      </ul>
    </div>
    <div class="glass-card">
      <h3 style="color:var(--white);margin-bottom:12px;">${t('polling.checkTitle')}</h3>
      <ul class="checklist">
        ${[1,2,3].map(i => `
          <li class="checklist__item">
            <span class="checklist__number">✓</span>
            <div class="checklist__text"><strong>${t('polling.i'+i)}</strong></div>
          </li>`).join('')}
      </ul>
    </div>
    <div class="glass-card">
      <h3 style="color:var(--white);margin-bottom:12px;">${t('polling.evmTitle')}</h3>
      <ul class="evm-steps">
        ${[1,2,3,4,5].map(i => `<li>${t('polling.e'+i)}</li>`).join('')}
      </ul>
    </div>
    <div class="glass-card">
      <h3 style="color:var(--white);margin-bottom:8px;">${t('polling.boothTitle')}</h3>
      <p style="color:var(--text-muted);margin-bottom:12px;">${t('polling.boothDesc')}</p>
      <div class="map-search">
        <input type="text" id="booth-pincode" class="input" placeholder="${t('polling.pinPlaceholder')}" maxlength="6">
        <button class="btn btn--primary" id="booth-search-btn">${t('polling.searchBtn')}</button>
      </div>
      <div id="booth-results"></div>
      <div id="booth-map" class="map-container"></div>
    </div>
    <div class="glass-card">
      <h3 style="color:var(--white);margin-bottom:8px;">${t('polling.calTitle')}</h3>
      <a href="${generateCalendarURL('Election Day', 'Remember to vote! Bring your Voter ID (EPIC) and additional photo ID.')}" target="_blank" class="cal-link">${t('polling.addCal')}</a>
    </div>`;

  document.getElementById('booth-search-btn').addEventListener('click', () => searchERO('booth'));
  document.getElementById('booth-pincode').addEventListener('keydown', e => { if (e.key === 'Enter') searchERO('booth'); });
  initMap('booth-map');
}

// --- Google Maps ---
let mapsLoaded = false;

function loadMapsScript() {
  return new Promise((resolve, reject) => {
    if (mapsLoaded) return resolve();
    if (!state.config.mapsApiKey) return reject('No Maps API key');
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${state.config.mapsApiKey}`;
    s.onload = () => { mapsLoaded = true; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function initMap(containerId) {
  try {
    await loadMapsScript();
    const container = document.getElementById(containerId);
    if (!container) return;
    state.map = new google.maps.Map(container, {
      center: { lat: 13.0827, lng: 80.2707 },
      zoom: 11,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#8899aa' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#0a1628' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2a40' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#061020' }] },
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
      ]
    });
  } catch (e) {
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:0.9rem;">Maps API not configured. Add GOOGLE_MAPS_API_KEY to enable.</div>';
  }
}

function clearMarkers() {
  state.markers.forEach(m => m.setMap(null));
  state.markers = [];
}

function addMarker(office) {
  if (!state.map || !office.lat || !office.lng) return;
  const marker = new google.maps.Marker({
    position: { lat: parseFloat(office.lat), lng: parseFloat(office.lng) },
    map: state.map,
    title: office.name,
    icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#FF9933', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }
  });
  const info = new google.maps.InfoWindow({
    content: `<div style="color:#0a1628;font-family:Inter,sans-serif;"><strong>${office.name}</strong><br><span style="font-size:0.85em;">${office.address}</span><br><span style="font-size:0.8em;">📞 ${office.phone || 'N/A'}</span></div>`
  });
  marker.addListener('click', () => info.open(state.map, marker));
  state.markers.push(marker);
}

// --- ERO Search ---
async function searchERO(prefix) {
  const pinInput = document.getElementById(`${prefix}-pincode`);
  const resultsDiv = document.getElementById(`${prefix}-results`);
  const pincode = pinInput.value.trim();

  if (!pincode || pincode.length !== 6) {
    resultsDiv.innerHTML = '<p style="color:var(--saffron);font-size:0.85rem;margin:8px 0;">Please enter a valid 6-digit PIN code.</p>';
    return;
  }

  resultsDiv.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;margin:8px 0;">Searching...</p>';
  clearMarkers();

  try {
    // Try static data first
    let res = await fetch(`/api/ero?pincode=${pincode}`);
    let data = await res.json();

    // If no static results, try Gemini fallback
    if (data.offices.length === 0) {
      res = await fetch('/api/ero/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode })
      });
      data = await res.json();
    }

    if (data.offices.length === 0) {
      resultsDiv.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem;margin:8px 0;">${t('common.noResults')}</p>`;
      return;
    }

    const sourceLabel = data.source === 'ai' ? ' <span style="color:var(--saffron);font-size:0.7rem;">(AI-generated)</span>' : '';
    resultsDiv.innerHTML = data.offices.map(o => `
      <div class="ero-card">
        <div class="ero-card__name">${o.name}${sourceLabel}</div>
        <div class="ero-card__detail">📍 ${o.address}</div>
        ${o.phone ? `<div class="ero-card__detail">📞 ${o.phone}</div>` : ''}
        <div class="ero-card__detail">📮 ${o.pincode} · ${o.district}</div>
      </div>`).join('');

    // Plot on map
    data.offices.forEach(o => addMarker(o));
    if (state.map && data.offices[0] && data.offices[0].lat) {
      state.map.setCenter({ lat: parseFloat(data.offices[0].lat), lng: parseFloat(data.offices[0].lng) });
      state.map.setZoom(13);
    }
  } catch (e) {
    resultsDiv.innerHTML = `<p style="color:var(--saffron);font-size:0.85rem;margin:8px 0;">${t('common.error')}</p>`;
  }
}

// --- Google Calendar ---
function generateCalendarURL(title, details) {
  const now = new Date();
  const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const fmt = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const end = new Date(future.getTime() + 3600000);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${fmt(future)}/${fmt(end)}&details=${encodeURIComponent(details)}&sf=true&output=xml`;
}

// --- Chat ---
function openChat() {
  document.getElementById('chat-drawer').classList.add('open');
  document.getElementById('chat-overlay').classList.add('open');
  document.getElementById('chat-fab').classList.add('hidden');
  document.getElementById('chat-input').focus();
}

function closeChat() {
  document.getElementById('chat-drawer').classList.remove('open');
  document.getElementById('chat-overlay').classList.remove('open');
  document.getElementById('chat-fab').classList.remove('hidden');
}

function addChatWelcome() {
  const msgs = document.getElementById('chat-messages');
  msgs.innerHTML = `<div class="chat-msg chat-msg--bot">${t('chat.welcomeMsg')}</div>`;
}

function appendChatMessage(text, role) {
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `chat-msg chat-msg--${role}`;
  // Simple markdown: bold and line breaks
  div.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function showTyping() {
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-msg chat-msg--thinking';
  div.id = 'typing-indicator';
  div.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message) return;

  input.value = '';
  appendChatMessage(message, 'user');
  showTyping();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history: state.chatHistory,
        persona: { age: state.age, status: state.status },
        language: state.language
      })
    });

    hideTyping();
    const data = await res.json();

    if (data.error) {
      appendChatMessage(t('chat.error'), 'bot');
      return;
    }

    // Use translated response if available, otherwise original
    const responseText = data.translatedResponse || data.response;
    appendChatMessage(responseText, 'bot');

    // Update history
    state.chatHistory.push({ role: 'user', text: message });
    state.chatHistory.push({ role: 'model', text: data.response });

    // Keep history manageable (last 20 messages)
    if (state.chatHistory.length > 20) {
      state.chatHistory = state.chatHistory.slice(-20);
    }
  } catch (e) {
    hideTyping();
    appendChatMessage(t('chat.error'), 'bot');
  }
}
