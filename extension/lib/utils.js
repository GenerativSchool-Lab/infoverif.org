/**
 * InfoVerif Extension - Utility Functions
 * 
 * DOM helpers, text cleanup, validation, and async utilities.
 */

/**
 * ============================================================================
 * TEXT PROCESSING
 * ============================================================================
 */

/**
 * Clean text content: remove HTML tags, entities, normalize whitespace
 * @param {string} text - Raw text or HTML
 * @returns {string} Cleaned plain text
 */
export function cleanText(text) {
  if (!text || typeof text !== 'string') return '';
  
  // Create temporary div to strip HTML
  const temp = document.createElement('div');
  temp.innerHTML = text;
  let cleaned = temp.textContent || temp.innerText || '';
  
  // Decode HTML entities
  const textarea = document.createElement('textarea');
  textarea.innerHTML = cleaned;
  cleaned = textarea.value;
  
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Remove zero-width characters
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');
  
  return cleaned;
}

/**
 * Truncate text to max length with ellipsis
 * @param {string} text
 * @param {number} maxLength
 * @param {string} [ellipsis='...']
 * @returns {string}
 */
export function truncate(text, maxLength, ellipsis = '...') {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Extract domain from URL
 * @param {string} url
 * @returns {string} Domain name (e.g., "twitter.com")
 */
export function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return '';
  }
}

/**
 * ============================================================================
 * VALIDATION
 * ============================================================================
 */

/**
 * Validate if string is valid URL
 * @param {string} str
 * @returns {boolean}
 */
export function isValidURL(str) {
  if (!str || typeof str !== 'string') return false;
  
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate if string is valid YouTube URL
 * @param {string} url
 * @returns {boolean}
 */
export function isYouTubeURL(url) {
  if (!isValidURL(url)) return false;
  const domain = extractDomain(url);
  return domain === 'youtube.com' || domain === 'youtu.be';
}

/**
 * Validate if string is valid TikTok URL
 * @param {string} url
 * @returns {boolean}
 */
export function isTikTokURL(url) {
  if (!isValidURL(url)) return false;
  const domain = extractDomain(url);
  return domain === 'tiktok.com';
}

/**
 * ============================================================================
 * DOM HELPERS
 * ============================================================================
 */

/**
 * Wait for element to appear in DOM (with timeout)
 * @param {string} selector - CSS selector
 * @param {number} [timeout=5000] - Timeout in milliseconds
 * @param {Element} [root=document.body] - Root element to observe
 * @returns {Promise<Element>} Resolves with element or rejects on timeout
 */
export function waitForElement(selector, timeout = 5000, root = document.body) {
  return new Promise((resolve, reject) => {
    // Check if element already exists
    const element = root.querySelector(selector);
    if (element) return resolve(element);
    
    // Setup MutationObserver
    const observer = new MutationObserver(() => {
      const el = root.querySelector(selector);
      if (el) {
        observer.disconnect();
        clearTimeout(timeoutId);
        resolve(el);
      }
    });
    
    observer.observe(root, {
      childList: true,
      subtree: true
    });
    
    // Setup timeout
    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found after ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Wait for multiple elements to appear
 * @param {string[]} selectors - Array of CSS selectors
 * @param {number} [timeout=5000]
 * @returns {Promise<Element[]>}
 */
export function waitForElements(selectors, timeout = 5000) {
  return Promise.all(
    selectors.map(selector => waitForElement(selector, timeout))
  );
}

/**
 * Check if element is currently visible in viewport
 * @param {Element} element
 * @param {number} [threshold=0] - Percentage of element that must be visible (0-1)
 * @returns {boolean}
 */
export function isElementInViewport(element, threshold = 0) {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  const vertInView = (rect.top <= windowHeight) && ((rect.top + rect.height) >= 0);
  const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) >= 0);
  
  if (threshold === 0) {
    return vertInView && horInView;
  }
  
  // Calculate percentage of element in viewport
  const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
  const visibleWidth = Math.min(rect.right, windowWidth) - Math.max(rect.left, 0);
  const visibleArea = visibleHeight * visibleWidth;
  const totalArea = rect.height * rect.width;
  
  return (visibleArea / totalArea) >= threshold;
}

/**
 * Scroll element into view smoothly
 * @param {Element} element
 * @param {Object} [options={ behavior: 'smooth', block: 'center' }]
 * @returns {Promise<void>} Resolves when scroll completes
 */
export function scrollIntoView(element, options = { behavior: 'smooth', block: 'center' }) {
  return new Promise((resolve) => {
    if (!element) return resolve();
    
    element.scrollIntoView(options);
    
    // Wait for scroll animation to complete
    const duration = options.behavior === 'smooth' ? 500 : 0;
    setTimeout(resolve, duration);
  });
}

/**
 * Get element's absolute position on page
 * @param {Element} element
 * @returns {{top: number, left: number, width: number, height: number}}
 */
export function getElementPosition(element) {
  if (!element) return { top: 0, left: 0, width: 0, height: 0 };
  
  const rect = element.getBoundingClientRect();
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  
  return {
    top: rect.top + scrollTop,
    left: rect.left + scrollLeft,
    width: rect.width,
    height: rect.height
  };
}

/**
 * ============================================================================
 * ASYNC UTILITIES
 * ============================================================================
 */

/**
 * Sleep/delay for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
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

/**
 * Throttle function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between calls in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Retry async function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} [maxAttempts=3] - Maximum retry attempts
 * @param {number} [baseDelay=1000] - Base delay in milliseconds
 * @returns {Promise<any>}
 */
export async function retryWithBackoff(fn, maxAttempts = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      
      const delay = baseDelay * Math.pow(2, attempt - 1);  // Exponential backoff
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
      await sleep(delay);
    }
  }
}

/**
 * ============================================================================
 * STORAGE HELPERS
 * ============================================================================
 */

/**
 * Get value from chrome.storage (async/await wrapper)
 * @param {string|string[]|Object} keys - Storage keys to retrieve
 * @param {'local'|'session'} [area='session'] - Storage area
 * @returns {Promise<Object>} Storage values
 */
export async function storageGet(keys, area = 'session') {
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

/**
 * Set value in chrome.storage (async/await wrapper)
 * @param {Object} items - Key-value pairs to store
 * @param {'local'|'session'} [area='session'] - Storage area
 * @returns {Promise<void>}
 */
export async function storageSet(items, area = 'session') {
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

/**
 * Remove keys from chrome.storage (async/await wrapper)
 * @param {string|string[]} keys - Storage keys to remove
 * @param {'local'|'session'} [area='session'] - Storage area
 * @returns {Promise<void>}
 */
export async function storageRemove(keys, area = 'session') {
  return new Promise((resolve, reject) => {
    chrome.storage[area].remove(keys, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

/**
 * ============================================================================
 * CLIPBOARD HELPERS
 * ============================================================================
 */

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    // Fallback for older browsers
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

/**
 * ============================================================================
 * ERROR HANDLING
 * ============================================================================
 */

/**
 * Safe JSON parse with fallback
 * @param {string} json - JSON string to parse
 * @param {any} [fallback=null] - Fallback value if parse fails
 * @returns {any} Parsed JSON or fallback
 */
export function safeJSONParse(json, fallback = null) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Format error message for user display
 * @param {Error|string} error
 * @returns {string} Human-readable error message
 */
export function formatErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && error.message) return error.message;
  return 'Une erreur est survenue';
}

/**
 * ============================================================================
 * LOGGING (respects DEBUG flag)
 * ============================================================================
 */

/**
 * Debug log (only if DEBUG enabled in constants.js)
 * @param {string} category - Log category
 * @param  {...any} args - Arguments to log
 */
export function debugLog(category, ...args) {
  // Import DEBUG from constants dynamically to avoid circular dependency
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get('debugEnabled', (result) => {
      if (result.debugEnabled) {
        console.log(`[InfoVerif:${category}]`, ...args);
      }
    });
  }
}

/**
 * Error log (always logged)
 * @param {string} category - Error category
 * @param  {...any} args - Arguments to log
 */
export function errorLog(category, ...args) {
  console.error(`[InfoVerif:${category}]`, ...args);
}

