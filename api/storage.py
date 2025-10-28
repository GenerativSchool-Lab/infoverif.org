"""Storage utilities for reports and media."""
import os
import json
from pathlib import Path
from typing import Optional, Dict, Any


def get_storage_path(job_id: str) -> Path:
    """Get storage directory for a job."""
    base_dir = Path(os.getenv("STORAGE_DIR", "/tmp/video_integrity"))
    return base_dir / job_id


def save_report(job_id: str, report: Dict[str, Any]):
    """Save analysis report to disk."""
    storage_dir = get_storage_path(job_id)
    storage_dir.mkdir(parents=True, exist_ok=True)
    
    report_path = storage_dir / "report.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)


def get_report(job_id: str) -> Optional[Dict[str, Any]]:
    """Load analysis report from disk."""
    storage_dir = get_storage_path(job_id)
    report_path = storage_dir / "report.json"
    
    if not report_path.exists():
        return None
    
    with open(report_path, "r") as f:
        return json.load(f)


def purge_old_assets():
    """Remove assets older than PURGE_AFTER_HOURS."""
    import shutil
    import time
    
    base_dir = Path(os.getenv("STORAGE_DIR", "/tmp/video_integrity"))
    hours = int(os.getenv("PURGE_AFTER_HOURS", "48"))
    
    if not base_dir.exists():
        return
    
    now = time.time()
    cutoff_time = now - (hours * 3600)
    
    for job_dir in base_dir.iterdir():
        if job_dir.is_dir():
            # Check modification time
            if job_dir.stat().st_mtime < cutoff_time:
                shutil.rmtree(job_dir)

