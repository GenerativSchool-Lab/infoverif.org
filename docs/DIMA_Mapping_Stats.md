# DIMA Mapping Statistics

**Generated**: Automated analysis of DIMA_Full_Mapping.csv  
**Total Techniques**: 130

---

## 📊 Distribution by DIMA Family

| Family | Count | % of Total |
|--------|-------|------------|
| Rhétorique | 40 | 30.8% |
| Simplification | 20 | 15.4% |
| Discrédit | 20 | 15.4% |
| Diversion | 20 | 15.4% |
| Décontextualisation | 20 | 15.4% |
| Émotion | 10 | 7.7% |

**Total Families**: 6

---

## 🎯 Distribution by InfoVerif Primary Category

| Category | Description | Count | % of Total |
|----------|-------------|-------|------------|
| **I_p** | Intensité persuasive | 67 | 51.5% |
| **N_s** | Narratif spéculatif | 6 | 4.6% |
| **F_f** | Fiabilité factuelle | 57 | 43.8% |

### Interpretation
- **I_p dominance**: 67/130 techniques primarily target emotional/persuasive manipulation
- **N_s niche**: 6/130 techniques signal conspiratorial/speculative narratives
- **F_f balance**: 57/130 techniques involve logical fallacies and factual distortion

---

## 🔄 Many-to-Many Mapping Analysis

**Techniques with secondary categories**: 3 / 130 (2.3%)

| Secondary Category | Count |
|--------------------|-------|
| I_p | 23 |
| N_s | 14 |
| F_f | 25 |

This reflects the **overlapping nature** of manipulation techniques across semantic categories.

---

## ⚖️ Weight Distribution Analysis

### High-Weight Techniques (≥ 0.7)

| Category | High-Weight Count | Description |
|----------|-------------------|-------------|
| **I_p** | 28 | Strong persuasive/emotional markers |
| **N_s** | 4 | Strong conspiratorial signals |
| **F_f** | 47 | Strong factual distortion |

### Average Weights Across All Techniques

| Category | Mean Weight | Std Dev |
|----------|-------------|---------|
| I_p | 0.393 | 0.278 |
| N_s | 0.082 | 0.174 |
| F_f | 0.525 | 0.286 |

---

## 🔍 Top 10 Techniques by Category

### Most Persuasive (Highest I_p weight)

| Code | Technique | I_p Weight |
|------|-----------|------------|
| TE-02 | Peur / Menace | 0.90 |
| TE-130 | Déshumanisation | 0.90 |
| TE-03 | Indignation / Colère | 0.85 |
| TE-08 | Langage chargé | 0.85 |
| TE-01 | Appel à l'émotion | 0.80 |
| TE-06 | Dégoût / Mépris | 0.80 |
| TE-10 | Urgence artificielle | 0.80 |
| TE-67 | Fausse urgence | 0.80 |
| TE-95 | Répétition | 0.80 |
| TE-04 | Tristesse / Compassion | 0.75 |

### Most Conspiratorial (Highest N_s weight)

| Code | Technique | N_s Weight |
|------|-----------|------------|
| TE-58 | Théorie du complot | 0.90 |
| TE-62 | Défiance institutionnelle | 0.90 |
| TE-59 | Appel au mystère | 0.70 |
| TE-71 | Affirmation infalsifiable | 0.70 |
| TE-106 | Faux prophète | 0.60 |
| TE-64 | Fausse dichotomie expert-peuple | 0.50 |
| TE-68 | Causalité simpliste | 0.50 |
| TE-65 | Martyr / Censure | 0.40 |
| TE-126 | Prophétie auto-réalisatrice | 0.40 |
| TE-23 | Réductionnisme causal | 0.30 |

### Most Factually Distorted (Highest F_f weight)

| Code | Technique | F_f Weight |
|------|-----------|------------|
| TE-73 | Tautologie | 1.00 |
| TE-74 | Affirmation non sourcée | 1.00 |
| TE-75 | Information hors contexte | 1.00 |
| TE-76 | Citation tronquée | 1.00 |
| TE-77 | Mauvaise traduction | 1.00 |
| TE-79 | Fausse attribution | 1.00 |
| TE-80 | Statistique trompeuse | 1.00 |
| TE-81 | Base rate fallacy | 1.00 |
| TE-82 | Pourcentage sans base | 1.00 |
| TE-83 | Graphique manipulé | 1.00 |


---

## 📦 Semantic Features Coverage

**Total unique semantic features**: 243

### Most Common Semantic Features

| Feature | Occurrences |
|---------|-------------|
| stereotyping | 2 |
| popularity argument | 2 |
| spurious correlation | 2 |
| Affect lexicon | 1 |
| urgency markers | 1 |
| exclamations | 1 |
| Threat language | 1 |
| catastrophic scenarios | 1 |
| conditional warnings | 1 |
| Anger verbs | 1 |
| moral outrage | 1 |
| injustice framing | 1 |
| Empathy triggers | 1 |
| suffering descriptions | 1 |
| victimization | 1 |


---

## 🎯 Alignment Quality Metrics

### Coverage
- ✅ All 130 DIMA techniques mapped
- ✅ All 3 InfoVerif categories utilized
- ✅ Weights sum to 1.0 for all techniques (validated)

### Balance
- **I_p**: Dominant (emotion, persuasion, propaganda)
- **N_s**: Focused (conspiracy, distrust, speculation)
- **F_f**: Balanced (fallacies, distortion, misinformation)

### Semantic Richness
- Average semantic features per technique: {sum(len(t['semantic_features'].split(',')) for t in techniques) / len(techniques):.1f}
- Average example keywords per technique: {sum(len(t['example_keywords'].split(',')) for t in techniques) / len(techniques):.1f}

---

## 🚀 Next Steps

1. **Validation**: Expert review of top 20 high-priority techniques
2. **Examples**: Create annotated corpus (5-10 examples per technique)
3. **Embeddings**: Generate 130-dim semantic vectors for each technique
4. **Detector**: Implement zero-shot classifier with DIMA mapping as prior
5. **Evaluation**: F1 > 0.75, MAE < 8 on held-out dataset

**Status**: M1 (Mapping Table) — ✅ COMPLETED
