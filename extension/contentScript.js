/**
 * InfoVerif Extension - Content Script
 * 
 * Injected into social media pages to:
 * - Detect platform and posts
 * - Extract content (text, video URLs)
 * - Show selection UI (highlight + analyze button)
 * - Send analyze requests to background worker
 */

import { detectPlatform, MESSAGE_TYPES, PLATFORMS, debugLog } from './shared/constants.js';
import { createAnalyzeRequest } from './shared/messages.js';
import { 
  extractTwitterData, 
  extractYouTubeData,
  TWITTER_SELECTORS,
  YOUTUBE_SELECTORS 
} from './lib/selectors.js';
import { 
  waitForElement, 
  isElementInViewport,
  debounce 
} from './lib/utils.js';

// ============================================================================
// STATE
// ============================================================================

let currentPlatform = null;
let highlightedElements = new Set();
let activeOverlay = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize content script when DOM is ready
 */
function init() {
  currentPlatform = detectPlatform(window.location.href);
  debugLog('CONTENT_SCRIPT', `Initialized on platform: ${currentPlatform}`);
  
  if (currentPlatform === PLATFORMS.GENERIC) {
    debugLog('CONTENT_SCRIPT', 'Generic page, skipping auto-detection');
    return;
  }
  
  // Wait for page to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startDetection);
  } else {
    startDetection();
  }
}

/**
 * Start detecting posts/videos based on platform
 */
async function startDetection() {
  debugLog('CONTENT_SCRIPT', 'Starting post detection...');
  
  try {
    if (currentPlatform === PLATFORMS.TWITTER) {
      await detectTwitterPosts();
    } else if (currentPlatform === PLATFORMS.YOUTUBE) {
      await detectYouTubeVideo();
    }
    // TODO Phase 2: TikTok, Instagram, Facebook
  } catch (error) {
    console.error('[InfoVerif] Detection error:', error);
  }
}

// ============================================================================
// TWITTER DETECTION
// ============================================================================

/**
 * Detect and highlight Twitter posts
 */
async function detectTwitterPosts() {
  debugLog('CONTENT_SCRIPT', 'Waiting for Twitter posts...');
  
  try {
    // Wait for first tweet to appear
    await waitForElement(TWITTER_SELECTORS.postContainer.primary, 10000);
    
    // Initial scan
    scanTwitterPosts();
    
    // Watch for new posts (infinite scroll)
    observeNewTwitterPosts();
    
    debugLog('CONTENT_SCRIPT', 'Twitter detection active');
  } catch (error) {
    console.warn('[InfoVerif] Twitter posts not found:', error);
  }
}

/**
 * Scan page for Twitter posts and add highlight on hover
 */
function scanTwitterPosts() {
  const posts = document.querySelectorAll(TWITTER_SELECTORS.postContainer.primary);
  
  posts.forEach(post => {
    if (highlightedElements.has(post)) return;  // Already processed
    
    // Add hover listener
    post.addEventListener('mouseenter', () => showPostHighlight(post, 'twitter'));
    post.addEventListener('mouseleave', () => hidePostHighlight(post));
    
    highlightedElements.add(post);
  });
  
  debugLog('CONTENT_SCRIPT', `Found ${posts.length} Twitter posts`);
}

/**
 * Observe for new Twitter posts (infinite scroll)
 */
function observeNewTwitterPosts() {
  const observer = new MutationObserver(debounce(() => {
    scanTwitterPosts();
  }, 500));
  
  // Observe timeline container
  const timeline = document.querySelector('[data-testid="primaryColumn"]') || document.body;
  observer.observe(timeline, {
    childList: true,
    subtree: true
  });
}

// ============================================================================
// YOUTUBE DETECTION
// ============================================================================

/**
 * Detect YouTube video and show analyze button
 */
async function detectYouTubeVideo() {
  debugLog('CONTENT_SCRIPT', 'Waiting for YouTube video...');
  
  try {
    // Wait for video player
    await waitForElement(YOUTUBE_SELECTORS.videoContainer.primary, 10000);
    
    // Show floating analyze button
    showYouTubeAnalyzeButton();
    
    debugLog('CONTENT_SCRIPT', 'YouTube video detected');
  } catch (error) {
    console.warn('[InfoVerif] YouTube video not found:', error);
  }
}

/**
 * Show floating analyze button for YouTube video
 */
function showYouTubeAnalyzeButton() {
  // Check if button already exists
  if (document.getElementById('infoverif-youtube-button')) return;
  
  // Create floating button
  const button = document.createElement('button');
  button.id = 'infoverif-youtube-button';
  button.className = 'infoverif-youtube-analyze-btn';
  button.innerHTML = `
    <span class="infoverif-icon">🛡️</span>
    <span class="infoverif-text">${chrome.i18n.getMessage('buttonAnalyze')}</span>
  `;
  
  // Click handler
  button.addEventListener('click', () => handleYouTubeAnalyze());
  
  // Append to player container
  const playerContainer = document.querySelector('#movie_player') || 
                         document.querySelector(YOUTUBE_SELECTORS.videoContainer.primary);
  
  if (playerContainer) {
    playerContainer.appendChild(button);
  } else {
    // Fallback: append to body
    document.body.appendChild(button);
  }
}

// ============================================================================
// HIGHLIGHT & OVERLAY
// ============================================================================

/**
 * Show highlight overlay on post hover
 * @param {HTMLElement} element - Post container element
 * @param {string} platform - Platform ID
 */
function showPostHighlight(element, platform) {
  if (!element) return;
  
  // Add highlight class
  element.classList.add('infoverif-highlight');
  
  // Create overlay if not exists
  if (!activeOverlay) {
    activeOverlay = createAnalyzeOverlay(element, platform);
    element.appendChild(activeOverlay);
  }
}

/**
 * Hide highlight overlay
 * @param {HTMLElement} element - Post container element
 */
function hidePostHighlight(element) {
  if (!element) return;
  
  // Remove highlight class
  element.classList.remove('infoverif-highlight');
  
  // Remove overlay
  if (activeOverlay) {
    activeOverlay.remove();
    activeOverlay = null;
  }
}

/**
 * Create analyze overlay (button + tooltip)
 * @param {HTMLElement} element - Post container element
 * @param {string} platform - Platform ID
 * @returns {HTMLElement} Overlay element
 */
function createAnalyzeOverlay(element, platform) {
  const overlay = document.createElement('div');
  overlay.className = 'infoverif-overlay';
  
  // Analyze button
  const button = document.createElement('button');
  button.className = 'infoverif-analyze-btn';
  button.textContent = chrome.i18n.getMessage('buttonAnalyze');
  
  // Click handler
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    handleAnalyzeClick(element, platform);
  });
  
  overlay.appendChild(button);
  
  return overlay;
}

// ============================================================================
// ANALYZE HANDLERS
// ============================================================================

/**
 * Handle analyze button click for Twitter post
 * @param {HTMLElement} element - Post container element
 * @param {string} platform - Platform ID
 */
async function handleAnalyzeClick(element, platform) {
  debugLog('CONTENT_SCRIPT', `Analyze clicked for ${platform}`);
  
  // Show loading state
  showLoadingOverlay(element);
  
  try {
    let data, metadata;
    
    if (platform === PLATFORMS.TWITTER) {
      const extracted = extractTwitterData(element);
      data = { text: extracted.text };
      metadata = extracted.metadata;
    }
    
    // Create analyze request
    const message = createAnalyzeRequest('text', platform, data, metadata);
    
    // Send to background worker
    const response = await chrome.runtime.sendMessage(message);
    
    if (response.success) {
      debugLog('CONTENT_SCRIPT', 'Analysis request sent successfully');
      showSuccessOverlay(element);
    } else {
      showErrorOverlay(element, response.message);
    }
  } catch (error) {
    console.error('[InfoVerif] Analyze error:', error);
    showErrorOverlay(element, 'Une erreur est survenue');
  }
}

/**
 * Handle analyze button click for YouTube video
 */
async function handleYouTubeAnalyze() {
  debugLog('CONTENT_SCRIPT', 'Analyze clicked for YouTube');
  
  // Disable button
  const button = document.getElementById('infoverif-youtube-button');
  if (button) {
    button.disabled = true;
    button.textContent = 'Analyse en cours...';
  }
  
  try {
    const extracted = extractYouTubeData();
    
    // Create analyze request
    const message = createAnalyzeRequest(
      'video',
      PLATFORMS.YOUTUBE,
      { url: extracted.url },
      extracted.metadata
    );
    
    // Send to background worker
    const response = await chrome.runtime.sendMessage(message);
    
    if (response.success) {
      debugLog('CONTENT_SCRIPT', 'YouTube analysis request sent');
      if (button) {
        button.textContent = '✓ Analyse demandée';
        setTimeout(() => {
          button.disabled = false;
          button.innerHTML = `
            <span class="infoverif-icon">🛡️</span>
            <span class="infoverif-text">Analyser avec InfoVerif</span>
          `;
        }, 2000);
      }
    } else {
      if (button) {
        button.textContent = '✗ Erreur';
        button.disabled = false;
      }
    }
  } catch (error) {
    console.error('[InfoVerif] YouTube analyze error:', error);
    if (button) {
      button.textContent = '✗ Erreur';
      button.disabled = false;
    }
  }
}

// ============================================================================
// OVERLAY STATES
// ============================================================================

/**
 * Show loading overlay
 * @param {HTMLElement} element - Post container
 */
function showLoadingOverlay(element) {
  if (activeOverlay) {
    activeOverlay.innerHTML = `
      <div class="infoverif-loading">
        <div class="infoverif-spinner"></div>
        <span>Analyse en cours...</span>
      </div>
    `;
  }
}

/**
 * Show success overlay
 * @param {HTMLElement} element - Post container
 */
function showSuccessOverlay(element) {
  if (activeOverlay) {
    activeOverlay.innerHTML = `
      <div class="infoverif-success">
        <span>✓ Analyse demandée</span>
        <small>Le panneau va s'ouvrir</small>
      </div>
    `;
    
    // Auto-hide after 2s
    setTimeout(() => {
      hidePostHighlight(element);
    }, 2000);
  }
}

/**
 * Show error overlay
 * @param {HTMLElement} element - Post container
 * @param {string} message - Error message
 */
function showErrorOverlay(element, message) {
  if (activeOverlay) {
    activeOverlay.innerHTML = `
      <div class="infoverif-error">
        <span>✗ ${message}</span>
        <button class="infoverif-retry-btn">Réessayer</button>
      </div>
    `;
    
    // Retry button
    const retryBtn = activeOverlay.querySelector('.infoverif-retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleAnalyzeClick(element, currentPlatform);
      });
    }
  }
}

// ============================================================================
// MESSAGE LISTENERS
// ============================================================================

/**
 * Listen for messages from background worker
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  debugLog('CONTENT_SCRIPT', 'Message received:', message.type);
  
  if (message.type === MESSAGE_TYPES.PING) {
    sendResponse({ type: MESSAGE_TYPES.PONG, timestamp: Date.now() });
    return true;
  }
  
  // TODO: Handle other message types (e.g., CAPTURE_SCREENSHOT)
  
  return false;
});

// ============================================================================
// START
// ============================================================================

init();

