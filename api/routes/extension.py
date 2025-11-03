"""
Chrome extension-specific routes.

Provides:
- /chat endpoint for follow-up questions about analysis
- Analysis context cache (in-memory, 1-hour TTL)
"""

import os
import time
from typing import Dict
from fastapi import APIRouter, HTTPException
from models.extension import ChatRequest, ChatResponse, Citation, AnalysisCacheEntry

router = APIRouter(prefix="/extension", tags=["extension"])

# In-memory cache for analysis results (used by chat)
# Key: analysis_id, Value: AnalysisCacheEntry
_analysis_cache: Dict[str, AnalysisCacheEntry] = {}


def cache_analysis(analysis_id: str, report: dict):
    """
    Cache analysis result for chat context.
    
    Args:
        analysis_id: UUID from analysis
        report: Full InfoVerif report
    """
    _analysis_cache[analysis_id] = AnalysisCacheEntry(
        analysis_id=analysis_id,
        report=report,
        timestamp=time.time()
    )
    
    # Limit cache size (max 50 entries)
    if len(_analysis_cache) > 50:
        # Remove oldest entry
        oldest_id = min(_analysis_cache.keys(), key=lambda k: _analysis_cache[k].timestamp)
        del _analysis_cache[oldest_id]


def get_cached_analysis(analysis_id: str) -> dict:
    """
    Retrieve cached analysis result.
    
    Args:
        analysis_id: UUID from analysis
    
    Returns:
        Full InfoVerif report
    
    Raises:
        HTTPException: If analysis not found or expired
    """
    if analysis_id not in _analysis_cache:
        raise HTTPException(status_code=404, detail="Analysis not found. Please re-run the analysis.")
    
    entry = _analysis_cache[analysis_id]
    
    if entry.is_expired():
        del _analysis_cache[analysis_id]
        raise HTTPException(status_code=410, detail="Analysis expired. Please re-run the analysis.")
    
    return entry.report


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Chat endpoint for follow-up questions about a previous analysis.
    
    Phase 2 feature - currently returns placeholder response.
    Future implementation will use GPT-4 with analysis context.
    
    Args:
        request: ChatRequest with analysis_id and user_message
    
    Returns:
        ChatResponse with bot reply and citations
    """
    start_time = time.time()
    
    # Validate OpenAI API key
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    
    # Get cached analysis
    try:
        report = get_cached_analysis(request.analysis_id)
    except HTTPException as e:
        raise e
    
    # TODO Phase 2: Implement actual chat with GPT-4
    # For now, return placeholder response
    reply = build_placeholder_reply(request.user_message, report, request.lang)
    citations = extract_citations_from_report(report)[:2]  # Top 2 techniques
    
    latency_ms = int((time.time() - start_time) * 1000)
    
    return ChatResponse(
        reply=reply,
        citations=citations,
        latency_ms=latency_ms,
        model_card="gpt-4o-mini"
    )


def build_placeholder_reply(user_message: str, report: dict, lang: str) -> str:
    """
    Build placeholder reply for chat (Phase 2 placeholder).
    
    Args:
        user_message: User's question
        report: Full InfoVerif report
        lang: Response language
    
    Returns:
        Placeholder reply string
    """
    techniques_count = len(report.get("techniques", []))
    claims_count = len(report.get("claims", []))
    
    if lang == "fr":
        return (
            f"La fonctionnalité de chat sera disponible prochainement. "
            f"Pour cette analyse, {techniques_count} technique(s) ont été détectées "
            f"et {claims_count} affirmation(s) ont été analysées. "
            f"Consultez le rapport complet ci-dessus pour plus de détails."
        )
    else:
        return (
            f"Chat functionality coming soon. "
            f"For this analysis, {techniques_count} technique(s) were detected "
            f"and {claims_count} claim(s) were analyzed. "
            f"See the full report above for details."
        )


def extract_citations_from_report(report: dict) -> list[Citation]:
    """
    Extract top techniques as citations.
    
    Args:
        report: Full InfoVerif report
    
    Returns:
        List of Citation objects
    """
    techniques = report.get("techniques", [])
    citations = []
    
    for tech in techniques:
        if tech.get("dima_code") and tech.get("evidence"):
            citations.append(Citation(
                technique=tech["dima_code"],
                evidence=tech["evidence"][:100]  # Truncate evidence
            ))
    
    return citations

