/**
 * InfoVerif Extension - Platform-Specific Selectors
 * 
 * Robust CSS selectors and heuristics for extracting content from social media platforms.
 * Each platform has primary selectors and fallbacks to handle DOM changes.
 */

/**
 * ============================================================================
 * TWITTER / X
 * ============================================================================
 */

export const TWITTER_SELECTORS = {
  // Post container
  postContainer: {
    primary: 'article[data-testid="tweet"]',
    fallback: 'div[data-testid="cellInnerDiv"] article',
    // If both fail, find any <article> element
    generic: 'article'
  },
  
  // Text content
  textContent: {
    primary: 'div[data-testid="tweetText"]',
    fallback: 'div[lang] span',
    // Filter out UI elements
    exclude: '[data-testid="socialContext"]'
  },
  
  // Author information
  author: {
    username: 'a[role="link"][href*="/"]',  // First link in header
    displayName: 'div[data-testid="User-Name"] > div > div > span',
    verified: 'svg[data-testid="icon-verified"]'
  },
  
  // Temporal information
  temporal: {
    timestamp: 'time',  // <time> element has datetime attribute
    permalink: 'a[href*="/status/"]'  // Link to tweet status
  },
  
  // Media
  media: {
    images: 'div[data-testid="tweetPhoto"] img[src]',
    video: 'div[data-testid="videoPlayer"]'
  },
  
  // Engagement (optional, for context)
  engagement: {
    likes: 'button[data-testid="like"]',
    retweets: 'button[data-testid="retweet"]',
    replies: 'button[data-testid="reply"]'
  }
};

/**
 * Extract data from Twitter post
 * @param {HTMLElement} article - Tweet article element
 * @returns {Object} Extracted data {text, author, timestamp, permalink}
 */
export function extractTwitterData(article) {
  // Text content
  const textEl = article.querySelector(TWITTER_SELECTORS.textContent.primary) ||
                 article.querySelector(TWITTER_SELECTORS.textContent.fallback);
  const text = textEl ? cleanTextContent(textEl) : '';
  
  // Author
  const usernameEl = article.querySelector(TWITTER_SELECTORS.author.username);
  const username = usernameEl ? usernameEl.getAttribute('href')?.split('/').pop() : 'unknown';
  
  const displayNameEl = article.querySelector(TWITTER_SELECTORS.author.displayName);
  const displayName = displayNameEl ? displayNameEl.textContent.trim() : username;
  
  const verified = !!article.querySelector(TWITTER_SELECTORS.author.verified);
  
  // Timestamp
  const timeEl = article.querySelector(TWITTER_SELECTORS.temporal.timestamp);
  const timestamp = timeEl ? timeEl.getAttribute('datetime') : new Date().toISOString();
  
  // Permalink
  const permalinkEl = article.querySelector(TWITTER_SELECTORS.temporal.permalink);
  const permalink = permalinkEl ? permalinkEl.href : window.location.href;
  
  return {
    text,
    metadata: {
      author: username,
      displayName,
      verified,
      timestamp,
      permalink,
      platform: 'twitter'
    }
  };
}

/**
 * ============================================================================
 * YOUTUBE
 * ============================================================================
 */

export const YOUTUBE_SELECTORS = {
  // Video detection
  videoContainer: {
    primary: 'ytd-watch-flexy',
    player: '#movie_player',
    fallback: 'div#player'
  },
  
  // Video URL
  url: {
    canonical: 'link[rel="canonical"]',  // Most reliable
    // Fallback: parse from window.location
  },
  
  // Video metadata
  metadata: {
    title: 'h1.ytd-watch-metadata yt-formatted-string',
    channel: 'ytd-channel-name a',
    channelVerified: 'ytd-badge-supported-renderer',
    description: 'ytd-text-inline-expander #description-inner',
    views: 'ytd-video-view-count-renderer span.view-count',
    uploadDate: 'meta[itemprop="uploadDate"]',
    duration: 'meta[itemprop="duration"]'
  },
  
  // Engagement
  engagement: {
    likes: 'like-button-view-model button',
    comments: 'ytd-comments-header-renderer #count'
  }
};

/**
 * Extract data from YouTube video page
 * @returns {Object} Extracted data {url, title, channel, metadata}
 */
export function extractYouTubeData() {
  // Video URL (canonical is most reliable)
  const canonicalEl = document.querySelector(YOUTUBE_SELECTORS.url.canonical);
  let url = canonicalEl ? canonicalEl.href : window.location.href;
  
  // Convert /shorts/ URLs to /watch?v=
  if (url.includes('/shorts/')) {
    const videoId = url.split('/shorts/')[1].split('?')[0];
    url = `https://www.youtube.com/watch?v=${videoId}`;
  }
  
  // Title
  const titleEl = document.querySelector(YOUTUBE_SELECTORS.metadata.title);
  const title = titleEl ? titleEl.textContent.trim() : 'Unknown Title';
  
  // Channel
  const channelEl = document.querySelector(YOUTUBE_SELECTORS.metadata.channel);
  const channel = channelEl ? channelEl.textContent.trim() : 'Unknown Channel';
  
  const verified = !!document.querySelector(YOUTUBE_SELECTORS.metadata.channelVerified);
  
  // Duration (from meta tag)
  const durationEl = document.querySelector(YOUTUBE_SELECTORS.metadata.duration);
  const duration = durationEl ? parseDuration(durationEl.content) : null;
  
  // Upload date
  const uploadDateEl = document.querySelector(YOUTUBE_SELECTORS.metadata.uploadDate);
  const uploadDate = uploadDateEl ? uploadDateEl.content : null;
  
  // Description (first 500 chars for preview)
  const descEl = document.querySelector(YOUTUBE_SELECTORS.metadata.description);
  const description = descEl ? descEl.textContent.trim().slice(0, 500) : '';
  
  return {
    url,
    metadata: {
      title,
      channel,
      verified,
      durationSeconds: duration,
      uploadDate,
      description,
      permalink: url,
      platform: 'youtube'
    }
  };
}

/**
 * ============================================================================
 * TIKTOK (Phase 2)
 * ============================================================================
 */

export const TIKTOK_SELECTORS = {
  videoContainer: {
    primary: 'div[data-e2e="browse-video"]',
    fallback: 'div.video-card-container'
  },
  
  caption: {
    primary: 'div[data-e2e="browse-video-desc"]',
    fallback: 'span.video-meta-caption'
  },
  
  author: {
    username: 'a[data-e2e="browse-username"]',
    displayName: 'span[data-e2e="browse-username"]'
  }
};

/**
 * ============================================================================
 * INSTAGRAM (Phase 2)
 * ============================================================================
 */

export const INSTAGRAM_SELECTORS = {
  postContainer: {
    primary: 'article[role="presentation"]',
    fallback: 'article > div > div > div'
  },
  
  caption: {
    primary: 'article div > span:not([aria-label])',
    // Filter out UI text like "View all comments"
    exclude: ['View all comments', 'Add a comment', 'Like', 'Share']
  },
  
  author: {
    username: 'article header a[role="link"]'
  },
  
  media: {
    images: 'article img[src*="scontent"]',  // CDN URL pattern
    video: 'article video[src]'
  }
};

/**
 * ============================================================================
 * FACEBOOK (Phase 2)
 * ============================================================================
 */

export const FACEBOOK_SELECTORS = {
  postContainer: {
    primary: 'div[role="article"]',
    fallback: 'div[data-ad-preview="message"]'
  },
  
  textContent: {
    primary: 'div[data-ad-preview="message"]',
    fallback: 'span[dir="auto"]'
  },
  
  author: {
    username: 'a[role="link"]:first-child'
  }
};

/**
 * ============================================================================
 * UTILITY FUNCTIONS
 * ============================================================================
 */

/**
 * Clean text content from HTML element
 * @param {HTMLElement} element
 * @returns {string} Cleaned text
 */
function cleanTextContent(element) {
  if (!element) return '';
  
  // Get all text nodes
  let text = element.textContent || element.innerText || '';
  
  // Remove excessive whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

/**
 * Parse ISO 8601 duration to seconds
 * @param {string} duration - e.g., "PT3M45S" (3 minutes 45 seconds)
 * @returns {number} Duration in seconds
 */
function parseDuration(duration) {
  if (!duration) return null;
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Detect if element is currently visible in viewport
 * @param {HTMLElement} element
 * @returns {boolean}
 */
export function isElementVisible(element) {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Scroll element into view smoothly
 * @param {HTMLElement} element
 * @returns {Promise<void>}
 */
export function scrollIntoView(element) {
  return new Promise((resolve) => {
    if (!element) return resolve();
    
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Wait for scroll to complete
    setTimeout(resolve, 500);
  });
}

