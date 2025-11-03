# DIMA M2 Architecture Review — Integration Plan

**Date**: November 3, 2025  
**Phase**: Milestone 2 — Semantic Detector Design  
**Status**: Architecture Review (Pre-Implementation)  
**Estimated Duration**: 4-6 weeks

---

## 🎯 Executive Summary

**Goal**: Replace keyword-based GPT-4 prompts with a **hybrid semantic detector** that combines:
1. **DIMA taxonomy-aware prompts** (130 techniques from M1)
2. **Semantic embeddings** for technique classification
3. **Few-shot learning** with annotated examples
4. **Structured JSON output** with DIMA TE codes + InfoVerif scores

**Non-Goal**: Full ML model training (Phase 3). M2 focuses on **enhanced prompt engineering + embeddings** as a foundation.

---

## 📋 Current Architecture Analysis

### Backend (`/api`)

**Current Flow** (`analyze_text`, `analyze_video`, `analyze_image`):
```
Input (text/video/image) 
  → Preprocessing (Whisper ASR / Vision OCR)
  → analyze_with_gpt4(transcript, metadata)
      → ANALYSIS_PROMPT.format(transcript, metadata)
      → OpenAI API (gpt-4o-mini, json_object mode)
      → JSON response: {propaganda_score, conspiracy_score, misinfo_score, techniques[], claims[], summary}
  → Frontend display (ReportDeep.jsx)
```

**Key Files**:
- `api/main.py`: FastAPI endpoints (`/analyze-text`, `/analyze-video`, `/analyze-image`)
- `api/deep.py`: Core analysis logic (`analyze_with_gpt4`, `ANALYSIS_PROMPT`)
- `api/requirements-lite.txt`: Dependencies (openai==1.12.0, ffmpeg-python)

**Strengths**:
- ✅ Clean separation (main.py = routes, deep.py = logic)
- ✅ Multimodal input handling (text/ASR/OCR)
- ✅ Structured JSON output with validation
- ✅ Deployed on Railway (nixpacks.toml, PORT env)

**Limitations**:
- ⚠️ Generic prompt (no DIMA taxonomy awareness)
- ⚠️ No embeddings or semantic similarity
- ⚠️ No few-shot examples in prompt
- ⚠️ No DIMA TE codes in output (only generic technique names)
- ⚠️ No confidence calibration

---

### Frontend (`/web/src`)

**Current Flow**:
```
Home.jsx (3 tabs: text/video/image)
  → Upload/Input → axios.post(API_URL/analyze-*)
  → navigate('/report-deep', {state: {report}})
  → ReportDeep.jsx displays:
      - Scores (4 bars: overall, I_p, N_s, F_f)
      - Techniques (name, evidence, severity, explanation)
      - Claims (claim, confidence, issues, reasoning)
      - Summary + transcript excerpt
```

**Key Files**:
- `web/src/pages/Home.jsx`: Input UI (3 tabs, drag-drop uploads)
- `web/src/pages/ReportDeep.jsx`: Results display
- `web/src/pages/MethodCard.jsx`: Methodology documentation

**Frontend Compatibility**:
- ✅ Already consumes `techniques[]` and `claims[]` arrays
- ✅ Black & white theme compatible with DIMA output
- ⚠️ No DIMA TE code display (would need optional `code` field in technique objects)
- ⚠️ No confidence intervals or calibration warnings

---

## 🏗️ Proposed M2 Architecture

### Strategy: **Sidecar Semantic Layer** (Non-Invasive)

**Design Principle**: Don't replace `deep.py` entirely; **augment** it with a DIMA semantic layer.

```
api/
  ├── main.py                    [NO CHANGE]
  ├── deep.py                    [ENHANCED: new analyze_with_dima_hybrid()]
  ├── dima_detector.py           [NEW: semantic layer]
  ├── dima_prompts.py            [NEW: DIMA-aware few-shot prompts]
  └── requirements-lite.txt      [UPDATED: +sentence-transformers (optional)]
```

### New Module: `dima_detector.py`

**Responsibilities**:
1. Load DIMA mapping (`docs/DIMA_Full_Mapping.csv`) at startup
2. Provide few-shot examples from `data/dima_examples/*.json`
3. **[Optional]** Compute embeddings for semantic similarity (if resources allow)
4. Enhance GPT-4 prompts with DIMA taxonomy context
5. Map GPT-4 outputs to DIMA TE codes using weighted alignment

**Key Functions**:
```python
def load_dima_taxonomy() -> Dict[str, Dict]:
    """Load 130 techniques from CSV with weights."""
    
def get_few_shot_examples(technique_code: str, n: int = 2) -> List[Dict]:
    """Retrieve annotated examples for few-shot prompting."""
    
def build_dima_aware_prompt(content: str, metadata: Dict) -> str:
    """Build enhanced prompt with DIMA taxonomy + examples."""
    
def map_gpt4_to_dima(gpt4_output: Dict, dima_taxonomy: Dict) -> Dict:
    """Map generic technique names to DIMA TE codes using semantic similarity."""
    
# Optional (Phase 2.2 - if compute budget allows)
def compute_embedding_similarity(text: str, technique_codes: List[str]) -> Dict[str, float]:
    """Use sentence-transformers for semantic matching (CPU-friendly)."""
```

---

## 🔄 Integration Strategy: Backward-Compatible

### Phase 2.1: Enhanced Prompts (Week 1-2)

**Goal**: DIMA-aware prompts without adding compute overhead.

**Implementation**:
1. Load `DIMA_Full_Mapping.csv` at FastAPI startup (cached in memory)
2. Inject **COMPLETE** DIMA taxonomy (130 techniques) into `ANALYSIS_PROMPT`:
   ```python
   # In dima_prompts.py
   DIMA_TAXONOMY_CONTEXT = """
   Tu utilises la taxonomie DIMA complète (130 techniques de manipulation).
   
   FAMILLE ÉMOTION (10 techniques):
   - TE-01: Appel à l'émotion | TE-02: Peur / Menace | TE-03: Indignation / Colère
   - TE-04: Tristesse / Compassion | TE-05: Joie / Espoir artificiel
   - TE-06: Dégoût / Mépris | TE-07: Culpabilisation | TE-08: Langage chargé
   - TE-09: Appel à la nostalgie | TE-10: Urgence artificielle
   
   FAMILLE SIMPLIFICATION (19 techniques):
   - TE-11: Sur-simplification | TE-12: Cadrage dichotomique | TE-13: Pensée binaire
   - TE-14: Ennemi commun | TE-15: Slogan / Formule choc | TE-16: Métaphore militaire
   - TE-17: Analogie trompeuse | TE-18: Personnification abstraite | TE-19: Caricature
   - TE-20: Narration héroïque | TE-21: Logique binaire simpliste | TE-22: Faux dilemme
   - TE-23: Réductionnisme causal | TE-24: Homogénéisation | TE-25: Stéréotype
   - TE-26: Essentialisation | TE-27: Pente glissante | TE-28: Généralisation abusive
   - TE-29: Extrapolation excessive | TE-30: Raccourci cognitif
   
   [... ALL 6 FAMILIES, 130 techniques - compact format ...]
   
   Pour chaque technique détectée, cite le CODE DIMA exact (ex: TE-58) et la FAMILLE.
   """
   ```
3. Add 2-3 few-shot examples per high-priority technique (TE-01, TE-02, TE-58, TE-62)
4. Update JSON schema to include optional `dima_code` field:
   ```json
   {
     "techniques": [
       {
         "dima_code": "TE-58",  // NEW
         "dima_family": "Diversion",  // NEW
         "name": "Théorie du complot",
         "evidence": "...",
         "severity": "high",
         "explanation": "..."
       }
     ]
   }
   ```

**Strategy for 130 Techniques in Prompt**:
- Use **compact notation** (pipe-separated, one line per family group)
- Total prompt increase: ~3000-3500 tokens (acceptable for gpt-4o-mini 128K context)
- Cost impact: ~$0.001 extra per request (negligible)

**Backend Changes**:
- `api/dima_prompts.py` (new): Generate full 130-technique taxonomy context
- `api/dima_detector.py` (new): Taxonomy loader, few-shot retrieval, compact formatter
- `api/deep.py` (modified): Import `dima_detector`, use enhanced prompt
- `api/main.py` (modified): Preload taxonomy at startup

**Frontend Changes**:
- `web/src/pages/ReportDeep.jsx` (optional): Display DIMA code badge if present
  ```jsx
  {t.dima_code && (
    <span className="text-xs text-gray-400 font-mono">
      [{t.dima_code}]
    </span>
  )}
  ```

**Deployment Impact**:
- ✅ No new dependencies (OpenAI only)
- ✅ CSV loaded once at startup (negligible memory ~50KB)
- ✅ Backward compatible (DIMA fields optional)
- ✅ Prompt length increased (~3500 tokens for FULL taxonomy)
  - GPT-4o-mini context: 128K tokens (plenty of headroom)
  - Cost: +$0.001 per request (~33% increase, still <$0.005/request)

---

### Phase 2.2: Semantic Embeddings (Week 3-4) [OPTIONAL]

**Goal**: Add lightweight semantic similarity for technique classification.

**Implementation**:
1. Add `sentence-transformers` to `requirements-lite.txt`:
   ```
   sentence-transformers==2.2.2  # CPU-friendly, ~500MB model
   ```
2. Precompute embeddings for 130 DIMA techniques:
   ```python
   # In scripts/precompute_dima_embeddings.py
   from sentence_transformers import SentenceTransformer
   model = SentenceTransformer('all-MiniLM-L6-v2')  # 80MB, fast
   
   for technique in dima_techniques:
       description = technique['technique_name_fr'] + " " + technique['semantic_features']
       embedding = model.encode(description)
       # Save to docs/DIMA_Embeddings.npy (130 x 384 = ~200KB)
   ```
3. At analysis time, compute cosine similarity between content chunks and DIMA embeddings
4. Use as **secondary signal** to boost GPT-4 confidence or resolve ambiguities

**Pros**:
- More robust technique detection
- Language-agnostic (embeddings work across French/English)
- Explainable (cosine similarity scores)

**Cons**:
- ⚠️ Adds ~500MB to Docker image (sentence-transformers + model)
- ⚠️ Inference time +200-500ms (acceptable for async analysis)
- ⚠️ Railway free tier: 512MB RAM (tight but feasible)

**Decision**: **DEFER to Phase 2.2** (after 2.1 works). Start with prompt engineering only.

---

## 📊 Scoring Fusion Model (M2 Scope)

### Current Scores (GPT-4 only)
```json
{
  "propaganda_score": 0-100,    // Maps to I_p
  "conspiracy_score": 0-100,    // Maps to N_s
  "misinfo_score": 0-100,       // Maps to F_f
  "overall_risk": 0-100         // Average or max
}
```

### Enhanced Scores (M2 with DIMA)
```json
{
  "propaganda_score": 0-100,    // I_p (unchanged frontend mapping)
  "conspiracy_score": 0-100,    // N_s
  "misinfo_score": 0-100,       // F_f
  "overall_risk": 0-100,
  
  // NEW (optional, for research/debugging)
  "dima_breakdown": {
    "I_p_weighted": 0-100,      // Sum of detected techniques weighted by I_p
    "N_s_weighted": 0-100,
    "F_f_weighted": 0-100,
    "techniques_count": 5,
    "high_severity_count": 2
  }
}
```

**Fusion Formula** (if DIMA techniques detected):
```python
# Weight GPT-4 general scores with DIMA-specific detections
alpha = 0.7  # GPT-4 weight
beta = 0.3   # DIMA weight

I_p_final = alpha * gpt4_propaganda_score + beta * dima_I_p_weighted
```

**Implementation**:
```python
# In dima_detector.py
def compute_dima_weighted_scores(detected_techniques: List[Dict], dima_taxonomy: Dict) -> Dict:
    """Compute weighted InfoVerif scores from detected DIMA techniques."""
    I_p_sum = 0
    N_s_sum = 0
    F_f_sum = 0
    
    for tech in detected_techniques:
        code = tech['dima_code']
        if code not in dima_taxonomy:
            continue
        
        technique_data = dima_taxonomy[code]
        severity_weight = {'high': 1.0, 'medium': 0.6, 'low': 0.3}.get(tech['severity'], 0.5)
        
        I_p_sum += technique_data['weight_I_p'] * severity_weight * 100
        N_s_sum += technique_data['weight_N_s'] * severity_weight * 100
        F_f_sum += technique_data['weight_F_f'] * severity_weight * 100
    
    # Normalize to 0-100 (assume max 3-5 techniques detected)
    n = len(detected_techniques) or 1
    return {
        'I_p_weighted': min(100, I_p_sum / n),
        'N_s_weighted': min(100, N_s_sum / n),
        'F_f_weighted': min(100, F_f_sum / n)
    }
```

---

## 🚀 Deployment Considerations

### Railway (Backend)

**Current Setup**:
- Platform: Railway (nixpacks)
- Build: `nixpacks.toml` (Python 3.11 + ffmpeg)
- Memory: 512MB (free tier)
- Env: `OPENAI_API_KEY`, `PORT`

**M2 Changes**:
1. Add `DIMA_TAXONOMY_PATH` env var (default: `docs/DIMA_Full_Mapping.csv`)
2. Add `DIMA_EXAMPLES_PATH` env var (default: `data/dima_examples/`)
3. Load DIMA data at FastAPI startup (`@app.on_event("startup")`)
4. **No additional dependencies** (Phase 2.1)
5. *Optional*: Add `sentence-transformers` (Phase 2.2) → requires memory check

**Deployment Risk**:
- ⚠️ CSV/JSON loading at startup (~100ms delay, acceptable)
- ⚠️ Prompt length increase (~1500 tokens) → +$0.001 per request (negligible)
- ✅ No breaking changes to API schema (DIMA fields optional)

### Vercel (Frontend)

**Current Setup**:
- Platform: Vercel
- Framework: React + Vite
- Env: `VITE_API_URL` (points to Railway backend)

**M2 Changes**:
- ✅ **No changes required** (frontend consumes existing JSON schema)
- *Optional*: Update `ReportDeep.jsx` to display DIMA codes (cosmetic)

---

## 📈 Success Metrics (M2)

### Quantitative
- **Coverage**: ≥20% of detected techniques include DIMA TE codes (Phase 2.1)
- **Latency**: Analysis time ≤5 seconds (same as current)
- **Cost**: ≤$0.01 per analysis (OpenAI API, same as current)

### Qualitative
- DIMA techniques cited correctly by GPT-4 (manual validation on 20 examples)
- No regression in current scores (I_p, N_s, F_f)
- JSON schema remains backward compatible

### Phase 2.2 (Embeddings) Metrics
- **Coverage**: ≥40% techniques include DIMA codes
- **Latency**: ≤6 seconds (acceptable with embeddings)
- **Memory**: Docker image ≤700MB (Railway limit)

---

## ⚠️ Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Prompt too long (>8K tokens) | API failure | Low | GPT-4o-mini supports 128K context, full taxonomy ~3.5K tokens |
| GPT-4 ignores DIMA codes | Low detection rate | Medium | Add explicit instructions + few-shot examples + compact formatting |
| Railway memory exceeded (embeddings) | Deployment failure | Low (Phase 2.2 only) | Test locally first, defer if needed |
| Backward compatibility break | Frontend error | Low | Make all DIMA fields optional |
| Cost increase (longer prompts) | Budget overrun | Low | +$0.001/request (~33% increase), monitor usage cap to $50/month |
| GPT-4 overwhelmed by 130 codes | Poor accuracy | Medium | Use compact notation, clear hierarchy, few-shot examples show format |

---

## 🛠️ Implementation Plan: Detailed TODOs

### Phase 2.1: Enhanced Prompts (Weeks 1-2) — 8 TODOs

1. **Create `api/dima_detector.py`**
   - Load `DIMA_Full_Mapping.csv` into memory
   - Function: `load_dima_taxonomy() -> Dict[str, Dict]`
   - Unit test with pytest

2. **Create `api/dima_prompts.py`**
   - Define `DIMA_TAXONOMY_CONTEXT` (FULL 130 techniques, compact notation)
   - Define `build_dima_aware_prompt(content, metadata) -> str`
   - Include few-shot examples from `data/dima_examples/`
   - Generate compact taxonomy string from loaded CSV (pipe-separated format)

3. **Update `api/deep.py`**
   - Import `dima_detector`, `dima_prompts`
   - Modify `analyze_with_gpt4()` to use enhanced prompt
   - Update JSON schema validation to accept optional `dima_code`, `dima_family`

4. **Update `api/main.py`**
   - Add `@app.on_event("startup")` to preload DIMA taxonomy
   - Add `/dima-taxonomy` endpoint (return loaded taxonomy for debugging)

5. **Test with real examples**
   - Test all 5 annotated examples (TE-01, TE-02, TE-31, TE-58, TE-62)
   - Validate JSON schema compatibility
   - Measure latency increase

6. **Update frontend (optional cosmetic)**
   - `web/src/pages/ReportDeep.jsx`: Display DIMA code badges
   - Add tooltip with DIMA family on hover

7. **Update documentation**
   - `docs/DIMA_Semantic_RFC.md`: Mark M2.1 complete
   - `CHANGELOG.md`: Add M2.1 entry
   - `API.md`: Document new `dima_code` field

8. **Deploy to Railway**
   - Git push → auto-deploy
   - Test production endpoint with curl
   - Monitor OpenAI API usage

### Phase 2.2: Embeddings (Weeks 3-4) — 5 TODOs [OPTIONAL]

9. **Create `scripts/precompute_dima_embeddings.py`**
   - Use `sentence-transformers` to generate 130 embeddings
   - Save to `docs/DIMA_Embeddings.npy` (~200KB)

10. **Update `api/requirements-lite.txt`**
    - Add `sentence-transformers==2.2.2`
    - Add `numpy==1.24.0` (if not present)

11. **Enhance `api/dima_detector.py`**
    - Load precomputed embeddings at startup
    - Function: `compute_embedding_similarity(text, technique_codes) -> Dict[str, float]`
    - Use as secondary signal in `map_gpt4_to_dima()`

12. **Update scoring fusion**
    - Implement `compute_dima_weighted_scores()` in `dima_detector.py`
    - Blend GPT-4 scores with DIMA-weighted scores (alpha=0.7, beta=0.3)

13. **Test & deploy embeddings version**
    - Test locally with Docker (ensure <512MB RAM)
    - Deploy to Railway staging first
    - Monitor memory usage via Railway dashboard
    - If stable, promote to production

---

## 🎯 Decision Points

### ✅ APPROVED (Phase 2.1)
- Enhanced prompt engineering with DIMA taxonomy
- Few-shot examples from annotated corpus
- Optional DIMA code fields in JSON response
- Backward-compatible deployment

### 🟡 CONDITIONAL (Phase 2.2)
- Semantic embeddings with `sentence-transformers`
- **Condition**: Memory budget allows (Railway monitoring)
- **Fallback**: Defer to Phase 3 (fine-tuned models)

### ❌ DEFERRED (Phase 3+)
- Fine-tuned classifier (requires GPU, dataset, 8+ weeks)
- Vector database (ChromaDB/Pinecone, Phase 3)
- Real-time monitoring (Phase 3)

---

## 📝 Summary: M2 Scope

**What's In**:
- ✅ DIMA-aware prompts (130 techniques context)
- ✅ Few-shot learning (5 high-priority techniques)
- ✅ Optional DIMA codes in JSON output
- ✅ Backward-compatible deployment
- ✅ Documentation updates

**What's Deferred**:
- 🟡 Semantic embeddings (Phase 2.2, conditional)
- ❌ Fine-tuned models (Phase 3)
- ❌ Vector database (Phase 3)
- ❌ Agent-based monitoring (Phase 4)

**Total Estimated Effort**: 4-6 weeks (2 weeks for 2.1, 2 weeks for 2.2 if approved)

---

## 🚦 Next Step: TODO Creation

Once this architecture is approved, I'll create **13 granular TODOs** covering:
- Phase 2.1 (8 tasks): Prompts, detector, integration, testing, deployment
- Phase 2.2 (5 tasks): Embeddings (optional, staged rollout)

**Ready to proceed with TODO creation?**

