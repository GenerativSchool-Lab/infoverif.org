"""Deep analysis module using Whisper + GPT-4 for propaganda/misinfo detection."""
import os
import json
import tempfile
import subprocess
from pathlib import Path
from typing import Dict, Optional
import yt_dlp
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


def get_youtube_transcript(url: str) -> Optional[str]:
    """Try to extract YouTube auto-captions using yt-dlp."""
    try:
        ydl_opts = {
            'skip_download': True,
            'writeautomaticsub': True,
            'subtitlesformat': 'vtt',
            'quiet': True,
            'no_warnings': True,
        }
        
        with tempfile.TemporaryDirectory() as tmpdir:
            ydl_opts['outtmpl'] = str(Path(tmpdir) / 'video')
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                # Try to get subtitles
                if info.get('automatic_captions'):
                    # Download subtitles
                    ydl.download([url])
                    
                    # Find .vtt file
                    vtt_files = list(Path(tmpdir).glob('*.vtt'))
                    if vtt_files:
                        # Parse VTT and extract text
                        text = parse_vtt(vtt_files[0])
                        return text
        
        return None
    except Exception as e:
        print(f"Error getting YouTube transcript: {e}")
        return None


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


def download_youtube_audio(url: str) -> str:
    """Download audio from YouTube video using yt-dlp."""
    tmpdir = tempfile.mkdtemp()
    output_path = str(Path(tmpdir) / 'audio.mp3')
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': output_path.replace('.mp3', ''),
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '128',
        }],
        'quiet': True,
        'no_warnings': True,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
    
    return output_path


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
    """Analyze transcript using GPT-4 for propaganda/misinfo detection."""
    prompt = ANALYSIS_PROMPT.format(
        title=metadata.get('title', 'N/A'),
        description=metadata.get('description', 'N/A'),
        platform=metadata.get('platform', 'unknown'),
        transcript=transcript[:8000]  # Limit to ~2k tokens
    )
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are an expert media analyst. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        response_format={"type": "json_object"}
    )
    
    result = json.loads(response.choices[0].message.content)
    return result


def analyze_url(url: str) -> Dict:
    """Full analysis pipeline for URL (YouTube)."""
    # Detect platform
    platform = "youtube" if "youtube.com" in url or "youtu.be" in url else "unknown"
    
    # Get metadata
    ydl_opts = {'quiet': True, 'no_warnings': True}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        metadata = {
            'platform': platform,
            'title': info.get('title'),
            'description': info.get('description', '')[:500],
            'url': url
        }
    
    # Try captions first
    transcript = get_youtube_transcript(url)
    
    # Fallback to Whisper if no captions
    if not transcript:
        audio_path = download_youtube_audio(url)
        try:
            transcript = transcribe_audio(audio_path)
        finally:
            # Cleanup
            if os.path.exists(audio_path):
                os.remove(audio_path)
    
    # Analyze with GPT-4
    analysis = analyze_with_gpt4(transcript, metadata)
    analysis['input'] = metadata
    analysis['transcript_excerpt'] = transcript[:500] + '...' if len(transcript) > 500 else transcript
    
    return analysis


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

