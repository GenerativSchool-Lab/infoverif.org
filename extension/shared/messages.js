/**
 * InfoVerif Extension - Message Contracts
 * 
 * JSDoc type definitions for all messages exchanged between:
 * - Content Script ↔ Background Worker
 * - Background Worker ↔ Panel
 * - Background Worker ↔ Backend API
 */

/**
 * ============================================================================
 * CONTENT SCRIPT → BACKGROUND WORKER
 * ============================================================================
 */

/**
 * Request to analyze content (text, video, or screenshot)
 * @typedef {Object} AnalyzeRequest
 * @property {"ANALYZE_REQUEST"} type - Message type
 * @property {"text"|"video"|"screenshot"} mode - Analysis mode
 * @property {"twitter"|"youtube"|"tiktok"|"instagram"|"facebook"|"generic"} platform - Platform ID
 * @property {string} [text] - For text mode: extracted post text
 * @property {string} [url] - For video mode: video URL (YouTube, TikTok)
 * @property {string} [imageBlobId] - For screenshot mode: blob URL of captured image
 * @property {PostMetadata} metadata - Post/video metadata
 */

/**
 * Post/Video Metadata
 * @typedef {Object} PostMetadata
 * @property {string} [author] - Username or channel name
 * @property {string} [displayName] - Display name
 * @property {string} [timestamp] - ISO 8601 timestamp
 * @property {string} [permalink] - Canonical URL to post/video
 * @property {string} [title] - Video title (for video mode)
 * @property {number} [durationSeconds] - Video duration (for video mode)
 */

/**
 * ============================================================================
 * BACKGROUND WORKER → CONTENT SCRIPT
 * ============================================================================
 */

/**
 * Request to capture screenshot of specific element
 * @typedef {Object} CaptureScreenshotRequest
 * @property {"CAPTURE_SCREENSHOT"} type
 * @property {string} elementSelector - CSS selector of element to capture
 * @property {number} tabId - Tab ID where element is located
 */

/**
 * Response to analyze request (success or error)
 * @typedef {Object} AnalyzeResponse
 * @property {boolean} success - Whether analysis succeeded
 * @property {string} [analysisId] - UUID if success
 * @property {string} [error] - Error type if failure ("network"|"rate_limit"|"server_error"|"no_content")
 * @property {string} [message] - Human-readable error message (French)
 */

/**
 * ============================================================================
 * BACKGROUND WORKER → PANEL
 * ============================================================================
 */

/**
 * Report is ready to display
 * @typedef {Object} ReportReady
 * @property {"REPORT_READY"} type
 * @property {InfoVerifReport} report - Full analysis report from backend
 * @property {ResponseHeaders} headers - Backend response headers
 */

/**
 * InfoVerif Analysis Report (from backend /analyze)
 * @typedef {Object} InfoVerifReport
 * @property {string} analysis_id - UUID for this analysis
 * @property {string} taxonomy_version - "DIMA-M2.2-130"
 * @property {string} model_card - "gpt-4o-mini"
 * @property {string} analyzed_at - ISO 8601 timestamp
 * @property {string} platform - Platform where content was found
 * @property {Scores} scores - Risk scores (0-100)
 * @property {Technique[]} techniques - Detected DIMA techniques
 * @property {Claim[]} claims - Analyzed claims
 * @property {string} summary - Summary in French (3-4 sentences)
 * @property {string} [transcript_excerpt] - First 500 chars of transcript (video mode)
 * @property {AnalysisMetadata} metadata - Analysis metadata
 */

/**
 * Risk Scores
 * @typedef {Object} Scores
 * @property {number} propaganda - Propaganda score (0-100)
 * @property {number} conspiracy - Conspiracy score (0-100)
 * @property {number} misinfo - Misinformation score (0-100)
 * @property {number} overall_risk - Overall risk score (0-100)
 */

/**
 * Detected DIMA Technique
 * @typedef {Object} Technique
 * @property {string} dima_code - DIMA code (e.g., "TE-58")
 * @property {string} dima_family - DIMA family (e.g., "Diversion")
 * @property {string} name - Technique name in French
 * @property {string} evidence - Quoted text from content
 * @property {"high"|"medium"|"low"} severity - Severity level
 * @property {string} explanation - Explanation in French (2-3 sentences)
 * @property {EmbeddingHint} [embedding_hint] - Semantic similarity data (M2.2)
 */

/**
 * Embedding Similarity Hint (M2.2)
 * @typedef {Object} EmbeddingHint
 * @property {number} similarity - Cosine similarity (0-1)
 * @property {number} rank - Rank in Top-K (1-5)
 */

/**
 * Analyzed Claim
 * @typedef {Object} Claim
 * @property {string} claim - Claim text extracted from content
 * @property {"supported"|"unsupported"|"misleading"} confidence - Confidence level
 * @property {string[]} issues - List of issues (e.g., "Généralisation", "Absence de sources")
 * @property {string} reasoning - Reasoning for judgment (French)
 */

/**
 * Analysis Metadata
 * @typedef {Object} AnalysisMetadata
 * @property {number} latency_ms - Backend processing time (ms)
 * @property {number} embedding_hints_count - Number of embedding hints returned
 * @property {number} [ocr_confidence] - OCR confidence (0-1) if screenshot mode
 */

/**
 * Backend Response Headers
 * @typedef {Object} ResponseHeaders
 * @property {string} modelCard - "gpt-4o-mini"
 * @property {string} taxonomyVersion - "DIMA-M2.2-130"
 * @property {string} latencyMs - "3500"
 * @property {string} backendVersion - "2025-11-03" (deploy date)
 */

/**
 * Report error
 * @typedef {Object} ReportError
 * @property {"REPORT_ERROR"} type
 * @property {string} error - Error type
 * @property {string} message - Human-readable error message (French)
 * @property {number} [retryAfterSeconds] - For rate limit errors
 */

/**
 * ============================================================================
 * PANEL → BACKGROUND WORKER
 * ============================================================================
 */

/**
 * Chat follow-up question
 * @typedef {Object} ChatRequest
 * @property {"CHAT_REQUEST"} type
 * @property {string} analysis_id - UUID from prior analysis
 * @property {string} user_message - User's question in French
 */

/**
 * Request to open side panel
 * @typedef {Object} OpenPanelRequest
 * @property {"OPEN_PANEL"} type
 * @property {number} [tabId] - Tab ID to open panel for (optional)
 */

/**
 * ============================================================================
 * BACKGROUND WORKER ↔ BACKEND API
 * ============================================================================
 */

/**
 * Backend /analyze request body (text mode)
 * @typedef {Object} AnalyzeTextBody
 * @property {Object} input
 * @property {"text"} input.type
 * @property {string} input.text - Text content to analyze
 * @property {string} platform - "twitter"|"youtube"|"tiktok"|"instagram"|"facebook"|"generic"
 * @property {Object} options
 * @property {"fr"|"en"} options.lang
 * @property {boolean} options.deep
 * @property {boolean} options.return_transcript
 */

/**
 * Backend /analyze request body (video mode)
 * @typedef {Object} AnalyzeVideoBody
 * @property {Object} input
 * @property {"video"} input.type
 * @property {string} input.file_url - Video URL
 * @property {string} platform
 * @property {Object} options
 * @property {"fr"|"en"} options.lang
 * @property {boolean} options.deep
 * @property {boolean} options.return_transcript
 */

/**
 * Backend /chat request body
 * @typedef {Object} ChatRequestBody
 * @property {string} analysis_id - UUID from prior /analyze
 * @property {string} user_message - User's question
 * @property {Object} options
 * @property {"fr"|"en"} options.lang
 * @property {boolean} options.stream - False for now
 */

/**
 * Backend /chat response
 * @typedef {Object} ChatResponse
 * @property {string} reply - Bot's answer in French
 * @property {Citation[]} citations - Technique citations in reply
 * @property {number} latency_ms - Backend processing time
 */

/**
 * Citation in chat reply
 * @typedef {Object} Citation
 * @property {string} technique - DIMA code (e.g., "TE-58")
 * @property {string} evidence - Quoted text from analysis
 */

/**
 * Backend error response
 * @typedef {Object} BackendError
 * @property {string} error - Error type
 * @property {string} message - Human-readable error message
 * @property {string} [request_id] - For debugging
 * @property {number} [retry_after_seconds] - For 429 errors
 */

/**
 * ============================================================================
 * GENERIC MESSAGES
 * ============================================================================
 */

/**
 * Ping message (health check)
 * @typedef {Object} PingMessage
 * @property {"PING"} type
 */

/**
 * Pong response (health check)
 * @typedef {Object} PongMessage
 * @property {"PONG"} type
 * @property {number} timestamp - Unix timestamp (ms)
 */

/**
 * ============================================================================
 * HELPER FUNCTIONS (for type checking in development)
 * ============================================================================
 */

/**
 * Create ANALYZE_REQUEST message
 * @param {"text"|"video"|"screenshot"} mode
 * @param {string} platform
 * @param {Object} data - {text, url, imageBlobId}
 * @param {PostMetadata} metadata
 * @returns {AnalyzeRequest}
 */
export function createAnalyzeRequest(mode, platform, data, metadata) {
  return {
    type: 'ANALYZE_REQUEST',
    mode,
    platform,
    text: data.text,
    url: data.url,
    imageBlobId: data.imageBlobId,
    metadata
  };
}

/**
 * Create CHAT_REQUEST message
 * @param {string} analysisId
 * @param {string} userMessage
 * @returns {ChatRequest}
 */
export function createChatRequest(analysisId, userMessage) {
  return {
    type: 'CHAT_REQUEST',
    analysis_id: analysisId,
    user_message: userMessage
  };
}

/**
 * Create REPORT_READY message
 * @param {InfoVerifReport} report
 * @param {ResponseHeaders} headers
 * @returns {ReportReady}
 */
export function createReportReady(report, headers) {
  return {
    type: 'REPORT_READY',
    report,
    headers
  };
}

/**
 * Create REPORT_ERROR message
 * @param {string} error
 * @param {string} message
 * @param {number} [retryAfterSeconds]
 * @returns {ReportError}
 */
export function createReportError(error, message, retryAfterSeconds) {
  return {
    type: 'REPORT_ERROR',
    error,
    message,
    retry_after_seconds: retryAfterSeconds
  };
}

/**
 * Validate message type
 * @param {any} message
 * @param {string} expectedType
 * @returns {boolean}
 */
export function isMessageType(message, expectedType) {
  return message && typeof message === 'object' && message.type === expectedType;
}

