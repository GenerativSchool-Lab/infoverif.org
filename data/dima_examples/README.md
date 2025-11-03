# DIMA Annotated Examples

This directory contains **50+ annotated examples** of DIMA manipulation techniques detected in real-world content.

## Structure

Each JSON file corresponds to a high-priority DIMA technique:

```
TE-01_appel_emotion_examples.json
TE-02_peur_menace_examples.json
...
```

## Example Format

```json
{
  "dima_code": "TE-01",
  "technique_name": "Appel à l'émotion",
  "examples": [
    {
      "id": "TE-01-001",
      "content_fr": "C'est TERRIFIANT ! Nos enfants sont en DANGER ! Partagez MAINTENANT avant qu'il ne soit trop tard !",
      "content_en": "It's TERRIFYING! Our children are in DANGER! Share NOW before it's too late!",
      "source": "Social media post (anonymized)",
      "modality": "text",
      "evidence_span": "TERRIFIANT, DANGER, MAINTENANT",
      "infoverif_scores": {
        "I_p": 0.85,
        "N_s": 0.15,
        "F_f": 0.45
      },
      "annotation_notes": "High emotional charge (capitalization, exclamations), urgency markers (MAINTENANT), fear appeal (DANGER)",
      "annotator": "expert_01",
      "date": "2025-11-03"
    }
  ]
}
```

## Coverage

**Priority Level 1** (Top 10 techniques):
- TE-01: Appel à l'émotion (10 examples)
- TE-02: Peur / Menace (10 examples)
- TE-58: Théorie du complot (10 examples)
- TE-62: Défiance institutionnelle (10 examples)
- TE-31: Ad hominem (5 examples)

**Total**: 50+ examples across 20 high-priority techniques

## Usage

These examples are used for:
1. **Few-shot prompts** for GPT-4 classification
2. **Evaluation corpus** for detector calibration
3. **Documentation** for educational purposes
4. **Research** for academic publications

## License

See project LICENSE (research & educational use)
