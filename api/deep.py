"""Deep analysis module using Whisper + GPT-4 for propaganda/misinfo detection."""
import os
import json
import base64
import tempfile
from pathlib import Path
from typing import Dict, Optional
import ffmpeg
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


ANALYSIS_PROMPT = """You are an expert in media manipulation, propaganda analysis, and misinformation detection.

Analyze this video transcript and metadata for:

1. PROPAGANDA TECHNIQUES (0-100):
   - Emotional manipulation (fear, anger, outrage)
   - Us vs them framing
   - Loaded language
   - Cherry-picking facts
   - Appeal to authority without evidence

2. CONSPIRACY THEORY MARKERS (0-100):
   - "Hidden truth" narratives
   - Distrust of institutions/experts
   - Pattern-seeking in noise
   - Unfalsifiable claims
   - "They don't want you to know"

3. MISINFORMATION PATTERNS (0-100):
   - Unsourced claims presented as fact
   - Logical fallacies
   - Out-of-context information
   - Misleading statistics
   - Conflation of correlation/causation

Return ONLY valid JSON in this exact format:
{
  "propaganda_score": 0-100,
  "conspiracy_score": 0-100,
  "misinfo_score": 0-100,
  "overall_risk": 0-100,
  "techniques": [{"name": "technique name", "evidence": "quote from transcript", "severity": "high/medium/low"}],
  "claims": [{"claim": "claim text", "confidence": "supported/unsupported/misleading", "issues": ["issue1", "issue2"]}],
  "summary": "2-3 sentence analysis"
}

VIDEO METADATA:
Title: {title}
Description: {description}
Platform: {platform}

TRANSCRIPT:
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


def transcribe_audio(audio_path: str) -> str:
    """Transcribe audio using OpenAI Whisper API."""
    with open(audio_path, 'rb') as audio_file:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            response_format="text"
        )
    return transcript


def analyze_with_gpt4(transcript: str, metadata: Dict) -> Dict:
    """Analyze transcript using OpenAI with strict JSON Schema output."""
    prompt = ANALYSIS_PROMPT.format(
        title=metadata.get('title', 'N/A'),
        description=metadata.get('description', 'N/A'),
        platform=metadata.get('platform', 'unknown'),
        transcript=transcript[:8000]
    )

    schema = {
        "name": "AnalysisResult",
        "schema": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "propaganda_score": {"type": "integer", "minimum": 0, "maximum": 100},
                "conspiracy_score": {"type": "integer", "minimum": 0, "maximum": 100},
                "misinfo_score": {"type": "integer", "minimum": 0, "maximum": 100},
                "overall_risk": {"type": "integer", "minimum": 0, "maximum": 100},
                "techniques": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "name": {"type": "string"},
                            "evidence": {"type": "string"},
                            "severity": {"type": "string", "enum": ["high", "medium", "low"]}
                        },
                        "required": ["name"]
                    }
                },
                "claims": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "claim": {"type": "string"},
                            "confidence": {"type": "string", "enum": ["supported", "unsupported", "misleading"]},
                            "issues": {"type": "array", "items": {"type": "string"}}
                        },
                        "required": ["claim"]
                    }
                },
                "summary": {"type": "string"}
            },
            "required": [
                "propaganda_score",
                "conspiracy_score",
                "misinfo_score",
                "overall_risk",
                "techniques",
                "claims",
                "summary"
            ]
        },
        "strict": True
    }

    resp = client.responses.create(
        model="gpt-4o-mini",
        input=[
            {"role": "system", "content": "Return ONLY JSON matching the provided schema. No prose."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_schema", "json_schema": schema},
        temperature=0
    )

    content_text = getattr(resp, "output_text", None)
    if not content_text:
        try:
            content_text = resp.output[0].content[0].text
        except Exception:
            content_text = "{}"

    parsed = json.loads(content_text)
    return parsed


# Removed: URL analysis; use file or text/image inputs instead


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

