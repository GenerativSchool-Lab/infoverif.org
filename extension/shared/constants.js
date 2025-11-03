/**
 * InfoVerif Extension - Constants & Configuration
 * 
 * Central configuration for extension behavior, API endpoints, and platform definitions.
 */

// API Configuration
export const API_CONFIG = {
  // Production backend
  PRODUCTION_URL: 'https://infoveriforg-production.up.railway.app',
  
  // Local development
  LOCAL_URL: 'http://localhost:8000',
  
  // Determine which to use (can be overridden in settings)
  get BASE_URL() {
    // Check if running in development mode
    const isDev = !('update_url' in chrome.runtime.getManifest());
    return isDev ? this.LOCAL_URL : this.PRODUCTION_URL;
  },
  
  // API Endpoints
  ENDPOINTS: {
    ANALYZE: '/analyze',
    CHAT: '/chat',
    HEALTH: '/health',
    TRANSCRIPT_PREVIEW: '/transcript/preview',
    DIMA_TAXONOMY: '/dima-taxonomy'
  },
  
  // Request timeouts (ms)
  TIMEOUT: {
    ANALYZE: 30000,      // 30s (includes Whisper transcription)
    CHAT: 10000,         // 10s
    PREVIEW: 5000        // 5s
  }
};

// Supported Platforms
export const PLATFORMS = {
  TWITTER: 'twitter',
  X: 'twitter',  // X.com uses same backend platform ID
  YOUTUBE: 'youtube',
  TIKTOK: 'tiktok',
  INSTAGRAM: 'instagram',
  FACEBOOK: 'facebook',
  GENERIC: 'generic'
};

// Platform Detection (based on hostname)
export const PLATFORM_HOSTS = {
  'twitter.com': PLATFORMS.TWITTER,
  'x.com': PLATFORMS.X,
  'youtube.com': PLATFORMS.YOUTUBE,
  'tiktok.com': PLATFORMS.TIKTOK,
  'instagram.com': PLATFORMS.INSTAGRAM,
  'facebook.com': PLATFORMS.FACEBOOK
};

// Message Types (for chrome.runtime.sendMessage)
export const MESSAGE_TYPES = {
  // Content Script → Background
  ANALYZE_REQUEST: 'ANALYZE_REQUEST',
  
  // Background → Panel
  REPORT_READY: 'REPORT_READY',
  REPORT_ERROR: 'REPORT_ERROR',
  
  // Panel → Background
  CHAT_REQUEST: 'CHAT_REQUEST',
  OPEN_PANEL: 'OPEN_PANEL',
  
  // Background → Content Script
  HIGHLIGHT_POSTS: 'HIGHLIGHT_POSTS',
  CAPTURE_SCREENSHOT: 'CAPTURE_SCREENSHOT',
  
  // Generic
  PING: 'PING',
  PONG: 'PONG'
};

// Analysis Modes
export const ANALYSIS_MODES = {
  TEXT: 'text',
  VIDEO: 'video',
  SCREENSHOT: 'screenshot'
};

// Storage Keys (chrome.storage.session / chrome.storage.local)
export const STORAGE_KEYS = {
  // Session (cleared on browser close)
  CURRENT_ANALYSIS_ID: 'currentAnalysisId',
  CURRENT_REPORT: 'currentReport',
  CHAT_HISTORY: 'chatHistory',
  
  // Local (persistent)
  USER_PREFERENCES: 'userPreferences',
  RECENT_ANALYSES: 'recentAnalyses',  // Max 10, opt-in only
  API_URL_OVERRIDE: 'apiUrlOverride'
};

// Default User Preferences
export const DEFAULT_PREFERENCES = {
  lang: 'fr',
  theme: 'dark',  // 'dark' or 'light'
  enableHistory: false,  // Opt-in for recent analyses
  apiUrl: null  // null = use default, or custom URL
};

// UI Constants
export const UI_CONFIG = {
  // Highlight overlay
  HIGHLIGHT_BORDER_COLOR: '#0066ff',
  HIGHLIGHT_BORDER_WIDTH: '2px',
  
  // Analyze button
  BUTTON_BG_COLOR: '#0066ff',
  BUTTON_TEXT_COLOR: '#ffffff',
  
  // Tooltip
  TOOLTIP_BG_COLOR: '#000000',
  TOOLTIP_TEXT_COLOR: '#ffffff',
  
  // Panel
  PANEL_MIN_WIDTH: '400px',
  PANEL_MAX_WIDTH: '600px',
  
  // Animation durations (ms)
  FADE_DURATION: 200,
  SLIDE_DURATION: 300
};

// Rate Limiting (client-side checks)
export const RATE_LIMITS = {
  // Max analyses per minute (backup to server-side)
  ANALYSES_PER_MINUTE: 10,
  
  // Max chat messages per analysis
  CHAT_MESSAGES_PER_ANALYSIS: 10,
  
  // Chat cooldown (ms)
  CHAT_COOLDOWN: 5000  // 5s between messages
};

// Error Messages (French)
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Impossible de contacter le serveur. Vérifiez votre connexion.',
  RATE_LIMIT: 'Trop de requêtes. Attendez 1 minute.',
  SERVER_ERROR: 'Erreur serveur. Réessayez dans quelques instants.',
  NO_CONTENT: 'Aucun contenu détectable. Sélectionnez manuellement du texte.',
  VIDEO_PRIVATE: 'Vidéo non accessible (privée ou restreinte géographiquement).',
  CORS_ERROR: 'Extension non autorisée par le serveur. Contactez support@infoverif.org.',
  ANALYSIS_EXPIRED: 'Contexte de conversation expiré. Réanalysez le contenu.',
  UNKNOWN: 'Une erreur est survenue. Réessayez.'
};

// Success Messages (French)
export const SUCCESS_MESSAGES = {
  COPIED: 'Copié !',
  ANALYSIS_COMPLETE: 'Analyse terminée',
  CHAT_SENT: 'Message envoyé'
};

// Feature Flags (can be fetched from backend for killswitch)
export const FEATURES = {
  CHAT_ENABLED: true,
  SCREENSHOT_MODE: true,
  TRANSCRIPT_PREVIEW: true,
  HISTORY_ENABLED: false  // Opt-in in settings
};

// Development & Debug
export const DEBUG = {
  ENABLED: false,  // Set to true for console logs
  LOG_API_CALLS: false,
  LOG_MESSAGES: false,
  LOG_DOM_EXTRACTION: false
};

// Helper: Detect platform from current URL
export function detectPlatform(url) {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return PLATFORM_HOSTS[hostname] || PLATFORMS.GENERIC;
  } catch {
    return PLATFORMS.GENERIC;
  }
}

// Helper: Get full API URL
export function getApiUrl(endpoint) {
  const base = API_CONFIG.BASE_URL;
  return `${base}${endpoint}`;
}

// Helper: Debug log (only if DEBUG.ENABLED)
export function debugLog(category, ...args) {
  if (DEBUG.ENABLED && DEBUG[`LOG_${category.toUpperCase()}`]) {
    console.log(`[InfoVerif Debug: ${category}]`, ...args);
  }
}

// Helper: Error log (always logged)
export function errorLog(category, ...args) {
  console.error(`[InfoVerif Error: ${category}]`, ...args);
}

