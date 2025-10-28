"""ASR using faster-whisper."""
from typing import List, Dict
from pathlib import Path
from faster_whisper import WhisperModel


# Model instance (loaded once)
_model = None


def get_model():
    """Get or load Whisper model."""
    global _model
    if _model is None:
        _model = WhisperModel("base", device="cpu", compute_type="int8")
    return _model


def transcribe_audio(audio_path: str, language: str = "fr") -> List[Dict]:
    """
    Transcribe audio using faster-whisper.
    
    Args:
        audio_path: Path to audio file
        language: Language code (fr, en, etc.)
    
    Returns:
        List of segments with start, end, text
    """
    model = get_model()
    
    segments, info = model.transcribe(
        audio_path,
        language=language,
        vad_filter=True,
        beam_size=5
    )
    
    result = []
    for segment in segments:
        result.append({
            "start": segment.start,
            "end": segment.end,
            "text": segment.text.strip()
        })
    
    return result

