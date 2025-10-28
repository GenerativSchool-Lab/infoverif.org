"""OCR using PaddleOCR."""
import os
from typing import List, Dict
from pathlib import Path
from paddleocr import PaddleOCR


# Model instance (loaded once)
_ocr_model = None


def get_ocr_model(language: str = "fr"):
    """Get or load PaddleOCR model."""
    global _ocr_model
    if _ocr_model is None:
        _ocr_model = PaddleOCR(
            use_angle_cls=True,
            lang=language,
            show_log=False
        )
    return _ocr_model


def extract_ocr_text(frames_dir: str) -> List[Dict]:
    """
    Extract text from video frames using OCR.
    
    Args:
        frames_dir: Directory containing extracted frames
    
    Returns:
        List of OCR samples with timestamp and text
    """
    ocr_model = get_ocr_model()
    frames_path = Path(frames_dir)
    
    if not frames_path.exists():
        return []
    
    results = []
    for frame_file in sorted(frames_path.glob("*.jpg")):
        # Extract timestamp from frame number
        # Assuming 1 fps extraction, frame number ≈ timestamp
        frame_num = int(frame_file.stem.split("_")[-1])
        timestamp = float(frame_num)  # 1 fps
        
        # Run OCR
        ocr_result = ocr_model.ocr(str(frame_file), cls=True)
        
        # Extract text from OCR results
        texts = []
        if ocr_result and len(ocr_result) > 0:
            for line in ocr_result[0]:
                if line and len(line) >= 2:
                    text = line[1][0]
                    confidence = line[1][1]
                    if confidence > 0.5:  # Filter low confidence
                        texts.append(text)
        
        if texts:
            results.append({
                "ts": timestamp,
                "text": " ".join(texts)
            })
    
    return results

