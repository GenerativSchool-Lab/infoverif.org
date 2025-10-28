"""Scene detection using PySceneDetect."""
from typing import List, Dict
from pathlib import Path
from scenedetect import VideoManager, SceneManager
from scenedetect.detectors import ContentDetector


def detect_scenes(video_path: str) -> List[Dict]:
    """
    Detect scene boundaries in video.
    
    Args:
        video_path: Path to video file
    
    Returns:
        List of scenes with start and end times
    """
    video_manager = VideoManager([video_path])
    scene_manager = SceneManager()
    
    # Add content detector
    scene_manager.add_detector(ContentDetector())
    
    # Start detection
    video_manager.start()
    scene_manager.detect_scenes(video_manager)
    
    scenes = []
    for start, end in scene_manager.get_scene_list():
        scenes.append({
            "start": start.get_seconds(),
            "end": end.get_seconds()
        })
    
    video_manager.release()
    
    return scenes

