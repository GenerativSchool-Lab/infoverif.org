"""Deep analysis module using Whisper + GPT-4 for propaganda/misinfo detection."""
import os
import json
import base64
import tempfile
from pathlib import Path
from typing import Dict, Optional
import ffmpeg
from openai import OpenAI
import yt_dlp

# DIMA semantic layer imports
try:
    from dima_detector import get_detector
    from dima_prompts import build_dima_aware_prompt, build_hybrid_prompt
    DIMA_ENABLED = True
except ImportError:
    print("⚠️  DIMA modules not available, using legacy prompts")
    DIMA_ENABLED = False

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


ANALYSIS_PROMPT = """Tu es un expert en manipulation médiatique, analyse de propagande et détection de désinformation.

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
{{
  "propaganda_score": 0-100,
  "conspiracy_score": 0-100,
  "misinfo_score": 0-100,
  "overall_risk": 0-100,
  "techniques": [
    {{
      "name": "Nom de la technique en français",
      "evidence": "Citation exacte du contenu qui illustre cette technique",
      "severity": "high/medium/low",
      "explanation": "Explication détaillée de comment cette technique est utilisée (2-3 phrases)"
    }}
  ],
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
{transcript}
"""


# URL-based flows removed; we rely on uploads (text/video/image)


def parse_vtt(vtt_path: Path) -> str:
    """Parse VTT subtitle file and extract clean text."""
    lines = vtt_path.read_text(encoding='utf-8').splitlines()
    text_lines = []
    
    for line in lines:
        line = line.strip()
        # Skip timing lines and empty lines
        if '-->' in line or not line or line.startswith('WEBVTT') or line.isdigit():
            continue
        # Skip HTML tags
        if '<' in line and '>' in line:
            continue
        text_lines.append(line)
    
    return ' '.join(text_lines)


# Removed: YouTube download; we accept uploads only


def extract_audio_from_file(video_path: str) -> str:
    """Extract audio from uploaded video file using ffmpeg."""
    tmpdir = tempfile.mkdtemp()
    output_path = str(Path(tmpdir) / 'audio.mp3')
    
    try:
        (
            ffmpeg
            .input(video_path)
            .output(output_path, acodec='libmp3lame', ar='16000', ac=1)
            .overwrite_output()
            .run(quiet=True, capture_stderr=True)
        )
        return output_path
    except ffmpeg.Error as e:
        raise Exception(f"FFmpeg error: {e.stderr.decode()}")


def download_audio_from_url(url: str) -> str:
    """
    Download audio from video URL using yt-dlp (supports Twitter, YouTube, TikTok, etc.).
    
    Args:
        url: Video URL from any supported platform
    
    Returns:
        Path to downloaded audio file (MP3)
    
    Raises:
        Exception: If download fails
    """
    temp_dir = tempfile.gettempdir()
    output_template = os.path.join(temp_dir, '%(id)s.%(ext)s')
    
    ydl_opts = {
        'format': 'bestaudio/best',  # Download best audio quality (not full video)
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '128',  # 128kbps is sufficient for Whisper
        }],
        'outtmpl': output_template,
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        # Cookie/auth options (for private content if needed)
        'cookiefile': None,  # Can add cookie file path if needed
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            print(f"📥 Downloading audio from: {url}")
            info = ydl.extract_info(url, download=True)
            
            # Get the final audio file path
            video_id = info.get('id', 'video')
            audio_path = os.path.join(temp_dir, f"{video_id}.mp3")
            
            if not os.path.exists(audio_path):
                raise Exception(f"Audio file not found after download: {audio_path}")
            
            print(f"✅ Audio downloaded: {audio_path} ({os.path.getsize(audio_path) / 1024 / 1024:.2f} MB)")
            return audio_path
            
    except Exception as e:
        raise Exception(f"yt-dlp download failed: {str(e)}")


def transcribe_audio(audio_path: str) -> str:
    """Transcribe audio using OpenAI Whisper API."""
    with open(audio_path, 'rb') as audio_file:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            response_format="text"
        )
    return transcript


def analyze_with_gpt4(transcript: str, metadata: Dict, use_dima: bool = True, use_embeddings: bool = True) -> Dict:
    """
    Analyze content using OpenAI GPT-4 with JSON mode (M2.2: Hybrid with embeddings).
    
    Args:
        transcript: Text content to analyze
        metadata: Metadata dictionary (title, description, platform, url)
        use_dima: Use DIMA-aware prompts (default: True)
        use_embeddings: Use embedding similarity hints (default: True, M2.2)
    
    Returns:
        Analysis dictionary with scores, techniques, claims, summary
    """
    similar_techniques = []
    
    # Step 1: Semantic similarity search (M2.2)
    if use_embeddings and use_dima and DIMA_ENABLED:
        try:
            detector = get_detector()
            if detector.is_embeddings_enabled():
                # Use first 2000 chars for similarity search (performance)
                similar_techniques = detector.find_similar_techniques(
                    transcript[:2000],
                    top_k=int(os.getenv("DIMA_EMBEDDINGS_TOP_K", "5")),
                    min_similarity=float(os.getenv("DIMA_EMBEDDINGS_MIN_SIMILARITY", "0.3"))
                )
                if similar_techniques:
                    print(f"🔍 Embedding similarity: {[t['code'] for t in similar_techniques]}")
        except Exception as e:
            print(f"⚠️  Embedding similarity failed: {e}")
            # Continue without embeddings
    
    # Step 2: Choose prompt strategy
    if use_dima and DIMA_ENABLED:
        # Use hybrid prompt with embedding hints if available
        if use_embeddings and similar_techniques:
            prompt = build_hybrid_prompt(transcript[:8000], metadata, similar_techniques)
            system_msg = "Tu es un expert en analyse médiatique utilisant la taxonomie DIMA (M82 Project). Tu DOIS répondre UNIQUEMENT en JSON valide, en français. Cite les CODES DIMA exacts (ex: TE-58) pour chaque technique. PRIORISE les techniques suggérées par l'analyse sémantique."
        else:
            # Standard DIMA prompt (no embedding hints)
            prompt = build_dima_aware_prompt(transcript[:8000], metadata)
            system_msg = "Tu es un expert en analyse médiatique utilisant la taxonomie DIMA (M82 Project). Tu DOIS répondre UNIQUEMENT en JSON valide, en français. Cite les CODES DIMA exacts (ex: TE-58) pour chaque technique."
    else:
        # Legacy prompt (backward compatibility)
        prompt = ANALYSIS_PROMPT.format(
            title=metadata.get('title', 'N/A'),
            description=metadata.get('description', 'N/A'),
            platform=metadata.get('platform', 'unknown'),
            transcript=transcript[:8000]
        )
        system_msg = "Tu es un expert en analyse médiatique. Tu DOIS répondre UNIQUEMENT en JSON valide, en français. Pas de markdown, pas de blocs de code, pas d'explications hors du JSON."

    # Step 3: Call OpenAI API
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0
    )

    content = response.choices[0].message.content
    if not content:
        raise ValueError("OpenAI returned empty content")
    
    # Aggressively clean the response
    content = content.strip()
    
    # Remove markdown code blocks if present
    if content.startswith("```"):
        lines = content.split('\n')
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        content = '\n'.join(lines).strip()
    
    # Find the first { and last } to extract just the JSON object
    first_brace = content.find('{')
    last_brace = content.rfind('}')
    
    if first_brace == -1 or last_brace == -1:
        raise ValueError(f"No JSON object found in response. Content: {content[:500]}")
    
    content = content[first_brace:last_brace+1]
    
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError as e:
        # Log the actual content for debugging
        raise ValueError(f"JSON parse error: {str(e)}. Cleaned response: {content[:500]}")
    
    # Validate and set defaults for required fields
    parsed.setdefault("propaganda_score", 0)
    parsed.setdefault("conspiracy_score", 0)
    parsed.setdefault("misinfo_score", 0)
    parsed.setdefault("overall_risk", 0)
    parsed.setdefault("techniques", [])
    parsed.setdefault("claims", [])
    parsed.setdefault("summary", "")
    
    # Validate techniques structure (accept DIMA fields if present)
    techniques = parsed.get("techniques", [])
    for tech in techniques:
        # DIMA fields are optional (backward compatible)
        tech.setdefault("dima_code", "")
        tech.setdefault("dima_family", "")
        tech.setdefault("name", "Technique non spécifiée")
        tech.setdefault("evidence", "")
        tech.setdefault("severity", "medium")
        tech.setdefault("explanation", "")
    
    # Add embedding hints metadata if available (M2.2)
    if similar_techniques:
        parsed["embedding_hints"] = similar_techniques
        
        # Enrich techniques with high-confidence embeddings not detected by GPT
        # (only add if GPT missed them and similarity > 0.5)
        gpt_codes = {tech.get("dima_code", "") for tech in parsed["techniques"]}
        
        for emb_tech in similar_techniques:
            code = emb_tech.get("code", "")
            similarity = emb_tech.get("similarity", 0)
            
            # Add if: not already detected by GPT AND high similarity
            if code and code not in gpt_codes and similarity >= 0.5:
                # Create technique entry from embedding
                enriched_technique = {
                    "dima_code": code,
                    "dima_family": emb_tech.get("family", ""),
                    "name": emb_tech.get("name", ""),
                    "evidence": "(Détecté par analyse sémantique - correspondance thématique forte)",
                    "severity": "medium" if similarity >= 0.6 else "low",
                    "explanation": f"Technique détectée par similarité sémantique (score: {similarity:.2f}). Le contenu présente des marqueurs linguistiques correspondant à cette technique de manipulation.",
                    "source": "embedding"  # Mark as embedding-detected
                }
                parsed["techniques"].append(enriched_technique)
                print(f"✨ Enriched with embedding technique: {code} (similarity: {similarity:.2f})")
    
    return parsed


def analyze_url(url: str, platform: str = "unknown", post_text: str = None) -> Dict:
    """
    Full analysis pipeline for video URL (Twitter, YouTube, TikTok, etc.).
    Downloads audio only using yt-dlp, transcribes with Whisper, analyzes with GPT-4.
    
    Args:
        url: Video URL from any supported platform
        platform: Platform name (twitter, youtube, tiktok, etc.)
        post_text: Optional text from post/tweet (for multimodal analysis)
    
    Returns:
        Analysis dictionary with scores, techniques, claims, summary
    """
    metadata = {
        'platform': platform,
        'title': f'{platform.capitalize()} video',
        'description': 'Video from social media',
        'url': url
    }
    
    audio_path = None
    try:
        # Download audio from URL (yt-dlp)
        audio_path = download_audio_from_url(url)
        
        # Transcribe with Whisper
        print(f"🎤 Transcribing audio with Whisper...")
        audio_transcript = transcribe_audio(audio_path)
        print(f"✅ Transcription complete: {len(audio_transcript)} characters")
        
        # CRITICAL FIX: Handle empty/music-only transcripts
        if len(audio_transcript.strip()) < 10:
            print("⚠️  Audio transcript is empty or music-only (< 10 chars)")
            audio_transcript = "[Audio sans paroles détectées - musique de fond uniquement]"
        
        # MULTIMODAL FUSION: Combine post text + audio transcript if both available
        if post_text and len(post_text.strip()) > 5:
            print(f"📝 Fusing post text ({len(post_text)} chars) + audio transcript ({len(audio_transcript)} chars)")
            transcript = f"""TEXTE DU POST:
{post_text}

TRANSCRIPTION AUDIO:
{audio_transcript}"""
            metadata['multimodal'] = True
            metadata['has_post_text'] = True
            metadata['has_audio'] = len(audio_transcript.strip()) > 10
        else:
            transcript = audio_transcript
            metadata['multimodal'] = False
            metadata['has_post_text'] = False
            metadata['has_audio'] = True
        
        # Analyze with GPT-4 + DIMA
        analysis = analyze_with_gpt4(transcript, metadata)
        analysis['input'] = metadata
        analysis['transcript_excerpt'] = transcript[:500] + '...' if len(transcript) > 500 else transcript
        
        return analysis
    finally:
        # Cleanup temp audio file
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)
            print(f"🗑️  Cleaned up: {audio_path}")


def analyze_file(file_path: str, platform: str = "unknown") -> Dict:
    """Full analysis pipeline for uploaded file."""
    metadata = {
        'platform': platform,
        'title': Path(file_path).name,
        'description': 'Uploaded video file',
        'url': None
    }
    
    # Extract audio
    audio_path = extract_audio_from_file(file_path)
    
    try:
        # Transcribe with Whisper
        transcript = transcribe_audio(audio_path)
        
        # Analyze with GPT-4
        analysis = analyze_with_gpt4(transcript, metadata)
        analysis['input'] = metadata
        analysis['transcript_excerpt'] = transcript[:500] + '...' if len(transcript) > 500 else transcript
        
        return analysis
    finally:
        # Cleanup
        if os.path.exists(audio_path):
            os.remove(audio_path)


def analyze_text(text: str, platform: str = "text") -> Dict:
    """Analyze plain text directly with GPT-4 using the same schema."""
    metadata = {
        'platform': platform,
        'title': 'Submitted text',
        'description': (text[:200] + '...') if len(text) > 200 else text,
        'url': None,
    }
    transcript = text
    analysis = analyze_with_gpt4(transcript, metadata)
    analysis['input'] = metadata
    analysis['transcript_excerpt'] = transcript[:500] + '...' if len(transcript) > 500 else transcript
    return analysis


def analyze_image(image_bytes: bytes, platform: str = "image") -> Dict:
    """Extract text-like content from a screenshot using OpenAI vision, then analyze with GPT-4."""
    # Encode image to base64 for inline message
    b64 = base64.b64encode(image_bytes).decode('utf-8')

    extract_prompt = (
        "You will receive a social post screenshot. Extract the visible text verbatim, "
        "including the author handle (if present), post text, on-image captions, and visible numeric claims. "
        "Return plain text only."
    )

    vision = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You extract text from images."},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": extract_prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}}
                ]
            }
        ],
        temperature=0
    )
    extracted = vision.choices[0].message.content or ""

    metadata = {
        'platform': platform,
        'title': 'Uploaded screenshot',
        'description': extracted[:200] + '...' if len(extracted) > 200 else extracted,
        'url': None,
    }

    # Reuse the same analysis pipeline
    analysis = analyze_with_gpt4(extracted, metadata)
    analysis['input'] = metadata
    analysis['transcript_excerpt'] = extracted[:500] + '...' if len(extracted) > 500 else extracted
    return analysis

