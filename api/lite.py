import re
import json
import requests
from typing import Dict, List, Optional
from pathlib import Path


USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)


def detect_platform(url: str) -> str:
    u = url.lower()
    if "youtube.com" in u or "youtu.be" in u:
        return "youtube"
    if "twitter.com" in u or "x.com" in u:
        return "twitter"
    if "tiktok.com" in u:
        return "tiktok"
    return "unknown"


def fetch_page(url: str) -> str:
    resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=15)
    resp.raise_for_status()
    return resp.text


def extract_meta(html: str) -> Dict[str, Optional[str]]:
    # Try common meta tags first
    def _meta(name):
        pattern = rf'<meta[^>]+(?:name|property)=["\']{re.escape(name)}["\'][^>]+content=["\'](.*?)["\']'
        m = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
        return m.group(1).strip() if m else None

    title = _meta("og:title") or _meta("twitter:title")
    description = _meta("og:description") or _meta("twitter:description")

    # Fallback to <title>
    if not title:
        m = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
        if m:
            title = re.sub(r"\s+", " ", m.group(1)).strip()

    # Attempt to parse JSON-LD if available
    if not description:
        for m in re.finditer(r"<script[^>]+type=\"application/ld\+json\"[^>]*>(.*?)</script>", html, re.IGNORECASE | re.DOTALL):
            try:
                data = json.loads(m.group(1))
            except Exception:
                continue
            if isinstance(data, dict):
                desc = data.get("description") or data.get("name")
                if isinstance(desc, str):
                    description = desc.strip()
                    break
            if isinstance(data, list):
                for item in data:
                    if isinstance(item, dict):
                        desc = item.get("description") or item.get("name")
                        if isinstance(desc, str):
                            description = desc.strip()
                            break
                if description:
                    break

    return {"title": title, "description": description}


def tokenize(text: str) -> List[str]:
    tokens = re.findall(r"[a-zA-ZÀ-ÿ0-9]{3,}", text.lower())
    return tokens


def extract_claims_from_text(text: str) -> List[Dict]:
    # Import locally to avoid circular import on startup
    from claims import contains_numbers, contains_sensational_language

    claims: List[Dict] = []
    if not text:
        return claims

    # Split on sentence-ish boundaries
    parts = re.split(r"[\.!?\n]+", text)
    ts = 0.0
    for p in parts:
        p = p.strip()
        if not p:
            continue
        if contains_numbers(p) or contains_sensational_language(p):
            claims.append({"ts": ts, "text": p})
        ts += 5.0
    return claims[:10]


# Fact-check matching intentionally omitted in heuristics-only mode
def match_factchecks_keywords(claims: List[Dict], top_k: int = 3) -> List[Dict]:
    return []


def compute_lite_heuristics(text: str, claims: List[Dict]) -> Dict:
    # Sensational terms count
    from claims import SENSATIONAL_TERMS, NUMBER_PATTERNS
    text_lower = (text or "").lower()
    sensational = sum(text_lower.count(t) for t in SENSATIONAL_TERMS)

    # Unsourced numbers (simple count of number patterns)
    import re as _re
    num_count = 0
    for p in NUMBER_PATTERNS:
        num_count += len(_re.findall(p, text or "", flags=_re.IGNORECASE))

    # Domain heuristic without tldextract
    url_pattern = r"http[s]?://[^\s]+"
    urls = _re.findall(url_pattern, text or "")
    unknown_domains = 0
    for u in urls:
        # naive suffix check
        if not any(u.lower().endswith(suf) or f".{suf}/" in u.lower() for suf in [".fr", ".com", ".org", ".net", ".eu"]):
            unknown_domains += 1

    # Simple score
    score = min(100, sensational * 5 + num_count * 3 + unknown_domains * 10)
    reasons = []
    if sensational:
        reasons.append({"label": "Sensational language detected", "weight": min(20, sensational * 5)})
    if num_count:
        reasons.append({"label": "Numbers/statistics mentioned", "weight": min(20, num_count * 3)})
    if unknown_domains:
        reasons.append({"label": "Unknown or suspicious domains", "weight": min(20, unknown_domains * 10)})

    return {
        "score": int(score),
        "reasons": reasons,
        "features": {
            "sensational_terms": sensational,
            "numbers": num_count,
            "unknown_domains": unknown_domains,
        },
    }


def analyze_metadata(url: str, platform: Optional[str] = None) -> Dict:
    platform = platform or detect_platform(url)
    html = fetch_page(url)
    meta = extract_meta(html)
    combined_text = " ".join([x for x in [meta.get("title"), meta.get("description")] if x])
    claims = extract_claims_from_text(combined_text)
    # Heuristics-only POC (no fact-check matches)
    matches = []
    heuristics = compute_lite_heuristics(combined_text, claims)
    return {
        "input": {
            "url": url,
            "platform": platform,
            "title": meta.get("title"),
            "description": meta.get("description"),
        },
        "claims": claims,
        "matches": matches,
        "heuristics": heuristics,
    }


