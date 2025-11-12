"""
DIMA-Aware Prompt Engineering
Builds enhanced prompts with full DIMA taxonomy context and few-shot examples.
"""
from typing import Dict, List, Optional
from dima_detector import get_detector


def build_dima_aware_prompt(content: str, metadata: Dict, language: str = "fr") -> str:
    """
    Build DIMA-aware analysis prompt with full taxonomy context (M2.1).
    
    Wrapper around build_hybrid_prompt for backward compatibility.
    
    Args:
        content: Text content to analyze
        metadata: Metadata dictionary
        language: Language code ("fr" or "en")
    
    Returns:
        Complete prompt string
    """
    return build_hybrid_prompt(content, metadata, similar_techniques=None, language=language)


def build_hybrid_prompt(content: str, metadata: Dict, similar_techniques: List[Dict] = None, language: str = "fr") -> str:
    """
    Build hybrid prompt with DIMA taxonomy + embedding similarity hints (M2.2).
    
    Args:
        content: Text content to analyze
        metadata: Metadata dictionary (title, description, platform, url)
        similar_techniques: Top-K similar techniques from embeddings (optional)
        language: Language code ("fr" or "en")
    
    Returns:
        Enhanced prompt with semantic similarity hints
    """
    detector = get_detector()
    
    # Get compact taxonomy string
    taxonomy_context = detector.build_compact_taxonomy_string()
    
    # Get few-shot examples
    few_shot_examples = _build_few_shot_section(language)
    
    # Build embedding hints section if available
    embedding_hints = ""
    if similar_techniques and len(similar_techniques) > 0:
        if language == "en":
            embedding_hints = "\n🔍 SEMANTICALLY SIMILAR TECHNIQUES (detected by embedding analysis):\n"
            embedding_hints += "These techniques have strong semantic similarity with the analyzed content.\n"
            embedding_hints += "PRIORITIZE their detection if the content matches:\n\n"
        else:
            embedding_hints = "\n🔍 TECHNIQUES SÉMANTIQUEMENT PROCHES (détectées par analyse d'embeddings):\n"
            embedding_hints += "Ces techniques ont une forte similarité sémantique avec le contenu analysé.\n"
            embedding_hints += "PRIORISE leur détection si le contenu correspond:\n\n"
        
        for tech in similar_techniques[:5]:  # Top 5
            if language == "en":
                tech_name = tech.get('name_en', tech.get('name', ''))
            else:
                tech_name = tech.get('name', tech.get('name_fr', ''))
            family = tech.get('family', '')
            embedding_hints += f"- {tech['code']}: {tech_name} (Family: {family}) — Similarity: {tech['similarity']:.2f}\n"
        
        if language == "en":
            embedding_hints += "\n⚠️ IMPORTANT: If you detect these techniques, cite their exact DIMA code.\n"
        else:
            embedding_hints += "\n⚠️ IMPORTANT: Si tu détectes ces techniques, cite leur code DIMA exact.\n"
    
    # Get language-specific prompt template
    prompt_template = _get_prompt_template(language)
    
    # Build complete prompt
    prompt = prompt_template.format(
        system_instructions=_get_system_instructions(language),
        taxonomy_context=taxonomy_context,
        embedding_hints=embedding_hints,
        few_shot_examples=few_shot_examples,
        title=metadata.get('title', 'N/A'),
        description=metadata.get('description', 'N/A'),
        platform=metadata.get('platform', 'unknown'),
        content=content[:8000]
    )
    
    return prompt


def _get_prompt_template(language: str = "fr") -> str:
    """Get language-specific prompt template."""
    if language == "en":
        return """{system_instructions}

{taxonomy_context}

{embedding_hints}

{few_shot_examples}

ANALYSIS INSTRUCTIONS:

Analyze this content to identify:

1. PROPAGANDA TECHNIQUES (Persuasive intensity → propaganda_score 0-100):
   - Emotional manipulation (codes TE-01 to TE-10)
   - "Us vs them" framing / scapegoating
   - Loaded language / sensationalist words
   - Selective fact presentation (cherry-picking)
   - Appeal to authority without evidence
   - Hasty generalization
   - False dilemmas / binary thinking

2. CONSPIRACY MARKERS (Speculative narrative → conspiracy_score 0-100):
   - "Hidden truth" narratives / revelation (codes TE-58, TE-59)
   - Distrust of institutions/experts/mainstream media (TE-62)
   - Pattern seeking in noise
   - Unfalsifiable claims (TE-71)
   - "They don't want you to know" rhetoric
   - Simplistic causal theories for complex phenomena

3. DISINFORMATION & MANIPULATION (Factual reliability → misinfo_score 0-100):
   - Unsourced claims presented as facts (TE-74)
   - Identifiable logical fallacies (Discredit, Rhetoric families)
   - Information out of context (TE-75, TE-76)
   - Misleading statistics (TE-80)
   - Correlation/causation confusion (TE-69, TE-70)
   - Omission of crucial information
   - False equivalences (TE-56)

FOR EACH DETECTED TECHNIQUE:
- Cite the exact DIMA CODE (e.g., TE-58)
- Indicate the DIMA FAMILY (e.g., "Diversion")
- Provide the NAME in English (e.g., "Conspiracy theory")
- Extract an exact QUOTATION as evidence
- Assess SEVERITY: high/medium/low
- Provide a detailed EXPLANATION (2-3 sentences)

RESPOND ONLY IN VALID JSON in this exact format (in English):
{{
  "propaganda_score": 0-100,
  "conspiracy_score": 0-100,
  "misinfo_score": 0-100,
  "overall_risk": 0-100,
  "content_summary": "Objective summary of the analyzed content in 2-3 sentences (WHO says WHAT, HOW, IN WHAT CONTEXT)",
  "techniques": [
    {{
      "dima_code": "TE-XX",
      "dima_family": "Family name",
      "name": "Technique name in English",
      "evidence": "Exact quotation from the content that illustrates this technique",
      "severity": "high/medium/low",
      "explanation": "Detailed explanation of how this technique is used (2-3 sentences)",
      "contextual_impact": "Why this technique is particularly effective/dangerous IN THIS SPECIFIC CONTEXT (1-2 sentences)"
    }}
  ],
  "technique_interactions": "If multiple techniques reinforce each other, explain their synergies (e.g., fear + scapegoating = double manipulation). Otherwise: null",
  "claims": [
    {{
      "claim": "Textual claim extracted from the content",
      "confidence": "supported/unsupported/misleading",
      "issues": ["issue 1", "issue 2"],
      "reasoning": "Explanation of the judgment on this claim"
    }}
  ],
  "summary": "Detailed analysis in 3-4 sentences: summary of identified techniques, risk level, and potential impact on the audience"
}}

METADATA:
Title: {title}
Description: {description}
Platform: {platform}

CONTENT TO ANALYZE:
{content}
"""
    else:
        return """{system_instructions}

{taxonomy_context}

{embedding_hints}

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
{{
  "propaganda_score": 0-100,
  "conspiracy_score": 0-100,
  "misinfo_score": 0-100,
  "overall_risk": 0-100,
  "content_summary": "Résumé objectif du contenu analysé en 2-3 phrases (QUI dit QUOI, COMMENT, DANS QUEL CONTEXTE)",
  "techniques": [
    {{
      "dima_code": "TE-XX",
      "dima_family": "Nom de la famille",
      "name": "Nom de la technique en français",
      "evidence": "Citation exacte du contenu qui illustre cette technique",
      "severity": "high/medium/low",
      "explanation": "Explication détaillée de comment cette technique est utilisée (2-3 phrases)",
      "contextual_impact": "Pourquoi cette technique est particulièrement efficace/dangereuse DANS CE CONTEXTE précis (1-2 phrases)"
    }}
  ],
  "technique_interactions": "Si plusieurs techniques se renforcent mutuellement, explique leurs synergies (ex: peur + bouc émissaire = double manipulation). Sinon: null",
  "claims": [
    {{
      "claim": "Affirmation textuelle extraite du contenu",
      "confidence": "supported/unsupported/misleading",
      "issues": ["problème 1", "problème 2"],
      "reasoning": "Explication du jugement sur cette affirmation"
    }}
  ],
  "summary": "Analyse détaillée en 3-4 phrases : résumé des techniques identifiées, niveau de risque, et impact potentiel sur l'audience"
}}

MÉTADONNÉES :
Titre : {title}
Description : {description}
Plateforme : {platform}

CONTENU À ANALYSER :
{content}
"""


def _get_system_instructions(language: str = "fr") -> str:
    """Get system-level instructions for DIMA analysis."""
    if language == "en":
        return """You are an expert in media manipulation using the DIMA taxonomy (M82 Project).

IMPORTANT: You must cite the exact DIMA CODES (e.g., TE-58) for each detected technique.
The DIMA taxonomy is the academic reference for identifying 130 manipulation techniques."""
    else:
        return """Tu es un expert en manipulation médiatique utilisant la taxonomie DIMA (M82 Project).

IMPORTANT: Tu dois citer les CODES DIMA exacts (ex: TE-58) pour chaque technique détectée.
La taxonomie DIMA est la référence académique pour identifier 130 techniques de manipulation."""


def _build_few_shot_section(language: str = "fr") -> str:
    """
    Build few-shot examples section with high-priority techniques.
    
    Args:
        language: Language code ("fr" or "en")
    
    Returns:
        Formatted few-shot examples string
    """
    detector = get_detector()
    
    # High-priority techniques for few-shot prompting
    priority_codes = ["TE-01", "TE-02", "TE-58", "TE-62", "TE-31"]
    
    if language == "en":
        examples_text = "DIMA DETECTION EXAMPLES:\n\n"
    else:
        examples_text = "EXEMPLES DE DÉTECTION DIMA:\n\n"
    
    for code in priority_codes:
        technique = detector.get_technique(code)
        if not technique:
            continue
        
        examples = detector.get_few_shot_examples(code, n=1)
        if not examples:
            continue
        
        example = examples[0]
        if language == "en":
            tech_name = technique.get('name_en', technique.get('name_fr', ''))
            family = technique.get('family', '')
            content_text = example.get('content_en', example.get('content_fr', ''))
            evidence = example.get('evidence_span', '')
            explanation = example.get('explanation_en', example.get('explanation', ''))[:150]
            examples_text += f"""Example {code} — {tech_name} (Family: {family}):
Content: "{content_text}"
→ Detection: {code} | {family} | {tech_name}
→ Evidence: "{evidence}"
→ Explanation: {explanation}...

"""
        else:
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
