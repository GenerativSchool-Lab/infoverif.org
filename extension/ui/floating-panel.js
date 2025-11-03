/**
 * InfoVerif Floating Panel Logic
 * Handles drag, resize, show/hide, and report rendering
 */

// ============================================================================
// STATE
// ============================================================================

let currentReport = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let isMinimized = false;

// ============================================================================
// INITIALIZATION
// ============================================================================

function initFloatingPanel() {
  const panel = document.getElementById('infoverif-floating-panel');
  if (!panel) return;

  // Drag functionality
  const header = document.getElementById('infoverif-panel-header');
  header.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDrag);

  // Control buttons
  document.getElementById('infoverif-close-btn').addEventListener('click', closePanel);
  document.getElementById('infoverif-minimize-btn').addEventListener('click', toggleMinimize);

  // Action buttons
  document.getElementById('infoverif-copy-json-btn').addEventListener('click', copyJSON);
  document.getElementById('infoverif-copy-summary-btn').addEventListener('click', copySummary);

  console.log('[InfoVerif Panel] Initialized');
}

// ============================================================================
// PANEL VISIBILITY
// ============================================================================

function showPanel() {
  const panel = document.getElementById('infoverif-floating-panel');
  if (panel) {
    panel.style.display = 'flex';
  }
}

function closePanel() {
  const panel = document.getElementById('infoverif-floating-panel');
  if (panel) {
    panel.style.display = 'none';
  }
}

function toggleMinimize() {
  const panel = document.getElementById('infoverif-floating-panel');
  const btn = document.getElementById('infoverif-minimize-btn');
  
  isMinimized = !isMinimized;
  
  if (isMinimized) {
    panel.classList.add('minimized');
    btn.textContent = '□';
    btn.title = 'Maximiser';
  } else {
    panel.classList.remove('minimized');
    btn.textContent = '−';
    btn.title = 'Minimiser';
  }
}

// ============================================================================
// DRAG FUNCTIONALITY
// ============================================================================

function startDrag(e) {
  const panel = document.getElementById('infoverif-floating-panel');
  isDragging = true;
  
  const rect = panel.getBoundingClientRect();
  dragOffset = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
  
  panel.style.transition = 'none';
  document.body.style.userSelect = 'none';
}

function drag(e) {
  if (!isDragging) return;
  
  const panel = document.getElementById('infoverif-floating-panel');
  
  let newX = e.clientX - dragOffset.x;
  let newY = e.clientY - dragOffset.y;
  
  // Keep panel within viewport
  const maxX = window.innerWidth - panel.offsetWidth;
  const maxY = window.innerHeight - panel.offsetHeight;
  
  newX = Math.max(0, Math.min(newX, maxX));
  newY = Math.max(0, Math.min(newY, maxY));
  
  panel.style.left = newX + 'px';
  panel.style.top = newY + 'px';
  panel.style.right = 'auto';
}

function stopDrag() {
  if (isDragging) {
    isDragging = false;
    document.body.style.userSelect = '';
    
    const panel = document.getElementById('infoverif-floating-panel');
    panel.style.transition = '';
  }
}

// ============================================================================
// REPORT RENDERING
// ============================================================================

function showLoading() {
  document.getElementById('infoverif-panel-empty').style.display = 'none';
  document.getElementById('infoverif-panel-report').style.display = 'none';
  document.getElementById('infoverif-panel-loading').style.display = 'flex';
  showPanel();
}

function showError(message) {
  const emptyState = document.getElementById('infoverif-panel-empty');
  emptyState.style.display = 'flex';
  emptyState.querySelector('h3').textContent = 'Erreur';
  emptyState.querySelector('p').textContent = message;
  
  document.getElementById('infoverif-panel-loading').style.display = 'none';
  document.getElementById('infoverif-panel-report').style.display = 'none';
  showPanel();
}

function renderReport(report) {
  console.log('[InfoVerif Panel] renderReport called with:', report);
  
  if (!report) {
    console.error('[InfoVerif Panel] No report provided!');
    showError('Rapport vide ou invalide');
    return;
  }
  
  currentReport = report;
  
  document.getElementById('infoverif-panel-loading').style.display = 'none';
  document.getElementById('infoverif-panel-empty').style.display = 'none';
  document.getElementById('infoverif-panel-report').style.display = 'block';
  
  // Handle both structures: {scores: {...}} and {propaganda_score: ...}
  const scores = report.scores || {
    propaganda_score: report.propaganda_score || 0,
    conspiracy_score: report.conspiracy_score || 0,
    misinfo_score: report.misinfo_score || 0,
    overall_risk: report.overall_risk || 0
  };
  
  const techniques = report.techniques || [];
  const claims = report.claims || [];
  const summary = report.summary || 'Aucun résumé disponible.';
  
  console.log('[InfoVerif Panel] Rendering scores:', scores);
  console.log('[InfoVerif Panel] Rendering techniques:', techniques.length, 'techniques');
  console.log('[InfoVerif Panel] Rendering claims:', claims.length, 'claims');
  console.log('[InfoVerif Panel] Rendering summary length:', summary.length);
  
  renderScores(scores);
  renderTechniques(techniques);
  renderClaims(claims);
  renderSummary(summary);
  
  showPanel();
  
  console.log('[InfoVerif Panel] Report rendered successfully');
}

function renderScores(scores) {
  const container = document.getElementById('infoverif-scores-container');
  container.innerHTML = '';
  
  const scoreItems = [
    { key: 'propaganda_score', label: 'Intensité persuasive' },
    { key: 'conspiracy_score', label: 'Narratif spéculatif' },
    { key: 'misinfo_score', label: 'Fiabilité factuelle' },
    { key: 'overall_risk', label: 'Indice d\'influence' }
  ];
  
  scoreItems.forEach(({ key, label }) => {
    const value = scores[key] || 0;
    const severity = value >= 70 ? 'high' : value >= 40 ? 'medium' : 'low';
    
    const scoreEl = document.createElement('div');
    scoreEl.className = 'infoverif-score-item';
    scoreEl.innerHTML = `
      <div class="infoverif-score-header">
        <span class="infoverif-score-label">${label}</span>
        <span class="infoverif-score-value">${value}/100</span>
      </div>
      <div class="infoverif-score-bar">
        <div class="infoverif-score-fill ${severity}" style="width: ${value}%"></div>
      </div>
    `;
    
    container.appendChild(scoreEl);
  });
}

function renderTechniques(techniques) {
  const container = document.getElementById('infoverif-techniques-container');
  const countEl = document.getElementById('infoverif-techniques-count');
  
  container.innerHTML = '';
  countEl.textContent = techniques ? techniques.length : 0;
  
  if (!techniques || techniques.length === 0) {
    container.innerHTML = '<p style="color: #999; font-size: 13px;">Aucune technique détectée</p>';
    return;
  }
  
  techniques.forEach(tech => {
    const card = document.createElement('div');
    card.className = 'infoverif-technique-card';
    card.innerHTML = `
      <div class="infoverif-technique-header">
        <div class="infoverif-technique-title">
          ${tech.dima_code ? `<span class="infoverif-technique-code">${tech.dima_code}</span>` : ''}
          <h4 class="infoverif-technique-name">${tech.name || 'Technique'}</h4>
          ${tech.dima_family ? `<p class="infoverif-technique-family">${tech.dima_family}</p>` : ''}
        </div>
        <span class="infoverif-severity-badge ${tech.severity || 'medium'}">${tech.severity || 'medium'}</span>
      </div>
      ${tech.evidence ? `<div class="infoverif-technique-evidence">"${tech.evidence}"</div>` : ''}
      ${tech.explanation ? `<p class="infoverif-technique-explanation">${tech.explanation}</p>` : ''}
      ${tech.source === 'embedding' ? '<p class="infoverif-technique-explanation" style="font-style: italic; color: #0066ff;">🔍 Détecté par analyse sémantique</p>' : ''}
    `;
    
    container.appendChild(card);
  });
}

function renderClaims(claims) {
  const container = document.getElementById('infoverif-claims-container');
  const countEl = document.getElementById('infoverif-claims-count');
  
  container.innerHTML = '';
  countEl.textContent = claims ? claims.length : 0;
  
  if (!claims || claims.length === 0) {
    container.innerHTML = '<p style="color: #999; font-size: 13px;">Aucune affirmation analysée</p>';
    return;
  }
  
  claims.forEach(claim => {
    const card = document.createElement('div');
    card.className = 'infoverif-claim-card';
    card.innerHTML = `
      <div class="infoverif-claim-header">
        <p class="infoverif-claim-text">${claim.claim}</p>
        <span class="infoverif-confidence-badge ${claim.confidence}">${claim.confidence}</span>
      </div>
      ${claim.reasoning ? `<p class="infoverif-claim-reasoning">${claim.reasoning}</p>` : ''}
    `;
    
    container.appendChild(card);
  });
}

function renderSummary(summary) {
  const container = document.getElementById('infoverif-summary-container');
  container.innerHTML = `<p class="infoverif-summary-text">${summary || 'Aucun résumé disponible.'}</p>`;
}

// ============================================================================
// COPY ACTIONS
// ============================================================================

function copyJSON() {
  if (!currentReport) return;
  
  const json = JSON.stringify(currentReport, null, 2);
  navigator.clipboard.writeText(json).then(() => {
    showCopyFeedback('infoverif-copy-json-btn', 'Copié!');
  }).catch(err => {
    console.error('[InfoVerif] Copy failed:', err);
  });
}

function copySummary() {
  if (!currentReport) return;
  
  const summary = currentReport.summary || '';
  navigator.clipboard.writeText(summary).then(() => {
    showCopyFeedback('infoverif-copy-summary-btn', 'Copié!');
  }).catch(err => {
    console.error('[InfoVerif] Copy failed:', err);
  });
}

function showCopyFeedback(btnId, message) {
  const btn = document.getElementById(btnId);
  const originalText = btn.textContent;
  
  btn.textContent = message;
  btn.style.background = '#00cc66';
  btn.style.color = '#ffffff';
  
  setTimeout(() => {
    btn.textContent = originalText;
    btn.style.background = '';
    btn.style.color = '';
  }, 2000);
}

// ============================================================================
// MESSAGE LISTENER (from content script)
// ============================================================================

window.addEventListener('message', (event) => {
  // Only accept messages from same origin
  if (event.source !== window) return;
  
  const message = event.data;
  
  console.log('[InfoVerif Panel] Received message:', message);
  
  if (message.type === 'INFOVERIF_SHOW_LOADING') {
    console.log('[InfoVerif Panel] Showing loading...');
    showLoading();
  } else if (message.type === 'INFOVERIF_SHOW_REPORT') {
    console.log('[InfoVerif Panel] Rendering report:', message.report);
    renderReport(message.report);
  } else if (message.type === 'INFOVERIF_SHOW_ERROR') {
    console.log('[InfoVerif Panel] Showing error:', message.error);
    showError(message.error);
  }
});

// ============================================================================
// AUTO-INIT
// ============================================================================

// Wait for panel to be injected into DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFloatingPanel);
} else {
  // DOMContentLoaded already fired, but panel might not be injected yet
  // Use setTimeout to wait for injection
  setTimeout(initFloatingPanel, 100);
}

console.log('[InfoVerif Panel] Script loaded');

