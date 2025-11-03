# DIMA M2.2 — Semantic Embeddings Implementation Plan

**Date**: November 3, 2025  
**Phase**: Milestone 2.2 — Semantic Embeddings Layer  
**Infrastructure**: Railway Pro Plan (Enhanced Resources)  
**Status**: Architecture & Planning  
**Estimated Duration**: 2-3 weeks

---

## 🎯 Executive Summary

With **Railway Pro Plan**, we can implement a robust semantic embeddings layer without resource constraints. This enables:

1. **Semantic similarity matching** for DIMA techniques (beyond keyword patterns)
2. **Vector database** for fast similarity search (130 technique embeddings)
3. **Hybrid scoring**: Blend GPT-4 outputs with embedding-based detection
4. **Optional Redis caching** for embedding lookups
5. **Confidence calibration** using historical data

---

## 💰 Railway Pro Plan Resources

### Available vs. Required

| Resource | Pro Plan Limit | M2.2 Requirements | Headroom |
|----------|----------------|-------------------|----------|
| **Memory** | 8GB (default) | ~2GB (embeddings + API) | ✅ 6GB free |
| **CPU** | 8 vCPU | 2 vCPU (inference) | ✅ 6 vCPU free |
| **Storage** | 100GB | ~1GB (models + data) | ✅ 99GB free |
| **Bandwidth** | Generous | ~10GB/month | ✅ Plenty |
| **Build Time** | 30min | ~10min (pip install) | ✅ OK |

**Verdict**: Railway Pro Plan is **MORE than sufficient** for M2.2. We can even add Redis + monitoring.

---

## 🏗️ Proposed Architecture (M2.2)

### Service Structure (Railway Multi-Service)

```
Railway Project: infoverif-org
├── Service 1: api (existing, enhanced)
│   ├── Python 3.11 + FastAPI
│   ├── OpenAI API (GPT-4o-mini, Whisper, Vision)
│   ├── sentence-transformers (NEW)
│   ├── FAISS vector store (NEW, in-memory)
│   └── Memory: 2GB, CPU: 2 vCPU
│
├── Service 2: redis (NEW, optional)
│   ├── Redis 7.x (Railway template)
│   ├── Cache for embeddings & results
│   └── Memory: 512MB, CPU: 0.5 vCPU
│
└── Service 3: monitoring (NEW, optional)
    ├── Prometheus + Grafana (Railway template)
    ├── Track latency, costs, accuracy
    └── Memory: 1GB, CPU: 0.5 vCPU
```

**Total Resource Usage**: ~3.5GB RAM, ~3 vCPU (well within Pro limits)

---

## 📦 Dependencies & Model Selection

### Sentence-Transformers Setup

**Model Choice**: `paraphrase-multilingual-MiniLM-L12-v2`
- **Language**: Multilingual (French + English)
- **Size**: 470MB (smaller than all-mpnet-base-v2)
- **Dimensions**: 384 (compact for 130 techniques)
- **Speed**: ~50ms per encoding (CPU-friendly)
- **Quality**: F1 0.85+ on similarity tasks

**Alternative** (if more accuracy needed):
- `sentence-transformers/distiluse-base-multilingual-cased-v2` (505MB)
- `Cohere embed-multilingual-v3.0` (API-based, no local model)

### Updated `requirements-lite.txt`

```txt
# ... existing dependencies ...

# DIMA M2.2: Semantic Embeddings
sentence-transformers==2.2.2  # ~470MB model download
faiss-cpu==1.7.4              # Vector similarity search (CPU-optimized)
numpy==1.24.3                 # Required by sentence-transformers
scikit-learn==1.3.0           # Calibration, metrics
```

**Total Dependency Size**: ~700MB (Docker image ~900MB total)

---

## 🔢 Embedding Strategy

### 1. Precompute Technique Embeddings (Offline)

**Script**: `scripts/precompute_dima_embeddings.py`

```python
from sentence_transformers import SentenceTransformer
import numpy as np
import csv

# Load model (one-time download)
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

# Load DIMA taxonomy
techniques = []
with open('docs/DIMA_Full_Mapping.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Combine name + semantic features for richer embeddings
        text = f"{row['technique_name_fr']}. {row['semantic_features']}"
        techniques.append({
            'code': row['dima_code'],
            'text': text,
            'family': row['dima_family']
        })

# Generate embeddings (130 x 384)
texts = [t['text'] for t in techniques]
embeddings = model.encode(texts, show_progress_bar=True)

# Save to disk
np.save('data/dima_embeddings.npy', embeddings)
print(f"✅ Saved {len(embeddings)} embeddings ({embeddings.shape})")
```

**Output**: `data/dima_embeddings.npy` (~200KB, 130 x 384 floats)

---

### 2. Load Embeddings at Startup (Fast)

**Enhanced**: `api/dima_detector.py`

```python
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

class DIMADetector:
    def __init__(self, ...):
        # ... existing code ...
        self.embeddings = None
        self.faiss_index = None
        self.encoder_model = None
        self._load_embeddings()
    
    def _load_embeddings(self):
        """Load precomputed embeddings and build FAISS index."""
        try:
            embeddings_path = Path(__file__).parent.parent / "data" / "dima_embeddings.npy"
            self.embeddings = np.load(embeddings_path).astype('float32')
            
            # Build FAISS index (L2 distance)
            dimension = self.embeddings.shape[1]  # 384
            self.faiss_index = faiss.IndexFlatL2(dimension)
            self.faiss_index.add(self.embeddings)
            
            # Load encoder model (for runtime queries)
            self.encoder_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
            
            print(f"✅ DIMA embeddings loaded: {len(self.embeddings)} vectors, dim={dimension}")
        
        except Exception as e:
            print(f"⚠️  Could not load DIMA embeddings: {e}")
            # Graceful degradation: continue without embeddings
    
    def find_similar_techniques(self, text: str, top_k: int = 5) -> List[Dict]:
        """
        Find most similar DIMA techniques using embeddings.
        
        Args:
            text: Content to analyze
            top_k: Number of similar techniques to return
        
        Returns:
            List of dicts with code, name, similarity score
        """
        if self.faiss_index is None or self.encoder_model is None:
            return []
        
        # Encode query text
        query_embedding = self.encoder_model.encode([text]).astype('float32')
        
        # Search FAISS index
        distances, indices = self.faiss_index.search(query_embedding, top_k)
        
        # Convert to results (L2 distance → cosine similarity)
        results = []
        for i, (dist, idx) in enumerate(zip(distances[0], indices[0])):
            if idx >= len(self.taxonomy):
                continue
            
            code = list(self.taxonomy.keys())[idx]
            technique = self.taxonomy[code]
            
            # Convert L2 distance to similarity score (0-1)
            similarity = 1 / (1 + dist)  # Simple normalization
            
            results.append({
                'code': code,
                'name': technique['name_fr'],
                'family': technique['family'],
                'similarity': float(similarity),
                'rank': i + 1
            })
        
        return results
```

---

### 3. Hybrid Scoring: GPT-4 + Embeddings

**Enhanced**: `api/dima_prompts.py`

```python
def build_hybrid_prompt(content: str, metadata: Dict, similar_techniques: List[Dict] = None) -> str:
    """
    Build prompt with GPT-4 taxonomy + embedding similarity hints.
    
    Args:
        content: Text to analyze
        metadata: Metadata dict
        similar_techniques: Top-K similar techniques from embeddings (optional)
    
    Returns:
        Enhanced prompt with similarity hints
    """
    detector = get_detector()
    
    # Base DIMA-aware prompt
    base_prompt = build_dima_aware_prompt(content, metadata)
    
    # If embeddings available, add similarity hints
    if similar_techniques:
        hints_section = "\n\nTECHNIQUES SÉMANTIQUEMENT PROCHES (détectées par analyse sémantique):\n"
        hints_section += "Ces techniques ont une forte similarité avec le contenu analysé. Priorise leur détection:\n\n"
        
        for tech in similar_techniques[:5]:  # Top 5
            hints_section += f"- {tech['code']}: {tech['name']} (Famille: {tech['family']}) — Similarité: {tech['similarity']:.2f}\n"
        
        hints_section += "\nSi ces techniques sont présentes, cite-les avec leur code DIMA exact.\n"
        
        # Insert hints before "INSTRUCTIONS POUR L'ANALYSE"
        base_prompt = base_prompt.replace(
            "INSTRUCTIONS POUR L'ANALYSE:",
            hints_section + "\nINSTRUCTIONS POUR L'ANALYSE:"
        )
    
    return base_prompt
```

**Enhanced**: `api/deep.py`

```python
def analyze_with_gpt4(transcript: str, metadata: Dict, use_dima: bool = True, use_embeddings: bool = True) -> Dict:
    """Analyze with hybrid GPT-4 + embeddings approach."""
    
    detector = get_detector()
    similar_techniques = []
    
    # Step 1: Semantic similarity search (if embeddings available)
    if use_embeddings and use_dima and DIMA_ENABLED:
        similar_techniques = detector.find_similar_techniques(transcript[:2000], top_k=5)
        print(f"🔍 Embedding similarity: {[t['code'] for t in similar_techniques]}")
    
    # Step 2: Build enhanced prompt with similarity hints
    if use_dima and DIMA_ENABLED:
        from dima_prompts import build_hybrid_prompt
        prompt = build_hybrid_prompt(transcript[:8000], metadata, similar_techniques)
    else:
        # Legacy prompt
        prompt = ANALYSIS_PROMPT.format(...)
    
    # Step 3: GPT-4 analysis (as before)
    response = client.chat.completions.create(...)
    parsed = json.loads(content)
    
    # Step 4: Add embedding metadata to response
    if similar_techniques:
        parsed['embedding_hints'] = similar_techniques
    
    return parsed
```

---

## 🚀 Deployment Strategy (Railway)

### Step 1: Update Dependencies

```bash
# api/requirements-lite.txt
sentence-transformers==2.2.2
faiss-cpu==1.7.4
numpy==1.24.3
scikit-learn==1.3.0
```

### Step 2: Precompute Embeddings (Local)

```bash
cd /Volumes/LaCie/Dev/infoverif.org
python3 scripts/precompute_dima_embeddings.py

# Output: data/dima_embeddings.npy (~200KB)
# Commit to repo: git add data/dima_embeddings.npy
```

### Step 3: Update nixpacks.toml (Railway)

```toml
[phases.setup]
nixPkgs = ["python311", "ffmpeg"]

[phases.install]
cmds = [
  "python3.11 -m venv --without-pip /app/.venv",
  ". /app/.venv/bin/activate && curl -sS https://bootstrap.pypa.io/get-pip.py | python",
  "cd api && . /app/.venv/bin/activate && pip install --upgrade pip setuptools wheel",
  "cd api && . /app/.venv/bin/activate && PIP_PREFER_BINARY=1 pip install --prefer-binary --cache-dir /tmp/pip-cache -r requirements-lite.txt"
]

[start]
cmd = "cd api && . /app/.venv/bin/activate && python -m uvicorn main:app --host 0.0.0.0 --port $PORT"

# No changes needed! sentence-transformers installs via pip
```

### Step 4: Railway Service Config (Pro Plan)

**Service: api (Enhanced)**
- **Memory**: 2GB (up from 512MB)
- **CPU**: 2 vCPU
- **Build**: ~10min (pip install sentence-transformers)
- **Startup**: ~5-10s (load embeddings)

**New Service: redis (Optional)**
```yaml
# Railway Template: Redis
# Memory: 512MB
# Use for caching:
#   - Embedding similarity results (TTL 1h)
#   - Analysis results (TTL 24h)
```

### Step 5: Environment Variables

```bash
# Railway Dashboard → api service → Variables
DIMA_EMBEDDINGS_ENABLED=true
DIMA_EMBEDDINGS_TOP_K=5
REDIS_URL=redis://redis:6379/0  # If Redis service added
```

---

## 📊 Performance Estimates (Railway Pro)

### Latency Breakdown

| Step | Time (ms) | Cumulative |
|------|-----------|------------|
| Embedding similarity search | 50-100 | 50-100ms |
| GPT-4 API call (enhanced prompt) | 2000-4000 | 2050-4100ms |
| Total analysis | | **2.1-4.1s** |

**Impact**: +50-100ms (2-4% increase, negligible)

### Cost Breakdown (Railway Pro)

| Item | Cost/Month | Notes |
|------|------------|-------|
| Railway Pro Plan | $20 | Base subscription |
| API service (2GB RAM) | Included | Within plan limits |
| Redis service (512MB) | Included | Within plan limits |
| OpenAI API | ~$20-50 | Usage-based (separate) |
| **Total** | **$40-70** | Railway + OpenAI |

**ROI**: Improved accuracy (F1 +0.10 to +0.15) justifies cost.

---

## 🎯 Success Metrics (M2.2)

### Quantitative Targets

| Metric | Baseline (M2.1) | Target (M2.2) | Method |
|--------|-----------------|---------------|--------|
| DIMA code coverage | 20-30% | 40-50% | Embedding hints |
| Technique precision | 0.70 | 0.80 | Hybrid scoring |
| Technique recall | 0.60 | 0.75 | Semantic matching |
| False positive rate | 15% | <10% | Embedding validation |
| Latency | <5s | <6s | +100ms acceptable |

### Qualitative Goals

- ✅ Techniques detected in nuanced/paraphrased content
- ✅ Reduced keyword dependency (semantic understanding)
- ✅ Better multilingual support (French/English)
- ✅ Confidence scores calibrated with historical data

---

## 🛠️ Implementation TODOs (M2.2)

**Estimated Duration**: 2-3 weeks (10-15 tasks)

### Week 1: Core Embeddings
1. Add sentence-transformers to requirements
2. Create `scripts/precompute_dima_embeddings.py`
3. Precompute 130 embeddings, save to `data/`
4. Enhance `dima_detector.py`: Load embeddings + FAISS
5. Test similarity search with sample texts

### Week 2: Hybrid Integration
6. Create `dima_prompts.build_hybrid_prompt()`
7. Enhance `deep.analyze_with_gpt4()` with embeddings
8. Add embedding hints to GPT-4 prompts
9. Update JSON schema with `embedding_hints` field
10. Test hybrid scoring on 10+ examples

### Week 3: Deployment & Optimization
11. Deploy to Railway with 2GB RAM allocation
12. Add Redis caching (optional)
13. Monitor performance (latency, accuracy)
14. Calibrate confidence thresholds
15. Document M2.2 completion

---

## 🔍 Optional Enhancements (Pro Plan)

### A. Redis Caching Layer

```python
# api/cache.py (NEW)
import redis
import json
import hashlib

redis_client = redis.from_url(os.getenv("REDIS_URL"))

def cache_embedding_similarity(text: str, results: List[Dict], ttl: int = 3600):
    """Cache embedding similarity results for 1 hour."""
    key = f"embedding:{hashlib.md5(text.encode()).hexdigest()}"
    redis_client.setex(key, ttl, json.dumps(results))

def get_cached_similarity(text: str) -> Optional[List[Dict]]:
    """Retrieve cached similarity results."""
    key = f"embedding:{hashlib.md5(text.encode()).hexdigest()}"
    cached = redis_client.get(key)
    return json.loads(cached) if cached else None
```

**Benefits**:
- Reduce redundant embedding computations
- Faster response for repeated content
- Cost savings on OpenAI API calls

---

### B. Monitoring with Prometheus + Grafana

**Railway Template**: Add Prometheus + Grafana service

**Metrics to Track**:
- Request latency (p50, p95, p99)
- Embedding similarity scores distribution
- DIMA code detection rate per family
- OpenAI API costs per request
- Cache hit rate (if Redis enabled)

**Dashboards**:
- Real-time analysis performance
- Cost tracking ($/request over time)
- Technique detection heatmap (130 codes)

---

### C. A/B Testing Framework

**Test**: GPT-4 only vs. Hybrid (GPT-4 + Embeddings)

```python
# Randomly assign 50% of requests to each variant
import random

def analyze_text(text: str, ...):
    use_embeddings = random.random() < 0.5  # 50% A/B split
    result = analyze_with_gpt4(text, ..., use_embeddings=use_embeddings)
    result['_variant'] = 'embeddings' if use_embeddings else 'gpt4_only'
    return result
```

**Goal**: Measure accuracy improvement from embeddings

---

## 📋 Risk Assessment (M2.2)

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Model download timeout (470MB) | Low | Medium | Pin version, use Railway cache |
| Memory overflow (2GB limit) | Very Low | High | Pro plan has 8GB available |
| Embedding accuracy below GPT-4 | Medium | Medium | Use as hints, not replacement |
| Increased latency (>6s) | Low | Medium | Optimize FAISS, cache results |
| Cost overrun (>$70/month) | Low | Low | Monitor, set alerts at $60 |

**Overall Risk**: **LOW** (Railway Pro plan provides ample resources)

---

## ✅ Decision: Proceed with M2.2?

**Recommendation**: **YES** — Railway Pro Plan makes M2.2 highly feasible.

**Next Steps**:
1. ✅ Approve M2.2 plan
2. Create 10-15 TODOs for implementation
3. Start Week 1 (Core Embeddings)
4. Deploy incrementally with feature flags

**Timeline**: 2-3 weeks to production

**ROI**: Better accuracy, semantic understanding, future-proof for M3 (fine-tuned models)

---

**Ready to create the M2.2 implementation TODOs?** 🚀

