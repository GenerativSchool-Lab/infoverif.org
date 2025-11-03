"""
Pydantic models for Chrome extension endpoints.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Request body for /chat endpoint."""
    analysis_id: str = Field(..., description="UUID from prior /analyze call")
    user_message: str = Field(..., min_length=1, max_length=500, description="User's question")
    lang: str = Field(default="fr", description="Response language (fr or en)")
    stream: bool = Field(default=False, description="Enable streaming response (not yet supported)")


class Citation(BaseModel):
    """Citation of a DIMA technique in chat reply."""
    technique: str = Field(..., description="DIMA code (e.g., TE-58)")
    evidence: str = Field(..., description="Quoted text from analysis")


class ChatResponse(BaseModel):
    """Response body for /chat endpoint."""
    reply: str = Field(..., description="Bot's answer in requested language")
    citations: List[Citation] = Field(default_factory=list, description="Technique citations in reply")
    latency_ms: int = Field(..., description="Backend processing time")
    model_card: str = Field(default="gpt-4o-mini", description="Model used for chat")


class AnalysisCacheEntry(BaseModel):
    """Internal model for cached analysis results."""
    analysis_id: str
    report: dict  # Full InfoVerif report
    timestamp: float  # Unix timestamp (seconds)
    
    def is_expired(self, max_age_seconds: int = 3600) -> bool:
        """Check if cache entry is expired (default: 1 hour)."""
        import time
        return (time.time() - self.timestamp) > max_age_seconds

