# DIMA Semantic Integration Plan — InfoVerif.org

**RFC Draft v1.0**  
**Date**: January 2026  
**Authors**: AI Architecture Team — GenerativSchool Civic Tech AI Lab  
**Status**: DRAFT — Request for Comments  
**Target Release**: Phase 2 (Q2 2026)

---

## Executive Summary

This RFC proposes the integration of the **DIMA framework** (Détection et Identification de Manipulations de l'information et de l'Attention — M82 Project) into InfoVerif.org's existing semantic multimodal analysis architecture. The integration will replace keyword-based detection with **semantic embeddings, contextual analysis, and structured taxonomic mapping**, while preserving DIMA's expert-grade technique codes internally and presenting educational, plain-language outputs to end users.

**Key Objectives:**
1. Map DIMA's 130+ manipulation techniques to InfoVerif's semantic categories (`I_p`, `N_s`, `F_f`)
2. Replace regex/keyword logic with **embedding similarity** (Sentence-BERT, GPT-4 vectors) and **zero-shot classification**
3. Design a **DIMA Semantic Layer** (sidecar module) that enriches analysis without disrupting current pipelines
4. Implement **explainability**: evidence spans, confidence scores, modality attribution (text/ASR/OCR)
5. Create a **public accessibility transformer** that converts DIMA TE codes → plain-language indicators

---

## Table of Contents

1. [Background & Motivation](#1-background--motivation)
2. [Repository Reconnaissance](#2-repository-reconnaissance)
3. [DIMA Framework Overview](#3-dima-framework-overview)
4. [Alignment Strategy](#4-alignment-strategy)
5. [Semantic Detection Architecture](#5-semantic-detection-architecture)
6. [Scoring & Fusion Model](#6-scoring--fusion-model)
7. [Explainability Design](#7-explainability-design)
8. [Public Accessibility Layer](#8-public-accessibility-layer)
9. [Data Schemas](#9-data-schemas)
10. [Implementation Milestones](#10-implementation-milestones)
11. [Evaluation & Calibration](#11-evaluation--calibration)
12. [Risks & Mitigation](#12-risks--mitigation)
13. [Next Steps](#13-next-steps)

---

## 1. Background & Motivation

### 1.1 Current State: InfoVerif.org MVP

**InfoVerif v1.0.0** (January 2026) implements:
- **Multimodal analysis**: Text (direct input), Video (Whisper ASR), Image (Vision API OCR)
- **LLM-based detection**: GPT-4o-mini with structured prompt engineering
- **Semantic categories**:
  - `propaganda_score` (Intensité persuasive, `I_p`) — 9+ techniques
  - `conspiracy_score` (Narratif spéculatif, `N_s`) — 7+ indicators
  - `misinfo_score` (Fiabilité factuelle, `F_f`) — 7+ patterns
  - `overall_risk` (Indice d'influence, `Φ_influence`) — composite

**Strengths:**
- Rapid prototyping with zero-shot GPT-4
- Multimodal inputs (text, ASR, OCR) → unified semantic pipeline
- Educational explainability (techniques + evidence + reasoning)

**Limitations:**
- **No systematic taxonomy**: Ad-hoc technique list in prompt
- **No structured codes**: Cannot reference academic frameworks (e.g., DIMA, PropOrNot, Tetlock's IPA)
- **No confidence calibration**: Binary high/medium/low severity
- **Limited traceability**: Cannot trace detection to specific modality (text vs ASR vs OCR)

### 1.2 DIMA Framework: M82 Project

**DIMA** (Détection et Identification de Manipulations de l'information et de l'Attention) is a research-grade taxonomy developed by the M82 Project for:
- **Cataloging 130+ manipulation techniques** with unique TE codes (e.g., `TE-01`, `TE-02`)
- **Hierarchical classification**: Families (Émotion, Simplification, Discrédit, etc.)
- **Contextual analysis**: Modality, target audience, intent
- **Risk assessment**: Severity levels tied to democratic impact

**Official Reference**: [https://diod.m82-project.org/index.php/Matrice_DIMA](https://diod.m82-project.org/index.php/Matrice_DIMA)

**Why Integrate DIMA?**
1. **Academic rigor**: Peer-reviewed taxonomy (vs ad-hoc prompt engineering)
2. **Interoperability**: Enables comparison with other research using DIMA codes
3. **Structured explainability**: TE codes → traceable to detection logic
4. **Evolution path**: Can fine-tune classifiers on DIMA-annotated datasets

### 1.3 Integration Philosophy

**Design Principle: Semantic Sidecar**

Instead of replacing InfoVerif's current GPT-4 pipeline, we propose a **DIMA Semantic Layer** that:
1. **Enriches** existing analysis with DIMA TE codes (backward compatible)
2. **Operates in parallel**: Current prompt-based detection → Phase 1; DIMA semantic → Phase 2
3. **Gradual migration**: Start with embedding-based re-scoring, then full classifier replacement

---

## 2. Repository Reconnaissance

### 2.1 Backend Architecture (`/api`)

**Current Files:**
```
/api
├── main.py             # FastAPI routes, CORS, endpoints
├── deep.py             # GPT-4 analysis, Whisper, Vision OCR
├── lite.py             # Legacy heuristic metadata (deprecated)
├── claims.py           # Validation utilities
└── requirements-lite.txt
```

**Key Analysis Entry Points:**
1. **`/analyze-text`** (Line 252, `main.py`) → `deep.analyze_text()`
2. **`/analyze-video`** (Line 268) → `deep.analyze_file()` → FFmpeg → Whisper → GPT-4
3. **`/analyze-image`** (Line 292) → `deep.analyze_image()` → Vision OCR → GPT-4

**Core Analysis Function:**
- `analyze_with_gpt4()` (Line 135, `deep.py`)
  - **Input**: `transcript` (text/ASR/OCR), `metadata` (platform, title)
  - **Process**: Format `ANALYSIS_PROMPT` → GPT-4o-mini with `response_format=json_object`
  - **Output**: `{propaganda_score, conspiracy_score, misinfo_score, overall_risk, techniques, claims, summary}`

**Current Prompt Structure** (`deep.py`, Lines 14-79):
```python
ANALYSIS_PROMPT = """Tu es un expert en manipulation médiatique...

1. TECHNIQUES DE PROPAGANDE (score 0-100):
   - Manipulation émotionnelle (peur, colère, indignation, urgence)
   - Cadrage "eux vs nous" / désignation d'un bouc émissaire
   - Langage chargé / mots sensationnalistes
   ...

2. MARQUEURS CONSPIRATIONNISTES (score 0-100):
   - Narratives de "vérité cachée" / révélation
   - Défiance envers institutions/experts/médias mainstream
   ...

3. DÉSINFORMATION & MANIPULATION (score 0-100):
   - Affirmations non sourcées présentées comme faits
   - Sophismes logiques identifiables
   ...
"""
```

**Insertion Point for DIMA Semantic Layer:**
- **Option A (Non-Invasive)**: New module `dima.py` → Called after `analyze_with_gpt4()` → Enriches JSON
- **Option B (Hybrid)**: Modify `ANALYSIS_PROMPT` to include DIMA TE codes → GPT-4 outputs codes
- **Option C (Full Replacement)**: New `dima_semantic.py` → Embedding-based classifier → Bypasses GPT-4

**Recommendation**: **Option A** for MVP (Phase 2.1), **Option C** for production (Phase 2.2+).

### 2.2 Frontend Architecture (`/web/src`)

**Current Files:**
```
/web/src
├── App.jsx                 # Router (/, /report, /method-card)
├── pages/
│   ├── Home.jsx            # 3-tab input (text, video, image)
│   ├── ReportDeep.jsx      # Display scores, techniques, claims
│   └── MethodCard.jsx      # Methodology documentation
└── components/
    └── Equation.jsx        # LaTeX rendering (KaTeX)
```

**UI Display Logic** (`ReportDeep.jsx`, Lines 14-19):
```jsx
const scores = {
  propaganda: report.propaganda_score ?? 0,      // → "Intensité persuasive"
  conspiracy: report.conspiracy_score ?? 0,      // → "Narratif spéculatif"
  misinfo: report.misinfo_score ?? 0,            // → "Fiabilité factuelle"
  overall: report.overall_risk ?? ...            // → "Indice d'influence"
}
```

**Techniques Display** (Lines 56-79):
```jsx
{report.techniques.map((t, i) => (
  <div>
    <div>{t.name}</div>                          // Public name (French)
    <span>{t.severity}</span>                    // high/medium/low
    <div>« {t.evidence} »</div>                  // Quoted evidence
    <div>{t.explanation}</div>                   // 2-3 sentence rationale
  </div>
))}
```

**Integration Point for DIMA:**
- Add `t.dima_code` (optional, hidden by default)
- Add `t.confidence` (0-1 float, displayed as %)
- Add `t.modality` (`"text" | "asr" | "ocr"`) → Icon/badge
- Backend sends DIMA TE codes; frontend optionally displays for experts

---

## 3. DIMA Framework Overview

### 3.1 Structure (Based on M82 Matrix)

**Hierarchical Taxonomy:**
```
DIMA Framework
├── Familles (Families)
│   ├── Émotion (Emotion-based manipulation)
│   ├── Simplification (Oversimplification)
│   ├── Discrédit (Discrediting)
│   ├── Diversion (Diversion/distraction)
│   ├── Décontextualisation (Decontextualization)
│   └── [8-10 other families]
│
└── Techniques (130+ techniques)
    ├── TE-01: Appel à l'émotion
    ├── TE-02: Peur / Menace
    ├── TE-03: Indignation / Colère
    ├── TE-15: Simplification excessive
    ├── TE-22: Faux dilemme
    ├── TE-35: Sophisme ad hominem
    ├── TE-47: Cherry-picking
    ├── TE-58: Théorie du complot
    └── ...
```

**Each TE Code Includes:**
- **Identifiant**: `TE-XX` (unique code)
- **Nom**: French technique name (e.g., "Appel à l'émotion")
- **Famille**: Parent family (e.g., "Émotion")
- **Description**: Academic definition (~2-3 sentences)
- **Indicateurs sémantiques**: Keywords, linguistic patterns, contextual cues
- **Niveau de risque**: Low / Medium / High / Critical
- **Exemples**: Annotated real-world examples

**Contextual Attributes:**
- **Modalité**: Text, Image, Video, Audio
- **Cible**: Audience segment (general public, partisan, etc.)
- **Intention**: Persuader, Discréditer, Divertir, Désinformer

### 3.2 Sample DIMA Techniques

| TE Code | Technique Name (FR) | InfoVerif Category | Semantic Features |
|---------|---------------------|-------------------|-------------------|
| `TE-01` | Appel à l'émotion | `I_p` (Propaganda) | Affect-laden words, exclamation marks, urgency markers |
| `TE-02` | Peur / Menace | `I_p` | Threat language, catastrophic scenarios, "si tu ne..." |
| `TE-03` | Indignation / Colère | `I_p` | Anger verbs, moral outrage, "scandaleux", "inacceptable" |
| `TE-15` | Simplification excessive | `I_p` | Binary framing, "seulement deux choix", reductionism |
| `TE-22` | Faux dilemme | `I_p` + `F_f` | "Soit X soit Y" (ignoring alternatives) |
| `TE-35` | Ad hominem | `F_f` | Personal attacks, "tu es un...", credential questioning |
| `TE-47` | Cherry-picking | `F_f` | Selective data, omission markers, "selon cette étude" (no context) |
| `TE-58` | Théorie du complot | `N_s` | Hidden truth claims, "ils ne veulent pas", "vérité cachée" |
| `TE-62` | Défiance institutionnelle | `N_s` | "médias mainstream", "experts corrompus", anti-establishment |
| `TE-71` | Causalité simpliste | `N_s` + `F_f` | "À cause de X", monocausal explanations for complex events |

**Full Mapping**: See [Section 4.3](#43-dima--infoverif-mapping-table)

---

## 4. Alignment Strategy

### 4.1 Mapping Philosophy

**Challenge**: DIMA uses **130+ atomic techniques**; InfoVerif uses **3 semantic dimensions** (`I_p`, `N_s`, `F_f`).

**Solution**: **Many-to-Many Mapping**
- One DIMA technique → One or more InfoVerif categories
- One InfoVerif category → Multiple DIMA techniques

**Example:**
```
TE-22 (Faux dilemme)
├→ I_p (Intensité persuasive)     [Primary]
└→ F_f (Fiabilité factuelle)      [Secondary — logical fallacy]

TE-58 (Théorie du complot)
└→ N_s (Narratif spéculatif)      [Primary]

TE-35 (Ad hominem)
├→ F_f (Fiabilité factuelle)      [Primary — fallacy]
└→ I_p (Intensité persuasive)     [Secondary — discrediting rhetoric]
```

### 4.2 Scoring Contribution Weights

Each DIMA technique contributes to InfoVerif scores with **weighted mappings**:

```python
DIMA_WEIGHT_MAP = {
    "TE-01": {"I_p": 0.8, "N_s": 0.0, "F_f": 0.2},   # Appel émotion → mostly I_p
    "TE-22": {"I_p": 0.6, "N_s": 0.0, "F_f": 0.4},   # Faux dilemme → I_p + F_f
    "TE-35": {"I_p": 0.3, "N_s": 0.0, "F_f": 0.7},   # Ad hominem → mostly F_f
    "TE-58": {"I_p": 0.0, "N_s": 0.9, "F_f": 0.1},   # Complot → mostly N_s
    # ...
}
```

**Aggregate Score Formula:**
```
I_p_dima = Σ (confidence_i * weight_i["I_p"])  for all detected techniques
N_s_dima = Σ (confidence_i * weight_i["N_s"])
F_f_dima = Σ (confidence_i * weight_i["F_f"])
```

### 4.3 DIMA ↔ InfoVerif Mapping Table

**Complete Mapping** (Sample — Full table in Appendix A):

| DIMA Code | Technique (FR) | English Translation | InfoVerif Primary | InfoVerif Secondary | Semantic Features | Example Keywords |
|-----------|----------------|---------------------|-------------------|---------------------|-------------------|------------------|
| **TE-01** | Appel à l'émotion | Emotional appeal | `I_p` | — | Affect lexicon, urgency | "choquant", "terrifiant", "urgent" |
| **TE-02** | Peur / Menace | Fear / Threat | `I_p` | — | Threat language, doom scenarios | "danger", "risque", "si tu ne..." |
| **TE-03** | Indignation / Colère | Outrage / Anger | `I_p` | — | Anger verbs, moral outrage | "scandaleux", "inacceptable", "révolte" |
| **TE-08** | Langage chargé | Loaded language | `I_p` | — | Sensationalist adjectives | "catastrophique", "désastreux", "miraculeux" |
| **TE-12** | Cadrage dichotomique | Binary framing | `I_p` | — | "Eux vs nous", in-group/out-group | "eux", "nous", "les autres" |
| **TE-15** | Simplification excessive | Oversimplification | `I_p` | `F_f` | Reductionism, binary choices | "seulement", "il suffit de" |
| **TE-22** | Faux dilemme | False dilemma | `I_p` | `F_f` | "Soit...soit", ignoring alternatives | "soit X soit Y", "pas d'autre choix" |
| **TE-28** | Généralisation abusive | Overgeneralization | `I_p` | `F_f` | Universal quantifiers, stereotypes | "tous", "toujours", "jamais" |
| **TE-35** | Ad hominem | Ad hominem | `F_f` | `I_p` | Personal attack, credential questioning | "tu es un...", "incompétent" |
| **TE-41** | Appel à l'autorité | Appeal to authority | `I_p` | — | Expert citation without evidence | "selon l'expert X", "les scientifiques disent" |
| **TE-47** | Cherry-picking | Cherry-picking | `F_f` | — | Selective data, omission | "selon cette étude", "un cas prouve" |
| **TE-52** | Statistiques trompeuses | Misleading statistics | `F_f` | — | Decontextualized numbers | "X% de hausse" (no baseline) |
| **TE-58** | Théorie du complot | Conspiracy theory | `N_s` | — | Hidden truth, "they don't want you to know" | "vérité cachée", "ils ne veulent pas" |
| **TE-62** | Défiance institutionnelle | Institutional distrust | `N_s` | — | Anti-establishment rhetoric | "médias mainstream", "experts corrompus" |
| **TE-68** | Causalité simpliste | Simplistic causality | `N_s` | `F_f` | Monocausal explanations | "à cause de X", "c'est X qui..." |
| **TE-71** | Affirmation infalsifiable | Unfalsifiable claim | `N_s` | — | Claims immune to refutation | "on ne peut pas prouver le contraire" |
| **TE-75** | Information hors contexte | Decontextualized info | `F_f` | — | Truncated quotes, missing context | "X a dit..." (out of context) |
| **TE-82** | Fausse équivalence | False equivalence | `F_f` | — | Inappropriate comparisons | "c'est comme le nazisme" |
| **TE-88** | Sophisme post hoc | Post hoc fallacy | `F_f` | — | Correlation → causation | "après X, donc à cause de X" |
| **TE-95** | Répétition | Repetition | `I_p` | — | Message hammering | (structural pattern) |

**Note**: Full 130+ technique mapping available in `docs/DIMA_Full_Mapping.csv` (to be created in M1).

---

## 5. Semantic Detection Architecture

### 5.1 Design Overview

**Goal**: Replace keyword/regex logic with **semantic similarity** and **contextual classification**.

**Architecture Diagram (ASCII)**:

```
┌────────────────────────────────────────────────────────────────┐
│                    USER INPUT (Multimodal)                     │
│  ┌──────────────┬──────────────────┬──────────────────────┐  │
│  │   Text       │     Video        │      Image           │  │
│  │   (direct)   │  (FFmpeg→Whisper)│  (Vision API→OCR)    │  │
│  └──────┬───────┴────────┬─────────┴──────────┬───────────┘  │
└─────────┼────────────────┼────────────────────┼───────────────┘
          │                │                    │
          ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│              UNIFIED TEXT STREAM (with modality tags)            │
│  "text": {content: "...", modality: "text"}                      │
│  "asr":  {content: "...", modality: "asr", timestamp: "0:15"}    │
│  "ocr":  {content: "...", modality: "ocr", bbox: [x,y,w,h]}     │
└────────────────────────┬────────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
┌─────────────────────┐     ┌─────────────────────────┐
│  GPT-4 Analyzer     │     │  DIMA Semantic Layer    │
│  (Current Pipeline) │     │  (New Module)           │
│  • Zero-shot prompt │     │  • Sentence-BERT embed  │
│  • JSON output      │     │  • Vector DB search     │
│  • 20+ techniques   │     │  • Zero-shot classifier │
└──────┬──────────────┘     └──────┬──────────────────┘
       │                           │
       │  {propaganda_score,       │  {detected_TE_codes: [
       │   conspiracy_score,       │    {code: "TE-58",
       │   techniques: [...],      │     confidence: 0.87,
       │   claims: [...]}          │     span: [12, 45],
       │                           │     modality: "asr",
       │                           │     evidence: "..."}
       │                           │   ]}
       │                           │
       └───────────┬───────────────┘
                   │
                   ▼
        ┌──────────────────────────┐
        │   FUSION ENGINE          │
        │  • Merge GPT-4 + DIMA    │
        │  • Calibrate confidence  │
        │  • Map TE → categories   │
        │  • Deduplicate           │
        └──────────┬───────────────┘
                   │
                   ▼
        ┌──────────────────────────────────┐
        │   ENRICHED JSON RESPONSE         │
        │  {                               │
        │    propaganda_score: 72,         │
        │    conspiracy_score: 45,         │
        │    misinfo_score: 38,            │
        │    overall_risk: 52,             │
        │    techniques: [                 │
        │      {name: "Appel à l'émotion", │
        │       dima_code: "TE-01",        │
        │       confidence: 0.89,          │
        │       modality: "text",          │
        │       severity: "high",          │
        │       evidence: "...",           │
        │       explanation: "..."}        │
        │    ],                            │
        │    dima_meta: {                  │
        │      framework_version: "2.1",   │
        │      detected_families: [...],   │
        │      risk_distribution: {...}    │
        │    }                             │
        │  }                               │
        └──────────────────────────────────┘
```

### 5.2 DIMA Semantic Layer Components

#### 5.2.1 Embedding-Based Similarity Search

**Approach**: Use **Sentence-BERT** (or OpenAI `text-embedding-3-small`) to compute semantic similarity between:
- **Input text windows** (sentences or paragraphs)
- **DIMA technique definitions** (pre-computed embeddings)

**Algorithm:**
```python
# Preprocessing: Embed all 130 DIMA technique definitions
dima_embeddings = {
    "TE-01": embed("Appel à l'émotion: Utilisation de mots chargés..."),
    "TE-02": embed("Peur/Menace: Invoquer des scénarios catastrophiques..."),
    # ...
}

# Runtime: Embed input text
input_text = "Ce gouvernement va nous mener à la ruine ! Réveillez-vous !"
input_embedding = embed(input_text)

# Compute cosine similarity
similarities = []
for te_code, te_emb in dima_embeddings.items():
    sim = cosine_similarity(input_embedding, te_emb)
    if sim > THRESHOLD:  # e.g., 0.70
        similarities.append({
            "code": te_code,
            "confidence": sim,
            "technique": DIMA_CATALOG[te_code]["name"]
        })

# Rank by confidence
detected_techniques = sorted(similarities, key=lambda x: x["confidence"], reverse=True)
```

**Vector Database** (Phase 2.2+):
- **ChromaDB** or **Pinecone** for fast similarity search
- Index: 130 DIMA techniques + 1000+ annotated examples
- Query: Top-K retrieval (K=5-10)

#### 5.2.2 Zero-Shot Classification

**Approach**: Use a **pre-trained NLI model** (e.g., `facebook/bart-large-mnli` or GPT-4 with structured output) for:
1. **Hypothesis**: "This text contains [DIMA technique name]."
2. **Premise**: Input text
3. **Output**: Entailment probability (0-1)

**Example:**
```python
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

text = "Les médias mainstream cachent la vérité !"
candidate_labels = [
    "Défiance envers les institutions",
    "Théorie du complot",
    "Appel à l'émotion",
    "Généralisation abusive"
]

result = classifier(text, candidate_labels, multi_label=True)
# Output: {"labels": [...], "scores": [0.89, 0.76, 0.45, 0.32]}

# Map back to DIMA codes
detected = [
    {"code": "TE-62", "confidence": 0.89, "name": "Défiance institutionnelle"},
    {"code": "TE-58", "confidence": 0.76, "name": "Théorie du complot"}
]
```

#### 5.2.3 Contextual Feature Extraction

**Linguistic Features** (enhance embeddings):
- **Negation detection**: "ne pas", "jamais" → Flip semantic polarity
- **Stance detection**: Pro/contra/neutral → Affects conspiracy/propaganda scores
- **Rhetorical questions**: "Qui oserait...?" → Often persuasive
- **Named entities**: Institutions, politicians → Context for discrediting techniques
- **Temporal markers**: "depuis toujours", "jamais vu" → Exaggeration cues

**Implementation:**
```python
def extract_contextual_features(text: str) -> Dict:
    features = {
        "has_negation": bool(re.search(r'\bne\s+\w+\s+pas\b', text)),
        "has_rhetorical_q": bool(re.search(r'\?\s*$', text.split('.')[0])),
        "named_entities": extract_entities(text),  # spaCy or Stanza
        "stance": detect_stance(text),  # Fine-tuned classifier
        "affect_score": compute_affect(text)  # Lexicon-based (NRC, LIWC)
    }
    return features
```

### 5.3 Multimodal Fusion

**Challenge**: Text, ASR, OCR may contain **complementary** or **contradictory** signals.

**Strategy**:
1. **Separate detection** per modality → Tag each detected technique with `modality` field
2. **Cross-modal validation**: If technique detected in both text + ASR → Higher confidence
3. **Conflict resolution**: If ASR says "complot" but OCR says "fact-check" → Lower confidence, flag inconsistency

**Example:**
```python
# Input from video analysis
modalities = {
    "asr": "Les médias mentent ! Ils cachent la vérité !",
    "ocr": "Fact-check: Aucune preuve de manipulation médiatique"
}

# Detect per modality
asr_detections = detect_dima(modalities["asr"])   # TE-58 (Complot), TE-62 (Défiance)
ocr_detections = detect_dima(modalities["ocr"])   # TE-35 (Ad hominem - contre médias)

# Cross-modal fusion
if "TE-58" in asr_detections and "TE-58" in ocr_detections:
    # Reinforce
    asr_detections["TE-58"]["confidence"] *= 1.2
else:
    # Conflict: ASR claims conspiracy, OCR fact-checks
    asr_detections["TE-58"]["confidence"] *= 0.7
    asr_detections["TE-58"]["confidence_note"] = "Contradicted by OCR"
```

---

## 6. Scoring & Fusion Model

### 6.1 Current GPT-4 Scoring

**Current Implementation** (`deep.py`, Lines 187-194):
```python
parsed.setdefault("propaganda_score", 0)      # 0-100
parsed.setdefault("conspiracy_score", 0)
parsed.setdefault("misinfo_score", 0)
parsed.setdefault("overall_risk", 0)
```

**Issues:**
- **Opaque**: GPT-4 black box (no explainable formula)
- **Uncalibrated**: Scores vary across runs (temperature=0 helps but not perfect)
- **No confidence intervals**: Single point estimate

### 6.2 DIMA-Enhanced Scoring

**New Scoring Pipeline:**

```
Step 1: GPT-4 Baseline Scores (Current)
  ├─ propaganda_score_gpt4: 65
  ├─ conspiracy_score_gpt4: 42
  └─ misinfo_score_gpt4: 38

Step 2: DIMA Semantic Detections
  ├─ Detected techniques: [TE-01, TE-22, TE-58, TE-62, TE-47]
  ├─ Confidence per technique: [0.89, 0.76, 0.82, 0.74, 0.68]
  └─ Mapped to categories via DIMA_WEIGHT_MAP

Step 3: Compute DIMA Scores
  I_p_dima = (0.89*0.8 + 0.76*0.6) * normalization_factor
  N_s_dima = (0.82*0.9 + 0.74*0.9) * normalization_factor
  F_f_dima = (0.76*0.4 + 0.68*0.7) * normalization_factor

Step 4: Fusion (Weighted Average)
  α_gpt4 = 0.5    # Weight for GPT-4 baseline
  α_dima = 0.5    # Weight for DIMA semantic

  I_p_final = α_gpt4 * propaganda_score_gpt4 + α_dima * I_p_dima
  N_s_final = α_gpt4 * conspiracy_score_gpt4 + α_dima * N_s_dima
  F_f_final = α_gpt4 * misinfo_score_gpt4 + α_dima * F_f_dima

  Φ_influence_final = (I_p_final + N_s_final + F_f_final) / 3
```

**Fusion Weights (Tunable Hyperparameters):**
```python
FUSION_WEIGHTS = {
    "phase_2.1": {"gpt4": 0.7, "dima": 0.3},  # Conservative start
    "phase_2.2": {"gpt4": 0.5, "dima": 0.5},  # Equal weight
    "phase_2.3": {"gpt4": 0.3, "dima": 0.7},  # Favor DIMA
    "phase_3.0": {"gpt4": 0.0, "dima": 1.0}   # Full DIMA (GPT-4 optional)
}
```

### 6.3 Normalization & Calibration

**Challenge**: DIMA scores (sum of confidences) ≠ GPT-4 scores (0-100 range).

**Normalization Strategy:**
```python
def normalize_dima_score(raw_score: float, max_techniques: int = 10) -> int:
    """
    Normalize DIMA raw score to [0, 100] range.
    
    Args:
        raw_score: Sum of (confidence * weight) for detected techniques
        max_techniques: Theoretical max number of techniques (ceiling)
    
    Returns:
        Normalized score in [0, 100]
    """
    # Assume max raw score = max_techniques * 1.0 (perfect confidence)
    normalized = (raw_score / max_techniques) * 100
    return int(min(100, max(0, normalized)))
```

**Calibration (Phase 2.2+):**
- Collect **ground truth annotations** (expert-labeled dataset)
- Compute **calibration curves** (predicted probabilities vs observed frequencies)
- Apply **Platt scaling** or **isotonic regression** to calibrate confidence scores

**Example:**
```python
from sklearn.calibration import CalibratedClassifierCV

# Pseudo-code
calibrated_model = CalibratedClassifierCV(dima_detector, method='sigmoid')
calibrated_model.fit(X_val, y_val)
calibrated_confidence = calibrated_model.predict_proba(X_test)
```

### 6.4 Confidence Intervals

**Goal**: Provide uncertainty estimates (e.g., "65 ± 8") instead of point estimates.

**Approach 1: Bootstrap Sampling**
```python
def compute_confidence_interval(detections: List[Dict], n_bootstrap: int = 100) -> Tuple[float, float]:
    """
    Compute 95% CI via bootstrap resampling of detected techniques.
    """
    scores = []
    for _ in range(n_bootstrap):
        sample = random.choices(detections, k=len(detections))
        score = sum(d["confidence"] * d["weight"] for d in sample)
        scores.append(normalize_dima_score(score))
    
    lower = np.percentile(scores, 2.5)
    upper = np.percentile(scores, 97.5)
    return (lower, upper)
```

**Approach 2: Bayesian Inference** (Phase 3+)
- Model technique presence as **latent binary variables**
- Use **Variational Inference** or **MCMC** to estimate posterior distributions
- Output: Mean score + credible intervals

---

## 7. Explainability Design

### 7.1 Requirements

**User-Facing Explainability:**
1. **Evidence span**: Exact text that triggered detection (character offsets)
2. **Technique name**: Plain-language name (French) + optional DIMA code for experts
3. **Confidence**: Numeric (0-100%) or qualitative (high/medium/low)
4. **Modality**: Icon/badge indicating source (📝 text, 🎤 audio, 🖼️ image)
5. **Rationale**: 2-3 sentence explanation (auto-generated or template-based)

**Research-Facing Explainability:**
6. **DIMA TE code**: Unique identifier (e.g., `TE-58`)
7. **Detection method**: "Embedding similarity (0.87)" or "Zero-shot NLI (0.76)"
8. **Feature attribution**: Which semantic features contributed most (LIME/SHAP)
9. **Cross-modal evidence**: If detected in multiple modalities, show all spans

### 7.2 JSON Schema

**Internal Representation** (Backend → Frontend):
```json
{
  "propaganda_score": 72,
  "conspiracy_score": 45,
  "misinfo_score": 38,
  "overall_risk": 52,
  "techniques": [
    {
      "name": "Appel à l'émotion",
      "dima_code": "TE-01",
      "dima_family": "Émotion",
      "confidence": 0.89,
      "confidence_label": "high",
      "severity": "high",
      "evidence": "Ce gouvernement va nous mener à la ruine !",
      "evidence_span": [0, 47],
      "modality": "text",
      "explanation": "Utilisation de langage catastrophiste ('ruine') et d'exclamation pour susciter une réaction émotionnelle immédiate chez l'audience.",
      "detection_method": "embedding_similarity",
      "detection_score": 0.87,
      "feature_attribution": {
        "affect_score": 0.92,
        "urgency_markers": true,
        "catastrophism": 0.85
      }
    },
    {
      "name": "Théorie du complot",
      "dima_code": "TE-58",
      "dima_family": "Discrédit",
      "confidence": 0.82,
      "confidence_label": "high",
      "severity": "high",
      "evidence": "Ils cachent la vérité !",
      "evidence_span": [48, 72],
      "modality": "asr",
      "timestamp": "0:15-0:18",
      "explanation": "Invocation d'une 'vérité cachée' par un groupe indéfini ('ils'), marqueur typique de rhétorique conspirationniste.",
      "detection_method": "zero_shot_nli",
      "detection_score": 0.82,
      "feature_attribution": {
        "hidden_truth_lexicon": 0.91,
        "institutional_distrust": 0.76
      }
    }
  ],
  "dima_meta": {
    "framework_version": "2.1.0",
    "total_techniques_detected": 5,
    "detected_families": ["Émotion", "Discrédit", "Simplification"],
    "risk_distribution": {
      "critical": 0,
      "high": 3,
      "medium": 2,
      "low": 0
    },
    "cross_modal_detections": [
      {
        "technique": "TE-62",
        "detected_in": ["text", "asr"],
        "confidence_boost": 1.15
      }
    ]
  }
}
```

### 7.3 Frontend Display Enhancements

**ReportDeep.jsx Updates:**

```jsx
// Current (v1.0.0)
<div>{t.name}</div>
<span>{t.severity}</span>
<div>« {t.evidence} »</div>
<div>{t.explanation}</div>

// Enhanced (v2.0.0 with DIMA)
<div>
  <span>{t.name}</span>
  {t.dima_code && (
    <span className="text-xs text-gray-500 ml-2">
      ({t.dima_code})
    </span>
  )}
  {t.modality && (
    <span className="ml-2">
      {t.modality === 'text' && '📝'}
      {t.modality === 'asr' && '🎤'}
      {t.modality === 'ocr' && '🖼️'}
    </span>
  )}
</div>

<div className="flex items-center gap-2">
  <span className="badge">{t.severity}</span>
  <span className="text-sm text-gray-400">
    Confiance: {Math.round(t.confidence * 100)}%
  </span>
</div>

<div className="evidence">« {t.evidence} »</div>
<div className="explanation">{t.explanation}</div>

{/* Expert mode toggle */}
{expertMode && (
  <div className="mt-2 text-xs text-gray-600">
    <div>Famille DIMA: {t.dima_family}</div>
    <div>Méthode: {t.detection_method}</div>
    <div>Score brut: {t.detection_score.toFixed(3)}</div>
  </div>
)}
```

### 7.4 Rationale Generation

**Option 1: Template-Based**
```python
EXPLANATION_TEMPLATES = {
    "TE-01": "Utilisation de langage {affect_type} ('{evidence}') pour susciter une réaction émotionnelle {emotion_type}.",
    "TE-58": "Invocation d'une 'vérité cachée' par {agent}, marqueur de rhétorique conspirationniste.",
    "TE-62": "Défiance envers {institution}, typique du discours anti-establishment.",
    # ...
}

def generate_rationale(technique: str, evidence: str, features: Dict) -> str:
    template = EXPLANATION_TEMPLATES[technique]
    return template.format(**features, evidence=evidence)
```

**Option 2: LLM-Generated** (GPT-4 with constrained output)
```python
def generate_rationale_llm(technique: str, evidence: str) -> str:
    prompt = f"""
    Technique détectée: {technique}
    Preuve: « {evidence} »
    
    Génère une explication en 2-3 phrases pour un public éduqué, expliquant:
    1. Quel mécanisme persuasif est utilisé
    2. Quel effet est recherché sur l'audience
    """
    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=150,
        temperature=0.3
    )
    return response.choices[0].message.content
```

---

## 8. Public Accessibility Layer

### 8.1 Transformation Strategy

**Challenge**: DIMA uses **expert terminology** (TE codes, academic names); InfoVerif targets **general public** (educators, journalists, citizens).

**Solution**: **Two-Tier Output**
1. **Public API** (default): Plain-language, educational labels
2. **Research API** (opt-in): Full DIMA codes, academic terminology

**Mapping Example:**

| DIMA Code | DIMA Name (Expert) | Public Label (Accessible) | Icon |
|-----------|-------------------|---------------------------|------|
| `TE-01` | Appel à l'émotion | Manipulation émotionnelle | 😡 |
| `TE-02` | Peur / Menace | Langage alarmiste | ⚠️ |
| `TE-22` | Faux dilemme | Pensée binaire simpliste | ⚖️ |
| `TE-35` | Ad hominem | Attaque personnelle | 🎯 |
| `TE-58` | Théorie du complot | Narratif complotiste | 🕵️ |
| `TE-62` | Défiance institutionnelle | Discrédit des institutions | 🏛️ |

### 8.2 Score Labels

**Current Implementation** (v1.0.0):
```jsx
{[
  ['Indice d\'influence', scores.overall],
  ['Intensité persuasive', scores.propaganda],
  ['Narratif spéculatif', scores.conspiracy],
  ['Fiabilité factuelle', scores.misinfo]
]}
```

**Enhanced with DIMA Interpretation:**
```jsx
{[
  {
    label: 'Indice d\'influence',
    score: scores.overall,
    interpretation: getInterpretation(scores.overall),
    color: getColor(scores.overall)
  },
  // ...
]}

function getInterpretation(score: number): string {
  if (score >= 75) return "Très élevé — Contenu hautement manipulatoire"
  if (score >= 50) return "Élevé — Présence significative de techniques persuasives"
  if (score >= 25) return "Modéré — Quelques éléments de persuasion détectés"
  return "Faible — Peu ou pas de manipulation détectée"
}

function getColor(score: number): string {
  if (score >= 75) return "text-red-500"
  if (score >= 50) return "text-orange-500"
  if (score >= 25) return "text-yellow-500"
  return "text-green-500"
}
```

### 8.3 Suggested UI Texts

**Score Thresholds & Messages:**

| Score Range | Label | Color | Description (Public) |
|-------------|-------|-------|----------------------|
| 0-24 | Faible | 🟢 Green | "Ce contenu présente peu de signes de manipulation. Les affirmations semblent majoritairement sourcées et équilibrées." |
| 25-49 | Modéré | 🟡 Yellow | "Ce contenu contient quelques techniques de persuasion. Approche critique recommandée." |
| 50-74 | Élevé | 🟠 Orange | "Ce contenu utilise plusieurs techniques manipulatoires. Vérifiez les sources et le contexte avant de partager." |
| 75-100 | Très élevé | 🔴 Red | "Ce contenu présente de nombreuses caractéristiques de propagande ou désinformation. Extrême prudence recommandée." |

**Technique Severity Badges:**

| Severity (DIMA) | Public Label | Color | Icon |
|-----------------|--------------|-------|------|
| `critical` | Critique | Red | 🚨 |
| `high` | Élevé | Orange | ⚠️ |
| `medium` | Moyen | Yellow | ⚡ |
| `low` | Faible | Gray | ℹ️ |

### 8.4 Educational Context

**For each detected technique, provide:**

1. **Short definition** (1 sentence)
   ```
   "Appel à l'émotion : Utilisation de langage chargé pour provoquer une réaction émotionnelle immédiate plutôt qu'une réflexion rationnelle."
   ```

2. **Example** (generic, not from analyzed content)
   ```
   "Exemple : 'Ce gouvernement va détruire notre pays !' (catastrophisme sans nuance)"
   ```

3. **Counter-strategy** (how to resist)
   ```
   "Pour résister : Identifiez les mots chargés, demandez-vous si le propos serait aussi convaincant formulé de manière neutre."
   ```

**Implementation:**
```python
EDUCATIONAL_CONTENT = {
    "TE-01": {
        "definition": "Utilisation de langage chargé pour provoquer une réaction émotionnelle...",
        "example": "Exemple : 'Ce gouvernement va détruire notre pays !'",
        "counter": "Pour résister : Identifiez les mots chargés..."
    },
    # ...
}

# Include in API response
technique["educational_note"] = EDUCATIONAL_CONTENT[technique["dima_code"]]
```

---

## 9. Data Schemas

### 9.1 Backend Internal Schema

**`dima.py` Module Output:**

```python
from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class DIMADetection(BaseModel):
    """Single DIMA technique detection."""
    code: str = Field(..., description="DIMA TE code (e.g., TE-01)")
    name: str = Field(..., description="Technique name in French")
    family: str = Field(..., description="DIMA family (Émotion, Simplification, etc.)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence [0-1]")
    confidence_label: str = Field(..., description="high/medium/low")
    severity: str = Field(..., description="critical/high/medium/low")
    evidence: str = Field(..., description="Exact text span that triggered detection")
    evidence_span: List[int] = Field(..., description="[start_char, end_char]")
    modality: str = Field(..., description="text/asr/ocr")
    timestamp: Optional[str] = Field(None, description="For ASR: 'MM:SS-MM:SS'")
    bbox: Optional[List[int]] = Field(None, description="For OCR: [x, y, w, h]")
    explanation: str = Field(..., description="2-3 sentence rationale")
    detection_method: str = Field(..., description="embedding_similarity/zero_shot_nli/hybrid")
    detection_score: float = Field(..., description="Raw detection score")
    feature_attribution: Dict[str, float] = Field(default_factory=dict)

class DIMAAnalysisResult(BaseModel):
    """Complete DIMA analysis output."""
    detections: List[DIMADetection]
    scores: Dict[str, float] = Field(..., description="I_p, N_s, F_f from DIMA")
    meta: Dict = Field(default_factory=dict, description="Framework version, stats, etc.")
```

### 9.2 Unified API Response Schema

**Backward-Compatible with v1.0.0 + DIMA Enrichment:**

```json
{
  "success": true,
  "version": "2.0.0-dima",
  
  "input": {
    "platform": "text",
    "title": "Submitted text",
    "description": "...",
    "modalities": ["text"]
  },
  
  "scores": {
    "propaganda_score": 72,
    "conspiracy_score": 45,
    "misinfo_score": 38,
    "overall_risk": 52,
    "confidence_intervals": {
      "propaganda_score": [65, 79],
      "conspiracy_score": [38, 52],
      "misinfo_score": [31, 45],
      "overall_risk": [45, 59]
    },
    "interpretation": {
      "overall": "Élevé — Présence significative de techniques persuasives",
      "propaganda": "Élevé",
      "conspiracy": "Modéré",
      "misinfo": "Modéré"
    }
  },
  
  "techniques": [
    {
      "name": "Manipulation émotionnelle",
      "dima_code": "TE-01",
      "dima_family": "Émotion",
      "public_label": "Manipulation émotionnelle",
      "icon": "😡",
      "confidence": 0.89,
      "confidence_label": "high",
      "severity": "high",
      "evidence": "Ce gouvernement va nous mener à la ruine !",
      "evidence_span": [0, 47],
      "modality": "text",
      "explanation": "Utilisation de langage catastrophiste ('ruine') et d'exclamation pour susciter une réaction émotionnelle immédiate.",
      "educational_note": {
        "definition": "Utilisation de langage chargé pour provoquer une réaction émotionnelle...",
        "example": "Exemple : 'Ce gouvernement va détruire notre pays !'",
        "counter": "Pour résister : Identifiez les mots chargés..."
      },
      "detection_method": "embedding_similarity",
      "detection_score": 0.87
    }
  ],
  
  "claims": [
    {
      "claim": "Ce gouvernement va nous mener à la ruine",
      "confidence": "unsupported",
      "issues": ["Affirmation non sourcée", "Langage catastrophiste"],
      "reasoning": "Prédiction catastrophique sans données factuelles ni sources pour la soutenir."
    }
  ],
  
  "summary": "Ce contenu présente un niveau élevé de techniques persuasives, notamment via un langage émotionnel et catastrophiste. Plusieurs affirmations manquent de sources vérifiables.",
  
  "dima_meta": {
    "framework_version": "2.1.0",
    "total_techniques_detected": 5,
    "detected_families": ["Émotion", "Discrédit", "Simplification"],
    "risk_distribution": {"critical": 0, "high": 3, "medium": 2, "low": 0},
    "cross_modal_detections": [],
    "execution_time_ms": 1243
  }
}
```

### 9.3 Configuration Schema

**`dima_config.yaml`** (for tuning):

```yaml
dima:
  version: "2.1.0"
  
  detection:
    embedding_model: "sentence-transformers/all-mpnet-base-v2"
    similarity_threshold: 0.70
    zero_shot_model: "facebook/bart-large-mnli"
    zero_shot_threshold: 0.65
    use_vector_db: false  # Phase 2.2+
    
  scoring:
    normalization_max_techniques: 10
    fusion_weights:
      gpt4: 0.5
      dima: 0.5
    calibration_enabled: false  # Phase 2.2+
    
  explainability:
    include_dima_codes: true
    include_feature_attribution: false  # Phase 2.2+ (LIME/SHAP)
    include_educational_notes: true
    
  output:
    public_api_mode: true  # If false, return raw DIMA codes
    confidence_intervals: true
    expert_mode_available: true
```

---

## 10. Implementation Milestones

### M1: Repository Analysis & Alignment Table (2 weeks)

**Objectives:**
- Complete reconnaissance of InfoVerif codebase
- Map all 130 DIMA techniques to InfoVerif categories
- Create reference datasets

**Deliverables:**
- `docs/DIMA_Full_Mapping.csv` (130 rows: TE code, FR name, EN name, InfoVerif primary, secondary, weights, semantic features)
- `docs/DIMA_Taxonomy_Tree.json` (hierarchical structure)
- `data/dima_examples/` (10-20 annotated examples per technique for testing)

**Acceptance Criteria:**
- [ ] 100% of DIMA techniques mapped to at least one InfoVerif category
- [ ] Mapping validated by 2+ domain experts
- [ ] CSV ingested into Python dict for runtime use

---

### M2: Detector Design — Semantic Features & Signals (4 weeks)

**Objectives:**
- Implement embedding-based similarity search
- Implement zero-shot classification
- Extract contextual features (negation, stance, affect)

**Deliverables:**
- `api/dima_semantic.py` (core detection module)
- `api/embeddings.py` (Sentence-BERT or OpenAI embeddings)
- `api/features.py` (contextual feature extractors)
- Unit tests: `tests/test_dima_detection.py`

**Technical Tasks:**
1. **Embedding Layer:**
   ```python
   # api/embeddings.py
   from sentence_transformers import SentenceTransformer
   
   model = SentenceTransformer('sentence-transformers/all-mpnet-base-v2')
   
   def embed_text(text: str) -> np.ndarray:
       return model.encode(text, convert_to_numpy=True)
   
   # Precompute DIMA technique embeddings
   dima_embeddings = {
       te_code: embed_text(definition)
       for te_code, definition in DIMA_DEFINITIONS.items()
   }
   ```

2. **Zero-Shot Classifier:**
   ```python
   # api/dima_semantic.py
   from transformers import pipeline
   
   classifier = pipeline("zero-shot-classification", 
                         model="facebook/bart-large-mnli")
   
   def detect_techniques_zero_shot(text: str, 
                                    candidate_techniques: List[str]) -> List[Dict]:
       result = classifier(text, candidate_techniques, multi_label=True)
       return [
           {"technique": label, "confidence": score}
           for label, score in zip(result["labels"], result["scores"])
           if score > THRESHOLD
       ]
   ```

3. **Feature Extraction:**
   ```python
   # api/features.py
   import spacy
   from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
   
   nlp = spacy.load("fr_core_news_md")
   sentiment_analyzer = SentimentIntensityAnalyzer()
   
   def extract_features(text: str) -> Dict:
       doc = nlp(text)
       return {
           "has_negation": any(token.dep_ == "neg" for token in doc),
           "named_entities": [(ent.text, ent.label_) for ent in doc.ents],
           "affect_score": sentiment_analyzer.polarity_scores(text)["compound"],
           "has_rhetorical_question": "?" in text and text.strip().endswith("?"),
           # ...
       }
   ```

**Acceptance Criteria:**
- [ ] Embedding similarity achieves >0.75 precision on validation set (20 examples per technique)
- [ ] Zero-shot classifier achieves >0.70 F1 on validation set
- [ ] Feature extraction runs in <100ms per text

---

### M3: Scoring & Fusion Model (3 weeks)

**Objectives:**
- Implement DIMA → InfoVerif score aggregation
- Implement GPT-4 ↔ DIMA fusion
- Add confidence intervals

**Deliverables:**
- `api/scoring.py` (scoring logic)
- `api/fusion.py` (GPT-4 + DIMA merger)
- Configuration: `dima_config.yaml`
- Unit tests: `tests/test_scoring.py`

**Technical Tasks:**
1. **Score Aggregation:**
   ```python
   # api/scoring.py
   def compute_dima_scores(detections: List[DIMADetection], 
                           weight_map: Dict[str, Dict[str, float]]) -> Dict[str, float]:
       I_p_raw = sum(
           d.confidence * weight_map[d.code]["I_p"] 
           for d in detections if d.code in weight_map
       )
       N_s_raw = sum(...)
       F_f_raw = sum(...)
       
       return {
           "I_p": normalize_score(I_p_raw),
           "N_s": normalize_score(N_s_raw),
           "F_f": normalize_score(F_f_raw)
       }
   ```

2. **Fusion:**
   ```python
   # api/fusion.py
   def fuse_scores(gpt4_scores: Dict, 
                   dima_scores: Dict,
                   weights: Dict = {"gpt4": 0.5, "dima": 0.5}) -> Dict:
       return {
           "propaganda_score": int(
               weights["gpt4"] * gpt4_scores["propaganda_score"] +
               weights["dima"] * dima_scores["I_p"]
           ),
           "conspiracy_score": int(...),
           "misinfo_score": int(...),
           "overall_risk": int(...)
       }
   ```

3. **Confidence Intervals:**
   ```python
   def compute_confidence_intervals(detections: List, n_bootstrap: int = 100):
       # Bootstrap sampling
       ...
   ```

**Acceptance Criteria:**
- [ ] Fused scores match GPT-4 within ±10 points on validation set
- [ ] Confidence intervals cover true score 95% of the time (calibration test)
- [ ] Fusion weights tunable via config file

---

### M4: Explainability Schema & UI Mapping (3 weeks)

**Objectives:**
- Implement evidence span extraction
- Generate plain-language rationales
- Update frontend to display DIMA-enriched results

**Deliverables:**
- `api/explainability.py` (rationale generation)
- `web/src/pages/ReportDeep.jsx` (updated UI)
- `web/src/components/TechniqueCard.jsx` (new component for DIMA techniques)
- Educational content: `api/educational_content.json`

**Technical Tasks:**
1. **Evidence Span Extraction:**
   ```python
   # api/explainability.py
   def extract_evidence_span(text: str, technique_keywords: List[str]) -> Tuple[str, List[int]]:
       # Use regex or NER to find relevant span
       ...
   ```

2. **Rationale Generation:**
   ```python
   def generate_rationale(technique: str, evidence: str, features: Dict) -> str:
       template = EXPLANATION_TEMPLATES[technique]
       return template.format(evidence=evidence, **features)
   ```

3. **Frontend Updates:**
   ```jsx
   // web/src/components/TechniqueCard.jsx
   export default function TechniqueCard({ technique, expertMode }) {
     return (
       <div className="technique-card">
         <div className="header">
           <span>{technique.public_label}</span>
           {technique.icon && <span>{technique.icon}</span>}
           {expertMode && <span className="code">({technique.dima_code})</span>}
         </div>
         <div className="confidence">
           Confiance: {Math.round(technique.confidence * 100)}%
         </div>
         <div className="evidence">« {technique.evidence} »</div>
         <div className="explanation">{technique.explanation}</div>
         {technique.educational_note && (
           <details>
             <summary>En savoir plus</summary>
             <p>{technique.educational_note.definition}</p>
             <p>{technique.educational_note.example}</p>
             <p>{technique.educational_note.counter}</p>
           </details>
         )}
       </div>
     )
   }
   ```

**Acceptance Criteria:**
- [ ] Evidence spans match human annotations >90% overlap (IoU)
- [ ] Rationales pass readability test (Flesch-Kincaid > 60)
- [ ] UI displays all DIMA fields without breaking existing layout

---

### M5: Evaluation & Calibration Plan (4 weeks)

**Objectives:**
- Collect ground truth dataset (expert annotations)
- Evaluate DIMA detector performance
- Calibrate confidence scores

**Deliverables:**
- `data/evaluation_dataset.csv` (200+ examples, expert-labeled)
- `notebooks/evaluation_analysis.ipynb` (Jupyter notebook with metrics)
- `api/calibration.py` (Platt scaling or isotonic regression)
- Evaluation report: `docs/DIMA_Evaluation_Report.md`

**Evaluation Metrics:**
1. **Technique Detection:**
   - Precision, Recall, F1 per technique
   - Macro-averaged F1 across all techniques
   - Confusion matrix (which techniques are confused)

2. **Score Accuracy:**
   - MAE (Mean Absolute Error) vs human scores
   - Spearman correlation (rank order)
   - Calibration curve (predicted probability vs observed frequency)

3. **Explainability:**
   - Evidence span IoU (Intersection over Union)
   - Rationale quality (human ratings: 1-5 scale)

**Calibration:**
```python
# api/calibration.py
from sklearn.calibration import CalibratedClassifierCV

# Pseudo-code
calibrated_detector = CalibratedClassifierCV(
    base_estimator=dima_detector,
    method='sigmoid',  # or 'isotonic'
    cv=5
)
calibrated_detector.fit(X_train, y_train)
```

**Acceptance Criteria:**
- [ ] Macro F1 > 0.75 on held-out test set
- [ ] Score MAE < 8 points vs human annotations
- [ ] Calibration error (ECE) < 0.10

---

## 11. Evaluation & Calibration

### 11.1 Validation Strategy

**Dataset Split:**
```
Total: 500 expert-annotated examples
├─ Train: 300 (60%) — For weight tuning, calibration
├─ Validation: 100 (20%) — For hyperparameter search
└─ Test: 100 (20%) — For final evaluation (never seen during dev)
```

**Annotation Protocol:**
- **3 expert annotators** per example (majority vote)
- **Cohen's Kappa** >0.70 (inter-annotator agreement)
- Annotate:
  1. Present DIMA techniques (binary: present/absent)
  2. Severity (low/medium/high)
  3. Evidence spans (character offsets)
  4. InfoVerif scores (I_p, N_s, F_f, Φ — 0-100)

### 11.2 Baseline Comparisons

**Benchmark Against:**
1. **GPT-4 (current)**: Zero-shot, prompt-based (v1.0.0)
2. **Keyword baseline**: Regex + lexicon matching
3. **Fine-tuned BERT**: Supervised classifier (if dataset available)

**Metrics:**
```python
# Example evaluation code
from sklearn.metrics import classification_report, confusion_matrix

y_true = load_ground_truth()
y_pred_gpt4 = run_gpt4_detector()
y_pred_dima = run_dima_detector()

print("GPT-4 Performance:")
print(classification_report(y_true, y_pred_gpt4))

print("DIMA Semantic Performance:")
print(classification_report(y_true, y_pred_dima))

# Score correlation
from scipy.stats import spearmanr
corr_gpt4 = spearmanr(y_true_scores, y_pred_gpt4_scores)
corr_dima = spearmanr(y_true_scores, y_pred_dima_scores)
```

### 11.3 Continuous Monitoring

**Post-Deployment:**
- **User feedback loop**: "Was this analysis accurate?" (thumbs up/down)
- **Expert review**: Sample 10% of analyses for manual review
- **Drift detection**: Monitor confidence distributions over time
- **Retraining trigger**: If F1 drops below 0.70, retrain with new data

---

## 12. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| **R1: DIMA taxonomy evolves** (M82 updates) | Medium | Medium | Version DIMA mappings; maintain backward compatibility |
| **R2: Embedding model drift** (OpenAI API changes) | Low | High | Pin model version; fallback to local Sentence-BERT |
| **R3: Low inter-annotator agreement** | Medium | High | Extensive annotator training; double-annotation + adjudication |
| **R4: DIMA detector underperforms GPT-4** | Medium | Medium | Hybrid approach: GPT-4 + DIMA fusion (not replacement) |
| **R5: Inference latency >2s** | Medium | Medium | Async processing; cache embeddings; optimize batch inference |
| **R6: False positives on satire/humor** | High | Medium | Add humor/satire classifier; contextual flags |
| **R7: Explainability too technical for users** | Medium | High | A/B test public labels; gather user feedback |
| **R8: DIMA codes leak in public API** | Low | Low | Strict schema validation; separate public/research endpoints |
| **R9: Multimodal fusion conflicts** | Medium | Medium | Confidence downweighting for contradictory signals; flag inconsistencies |
| **R10: Scalability (1000+ req/day)** | Medium | High | Vector DB (Pinecone); GPU inference; load balancing |

**Mitigation Details:**

**R1 (DIMA Evolution):**
- Maintain `dima_mapping_v2.1.csv`, `v2.2.csv`, etc.
- API response includes `"dima_framework_version": "2.1.0"`
- Clients can request specific version

**R3 (Low Agreement):**
- Provide annotators with detailed guidelines + examples
- Calibration session: Annotate 20 examples together, discuss discrepancies
- Use Delphi method for contentious cases

**R5 (Latency):**
```python
# Async detection
import asyncio

async def analyze_async(text: str):
    gpt4_task = asyncio.create_task(analyze_with_gpt4(text))
    dima_task = asyncio.create_task(detect_dima(text))
    gpt4_result, dima_result = await asyncio.gather(gpt4_task, dima_task)
    return fuse_results(gpt4_result, dima_result)
```

**R6 (Satire False Positives):**
- Add satire/irony detector (e.g., fine-tuned RoBERTa on Reddit sarcasm dataset)
- If satire detected → Flag in UI: "⚠️ Possible satire/irony detected. Scores may be inflated."

---

## 13. Next Steps

### Immediate Actions (Week 1-2)

**For Development Team:**
1. ✅ **Review this RFC** — Gather feedback from:
   - Technical team (feasibility, timelines)
   - Domain experts (DIMA mapping accuracy)
   - UX designers (public accessibility layer)

2. ✅ **Validate DIMA mapping** — Cross-reference with M82 official documentation
   - Request collaboration with M82 Project (if possible)
   - Verify all 130 techniques are covered

3. ✅ **Set up annotation infrastructure**
   - Tools: Label Studio, Prodigy, or custom annotation UI
   - Recruit 3-5 expert annotators (researchers, fact-checkers)

4. ✅ **Prototype M1 deliverables**
   - Start with 20 high-priority DIMA techniques (most common in wild)
   - Create initial `DIMA_Full_Mapping.csv`

**For Research Team:**
5. ✅ **Literature review** — Survey existing DIMA research:
   - M82 Project publications
   - Papers using DIMA framework (if any)
   - Compare with other taxonomies (PropOrNot, IPA, etc.)

6. ✅ **Define success criteria** — Quantitative thresholds:
   - Minimum F1: 0.75
   - Maximum MAE: 8 points
   - User satisfaction: >4/5 stars (post-launch survey)

### Sprint Planning (Q2 2026)

| Sprint | Duration | Milestone | Team |
|--------|----------|-----------|------|
| S1 | Weeks 1-2 | M1: Mapping Table | Research + Domain Experts |
| S2 | Weeks 3-6 | M2: Detector (Embeddings) | Backend Engineers |
| S3 | Weeks 7-10 | M2: Detector (Zero-Shot + Features) | Backend Engineers + ML Engineers |
| S4 | Weeks 11-13 | M3: Scoring & Fusion | Backend Engineers |
| S5 | Weeks 14-16 | M4: Explainability + UI | Full-Stack + Frontend |
| S6 | Weeks 17-20 | M5: Evaluation & Calibration | Research + QA |
| S7 | Weeks 21-22 | Integration Testing & Docs | All Hands |
| S8 | Week 23-24 | Beta Launch + Monitoring | DevOps + Support |

### Success Metrics (Post-Launch)

**Technical:**
- Technique detection F1 > 0.75
- Score MAE < 8 vs human annotations
- Inference latency < 2s (95th percentile)
- 99.9% uptime

**User-Facing:**
- User satisfaction > 4/5 stars
- <5% "inaccurate analysis" flags
- 20% increase in technique understanding (pre/post survey)

**Research Impact:**
- 2+ academic papers using InfoVerif + DIMA
- Collaboration with M82 Project formalized
- Dataset published for research community

---

## Appendices

### Appendix A: Full DIMA Mapping Table

**Note**: Full 130-technique mapping to be completed in M1. Sample provided above.

**Format**: `docs/DIMA_Full_Mapping.csv`

```csv
dima_code,technique_name_fr,technique_name_en,dima_family,infoverif_primary,infoverif_secondary,weight_I_p,weight_N_s,weight_F_f,semantic_features,example_keywords
TE-01,Appel à l'émotion,Emotional appeal,Émotion,I_p,,0.8,0.0,0.2,"Affect lexicon, urgency markers","choquant,terrifiant,urgent"
TE-02,Peur / Menace,Fear / Threat,Émotion,I_p,,0.9,0.0,0.1,"Threat language, doom scenarios","danger,risque,si tu ne"
...
```

### Appendix B: Semantic Feature Extractors

**Detailed implementation of linguistic feature extraction (for `api/features.py`):**

```python
import re
import spacy
from collections import Counter
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

nlp = spacy.load("fr_core_news_md")
sentiment_analyzer = SentimentIntensityAnalyzer()

# Lexicons (simplified; expand in production)
AFFECT_LEXICON = {
    "peur": 0.9,
    "terrifiant": 0.95,
    "choquant": 0.85,
    "scandaleux": 0.88,
    # ...
}

URGENCY_MARKERS = ["urgent", "immédiat", "maintenant", "vite", "rapidement"]
CATASTROPHISM_WORDS = ["ruine", "désastre", "catastrophe", "fin", "destruction"]

def extract_features(text: str) -> Dict[str, Any]:
    """Extract semantic and linguistic features from text."""
    doc = nlp(text)
    
    # Basic stats
    features = {
        "text_length": len(text),
        "sentence_count": len(list(doc.sents)),
        "word_count": len([token for token in doc if token.is_alpha]),
    }
    
    # Sentiment
    sentiment = sentiment_analyzer.polarity_scores(text)
    features["affect_score"] = sentiment["compound"]
    features["sentiment_polarity"] = "positive" if sentiment["compound"] > 0.05 else "negative" if sentiment["compound"] < -0.05 else "neutral"
    
    # Affect lexicon
    words = [token.text.lower() for token in doc if token.is_alpha]
    affect_matches = [AFFECT_LEXICON.get(word, 0) for word in words]
    features["affect_lexicon_score"] = max(affect_matches) if affect_matches else 0
    
    # Urgency markers
    features["has_urgency"] = any(marker in text.lower() for marker in URGENCY_MARKERS)
    features["urgency_count"] = sum(1 for marker in URGENCY_MARKERS if marker in text.lower())
    
    # Catastrophism
    features["has_catastrophism"] = any(word in text.lower() for word in CATASTROPHISM_WORDS)
    features["catastrophism_score"] = sum(1 for word in CATASTROPHISM_WORDS if word in text.lower()) / len(words) if words else 0
    
    # Negation
    features["has_negation"] = any(token.dep_ == "neg" for token in doc)
    features["negation_count"] = sum(1 for token in doc if token.dep_ == "neg")
    
    # Rhetorical questions
    features["has_rhetorical_question"] = "?" in text and text.strip().endswith("?")
    features["question_count"] = text.count("?")
    
    # Named entities
    entities = [(ent.text, ent.label_) for ent in doc.ents]
    features["named_entities"] = entities
    features["entity_types"] = list(set(ent[1] for ent in entities))
    features["has_person"] = any(ent[1] == "PER" for ent in entities)
    features["has_organization"] = any(ent[1] == "ORG" for ent in entities)
    
    # Exclamation marks
    features["exclamation_count"] = text.count("!")
    features["has_exclamation"] = "!" in text
    
    # Uppercase words (shouting)
    uppercase_words = [token.text for token in doc if token.is_alpha and token.text.isupper() and len(token.text) > 2]
    features["uppercase_word_count"] = len(uppercase_words)
    features["has_shouting"] = len(uppercase_words) > 0
    
    # Binary framing ("eux vs nous")
    features["has_binary_framing"] = bool(re.search(r'\b(eux|nous|les autres|notre peuple)\b', text.lower()))
    
    return features
```

### Appendix C: Example Detection Output

**Input Text:**
```
"Les médias mainstream cachent la vérité ! Ils ne veulent pas que vous sachiez ce qui se passe réellement. Ce gouvernement corrompu va nous mener à la ruine. Réveillez-vous avant qu'il ne soit trop tard !"
```

**DIMA Detection Output:**
```json
{
  "detections": [
    {
      "code": "TE-62",
      "name": "Défiance institutionnelle",
      "family": "Discrédit",
      "confidence": 0.91,
      "confidence_label": "high",
      "severity": "high",
      "evidence": "Les médias mainstream cachent la vérité !",
      "evidence_span": [0, 45],
      "modality": "text",
      "explanation": "Expression explicite de méfiance envers les médias établis ('mainstream'), accusés de dissimuler des informations.",
      "detection_method": "embedding_similarity",
      "detection_score": 0.89,
      "feature_attribution": {
        "institutional_distrust": 0.94,
        "mainstream_keyword": 1.0
      }
    },
    {
      "code": "TE-58",
      "name": "Théorie du complot",
      "family": "Discrédit",
      "confidence": 0.87,
      "confidence_label": "high",
      "severity": "high",
      "evidence": "Ils ne veulent pas que vous sachiez ce qui se passe réellement.",
      "evidence_span": [46, 108],
      "modality": "text",
      "explanation": "Rhétorique conspirationniste typique ('ils ne veulent pas que vous sachiez'), impliquant une dissimulation intentionnelle par un groupe non défini.",
      "detection_method": "zero_shot_nli",
      "detection_score": 0.87,
      "feature_attribution": {
        "hidden_truth_lexicon": 0.92,
        "they_pronoun": 0.85
      }
    },
    {
      "code": "TE-01",
      "name": "Appel à l'émotion",
      "family": "Émotion",
      "confidence": 0.89,
      "confidence_label": "high",
      "severity": "high",
      "evidence": "Ce gouvernement corrompu va nous mener à la ruine.",
      "evidence_span": [109, 160],
      "modality": "text",
      "explanation": "Langage catastrophiste ('ruine') et chargé ('corrompu') visant à provoquer une réaction émotionnelle de peur et d'indignation.",
      "detection_method": "embedding_similarity",
      "detection_score": 0.88,
      "feature_attribution": {
        "affect_score": 0.92,
        "catastrophism": 0.91,
        "negative_framing": 0.87
      }
    },
    {
      "code": "TE-02",
      "name": "Peur / Menace",
      "family": "Émotion",
      "confidence": 0.82,
      "confidence_label": "high",
      "severity": "high",
      "evidence": "Réveillez-vous avant qu'il ne soit trop tard !",
      "evidence_span": [161, 207],
      "modality": "text",
      "explanation": "Création d'un sentiment d'urgence ('trop tard') et appel à l'action immédiate ('réveillez-vous'), techniques classiques pour susciter la peur.",
      "detection_method": "embedding_similarity",
      "detection_score": 0.81,
      "feature_attribution": {
        "urgency_markers": 0.88,
        "exclamation": 0.75
      }
    }
  ],
  "scores": {
    "I_p": 78,
    "N_s": 67,
    "F_f": 45
  },
  "meta": {
    "total_techniques_detected": 4,
    "detected_families": ["Discrédit", "Émotion"],
    "execution_time_ms": 342
  }
}
```

---

## Conclusion

This RFC proposes a **research-grade integration** of the DIMA framework into InfoVerif.org's semantic multimodal architecture. By replacing ad-hoc keyword detection with **embedding-based similarity, zero-shot classification, and structured taxonomic mapping**, we aim to:

1. **Enhance accuracy**: Semantic understanding > literal pattern matching
2. **Enable interoperability**: DIMA TE codes → comparable with academic research
3. **Improve explainability**: Evidence spans + confidence + modality attribution
4. **Maintain accessibility**: Plain-language labels for public; expert codes for researchers

**Key Innovation**: **Hybrid approach** (GPT-4 + DIMA fusion) preserves InfoVerif's rapid prototyping advantage while adding structured rigor.

**Timeline**: Q2 2026 (24 weeks) — Phased rollout from M1 (mapping) to M5 (calibration).

**Next Steps**: Review, validate DIMA mapping, launch M1 annotation sprint.

---

**For questions or feedback, contact:**  
**Civic Tech AI Lab — GenerativSchool.com**  
**Email**: contact@generativschool.com  
**GitHub**: [github.com/GenerativSchool-Lab/infoverif.org](https://github.com/GenerativSchool-Lab/infoverif.org)

---

**End of RFC Draft v1.0**

