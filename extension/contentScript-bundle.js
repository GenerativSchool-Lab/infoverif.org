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
  
  return {
    text,
    metadata: {
      author: username,
      timestamp,
      permalink,
      platform: 'twitter'
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
  } catch (error) {
    console.warn('[InfoVerif] YouTube video not found:', error);
  }
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
  button.textContent = 'Analyser avec InfoVerif';
  
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
  
  showLoadingOverlay(element);
  
  try {
    let data, metadata;
    
    if (platform === PLATFORMS.TWITTER) {
      const extracted = extractTwitterData(element);
      data = { text: extracted.text };
      metadata = extracted.metadata;
    }
    
    const message = createAnalyzeRequest('text', platform, data, metadata);
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

async function handleYouTubeAnalyze() {
  debugLog('CONTENT_SCRIPT', 'Analyze clicked for YouTube');
  
  const button = document.getElementById('infoverif-youtube-button');
  if (button) {
    button.disabled = true;
    button.textContent = 'Analyse en cours...';
  }
  
  try {
    const extracted = extractYouTubeData();
    const message = createAnalyzeRequest(
      'video',
      PLATFORMS.YOUTUBE,
      { url: extracted.url },
      extracted.metadata
    );
    
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
        <span>✓ Analyse demandée</span>
        <small>Cliquez sur l'icône 🛡️ InfoVerif</small>
      </div>
    `;
    
    setTimeout(() => {
      hidePostHighlight(element);
    }, 3000);
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
