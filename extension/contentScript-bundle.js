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
  YOUTUBE: 'youtube',
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
    if (hostname.includes('youtube.com')) return PLATFORMS.YOUTUBE;
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

const YOUTUBE_SELECTORS = {
  videoContainer: {
    primary: 'ytd-watch-flexy'
  },
  url: {
    canonical: 'link[rel="canonical"]'
  },
  metadata: {
    title: 'h1.ytd-watch-metadata yt-formatted-string',
    channel: 'ytd-channel-name a'
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

function extractYouTubeData() {
  const canonicalEl = document.querySelector(YOUTUBE_SELECTORS.url.canonical);
  let url = canonicalEl ? canonicalEl.href : window.location.href;
  
  if (url.includes('/shorts/')) {
    const videoId = url.split('/shorts/')[1].split('?')[0];
    url = `https://www.youtube.com/watch?v=${videoId}`;
  }
  
  const titleEl = document.querySelector(YOUTUBE_SELECTORS.metadata.title);
  const title = titleEl ? titleEl.textContent.trim() : 'Unknown Title';
  
  const channelEl = document.querySelector(YOUTUBE_SELECTORS.metadata.channel);
  const channel = channelEl ? channelEl.textContent.trim() : 'Unknown Channel';
  
  return {
    url,
    metadata: {
      title,
      channel,
      permalink: url,
      platform: 'youtube'
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
    } else if (currentPlatform === PLATFORMS.YOUTUBE) {
      await detectYouTubeVideo();
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
// YOUTUBE DETECTION
// ============================================================================

async function detectYouTubeVideo() {
  debugLog('CONTENT_SCRIPT', 'Waiting for YouTube video...');
  
  try {
    await waitForElement(YOUTUBE_SELECTORS.videoContainer.primary, 10000);
    showYouTubeAnalyzeButton();
    debugLog('CONTENT_SCRIPT', 'YouTube video detected');
    
    // Watch for SPA navigation (YouTube doesn't reload page)
    observeYouTubeNavigation();
  } catch (error) {
    console.warn('[InfoVerif] YouTube video not found:', error);
  }
}

function observeYouTubeNavigation() {
  let lastUrl = window.location.href;
  
  // Watch for URL changes (SPA navigation)
  const observer = new MutationObserver(debounce(() => {
    const currentUrl = window.location.href;
    
    if (currentUrl !== lastUrl) {
      debugLog('CONTENT_SCRIPT', `YouTube navigation detected: ${lastUrl} → ${currentUrl}`);
      lastUrl = currentUrl;
      
      // Remove old button
      const oldButton = document.getElementById('infoverif-youtube-button');
      if (oldButton) {
        oldButton.remove();
      }
      
      // Re-detect video after short delay (let YouTube load content)
      setTimeout(() => {
        if (currentUrl.includes('/watch?v=') || currentUrl.includes('/shorts/')) {
          detectYouTubeVideo();
        }
      }, 500);
    }
  }, 300));
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function showYouTubeAnalyzeButton() {
  if (document.getElementById('infoverif-youtube-button')) return;
  
  const button = document.createElement('button');
  button.id = 'infoverif-youtube-button';
  button.className = 'infoverif-youtube-analyze-btn';
  button.innerHTML = `
    <span class="infoverif-icon">🛡️</span>
    <span class="infoverif-text">Analyser avec InfoVerif</span>
  `;
  
  button.addEventListener('click', () => handleYouTubeAnalyze());
  
  const playerContainer = document.querySelector('#movie_player') || 
                         document.querySelector(YOUTUBE_SELECTORS.videoContainer.primary);
  
  if (playerContainer) {
    playerContainer.appendChild(button);
  } else {
    document.body.appendChild(button);
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
  
  const button = document.createElement('button');
  button.className = 'infoverif-analyze-btn';
  
  // Check if already analyzed
  let isAnalyzed = false;
  if (platform === PLATFORMS.TWITTER) {
    const extracted = extractTwitterData(element);
    const permalink = extracted.metadata?.permalink;
    const cached = analyzedCache.get(permalink);
    const CACHE_TTL = 5 * 60 * 1000;
    
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      isAnalyzed = true;
    }
  }
  
  if (isAnalyzed) {
    button.innerHTML = '✓ Déjà analysé • Cliquez pour rouvrir';
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
    
    if (platform === PLATFORMS.TWITTER) {
      const extracted = extractTwitterData(element);
      metadata = extracted.metadata;
      
      // Check cache first
      const permalink = metadata.permalink;
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
      
      // Determine mode: video or text
      if (extracted.hasVideo && extracted.videoUrl) {
        mode = 'video';
        data = { url: extracted.videoUrl };
        
        // MULTIMODAL: Include post text with video for fusion analysis
        metadata.postText = extracted.text; // Add text to metadata
        
        debugLog('CONTENT_SCRIPT', `Video detected! URL: ${extracted.videoUrl}, Text: ${extracted.text.substring(0, 50)}...`);
      } else {
        mode = 'text';
        data = { text: extracted.text };
      }
    }
    
    showLoadingOverlay(element);
    showPanelLoading();
    
    const message = createAnalyzeRequest(mode, platform, data, metadata);
    const response = await chrome.runtime.sendMessage(message);
    
    if (response.success && response.report) {
      debugLog('CONTENT_SCRIPT', 'Analysis complete, showing report');
      
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
    } else {
      showPanelError(response.message || 'Erreur lors de l\'analyse');
      showErrorOverlay(element, response.message);
    }
  } catch (error) {
    console.error('[InfoVerif] Analyze error:', error);
    
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

async function handleYouTubeAnalyze() {
  debugLog('CONTENT_SCRIPT', 'Analyze clicked for YouTube');
  
  const button = document.getElementById('infoverif-youtube-button');
  if (button) {
    button.disabled = true;
    button.textContent = 'Analyse en cours...';
  }
  
  try {
    // Inject floating panel if not already done
    await injectFloatingPanel();
    
    const extracted = extractYouTubeData();
    
    // Check cache first
    const videoUrl = extracted.url;
    const cached = analyzedCache.get(videoUrl);
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      debugLog('CONTENT_SCRIPT', 'Using cached YouTube analysis');
      
      // Show cached report from storage
      const { currentReport } = await chrome.storage.session.get('currentReport');
      if (currentReport) {
        showPanelReport(currentReport);
      }
      
      if (button) {
        button.disabled = false;
        button.textContent = '✓ Déjà analysé';
        setTimeout(() => {
          button.innerHTML = `
            <span class="infoverif-icon">🛡️</span>
            <span class="infoverif-text">Analyser avec InfoVerif</span>
          `;
        }, 2000);
      }
      return;
    }
    
    showPanelLoading();
    
    const message = createAnalyzeRequest(
      'video',
      PLATFORMS.YOUTUBE,
      { url: extracted.url },
      extracted.metadata
    );
    
    const response = await chrome.runtime.sendMessage(message);
    
    if (response.success && response.report) {
      debugLog('CONTENT_SCRIPT', 'YouTube analysis complete, showing report');
      
      // Cache the analysis
      analyzedCache.set(videoUrl, {
        timestamp: Date.now(),
        analysis_id: response.analysis_id
      });
      
      // Show report in floating panel
      showPanelReport(response.report);
      
      if (button) {
        button.disabled = false;
        button.textContent = '✓ Analyse terminée';
        setTimeout(() => {
          button.innerHTML = `
            <span class="infoverif-icon">🛡️</span>
            <span class="infoverif-text">Analyser avec InfoVerif</span>
          `;
        }, 2000);
      }
    } else {
      showPanelError(response.message || 'Erreur lors de l\'analyse');
      
      if (button) {
        button.textContent = '✗ Erreur';
        button.disabled = false;
      }
    }
  } catch (error) {
    console.error('[InfoVerif] YouTube analyze error:', error);
    
    showPanelError(error.message);
    
    if (button) {
      // Check for context invalidation
      if (error.message.includes('Extension context invalidated') || 
          error.message.includes('message port closed')) {
        button.textContent = '✗ Rafraîchissez (F5)';
      } else {
        button.textContent = '✗ Erreur';
      }
      button.disabled = false;
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
