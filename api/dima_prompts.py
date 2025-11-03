"""
DIMA-Aware Prompt Engineering
Builds enhanced prompts with full DIMA taxonomy context and few-shot examples.
"""
from typing import Dict, List
from dima_detector import get_detector


def build_dima_aware_prompt(content: str, metadata: Dict) -> str:
    """
    Build DIMA-aware analysis prompt with full taxonomy context.
    
    Args:
        content: Text content to analyze (transcript, extracted text, etc.)
        metadata: Metadata dictionary (title, description, platform, url)
    
    Returns:
        Complete prompt string with DIMA taxonomy + few-shot examples + content
    """
    detector = get_detector()
    
    # Get compact taxonomy string
    taxonomy_context = detector.build_compact_taxonomy_string()
    
    # Get few-shot examples for high-priority techniques
    few_shot_examples = _build_few_shot_section()
    
    # Build complete prompt
    prompt = f"""{_get_system_instructions()}

{taxonomy_context}

{few_shot_examples}

INSTRUCTIONS POUR L'ANALYSE:

Analyse ce contenu pour identifier :

1. TECHNIQUES DE PROPAGANDE (Intensité persuasive → propaganda_score 0-100) :
   - Manipulation émotionnelle (codes TE-01 à TE-10)
   - Cadrage "eux vs nous" / désignation d'un bouc émissaire
   - Langage chargé / mots sensationnalistes
   - Sélection partielle des faits (cherry-picking)
   - Appel à l'autorité sans preuves
   - Généralisation abusive
   - Faux dilemmes / pensée binaire

2. MARQUEURS CONSPIRATIONNISTES (Narratif spéculatif → conspiracy_score 0-100) :
   - Narratives de "vérité cachée" / révélation (codes TE-58, TE-59)
   - Défiance envers institutions/experts/médias mainstream (TE-62)
   - Recherche de patterns dans le bruit
   - Affirmations infalsifiables (TE-71)
   - Rhétorique "ils ne veulent pas que tu saches"
   - Théories causales simplistes pour phénomènes complexes

3. DÉSINFORMATION & MANIPULATION (Fiabilité factuelle → misinfo_score 0-100) :
   - Affirmations non sourcées présentées comme faits (TE-74)
   - Sophismes logiques identifiables (famille Discrédit, Rhétorique)
   - Information hors contexte (TE-75, TE-76)
   - Statistiques trompeuses (TE-80)
   - Confusion corrélation/causalité (TE-69, TE-70)
   - Omission d'informations cruciales
   - Fausses équivalences (TE-56)

POUR CHAQUE TECHNIQUE DÉTECTÉE:
- Cite le CODE DIMA exact (ex: TE-58)
- Indique la FAMILLE DIMA (ex: "Diversion")
- Fournis le NOM en français (ex: "Théorie du complot")
- Extrais une CITATION exacte comme preuve (evidence)
- Évalue la SÉVÉRITÉ: high/medium/low
- Fournis une EXPLICATION détaillée (2-3 phrases)

RÉPONDS UNIQUEMENT EN JSON VALIDE dans ce format exact (en français) :
{{{{
  "propaganda_score": 0-100,
  "conspiracy_score": 0-100,
  "misinfo_score": 0-100,
  "overall_risk": 0-100,
  "techniques": [
    {{{{
      "dima_code": "TE-XX",
      "dima_family": "Nom de la famille",
      "name": "Nom de la technique en français",
      "evidence": "Citation exacte du contenu qui illustre cette technique",
      "severity": "high/medium/low",
      "explanation": "Explication détaillée de comment cette technique est utilisée (2-3 phrases)"
    }}}}
  ],
  "claims": [
    {{{{
      "claim": "Affirmation textuelle extraite du contenu",
      "confidence": "supported/unsupported/misleading",
      "issues": ["problème 1", "problème 2"],
      "reasoning": "Explication du jugement sur cette affirmation"
    }}}}
  ],
  "summary": "Analyse détaillée en 3-4 phrases : résumé des techniques identifiées, niveau de risque, et impact potentiel sur l'audience"
}}}}

MÉTADONNÉES :
Titre : {metadata.get('title', 'N/A')}
Description : {metadata.get('description', 'N/A')}
Plateforme : {metadata.get('platform', 'unknown')}

CONTENU À ANALYSER :
{content[:8000]}
"""
    
    return prompt


def _get_system_instructions() -> str:
    """Get system-level instructions for DIMA analysis."""
    return """Tu es un expert en manipulation médiatique utilisant la taxonomie DIMA (M82 Project).

IMPORTANT: Tu dois citer les CODES DIMA exacts (ex: TE-58) pour chaque technique détectée.
La taxonomie DIMA est la référence académique pour identifier 130 techniques de manipulation."""


def _build_few_shot_section() -> str:
    """
    Build few-shot examples section with high-priority techniques.
    
    Returns:
        Formatted few-shot examples string
    """
    detector = get_detector()
    
    # High-priority techniques for few-shot prompting
    priority_codes = ["TE-01", "TE-02", "TE-58", "TE-62", "TE-31"]
    
    examples_text = "EXEMPLES DE DÉTECTION DIMA:\n\n"
    
    for code in priority_codes:
        technique = detector.get_technique(code)
        if not technique:
            continue
        
        examples = detector.get_few_shot_examples(code, n=1)
        if not examples:
            continue
        
        example = examples[0]
        examples_text += f"""Exemple {code} — {technique['name_fr']} (Famille: {technique['family']}):
Contenu: "{example['content_fr']}"
→ Détection: {code} | {technique['family']} | {technique['name_fr']}
→ Evidence: "{example['evidence_span']}"
→ Explication: {example['explanation'][:150]}...

"""
    
    return examples_text


def build_legacy_prompt(content: str, metadata: Dict) -> str:
    """
    Build legacy prompt (without DIMA codes) for backward compatibility testing.
    
    Args:
        content: Text content to analyze
        metadata: Metadata dictionary
    
    Returns:
        Legacy prompt string (original format)
    """
    prompt = f"""Tu es un expert en manipulation médiatique, analyse de propagande et détection de désinformation.

Analyse ce contenu pour identifier :

1. TECHNIQUES DE PROPAGANDE (score 0-100) :
   - Manipulation émotionnelle (peur, colère, indignation, urgence)
   - Cadrage "eux vs nous" / désignation d'un bouc émissaire
   - Langage chargé / mots sensationnalistes
   - Sélection partielle des faits (cherry-picking)
   - Appel à l'autorité sans preuves
   - Généralisation abusive
   - Faux dilemmes / pensée binaire
   - Déformation / exagération
   - Répétition de messages clés

2. MARQUEURS CONSPIRATIONNISTES (score 0-100) :
   - Narratives de "vérité cachée" / révélation
   - Défiance envers institutions/experts/médias mainstream
   - Recherche de patterns dans le bruit
   - Affirmations infalsifiables
   - Rhétorique "ils ne veulent pas que tu saches"
   - Théories causales simplistes pour phénomènes complexes
   - Appel au "bon sens" contre l'expertise

3. DÉSINFORMATION & MANIPULATION (score 0-100) :
   - Affirmations non sourcées présentées comme faits
   - Sophismes logiques identifiables
   - Information hors contexte
   - Statistiques trompeuses
   - Confusion corrélation/causalité
   - Omission d'informations cruciales
   - Fausses équivalences

RÉPONDS UNIQUEMENT EN JSON VALIDE dans ce format exact (en français) :
{{{{
  "propaganda_score": 0-100,
  "conspiracy_score": 0-100,
  "misinfo_score": 0-100,
  "overall_risk": 0-100,
  "techniques": [
    {{{{
      "name": "Nom de la technique en français",
      "evidence": "Citation exacte du contenu qui illustre cette technique",
      "severity": "high/medium/low",
      "explanation": "Explication détaillée de comment cette technique est utilisée (2-3 phrases)"
    }}}}
  ],
  "claims": [
    {{{{
      "claim": "Affirmation textuelle extraite du contenu",
      "confidence": "supported/unsupported/misleading",
      "issues": ["problème 1", "problème 2"],
      "reasoning": "Explication du jugement sur cette affirmation"
    }}}}
  ],
  "summary": "Analyse détaillée en 3-4 phrases : résumé des techniques identifiées, niveau de risque, et impact potentiel sur l'audience"
}}}}

MÉTADONNÉES :
Titre : {metadata.get('title', 'N/A')}
Description : {metadata.get('description', 'N/A')}
Plateforme : {metadata.get('platform', 'unknown')}

CONTENU À ANALYSER :
{content[:8000]}
"""
    
    return prompt


# Test module
if __name__ == "__main__":
    print("Testing DIMA Prompts...")
    
    test_content = "Ils ne veulent pas que vous connaissiez la VÉRITÉ ! Les médias mainstream cachent tout. PARTAGEZ avant censure !"
    test_metadata = {
        'title': 'Test post',
        'description': 'Test description',
        'platform': 'social_media'
    }
    
    prompt = build_dima_aware_prompt(test_content, test_metadata)
    
    print(f"\n📏 Prompt length: {len(prompt)} chars (~{len(prompt.split())} words)")
    print(f"   Estimated tokens: ~{len(prompt) // 4}")
    
    print("\n📝 Prompt preview (first 1000 chars):")
    print(prompt[:1000])
    print("\n...")
    print(prompt[-500:])

