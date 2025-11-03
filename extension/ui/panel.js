/**
 * InfoVerif Extension - Panel JavaScript
 * 
 * Responsibilities:
 * - Listen for new reports from background worker
 * - Render scores, techniques, claims, summary
 * - Handle copy actions (JSON, summary)
 * - Handle chat interactions (Phase 2)
 */

import { storageGet, copyToClipboard, debugLog, errorLog } from '../lib/utils.js';
import { MESSAGE_TYPES } from '../shared/constants.js';

// ============================================================================
// STATE
// ============================================================================

let currentReport = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  debugLog('PANEL', 'Panel initialized');
  
  // Check for existing report in storage
  await checkForReport();
  
  // Listen for storage changes (new reports from background)
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'session' && changes.latestReport) {
      handleNewReport(changes.latestReport.newValue);
    }
  });
  
  // Setup event listeners
  setupEventListeners();
  
  // Poll for updates every 2 seconds (fallback)
  setInterval(checkForReport, 2000);
});

// ============================================================================
// REPORT HANDLING
// ============================================================================

/**
 * Check storage for latest report
 */
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

/**
 * Handle new report message
 * @param {Object} message - REPORT_READY or REPORT_ERROR
 */
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

/**
 * Show report in panel
 * @param {Object} report - InfoVerif report
 * @param {Object} headers - Response headers
 */
function showReport(report, headers) {
  // Hide states
  hideElement('loadingState');
  hideElement('errorState');
  hideElement('emptyState');
  
  // Show report container
  showElement('reportContainer');
  
  // Update header badges
  updateHeaderBadges(headers);
  
  // Update report header
  updateReportHeader(report);
  
  // Render sections
  renderScores(report.scores);
  renderTechniques(report.techniques);
  renderClaims(report.claims);
  renderSummary(report.summary);
  
  // Render transcript if available
  if (report.transcript_excerpt) {
    renderTranscript(report.transcript_excerpt);
  }
  
  debugLog('PANEL', 'Report rendered successfully');
}

/**
 * Show error state
 * @param {string} error - Error type
 * @param {string} message - Error message
 * @param {number} [retryAfterSeconds] - Retry delay
 */
function showError(error, message, retryAfterSeconds) {
  // Hide states
  hideElement('loadingState');
  hideElement('emptyState');
  hideElement('reportContainer');
  
  // Show error state
  showElement('errorState');
  
  // Update error message
  const errorMessageEl = document.getElementById('errorMessage');
  if (errorMessageEl) {
    errorMessageEl.textContent = message;
  }
  
  // Show retry button if applicable
  const retryButton = document.getElementById('retryButton');
  if (retryButton) {
    if (retryAfterSeconds) {
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
}

/**
 * Update header badges (taxonomy, model)
 * @param {Object} headers - Response headers
 */
function updateHeaderBadges(headers) {
  const taxonomyBadge = document.getElementById('taxonomyBadge');
  const modelBadge = document.getElementById('modelBadge');
  
  if (taxonomyBadge && headers.taxonomyVersion) {
    taxonomyBadge.textContent = headers.taxonomyVersion.replace('DIMA-', '');
  }
  
  if (modelBadge && headers.modelCard) {
    modelBadge.textContent = headers.modelCard;
  }
}

/**
 * Update report header (platform, timestamp)
 * @param {Object} report - InfoVerif report
 */
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

/**
 * Render scores section
 * @param {Object} scores - Scores object
 */
function renderScores(scores) {
  const scoresGrid = document.getElementById('scoresGrid');
  if (!scoresGrid) return;
  
  scoresGrid.innerHTML = '';
  
  const scoreLabels = {
    propaganda: 'Intensité persuasive',
    conspiracy: 'Narratif spéculatif',
    misinfo: 'Fiabilité factuelle',
    overall_risk: 'Indice d\'influence'
  };
  
  Object.entries(scores).forEach(([key, value]) => {
    const card = createScoreCard(scoreLabels[key] || key, value);
    scoresGrid.appendChild(card);
  });
}

/**
 * Create score card element
 * @param {string} label - Score label
 * @param {number} value - Score value (0-100)
 * @returns {HTMLElement}
 */
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

/**
 * Render techniques section
 * @param {Array} techniques - Techniques array
 */
function renderTechniques(techniques) {
  const techniquesList = document.getElementById('techniquesList');
  const techniquesCount = document.getElementById('techniquesCount');
  
  if (!techniquesList) return;
  
  techniquesList.innerHTML = '';
  
  if (techniquesCount) {
    techniquesCount.textContent = techniques.length;
  }
  
  if (techniques.length === 0) {
    techniquesList.innerHTML = '<p style="color: var(--color-text-dim);">Aucune technique détectée</p>';
    return;
  }
  
  techniques.forEach(technique => {
    const card = createTechniqueCard(technique);
    techniquesList.appendChild(card);
  });
}

/**
 * Create technique card element
 * @param {Object} technique - Technique object
 * @returns {HTMLElement}
 */
function createTechniqueCard(technique) {
  const card = document.createElement('div');
  card.className = `technique-card severity-${technique.severity}`;
  
  // Badges
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

/**
 * Render claims section
 * @param {Array} claims - Claims array
 */
function renderClaims(claims) {
  const claimsList = document.getElementById('claimsList');
  const claimsCount = document.getElementById('claimsCount');
  
  if (!claimsList) return;
  
  claimsList.innerHTML = '';
  
  if (claimsCount) {
    claimsCount.textContent = claims.length;
  }
  
  if (claims.length === 0) {
    claimsList.innerHTML = '<p style="color: var(--color-text-dim);">Aucune affirmation analysée</p>';
    return;
  }
  
  claims.forEach(claim => {
    const card = createClaimCard(claim);
    claimsList.appendChild(card);
  });
}

/**
 * Create claim card element
 * @param {Object} claim - Claim object
 * @returns {HTMLElement}
 */
function createClaimCard(claim) {
  const card = document.createElement('div');
  card.className = 'claim-card';
  
  // Issues tags
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

/**
 * Render summary section
 * @param {string} summary - Summary text
 */
function renderSummary(summary) {
  const summaryContent = document.getElementById('summaryContent');
  if (!summaryContent) return;
  
  summaryContent.textContent = summary;
}

/**
 * Render transcript section
 * @param {string} excerpt - Transcript excerpt
 */
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

/**
 * Setup button event listeners
 */
function setupEventListeners() {
  // Copy JSON button
  const copyJsonButton = document.getElementById('copyJsonButton');
  if (copyJsonButton) {
    copyJsonButton.addEventListener('click', handleCopyJson);
  }
  
  // Copy summary button
  const copySummaryButton = document.getElementById('copySummaryButton');
  if (copySummaryButton) {
    copySummaryButton.addEventListener('click', handleCopySummary);
  }
  
  // New analysis button
  const newAnalysisButton = document.getElementById('newAnalysisButton');
  if (newAnalysisButton) {
    newAnalysisButton.addEventListener('click', handleNewAnalysis);
  }
  
  // Retry button
  const retryButton = document.getElementById('retryButton');
  if (retryButton) {
    retryButton.addEventListener('click', handleRetry);
  }
  
  // Chat send button (Phase 2)
  const chatSendButton = document.getElementById('chatSendButton');
  if (chatSendButton) {
    chatSendButton.addEventListener('click', handleChatSend);
  }
  
  // Chat input (Enter key)
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleChatSend();
      }
    });
  }
}

/**
 * Handle copy JSON button
 */
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

/**
 * Handle copy summary button
 */
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

/**
 * Handle new analysis button
 */
function handleNewAnalysis() {
  // Clear current report
  currentReport = null;
  
  // Show empty state
  hideElement('reportContainer');
  hideElement('errorState');
  showElement('emptyState');
  
  // Clear storage
  chrome.storage.session.remove('latestReport');
}

/**
 * Handle retry button
 */
function handleRetry() {
  // Show loading state
  hideElement('errorState');
  showElement('loadingState');
  
  // Send message to background to retry
  chrome.runtime.sendMessage({ type: MESSAGE_TYPES.OPEN_PANEL });
}

/**
 * Handle chat send (Phase 2 - placeholder)
 */
function handleChatSend() {
  const chatInput = document.getElementById('chatInput');
  if (!chatInput || !chatInput.value.trim()) return;
  
  const userMessage = chatInput.value.trim();
  chatInput.value = '';
  
  // TODO Phase 2: Send chat message to background
  debugLog('PANEL', 'Chat message:', userMessage);
  
  // Placeholder: Show "coming soon" message
  const chatMessages = document.getElementById('chatMessages');
  if (chatMessages) {
    const msgEl = document.createElement('div');
    msgEl.style.padding = 'var(--spacing-sm)';
    msgEl.style.color = 'var(--color-text-dim)';
    msgEl.textContent = 'La fonctionnalité de chat sera disponible prochainement.';
    chatMessages.appendChild(msgEl);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Show element by ID
 * @param {string} id - Element ID
 */
function showElement(id) {
  const element = document.getElementById(id);
  if (element) {
    element.classList.remove('hidden');
  }
}

/**
 * Hide element by ID
 * @param {string} id - Element ID
 */
function hideElement(id) {
  const element = document.getElementById(id);
  if (element) {
    element.classList.add('hidden');
  }
}

/**
 * Show copy feedback on button
 * @param {string} buttonId - Button ID
 * @param {string} message - Feedback message
 * @param {boolean} [isError=false] - Is error state
 */
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

/**
 * Get severity class based on score
 * @param {number} score - Score value (0-100)
 * @returns {string} Severity class
 */
function getSeverityClass(score) {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Format severity for display
 * @param {string} severity - Severity level
 * @returns {string} Formatted severity
 */
function formatSeverity(severity) {
  const labels = {
    high: 'Élevé',
    medium: 'Moyen',
    low: 'Faible'
  };
  return labels[severity] || severity;
}

/**
 * Format confidence for display
 * @param {string} confidence - Confidence level
 * @returns {string} Formatted confidence
 */
function formatConfidence(confidence) {
  const labels = {
    supported: 'Soutenu',
    unsupported: 'Non soutenu',
    misleading: 'Trompeur'
  };
  return labels[confidence] || confidence;
}

/**
 * Format platform for display
 * @param {string} platform - Platform ID
 * @returns {string} Formatted platform
 */
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

/**
 * Format timestamp for display
 * @param {string} timestamp - ISO 8601 timestamp
 * @returns {string} Formatted timestamp
 */
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

