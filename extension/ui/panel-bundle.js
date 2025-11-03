/**
 * InfoVerif Extension - Panel JavaScript (Bundled)
 * No ES6 imports - all dependencies inlined
 */

// ============================================================================
// CONSTANTS (inlined)
// ============================================================================

const MESSAGE_TYPES = {
  REPORT_READY: 'REPORT_READY',
  REPORT_ERROR: 'REPORT_ERROR'
};

function debugLog(category, ...args) {
  console.log(`[InfoVerif:${category}]`, ...args);
}

function errorLog(category, ...args) {
  console.error(`[InfoVerif:${category}]`, ...args);
}

// ============================================================================
// UTILS (inlined)
// ============================================================================

async function storageGet(keys, area = 'session') {
  return new Promise((resolve, reject) => {
    chrome.storage[area].get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

// ============================================================================
// STATE
// ============================================================================

let currentReport = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  debugLog('PANEL', 'Panel initialized');
  
  await checkForReport();
  
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'session' && changes.latestReport) {
      handleNewReport(changes.latestReport.newValue);
    }
  });
  
  setupEventListeners();
  
  setInterval(checkForReport, 2000);
});

// ============================================================================
// REPORT HANDLING
// ============================================================================

async function checkForReport() {
  try {
    const { latestReport } = await storageGet('latestReport', 'session');
    
    if (latestReport && latestReport !== currentReport) {
      handleNewReport(latestReport);
    }
  } catch (error) {
    errorLog('PANEL', 'Failed to check storage:', error);
  }
}

function handleNewReport(message) {
  debugLog('PANEL', 'New report received:', message.type);
  
  if (message.type === MESSAGE_TYPES.REPORT_READY) {
    currentReport = message;
    showReport(message.report, message.headers);
  } else if (message.type === MESSAGE_TYPES.REPORT_ERROR) {
    showError(message.error, message.message, message.retry_after_seconds);
  }
}

// ============================================================================
// UI RENDERING
// ============================================================================

function showReport(report, headers) {
  hideElement('loadingState');
  hideElement('errorState');
  hideElement('emptyState');
  showElement('reportContainer');
  
  updateHeaderBadges(headers);
  updateReportHeader(report);
  renderScores(report.scores);
  renderTechniques(report.techniques);
  renderClaims(report.claims);
  renderSummary(report.summary);
  
  if (report.transcript_excerpt) {
    renderTranscript(report.transcript_excerpt);
  }
  
  debugLog('PANEL', 'Report rendered successfully');
}

function showError(error, message, retryAfterSeconds) {
  hideElement('loadingState');
  hideElement('emptyState');
  hideElement('reportContainer');
  showElement('errorState');
  
  const errorMessageEl = document.getElementById('errorMessage');
  if (errorMessageEl) {
    errorMessageEl.textContent = message;
  }
  
  const retryButton = document.getElementById('retryButton');
  if (retryButton && retryAfterSeconds) {
    retryButton.disabled = true;
    retryButton.textContent = `Réessayer dans ${retryAfterSeconds}s`;
    
    let remaining = retryAfterSeconds;
    const countdown = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(countdown);
        retryButton.disabled = false;
        retryButton.textContent = 'Réessayer';
      } else {
        retryButton.textContent = `Réessayer dans ${remaining}s`;
      }
    }, 1000);
  }
}

function updateHeaderBadges(headers) {
  const taxonomyBadge = document.getElementById('taxonomyBadge');
  const modelBadge = document.getElementById('modelBadge');
  
  if (taxonomyBadge && headers && headers.taxonomyVersion) {
    taxonomyBadge.textContent = headers.taxonomyVersion.replace('DIMA-', '');
  }
  
  if (modelBadge && headers && headers.modelCard) {
    modelBadge.textContent = headers.modelCard;
  }
}

function updateReportHeader(report) {
  const platformBadge = document.getElementById('platformBadge');
  const timestampEl = document.getElementById('reportTimestamp');
  
  if (platformBadge && report.platform) {
    platformBadge.textContent = formatPlatform(report.platform);
  }
  
  if (timestampEl && report.analyzed_at) {
    timestampEl.textContent = formatTimestamp(report.analyzed_at);
  }
}

function renderScores(scores) {
  const scoresGrid = document.getElementById('scoresGrid');
  if (!scoresGrid || !scores) return;
  
  scoresGrid.innerHTML = '';
  
  const scoreLabels = {
    propaganda_score: 'Intensité persuasive',
    conspiracy_score: 'Narratif spéculatif',
    misinfo_score: 'Fiabilité factuelle',
    overall_risk: 'Indice d\'influence'
  };
  
  Object.entries(scores).forEach(([key, value]) => {
    const card = createScoreCard(scoreLabels[key] || key, value);
    scoresGrid.appendChild(card);
  });
}

function createScoreCard(label, value) {
  const card = document.createElement('div');
  card.className = `score-card ${getSeverityClass(value)}`;
  
  card.innerHTML = `
    <span class="score-label">${label}</span>
    <span class="score-value">${value}</span>
    <div class="score-bar">
      <div class="score-bar-fill" style="width: ${value}%"></div>
    </div>
  `;
  
  return card;
}

function renderTechniques(techniques) {
  const techniquesList = document.getElementById('techniquesList');
  const techniquesCount = document.getElementById('techniquesCount');
  
  if (!techniquesList) return;
  
  techniquesList.innerHTML = '';
  
  if (techniquesCount) {
    techniquesCount.textContent = techniques ? techniques.length : 0;
  }
  
  if (!techniques || techniques.length === 0) {
    techniquesList.innerHTML = '<p style="color: var(--color-text-dim);">Aucune technique détectée</p>';
    return;
  }
  
  techniques.forEach(technique => {
    const card = createTechniqueCard(technique);
    techniquesList.appendChild(card);
  });
}

function createTechniqueCard(technique) {
  const card = document.createElement('div');
  card.className = `technique-card severity-${technique.severity}`;
  
  let badges = '';
  if (technique.dima_code) {
    badges += `<span class="technique-badge dima-code">${technique.dima_code}</span>`;
  }
  if (technique.dima_family) {
    badges += `<span class="technique-badge dima-family">${technique.dima_family}</span>`;
  }
  badges += `<span class="technique-badge severity severity-${technique.severity}">${formatSeverity(technique.severity)}</span>`;
  
  card.innerHTML = `
    <div class="technique-header">
      <span class="technique-name">${technique.name}</span>
      <div class="technique-badges">${badges}</div>
    </div>
    ${technique.evidence ? `<div class="technique-evidence">"${technique.evidence}"</div>` : ''}
    <div class="technique-explanation">${technique.explanation}</div>
  `;
  
  return card;
}

function renderClaims(claims) {
  const claimsList = document.getElementById('claimsList');
  const claimsCount = document.getElementById('claimsCount');
  
  if (!claimsList) return;
  
  claimsList.innerHTML = '';
  
  if (claimsCount) {
    claimsCount.textContent = claims ? claims.length : 0;
  }
  
  if (!claims || claims.length === 0) {
    claimsList.innerHTML = '<p style="color: var(--color-text-dim);">Aucune affirmation analysée</p>';
    return;
  }
  
  claims.forEach(claim => {
    const card = createClaimCard(claim);
    claimsList.appendChild(card);
  });
}

function createClaimCard(claim) {
  const card = document.createElement('div');
  card.className = 'claim-card';
  
  let issuesTags = '';
  if (claim.issues && claim.issues.length > 0) {
    issuesTags = '<div class="claim-issues">';
    claim.issues.forEach(issue => {
      issuesTags += `<span class="claim-issue-tag">${issue}</span>`;
    });
    issuesTags += '</div>';
  }
  
  card.innerHTML = `
    <div class="claim-text">${claim.claim}</div>
    <span class="claim-confidence ${claim.confidence}">${formatConfidence(claim.confidence)}</span>
    ${issuesTags}
    <div class="claim-reasoning">${claim.reasoning}</div>
  `;
  
  return card;
}

function renderSummary(summary) {
  const summaryContent = document.getElementById('summaryContent');
  if (!summaryContent) return;
  
  summaryContent.textContent = summary || '';
}

function renderTranscript(excerpt) {
  const transcriptSection = document.getElementById('transcriptSection');
  const transcriptContent = document.getElementById('transcriptContent');
  
  if (!transcriptSection || !transcriptContent) return;
  
  transcriptContent.textContent = excerpt;
  showElement('transcriptSection');
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
  const copyJsonButton = document.getElementById('copyJsonButton');
  if (copyJsonButton) {
    copyJsonButton.addEventListener('click', handleCopyJson);
  }
  
  const copySummaryButton = document.getElementById('copySummaryButton');
  if (copySummaryButton) {
    copySummaryButton.addEventListener('click', handleCopySummary);
  }
  
  const newAnalysisButton = document.getElementById('newAnalysisButton');
  if (newAnalysisButton) {
    newAnalysisButton.addEventListener('click', handleNewAnalysis);
  }
  
  const retryButton = document.getElementById('retryButton');
  if (retryButton) {
    retryButton.addEventListener('click', handleRetry);
  }
}

async function handleCopyJson() {
  if (!currentReport || !currentReport.report) return;
  
  try {
    const json = JSON.stringify(currentReport.report, null, 2);
    await copyToClipboard(json);
    showCopyFeedback('copyJsonButton', '✓ Copié');
  } catch (error) {
    errorLog('PANEL', 'Failed to copy JSON:', error);
    showCopyFeedback('copyJsonButton', '✗ Erreur', true);
  }
}

async function handleCopySummary() {
  if (!currentReport || !currentReport.report) return;
  
  try {
    const summary = currentReport.report.summary;
    await copyToClipboard(summary);
    showCopyFeedback('copySummaryButton', '✓ Copié');
  } catch (error) {
    errorLog('PANEL', 'Failed to copy summary:', error);
    showCopyFeedback('copySummaryButton', '✗ Erreur', true);
  }
}

function handleNewAnalysis() {
  currentReport = null;
  hideElement('reportContainer');
  hideElement('errorState');
  showElement('emptyState');
  chrome.storage.session.remove('latestReport');
}

function handleRetry() {
  hideElement('errorState');
  showElement('loadingState');
  chrome.runtime.sendMessage({ type: 'OPEN_PANEL' });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function showElement(id) {
  const element = document.getElementById(id);
  if (element) {
    element.classList.remove('hidden');
  }
}

function hideElement(id) {
  const element = document.getElementById(id);
  if (element) {
    element.classList.add('hidden');
  }
}

function showCopyFeedback(buttonId, message, isError = false) {
  const button = document.getElementById(buttonId);
  if (!button) return;
  
  const originalLabel = button.querySelector('.btn-label').textContent;
  const labelEl = button.querySelector('.btn-label');
  
  labelEl.textContent = message;
  button.style.color = isError ? 'var(--color-danger)' : 'var(--color-success)';
  
  setTimeout(() => {
    labelEl.textContent = originalLabel;
    button.style.color = '';
  }, 2000);
}

function getSeverityClass(score) {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function formatSeverity(severity) {
  const labels = {
    high: 'Élevé',
    medium: 'Moyen',
    low: 'Faible'
  };
  return labels[severity] || severity;
}

function formatConfidence(confidence) {
  const labels = {
    supported: 'Soutenu',
    unsupported: 'Non soutenu',
    misleading: 'Trompeur'
  };
  return labels[confidence] || confidence;
}

function formatPlatform(platform) {
  const labels = {
    twitter: 'Twitter / X',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    instagram: 'Instagram',
    facebook: 'Facebook',
    generic: 'Page web'
  };
  return labels[platform] || platform;
}

function formatTimestamp(timestamp) {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return 'Récemment';
  }
}

debugLog('PANEL', 'Panel script loaded successfully');
