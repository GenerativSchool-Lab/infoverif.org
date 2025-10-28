"""Video download and processing utilities."""
import os
import subprocess
from typing import Optional, Tuple
from pathlib import Path

from moviepy.editor import VideoFileClip
import cv2
import requests

from storage import get_storage_path


def process_video(job_id: str, url: Optional[str], platform: str, 
                  uploaded_url: Optional[str], filename: Optional[str]) -> Tuple[str, str, str]:
    """
    Download/process video and extract audio + frames.
    
    Returns:
        (video_path, audio_path, frames_dir)
    """
    storage_dir = get_storage_path(job_id)
    storage_dir.mkdir(parents=True, exist_ok=True)
    
    # Download if URL provided
    if url:
        video_path = download_video(url, platform, storage_dir)
    elif uploaded_url:
        # File was uploaded, move it to storage
        video_path = Path(uploaded_url)  # Assume file is already saved
        if not video_path.exists():
            raise FileNotFoundError(f"Uploaded file not found: {uploaded_url}")
        # Copy to storage
        target = storage_dir / video_path.name
        subprocess.run(["cp", str(video_path), str(target)])
        video_path = target
    else:
        raise ValueError("Neither URL nor uploaded file provided")
    
    # Extract audio (16k mono WAV)
    audio_path = storage_dir / "audio.wav"
    extract_audio(video_path, audio_path)
    
    # Extract frames (1 fps)
    frames_dir = storage_dir / "frames"
    frames_dir.mkdir(exist_ok=True)
    extract_frames(video_path, frames_dir)
    
    return str(video_path), str(audio_path), str(frames_dir)


def download_video(url: str, platform: str, output_dir: Path) -> Path:
    """Download video from URL (YouTube only for MVP)."""
    if platform == "youtube":
        return download_youtube(url, output_dir)
    else:
        raise ValueError(f"Platform {platform} not supported for direct download")


def download_youtube(url: str, output_dir: Path) -> Path:
    """Download YouTube video using yt-dlp or ffmpeg."""
    # Use yt-dlp if available, otherwise try direct ffmpeg
    api_key = os.getenv("YOUTUBE_API_KEY")
    
    output_file = output_dir / "video.mp4"
    
    # Try yt-dlp first
    try:
        result = subprocess.run(
            ["yt-dlp", "-f", "best[ext=mp4]", "-o", str(output_file), url],
            capture_output=True,
            check=True
        )
        return output_file
    except (subprocess.CalledProcessError, FileNotFoundError):
        # Fallback: direct download (may not work for all videos)
        # In production, should validate URL and use YouTube API
        subprocess.run(
            ["ffmpeg", "-i", url, "-c", "copy", str(output_file)],
            stderr=subprocess.DEVNULL,
            check=False
        )
        return output_file


def extract_audio(video_path: Path, output_path: Path):
    """Extract audio as 16k mono WAV."""
    subprocess.run([
        "ffmpeg", "-i", str(video_path),
        "-acodec", "pcm_s16le",
        "-ac", "1",
        "-ar", "16000",
        "-y",
        str(output_path)
    ], check=True, capture_output=True)


def extract_frames(video_path: Path, output_dir: Path, fps: float = 1.0):
    """Extract frames at specified FPS."""
    # Use ffmpeg to extract frames
    output_pattern = str(output_dir / "frame_%06d.jpg")
    
    subprocess.run([
        "ffmpeg", "-i", str(video_path),
        "-vf", f"fps={fps}",
        "-qscale:v", "2",
        str(output_pattern)
    ], check=True, capture_output=True)


def get_video_metadata(video_path: Path) -> dict:
    """Get video metadata using ffprobe."""
    try:
        result = subprocess.run([
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration,width,height,r_frame_rate",
            "-of", "json",
            str(video_path)
        ], capture_output=True, text=True, check=True)
        
        import json
        data = json.loads(result.stdout)
        return data.get("format", {})
    except:
        return {}

