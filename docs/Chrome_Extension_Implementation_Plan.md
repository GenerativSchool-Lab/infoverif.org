# InfoVerif Chrome MV3 — In-Context Analyzer & Dialog (Implementation Plan)

**Version**: 1.0  
**Date**: November 3, 2025  
**Target**: Alpha release (Twitter + YouTube) — Week 1 | Full platform support — Week 2  
**Architecture**: Chrome Manifest V3 Extension + Existing InfoVerif FastAPI Backend (M2.2)

---

## Table of Contents

1. [Architecture & Data Flow](#1-architecture--data-flow)
2. [Manifest V3 & Permissions](#2-manifest-v3--permissions-minimal)
3. [DOM Extraction Strategy](#3-dom-extraction-strategy-per-platform)
4. [Extension UI/UX](#4-extension-uiux-precise-spec-no-code)
5. [Backend Impact](#5-backend-impact-surgical-changes)
6. [File-by-File Plan](#6-file-by-file-plan)
7. [Message Contracts](#7-message-contracts-extension--backend)
8. [Privacy & Security](#8-privacy--security)
9. [Testing Plan](#9-testing-plan-manual--automated)
10. [Release & Ops](#10-release--ops)
11. [Risks & Mitigations](#11-risks--mitigations)
12. [Acceptance Criteria](#12-acceptance-criteria)

---

## 1) Architecture & Data Flow

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Social Media Page (Twitter, YouTube, etc.)   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Content Script (contentScript.js)                        │  │
│  │  • DOM monitoring & extraction                            │  │
│  │  • Post/video detection                                   │  │
│  │  • Selection UI overlay                                   │  │
│  │  • Screenshot coordination                                │  │
│  └────────────────┬──────────────────────────────────────────┘  │
└─────────────────────┼──────────────────────────────────────────┘
                      │
                      │ chrome.runtime.sendMessage()
                      ▼
         ┌────────────────────────────────┐
         │  Service Worker (background.js)│
         │  • Message routing             │
         │  • Screenshot orchestration    │
         │  • Backend API client          │
         │  • State management            │
         └───────────┬────────────────────┘
                     │
                     │ chrome.tabs.captureVisibleTab() 
                     │ or offscreen document
                     │
         ┌───────────▼────────────────────┐
         │  Offscreen Document (optional) │
         │  • DOM → Canvas → Blob         │
         │  • Specific element capture    │
         └───────────┬────────────────────┘
                     │
                     │ fetch() to backend
                     ▼
    ┌────────────────────────────────────────┐
    │   InfoVerif Backend (FastAPI)          │
    │   • /analyze (unified endpoint)        │
    │   • /chat (follow-ups)                 │
    │   • /transcript/preview (optional)     │
    │   • CORS: extension origin allowed     │
    └────────────────┬───────────────────────┘
                     │
                     │ 200 OK + JSON Report
                     ▼
         ┌────────────────────────────────┐
         │  Side Panel UI (panel.html)    │
         │  • Report rendering            │
         │  • Scores, techniques, claims  │
         │  • Chat thread                 │
         │  • Copy actions                │
         └────────────────────────────────┘
```

### Data Flow: Three Analysis Modes

#### Mode 1: Text Post (Twitter, Facebook, Instagram caption)

```
1. User clicks extension icon → content script highlights post containers
2. User clicks a highlighted post → overlay shows "Analyze this post"
3. User confirms → content script extracts:
   - Post text content (clean HTML → plain text)
   - Author metadata (username, display name)
   - Timestamp, permalink URL
   - Platform identifier
4. Content script → background: 
   {type: "ANALYZE_REQUEST", mode: "text", platform: "twitter", 
    text: "...", metadata: {...}}
5. Background → backend POST /analyze:
   {
     "input": {"type": "text", "text": "..."},
     "platform": "twitter",
     "options": {"lang": "fr", "deep": true, "return_transcript": false}
   }
6. Backend processes (M2.2 pipeline: FAISS → GPT-4 → DIMA codes)
7. Backend → background: 200 OK
   {
     "analysis_id": "uuid",
     "taxonomy_version": "DIMA-M2.2-130",
     "scores": {"propaganda": 85, "conspiracy": 90, ...},
     "techniques": [{"dima_code": "TE-58", ...}],
     "claims": [...],
     "summary": "...",
     "metadata": {"platform": "twitter", "analyzed_at": "..."}
   }
   Headers: x-model-card: "gpt-4o-mini", x-taxonomy-version: "DIMA-M2.2-130", 
            x-latency-ms: 3500
8. Background → panel: opens side panel, sends report
9. Panel renders: scores bars, technique chips with DIMA codes, claims, summary
10. Panel stores analysis_id in chrome.storage.session for chat context
```

#### Mode 2: Video Post (YouTube, TikTok)

```
1. User opens YouTube video page → content script detects video
2. User clicks extension → overlay highlights video player
3. User clicks "Analyze video" → content script extracts:
   - Video URL (canonical from DOM or meta tags)
   - Platform identifier (youtube, tiktok)
   - Video title, channel/author
4. Content script → background:
   {type: "ANALYZE_REQUEST", mode: "video", platform: "youtube", 
    url: "https://youtube.com/watch?v=...", metadata: {...}}
5. Background checks if preview available (optional):
   GET /transcript/preview?url=https://youtube.com/watch?v=...
   → {available: true, excerpt: "First 500 chars...", estimated_cost: 0.01}
6. Panel shows preview + "Confirm analysis (will transcribe ~3min video, $0.01)"
7. User confirms → background → backend POST /analyze:
   {
     "input": {"type": "video", "file_url": "https://youtube.com/watch?v=..."},
     "platform": "youtube",
     "options": {"lang": "fr", "deep": true, "return_transcript": true}
   }
8. Backend downloads video, extracts audio, calls Whisper, runs M2.2 analysis
9. Backend → background: 200 OK (same schema as Mode 1, + transcript_excerpt)
10. Panel renders report + expandable transcript section
11. Panel enables chat with transcript context
```

#### Mode 3: Screenshot (Instagram image post, Facebook mixed content)

```
1. User selects Instagram post (image + caption) → content script highlights
2. User clicks "Analyze as screenshot" → content script sends capture request
3. Background receives:
   {type: "ANALYZE_REQUEST", mode: "screenshot", platform: "instagram", 
    elementSelector: "article[role='presentation']", metadata: {...}}
4. Background orchestration:
   a) If element fully visible: chrome.tabs.captureVisibleTab() → crop to element
   b) If element partially visible or needs isolation:
      - Open offscreen document
      - Message offscreen: {type: "CAPTURE_ELEMENT", selector: "..."}
      - Offscreen: querySelector → html2canvas or native capture → Blob
      - Offscreen → background: {imageBlobId: "blob:..."}
5. Background → backend POST /analyze:
   - FormData multipart:
     input[type]: "image"
     input[image]: <Blob>
     platform: "instagram"
     options[lang]: "fr"
     options[deep]: true
6. Backend receives image, calls Vision API for OCR, runs M2.2 on extracted text
7. Backend → background: 200 OK (same schema, + ocr_confidence if relevant)
8. Panel renders report with note: "Analyzed from screenshot (OCR)"
9. Chat context uses extracted text
```

### Event Sequence Summary

| Step | Actor | Action | Output |
|------|-------|--------|--------|
| 1 | User | Opens page, clicks extension icon | Content script activates |
| 2 | Content Script | Detects posts, injects selection overlay | Highlighted elements |
| 3 | User | Clicks "Analyze" on a post | Selection event |
| 4 | Content Script | Extracts data (text/URL/element) | Structured payload |
| 5 | Content → Background | sendMessage(ANALYZE_REQUEST) | Message queued |
| 6 | Background | Routes to appropriate handler | Fetch preparation |
| 7 | Background | Optional: preview check | User confirmation UI |
| 8 | Background → Backend | POST /analyze with payload | HTTP request |
| 9 | Backend | M2.2 pipeline (FAISS+GPT-4) | JSON report |
| 10 | Backend → Background | 200 OK + report + headers | Response received |
| 11 | Background → Panel | Opens side panel, sends report | UI update |
| 12 | Panel | Renders scores, techniques, claims | User sees results |
| 13 | User (optional) | Asks follow-up in chat | Chat message |
| 14 | Panel → Background | sendMessage(CHAT_REQUEST) | Message queued |
| 15 | Background → Backend | POST /chat with analysis_id | HTTP request |
| 16 | Backend → Background | 200 OK + chat reply | Response received |
| 17 | Background → Panel | Appends chat message | Chat updated |

---

## 2) Manifest V3 & Permissions (Minimal)

### manifest.json Structure

```json
{
  "manifest_version": 3,
  "name": "InfoVerif — Analyse de Propagande & Désinformation",
  "version": "1.0.0",
  "description": "Analysez les posts, vidéos et contenus sur les réseaux sociaux avec la taxonomie DIMA (130 techniques).",
  
  "action": {
    "default_title": "Analyser avec InfoVerif",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  
  "side_panel": {
    "default_path": "ui/panel.html"
  },
  
  "permissions": [
    "activeTab",
    "scripting",
    "storage",
    "sidePanel",
    "contextMenus"
  ],
  
  "host_permissions": [
    "https://*.twitter.com/*",
    "https://*.x.com/*",
    "https://*.youtube.com/*",
    "https://*.tiktok.com/*",
    "https://*.instagram.com/*",
    "https://*.facebook.com/*",
    "https://infoveriforg-production.up.railway.app/*"
  ],
  
  "content_scripts": [
    {
      "matches": [
        "https://*.twitter.com/*",
        "https://*.x.com/*",
        "https://*.youtube.com/*",
        "https://*.tiktok.com/*",
        "https://*.instagram.com/*",
        "https://*.facebook.com/*"
      ],
      "js": ["contentScript.js"],
      "css": ["styles/content.css"],
      "run_at": "document_idle"
    }
  ],
  
  "web_accessible_resources": [
    {
      "resources": ["ui/panel.html", "styles/*.css", "icons/*.png"],
      "matches": ["<all_urls>"]
    }
  ],
  
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### Permissions Justification

| Permission | Purpose | Privacy Impact |
|------------|---------|----------------|
| **activeTab** | Access DOM of current tab only when user clicks extension icon. No background access. | ✅ Minimal: only after explicit user action |
| **scripting** | Inject content scripts dynamically if needed (e.g., generic pages not in manifest). | ✅ Minimal: only on user-activated tabs |
| **storage** | Store analysis_id for chat context, user preferences (language, theme). | ✅ Local only: no sync, no cloud |
| **sidePanel** | Open Chrome side panel for report UI (MV3 native). | ✅ No data access: UI only |
| **contextMenus** | Add "Analyze with InfoVerif" to right-click menu on selected text/images. | ✅ No data access: UI trigger |

### Host Permissions (Scoped)

| Host | Justification |
|------|---------------|
| `https://*.twitter.com/*`, `https://*.x.com/*` | DOM extraction for tweets, threads |
| `https://*.youtube.com/*` | Video URL extraction, metadata |
| `https://*.tiktok.com/*` | Video URL extraction, captions |
| `https://*.instagram.com/*` | Post text, image captions |
| `https://*.facebook.com/*` | Post text, mixed content |
| `https://infoveriforg-production.up.railway.app/*` | Backend API calls (analyze, chat, preview) |

**Note**: Backend origin will be the MV3 extension ID origin for CORS.

### Screenshot Strategy: Offscreen vs captureVisibleTab

| Scenario | Method | Reason |
|----------|--------|--------|
| **Full post visible in viewport** | `chrome.tabs.captureVisibleTab()` | Fast, native, no DOM access needed. Crop via Canvas in background. |
| **Post partially visible or needs scroll** | **Offscreen document** | Scroll element into view, capture isolated element, avoid capturing unrelated content. |
| **Complex DOM (iframes, lazy-loaded images)** | **Offscreen document** | Full DOM control, wait for images to load, use `html2canvas` or native capture. |
| **Privacy-sensitive: exclude ads/other users** | **Offscreen document** | Isolate only the target post container, exclude sidebars. |

**Implementation Choice**: 
- **Primary**: `chrome.tabs.captureVisibleTab()` + client-side crop (faster, simpler).
- **Fallback**: Offscreen document if user enables "High-precision screenshot" in settings, or if post is off-screen.

**Offscreen Document** (if needed):
- Path: `offscreen/capture.html` (minimal HTML + script)
- Loaded on-demand by background worker
- Receives message: `{type: "CAPTURE_ELEMENT", tabId, selector}`
- Returns: `{imageBlobUrl: "blob:...", width, height}`
- Background fetches Blob, sends to backend

---

## 3) DOM Extraction Strategy (Per Platform)

### General Heuristics

For each platform, define:
1. **Post container selector**: Robust CSS selector for the root element of a post.
2. **Text extraction**: Query text nodes, clean HTML entities, remove ads/UI chrome.
3. **Author metadata**: Username, display name, verified badge.
4. **Timestamp & permalink**: ISO timestamp, canonical URL.
5. **Media detection**: Images, videos (URL, thumbnail).
6. **Fallback logic**: If primary selector fails, try 2-3 alternatives, then ask user to select manually.

### Platform-Specific Selectors & Heuristics

#### Twitter / X

**Post Container**:
```
Primary: article[data-testid="tweet"]
Fallback: div[data-testid="cellInnerDiv"] article
Manual: User clicks post, script walks up DOM to find article parent
```

**Text Extraction**:
```
Selector: article[data-testid="tweet"] div[lang] span
Filter: Exclude retweet/reply metadata (data-testid="socialContext")
Clean: Remove @mentions highlighting, convert links to plain text
```

**Author**:
```
Username: a[role="link"][href*="/"]:first-of-type @href → extract /username
Display name: div[data-testid="User-Name"] > div > div > span
Verified: svg[data-testid="icon-verified"]
```

**Timestamp & Permalink**:
```
Timestamp: time element → datetime attribute
Permalink: a[href*="/status/"] → full URL
```

**Media**:
```
Images: div[data-testid="tweetPhoto"] img[src]
Video: div[data-testid="videoPlayer"] → extract poster or fetch meta
```

**Fallback Logic**:
1. If `article[data-testid="tweet"]` not found → try `div[class*="css-"][dir="auto"]` with role="article" parent
2. If still not found → highlight all `<article>` elements, ask user to click
3. If user-selected element has no text → walk children, extract all text nodes

#### YouTube

**Video Detection**:
```
Primary: ytd-watch-flexy, presence of #movie_player
URL: window.location.href or document.querySelector('link[rel="canonical"]').href
Title: h1.ytd-watch-metadata yt-formatted-string
Channel: ytd-channel-name a
```

**Video URL Extraction**:
```
Canonical: <link rel="canonical" href="https://www.youtube.com/watch?v=VIDEO_ID">
Fallback: window.location.href (may include timestamp, sanitize)
Short URLs: If /shorts/VIDEO_ID, convert to /watch?v=VIDEO_ID
```

**Metadata**:
```
Duration: meta[itemprop="duration"] content
Upload date: meta[itemprop="uploadDate"] content
Description: ytd-text-inline-expander #description-inner (first 500 chars for preview)
```

**Fallback**:
1. If canonical link missing → parse window.location.search for `v=` parameter
2. If video not loaded → wait for #movie_player to appear (MutationObserver, 5s timeout)
3. If still fails → show error: "Unable to detect video, please copy URL manually"

#### TikTok

**Video Container**:
```
Primary: div[data-e2e="browse-video"] or div.video-card-container
URL: Extract from window.location.pathname (/video/VIDEO_ID)
Caption: div[data-e2e="browse-video-desc"] or span.video-meta-caption
Author: a[data-e2e="browse-username"]
```

**Video URL**:
```
Canonical: <link rel="canonical"> or construct from video ID
API hint: tiktok.com/@username/video/VIDEO_ID
```

**Fallback**:
1. TikTok heavily uses JS rendering → wait for `div[data-e2e="browse-video"]` (MutationObserver)
2. If caption not found → extract from <title> tag (usually includes caption)
3. If video ID not extractable → fallback to screenshot mode (OCR caption)

#### Instagram

**Post Container**:
```
Primary: article[role="presentation"] (single post)
Feed: article > div > div > div (nested structure, find by aria-label)
Caption: article div > span (multiple levels, filter out UI text)
Author: article header a[role="link"]
```

**Text Extraction**:
```
Caption: article div > span:not([aria-label]) → aggregate text nodes
Filter: Remove "View all comments", "Add a comment", "Like", "Share" UI text
```

**Media**:
```
Images: article img[src*="scontent"] (CDN URL pattern)
Video: article video[src] or poster attribute
```

**Fallback**:
1. Instagram DOM is highly dynamic → use aria-label="Photo by..." to find container
2. If caption not found → fallback to screenshot (Vision will extract)
3. If logged-out wall blocks content → show error: "Please log in to Instagram first"

#### Facebook

**Post Container**:
```
Primary: div[role="article"] (feed post)
Nested: div[data-ad-preview="message"] parent
Text: div[data-ad-preview="message"] or div[dir="auto"] with long text
Author: a[role="link"]:first-child in header
```

**Text Extraction**:
```
Post text: div[data-ad-preview="message"] or span[dir="auto"]
Filter: Exclude "Translate", "See More", sponsored labels
```

**Fallback**:
1. Facebook structure varies by logged-in state → try role="article" first
2. If no text found → scan all <span> elements with dir="auto", filter by length > 50 chars
3. If fails → screenshot mode (most reliable for Facebook's complexity)

#### Generic Pages (News Sites, Blogs)

**Heuristics**:
```
Article text: 
  1. <article> tag with <p> children
  2. div[class*="article"], div[id*="content"]
  3. Readability algorithm: find largest text block, filter ads/nav
Title: <h1> or <meta property="og:title">
URL: window.location.href
```

**Fallback**:
1. Use simplified Readability.js-style extraction (walk DOM, find text density)
2. If no clear article → ask user to select text manually (selection API)
3. If user selects text → extract selected text + surrounding context (300 chars before/after)

### User Confirmation Flow

For all platforms:
1. Content script detects posts, adds subtle highlight (border or overlay)
2. User hovers → tooltip: "Click to analyze with InfoVerif"
3. User clicks → confirmation dialog overlays post:
   - "Analyze this post? (will send text to server)"
   - Preview: First 150 chars of extracted text or "Video: [title]"
   - Buttons: [Cancel] [Analyze]
4. If video → additional warning: "Transcription will cost ~$0.01, estimated 3min"
5. If screenshot → warning: "Will capture visible post as image (OCR on server)"

---

## 4) Extension UI/UX (Precise Spec, No Code)

### Choice: Chrome Side Panel (Preferred)

**Pros**:
- Native MV3 API (`chrome.sidePanel`)
- Persistent across tabs, less intrusive than floating panel
- User can resize, collapse, pin
- Matches Chrome's native UI patterns

**Cons**:
- Only available in Chrome 114+ (acceptable for target audience)
- Less flexible positioning than custom floating panel

**Fallback** (if side panel unsupported):
- In-page floating panel (`<div>` injected by content script)
- Position: fixed, top-right, z-index 999999
- Draggable, collapsible, minimize button

**Decision**: Use **Chrome Side Panel** as primary, detect support on install, show warning if unsupported browser.

### Panel Structure (panel.html)

```
┌─────────────────────────────────────────────────────────────┐
│  [InfoVerif Logo]  Analyse: twitter.com/user/status/123   │
│  [Close ×]  [Settings ⚙]  [Copy JSON 📋]                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Scores d'Influence                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Φ Indice global       █████████░░ 82                │   │
│  │ I_p Persuasion        ████████░░░ 75                │   │
│  │ N_s Conspirationnisme ██████████░ 90                │   │
│  │ F_f Fiabilité         ███████░░░░ 65                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🎯 Techniques Détectées (3)                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [TE-58] · Théorie du complot · Diversion            │   │
│  │ Similarité: 0.37 (embedding)  Sévérité: Élevée      │   │
│  │                                                      │   │
│  │ Evidence: "l'élite cache la vérité sur..."          │   │
│  │ Explication: Présente un récit conspirationniste... │   │
│  │ [Voir détails ▼]                                     │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ [TE-62] · Défiance institutionnelle · Diversion     │   │
│  │ [TE-14] · Appel à la peur · Persuasion émotionnelle │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📋 Affirmations Analysées (2)                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ❌ "Les médias mentent sur les vaccins"             │   │
│  │ Confiance: Non supportée                             │   │
│  │ Problèmes: [Généralisation] [Absence de sources]    │   │
│  │ [Voir raisonnement ▼]                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📝 Résumé                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Ce contenu présente plusieurs marqueurs de          │   │
│  │ manipulation: théories du complot, défiance         │   │
│  │ institutionnelle, et appel à la peur. L'absence     │   │
│  │ de sources vérifiables et la rhétorique émotionnelle│   │
│  │ visent à court-circuiter l'esprit critique.         │   │
│  │ [Copier le résumé 📋]                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💬 Questions & Contexte                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🤖 Posez une question sur cette analyse...          │   │
│  │ ┌─────────────────────────────────────────────────┐ │   │
│  │ │ Pourquoi TE-58 est détecté ici ?              │ │   │
│  │ └─────────────────────────────────────────────────┘ │   │
│  │ [Envoyer ↑]                                          │   │
│  │                                                      │   │
│  │ 💬 TE-58 (Théorie du complot) est détecté car le   │   │
│  │    texte évoque une "élite" cachant des "vérités"  │   │
│  │    — structure narrative classique conspirationniste│   │
│  │    avec acteurs secrets + information dissimulée.   │   │
│  │    Similarité sémantique: 0.35 (FAISS).             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🔒 Confidentialité: Aucun tracking · Analyse éphémère     │
│  📚 Taxonomie: DIMA M2.2 (130 techniques) · GPT-4o-mini    │
│  ⏱️ Analysé en 3.5s                                         │
└─────────────────────────────────────────────────────────────┘
```

### Panel Sections (Detailed)

#### 1. Header
- **Logo**: InfoVerif icon (16x16)
- **Title**: "Analyse: [domain]/[path-preview]" (truncate to 50 chars)
- **Buttons**: 
  - Close (×): Closes panel but keeps context in storage
  - Settings (⚙): Language (FR/EN), Theme (light/dark), Privacy options
  - Copy JSON (📋): Copies full JSON report to clipboard

#### 2. Scores Section
- **Visual**: Horizontal bars with gradient (red → yellow → green)
- **Values**: 
  - Φ (Phi): Overall risk (0-100)
  - I_p: Persuasion intensity (0-100)
  - N_s: Conspiracy narrative (0-100)
  - F_f: Factual reliability (0-100, inverted: lower = worse)
- **Tooltips**: Hover shows formula and components
- **Accessibility**: ARIA labels, color-blind friendly (patterns + colors)

#### 3. Techniques Section
- **List**: Expandable cards, collapsed by default
- **Each Technique Card**:
  - Header: `[TE-XX] · Technique Name · Family`
  - Badges: 
    - DIMA code (clickable → opens taxonomy documentation)
    - Family (color-coded: Diversion=purple, Persuasion=red, etc.)
    - Severity (Élevée/Moyenne/Faible) with icon
    - Embedding similarity score (if detected via FAISS)
  - Evidence: Quoted text from original content (max 200 chars)
  - Explanation: 2-3 sentences from GPT-4 (full text)
  - Expand button: Shows full evidence + academic citation (DIMA taxonomy link)
- **Interaction**: Click technique → highlights in chat, can ask "Why TE-58?"

#### 4. Claims Section
- **List**: Collapsed by default (expand button: "Voir 2 affirmations")
- **Each Claim Card**:
  - Icon: ✅ (supported), ❌ (unsupported), ⚠️ (misleading)
  - Claim text (quoted from content)
  - Confidence label: Supportée / Non supportée / Trompeuse
  - Issues: Chips for problems (Généralisation, Absence de sources, Hors contexte)
  - Reasoning: Expandable text (GPT-4 explanation)
- **Accessibility**: Screen reader announces confidence level

#### 5. Summary Section
- **Visual**: Card with slight background tint
- **Text**: 3-4 sentences, plain French
- **Actions**: 
  - Copy summary (📋): Clipboard copy
  - Share (optional, future): Generate public URL (backend creates shareable UUID)

#### 6. Chat Section
- **Input Field**: Text area, placeholder: "Posez une question sur cette analyse..."
- **Send Button**: Arrow (↑) or Enter key
- **Message Thread**:
  - User messages: Right-aligned, light background
  - Bot replies: Left-aligned, darker background, InfoVerif icon
  - Each message shows timestamp (relative: "Il y a 2 min")
- **Context Indicator**: Subtle badge: "Contexte: Post Twitter du 3 nov 2025"
- **Limitations**: 
  - Max 10 messages per analysis (prevent abuse)
  - Rate limit: 1 message per 5 seconds
  - If context lost (analysis_id expired) → show warning: "Contexte expiré, réanalysez le post"

#### 7. Footer (Privacy & Metadata)
- **Privacy Badge**: 🔒 "Aucun tracking · Analyse éphémère sur serveur"
- **Taxonomy Info**: 📚 "Taxonomie: DIMA M2.2 (130 techniques) · Modèle: GPT-4o-mini"
- **Latency**: ⏱️ "Analysé en 3.5s"
- **Version**: Tiny text: "Extension v1.0.0 · Backend 2025-11-03"

### Loading States

| State | Visual | Message |
|-------|--------|---------|
| **Initial Load** | Spinner | "Chargement du panneau..." |
| **Analyzing** | Progress bar (indeterminate) | "Analyse en cours... (extraction → FAISS → GPT-4)" |
| **Transcribing (video)** | Progress bar + time estimate | "Transcription audio avec Whisper... (~30s)" |
| **OCR (screenshot)** | Spinner | "Extraction de texte depuis l'image..." |
| **Chat Waiting** | Small spinner in chat input | "InfoVerif réfléchit..." |

### Error States

| Error Type | Visual | Message | Actions |
|------------|--------|---------|---------|
| **Network Error** | ⚠️ Red banner | "Impossible de contacter le serveur. Vérifiez votre connexion." | [Réessayer] |
| **Backend 429 (Rate Limit)** | ⚠️ Orange banner | "Trop de requêtes. Attendez 1 minute." | [OK] (auto-retry after 60s) |
| **Backend 5xx** | ⚠️ Red banner | "Erreur serveur. Réessayez dans quelques instants." | [Réessayer] [Signaler le bug] |
| **No Content Detected** | ℹ️ Blue banner | "Aucun contenu détectable. Sélectionnez manuellement du texte ou utilisez le mode capture." | [Sélection manuelle] |
| **Video Private/Blocked** | ⚠️ Orange banner | "Vidéo non accessible (privée ou restreinte géographiquement)." | [OK] |
| **CORS Blocked** | ⚠️ Red banner | "Extension non autorisée par le serveur. Contactez support@infoverif.org." | [OK] |
| **Invalid Analysis ID** | ℹ️ Blue banner | "Contexte de conversation expiré. Réanalysez le contenu pour continuer." | [Réanalyser] |

### Empty States

| Scenario | Visual | Message |
|----------|--------|---------|
| **No Analysis Yet** | Empty panel with illustration | "Cliquez sur un post pour commencer l'analyse." |
| **No Techniques Detected** | ✅ Green checkmark | "Aucune technique de manipulation détectée. Contenu semble neutre." |
| **No Claims Analyzed** | ℹ️ Info icon | "Pas d'affirmations factuelles à vérifier dans ce contenu." |

### Copy Actions

| Action | Scope | Format | Use Case |
|--------|-------|--------|----------|
| **Copy JSON** | Full report | JSON (formatted, 2-space indent) | Developers, researchers, archiving |
| **Copy Summary** | Summary text only | Plain text | Quick sharing, notes |
| **Copy Technique** | Single technique | Markdown (code, name, evidence) | Citing specific technique |
| **Copy Chat** | Full chat thread | Markdown (Q&A format) | Sharing conversation |

### Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| **Keyboard Navigation** | Tab order: Header buttons → Scores → Techniques (expandable) → Claims → Chat input → Send |
| **Focus Trap** | When panel open, focus stays within panel (Esc closes) |
| **Screen Reader** | ARIA labels on all interactive elements, live regions for dynamic content (chat, loading states) |
| **Color Contrast** | WCAG AA minimum (4.5:1 for text, 3:1 for UI components) |
| **Font Size** | Respects browser zoom (rem units), minimum 14px body text |
| **Animations** | Respect `prefers-reduced-motion` media query (disable slide-ins, use fade only) |

### Localization (Phase 1: FR only)

| UI Text | French | Notes |
|---------|--------|-------|
| Panel title | "Analyse" | Short, fits header |
| Scores section | "Scores d'Influence" | |
| Techniques section | "Techniques Détectées" | Show count: "(3)" |
| Claims section | "Affirmations Analysées" | Show count: "(2)" |
| Summary section | "Résumé" | |
| Chat placeholder | "Posez une question sur cette analyse..." | |
| Privacy badge | "Aucun tracking · Analyse éphémère" | |
| Loading | "Analyse en cours..." | |
| Error: Network | "Impossible de contacter le serveur" | |
| Empty state | "Cliquez sur un post pour commencer" | |

**Phase 2 (EN)**: Add `chrome.i18n` support, `_locales/en/messages.json`, `_locales/fr/messages.json`.

---

## 5) Backend Impact (Surgical Changes)

### CORS Configuration

**Challenge**: Chrome extensions have origin `chrome-extension://EXTENSION_ID`. Backend must allow this origin.

**Solution**:

1. **Compute Extension Origin**:
   - Extension ID is deterministic if using Chrome Web Store key (or set `key` in manifest.json for dev)
   - Format: `chrome-extension://abcdefghijklmnopqrstuvwxyz123456`
   - For development: use `chrome.runtime.id` in extension, log it, add to backend whitelist

2. **CORS Middleware Update** (`api/main.py` or `api/cors.py`):

```python
# Current CORS (example)
ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev
    "https://infoverif.org",  # Vercel prod
]

# ADD extension origin
EXTENSION_ORIGINS = [
    "chrome-extension://YOUR_EXTENSION_ID_HERE",  # Production extension
    "chrome-extension://*",  # Development (wildcard, only in DEV mode)
]

# Update FastAPI CORS
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS + EXTENSION_ORIGINS if DEV_MODE else ALLOWED_ORIGINS + EXTENSION_ORIGINS[:1],
    allow_credentials=False,  # Extensions don't send cookies
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-Extension-Version"],  # Custom header for extension version
    expose_headers=["X-Model-Card", "X-Taxonomy-Version", "X-Latency-Ms"],  # For UI display
)
```

**Acceptance Criteria**:
- Preflight OPTIONS requests return 200 with correct headers
- Extension can call `/analyze`, `/chat`, `/health` without CORS errors
- Other origins still blocked (security)

### Optional New Endpoints

#### 1. `/analyze` (Already Exists — No Changes Needed)

**Current Contract**: (See Section 7 for full details)

The existing `/analyze` endpoint already supports:
- Text mode (`input.type="text"`, `input.text`)
- Video mode (`input.type="video"`, `input.file_url`)
- Image mode (`input.type="image"`, multipart form upload)

**No changes needed** — Extension will use this endpoint as-is.

#### 2. `/chat` (New Endpoint)

**Purpose**: Follow-up questions referencing prior analysis context.

**Route**: `POST /api/extension/chat`

**Implementation**:
- New file: `api/routes/extension.py`
- Pydantic models: `api/models/extension.py`
- In-memory or Redis cache for analysis context (text + techniques)
- TTL: 1 hour per analysis_id
- Rate limit: 10 messages per analysis_id

**Request/Response**: See Section 7 for full contract

#### 3. `/transcript/preview` (Optional, New Endpoint)

**Purpose**: Show user a transcript excerpt before committing to full Whisper transcription.

**Route**: `GET /api/extension/transcript/preview?url=...&platform=...`

**Implementation**:
- Try to fetch YouTube auto-captions (fast, free)
- If unavailable, estimate Whisper cost based on video duration
- Return excerpt + cost estimate
- Rate limit: 10 req/min per IP

**Request/Response**: See Section 7 for full contract

### No OpenAI Keys in Extension

**Enforcement**:
1. All OpenAI calls stay in `api/deep.py`, `api/routes/extension.py`
2. Extension only sends HTTP requests to backend
3. Backend validates origin (CORS check)
4. Backend rate limits per extension origin + per IP

**Backend Environment Variables**:
```bash
OPENAI_API_KEY=sk-...           # Server-side only
EXTENSION_ORIGIN=chrome-extension://YOUR_ID  # Whitelist
EXTENSION_RATE_LIMIT=100        # Requests per minute
DEBUG_PRIVACY=false             # Content-free logs by default
```

### Logging: Content-Free by Default

**Privacy-First Logging**:
```python
# api/main.py

import logging
import os

# Default: content-free logs
DEBUG_PRIVACY = os.getenv("DEBUG_PRIVACY", "false").lower() == "true"

logger = logging.getLogger("infoverif")

@app.post("/analyze")
async def analyze(...):
    # Log metadata only
    logger.info(f"Extension request: platform={platform}, type={input_type}, origin={request.headers.get('Origin')}")
    
    # NEVER log raw content unless DEBUG_PRIVACY=true
    if DEBUG_PRIVACY:
        logger.debug(f"Content preview: {input_text[:100]}...")
    
    # Log aggregates only
    logger.info(f"Analysis complete: techniques={len(result['techniques'])}, latency={latency_ms}ms")
```

**Production Logs** (content-free):
```
2025-11-03 10:50:23 | INFO | Extension request: platform=twitter, type=text, origin=chrome-extension://abc123
2025-11-03 10:50:26 | INFO | Analysis complete: techniques=3, latency=3500ms
```

**Debug Logs** (opt-in, local dev only):
```
2025-11-03 10:50:23 | DEBUG | Content preview: Les médias traditionnels mentent, ils sont tous contrôlés...
```

### Response Headers to Surface in UI

```python
# api/main.py

@app.post("/analyze")
async def analyze(...):
    result = ...  # Existing logic
    
    return JSONResponse(
        content=result,
        headers={
            "X-Model-Card": "gpt-4o-mini",
            "X-Taxonomy-Version": "DIMA-M2.2-130",
            "X-Latency-Ms": str(latency_ms),
            "X-Backend-Version": "2025-11-03",  # Git commit or deploy date
        }
    )
```

---

## 6) File-by-File Plan

### Extension Package (new folder: `/extension`)

```
extension/
├── manifest.json                 # MV3 config
├── background.js                 # Service worker (message routing, API calls)
├── contentScript.js              # DOM extraction, selection UI
├── offscreen/                    # (Optional) For advanced screenshot
│   ├── capture.html
│   └── capture.js
├── ui/
│   ├── panel.html                # Side panel UI
│   ├── panel.js                  # Report rendering, chat logic
│   ├── panel.css                 # Styles (dark/light theme)
│   └── settings.html             # Settings page (optional)
├── styles/
│   └── content.css               # Styles for selection overlay
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── shared/
│   ├── messages.js               # Message contract types (content ↔ background)
│   └── constants.js              # API_URL, PLATFORMS, etc.
├── lib/
│   ├── selectors.js              # Platform-specific selectors
│   └── utils.js                  # DOM helpers, text cleanup
└── build/
    └── (generated by npm run build:ext)
```

#### File Acceptance Criteria

| File | Purpose | Acceptance Criteria |
|------|---------|---------------------|
| `manifest.json` | MV3 definition | Installs without errors, side panel opens on supported sites |
| `background.js` | Service worker, message routing, API client | Receives messages, calls backend, handles errors, opens panel |
| `contentScript.js` | DOM extraction, selection UI | Detects posts, extracts data, highlights elements, sends messages |
| `ui/panel.html` | Side panel structure | Renders all sections (scores, techniques, claims, chat) |
| `ui/panel.js` | Report rendering, chat logic | Displays report, handles chat, copy actions work |
| `ui/panel.css` | Styles | WCAG AA contrast, dark/light theme, responsive |
| `shared/messages.js` | Message contracts (JSDoc) | Documents all message types |
| `shared/constants.js` | Config constants | API_URL, platform IDs, selectors index |
| `lib/selectors.js` | Platform-specific selectors | Exports selector objects for each platform |
| `lib/utils.js` | DOM helpers | cleanText(), isValidURL(), waitForElement() |

### Backend Changes (minimal, surgical)

| File | Changes | Purpose | Acceptance Criteria |
|------|---------|---------|---------------------|
| `api/main.py` | Add extension origin to CORS | Allow extension requests | Extension can call /analyze without CORS errors |
| `api/routes/extension.py` (NEW) | /chat, /transcript/preview endpoints | Follow-up chat, cost preview | Chat works with analysis_id, preview returns excerpt |
| `api/models/extension.py` (NEW) | Pydantic models for extension | Type-safe requests/responses | Validates chat requests |
| `api/deep.py` | Call cache_analysis() after analyze | Enable chat context | Analysis cached for 1 hour |

---

## 7) Message Contracts (Extension ↔ Backend)

### Content Script → Background

#### ANALYZE_REQUEST (text mode)
```json
{
  "type": "ANALYZE_REQUEST",
  "mode": "text",
  "platform": "twitter",
  "text": "Les médias traditionnels mentent, ils sont tous contrôlés par l'élite...",
  "metadata": {
    "author": "username",
    "display_name": "User Name",
    "timestamp": "2025-11-03T10:50:00Z",
    "permalink": "https://twitter.com/username/status/123456789"
  }
}
```

#### ANALYZE_REQUEST (video mode)
```json
{
  "type": "ANALYZE_REQUEST",
  "mode": "video",
  "platform": "youtube",
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "metadata": {
    "title": "Video title",
    "channel": "Channel Name",
    "duration_seconds": 180
  }
}
```

#### ANALYZE_REQUEST (screenshot mode)
```json
{
  "type": "ANALYZE_REQUEST",
  "mode": "screenshot",
  "platform": "instagram",
  "imageBlobId": "blob:chrome-extension://abc123/uuid",
  "metadata": {
    "author": "instagram_user",
    "post_url": "https://instagram.com/p/POST_ID/"
  }
}
```

### Background → Backend

#### POST /analyze (text)
```json
{
  "input": {
    "type": "text",
    "text": "Les médias traditionnels mentent..."
  },
  "platform": "twitter",
  "options": {
    "lang": "fr",
    "deep": true,
    "return_transcript": false
  }
}
```

#### POST /analyze (video)
```json
{
  "input": {
    "type": "video",
    "file_url": "https://www.youtube.com/watch?v=VIDEO_ID"
  },
  "platform": "youtube",
  "options": {
    "lang": "fr",
    "deep": true,
    "return_transcript": true
  }
}
```

#### POST /analyze (screenshot, multipart)
```
FormData:
  input[type]: "image"
  input[image]: <Blob> (PNG/JPEG)
  platform: "instagram"
  options[lang]: "fr"
  options[deep]: "true"
  options[return_transcript]: "false"
```

### Backend → Background

#### 200 OK /analyze (Full Response)
```json
{
  "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
  "taxonomy_version": "DIMA-M2.2-130",
  "model_card": "gpt-4o-mini",
  "analyzed_at": "2025-11-03T10:50:23Z",
  "platform": "twitter",
  "scores": {
    "propaganda": 85,
    "conspiracy": 90,
    "misinfo": 65,
    "overall_risk": 82
  },
  "techniques": [
    {
      "dima_code": "TE-58",
      "dima_family": "Diversion",
      "name": "Théorie du complot",
      "evidence": "l'élite cache la vérité sur les vaccins",
      "severity": "high",
      "explanation": "Présente un récit conspirationniste avec acteurs secrets (élite) contrôlant institutions (médias) pour dissimuler informations.",
      "embedding_hint": {
        "similarity": 0.37,
        "rank": 1
      }
    }
  ],
  "claims": [
    {
      "claim": "Les médias mentent sur les vaccins",
      "confidence": "unsupported",
      "issues": ["Généralisation", "Absence de sources"],
      "reasoning": "Affirmation générale sans preuves..."
    }
  ],
  "summary": "Ce contenu présente plusieurs marqueurs de manipulation...",
  "transcript_excerpt": null,
  "metadata": {
    "latency_ms": 3500,
    "embedding_hints_count": 5,
    "ocr_confidence": null
  }
}

Response Headers:
X-Model-Card: gpt-4o-mini
X-Taxonomy-Version: DIMA-M2.2-130
X-Latency-Ms: 3500
X-Backend-Version: 2025-11-03
```

#### Error Responses
```json
// 400 Bad Request
{
  "error": "invalid_input",
  "message": "Le champ 'text' est requis pour le mode 'text'"
}

// 429 Too Many Requests
{
  "error": "rate_limit",
  "message": "Trop de requêtes. Attendez 60 secondes.",
  "retry_after_seconds": 60
}

// 500 Internal Server Error
{
  "error": "server_error",
  "message": "Une erreur est survenue lors de l'analyse. Réessayez.",
  "request_id": "uuid"
}
```

### Background → Panel

#### REPORT_READY
```json
{
  "type": "REPORT_READY",
  "report": { /* Full InfoVerif report from backend */ },
  "headers": {
    "modelCard": "gpt-4o-mini",
    "taxonomyVersion": "DIMA-M2.2-130",
    "latencyMs": "3500",
    "backendVersion": "2025-11-03"
  }
}
```

### Panel → Background (Chat)

#### CHAT_REQUEST
```json
{
  "type": "CHAT_REQUEST",
  "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_message": "Pourquoi TE-58 est détecté ici ?"
}
```

### Background → Backend (Chat)

#### POST /chat
```json
{
  "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_message": "Pourquoi TE-58 est détecté ici ?",
  "options": {
    "lang": "fr",
    "stream": false
  }
}
```

### Backend → Background (Chat Response)

#### 200 OK /chat
```json
{
  "reply": "TE-58 (Théorie du complot) est détecté car le texte évoque une 'élite' cachant des 'vérités' — structure narrative classique conspirationniste avec acteurs secrets + information dissimulée. Similarité sémantique: 0.35 (FAISS).",
  "citations": [
    {
      "technique": "TE-58",
      "evidence": "l'élite cache la vérité sur les vaccins"
    }
  ],
  "latency_ms": 1200
}

Response Headers:
X-Model-Card: gpt-4o-mini
X-Latency-Ms: 1200
```

#### 404 Not Found /chat
```json
{
  "error": "analysis_not_found",
  "message": "L'ID d'analyse est introuvable ou a expiré. Réanalysez le contenu."
}
```

---

## 8) Privacy & Security

### What is Stored (chrome.storage)

| Key | Scope | Data | Retention | Purpose |
|-----|-------|------|-----------|---------|
| `currentAnalysisId` | `storage.session` | UUID string | Session only | Chat context reference |
| `currentReport` | `storage.session` | JSON report | Session only | Copy actions, re-render |
| `userPreferences` | `storage.local` | `{lang: "fr", theme: "dark"}` | Persistent | UI settings |
| `recentAnalyses` | `storage.local` | `[{id, platform, timestamp}]` (max 10) | Persistent | History (optional, disabled by default) |

**Privacy Guarantees**:
- ✅ **No raw content stored**: Only analysis_id and metadata
- ✅ **Session-scoped context**: analysis_id cleared on browser close
- ✅ **No cross-site correlation**: No tracking across tabs/domains
- ✅ **No sync**: `storage.local` only, no cloud sync
- ✅ **Opt-in history**: Disabled by default, user must enable in settings

### What is NOT Stored

| Data Type | Why Not |
|-----------|---------|
| Raw post text | Privacy: sent to backend, not cached locally |
| Video URLs | Privacy: sent once, not retained |
| Screenshots | Privacy: uploaded as Blob, not saved |
| User tokens/cookies | Security: no auth needed, no cross-site access |
| Analysis results (long-term) | Privacy: user must explicitly export JSON |

### No Persistent Content

**Enforcement**:
1. After analysis, content is sent to backend (ephemeral processing)
2. Backend deletes uploaded files after analysis (tmp cleanup)
3. Extension does not cache original text/images (only analysis_id)
4. Chat context expires after 1 hour (server-side)

### Rate Limiting (Server-Side)

**Purpose**: Prevent abuse from compromised extensions or mass scraping

**Implementation** (FastAPI middleware):
```python
from fastapi import Request, HTTPException
from collections import defaultdict
import time

# In-memory rate limiter (use Redis in production)
rate_limits = defaultdict(list)
MAX_REQUESTS_PER_MINUTE = 100  # Per origin

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    origin = request.headers.get("Origin")
    
    if origin and "chrome-extension://" in origin:
        now = time.time()
        # Clean old requests (> 1 min)
        rate_limits[origin] = [t for t in rate_limits[origin] if now - t < 60]
        
        if len(rate_limits[origin]) >= MAX_REQUESTS_PER_MINUTE:
            raise HTTPException(429, "Rate limit exceeded")
        
        rate_limits[origin].append(now)
    
    response = await call_next(request)
    return response
```

**Rate Limits**:
- `/analyze`: 100 requests/min per extension origin
- `/chat`: 10 messages per analysis_id
- `/transcript/preview`: 10 requests/min per IP

### UX Copy for Privacy Warnings

| Scenario | Warning Message |
|----------|----------------|
| **Video transcription** | "⚠️ Transcription will process audio on server (Whisper API). Estimated cost: $0.01, duration: ~3min. Content is deleted after analysis." |
| **Screenshot upload** | "⚠️ Screenshot will be uploaded for OCR (Vision API). Image is processed on server and deleted immediately after analysis." |
| **Text analysis** | "ℹ️ Text will be sent to InfoVerif server for analysis. No content is stored permanently." |

**Privacy Badge** (always visible in panel footer):
```
🔒 Confidentialité: Aucun tracking · Analyse éphémère · Données supprimées après traitement
```

---

## 9) Testing Plan (Manual + Automated)

### Manual Test Matrix

#### Platform Coverage

| Platform | Test URL | Content Type | Expected Result |
|----------|----------|--------------|-----------------|
| **Twitter/X** | `twitter.com/user/status/123` | Text tweet | Extract text, author, timestamp |
| **Twitter/X** | `twitter.com/user/status/456` | Thread (multi-tweet) | Extract full thread text |
| **YouTube** | `youtube.com/watch?v=VIDEO_ID` | Standard video | Extract URL, title, channel |
| **YouTube** | `youtube.com/shorts/SHORT_ID` | Short video | Convert to watch URL |
| **TikTok** | `tiktok.com/@user/video/ID` | Video + caption | Extract URL, caption |
| **Instagram** | `instagram.com/p/POST_ID/` | Image + caption | Extract caption (or screenshot) |
| **Facebook** | `facebook.com/user/posts/ID` | Text post | Extract text (or screenshot) |
| **Generic** | News article URL | Article text | Readability extraction |

#### Content Type Test Cases

| Test Case | Input | Expected Behavior |
|-----------|-------|-------------------|
| **Simple text** | Short tweet (< 280 chars) | Extract text, analyze, show techniques |
| **Long text** | Thread (> 1000 chars) | Extract full text, handle truncation |
| **Video (captions available)** | YouTube with auto-captions | Use free captions, no Whisper cost |
| **Video (no captions)** | YouTube without captions | Show cost preview, ask confirmation |
| **Screenshot (clear text)** | Instagram post screenshot | OCR extracts text, analyze |
| **Screenshot (poor quality)** | Blurry image | OCR confidence low, show warning |
| **Mixed content** | Facebook post (text + image) | Extract text + optional screenshot |

#### Edge Cases

| Edge Case | Scenario | Expected Behavior |
|-----------|----------|-------------------|
| **Private video** | YouTube private/age-gated | Show error: "Vidéo non accessible" |
| **Lazy-loaded DOM** | TikTok infinite scroll | Wait for element (MutationObserver, 5s timeout) |
| **Login wall** | Instagram logged-out | Show error: "Connectez-vous d'abord" |
| **CORS failure** | Backend unreachable | Show network error, retry button |
| **Backend 429** | Too many requests | Show rate limit warning, auto-retry after 60s |
| **Backend 5xx** | Server error | Show error, offer "Report bug" button |
| **Empty content** | Post with only emojis | Show warning: "Pas de texte détectable" |
| **Very long post** | 10,000+ char article | Truncate to 8000 chars for analysis |
| **Invalid URL** | Malformed video URL | Show error: "URL invalide" |

### Automated Testing (Future)

#### Unit Tests (Extension)

```javascript
// tests/unit/selectors.test.js
describe('Twitter Selectors', () => {
  test('extractTwitterData returns correct structure', () => {
    const mockArticle = createMockTweetDOM();
    const result = extractTwitterData(mockArticle);
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('metadata.author');
  });
});

// tests/unit/utils.test.js
describe('cleanText', () => {
  test('removes HTML tags', () => {
    expect(cleanText('<p>Hello</p>')).toBe('Hello');
  });
  
  test('normalizes whitespace', () => {
    expect(cleanText('Hello  \n  World')).toBe('Hello World');
  });
});
```

#### Integration Tests (Backend)

```python
# tests/test_extension_api.py
def test_analyze_text_endpoint(client):
    response = client.post("/analyze", json={
        "input": {"type": "text", "text": "Test content"},
        "platform": "twitter",
        "options": {"lang": "fr", "deep": True}
    })
    assert response.status_code == 200
    data = response.json()
    assert "analysis_id" in data
    assert "techniques" in data

def test_chat_endpoint(client):
    # First, create an analysis
    analyze_response = client.post("/analyze", json={...})
    analysis_id = analyze_response.json()["analysis_id"]
    
    # Then, send chat message
    chat_response = client.post("/chat", json={
        "analysis_id": analysis_id,
        "user_message": "Pourquoi TE-58?"
    })
    assert chat_response.status_code == 200
    assert "reply" in chat_response.json()
```

#### E2E Tests (Playwright or Selenium)

```javascript
// tests/e2e/twitter-analysis.spec.js
test('analyze Twitter post end-to-end', async ({ page, context }) => {
  // Install extension
  const extensionId = await installExtension(context);
  
  // Navigate to Twitter
  await page.goto('https://twitter.com/user/status/123');
  
  // Wait for content script to load
  await page.waitForSelector('.infoverif-highlight');
  
  // Click on a post
  await page.click('article[data-testid="tweet"]:first-of-type');
  
  // Confirm analysis
  await page.click('.infoverif-analyze-button');
  
  // Wait for side panel to open
  await page.waitForSelector('#panel-container');
  
  // Verify report rendered
  expect(await page.locator('#scores-section').isVisible()).toBe(true);
  expect(await page.locator('#techniques-section').isVisible()).toBe(true);
});
```

### Performance Budget

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Panel open time** | < 150ms | Time from user click to panel visible |
| **Analyze request overhead** | < 50ms | Extension processing before backend call (not counting server compute) |
| **DOM extraction** | < 100ms | Time to extract text/URL from page |
| **Screenshot capture** | < 500ms | Time to capture and crop screenshot |
| **Memory footprint** | < 50MB | Extension background + panel |
| **CPU usage** | < 5% idle | When panel open but not analyzing |

### Accessibility Checklist

| Test | Tool | Pass Criteria |
|------|------|---------------|
| **Keyboard navigation** | Manual | All interactive elements reachable via Tab |
| **Focus indicators** | Manual | Visible focus ring on all focusable elements |
| **Screen reader** | NVDA / VoiceOver | All content announced, ARIA labels correct |
| **Color contrast** | Chrome DevTools | WCAG AA (4.5:1 text, 3:1 UI) |
| **Zoom** | Browser zoom to 200% | No content overflow, all readable |
| **Reduced motion** | `prefers-reduced-motion` | No jarring animations |

### Localization Test Cases (Phase 2)

| Language | Test | Expected |
|----------|------|----------|
| **French (FR)** | Open panel | All text in French |
| **English (EN)** | Switch language in settings | All text updates to English |
| **Date formats** | Show analysis timestamp | Respects locale (FR: "3 nov 2025", EN: "Nov 3, 2025") |

---

## 10) Release & Ops

### Packaging for Chrome Web Store

#### Build Process

```bash
# In extension/ directory
npm run build:ext

# Generates:
# - Minified JS (background.js, contentScript.js, panel.js)
# - CSS (panel.css, content.css)
# - Icons (16, 32, 48, 128)
# - manifest.json (with version from package.json)

# Create ZIP for Chrome Web Store
cd build/
zip -r infoverif-extension-v1.0.0.zip *
```

#### Chrome Web Store Listing

**Title**: InfoVerif — Analyse de Propagande & Désinformation

**Short Description** (132 chars max):
```
Analysez les posts, vidéos et contenus sur les réseaux sociaux avec la taxonomie DIMA (130 techniques de manipulation).
```

**Detailed Description**:
```markdown
InfoVerif détecte les techniques de manipulation médiatique, propagande et désinformation directement dans votre navigateur.

🎯 FONCTIONNALITÉS

• Analyse contextuelle sur Twitter/X, YouTube, TikTok, Instagram, Facebook
• 130 techniques DIMA (M82 Project) : taxonomie académique de référence
• Scores d'influence quantifiés (persuasion, conspirationnisme, fiabilité)
• Explications détaillées en français avec preuves extraites du contenu
• Chat intelligent pour poser des questions sur l'analyse
• Interface native Chrome (panneau latéral)

🔒 CONFIDENTIALITÉ

• Aucun tracking, aucune collecte de données personnelles
• Analyse éphémère sur serveur sécurisé
• Contenu supprimé immédiatement après traitement
• Code open source : https://github.com/GenerativSchool-Lab/infoverif.org

🧠 TECHNOLOGIE

• Architecture hybride : Recherche vectorielle FAISS + GPT-4o-mini
• Embeddings multilingues pour détection sémantique
• Taxonomie DIMA complète (6 familles, 130 techniques)

📚 À PROPOS

InfoVerif est un projet open source du Civic Tech AI Lab — GenerativSchool.
Notre mission : démocratiser l'accès aux outils d'analyse de contenu médiatique.

🌐 Plus d'infos : https://infoverif.org
```

**Screenshots** (1280x800 or 640x400):
1. Panel with report (scores + techniques visible)
2. Twitter post highlighted with "Analyze" button
3. YouTube video analysis with transcript excerpt
4. Chat conversation example
5. DIMA technique card with code badges

**Promotional Images**:
- Small tile: 440x280
- Marquee: 1400x560
- Feature graphic: 1280x800 (optional)

**Category**: Productivity

**Language**: French (primary), English (future)

**Permissions Justification** (for review):
```
activeTab: Access current tab content only when user clicks extension icon
scripting: Inject content scripts to detect and extract social media posts
storage: Save user preferences (language, theme) and analysis context
sidePanel: Display analysis results in Chrome's native side panel
contextMenus: Add "Analyze with InfoVerif" to right-click menu
host_permissions (social media sites): Extract text, video URLs, metadata
host_permissions (infoverif backend): Send content for analysis
```

**Privacy Policy URL**: https://infoverif.org/privacy (must create)

**Support URL**: https://infoverif.org/support or GitHub Issues

### Versioning Strategy

**Format**: Semantic Versioning (MAJOR.MINOR.PATCH)

| Version | Scope | Example |
|---------|-------|---------|
| **1.0.0** | Alpha release (Twitter + YouTube) | Initial Chrome Web Store release |
| **1.1.0** | Add TikTok, Instagram, Facebook support | Phase 1 complete |
| **1.2.0** | Add chat follow-ups, screenshot mode | Phase 2 features |
| **1.3.0** | Add transcript preview, cost estimates | Polish features |
| **2.0.0** | Breaking: New backend API, English localization | Major update |

**Version Alignment**:
- Extension version in `manifest.json` and `package.json` (sync)
- Surface backend taxonomy version in panel footer (e.g., "DIMA M2.2-130")
- Backend version header (`X-Backend-Version`) for compatibility checks

### Rollback Plan

**Feature Flags** (served from backend):
```json
GET /api/extension/config
{
  "features": {
    "screenshot_mode": true,
    "chat_enabled": true,
    "transcript_preview": true,
    "platforms": {
      "twitter": true,
      "youtube": true,
      "tiktok": true,
      "instagram": true,
      "facebook": true
    }
  },
  "version_compatibility": {
    "min_extension_version": "1.0.0",
    "max_extension_version": "2.0.0"
  }
}
```

**Rollback Steps**:
1. Disable problematic feature via backend config (instant)
2. Push extension hotfix to Chrome Web Store (12-24h review)
3. Force update via Chrome Web Store (gradual rollout)

**Kill Switch**:
- Backend endpoint: `POST /api/extension/disable` (admin only)
- Sets all features to `false` in config
- Extension checks config on every analysis request
- Shows maintenance message: "Service temporairement indisponible"

### Analytics (Privacy-Preserving)

**Metrics to Track** (aggregated, no user identification):
```python
# Backend logs (no content, no user IDs)
{
  "event": "extension_analysis",
  "platform": "twitter",
  "mode": "text",
  "techniques_detected": 3,
  "latency_ms": 3500,
  "success": true,
  "date": "2025-11-03"
}

# Aggregated daily:
{
  "date": "2025-11-03",
  "total_analyses": 1523,
  "by_platform": {"twitter": 842, "youtube": 453, "tiktok": 228},
  "by_mode": {"text": 1245, "video": 231, "screenshot": 47},
  "avg_latency_ms": 3200,
  "top_techniques": [
    {"code": "TE-58", "count": 234},
    {"code": "TE-62", "count": 198}
  ]
}
```

**No PII**: No user IDs, no IP addresses (beyond rate limiting), no content samples.

---

## 11) Risks & Mitigations

### Risk Matrix

| Risk | Severity | Probability | Mitigation |
|------|----------|-------------|------------|
| **DOM volatility (social platforms change structure)** | High | High | Keep selectors isolated per-site, use heuristics + fallbacks, user confirmation step |
| **Video transcript cost (mass Whisper calls)** | Medium | Medium | Preview step with cost estimate, explicit user confirm, rate limiting (10 videos/hour) |
| **Permission bloat (users fear privacy invasion)** | High | Low | Minimal permissions, justify each in Web Store listing, privacy badge in UI |
| **Abuse (mass scraping via extension)** | Medium | Medium | Server rate limits per extension origin (100 req/min) + per IP, backend logging |
| **CORS conflicts (other origins blocked)** | Low | Low | Whitelist only extension origin, test thoroughly |
| **Backend downtime (Railway outage)** | Medium | Low | Show clear error message, retry button, status page link |
| **Extension review rejection** | High | Low | Document privacy measures, justify permissions, provide demo video |
| **YouTube bot detection (blocks video access)** | Medium | Medium | User uploads video file instead, or provides URL + manual transcript |
| **Incorrect DIMA code detection** | Medium | High | Calibrate with production data, allow user feedback ("Report incorrect detection") |
| **Chat context expiry (analysis_id lost)** | Low | Medium | Clear warning in UI, auto-refresh button to re-analyze |

### Technical Debt to Address

| Debt | Impact | Plan |
|------|--------|------|
| **Selector brittleness** | High | Phase 2: Use ML-based element detection (not CSS selectors) |
| **No offline support** | Low | Not critical (requires backend), document limitation |
| **No batch analysis** | Medium | Phase 3: Allow selecting multiple posts, queue analysis |
| **Limited error recovery** | Medium | Add auto-retry logic, better error messages |
| **No internationalization (i18n)** | Medium | Phase 2: Add chrome.i18n, _locales/ for EN support |

---

## 12) Acceptance Criteria

**Must Pass** (before Chrome Web Store submission):

### Functional Requirements

- [ ] **Twitter analysis**: Highlight post, click Analyze → panel opens with report (scores + at least 1 DIMA technique)
- [ ] **YouTube analysis**: Detect video URL, send to backend → panel shows report + transcript excerpt (if available)
- [ ] **Screenshot mode**: Capture Instagram post container → send to backend → panel shows OCR-analyzed report
- [ ] **Chat follow-ups**: Ask "Pourquoi TE-58?" → receive answer referencing technique from report
- [ ] **Copy actions**: Copy JSON, Copy summary → clipboard contains correct data

### Security & Privacy

- [ ] **No OpenAI keys in extension**: All API calls to backend only, no keys in extension code
- [ ] **Backend CORS**: Extension origin whitelisted, other origins blocked
- [ ] **Content-free logs**: Backend logs show metadata only (platform, type, latency), no raw text (unless DEBUG_PRIVACY=true)
- [ ] **No persistent storage**: Only analysis_id in session storage, cleared on browser close

### Performance

- [ ] **Panel open time**: < 150ms from user click to panel visible
- [ ] **Analyze overhead**: < 50ms extension processing (not counting backend latency)
- [ ] **Memory footprint**: < 50MB (background + panel)

### Accessibility

- [ ] **Keyboard navigation**: All elements reachable via Tab, Esc closes panel
- [ ] **Screen reader**: NVDA/VoiceOver announces all content, ARIA labels correct
- [ ] **Color contrast**: WCAG AA minimum (4.5:1 text, 3:1 UI)

### Compatibility

- [ ] **Chrome 114+**: Extension installs and works on Chrome 114, 115, 116+
- [ ] **macOS, Windows, Linux**: Tested on all three platforms
- [ ] **Twitter, YouTube**: Core platforms work reliably

**Nice to Have** (Phase 2):

- [ ] TikTok, Instagram, Facebook analysis
- [ ] Transcript preview with cost estimate
- [ ] English localization (chrome.i18n)
- [ ] Generic page analysis (news articles)
- [ ] Context menu "Analyze with InfoVerif" on selected text

---

## Implementation Checklist (Week 1 — Alpha)

### Day 1-2: Extension Scaffolding
- [ ] Create `/extension` folder structure
- [ ] Write `manifest.json` (MV3, permissions, content scripts)
- [ ] Setup build process (`npm run build:ext`)
- [ ] Create icons (16, 32, 48, 128)
- [ ] Test: Extension installs without errors

### Day 3-4: Content Script + Background
- [ ] Implement `contentScript.js` (Twitter + YouTube selectors)
- [ ] Implement `background.js` (message routing, API client)
- [ ] Implement `lib/selectors.js` (platform-specific)
- [ ] Implement `lib/utils.js` (cleanText, waitForElement)
- [ ] Test: DOM extraction works on Twitter + YouTube

### Day 5-6: Panel UI
- [ ] Create `ui/panel.html` structure
- [ ] Implement `ui/panel.js` (render report, chat)
- [ ] Implement `ui/panel.css` (dark theme, responsive)
- [ ] Test: Panel renders report correctly

### Day 7: Backend Integration + Testing
- [ ] Update `api/main.py` (CORS for extension origin)
- [ ] Create `api/routes/extension.py` (/chat endpoint)
- [ ] Create `api/models/extension.py` (Pydantic models)
- [ ] Test: Full flow (Twitter post → analyze → panel → chat)
- [ ] Deploy to Chrome Web Store (unlisted for testing)

---

## Next Steps (Post-Review)

1. **Review this plan** with team (1 hour)
2. **Create GitHub Issues** for each file/component (30 min)
3. **Setup project board** (Kanban: To Do, In Progress, Review, Done)
4. **Start Week 1 implementation** (Twitter + YouTube only)
5. **Daily standups** to track progress
6. **End of Week 1**: Alpha demo + feedback session
7. **Week 2**: Add TikTok/Instagram/Facebook support
8. **Week 3**: Polish, testing, Chrome Web Store submission

---

**Document Status**: ✅ READY FOR REVIEW  
**Last Updated**: November 3, 2025  
**Version**: 1.0  
**Authors**: AI Architecture Team — InfoVerif.org

---

**Questions or Clarifications?**  
Create a GitHub Issue with label `chrome-extension` or contact: support@infoverif.org

