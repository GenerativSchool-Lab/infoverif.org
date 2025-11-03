/**
 * InfoVerif Extension - Background Service Worker (MV3)
 * 
 * Responsibilities:
 * - Route messages between content script and panel
 * - Call InfoVerif backend API (/analyze, /chat)
 * - Manage side panel state
 * - Handle errors (network, CORS, rate limits)
 * - Cache analysis results for chat context
 */

import { getApiUrl, MESSAGE_TYPES, debugLog, errorLog } from './shared/constants.js';
import { createReportReady, createReportError, isMessageType } from './shared/messages.js';
import { storageSet, storageGet, retryWithBackoff } from './lib/utils.js';

// ============================================================================
// STATE
// ============================================================================

// In-memory cache for analysis results (used by chat)
const analysisCache = new Map();

// Rate limit tracking (per-tab)
const rateLimitState = new Map();

// ============================================================================
// INITIALIZATION
// ============================================================================

chrome.runtime.onInstalled.addListener((details) => {
  debugLog('BACKGROUND', `Extension installed: ${details.reason}`);
  
  if (details.reason === 'install') {
    // First install: show welcome message
    chrome.tabs.create({ url: 'https://infoverif.org' });
  }
});

// ============================================================================
// MESSAGE ROUTING
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  debugLog('BACKGROUND', `Message received: ${message.type}`);
  
  // Handle async responses
  handleMessage(message, sender).then(sendResponse);
  return true;  // Keep channel open for async response
});

/**
 * Main message handler (async)
 * @param {Object} message - Message from content script or panel
 * @param {Object} sender - Sender info
 * @returns {Promise<Object>} Response
 */
async function handleMessage(message, sender) {
  try {
    // ANALYZE_REQUEST: From content script
    if (isMessageType(message, MESSAGE_TYPES.ANALYZE_REQUEST)) {
      return await handleAnalyzeRequest(message, sender);
    }
    
    // CHAT_REQUEST: From panel
    if (isMessageType(message, MESSAGE_TYPES.CHAT_REQUEST)) {
      return await handleChatRequest(message, sender);
    }
    
    // OPEN_PANEL: From content script or popup
    if (isMessageType(message, MESSAGE_TYPES.OPEN_PANEL)) {
      return await handleOpenPanel(sender.tab?.id);
    }
    
    // PING: Health check
    if (isMessageType(message, MESSAGE_TYPES.PING)) {
      return { type: MESSAGE_TYPES.PONG, timestamp: Date.now() };
    }
    
    // Unknown message type
    errorLog('BACKGROUND', 'Unknown message type:', message.type);
    return { success: false, error: 'unknown_message_type' };
    
  } catch (error) {
    errorLog('BACKGROUND', 'Message handling error:', error);
    return { success: false, error: 'internal_error', message: error.message };
  }
}

// ============================================================================
// ANALYZE REQUEST HANDLER
// ============================================================================

/**
 * Handle analyze request from content script
 * @param {Object} message - ANALYZE_REQUEST message
 * @param {Object} sender - Sender info
 * @returns {Promise<Object>} Response with success/error
 */
async function handleAnalyzeRequest(message, sender) {
  const { mode, platform, text, url, imageBlobId, metadata } = message;
  
  debugLog('BACKGROUND', `Analyze request: mode=${mode}, platform=${platform}`);
  
  // Check rate limit
  if (isRateLimited(sender.tab?.id)) {
    return {
      success: false,
      error: 'rate_limit',
      message: 'Trop de requêtes. Attendez quelques secondes.'
    };
  }
  
  try {
    let report, headers;
    
    // Call backend based on mode
    if (mode === 'text') {
      ({ report, headers } = await analyzeText(text, platform, metadata));
    } else if (mode === 'video') {
      ({ report, headers } = await analyzeVideo(url, platform, metadata));
    } else if (mode === 'screenshot') {
      ({ report, headers } = await analyzeImage(imageBlobId, platform, metadata));
    } else {
      throw new Error(`Unknown mode: ${mode}`);
    }
    
    // Cache analysis for chat
    if (report.analysis_id) {
      cacheAnalysis(report.analysis_id, report);
    }
    
    // Open side panel and send report
    await openSidePanel(sender.tab?.id);
    await sendReportToPanel(report, headers);
    
    // Update rate limit
    updateRateLimit(sender.tab?.id);
    
    return { success: true, analysisId: report.analysis_id };
    
  } catch (error) {
    errorLog('BACKGROUND', 'Analyze request failed:', error);
    
    // Parse error type
    const errorResponse = parseApiError(error);
    
    // Send error to panel
    await sendErrorToPanel(errorResponse);
    
    return {
      success: false,
      error: errorResponse.error,
      message: errorResponse.message
    };
  }
}

// ============================================================================
// API CALLS
// ============================================================================

/**
 * Call /analyze-text endpoint
 * @param {string} text - Text content
 * @param {string} platform - Platform ID
 * @param {Object} metadata - Post metadata
 * @returns {Promise<{report: Object, headers: Object}>}
 */
async function analyzeText(text, platform, metadata) {
  const apiUrl = getApiUrl();
  
  const response = await retryWithBackoff(async () => {
    const res = await fetch(`${apiUrl}/analyze-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        platform,
        metadata
      })
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new ApiError(res.status, error.detail || res.statusText);
    }
    
    return res;
  }, 2, 1000);  // 2 retries, 1s base delay
  
  const report = await response.json();
  const headers = extractHeaders(response.headers);
  
  return { report, headers };
}

/**
 * Call /analyze-video endpoint
 * @param {string} url - Video URL
 * @param {string} platform - Platform ID
 * @param {Object} metadata - Video metadata
 * @returns {Promise<{report: Object, headers: Object}>}
 */
async function analyzeVideo(url, platform, metadata) {
  const apiUrl = getApiUrl();
  
  const formData = new FormData();
  formData.append('url', url);
  formData.append('platform', platform);
  formData.append('metadata', JSON.stringify(metadata));
  
  const response = await retryWithBackoff(async () => {
    const res = await fetch(`${apiUrl}/analyze-video`, {
      method: 'POST',
      body: formData
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new ApiError(res.status, error.detail || res.statusText);
    }
    
    return res;
  }, 2, 2000);  // 2 retries, 2s base delay (video takes longer)
  
  const report = await response.json();
  const headers = extractHeaders(response.headers);
  
  return { report, headers };
}

/**
 * Call /analyze-image endpoint
 * @param {string} imageBlobId - Blob URL
 * @param {string} platform - Platform ID
 * @param {Object} metadata - Post metadata
 * @returns {Promise<{report: Object, headers: Object}>}
 */
async function analyzeImage(imageBlobId, platform, metadata) {
  const apiUrl = getApiUrl();
  
  // Fetch blob from content script
  const blob = await fetch(imageBlobId).then(r => r.blob());
  
  const formData = new FormData();
  formData.append('image', blob, 'screenshot.png');
  formData.append('platform', platform);
  formData.append('metadata', JSON.stringify(metadata));
  
  const response = await retryWithBackoff(async () => {
    const res = await fetch(`${apiUrl}/analyze-image`, {
      method: 'POST',
      body: formData
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new ApiError(res.status, error.detail || res.statusText);
    }
    
    return res;
  }, 2, 1500);
  
  const report = await response.json();
  const headers = extractHeaders(response.headers);
  
  return { report, headers };
}

// ============================================================================
// CHAT REQUEST HANDLER (Phase 2)
// ============================================================================

/**
 * Handle chat request from panel
 * @param {Object} message - CHAT_REQUEST message
 * @param {Object} sender - Sender info
 * @returns {Promise<Object>} Chat response
 */
async function handleChatRequest(message, sender) {
  const { analysis_id, user_message } = message;
  
  debugLog('BACKGROUND', `Chat request: analysis_id=${analysis_id}`);
  
  try {
    // TODO Phase 2: Call /chat endpoint
    // For now, return placeholder
    return {
      success: true,
      reply: 'La fonctionnalité de chat sera disponible prochainement.',
      citations: []
    };
    
  } catch (error) {
    errorLog('BACKGROUND', 'Chat request failed:', error);
    return {
      success: false,
      error: 'chat_failed',
      message: 'Erreur lors de l\'envoi du message'
    };
  }
}

// ============================================================================
// SIDE PANEL MANAGEMENT
// ============================================================================

/**
 * Open side panel for specified tab
 * @param {number} tabId - Tab ID
 * @returns {Promise<void>}
 */
async function openSidePanel(tabId) {
  try {
    if (tabId) {
      await chrome.sidePanel.open({ tabId });
    } else {
      await chrome.sidePanel.open({});
    }
    debugLog('BACKGROUND', 'Side panel opened');
  } catch (error) {
    errorLog('BACKGROUND', 'Failed to open side panel:', error);
  }
}

/**
 * Handle OPEN_PANEL request
 */
async function handleOpenPanel(tabId) {
  await openSidePanel(tabId);
  return { success: true };
}

/**
 * Send report to panel
 * @param {Object} report - Analysis report
 * @param {Object} headers - Response headers
 * @returns {Promise<void>}
 */
async function sendReportToPanel(report, headers) {
  const message = createReportReady(report, headers);
  
  // Store in session storage for panel to retrieve
  await storageSet({ latestReport: message }, 'session');
  
  debugLog('BACKGROUND', 'Report sent to panel');
}

/**
 * Send error to panel
 * @param {Object} errorResponse - Error response
 * @returns {Promise<void>}
 */
async function sendErrorToPanel(errorResponse) {
  const message = createReportError(
    errorResponse.error,
    errorResponse.message,
    errorResponse.retryAfterSeconds
  );
  
  // Store in session storage for panel to retrieve
  await storageSet({ latestReport: message }, 'session');
  
  debugLog('BACKGROUND', 'Error sent to panel');
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Extract custom headers from response
 * @param {Headers} headers - Response headers
 * @returns {Object} Extracted headers
 */
function extractHeaders(headers) {
  return {
    modelCard: headers.get('x-model-card') || 'gpt-4o-mini',
    taxonomyVersion: headers.get('x-taxonomy-version') || 'DIMA-M2.2-130',
    latencyMs: headers.get('x-latency-ms') || '0',
    backendVersion: headers.get('x-backend-version') || 'unknown'
  };
}

/**
 * Parse API error into user-friendly format
 * @param {Error} error - Error object
 * @returns {Object} {error, message, retryAfterSeconds}
 */
function parseApiError(error) {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return {
        error: 'rate_limit',
        message: 'Trop de requêtes. Réessayez dans quelques instants.',
        retryAfterSeconds: 60
      };
    }
    if (error.status >= 500) {
      return {
        error: 'server_error',
        message: 'Erreur serveur. Réessayez plus tard.'
      };
    }
    if (error.status === 400) {
      return {
        error: 'invalid_request',
        message: 'Contenu invalide ou trop court.'
      };
    }
  }
  
  // Network error
  if (error.message.includes('fetch')) {
    return {
      error: 'network_error',
      message: 'Impossible de contacter le serveur. Vérifiez votre connexion.'
    };
  }
  
  // Default
  return {
    error: 'unknown_error',
    message: 'Une erreur est survenue. Réessayez.'
  };
}

/**
 * Custom API error class
 */
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Check if tab is rate limited
 * @param {number} tabId - Tab ID
 * @returns {boolean}
 */
function isRateLimited(tabId) {
  if (!tabId) return false;
  
  const state = rateLimitState.get(tabId);
  if (!state) return false;
  
  const now = Date.now();
  const timeSinceLastRequest = now - state.lastRequest;
  
  // Max 3 requests per minute
  if (state.count >= 3 && timeSinceLastRequest < 60000) {
    return true;
  }
  
  // Reset if > 1 minute passed
  if (timeSinceLastRequest > 60000) {
    rateLimitState.delete(tabId);
    return false;
  }
  
  return false;
}

/**
 * Update rate limit state
 * @param {number} tabId - Tab ID
 */
function updateRateLimit(tabId) {
  if (!tabId) return;
  
  const state = rateLimitState.get(tabId);
  const now = Date.now();
  
  if (state && (now - state.lastRequest < 60000)) {
    state.count += 1;
    state.lastRequest = now;
  } else {
    rateLimitState.set(tabId, { count: 1, lastRequest: now });
  }
}

// ============================================================================
// ANALYSIS CACHE (for chat context)
// ============================================================================

/**
 * Cache analysis result
 * @param {string} analysisId - Analysis UUID
 * @param {Object} report - Full report
 */
function cacheAnalysis(analysisId, report) {
  analysisCache.set(analysisId, {
    report,
    timestamp: Date.now()
  });
  
  // Limit cache size (max 10 entries)
  if (analysisCache.size > 10) {
    const firstKey = analysisCache.keys().next().value;
    analysisCache.delete(firstKey);
  }
}

/**
 * Get cached analysis
 * @param {string} analysisId - Analysis UUID
 * @returns {Object|null} Cached report or null
 */
function getCachedAnalysis(analysisId) {
  const cached = analysisCache.get(analysisId);
  if (!cached) return null;
  
  // Expire after 1 hour
  if (Date.now() - cached.timestamp > 3600000) {
    analysisCache.delete(analysisId);
    return null;
  }
  
  return cached.report;
}

// ============================================================================
// CLEANUP
// ============================================================================

// Clean up rate limit state when tab closes
chrome.tabs.onRemoved.addListener((tabId) => {
  rateLimitState.delete(tabId);
});

