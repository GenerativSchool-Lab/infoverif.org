"""RQ task definitions and job management."""
import os
import json
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, Any

import redis

# Lazy imports - only load when analyze_video is actually called
# from video_processing import process_video
# from scoring import compute_risk_score
# from factcheck import match_factchecks
# from storage import save_report, get_report
# from asr import transcribe_audio
# from ocr import extract_ocr_text
# from scene_detection import detect_scenes
# from claims import extract_claims

def _get_queue():
    """Get RQ queue."""
    from rq import Queue
    redis_conn = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))
    return Queue(connection=redis_conn)


def analyze_video(job_id: str, url: Optional[str], platform: str, language: str, 
                  uploaded_url: Optional[str], filename: Optional[str]):
    """
    Main analysis pipeline.
    
    Args:
        job_id: Unique job identifier
        url: Video URL (YouTube)
        platform: youtube, tiktok, instagram
        language: Language code (fr, en, etc.)
        uploaded_url: If file was uploaded
        filename: Original filename if uploaded
    """
    # Lazy import heavy dependencies only when this function is called
    from video_processing import process_video
    from scoring import compute_risk_score
    from factcheck import match_factchecks
    from storage import save_report, get_report
    from asr import transcribe_audio
    from ocr import extract_ocr_text
    from scene_detection import detect_scenes
    from claims import extract_claims
    
    try:
        update_status(job_id, "running", 10, "Downloading video...")
        
        # Download/process video
        video_path, audio_path, frames_dir = process_video(job_id, url, platform, uploaded_url, filename)
        
        update_status(job_id, "running", 30, "Running ASR transcription...")
        
        # ASR transcription
        asr_segments = transcribe_audio(audio_path, language)
        
        update_status(job_id, "running", 50, "Running OCR on frames...")
        
        # OCR on-screen text
        ocr_samples = extract_ocr_text(frames_dir)
        
        update_status(job_id, "running", 65, "Detecting scenes...")
        
        # Scene detection
        scenes = detect_scenes(video_path)
        
        update_status(job_id, "running", 75, "Analyzing content...")
        
        # Extract claims
        claims = extract_claims(asr_segments, ocr_samples)
        
        # Compute risk score
        risk_data = compute_risk_score(video_path, asr_segments, ocr_samples, scenes)
        
        update_status(job_id, "running", 85, "Matching fact-checks...")
        
        # Match fact-checks
        sources = match_factchecks(claims)
        
        update_status(job_id, "running", 95, "Generating timeline...")
        
        # Build timeline
        timeline = build_timeline(asr_segments, ocr_samples, scenes, risk_data["reasons"])
        
        # Build final report
        report = {
            "job_id": job_id,
            "input": {
                "source": "upload" if uploaded_url else "url",
                "platform": platform,
                "url": url,
                "filename": filename
            },
            "meta": {
                "duration_sec": get_video_duration(video_path),
                "fps": 30.0,  # Could extract from video
                "created_at": datetime.utcnow().isoformat()
            },
            "asr": asr_segments,
            "ocr_samples": ocr_samples,
            "scenes": scenes,
            "claims": claims,
            "risk": risk_data,
            "sources": sources,
            "timelines": timeline
        }
        
        # Save report
        save_report(job_id, report)
        
        update_status(job_id, "done", 100, "Analysis complete")
        
    except Exception as e:
        update_status(job_id, "failed", 100, str(e))
        raise


def update_status(job_id: str, status: str, progress: int, message: str):
    """Update job status in Redis."""
    redis_conn = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))
    redis_conn.setex(
        f"job_status:{job_id}",
        48 * 3600,  # 48 hours in seconds
        json.dumps({"status": status, "progress": progress, "message": message})
    )


def get_job_status(job_id: str) -> Optional[Dict[str, Any]]:
    """Get job status from Redis."""
    redis_conn = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))
    data = redis_conn.get(f"job_status:{job_id}")
    if not data:
        return None
    return json.loads(data)


def get_job_result(job_id: str) -> Optional[Dict[str, Any]]:
    """Get completed job result."""
    return get_report(job_id)


def build_timeline(asr_segments, ocr_samples, scenes, risk_reasons) -> list:
    """Build timeline with flags at each timestamp."""
    timeline = []
    
    # Merge timestamps from all sources
    all_ts = set()
    for seg in asr_segments:
        all_ts.add(seg["start"])
        all_ts.add(seg["end"])
    for sample in ocr_samples:
        all_ts.add(sample["ts"])
    
    for ts in sorted(all_ts):
        flags = []
        excerpt = ""
        
        # Find matching ASR segment
        for seg in asr_segments:
            if seg["start"] <= ts <= seg["end"]:
                excerpt = seg["text"]
                break
        
        # Determine if risky
        if risk_reasons and len(risk_reasons) > 0:
            flags.append("Potential risk detected")
        
        timeline.append({
            "ts": ts,
            "flags": flags,
            "excerpt": excerpt
        })
    
    return timeline


def get_video_duration(video_path: str) -> float:
    """Get video duration in seconds."""
    # Simple implementation - could use ffprobe
    from moviepy.editor import VideoFileClip
    try:
        clip = VideoFileClip(video_path)
        duration = clip.duration
        clip.close()
        return duration
    except:
        return 0.0


# Export _get_queue for main.py
__all__ = ['analyze_video', 'get_job_status', 'get_job_result', '_get_queue']

