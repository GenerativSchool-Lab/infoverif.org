/**
 * InfoVerif Extension - Background Service Worker (MV3 - Bundled)
 * 
 * Note: This is a bundled version without ES6 imports for MV3 compatibility.
 * All dependencies are inlined.
 */

// ============================================================================
// CONSTANTS (from shared/constants.js)
// ============================================================================

const API_URL = 'https://infoveriforg-production.up.railway.app';

const MESSAGE_TYPES = {
  ANALYZE_REQUEST: 'ANALYZE_REQUEST',
  REPORT_READY: 'REPORT_READY',
  REPORT_ERROR: 'REPORT_ERROR',
  CHAT_REQUEST: 'CHAT_REQUEST',
  OPEN_PANEL: 'OPEN_PANEL',
  PING: 'PING',
  PONG: 'PONG'
};

function debugLog(category, ...args) {
  console.log(`[InfoVerif:${category}]`, ...args);
}

function errorLog(category, ...args) {
  console.error(`[InfoVerif:${category}]`, ...args);
}

function getApiUrl() {
  return API_URL;
}

// ============================================================================
// UTILS (from lib/utils.js)
// ============================================================================

async function storageSet(items, area = 'session') {
  return new Promise((resolve, reject) => {
    chrome.storage[area].set(items, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

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

async function retryWithBackoff(fn, maxAttempts = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// ============================================================================
// MESSAGES (from shared/messages.js)
// ============================================================================

function createReportReady(report, headers) {
  return {
    type: MESSAGE_TYPES.REPORT_READY,
    report,
    headers
  };
}

function createReportError(error, message, retryAfterSeconds) {
  return {
    type: MESSAGE_TYPES.REPORT_ERROR,
    error,
    message,
    retry_after_seconds: retryAfterSeconds
  };
}

function isMessageType(message, expectedType) {
  return message && typeof message === 'object' && message.type === expectedType;
}

// ============================================================================
// STATE
// ============================================================================

const analysisCache = new Map();
const rateLimitState = new Map();

// ============================================================================
// INITIALIZATION
// ============================================================================

chrome.runtime.onInstalled.addListener((details) => {
  debugLog('BACKGROUND', `Extension installed: ${details.reason}`);
  
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'https://infoverif.org' });
  }
  
  // Set default behavior: open side panel when extension icon is clicked
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch(err => debugLog('BACKGROUND', 'Side panel behavior note:', err.message));
});

// Handle extension icon click (backup if setPanelBehavior doesn't work)
chrome.action.onClicked.addListener((tab) => {
  debugLog('BACKGROUND', 'Extension icon clicked');
  
  // Clear badge
  chrome.action.setBadgeText({ text: '', tabId: tab.id });
  
  chrome.sidePanel.open({ windowId: tab.windowId })
    .catch(err => debugLog('BACKGROUND', 'Could not open panel:', err.message));
});

// ============================================================================
// MESSAGE ROUTING
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  debugLog('BACKGROUND', `Message received: ${message.type}`);
  
  handleMessage(message, sender).then(sendResponse);
  return true;
});

async function handleMessage(message, sender) {
  try {
    if (isMessageType(message, MESSAGE_TYPES.ANALYZE_REQUEST)) {
      return await handleAnalyzeRequest(message, sender);
    }
    
    if (isMessageType(message, MESSAGE_TYPES.CHAT_REQUEST)) {
      return await handleChatRequest(message, sender);
    }
    
    if (isMessageType(message, MESSAGE_TYPES.OPEN_PANEL)) {
      return await handleOpenPanel(sender.tab?.id);
    }
    
    if (isMessageType(message, MESSAGE_TYPES.PING)) {
      return { type: MESSAGE_TYPES.PONG, timestamp: Date.now() };
    }
    
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

async function handleAnalyzeRequest(message, sender) {
  const { mode, platform, text, url, imageBlobId, metadata } = message;
  
  debugLog('BACKGROUND', `Analyze request: mode=${mode}, platform=${platform}`);
  
  if (isRateLimited(sender.tab?.id)) {
    return {
      success: false,
      error: 'rate_limit',
      message: 'Trop de requêtes. Attendez quelques secondes.'
    };
  }
  
  try {
    let report, headers;
    
    if (mode === 'text') {
      ({ report, headers } = await analyzeText(text, platform, metadata));
    } else if (mode === 'video') {
      ({ report, headers } = await analyzeVideo(url, platform, metadata));
    } else if (mode === 'screenshot') {
      ({ report, headers } = await analyzeImage(imageBlobId, platform, metadata));
    } else {
      throw new Error(`Unknown mode: ${mode}`);
    }
    
    if (report.analysis_id) {
      cacheAnalysis(report.analysis_id, report);
    }
    
    // Store report in session storage (for cache)
    await storageSet({ currentReport: report }, 'session');
    
    updateRateLimit(sender.tab?.id);
    
    // Return report directly to content script (for floating panel)
    return { 
      success: true, 
      report: report,
      headers: headers,
      analysis_id: report.analysis_id 
    };
    
  } catch (error) {
    errorLog('BACKGROUND', 'Analyze request failed:', error);
    
    const errorResponse = parseApiError(error);
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

async function analyzeText(text, platform, metadata) {
  const apiUrl = getApiUrl();
  
  const response = await retryWithBackoff(async () => {
    const formData = new FormData();
    formData.append('text', text);
    formData.append('platform', platform);
    
    const res = await fetch(`${apiUrl}/analyze-text`, {
      method: 'POST',
      body: formData
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new ApiError(res.status, error.detail || res.statusText);
    }
    
    return res;
  }, 2, 1000);
  
  const report = await response.json();
  const headers = extractHeaders(response.headers);
  
  return { report, headers };
}

async function analyzeVideo(url, platform, metadata) {
  const apiUrl = getApiUrl();
  
  const formData = new FormData();
  formData.append('url', url);
  formData.append('platform', platform);
  
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
  }, 2, 2000);
  
  const report = await response.json();
  const headers = extractHeaders(response.headers);
  
  return { report, headers };
}

async function analyzeImage(imageBlobId, platform, metadata) {
  const apiUrl = getApiUrl();
  
  const blob = await fetch(imageBlobId).then(r => r.blob());
  
  const formData = new FormData();
  formData.append('image', blob, 'screenshot.png');
  formData.append('platform', platform);
  
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
// CHAT REQUEST HANDLER
// ============================================================================

async function handleChatRequest(message, sender) {
  debugLog('BACKGROUND', `Chat request: analysis_id=${message.analysis_id}`);
  
  return {
    success: true,
    reply: 'La fonctionnalité de chat sera disponible prochainement.',
    citations: []
  };
}

// ============================================================================
// SIDE PANEL MANAGEMENT
// ============================================================================

async function openSidePanel(tabId) {
  try {
    if (!tabId) {
      debugLog('BACKGROUND', 'No tabId provided to openSidePanel');
      return;
    }
    
    // Get tab info to extract windowId
    const tab = await chrome.tabs.get(tabId);
    
    // Try to open side panel (requires user gesture from content script click)
    await chrome.sidePanel.open({ windowId: tab.windowId });
    debugLog('BACKGROUND', `Side panel opened for window ${tab.windowId}`);
    
    // Clear badge after opening
    chrome.action.setBadgeText({ text: '', tabId });
  } catch (error) {
    // MV3 limitation: sidePanel.open() often fails even with user gesture
    // when called via message passing. Show badge notification instead.
    debugLog('BACKGROUND', 'Auto-open failed (expected MV3 behavior):', error.message);
    
    // Set badge to notify user
    chrome.action.setBadgeText({ text: '1', tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50', tabId });
    
    // Enable panel for click
    try {
      if (tabId) {
        await chrome.sidePanel.setOptions({
          tabId,
          enabled: true
        });
        debugLog('BACKGROUND', 'Badge set - user can click icon to open panel');
      }
    } catch (fallbackError) {
      debugLog('BACKGROUND', 'Side panel API error:', fallbackError.message);
    }
  }
}

async function handleOpenPanel(tabId) {
  await openSidePanel(tabId);
  return { success: true };
}

async function sendReportToPanel(report, headers) {
  const message = createReportReady(report, headers);
  await storageSet({ latestReport: message }, 'session');
  debugLog('BACKGROUND', 'Report sent to panel');
}

async function sendErrorToPanel(errorResponse) {
  const message = createReportError(
    errorResponse.error,
    errorResponse.message,
    errorResponse.retryAfterSeconds
  );
  await storageSet({ latestReport: message }, 'session');
  debugLog('BACKGROUND', 'Error sent to panel');
}

// ============================================================================
// UTILITIES
// ============================================================================

function extractHeaders(headers) {
  return {
    modelCard: headers.get('x-model-card') || 'gpt-4o-mini',
    taxonomyVersion: headers.get('x-taxonomy-version') || 'DIMA-M2.2-130',
    latencyMs: headers.get('x-latency-ms') || '0',
    backendVersion: headers.get('x-backend-version') || 'unknown'
  };
}

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
  
  if (error.message.includes('fetch')) {
    return {
      error: 'network_error',
      message: 'Impossible de contacter le serveur. Vérifiez votre connexion.'
    };
  }
  
  return {
    error: 'unknown_error',
    message: 'Une erreur est survenue. Réessayez.'
  };
}

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

function isRateLimited(tabId) {
  if (!tabId) return false;
  
  const state = rateLimitState.get(tabId);
  if (!state) return false;
  
  const now = Date.now();
  const timeSinceLastRequest = now - state.lastRequest;
  
  if (state.count >= 3 && timeSinceLastRequest < 60000) {
    return true;
  }
  
  if (timeSinceLastRequest > 60000) {
    rateLimitState.delete(tabId);
    return false;
  }
  
  return false;
}

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
// ANALYSIS CACHE
// ============================================================================

function cacheAnalysis(analysisId, report) {
  analysisCache.set(analysisId, {
    report,
    timestamp: Date.now()
  });
  
  if (analysisCache.size > 10) {
    const firstKey = analysisCache.keys().next().value;
    analysisCache.delete(firstKey);
  }
}

// ============================================================================
// CLEANUP
// ============================================================================

chrome.tabs.onRemoved.addListener((tabId) => {
  rateLimitState.delete(tabId);
});

debugLog('BACKGROUND', 'Service worker loaded successfully');
