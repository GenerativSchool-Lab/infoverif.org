/**
 * InfoVerif Extension - Content Script (Bundled)
 * 
 * Note: Bundled version without ES6 imports for full Chrome compatibility
 */

// ============================================================================
// CONSTANTS (inlined from shared/constants.js)
// ============================================================================

const PLATFORMS = {
  TWITTER: 'twitter',
  TIKTOK: 'tiktok',
  GENERIC: 'generic'
};

const MESSAGE_TYPES = {
  ANALYZE_REQUEST: 'ANALYZE_REQUEST',
  PING: 'PING',
  PONG: 'PONG'
};

function detectPlatform(url) {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) return PLATFORMS.TWITTER;
    if (hostname.includes('tiktok.com')) return PLATFORMS.TIKTOK;
    return PLATFORMS.GENERIC;
  } catch {
    return PLATFORMS.GENERIC;
  }
}

function debugLog(category, ...args) {
  console.log(`[InfoVerif:${category}]`, ...args);
}

// ============================================================================
// SELECTORS (inlined from lib/selectors.js)
// ============================================================================

const TWITTER_SELECTORS = {
  postContainer: {
    primary: 'article[data-testid="tweet"]',
    fallback: 'div[data-testid="cellInnerDiv"] article'
  },
  textContent: {
    primary: 'div[data-testid="tweetText"]',
    fallback: 'div[lang] span'
  },
  author: {
    username: 'a[role="link"][href*="/"]',
    displayName: 'div[data-testid="User-Name"] > div > div > span'
  },
  temporal: {
    timestamp: 'time',
    permalink: 'a[href*="/status/"]'
  },
  media: {
    images: 'div[data-testid="tweetPhoto"] img[src]',
    video: 'div[data-testid="videoPlayer"]'
  }
};

const TIKTOK_SELECTORS = {
  videoContainer: {
    primary: 'div[data-e2e="browse-video"]',  // Individual video page
    search: 'div[data-e2e="search_top-item"]',  // Search results page
    fallback: 'div[class*="DivVideoContainer"]'
  },
  textContent: {
    primary: 'h1[data-e2e="browse-video-desc"]',
    search: 'div[data-e2e="search-card-desc"]',
    fallback: 'div[class*="SpanText"]'
  },
  author: {
    username: 'a[data-e2e="browse-username"]',
    search: 'a[data-e2e="search-card-user-link"]',
    fallback: 'span[data-e2e="browse-username"]'
  },
  video: {
    element: 'video'
  }
};

function extractTwitterData(article) {
  const textEl = article.querySelector(TWITTER_SELECTORS.textContent.primary) ||
                 article.querySelector(TWITTER_SELECTORS.textContent.fallback);
  const text = textEl ? textEl.textContent.trim() : '';
  
  const usernameEl = article.querySelector(TWITTER_SELECTORS.author.username);
  const username = usernameEl ? usernameEl.getAttribute('href')?.split('/').pop() : 'unknown';
  
  const timeEl = article.querySelector(TWITTER_SELECTORS.temporal.timestamp);
  const timestamp = timeEl ? timeEl.getAttribute('datetime') : new Date().toISOString();
  
  const permalinkEl = article.querySelector(TWITTER_SELECTORS.temporal.permalink);
  const permalink = permalinkEl ? permalinkEl.href : window.location.href;
  
  // Detect video (multiple selectors for robustness)
  const videoElement = 
    article.querySelector(TWITTER_SELECTORS.media.video) ||  // Primary
    article.querySelector('div[data-testid="videoComponent"]') ||  // Alternative
    article.querySelector('video[src]') ||  // Direct video tag
    article.querySelector('div[aria-label*="video"]') ||  // Aria label (en)
    article.querySelector('div[aria-label*="Video"]') ||  // Aria label (en, capitalized)
    article.querySelector('div[aria-label*="vidéo"]');  // Aria label (fr)
  
  const hasVideo = !!videoElement;
  const videoUrl = hasVideo ? permalink : null; // Twitter video URL is the tweet permalink
  
  if (hasVideo) {
    debugLog('CONTENT_SCRIPT', `📹 Video detected! Selector: ${videoElement.tagName}[${videoElement.getAttribute('data-testid') || 'no-testid'}]`);
  }
  
  return {
    text,
    hasVideo,
    videoUrl,
    metadata: {
      author: username,
      timestamp,
      permalink,
      platform: 'twitter',
      hasVideo
    }
  };
}

function extractTikTokData(container) {
  // Check if it's a search result or individual video
  const isSearchPage = window.location.pathname.includes('/search');
  
  let textEl, authorEl, text, author, permalink;
  
  if (isSearchPage) {
    // Search result selectors
    textEl = container.querySelector(TIKTOK_SELECTORS.textContent.search) ||
             container.querySelector(TIKTOK_SELECTORS.textContent.fallback);
    authorEl = container.querySelector(TIKTOK_SELECTORS.author.search) ||
               container.querySelector(TIKTOK_SELECTORS.author.fallback);
    
    // Try to extract video URL from link
    const linkEl = container.querySelector('a[href*="/video/"]');
    permalink = linkEl ? `https://www.tiktok.com${linkEl.getAttribute('href')}` : window.location.href;
  } else {
    // Individual video selectors
    textEl = container.querySelector(TIKTOK_SELECTORS.textContent.primary) ||
             container.querySelector(TIKTOK_SELECTORS.textContent.fallback);
    authorEl = container.querySelector(TIKTOK_SELECTORS.author.username) ||
               container.querySelector(TIKTOK_SELECTORS.author.fallback);
    permalink = window.location.href;
  }
  
  text = textEl ? textEl.textContent.trim() : '';
  author = authorEl ? authorEl.textContent.trim().replace('@', '') : 'unknown';
  
  const hasVideo = !!container.querySelector(TIKTOK_SELECTORS.video.element);
  
  return {
    text,
    hasVideo,
    videoUrl: hasVideo ? permalink : null,
    metadata: {
      author,
      permalink,
      platform: 'tiktok',
      hasVideo
    }
  };
}

// ============================================================================
// UTILS (inlined from lib/utils.js)
// ============================================================================

function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) return resolve(element);
    
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        clearTimeout(timeoutId);
        resolve(el);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found after ${timeout}ms`));
    }, timeout);
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ============================================================================
// MESSAGES (inlined from shared/messages.js)
// ============================================================================

function createAnalyzeRequest(mode, platform, data, metadata) {
  return {
    type: MESSAGE_TYPES.ANALYZE_REQUEST,
    mode,
    platform,
    text: data.text,
    url: data.url,
    imageBlobId: data.imageBlobId,
    metadata
  };
}

// ============================================================================
// STATE
// ============================================================================

let currentPlatform = null;
let highlightedElements = new Set();
let activeOverlay = null;
let analyzedCache = new Map(); // permalink -> { timestamp, analysis_id }
let analyzingPosts = new Map(); // permalink -> 'loading' | 'success' | 'error' (in-progress analysis state)
let floatingPanelInjected = false;

// ============================================================================
// FLOATING PANEL INJECTION
// ============================================================================

async function injectFloatingPanel() {
  if (floatingPanelInjected) {
    debugLog('CONTENT_SCRIPT', 'Panel already injected');
    return;
  }
  
  try {
    // Fetch panel HTML
    const panelHTML = await fetch(chrome.runtime.getURL('ui/floating-panel.html')).then(r => r.text());
    
    // Inject CSS
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = chrome.runtime.getURL('ui/floating-panel.css');
    document.head.appendChild(cssLink);
    
    // Inject HTML
    const container = document.createElement('div');
    container.innerHTML = panelHTML;
    document.body.appendChild(container.firstElementChild);
    
    // Inject JS
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('ui/floating-panel.js');
    document.body.appendChild(script);
    
    floatingPanelInjected = true;
    debugLog('CONTENT_SCRIPT', 'Floating panel injected successfully');
  } catch (error) {
    console.error('[InfoVerif] Failed to inject panel:', error);
  }
}

function showPanelLoading() {
  window.postMessage({ type: 'INFOVERIF_SHOW_LOADING' }, '*');
}

function showPanelReport(report) {
  window.postMessage({ type: 'INFOVERIF_SHOW_REPORT', report }, '*');
}

function showPanelError(error) {
  window.postMessage({ type: 'INFOVERIF_SHOW_ERROR', error }, '*');
}

// ============================================================================
// INITIALIZATION
// ============================================================================

function init() {
  currentPlatform = detectPlatform(window.location.href);
  debugLog('CONTENT_SCRIPT', `Initialized on platform: ${currentPlatform}`);
  
  if (currentPlatform === PLATFORMS.GENERIC) {
    debugLog('CONTENT_SCRIPT', 'Generic page, skipping auto-detection');
    return;
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startDetection);
  } else {
    startDetection();
  }
}

async function startDetection() {
  debugLog('CONTENT_SCRIPT', 'Starting post detection...');
  
  try {
    if (currentPlatform === PLATFORMS.TWITTER) {
      await detectTwitterPosts();
    } else if (currentPlatform === PLATFORMS.TIKTOK) {
      await detectTikTokVideo();
    }
  } catch (error) {
    console.error('[InfoVerif] Detection error:', error);
  }
}

// ============================================================================
// TWITTER DETECTION
// ============================================================================

async function detectTwitterPosts() {
  debugLog('CONTENT_SCRIPT', 'Waiting for Twitter posts...');
  
  try {
    await waitForElement(TWITTER_SELECTORS.postContainer.primary, 10000);
    scanTwitterPosts();
    observeNewTwitterPosts();
    debugLog('CONTENT_SCRIPT', 'Twitter detection active');
  } catch (error) {
    console.warn('[InfoVerif] Twitter posts not found:', error);
  }
}

function scanTwitterPosts() {
  const posts = document.querySelectorAll(TWITTER_SELECTORS.postContainer.primary);
  
  posts.forEach(post => {
    if (highlightedElements.has(post)) return;
    
    post.addEventListener('mouseenter', () => showPostHighlight(post, 'twitter'));
    post.addEventListener('mouseleave', () => hidePostHighlight(post));
    
    highlightedElements.add(post);
  });
  
  debugLog('CONTENT_SCRIPT', `Found ${posts.length} Twitter posts`);
}

function observeNewTwitterPosts() {
  const observer = new MutationObserver(debounce(() => {
    scanTwitterPosts();
  }, 500));
  
  const timeline = document.querySelector('[data-testid="primaryColumn"]') || document.body;
  observer.observe(timeline, {
    childList: true,
    subtree: true
  });
}

// ============================================================================
// TIKTOK DETECTION
// ============================================================================

async function detectTikTokVideo() {
  debugLog('CONTENT_SCRIPT', 'Waiting for TikTok content...');
  
  try {
    // UNIVERSAL DETECTION: Wait for any video element (TikTok always has videos)
    await waitForElement('video', 10000);
    
    // Determine page type based on URL
    const pathname = window.location.pathname;
    const isSearchPage = pathname.includes('/search');
    const isVideoPage = pathname.includes('/video/') || pathname.match(/@[\w.-]+\/video\/\d+/);
    
    // Strategy: Use fixed button for all pages (simpler, consistent UX)
    showTikTokAnalyzeButton();
    
    // Watch for URL changes (TikTok feed/FYP changes URL without reload)
    observeTikTokNavigation();
    
    if (isSearchPage) {
      debugLog('CONTENT_SCRIPT', 'TikTok search page detected');
    } else if (isVideoPage) {
      debugLog('CONTENT_SCRIPT', 'TikTok video page detected');
    } else {
      debugLog('CONTENT_SCRIPT', 'TikTok feed/FYP detected');
    }
  } catch (error) {
    console.warn('[InfoVerif] TikTok video not found:', error);
  }
}

function observeTikTokNavigation() {
  let lastUrl = window.location.href;
  
  // Watch for URL changes (TikTok SPA navigation)
  const observer = new MutationObserver(debounce(() => {
    const currentUrl = window.location.href;
    
    if (currentUrl !== lastUrl) {
      debugLog('CONTENT_SCRIPT', `TikTok navigation detected: ${lastUrl} → ${currentUrl}`);
      lastUrl = currentUrl;
      
      // Button stays visible (no need to remove/re-inject)
      // User can analyze any video in feed by clicking button
      debugLog('CONTENT_SCRIPT', 'TikTok: Button persists across navigation');
    }
  }, 300));
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function scanTikTokVideos() {
  const videos = document.querySelectorAll(TIKTOK_SELECTORS.videoContainer.search);
  
  videos.forEach(video => {
    if (highlightedElements.has(video)) return;
    
    video.addEventListener('mouseenter', () => showPostHighlight(video, 'tiktok'));
    video.addEventListener('mouseleave', () => hidePostHighlight(video));
    
    highlightedElements.add(video);
  });
  
  debugLog('CONTENT_SCRIPT', `Found ${videos.length} TikTok videos`);
}

function observeNewTikTokVideos() {
  const observer = new MutationObserver(debounce(() => {
    scanTikTokVideos();
  }, 500));
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function showTikTokAnalyzeButton() {
  if (document.getElementById('infoverif-tiktok-button')) return;
  
  const button = document.createElement('button');
  button.id = 'infoverif-tiktok-button';
  button.className = 'infoverif-youtube-analyze-btn'; // Reuse YouTube button style
  button.innerHTML = `
    <span class="infoverif-icon">🛡️</span>
    <span class="infoverif-text">Analyser avec InfoVerif</span>
  `;
  
  button.addEventListener('click', () => handleTikTokAnalyze());
  document.body.appendChild(button);
}

async function handleTikTokAnalyze() {
  debugLog('CONTENT_SCRIPT', 'Analyze clicked for TikTok');
  
  const button = document.getElementById('infoverif-tiktok-button');
  if (button) {
    button.disabled = true;
    button.textContent = 'Analyse en cours...';
  }
  
  try {
    await injectFloatingPanel();
    
    // UNIVERSAL EXTRACTION: Find currently visible/playing video
    // TikTok always uses current URL as video identifier (individual, feed, FYP)
    const url = window.location.href;
    
    // Try to find video description from DOM
    let text = '';
    const descSelectors = [
      'h1[data-e2e="browse-video-desc"]',  // Individual video
      'div[data-e2e="search-card-desc"]',   // Search results
      'div.tiktok-1ejylhp-DivContainer',    // Feed
      'span[class*="SpanText"]'              // Generic fallback
    ];
    
    for (const selector of descSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent.trim()) {
        text = el.textContent.trim();
        break;
      }
    }
    
    // Try to find author
    let author = 'unknown';
    const authorSelectors = [
      'a[data-e2e="browse-username"]',
      'a[data-e2e="search-card-user-link"]',
      'span[data-e2e="browse-username"]'
    ];
    
    for (const selector of authorSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent.trim()) {
        author = el.textContent.trim().replace('@', '');
        break;
      }
    }
    
    const metadata = {
      author,
      permalink: url,
      platform: 'tiktok',
      hasVideo: true,
      postText: text  // For multimodal analysis
    };
    
    showPanelLoading();
    
    const message = createAnalyzeRequest('video', PLATFORMS.TIKTOK, { url }, metadata);
    const response = await chrome.runtime.sendMessage(message);
    
    if (response.success && response.report) {
      showPanelReport(response.report);
      if (button) button.textContent = '✓ Analysé';
    } else {
      showPanelError(response.message || 'Erreur');
      if (button) button.textContent = '✗ Erreur';
    }
  } catch (error) {
    console.error('[InfoVerif] TikTok analyze error:', error);
    showPanelError(error.message);
    if (button) button.textContent = '✗ Erreur';
  } finally {
    if (button) {
      setTimeout(() => {
        button.disabled = false;
        button.innerHTML = `<span class="infoverif-icon">🛡️</span><span class="infoverif-text">Analyser avec InfoVerif</span>`;
      }, 2000);
    }
  }
}

// ============================================================================
// HIGHLIGHT & OVERLAY
// ============================================================================

function showPostHighlight(element, platform) {
  if (!element) return;
  
  element.classList.add('infoverif-highlight');
  
  if (!activeOverlay) {
    activeOverlay = createAnalyzeOverlay(element, platform);
    element.appendChild(activeOverlay);
  }
}

function hidePostHighlight(element) {
  if (!element) return;
  
  element.classList.remove('infoverif-highlight');
  
  if (activeOverlay) {
    activeOverlay.remove();
    activeOverlay = null;
  }
}

function createAnalyzeOverlay(element, platform) {
  const overlay = document.createElement('div');
  overlay.className = 'infoverif-overlay';
  
  // Extract permalink first (needed for all checks)
  let permalink = null;
  try {
    if (platform === PLATFORMS.TWITTER) {
      const extracted = extractTwitterData(element);
      permalink = extracted.metadata?.permalink;
    } else if (platform === PLATFORMS.TIKTOK) {
      const extracted = extractTikTokData(element);
      permalink = extracted.metadata?.permalink;
    }
  } catch (error) {
    console.warn('[InfoVerif] Failed to extract permalink:', error);
  }
  
  // Check if currently being analyzed (PRIORITY)
  const analyzingState = permalink ? analyzingPosts.get(permalink) : null;
  
  if (analyzingState === 'loading') {
    // Show loading state (analysis in progress)
    overlay.innerHTML = `
      <div class="infoverif-loading">
        <div class="infoverif-spinner"></div>
        <span>Analyse en cours...</span>
      </div>
    `;
    return overlay;
  }
  
  // Check if already analyzed (cached)
  let isAnalyzed = false;
  if (permalink) {
    const cached = analyzedCache.get(permalink);
    const CACHE_TTL = 5 * 60 * 1000;
    
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      isAnalyzed = true;
    }
  }
  
  // Create button with appropriate state
  const button = document.createElement('button');
  button.className = 'infoverif-analyze-btn';
  
  if (isAnalyzed) {
    button.innerHTML = '✓ Déjà analysé • Cliquez pour analyser de nouveau';
    button.classList.add('analyzed');
  } else {
    button.textContent = 'Analyser avec InfoVerif';
  }
  
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

async function handleAnalyzeClick(element, platform) {
  debugLog('CONTENT_SCRIPT', `Analyze clicked for ${platform}`);
  
  try {
    // Inject panel if not already done
    await injectFloatingPanel();
    
    let data, metadata, mode;
    
    // Extract data based on platform
    let extracted;
    if (platform === PLATFORMS.TWITTER) {
      extracted = extractTwitterData(element);
    } else if (platform === PLATFORMS.TIKTOK) {
      extracted = extractTikTokData(element);
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }
    
    metadata = extracted.metadata;
    const permalink = metadata.permalink;
    
    // Check if already being analyzed
    if (analyzingPosts.get(permalink) === 'loading') {
      debugLog('CONTENT_SCRIPT', 'Analysis already in progress for this post');
      return;
    }
    
    // Check cache first
    const cached = analyzedCache.get(permalink);
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      debugLog('CONTENT_SCRIPT', 'Using cached analysis');
      
      // Show cached report from storage
      const { currentReport } = await chrome.storage.session.get('currentReport');
      if (currentReport) {
        showPanelReport(currentReport);
      }
      
      showSuccessOverlay(element);
      return;
    }
    
    // Mark as loading
    analyzingPosts.set(permalink, 'loading');
    
    // Determine mode: video or text
    if (extracted.hasVideo && extracted.videoUrl) {
      mode = 'video';
      data = { url: extracted.videoUrl };
      
      // MULTIMODAL: Include post text with video for fusion analysis
      if (extracted.text) {
        metadata.postText = extracted.text;
      }
      
      debugLog('CONTENT_SCRIPT', `Video detected! URL: ${extracted.videoUrl}, Text: ${extracted.text ? extracted.text.substring(0, 50) + '...' : 'no text'}`);
    } else {
      mode = 'text';
      data = { text: extracted.text };
    }
    
    showLoadingOverlay(element);
    showPanelLoading();
    
    const message = createAnalyzeRequest(mode, platform, data, metadata);
    const response = await chrome.runtime.sendMessage(message);
    
    if (response.success && response.report) {
      debugLog('CONTENT_SCRIPT', 'Analysis complete, showing report');
      
      // Mark as success
      analyzingPosts.set(permalink, 'success');
      
      // Cache the analysis
      if (metadata?.permalink) {
        analyzedCache.set(metadata.permalink, {
          timestamp: Date.now(),
          analysis_id: response.analysis_id
        });
      }
      
      // Show report in floating panel
      showPanelReport(response.report);
      
      showSuccessOverlay(element);
      
      // Clean up loading state after 2 seconds
      setTimeout(() => {
        analyzingPosts.delete(permalink);
      }, 2000);
    } else {
      // Mark as error
      analyzingPosts.set(permalink, 'error');
      
      showPanelError(response.message || 'Erreur lors de l\'analyse');
      showErrorOverlay(element, response.message);
      
      // Clean up error state after 5 seconds
      setTimeout(() => {
        analyzingPosts.delete(permalink);
      }, 5000);
    }
  } catch (error) {
    console.error('[InfoVerif] Analyze error:', error);
    
    // Mark as error
    if (metadata?.permalink) {
      analyzingPosts.set(metadata.permalink, 'error');
      
      // Clean up error state after 5 seconds
      setTimeout(() => {
        analyzingPosts.delete(metadata.permalink);
      }, 5000);
    }
    
    showPanelError(error.message);
    
    // Check if extension context was invalidated (extension reloaded)
    if (error.message.includes('Extension context invalidated')) {
      showErrorOverlay(element, 'Extension rechargée - Rafraîchissez la page (F5)');
    } else if (error.message.includes('message port closed')) {
      showErrorOverlay(element, 'Connexion perdue - Rafraîchissez la page (F5)');
    } else {
      showErrorOverlay(element, 'Une erreur est survenue');
    }
  }
}

// ============================================================================
// OVERLAY STATES
// ============================================================================

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

function showSuccessOverlay(element) {
  if (activeOverlay) {
    activeOverlay.innerHTML = `
      <div class="infoverif-success">
        <span>✓ Analyse en cours</span>
        <small>Consultez le panneau →</small>
      </div>
    `;
    
    setTimeout(() => {
      hidePostHighlight(element);
    }, 2000);
  }
}

function showErrorOverlay(element, message) {
  if (activeOverlay) {
    activeOverlay.innerHTML = `
      <div class="infoverif-error">
        <span>✗ ${message}</span>
        <button class="infoverif-retry-btn">Réessayer</button>
      </div>
    `;
    
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  debugLog('CONTENT_SCRIPT', 'Message received:', message.type);
  
  if (message.type === MESSAGE_TYPES.PING) {
    sendResponse({ type: MESSAGE_TYPES.PONG, timestamp: Date.now() });
    return true;
  }
  
  return false;
});

// ============================================================================
// START
// ============================================================================

init();

debugLog('CONTENT_SCRIPT', 'Content script loaded successfully');
