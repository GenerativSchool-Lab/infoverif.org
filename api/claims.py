"""Claims extraction from transcribed and OCR text."""
import re
from typing import List, Dict


# Sensational keywords
SENSATIONAL_TERMS = [
    "révélé", "ils cachent", "on ne vous dit pas", "choc", "urgent",
    "censuré", "avant suppression", "complot", "propagande",
    "réveille-toi", "vérité", "preuve irréfutable", "on vous ment",
    "scandale", "explosif", "interdit", "partage vite"
]


# Number patterns
NUMBER_PATTERNS = [
    r'\d+%',  # percentages
    r'\d+\s*€',  # euros
    r'\d+\s*millions',  # millions
    r'\d+\s*milliards',  # billions
    r'\d+\s*k',  # thousands
    r'\d+\s*M',  # millions shorthand
]


def extract_claims(asr_segments: List[Dict], ocr_samples: List[Dict]) -> List[Dict]:
    """
    Extract potential claims from ASR and OCR text.
    
    Args:
        asr_segments: ASR transcription segments
        ocr_samples: OCR text samples
    
    Returns:
        List of claims with timestamp and text
    """
    claims = []
    
    # Extract from ASR
    for seg in asr_segments:
        text = seg["text"]
        if contains_numbers(text) or contains_sensational_language(text):
            claims.append({
                "ts": seg["start"],
                "text": text
            })
    
    # Extract from OCR
    for sample in ocr_samples:
        text = sample["text"]
        if contains_numbers(text) or contains_sensational_language(text):
            claims.append({
                "ts": sample["ts"],
                "text": text
            })
    
    # Deduplicate similar claims
    claims = deduplicate_claims(claims)
    
    return claims[:10]  # Return top 10 claims


def contains_numbers(text: str) -> bool:
    """Check if text contains number patterns."""
    for pattern in NUMBER_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False


def contains_sensational_language(text: str) -> bool:
    """Check if text contains sensational language."""
    text_lower = text.lower()
    for term in SENSATIONAL_TERMS:
        if term in text_lower:
            return True
    return False


def deduplicate_claims(claims: List[Dict]) -> List[Dict]:
    """Remove duplicate or very similar claims."""
    if not claims:
        return []
    
    # Simple deduplication: keep unique texts within 5s
    result = []
    seen_texts = set()
    
    for claim in sorted(claims, key=lambda x: x["ts"]):
        text_key = claim["text"][:50]  # Use first 50 chars as key
        
        # Check if similar claim exists in recent window
        found_duplicate = False
        for seen in seen_texts:
            if text_key in seen or seen in text_key:
                found_duplicate = True
                break
        
        if not found_duplicate:
            result.append(claim)
            seen_texts.add(text_key)
    
    return result

