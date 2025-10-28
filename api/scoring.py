"""Risk scoring heuristics."""
import re
from typing import List, Dict, Any


# Recognized sources (whitelist)
RECOGNIZED_SOURCES = [
    "INSEE", "Legifrance", "Cour des comptes", "AFP", "France Info",
    "ARTE", "ECDC", "OCDE", "Banque de France", "Ministère",
    "service-public.fr", "vie-publique.fr"
]


def compute_risk_score(video_path: str, asr_segments: List[Dict], 
                      ocr_samples: List[Dict], scenes: List[Dict]) -> Dict[str, Any]:
    """
    Compute risk score based on heuristics.
    
    Returns dict with:
    - score: 0-100
    - reasons: List of risk reasons with weights
    - features: Raw feature scores
    """
    score = 0
    reasons = []
    features = {}
    
    # 1. Cut density (up to 20 points)
    duration = sum(s["end"] - s["start"] for s in scenes) if scenes else 60
    cut_density = len(scenes) / max(duration / 60, 1)  # scenes per minute
    cut_score = min(cut_density * 5, 20)
    score += cut_score
    if cut_score > 5:
        reasons.append({
            "label": "High cut density",
            "weight": cut_score
        })
    features["cut_density"] = cut_density
    
    # 2. Sensational terms (up to 20 points)
    all_text = " ".join([s["text"] for s in asr_segments])
    sensational_count = count_sensational_terms(all_text)
    sensational_score = min(sensational_count * 2, 20)
    score += sensational_score
    if sensational_score > 5:
        reasons.append({
            "label": "Sensational language detected",
            "weight": sensational_score
        })
    features["sensational_terms"] = sensational_count
    
    # 3. Fullscreen text (up to 20 points)
    fullscreen_score = 0
    for sample in ocr_samples:
        if len(sample["text"]) > 50:  # Long text detected
            fullscreen_score += 5
    fullscreen_score = min(fullscreen_score, 20)
    score += fullscreen_score
    if fullscreen_score > 5:
        reasons.append({
            "label": "Fullscreen text overlay",
            "weight": fullscreen_score
        })
    features["fullscreen_text"] = fullscreen_score
    
    # 4. Unsourced numbers (up to 20 points)
    unsourced_score = count_unsourced_numbers(asr_segments, ocr_samples)
    unsourced_score = min(unsourced_score * 2, 20)
    score += unsourced_score
    if unsourced_score > 5:
        reasons.append({
            "label": "Unsourced numbers and statistics",
            "weight": unsourced_score
        })
    features["unsourced_numbers"] = unsourced_score
    
    # 5. Unknown domain (up to 10 points)
    domain_score = detect_unknown_domains(all_text, ocr_samples)
    domain_score = min(domain_score * 2, 10)
    score += domain_score
    if domain_score > 0:
        reasons.append({
            "label": "Unknown or suspicious domain",
            "weight": domain_score
        })
    features["unknown_domain"] = domain_score
    
    # 6. Recognized sources (negative weight, up to -15)
    source_score = detect_recognized_sources(all_text, ocr_samples)
    source_score = max(source_score * -3, -15)
    score += source_score
    if source_score < -5:
        reasons.append({
            "label": "Cited recognized sources",
            "weight": source_score
        })
    features["recognized_sources"] = -source_score
    
    # Clamp score to 0-100
    score = max(0, min(100, score))
    
    # Sort reasons by weight
    reasons.sort(key=lambda x: abs(x["weight"]), reverse=True)
    
    return {
        "score": round(score, 1),
        "reasons": reasons,
        "features": features
    }


def count_sensational_terms(text: str) -> int:
    """Count occurrences of sensational terms."""
    from claims import SENSATIONAL_TERMS
    count = 0
    text_lower = text.lower()
    for term in SENSATIONAL_TERMS:
        count += text_lower.count(term)
    return count


def count_unsourced_numbers(asr_segments: List[Dict], ocr_samples: List[Dict]) -> int:
    """Count numbers without nearby source mentions."""
    from claims import NUMBER_PATTERNS
    count = 0
    
    all_text_parts = [(s["text"], s["start"]) for s in asr_segments]
    all_text_parts.extend([(s["text"], s["ts"]) for s in ocr_samples])
    
    for text, ts in all_text_parts:
        if any(re.search(p, text, re.IGNORECASE) for p in NUMBER_PATTERNS):
            # Check if there's a source nearby (in same sentence)
            if not has_nearby_source(text):
                count += 1
    
    return count


def has_nearby_source(text: str) -> bool:
    """Check if text contains recognized source in proximity."""
    for source in RECOGNIZED_SOURCES:
        if source.lower() in text.lower():
            return True
    return False


def detect_unknown_domains(text: str, ocr_samples: List[Dict]) -> int:
    """Detect suspicious or unknown domains mentioned."""
    import tldextract
    domains = []
    
    # Extract domains from text
    url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
    urls = re.findall(url_pattern, text)
    
    for sample in ocr_samples:
        urls.extend(re.findall(url_pattern, sample["text"]))
    
    domains = []
    for url in urls:
        ext = tldextract.extract(url)
        domain = f"{ext.domain}.{ext.suffix}"
        domains.append(domain)
    
    # Simple check: if any domain is not recognized
    suspicious_count = 0
    for domain in set(domains):
        # Very simple heuristic: if domain is not in whitelist
        if not any(ws in domain for ws in ["fr", "eu", "com", "org", "net"]):
            suspicious_count += 1
    
    return suspicious_count


def detect_recognized_sources(text: str, ocr_samples: List[Dict]) -> int:
    """Count recognized source mentions."""
    source_count = 0
    
    for source in RECOGNIZED_SOURCES:
        if source.lower() in text.lower():
            source_count += 1
    
    for sample in ocr_samples:
        for source in RECOGNIZED_SOURCES:
            if source.lower() in sample["text"].lower():
                source_count += 1
                break
    
    return source_count

