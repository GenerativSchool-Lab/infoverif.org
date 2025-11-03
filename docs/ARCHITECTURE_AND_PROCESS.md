# InfoVerif.org — Architecture, Implementation Process & Lessons Learned

**Version**: 2.0  
**Date**: January 2026  
**Authors**: Civic Tech AI Lab — GenerativSchool  
**Status**: Production System Documentation  
**Audience**: PhD-level academic & engineering documentation

---

## Executive Summary

InfoVerif.org is a production-grade misinformation detection system combining **multimodal AI analysis** (GPT-4o-mini, Whisper, Vision API) with **academic taxonomy** (130 DIMA techniques, M82 Project) delivered through **dual interfaces**: a React web application and a Chrome Manifest V3 extension.

This document describes the **architectural decisions**, **implementation processes**, and **critical lessons learned** during the system's development from initial MVP to production deployment (November 2025 - January 2026).

**Key Metrics**:
- **Backend**: FastAPI (Python 3.11), Railway Pro (8GB RAM, 8 vCPU)
- **Frontend**: React 18 + Vite, Vercel hosting
- **Extension**: Chrome MV3, ~810 lines (TikTok + Twitter only)
- **Analysis**: Hybrid FAISS embeddings (470MB model) + GPT-4o-mini
- **Detection**: 130 DIMA techniques, 6 families, multimodal fusion
- **Performance**: <2s latency (text), <15s (video), +50% accuracy vs baseline

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Implementation Timeline](#2-implementation-timeline)
3. [DIMA Integration Process](#3-dima-integration-process)
4. [Chrome Extension Development](#4-chrome-extension-development)
5. [Lessons Learned](#5-lessons-learned)
6. [Technical Debt & Future Work](#6-technical-debt--future-work)
7. [References & Bibliography](#7-references--bibliography)

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                                                                   │
│  ┌──────────────────────┐         ┌──────────────────────────┐  │
│  │  Web Application    │         │  Chrome Extension       │  │
│  │  (React + Vite)     │         │  (Manifest V3)          │  │
│  │  • Text input       │         │  • In-context overlay   │  │
│  │  • Video upload     │         │  • Floating panel       │  │
│  │  • Image upload     │         │  • DOM extraction       │  │
│  │  • Report display   │         │  • Multimodal fusion    │  │
│  └──────────┬───────────┘         └───────────┬────────────┘  │
│             │                                 │                │
│             │ HTTPS                            │ HTTPS          │
│             │                                  │                │
└─────────────┼──────────────────────────────────┼────────────────┘
              │                                  │
              └──────────────┬───────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      API LAYER (FastAPI)                        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Endpoints:                                             │   │
│  │  • POST /analyze-text     (text input)                  │   │
│  │  • POST /analyze-video    (file upload)                 │   │
│  │  • POST /analyze-image    (file upload)                 │   │
│  │  • POST /analyze-video-url (Twitter/YouTube/TikTok)     │   │
│  │  • GET  /dima-taxonomy    (debug endpoint)              │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       │                                          │
│  ┌────────────────────▼────────────────────────────────────┐   │
│  │  Analysis Pipeline (deep.py)                             │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  Step 1: Multimodal Input Processing            │   │   │
│  │  │  • Text: Direct pass-through                    │   │   │
│  │  │  • Video: FFmpeg → Whisper API (transcription)  │   │   │
│  │  │  • Image: Vision API (OCR extraction)           │   │   │
│  │  │  • URL: yt-dlp → audio → Whisper               │   │   │
│  │  └──────────────────────┬──────────────────────────┘   │   │
│  │                         │                               │   │
│  │  ┌──────────────────────▼──────────────────────────┐   │   │
│  │  │  Step 2: Semantic Embedding Search (FAISS)      │   │   │
│  │  │  • Model: paraphrase-multilingual-MiniLM-L12   │   │   │
│  │  │  • Index: 130 DIMA technique embeddings        │   │   │
│  │  │  • Query: First 2000 chars of content          │   │   │
│  │  │  • Output: Top-5 similar techniques (cosine)    │   │   │
│  │  │  • Latency: <100ms                              │   │   │
│  │  └──────────────────────┬──────────────────────────┘   │   │
│  │                         │                               │   │
│  │  ┌──────────────────────▼──────────────────────────┐   │   │
│  │  │  Step 3: GPT-4o-mini Hybrid Analysis            │   │   │
│  │  │  • Prompt: Enhanced with DIMA taxonomy (130)    │   │   │
│  │  │  • Hints: Top-5 embeddings injected            │   │   │
│  │  │  • Schema: Strict JSON (techniques, claims)     │   │   │
│  │  │  • Output: DIMA codes (TE-XX), evidence, scores │   │   │
│  │  │  • Latency: ~1.5s                               │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  DIMA Detector (dima_detector.py)                        │   │
│  │  • Embedding model loader (sentence-transformers)        │   │
│  │  • FAISS index builder (130 techniques)                 │   │
│  │  • Similarity search (Top-5)                            │   │
│  │  • Memory: ~1.2GB (model + embeddings + index)          │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Breakdown

#### Backend (`/api`)

**Core Modules**:
- `main.py`: FastAPI app, routes, CORS, startup events
- `deep.py`: Analysis pipeline, multimodal fusion, GPT-4 integration
- `dima_detector.py`: Embedding model loader, FAISS index, similarity search
- `dima_prompts.py`: DIMA-aware prompt engineering, taxonomy injection
- `routes/extension.py`: Extension-specific endpoints (CORS, chat)

**Dependencies**:
- `fastapi`: Web framework
- `openai`: GPT-4o-mini, Whisper, Vision API
- `sentence-transformers`: Multilingual embeddings (470MB model)
- `faiss-cpu`: Vector similarity search
- `ffmpeg-python`: Video/audio processing
- `yt-dlp`: Video URL download (Twitter, YouTube, TikTok)
- `pydantic`: Request/response validation

**Deployment**:
- **Platform**: Railway Pro Plan
- **Runtime**: Custom Dockerfile (python:3.11-slim)
- **Resources**: 8GB RAM, 8 vCPU, 100GB storage
- **Build**: Docker build with C++ runtime (libstdc++, libgomp)

#### Web Application (`/web`)

**Tech Stack**:
- React 18 + Vite
- React Router (client-side navigation)
- Axios (HTTP client)
- Tailwind CSS (styling)
- KaTeX (LaTeX rendering for formulas)

**Key Pages**:
- `Home.jsx`: Multi-format input (text/video/image tabs)
- `ReportDeep.jsx`: Analysis results display (scores, techniques, claims)
- `MethodCard.jsx`: Methodology documentation (academic formulas)

**Deployment**:
- **Platform**: Vercel
- **Build**: `npm run build` → static files
- **Routing**: React Router (SPA)

#### Chrome Extension (`/extension`)

**Architecture**: Manifest V3 (service worker)

**Components**:
- `manifest.json`: MV3 config, permissions, content scripts
- `background-bundle.js`: Service worker, API communication
- `contentScript-bundle.js`: DOM extraction, platform detection (Twitter, TikTok)
- `ui/floating-panel.*`: Floating analysis panel (HTML/CSS/JS)

**Platforms Supported**:
- ✅ Twitter/X (hover detection, text + video)
- ✅ TikTok (universal detection, all page types)

**Removed** (sunset strategy):
- ❌ YouTube (visibility issues)
- ❌ Instagram/Facebook/LinkedIn (web app alternative)

---

## 2. Implementation Timeline

### Phase 1: MVP Foundation (Pre-November 2025)

**Objective**: Minimal viable product with heuristic scoring

**Deliverables**:
- FastAPI backend with `/analyze-text` endpoint
- React frontend with text input
- Basic scoring (propaganda, conspiracy, misinformation)
- OpenAI GPT-4 integration
- Railway + Vercel deployment

**Duration**: ~2 weeks

**Lessons**:
- Heuristic scoring insufficient for academic rigor
- Need structured taxonomy (DIMA) for explainability

---

### Phase 2: DIMA Integration (November 2025)

#### Milestone 2.1: Enhanced Prompts (Nov 3, 2025 AM)

**Objective**: Inject full DIMA taxonomy into GPT-4 prompts without ML dependencies

**Implementation**:
```python
# api/dima_detector.py
- load_dima_taxonomy(): Load 130 techniques from CSV
- get_few_shot_examples(): Priority techniques with examples

# api/dima_prompts.py
- build_dima_aware_prompt(): Inject full taxonomy (~2250 tokens)
- Include: 6 families, 130 codes, few-shot examples

# api/deep.py
- analyze_with_gpt4(): Use DIMA prompts, backward compatible
```

**Deliverables**:
- ✅ DIMA taxonomy loader (130 techniques)
- ✅ Enhanced prompts with full taxonomy
- ✅ JSON schema with DIMA codes (`TE-XX`)
- ✅ Frontend DIMA code badges

**Duration**: 1 day (rapid iteration)

---

#### Milestone 2.2: Semantic Embeddings (Nov 3, 2025 PM)

**Objective**: Add vector similarity search for technique prioritization

**Implementation**:
```python
# api/dima_detector.py
- _load_embeddings(): Load or generate 130 technique embeddings
- _generate_embeddings(): sentence-transformers (paraphrase-multilingual-MiniLM-L12-v2)
- find_similar_techniques(): FAISS cosine similarity (Top-5)

# api/deep.py
- analyze_with_gpt4(use_embeddings=True):
  Step 1: Semantic search (first 2000 chars)
  Step 2: Enhanced prompt with Top-5 hints
  Step 3: GPT-4 analysis with prioritization
```

**Deployment Journey** (15 attempts documented):

1. **Attempts 1-5**: Nixpacks + apt/Nix → Runtime lib isolation failures
2. **Attempts 6-8**: LD_LIBRARY_PATH → Overrides ignored by Railway
3. **Attempts 9-13**: railway.toml/json conflicts
4. **Attempt 14**: .dockerignore excluded DIMA CSV (build failure)
5. **✅ Attempt 15**: Custom Dockerfile → SUCCESS!

**Critical Fix**:
```dockerfile
FROM python:3.11-slim
RUN apt-get update && apt-get install -y \
    gcc g++ \
    libstdc++6 \
    libgomp1 \
    ffmpeg
# Bypassed Railway/Nixpacks isolation entirely
# Standard Docker = Guaranteed C++ runtime
```

**Deliverables**:
- ✅ 470MB embedding model loaded in production
- ✅ FAISS index: 130 embeddings × 384 dimensions
- ✅ Hybrid analysis pipeline (FAISS → GPT-4)
- ✅ Production validated: +50% detection improvement
- ✅ Latency: +50-100ms (acceptable tradeoff)

**Duration**: 1 day (same day as M2.1!)

**Lessons Learned**:
- **Railway Nixpacks isolation**: Cannot override C++ runtime libraries
- **Custom Dockerfile required**: For ML dependencies (sentence-transformers, FAISS)
- **One-time model load**: ~15s at startup (acceptable)
- **Memory planning**: 1.2GB for model + embeddings + index

---

### Phase 3: Chrome Extension (November-December 2025)

**Objective**: In-context analysis on social media platforms

**Implementation Plan**: See `docs/Chrome_Extension_Implementation_Plan.md` (1767 lines)

**Development Timeline**:
- **Week 1**: Twitter + YouTube (MVP)
- **Week 2**: TikTok, Instagram, Facebook, LinkedIn
- **Week 3**: Polish, testing, SPA navigation fixes

**Actual Timeline**:
- **Nov 3-10**: Twitter perfect (hover detection, multimodal fusion)
- **Nov 10-15**: YouTube (button visibility issues)
- **Nov 15-20**: TikTok (universal detection)
- **Dec 1-5**: Sunset strategy (focus Twitter + TikTok only)

**Key Features Implemented**:
- ✅ Hover detection (Twitter posts)
- ✅ Fixed button (TikTok, universal)
- ✅ Floating panel (drag, resize, close)
- ✅ Multimodal fusion (text + video)
- ✅ Loading state persistence
- ✅ SPA navigation handling (TikTok feed)
- ✅ Cache system (5-minute TTL)

**Platform Decisions**:
- **Twitter**: Hover overlay (best UX for timeline)
- **TikTok**: Fixed button (consistent across all page types)
- **Removed**: YouTube (visibility/clickability issues)
- **Removed**: Instagram/Facebook/LinkedIn (web app alternative)

**Code Reduction**:
- Before: ~1370 lines (6 platforms)
- After: ~810 lines (2 platforms)
- **-41% code size**, simpler maintenance

---

## 3. DIMA Integration Process

### 3.1 Taxonomy Selection

**Source**: DIMA Framework (M82 Project)  
**Reference**: `docs/DIMA_Full_Mapping.csv` (130 techniques)

**Selection Criteria**:
1. **Academic rigor**: Peer-reviewed taxonomy
2. **Completeness**: Covers all manipulation families
3. **Code system**: Structured IDs (`TE-XX`) for tracking
4. **Multilingual**: French + English support

**Taxonomy Structure**:
```
6 Families:
  1. Persuasion émotionnelle (26 techniques)
  2. Diversion (22 techniques)
  3. Conspiration (18 techniques)
  4. Polarisation (28 techniques)
  5. Autorité (16 techniques)
  6. Fausse information (20 techniques)

Total: 130 techniques
```

---

### 3.2 Implementation Strategy

#### Phase 1: Prompt Engineering (M2.1)

**Approach**: Non-invasive, no ML dependencies

**Process**:
1. Load DIMA CSV at startup
2. Inject full taxonomy into GPT-4 prompts (~2250 tokens)
3. Include few-shot examples for priority techniques
4. Request DIMA codes in JSON schema

**Result**: Immediate taxonomy integration, backward compatible

---

#### Phase 2: Semantic Embeddings (M2.2)

**Approach**: Hybrid system (FAISS + GPT-4)

**Process**:
1. **Embedding Generation**:
   - Model: `paraphrase-multilingual-MiniLM-L12-v2` (470MB)
   - 384-dimensional vectors
   - Generate embeddings for all 130 technique descriptions
   - One-time operation (~30s at startup)

2. **FAISS Index**:
   - Build cosine similarity index
   - Store in memory (~10MB)
   - Query latency: <100ms

3. **Hybrid Pipeline**:
   - Query: First 2000 chars of analyzed content
   - Search: Top-5 similar techniques
   - Inject: Hints into GPT-4 prompt
   - Analyze: GPT-4 with technique prioritization

**Result**: +50% detection improvement, +50-100ms latency (acceptable)

---

### 3.3 Prompt Engineering Details

**Template Structure**:
```
1. Context: Mission of InfoVerif
2. Taxonomy: Full DIMA taxonomy (130 techniques, 6 families)
3. Hints: Top-5 embeddings (if available)
4. Examples: Few-shot examples for priority techniques
5. Schema: Strict JSON with DIMA codes
6. Language: French output
```

**Token Count**: ~2250 tokens (prompt) + ~500-2000 tokens (content)

**Example Enhanced Prompt** (excerpt):
```python
"""
Tu es InfoVerif, un système d'analyse de propagande et désinformation.

TAXONOMIE DIMA (130 techniques):

FAMILLE: Persuasion émotionnelle (26 techniques)
- TE-01: Choc émotionnel
- TE-14: Appel à la peur
...

[TECHNIQUES SÉMANTIQUEMENT PROCHES] (de la recherche vectorielle):
1. TE-62: Défiance institutionnelle (similarité: 0.377)
...

Analyse le contenu suivant et réponds en JSON avec codes DIMA exacts.
"""
```

---

## 4. Chrome Extension Development

### 4.1 Architecture Decision: Manifest V3

**Rationale**:
- Chrome MV3 is future-proof (MV2 deprecated 2023)
- Service worker model (event-driven, no persistent background)
- Better privacy (minimal permissions)
- Required for Chrome Web Store

**Challenges**:
- No ES6 modules in service workers (required bundling)
- No persistent state (required chrome.storage.session)
- Message passing complexity (content ↔ background ↔ API)

**Solution**:
- Bundled JS files (`background-bundle.js`, `contentScript-bundle.js`)
- Session storage for cache (5-minute TTL)
- Event-driven message passing

---

### 4.2 Platform Detection Strategy

**Twitter**: Hover-based overlay
- **Rationale**: Timeline UX, posts scroll quickly
- **Implementation**: `mouseenter` → overlay, `mouseleave` → remove
- **Extraction**: DOM selectors (`article[data-testid="tweet"]`)

**TikTok**: Fixed button (universal)
- **Rationale**: Multiple page types (video, feed, search, profile)
- **Implementation**: Detect `<video>` element → show button
- **Extraction**: URL-based (current page = current video)

**Key Insight**: **Platform-specific UX** > Universal approach

---

### 4.3 Multimodal Fusion

**Problem**: Video posts often have accompanying text (tweets with video, TikTok captions)

**Solution**: Multimodal fusion in backend
```python
# api/main.py
@app.post("/analyze-video-url")
async def analyze_video_url_endpoint(
    url: str = Form(...),
    text: Optional[str] = Form(None)  # Post text
):
    # Combines: video transcription + post text
    transcript = f"""TEXTE DU POST:
{post_text}

TRANSCRIPTION AUDIO:
{audio_transcript}"""
```

**Result**: More accurate analysis (text + audio context)

---

### 4.4 State Management Challenges

**Problem**: Loading state lost on hover out/re-hover

**Solution**: Persistent loading state tracking
```javascript
let analyzingPosts = new Map(); // permalink → 'loading' | 'success' | 'error'

// On hover: Check if loading
if (analyzingPosts.get(permalink) === 'loading') {
  showLoadingSpinner(); // Not button
}
```

**Result**: Better UX (no confusion about analysis status)

---

## 5. Lessons Learned

### 5.1 Infrastructure & Deployment

#### Lesson 1: Railway Nixpacks Limitations

**Issue**: Cannot override C++ runtime libraries (libstdc++, libgomp)  
**Root Cause**: Nixpacks isolates system libraries  
**Solution**: Custom Dockerfile bypasses Nixpacks entirely  
**Impact**: 14 failed deployment attempts before success

**Takeaway**: For ML dependencies, **always use custom Dockerfile**.

---

#### Lesson 2: Memory Planning for ML Models

**Issue**: 470MB embedding model + FAISS index = 1.2GB memory  
**Solution**: Railway Pro Plan (8GB RAM) required  
**Cost**: ~$20/month (acceptable for production)

**Takeaway**: **Plan memory upfront** for ML models (model size × 2-3x for runtime).

---

#### Lesson 3: One-Time vs. Per-Request Operations

**Issue**: Embedding generation (~30s) too slow for per-request  
**Solution**: Generate once at startup, cache in memory  
**Result**: <100ms per request (FAISS search only)

**Takeaway**: **Cache expensive operations** (model loading, embeddings) at startup.

---

### 5.2 Development Process

#### Lesson 4: Rapid Iteration (Same-Day Milestones)

**M2.1** (Nov 3 AM) + **M2.2** (Nov 3 PM) = **Same day completion**

**Key Factors**:
- Clear separation of concerns (M2.1: prompts, M2.2: embeddings)
- Backward compatibility (no breaking changes)
- Incremental deployment (M2.1 first, validate, then M2.2)

**Takeaway**: **Break large features into small, deployable milestones**.

---

#### Lesson 5: Platform Sunset Strategy

**Decision**: Remove YouTube, Instagram, Facebook, LinkedIn (focus Twitter + TikTok)

**Rationale**:
- Web app available for other platforms
- Better to perfect 2 platforms than maintain 6
- Reduced code complexity (-41%)

**Takeaway**: **Strategic feature removal** can improve maintainability.

---

#### Lesson 6: Platform-Specific UX

**Twitter**: Hover overlay (timeline scrolling)  
**TikTok**: Fixed button (multiple page types)

**Takeaway**: **Don't force universal UX**; adapt to platform behavior.

---

### 5.3 Technical Debt

#### Known Issues

1. **Extension**: No YouTube support (visibility issues unresolved)
2. **Backend**: No Redis caching (direct memory cache only)
3. **Frontend**: No offline mode (requires API)
4. **Extension**: No localization (French only)

#### Future Improvements

1. **Redis Caching**: Reduce API calls, improve latency
2. **WebSocket**: Real-time analysis updates
3. **Confidence Calibration**: Add confidence intervals to scores
4. **Multi-language**: English + French support

---

## 6. Technical Debt & Future Work

### 6.1 High Priority

1. **Migration OpenAI → Mistral AI**: Replace OpenAI services with Mistral equivalents
   - **Voxtral**: Replace Whisper API for audio/video transcription
   - **Pixtral**: Replace Vision API for OCR/text extraction from images
   - **Mistral Large/Large 3**: Replace GPT-4o-mini for semantic analysis
   - **Comparative Evaluation**: Benchmark performance, cost, quality before migration
2. **YouTube Extension Support**: Resolve button visibility/clickability
3. **Redis Integration**: Cache analysis results (reduce API calls)
4. **Confidence Calibration**: Add uncertainty estimates to scores
5. **WebSocket Streaming**: Real-time analysis progress

### 6.2 Medium Priority

1. **Multi-language Support**: English output option
2. **Offline Mode**: Service worker caching for extension
3. **Batch Analysis**: Analyze multiple posts at once
4. **Export Reports**: PDF/JSON download

### 6.3 Low Priority

1. **Firefox Extension**: Manifest V3 port
2. **Safari Extension**: WebKit port
3. **Mobile App**: React Native version
4. **API Rate Limiting**: Per-user quotas

---

## 7. References & Bibliography

### Academic Papers

1. **DIMA Framework (M82 Project)**: Taxonomy of 130 misinformation techniques
2. **OpenAI GPT-4 Technical Report**: Model capabilities, limitations
3. **Sentence-Transformers**: Multilingual semantic embeddings (Reimers & Gurevych, 2019)
4. **FAISS**: Efficient similarity search (Johnson et al., 2019)

### Technical Documentation

- [DIMA Semantic RFC](./docs/DIMA_Semantic_RFC.md): Full integration design
- [Chrome Extension Plan](./docs/Chrome_Extension_Implementation_Plan.md): Extension architecture
- [DIMA M2.2 Performance Report](./docs/DIMA_M2.2_Performance_Report.md): Production metrics

### Tools & Libraries

- **FastAPI**: Modern Python web framework
- **React**: Component-based UI library
- **Chrome Manifest V3**: Extension architecture
- **Railway**: Container hosting platform
- **Vercel**: Static site hosting

---

**Document Status**: ✅ Production System Documentation  
**Last Updated**: January 2026  
**Maintainers**: Civic Tech AI Lab — GenerativSchool

---

*This document is part of the InfoVerif.org open-source project. For contributions or questions, see [CONTRIBUTING.md](../CONTRIBUTING.md) or open a GitHub issue.*

